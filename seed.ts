/**
 * Seed script for ficct_evoting_db.
 * Run from the project root:
 *   npx ts-node seed.ts
 *
 * Prerequisites: ts-node and pg must be available.
 *   npm install --save-dev ts-node @types/node
 *   (pg and bcrypt are already in backend/node_modules — install them here too)
 *   npm install pg bcrypt @types/pg @types/bcrypt
 */

import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

// ── DB connection (mirrors backend/.env) ──────────────────────────────────────
const DB = {
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     Number(process.env.DB_PORT ?? 5432),
  user:     process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME     ?? 'ficct_evoting_db',
};

// ── Seed data ─────────────────────────────────────────────────────────────────

const USERS = [
  {
    ru: 'admin001',
    name: 'Administrador FICCT',
    email: 'admin@ficct.uagrm.edu.bo',
    password: 'Admin1234!',
    career: 'SISTEMAS',
    role: 'ADMIN',
  },
  {
    ru: '216045001',
    name: 'Carlos Mamani Flores',
    email: 'carlos.mamani@est.ficct.uagrm.edu.bo',
    password: 'Estudiante1!',
    career: 'SISTEMAS',
    role: 'ESTUDIANTE',
  },
  {
    ru: '216045002',
    name: 'Laura Torrez Vaca',
    email: 'laura.torrez@est.ficct.uagrm.edu.bo',
    password: 'Estudiante2!',
    career: 'INFORMATICA',
    role: 'ESTUDIANTE',
  },
  {
    ru: '216045003',
    name: 'Diego Suárez Peña',
    email: 'diego.suarez@est.ficct.uagrm.edu.bo',
    password: 'Estudiante3!',
    career: 'REDES',
    role: 'ESTUDIANTE',
  },
  {
    ru: 'doc001',
    name: 'Dra. Ana Roca Medina',
    email: 'ana.roca@ficct.uagrm.edu.bo',
    password: 'Docente1!',
    career: 'SISTEMAS',
    role: 'DOCENTE',
  },
];

interface ElectionSeed {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

// One future election (PROGRAMADA) + one active (ACTIVA)
const now = new Date();
const ELECTIONS: ElectionSeed[] = [
  {
    id: randomUUID(),
    title: 'Elecciones Universitarias FICCT 2025',
    description: 'Proceso electoral para elegir autoridades de la Facultad de Ciencias y Tecnología.',
    startDate: new Date(now.getTime() - 1 * 60 * 60 * 1000),  // started 1h ago
    endDate:   new Date(now.getTime() + 6 * 60 * 60 * 1000),  // ends in 6h
    status: 'ACTIVA',
  },
  {
    id: randomUUID(),
    title: 'Elecciones Representantes Estudiantiles 2025',
    description: 'Elección de delegados estudiantiles por carrera.',
    startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),  // next week
    endDate:   new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
    status: 'PROGRAMADA',
  },
];

interface CandidateSeed {
  electionId: string;
  frontName: string;
  candidateName: string;
  position: string;
  mission: string;
}

