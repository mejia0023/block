import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { exec } from 'child_process';
import * as net from 'net';
import * as path from 'path';
import { promisify } from 'util';
import { DatabaseService } from '../database/database.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { DeployNodeDto } from './dto/deploy-node.dto';

const execAsync = promisify(exec);

function findFreePort(start: number, exclude: number[] = []): Promise<number> {
  const port = exclude.includes(start) ? start + 1 : start;
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(port, '0.0.0.0', () => {
      const addr = server.address() as net.AddressInfo;
      server.close(() => resolve(addr.port));
    });
    server.on('error', () =>
      findFreePort(port + 1, exclude).then(resolve, reject),
    );
  });
}

export interface FabricNode {
  id: string;
  nombre: string;
  endpoint: string;
  hostAlias: string;
  activo: boolean;
  prioridad: number;
  creadoEn: Date;
}

@Injectable()
export class NodesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<FabricNode[]> {
    const { rows } = await this.db.query<any>(
      `SELECT id, nombre, endpoint, host_alias, activo, prioridad, creado_en
       FROM nodos_fabric
       ORDER BY prioridad ASC, creado_en ASC`,
    );
    return rows.map(this.map);
  }

  async findFirstActive(): Promise<{ endpoint: string; hostAlias: string } | null> {
    const { rows } = await this.db.query<any>(
      `SELECT endpoint, host_alias
       FROM nodos_fabric
       WHERE activo = true
       ORDER BY prioridad ASC, creado_en ASC
       LIMIT 1`,
    );
    return rows.length > 0 ? { endpoint: rows[0].endpoint, hostAlias: rows[0].host_alias } : null;
  }

  async create(dto: CreateNodeDto): Promise<FabricNode> {
    const { rows } = await this.db.query<any>(
      `INSERT INTO nodos_fabric (nombre, endpoint, host_alias, activo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dto.nombre, dto.endpoint, dto.hostAlias, dto.activo ?? true],
    );
    return this.map(rows[0]);
  }

  async toggle(id: string): Promise<{ node: FabricNode; logs: string }> {
    const { rows: cur } = await this.db.query<any>(
      `SELECT * FROM nodos_fabric WHERE id = $1`, [id],
    );
    if (!cur.length) throw new NotFoundException('Nodo no encontrado');

    const current      = this.map(cur[0]);
    const action       = current.activo ? 'stop' : 'start';
    const peerCtr      = current.hostAlias;
    const couchCtr     = `couchdb-${current.nombre}`;
    const lines: string[] = [`[INFO] Ejecutando: docker ${action} en ${current.nombre}`];

    for (const ctr of [peerCtr, couchCtr]) {
      try {
        const { stdout } = await execAsync(`docker ${action} ${ctr}`, { timeout: 30_000 });
        lines.push(`[OK]   ${ctr}: ${stdout.trim() || 'done'}`);
      } catch (e: any) {
        lines.push(`[WARN] ${ctr}: ${(e.stderr ?? e.message).split('\n')[0].trim()}`);
      }
    }

    const { rows } = await this.db.query<any>(
      `UPDATE nodos_fabric SET activo = NOT activo WHERE id = $1 RETURNING *`,
      [id],
    );

    lines.push(`[INFO] Estado en DB → ${rows[0].activo ? 'ACTIVO' : 'INACTIVO'}`);
    return { node: this.map(rows[0]), logs: lines.join('\n') };
  }

  async remove(id: string): Promise<void> {
    await this.db.query(`DELETE FROM nodos_fabric WHERE id = $1`, [id]);
  }

  async deployPeer(dto: DeployNodeDto): Promise<{ node: FabricNode; logs: string }> {
    const peerPort   = await findFreePort(9051);
    const couchPort  = await findFreePort(7984, [peerPort]);

    const scriptPath = path.resolve(
      __dirname,
      '../../../fabric/network/scripts/add-peer-dynamic.sh',
    );

    const wslScript = scriptPath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_m, d) => `/mnt/${d.toLowerCase()}`);

    const cmd = `wsl bash "${wslScript}" "${dto.nombre}" "${peerPort}" "${couchPort}"`;

    let stdout = '';
    let stderr = '';
    try {
      ({ stdout, stderr } = await execAsync(cmd, { timeout: 180_000 }));
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Deploy falló: ${err.message}\n${err.stderr ?? ''}`,
      );
    }

    const endpointMatch  = stdout.match(/^PEER_ENDPOINT=(.+)$/m);
    const hostAliasMatch = stdout.match(/^PEER_HOST_ALIAS=(.+)$/m);

    if (!endpointMatch || !hostAliasMatch) {
      throw new InternalServerErrorException(
        `Script no devolvió PEER_ENDPOINT/PEER_HOST_ALIAS.\n${stdout}\n${stderr}`,
      );
    }

    const node = await this.create({
      nombre:    dto.nombre,
      endpoint:  endpointMatch[1].trim(),
      hostAlias: hostAliasMatch[1].trim(),
      activo:    true,
    });

    return { node, logs: stdout + (stderr ? `\n[stderr]\n${stderr}` : '') };
  }

  private map(r: any): FabricNode {
    return {
      id: r.id,
      nombre: r.nombre,
      endpoint: r.endpoint,
      hostAlias: r.host_alias,
      activo: r.activo,
      prioridad: r.prioridad,
      creadoEn: r.creado_en,
    };
  }
}
