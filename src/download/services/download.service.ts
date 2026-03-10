import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DownloadedMovie, DownloadStatus } from '../../entities/downloaded-movie.entity';
import { Movie } from '../../entities/movie.entity';
import { SubscriptionService } from '../../subscription/services/subscription.service';
import { PlanType } from '../../entities/subscription-plan.entity';
import { InitiateDownloadDto, UpdateDownloadStatusDto } from '../dto/download.dto';
import { StreamQuality } from '../../entities/movie-quality-source.entity';

// Download expiry: 30 days for Standard, 60 days for Premium
const EXPIRY_DAYS: Record<PlanType, number> = {
  [PlanType.BASIC]: 0,
  [PlanType.STANDARD]: 30,
  [PlanType.PREMIUM]: 60,
};

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  constructor(
    @InjectRepository(DownloadedMovie)
    private readonly downloadRepo: Repository<DownloadedMovie>,
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  // ─── INITIATE DOWNLOAD ───────────────────────────────────────────────────────

  async initiateDownload(
    userId: string,
    dto: InitiateDownloadDto,
  ): Promise<DownloadedMovie> {
    // 1. Check plan allows downloads
    const sub = await this.subscriptionService.assertDownloadAccess(userId);

    // 2. Validate requested quality against plan
    const allowedQuality = this.resolveQualityForPlan(
      sub.plan.type,
      dto.quality,
    );

    // 3. Check movie exists
    const movie = await this.movieRepo.findOne({ where: { id: dto.movieId } });
    if (!movie) throw new NotFoundException(`Movie #${dto.movieId} not found`);

    // 4. Check for existing download
    const existing = await this.downloadRepo.findOne({
      where: { userId, movieId: dto.movieId },
    });

    if (existing && existing.status === DownloadStatus.COMPLETED) {
      throw new ConflictException('Movie already downloaded');
    }

    if (existing && existing.status === DownloadStatus.IN_PROGRESS) {
      return existing; // resume instead of re-creating
    }

    // 5. Calculate expiry
    const daysUntilExpiry = EXPIRY_DAYS[sub.plan.type];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysUntilExpiry);

    // 6. Upsert the download record
    const download = existing
      ? Object.assign(existing, {
          status: DownloadStatus.PENDING,
          quality: allowedQuality,
          progressPercent: 0,
          expiresAt,
        })
      : this.downloadRepo.create({
          userId,
          movieId: dto.movieId,
          status: DownloadStatus.PENDING,
          quality: allowedQuality,
          progressPercent: 0,
          expiresAt,
        });

    return this.downloadRepo.save(download);
  }

  // ─── LIST USER DOWNLOADS ─────────────────────────────────────────────────────

  async getUserDownloads(userId: string): Promise<DownloadedMovie[]> {
    return this.downloadRepo.find({
      where: { userId },
      relations: ['movie', 'movie.genres'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── UPDATE DOWNLOAD STATUS (called by mobile client) ───────────────────────

  async updateStatus(
    userId: string,
    downloadId: string,
    dto: UpdateDownloadStatusDto,
  ): Promise<DownloadedMovie> {
    const download = await this.findOneOrThrow(downloadId, userId);

    download.status = dto.status;
    if (dto.progressPercent !== undefined) {
      download.progressPercent = dto.progressPercent;
    }
    if (dto.localFilePath !== undefined) {
      download.localFilePath = dto.localFilePath;
    }
    if (dto.status === DownloadStatus.COMPLETED) {
      download.downloadedAt = new Date();
      download.progressPercent = 100;
    }

    return this.downloadRepo.save(download);
  }

  // ─── DELETE DOWNLOAD ─────────────────────────────────────────────────────────

  async deleteDownload(
    userId: string,
    downloadId: string,
  ): Promise<{ message: string }> {
    const download = await this.findOneOrThrow(downloadId, userId);
    await this.downloadRepo.remove(download);
    return { message: 'Download removed successfully' };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  /**
   * Enforces quality caps per plan:
   * - Standard → max HD_1080P
   * - Premium → all qualities including UHD_4K
   */
  private resolveQualityForPlan(
    planType: PlanType,
    requested: StreamQuality,
  ): StreamQuality {
    if (planType === PlanType.STANDARD && requested === StreamQuality.UHD_4K) {
      this.logger.warn(
        `Standard plan downgraded quality request from 4K to HD`,
      );
      return StreamQuality.HD_1080P;
    }
    return requested;
  }

  private async findOneOrThrow(
    downloadId: string,
    userId: string,
  ): Promise<DownloadedMovie> {
    const dl = await this.downloadRepo.findOne({
      where: { id: downloadId, userId },
    });
    if (!dl) throw new NotFoundException(`Download #${downloadId} not found`);
    return dl;
  }
}