const CANDIDATES: CandidateSeed[] = [
  // ── Frente "Progreso FICCT" ────────────────────────────────────────────────
  {
    electionId: ELECTIONS[0].id,
    frontName: 'Progreso FICCT',
    candidateName: 'Ing. Roberto Quispe Arce',
    position: 'DECANO',
    mission: 'Modernización de laboratorios y convenios internacionales.',
  },
  {
    electionId: ELECTIONS[0].id,
    frontName: 'Progreso FICCT',
    candidateName: 'Lic. Sandra Vidal Cruz',
    position: 'DIRECTOR_SISTEMAS',
    mission: 'Actualización del pensum con IA y cloud computing.',
  },
  {
    electionId: ELECTIONS[0].id,
    frontName: 'Progreso FICCT',
    candidateName: 'Ing. Marco Antelo Paz',
    position: 'DIRECTOR_INFORMATICA',
    mission: 'Fortalecimiento de programas de investigación.',
  },
  {
    electionId: ELECTIONS[0].id,
    frontName: 'Progreso FICCT',
    candidateName: 'Lic. Patricia Rojas Méndez',
    position: 'DIRECTOR_REDES',
    mission: 'Ampliación de infraestructura de red y ciberseguridad.',
  },
  // ── Frente "Nueva Visión" ──────────────────────────────────────────────────
  {
    electionId: ELECTIONS[0].id,
    frontName: 'Nueva Visión',
    candidateName: 'Dr. Héctor Flores Ibáñez',
    position: 'DECANO',
    mission: 'Transparencia administrativa y mayor presupuesto estudiantil.',
  },
  {
    electionId: ELECTIONS[0].id,
    frontName: 'Nueva Visión',
    candidateName: 'Ing. Claudia Moreno Soto',
    position: 'DIRECTOR_SISTEMAS',
    mission: 'Becas y pasantías en empresas tecnológicas nacionales.',
  },
  {
    electionId: ELECTIONS[0].id,
    frontName: 'Nueva Visión',
    candidateName: 'Lic. Álvaro Cortez Lima',
    position: 'DIRECTOR_INFORMATICA',
    mission: 'Laboratorios abiertos 24/7 y más tutorías.',
  },
  {
    electionId: ELECTIONS[0].id,
    frontName: 'Nueva Visión',
    candidateName: 'Ing. Valeria Aguilar Navia',
    position: 'DIRECTOR_REDES',
    mission: 'Certificaciones Cisco y AWS para egresados.',
  },
  // ── Segunda elección (PROGRAMADA) — solo candidatos iniciales ─────────────
  {
    electionId: ELECTIONS[1].id,
    frontName: 'Lista A',
    candidateName: 'Estudiante Delegado Sistemas',
    position: 'DIRECTOR_SISTEMAS',
    mission: 'Representar los intereses de la carrera de Sistemas.',
  },
  {
    electionId: ELECTIONS[1].id,
    frontName: 'Lista B',
    candidateName: 'Estudiante Delegado Informática',
    position: 'DIRECTOR_INFORMATICA',
    mission: 'Representar los intereses de la carrera de Informática.',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function userExists(client: Client, ru: string): Promise<boolean> {
  const { rows } = await client.query('SELECT id FROM users WHERE ru = $1', [ru]);
  return rows.length > 0;
}

async function electionExists(client: Client, id: string): Promise<boolean> {
  const { rows } = await client.query('SELECT id FROM elections WHERE id = $1', [id]);
  return rows.length > 0;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  const client = new Client(DB);
  await client.connect();
  console.log(`Connected to ${DB.database}@${DB.host}:${DB.port}\n`);

  try {
    // ── Users ────────────────────────────────────────────────────────────────
    console.log('--- Seeding users ---');
    for (const u of USERS) {
      if (await userExists(client, u.ru)) {
        console.log(`  SKIP  user ru=${u.ru} (already exists)`);
        continue;
      }
      const hash = await bcrypt.hash(u.password, 10);
      await client.query(
        `INSERT INTO users (id, ru, name, email, password_hash, career, role, is_enabled, has_voted)
         VALUES ($1, $2, $3, $4, $5, $6::career_type, $7::role_type, true, false)`,
        [randomUUID(), u.ru, u.name, u.email, hash, u.career, u.role],
      );
      console.log(`  CREATE user ru=${u.ru}  role=${u.role}`);
    }

    // ── Elections ─────────────────────────────────────────────────────────────
    console.log('\n--- Seeding elections ---');
    for (const e of ELECTIONS) {
      if (await electionExists(client, e.id)) {
        console.log(`  SKIP  election "${e.title}" (already exists)`);
        continue;
      }
      await client.query(
        `INSERT INTO elections (id, title, description, start_date, end_date, status)
         VALUES ($1, $2, $3, $4, $5, $6::election_status)`,
        [e.id, e.title, e.description, e.startDate, e.endDate, e.status],
      );
      console.log(`  CREATE election "${e.title}"  status=${e.status}`);
    }

    // ── Candidates ────────────────────────────────────────────────────────────
    console.log('\n--- Seeding candidates ---');
    for (const c of CANDIDATES) {
      const { rows } = await client.query(
        `SELECT id FROM candidates WHERE election_id = $1 AND candidate_name = $2`,
        [c.electionId, c.candidateName],
      );
      if (rows.length > 0) {
        console.log(`  SKIP  candidate "${c.candidateName}" (already exists)`);
        continue;
      }
      await client.query(
        `INSERT INTO candidates (id, election_id, front_name, candidate_name, position, mission)
         VALUES ($1, $2, $3, $4, $5::position_type, $6)`,
        [randomUUID(), c.electionId, c.frontName, c.candidateName, c.position, c.mission],
      );
      console.log(`  CREATE candidate "${c.candidateName}"  pos=${c.position}`);
    }

    console.log('\n✓ Seed completed successfully.\n');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│  Login credentials for the admin panel           │');
    console.log('│                                                   │');
    console.log('│  R.U.:      admin001                              │');
    console.log('│  Password:  Admin1234!                            │');
    console.log('│                                                   │');
    console.log('│  URL: http://localhost:5173/login                 │');
    console.log('└─────────────────────────────────────────────────┘');
  } catch (err) {
    console.error('\n✗ Seed failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
