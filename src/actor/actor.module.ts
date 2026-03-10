import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActorController } from './controllers/actor.controller';
import { ActorService } from './services/actor.service';
import { Actor } from '../entities/actor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Actor])],
  controllers: [ActorController],
  providers: [ActorService],
  exports: [ActorService],
})
export class ActorModule {}
