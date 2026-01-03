import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoresService } from './scores.service';
import { ScoresController } from './scores.controller';
import { Score } from '../entities/score.entity';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register(), TypeOrmModule.forFeature([Score])],
  controllers: [ScoresController],
  providers: [ScoresService],
  exports: [ScoresService],
})
export class ScoresModule { }
