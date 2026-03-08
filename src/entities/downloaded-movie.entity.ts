import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Movie } from './movie.entity';
import { StreamQuality } from './movie-quality-source.entity';

export enum DownloadStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELETED = 'deleted',
}

@Entity('downloaded_movies')
export class DownloadedMovie {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'movie_id' })
  movieId!: string;

  @Column({
    type: 'enum',
    enum: DownloadStatus,
    default: DownloadStatus.PENDING,
  })
  status!: DownloadStatus;

  @Column({ type: 'enum', enum: StreamQuality })
  quality!: StreamQuality;

  // Progress 0–100
  @Column({ name: 'progress_percent', type: 'smallint', default: 0 })
  progressPercent!: number;

  // Local device file path reference (managed by mobile client)
  @Column({ name: 'local_file_path', nullable: true })
  localFilePath!: string;

  @Column({
    name: 'file_size_mb',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  fileSizeMb!: number;

  @Column({ name: 'downloaded_at', nullable: true, type: 'timestamptz' })
  downloadedAt!: Date;

  @Column({ name: 'expires_at', nullable: true, type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.downloadedMovies)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Movie, (movie) => movie.downloadedBy)
  @JoinColumn({ name: 'movie_id' })
  movie!: Movie;
}
