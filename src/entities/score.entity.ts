import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Score {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  year: string;

  @Column('jsonb')
  data: Record<string, number>; // { "TGAT": "75.5", ... }

  @ManyToOne(() => User, (user) => user.scores)
  user: User;
}