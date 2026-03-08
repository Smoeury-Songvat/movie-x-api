import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Movie } from './movie.entity';

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ nullable: true, length: 255 })
  slug!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToMany(() => Movie, (movie) => movie.genres)
  movies!: Movie[];
}
