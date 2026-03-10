import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from '../../entities/genre.entity';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
  ) {}

  async findAll(): Promise<Genre[]> {
    return this.genreRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Genre> {
    const genre = await this.genreRepo.findOne({ where: { id } });
    if (!genre) throw new NotFoundException(`Genre #${id} not found`);
    return genre;
  }

  async create(name: string): Promise<Genre> {
    const existing = await this.genreRepo.findOne({ where: { name } });
    if (existing) throw new ConflictException(`Genre "${name}" already exists`);

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return this.genreRepo.save(this.genreRepo.create({ name, slug }));
  }

  async remove(id: string): Promise<{ message: string }> {
    const genre = await this.findOne(id);
    await this.genreRepo.remove(genre);
    return { message: `Genre "${genre.name}" deleted` };
  }
}
