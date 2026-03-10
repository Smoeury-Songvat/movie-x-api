import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActorService } from '../services/actor.service';
import { CreateActorDto, UpdateActorDto } from '../dto/actor.dto';
import { JwtAuthGuard } from '../../auth/middlewares/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Actors')
@Controller('actors')
export class ActorController {
  constructor(private readonly actorService: ActorService) {}

  @Get()
  @ApiOperation({ summary: 'List all actors' })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.actorService.findAll(pagination, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get actor with their movies' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.actorService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create actor' })
  create(@Body() dto: CreateActorDto) {
    return this.actorService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update actor' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActorDto,
  ) {
    return this.actorService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Delete actor' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.actorService.remove(id);
  }
}
