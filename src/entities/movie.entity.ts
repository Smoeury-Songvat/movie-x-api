import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Genre } from './genre.entity';
import { Actor } from './actor.entity';
import { DownloadedMovie } from './downloaded-movie.entity';
import { MovieQualitySource } from './movie-quality-source.entity';

export enum MovieAccessLevel {
  LIMITED = 'limited', // Basic plan only
  FULL = 'full', // Standard and above
}

export enum RatingSource {
  IMDB = 'IMDB',
  ROTTEN_TOMATOES = 'ROTTEN_TOMATOES',
  METACRITIC = 'METACRITIC',
}

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  synopsis!: string;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl!: string;

  @Column({ name: 'trailer_url', nullable: true })
  trailerUrl!: string;

  @Column({ name: 'release_date', type: 'date', nullable: true })
  releaseDate!: Date;

  // Duration in seconds for precision
  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds!: number;

  @Column({
    name: 'rating_score',
    type: 'numeric',
    precision: 3,
    scale: 1,
    nullable: true,
  })
  ratingScore!: number;

  @Column({
    name: 'rating_source',
    type: 'enum',
    enum: RatingSource,
    nullable: true,
  })
  ratingSource!: RatingSource;

  @Column({
    name: 'access_level',
    type: 'enum',
    enum: MovieAccessLevel,
    default: MovieAccessLevel.FULL,
  })
  accessLevel!: MovieAccessLevel;

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;

  @Column({ name: 'view_count', default: 0 })
  viewCount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relations
  @ManyToMany(() => Genre, (genre) => genre.movies, { eager: true })
  @JoinTable({
    name: 'movie_genres',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres!: Genre[];

  @ManyToMany(() => Actor, (actor) => actor.movies, { eager: true })
  @JoinTable({
    name: 'movie_actors',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'actor_id', referencedColumnName: 'id' },
  })
  actors!: Actor[];

  @OneToMany(() => MovieQualitySource, (qs) => qs.movie, { eager: true })
  qualitySources!: MovieQualitySource[];

  @OneToMany(() => DownloadedMovie, (dm) => dm.movie)
  downloadedBy!: DownloadedMovie[];
}
