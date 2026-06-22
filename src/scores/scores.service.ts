import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Score } from 'src/entities/score.entity';
import { Repository } from 'typeorm';
import { CreateScoreDto } from './dto/create-score.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';

@Injectable()
export class ScoresService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Score)
    private scoreRepository: Repository<Score>,
  ) { }

  async saveScore(userId: string, scoredto: CreateScoreDto) {
    const year = scoredto.year;
    const scoreData = scoredto.scores;

    // หาข้อมูลเดิมในฐานข้อมูล
    let score = await this.scoreRepository.findOne({
      where: { user: { id: userId }, year },
    });

    if (score) {
      score.data = scoreData; // อัปเดตข้อมูล
    } else {
      score = this.scoreRepository.create({
        year,
        data: scoreData,
        user: { id: userId } as any,
      });
    }

    const savedScore = await this.scoreRepository.save(score);

    // ล้าง Cache (เวอร์ชัน v5+ ใช้ clear() แทน reset())
    try {
      // พยายามล้างแคชเพื่อให้ระบบคำนวณใหม่ทันที
      if (typeof (this.cacheManager as any).clear === 'function') {
        await (this.cacheManager as any).clear();
      } else if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      }
      console.log(`Cache cleared for user: ${userId}`);
    } catch (e) {
      console.warn('Cache clear failed but data was saved:', e.message);
    }

    return savedScore;
  }

  async getScoreByYear(userId: string, year: string) {
    return await this.scoreRepository.findOne({
      where: {
        user: { id: userId },
        year: year,
      },
    });
  }
}
