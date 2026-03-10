import {
  Controller, Get, Post, Delete, Body, Param,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { GenreService } from '../services/genre.service';
import { JwtAuthGuard } from '../../auth/middlewares/jwt-auth.guard';

class CreateGenreDto {
  @IsString() @MaxLength(100)
  name!: string;
}

@ApiTags('Genres')
@Controller('genres')
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @Get()
  @ApiOperation({ summary: 'List all genres (for filter UI)' })
  findAll() {
    return this.genreService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.genreService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create genre' })
  create(@Body() body: CreateGenreDto) {
    return this.genreService.create(body.name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Delete genre' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.genreService.remove(id);
  }
}
