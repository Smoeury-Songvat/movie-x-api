import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Movie } from './movie.entity';

export enum StreamQuality {
  SD_720P = 'SD_720P',
  HD_1080P = 'HD_1080P',
  UHD_4K = 'UHD_4K',
}

@Entity('movie_quality_sources')
export class MovieQualitySource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id' })
  movieId!: string;

  @Column({ type: 'enum', enum: StreamQuality })
  quality!: StreamQuality;

  @Column({ name: 'stream_url' })
  streamUrl!: string;

  @Column({ name: 'download_url', nullable: true })
  downloadUrl!: string;

  // File size in MB
  @Column({
    name: 'file_size_mb',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  fileSizeMb!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Movie, (movie) => movie.qualitySources)
  @JoinColumn({ name: 'movie_id' })
  movie!: Movie;
}
