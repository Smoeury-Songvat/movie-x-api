import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Movie } from './movie.entity';

@Entity('actors')
export class Actor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ name: 'profile_picture_url', nullable: true })
  profilePictureUrl!: string;

  @Column({ type: 'text', nullable: true })
  biography!: string;

  @Column({ name: 'birth_date', nullable: true, type: 'date' })
  birthDate!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToMany(() => Movie, (movie) => movie.actors)
  movies!: Movie[];
}
