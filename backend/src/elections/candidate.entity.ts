import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Election } from './election.entity';

export type PositionType =
  | 'DECANO'
  | 'DIRECTOR_SISTEMAS'
  | 'DIRECTOR_INFORMATICA'
  | 'DIRECTOR_REDES';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'front_name', length: 100 })
  frontName: string;

  @Column({ name: 'candidate_name', length: 255 })
  candidateName: string;

  @Column({
    type: 'enum',
    enum: [
      'DECANO',
      'DIRECTOR_SISTEMAS',
      'DIRECTOR_INFORMATICA',
      'DIRECTOR_REDES',
    ],
  })
  position: PositionType;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  mission: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Election, (election) => election.candidates, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'election_id' })
  election: Election;

  @Column({ name: 'election_id', nullable: true })
  electionId: string;
}
