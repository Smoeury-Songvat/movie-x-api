import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DownloadService } from '../services/download.service';
import { InitiateDownloadDto, UpdateDownloadStatusDto } from '../dto/download.dto';
import { JwtAuthGuard } from '../../auth/middlewares/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('Downloads')
@Controller('downloads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get()
  @ApiOperation({ summary: 'List all downloads for current user' })
  getMyDownloads(@CurrentUser() user: User) {
    return this.downloadService.getUserDownloads(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Initiate a movie download (Standard/Premium only)' })
  initiateDownload(
    @CurrentUser() user: User,
    @Body() dto: InitiateDownloadDto,
  ) {
    return this.downloadService.initiateDownload(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update download status (paused, completed, etc.)' })
  updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDownloadStatusDto,
  ) {
    return this.downloadService.updateStatus(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a downloaded movie' })
  deleteDownload(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.downloadService.deleteDownload(user.id, id);
  }
}
