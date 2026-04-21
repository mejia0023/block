import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Candidate } from './candidate.entity';

export type ElectionStatus = 'PROGRAMADA' | 'ACTIVA' | 'CERRADA' | 'ESCRUTADA';

@Entity('elections')
@Check('"end_date" > "start_date"')
export class Election {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamptz' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ['PROGRAMADA', 'ACTIVA', 'CERRADA', 'ESCRUTADA'],
    default: 'PROGRAMADA',
  })
  status: ElectionStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Candidate, (candidate) => candidate.election, {
    cascade: true,
  })
  candidates: Candidate[];
}
