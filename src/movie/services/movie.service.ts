import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Movie, MovieAccessLevel } from '../../entities/movie.entity';
import { Genre } from '../../entities/genre.entity';
import { Actor } from '../../entities/actor.entity';
import { User } from '../../entities/user.entity';
import { UserSubscription } from '../../entities/user-subscription.entity';
import { SubscriptionStatus } from '../../entities/user-subscription.entity';
import { PlanType } from '../../entities/subscription-plan.entity';
import {
  CreateMovieDto,
  UpdateMovieDto,
  MovieFilterDto,
} from '../dto/movie.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

@Injectable()
export class MovieService {
  private readonly logger = new Logger(MovieService.name);

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
    @InjectRepository(Actor)
    private readonly actorRepo: Repository<Actor>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepo: Repository<UserSubscription>,
  ) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  async create(dto: CreateMovieDto): Promise<Movie> {
    const movie = this.movieRepo.create({
      title: dto.title,
      synopsis: dto.synopsis,
      thumbnailUrl: dto.thumbnailUrl,
      trailerUrl: dto.trailerUrl,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      durationSeconds: dto.durationSeconds,
      ratingScore: dto.ratingScore,
      ratingSource: dto.ratingSource,
      accessLevel: dto.accessLevel ?? MovieAccessLevel.FULL,
      isPublished: dto.isPublished ?? false,
    });

    if (dto.genreIds?.length) {
      movie.genres = await this.genreRepo.findByIds(dto.genreIds);
    }
    if (dto.actorIds?.length) {
      movie.actors = await this.actorRepo.findByIds(dto.actorIds);
    }

    return this.movieRepo.save(movie);
  }

  // ─── FIND ALL (with search + filter) ─────────────────────────────────────────

  async findAll(
    filter: MovieFilterDto,
    user?: User,
  ): Promise<PaginatedResponse<Movie>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filter;
    const skip = (page - 1) * limit;

    const qb = this.buildFilterQuery(filter);

    // Enforce plan-based access: Basic users cannot see FULL library movies
    const subscription = user
      ? await this.getUserActiveSubscription(user.id)
      : null;

    if (!subscription || subscription.plan.type === PlanType.BASIC) {
      // Basic or unauthenticated: only LIMITED access movies
      qb.andWhere('movie.access_level = :level', {
        level: MovieAccessLevel.LIMITED,
      });
    }

    // Allowed sort columns (prevent SQL injection via dynamic column)
    const allowedSort: Record<string, string> = {
      title: 'movie.title',
      releaseDate: 'movie.releaseDate',
      ratingScore: 'movie.ratingScore',
      viewCount: 'movie.viewCount',
      createdAt: 'movie.createdAt',
    };

    const orderColumn = allowedSort[sortBy] ?? 'movie.createdAt';

    const order = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(orderColumn, order).skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponse(data, total, page, limit);
  }

  // ─── FIND BY CATEGORY (genre) ─────────────────────────────────────────────────

  async findByCategory(
    genreId: string,
    filter: MovieFilterDto,
    user?: User,
  ): Promise<PaginatedResponse<Movie>> {
    return this.findAll({ ...filter, genreId }, user);
  }

  // ─── FIND ONE ────────────────────────────────────────────────────────────────

  async findOne(id: string, user?: User): Promise<Movie> {
    const movie = await this.movieRepo.findOne({
      where: { id },
      relations: ['genres', 'actors', 'qualitySources'],
    });

    if (!movie) throw new NotFoundException(`Movie #${id} not found`);
    if (!movie.isPublished) {
      // Only admins can view unpublished — handled at controller level
    }

    // Enforce access level
    await this.assertMovieAccessible(movie, user);

    // Increment view count (fire and forget)
    this.movieRepo.increment({ id }, 'viewCount', 1).catch(() => {});

    return movie;
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.findOneOrThrow(id);

    Object.assign(movie, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.synopsis !== undefined && { synopsis: dto.synopsis }),
      ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl }),
      ...(dto.trailerUrl !== undefined && { trailerUrl: dto.trailerUrl }),
      ...(dto.releaseDate !== undefined && {
        releaseDate: new Date(dto.releaseDate),
      }),
      ...(dto.durationSeconds !== undefined && {
        durationSeconds: dto.durationSeconds,
      }),
      ...(dto.ratingScore !== undefined && { ratingScore: dto.ratingScore }),
      ...(dto.ratingSource !== undefined && { ratingSource: dto.ratingSource }),
      ...(dto.accessLevel !== undefined && { accessLevel: dto.accessLevel }),
      ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
    });

    if (dto.genreIds !== undefined) {
      movie.genres = await this.genreRepo.findByIds(dto.genreIds);
    }
    if (dto.actorIds !== undefined) {
      movie.actors = await this.actorRepo.findByIds(dto.actorIds);
    }

    return this.movieRepo.save(movie);
  }

  // ─── REMOVE ──────────────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ message: string }> {
    const movie = await this.findOneOrThrow(id);
    await this.movieRepo.remove(movie);
    return { message: `Movie "${movie.title}" deleted successfully` };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private buildFilterQuery(filter: MovieFilterDto): SelectQueryBuilder<Movie> {
    const qb = this.movieRepo
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.genres', 'genre')
      .leftJoinAndSelect('movie.actors', 'actor')
      .leftJoinAndSelect('movie.qualitySources', 'qualitySource');

    if (filter.publishedOnly !== false) {
      qb.andWhere('movie.is_published = true');
    }

    if (filter.search) {
      // Use PostgreSQL full-text search
      qb.andWhere(
        `to_tsvector('english', movie.title || ' ' || COALESCE(movie.synopsis, '')) @@ plainto_tsquery('english', :search)`,
        { search: filter.search },
      );
    }

    if (filter.genreId) {
      qb.andWhere('genre.id = :genreId', { genreId: filter.genreId });
    }

    if (filter.genreSlug) {
      qb.andWhere('genre.slug = :genreSlug', { genreSlug: filter.genreSlug });
    }

    if (filter.accessLevel) {
      qb.andWhere('movie.access_level = :accessLevel', {
        accessLevel: filter.accessLevel,
      });
    }

    return qb;
  }

  private async assertMovieAccessible(
    movie: Movie,
    user?: User,
  ): Promise<void> {
    if (movie.accessLevel === MovieAccessLevel.LIMITED) return; // always accessible

    const subscription = user
      ? await this.getUserActiveSubscription(user.id)
      : null;

    const hasAccess =
      subscription &&
      subscription.status === SubscriptionStatus.ACTIVE &&
      [PlanType.STANDARD, PlanType.PREMIUM].includes(subscription.plan.type);

    if (!hasAccess) {
      throw new ForbiddenException(
        'This movie requires a Standard or Premium subscription',
      );
    }
  }

  async getUserActiveSubscription(
    userId: string,
  ): Promise<UserSubscription | null> {
    return this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
  }

  private async findOneOrThrow(id: string): Promise<Movie> {
    const movie = await this.movieRepo.findOne({
      where: { id },
      relations: ['genres', 'actors'],
    });
    if (!movie) throw new NotFoundException(`Movie #${id} not found`);
    return movie;
  }
}
