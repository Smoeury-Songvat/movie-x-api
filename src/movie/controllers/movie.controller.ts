import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiResponse,
} from '@nestjs/swagger';

import { MovieService } from '../services/movie.service';
import { CreateMovieDto, UpdateMovieDto, MovieFilterDto } from '../dto/movie.dto';
import { JwtAuthGuard } from '../../auth/middlewares/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('Movies')
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  // ─── GET /movies ─────────────────────────────────────────────────────────────
  // Public endpoint — plan gating applied inside service
  @Get()
  @ApiOperation({ summary: 'List movies with search & filters' })
  @ApiResponse({ status: 200, description: 'Paginated movie list' })
  findAll(
    @Query() filter: MovieFilterDto,
    @CurrentUser() user?: User,
  ) {
    return this.movieService.findAll(filter, user);
  }

  // ─── GET /movies/category/:genreId ───────────────────────────────────────────
  @Get('category/:genreId')
  @ApiOperation({ summary: 'Filter movies by category (genre UUID)' })
  findByCategory(
    @Param('genreId', ParseUUIDPipe) genreId: string,
    @Query() filter: MovieFilterDto,
    @CurrentUser() user?: User,
  ) {
    return this.movieService.findByCategory(genreId, filter, user);
  }

  // ─── GET /movies/:id ─────────────────────────────────────────────────────────
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full movie detail (auth required for FULL access movies)' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.movieService.findOne(id, user);
  }

  // ─── POST /movies ─────────────────────────────────────────────────────────────
  // Admin only — add role guard in production
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create a new movie' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateMovieDto) {
    return this.movieService.create(dto);
  }

  // ─── PATCH /movies/:id ───────────────────────────────────────────────────────
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update movie' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMovieDto,
  ) {
    return this.movieService.update(id, dto);
  }

  // ─── DELETE /movies/:id ──────────────────────────────────────────────────────
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Delete movie' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.movieService.remove(id);
  }
}