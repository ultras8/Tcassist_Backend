import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, LessThan } from 'typeorm';
import { Admission } from '../entities/admission.entity';
import { Score } from '../entities/score.entity';
import { AdmissionStat } from '../entities/admission-stat.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, map } from 'rxjs';
import { RankSelectionDto } from './dto/rank-selection.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';

export interface CalculationResult {
  year: string;
  programName: string;
  facultyName: string;
  universityName: string;
  totalScore: number;
  isPassedCriteria: boolean;
  failedSubjects: string[];
  breakdown: Record<string, any>;
  risk?: any;
  recommendation?: string;
  lastYearMinScore?: number;
}

@Injectable()
export class CalculatorService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly httpService: HttpService,
    @InjectRepository(Admission)
    private admissionRepository: Repository<Admission>,
    @InjectRepository(Score) private scoreRepository: Repository<Score>,
    @InjectRepository(AdmissionStat)
    private scoreHistoryRepository: Repository<AdmissionStat>,
  ) { }

  private processCalculationLogic(
    criteria: any,
    userScores: any,
    year: string,
    lastYearMinScore: number = 0,
  ): CalculationResult {
    let totalScore = 0;
    const weights = criteria.scoreWeights || {};
    const minScores = criteria.minScores || {};
    const failedSubjects: string[] = [];
    const breakdown: Record<string, any> = {};
    let isPassedCriteria = true;

    const normalize = (text: string) =>
      text.replace(/\s+/g, '').replace(/[()]/g, '').toLowerCase();

    const normalizedUserScores: Record<string, number> = {};
    Object.entries(userScores || {}).forEach(([k, v]) => {
      normalizedUserScores[normalize(k)] = parseFloat(v as string) || 0;
    });

    const getScore = (criteriaKey: string): number => {
      const cleanCriteriaKey = normalize(criteriaKey);

      // รวมคะแนน TGAT (1+2+3)
      const isTGATSum =
        (cleanCriteriaKey.includes('tgat') ||
          cleanCriteriaKey.includes('ความถนัดทั่วไป')) &&
        !cleanCriteriaKey.match(/[1-3]$/);
      if (isTGATSum || cleanCriteriaKey === '90') {
        const t1 =
          normalizedUserScores[normalize('TGAT1 การสื่อสารภาษาอังกฤษ')] ||
          normalizedUserScores['tgat1'] ||
          0;
        const t2 =
          normalizedUserScores[normalize('TGAT2 การคิดอย่างมีเหตุผล')] ||
          normalizedUserScores['tgat2'] ||
          0;
        const t3 =
          normalizedUserScores[normalize('TGAT3 สมรรถนะการทำงาน')] ||
          normalizedUserScores['tgat3'] ||
          0;
        return t1 + t2 + t3; // Return 0-300
      }

      if (normalizedUserScores[cleanCriteriaKey] !== undefined)
        return normalizedUserScores[cleanCriteriaKey];

      const crossMap: Record<string, string[]> = {
        ไทย: ['ภาษาไทย', 'alevel_tha', 'tha'],
        อังกฤษ: ['ภาษาอังกฤษ', 'alevel_eng', 'eng'],
        สังคม: ['สังคมศึกษา', 'alevel_soc', 'soc'],
        คณิต1: ['คณิตศาสตร์ประยุกต์1', 'alevel_math1', 'math1'],
        คณิต2: ['คณิตศาสตร์ประยุกต์2', 'alevel_math2', 'math2'],
        วิทย์: ['วิทยาศาสตร์ประยุกต์', 'alevel_sci', 'sci'],
        ชีววิทยา: ['ชีววิทยา', 'alevel_bio', 'bio'],
        tpat3: ['tpat3วิศวะวิทยา', 'tpat3'],
        gpax: ['gpaxเฉลี่ยสะสม', 'เกรดเฉลี่ย', 'gpax'],
      };

      for (const [standardName, aliases] of Object.entries(crossMap)) {
        if (
          cleanCriteriaKey.includes(normalize(standardName)) ||
          aliases.some((a) => cleanCriteriaKey.includes(normalize(a)))
        ) {
          for (const alias of aliases) {
            if (normalizedUserScores[normalize(alias)] !== undefined)
              return normalizedUserScores[normalize(alias)];
          }
        }
      }

      const fuzzyKey = Object.keys(normalizedUserScores).find(
        (uk) => uk.includes(cleanCriteriaKey) || cleanCriteriaKey.includes(uk),
      );
      return fuzzyKey ? normalizedUserScores[fuzzyKey] : 0;
    };

    // --- เริ่มการคำนวณคะแนนรวม ---
    const subjects = Object.entries(weights);

    // ป้องกันน้ำหนักรวมเกิน 100 (เช่น 100 + 100)
    const weightValues = Object.values(weights) as any[];
    const totalWeightSum: number =
      weightValues.length > 0
        ? weightValues.reduce(
          (sum: number, w: any) => sum + (Number(w) || 0),
          0,
        )
        : 100;

    for (const [subjectName, weight] of subjects) {
      const weightValue = weight as number;
      let score = getScore(subjectName);

      // ปรับฐานคะแนนให้เป็น 0-100 เสมอ
      if (subjectName.toLowerCase().includes('gpax')) {
        if (score <= 4) score = (score / 4) * 100;
      } else {
        if (score > 100) score = score / 3; // ปรับ 300 -> 100
      }

      if (score === 0 && !failedSubjects.includes(subjectName)) {
        failedSubjects.push(subjectName);
      }

      if (minScores[subjectName] && score < minScores[subjectName]) {
        isPassedCriteria = false;
        if (!failedSubjects.includes(subjectName))
          failedSubjects.push(subjectName);
      }

      // คำนวณตามสัดส่วน Weight จริงเทียบกับผลรวมทั้งหมด
      const calculatedPart = score * (weightValue / (totalWeightSum as number));
      totalScore += calculatedPart;

      breakdown[subjectName] = {
        rawScore: parseFloat(score.toFixed(2)),
        weight: weightValue,
        calculated: parseFloat(calculatedPart.toFixed(4)),
      };
    }

    // --- สร้างคำแนะนำ ---
    let recommendation = '';
    const gap = lastYearMinScore - totalScore;

    if (lastYearMinScore > 0) {
      if (gap > 0) {
        const potentialSubjects = Object.entries(weights)
          .map(([name, weight]) => ({
            name,
            weight: ((weight as number) / (totalWeightSum as number)) * 100,
            currentRaw: breakdown[name]?.rawScore || 0,
            roomToGrow: 100 - (breakdown[name]?.rawScore || 0),
          }))
          .filter((s) => s.roomToGrow > 0)
          .sort((a, b) => b.weight - a.weight);

        if (potentialSubjects.length > 0) {
          const bestSubject = potentialSubjects[0];
          const neededRaw = Math.ceil(gap / (bestSubject.weight / 100));
          if (neededRaw <= bestSubject.roomToGrow) {
            recommendation = `ขาดอีก ${gap.toFixed(2)} คะแนนจะเท่ากับปีล่าสุด ลองเน้นเก็บวิชา "${bestSubject.name}" เพิ่มอีกสัก ${neededRaw} คะแนน จะมีลุ้นมากค่ะ!`;
          } else {
            recommendation = `คะแนนห่างจากปีล่าสุด ${gap.toFixed(2)} คะแนน แนะนำให้เร่งทำคะแนนในกลุ่มวิชาหลักให้ได้มากที่สุดนะคะ`;
          }
        }
      } else {
        recommendation = `ยินดีด้วย! คะแนนคุณสูงกว่าคะแนนต่ำสุดปีล่าสุด (${Math.abs(gap).toFixed(2)} คะแนน) มีโอกาสสอบติดสูงมาก รักษามาตรฐานไว้นะคะ!`;
      }
    } else {
      recommendation =
        'ไม่พบสถิติปีก่อนหน้า แนะนำให้ทำให้เต็มที่ในทุกวิชาเพื่อความปลอดภัยค่ะ';
    }

    return {
      year,
      programName: this.cleanMajorName(criteria.majorName),
      facultyName: criteria.facultyName,
      universityName: criteria.university?.fullName || 'ไม่ระบุ',
      totalScore: parseFloat(totalScore.toFixed(4)),
      isPassedCriteria,
      failedSubjects,
      breakdown,
      recommendation,
      lastYearMinScore,
    };
  }

  // --- Dropdown & Search Methods (Cleaned up) ---
  async getAllUniversities() {
    return await this.admissionRepository
      .createQueryBuilder('admission')
      .leftJoinAndSelect('admission.university', 'university')
      .select(['university.id AS id', 'university.fullName AS name'])
      .distinct(true)
      .orderBy('university.fullName', 'ASC')
      .getRawMany();
  }

  async getAllUniqueMajors(year: string) {
    const rawMajors = await this.admissionRepository
      .createQueryBuilder('admission')
      .select('admission.majorName', 'majorName')
      .where('admission.year = :year', { year: parseInt(year) })
      .distinct(true)
      .orderBy('admission.majorName', 'ASC')
      .getRawMany();

    const seen = new Set<string>();
    return rawMajors
      .map((i) => {
        let name = i.majorName;

        // ดักจัดการเคส "วิศวกรรมทั่วไป" ของ มทส.
        if (name.includes('วิศวกรรมทั่วไป') && name.includes('ประกอบด้วย')) {
          name = 'วิศวกรรมทั่วไป';
        } else {
          // ตัดวงเล็บและคำฟุ่มเฟือย
          name = name
            .replace(/\s*\(.*?\)\s*/g, '')
            .replace(/สาขาวิชา|หลักสูตร|วิชาเอก/g, '')
            .trim();
          name = name.replace(/[()]/g, '').trim();
        }

        // Normalization
        if (name.includes('การคอม') || name === 'วิทยาการคอม')
          name = 'วิทยาการคอมพิวเตอร์';
        if (name.includes('รัฐศาสตร์') && !name.includes('รัฐประศาสนศาสตร์'))
          name = 'รัฐศาสตร์';
        if (
          name.includes('การจัดการ') &&
          name.includes('ท่องเที่ยว') &&
          name.includes('บริการ')
        )
          name = 'การจัดการการท่องเที่ยวและบริการ';
        if (name.includes('การจัดการ') && name.includes('โรงแรม'))
          name = 'การจัดการการท่องเที่ยวและการโรงแรม';
        if (name.startsWith('เกษตรศาสตร์')) {
          if (name.includes('กีฏวิทยา')) name = 'เกษตรศาสตร์ (กีฏวิทยา)';
          else if (name.includes('โรคพืช')) name = 'เกษตรศาสตร์ (โรคพืช)';
          else name = 'เกษตรศาสตร์';
        }
        return name;
      })
      .filter((name) => {
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .sort((a, b) => a.localeCompare(b, 'th'));
  }

  async getProgramsByUniversity(universityId: number, year: string) {
    const programs = await this.admissionRepository.find({
      where: { universityId, year: parseInt(year) },
    });
    return programs.map((p) => ({
      programCode: p.programCode,
      displayName: `${p.majorName} (${p.facultyName})`,
    }));
  }

  async searchPrograms(query: string, year: string) {
    const qb = this.admissionRepository
      .createQueryBuilder('admission')
      .leftJoinAndSelect('admission.university', 'university')
      .where('admission.year = :year', { year: parseInt(year) });
    if (query) {
      qb.andWhere(
        '(admission.majorName ILIKE :query OR admission.facultyName ILIKE :query OR university.fullName ILIKE :query)',
        { query: `%${query}%` },
      );
    }
    return await qb
      .select([
        'admission.programCode AS code',
        'admission.majorName AS major',
        'admission.facultyName AS faculty',
        'university.fullName AS universityName',
        'university.logoUrl AS logo',
      ])
      .limit(20)
      .getRawMany();
  }

  async getRiskAnalysis(
    programCode: string,
    userScore: number,
    currentYear: string,
  ) {
    try {
      const yearInt = parseInt(currentYear);
      const allHistory = await this.scoreHistoryRepository.find({
        where: { programCode, year: LessThan(yearInt) },
        order: { year: 'ASC' },
      });
      if (!allHistory.length)
        return {
          status: 'Unknown',
          color: 'Gray',
          message: 'ไม่มีสถิติปีเก่า',
        };

      const response = await firstValueFrom(
        this.httpService
          .post('http://localhost:8000/analyze-advanced-risk', {
            userScore,
            historyData: allHistory,
          })
          .pipe(map((res) => res.data)),
      );
      return response;
    } catch {
      return { status: 'Error', color: 'Gray', message: 'AI Server Offline' };
    }
  }

  private cleanMajorName(name: string): string {
    // ดักเคส มทส.
    if (name.includes('วิศวกรรมทั่วไป') && name.includes('ประกอบด้วย')) {
      return 'วิศวกรรมทั่วไป';
    }
    // ตัดวงเล็บและคำฟุ่มเฟือยออกเหมือนใน Dropdown
    const cleanName = name
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/สาขาวิชา|หลักสูตร|วิชาเอก/g, '')
      .trim();
    return cleanName.replace(/[()]/g, '').trim();
  }

  // --- Calculation Execution Methods ---
  async calculateAdmissionScore(
    userId: string,
    programCode: string,
    year: string,
  ): Promise<CalculationResult> {
    const cacheKey = `calc:${userId}:${programCode}:${year}`;
    const cachedData = await this.cacheManager.get<CalculationResult>(cacheKey);
    if (cachedData) return cachedData;

    const criteria = await this.admissionRepository.findOne({
      where: { programCode, year: parseInt(year) },
      relations: ['university'],
    });

    const userScoreRecord = await this.scoreRepository.findOne({
      where: { user: { id: userId }, year: year },
    });

    if (!criteria || !userScoreRecord)
      throw new NotFoundException(`ไม่พบข้อมูลสำหรับปี ${year}`);

    const lastStat = await this.scoreHistoryRepository.findOne({
      where: { programCode, year: LessThan(parseInt(year)) },
      order: { year: 'DESC' },
    });

    const calculation = this.processCalculationLogic(
      criteria,
      userScoreRecord.data || {},
      year,
      lastStat?.minScore || 0,
    );
    calculation.risk = await this.getRiskAnalysis(
      programCode,
      calculation.totalScore,
      year,
    );

    await this.cacheManager.set(cacheKey, calculation, 600 * 1000);
    return calculation;
  }

  async calculateByUniversity(
    userId: string,
    universityId: number,
    year: string,
    page: number = 1,
    limit: number = 5,
  ) {
    // ดึงทุกคณะในมหาลัยนั้นของปีที่เลือก
    const programs = await this.admissionRepository.find({
      where: { universityId, year: parseInt(year) },
      relations: ['university'],
    });

    const userScoreRecord = await this.scoreRepository.findOne({
      where: { user: { id: userId }, year: year },
    });

    // คำนวณคะแนนทีละคณะ
    let results = await Promise.all(
      programs.map(async (p) => {
        try {
          const lastStat = await this.scoreHistoryRepository.findOne({
            where: {
              programCode: p.programCode,
              year: LessThan(parseInt(year)),
            },
            order: { year: 'DESC' },
          });
          return this.processCalculationLogic(
            p,
            userScoreRecord?.data || {},
            year,
            lastStat?.minScore || 0,
          );
        } catch (err) {
          console.error(`Error calculating for ${p.programCode}:`, err);
          return null;
        }
      }),
    );

    // กรองค่า null และเรียงลำดับคะแนนจากมากไปน้อย
    results = results
      .filter((r) => r !== null)
      .sort((a, b) => (b?.totalScore || 0) - (a?.totalScore || 0));

    // ทำ Pagination
    const offset = (page - 1) * limit;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      data: paginatedResults,
      total: results.length,
    };
  }

  async calculateByMajorName(
    userId: string,
    majorName: string,
    year: string,
    page: number = 1,
    limit: number = 5,
  ) {
    const [programs] = await this.admissionRepository.findAndCount({
      where: { majorName: ILike(`%${majorName}%`), year: parseInt(year) },
      relations: ['university'],
    });

    const userScoreRecord = await this.scoreRepository.findOne({
      where: { user: { id: userId }, year: year },
    });

    let results = await Promise.all(
      programs.map(async (p) => {
        try {
          const lastStat = await this.scoreHistoryRepository.findOne({
            where: {
              programCode: p.programCode,
              year: LessThan(parseInt(year)),
            },
            order: { year: 'DESC' },
          });
          return this.processCalculationLogic(
            p,
            userScoreRecord?.data || {},
            year,
            lastStat?.minScore || 0,
          );
        } catch {
          return null;
        }
      }),
    );

    results = results
      .filter((r) => r !== null)
      .sort((a, b) => b.totalScore - a.totalScore);
    const offset = (page - 1) * limit;
    return {
      data: results.slice(offset, offset + limit),
      total: results.length,
    };
  }

  async calculateMyRankings(
    userId: string,
    dto: RankSelectionDto,
  ): Promise<any[]> {
    const { programCodes, year } = dto;
    const results = await Promise.all(
      (Array.isArray(programCodes) ? programCodes : []).map(async (code) => {
        try {
          return await this.calculateAdmissionScore(userId, code, year);
        } catch {
          return null;
        }
      }),
    );
    return results.filter((r) => r !== null);
  }
}
