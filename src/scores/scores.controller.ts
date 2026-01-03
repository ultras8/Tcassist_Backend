import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
} from '@nestjs/common';
import { ScoresService } from './scores.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../entities/user.entity';

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async save(@Request() req, @Body() createScoreDto: CreateScoreDto) {
    const user = req.user as User;
    const userId: string = user.id;

    return this.scoresService.saveScore(userId, createScoreDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':year')
  async findOne(@Request() req, @Param('year') year: string) {
    const user = req.user as User;
    const userId: string = user.id;

    return this.scoresService.getScoreByYear(userId, year);
  }
}
