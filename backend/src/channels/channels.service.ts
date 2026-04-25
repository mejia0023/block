import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import { DatabaseService } from '../database/database.service';
import { CreateChannelDto } from './dto/create-channel.dto';

const execAsync = promisify(exec);

export interface FabricChannel {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creadoEn: Date;
}

@Injectable()
export class ChannelsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<FabricChannel[]> {
    const { rows } = await this.db.query<any>(
      `SELECT id, nombre, descripcion, activo, creado_en
       FROM canales_fabric
       ORDER BY creado_en ASC`,
    );
    return rows.map(this.map);
  }

  async createChannel(dto: CreateChannelDto): Promise<{ channel: FabricChannel; logs: string }> {
    const scriptPath = path.resolve(
      __dirname,
      '../../../fabric/network/scripts/create-channel.sh',
    );
    const wslScript = scriptPath
      .replace(/\\/g, '/')
      .replace(/^([A-Za-z]):/, (_m, d) => `/mnt/${d.toLowerCase()}`);

    const cmd = `wsl bash "${wslScript}" "${dto.nombre}"`;

    let stdout = '';
    let stderr = '';
    try {
      ({ stdout, stderr } = await execAsync(cmd, { timeout: 120_000 }));
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Creación de canal falló: ${err.message}\n${err.stderr ?? ''}`,
      );
    }

    if (!stdout.includes('CHANNEL_SUCCESS=true')) {
      throw new InternalServerErrorException(
        `Script no indicó éxito.\n${stdout}\n${stderr}`,
      );
    }

    const { rows } = await this.db.query<any>(
      `INSERT INTO canales_fabric (nombre, descripcion)
       VALUES ($1, $2)
       ON CONFLICT (nombre) DO UPDATE SET activo = true
       RETURNING *`,
      [dto.nombre, dto.descripcion ?? null],
    );

    return {
      channel: this.map(rows[0]),
      logs: stdout + (stderr ? `\n[stderr]\n${stderr}` : ''),
    };
  }

  private map(r: any): FabricChannel {
    return {
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion ?? null,
      activo: r.activo,
      creadoEn: r.creado_en,
    };
  }
}
