import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type CareerType = 'SISTEMAS' | 'INFORMATICA' | 'REDES';
export type RoleType = 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  ru: string;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: ['SISTEMAS', 'INFORMATICA', 'REDES'] })
  career: CareerType;

  @Column({ type: 'enum', enum: ['ESTUDIANTE', 'DOCENTE', 'ADMIN'] })
  role: RoleType;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Column({ name: 'has_voted', default: false })
  hasVoted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
