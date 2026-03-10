import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Actor } from '../../entities/actor.entity';
import { CreateActorDto, UpdateActorDto } from '../dto/actor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(Actor)
    private readonly actorRepo: Repository<Actor>,
  ) {}

  async create(dto: CreateActorDto): Promise<Actor> {
    const actor = this.actorRepo.create({
      name: dto.name,
      profilePictureUrl: dto.profilePictureUrl,
      biography: dto.biography,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
    });
    return this.actorRepo.save(actor);
  }

  async findAll(
    pagination: PaginationDto,
    search?: string,
  ): Promise<PaginatedResponse<Actor>> {
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await this.actorRepo.findAndCount({
      where: search ? { name: ILike(`%${search}%`) } : {},
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string): Promise<Actor> {
    const actor = await this.actorRepo.findOne({
      where: { id },
      relations: ['movies'],
    });
    if (!actor) throw new NotFoundException(`Actor #${id} not found`);
    return actor;
  }

  async update(id: string, dto: UpdateActorDto): Promise<Actor> {
    const actor = await this.findOne(id);
    Object.assign(actor, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.profilePictureUrl !== undefined && { profilePictureUrl: dto.profilePictureUrl }),
      ...(dto.biography !== undefined && { biography: dto.biography }),
      ...(dto.birthDate !== undefined && { birthDate: new Date(dto.birthDate) }),
    });
    return this.actorRepo.save(actor);
  }

  async remove(id: string): Promise<{ message: string }> {
    const actor = await this.findOne(id);
    await this.actorRepo.remove(actor);
    return { message: `Actor "${actor.name}" deleted` };
  }
}
