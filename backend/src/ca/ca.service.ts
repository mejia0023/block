import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as https from 'node:https';
import * as path from 'node:path';
import { RegisterIdentityDto } from './dto/register-identity.dto';

const CA_URL     = process.env.FABRIC_CA_URL     ?? 'https://localhost:7054';
const CRYPTO_BASE = process.env.FABRIC_CRYPTO_PATH
  ?? path.resolve(__dirname, '../../../../fabric/network/crypto-material');

const CA_TLS_CERT = path.resolve(
  __dirname,
  '../../../../fabric/network/fabric-ca/ficct/tls-cert.pem',
);

const ADMIN_CERT_DIR = path.join(
  CRYPTO_BASE,
  'peerOrganizations/ficct.edu.bo/users/Admin@ficct.edu.bo/msp/signcerts',
);
const ADMIN_KEY_DIR = path.join(
  CRYPTO_BASE,
  'peerOrganizations/ficct.edu.bo/users/Admin@ficct.edu.bo/msp/keystore',
);

export interface CaInfo {
  caName: string;
  caChain: string;
  issuerPublicKey: string;
  version: string;
}

export interface FabricIdentity {
  id: string;
  type: string;
  affiliation: string;
  maxEnrollments: number;
  attrs: { name: string; value: string; ecert: boolean }[];
}

export interface FabricCertificate {
  id: string;
  serial: string;
  pem: string;
  notAfter: string;
  notBefore: string;
  revoked: boolean;
}

@Injectable()
export class CaService {
  private readonly logger = new Logger(CaService.name);
  private http: AxiosInstance | null = null;

  private async getHttp(): Promise<AxiosInstance> {
    if (this.http) return this.http;

    let caCert: Buffer | undefined;
    try {
      caCert = await fs.readFile(CA_TLS_CERT);
    } catch {
      this.logger.warn('CA TLS cert not found — skipping TLS verification');
    }

    this.http = axios.create({
      baseURL: CA_URL,
      timeout: 10_000,
      httpsAgent: new https.Agent({
        ca: caCert,
        rejectUnauthorized: !!caCert,
      }),
    });
    return this.http;
  }

  // Fabric CA token: base64(certDER) + "." + base64(ECDSA_sign(base64(body) + "." + base64(certDER)))
  private async buildAuthToken(bodyJson = ''): Promise<string> {
    const certFiles = await fs.readdir(ADMIN_CERT_DIR);
    if (!certFiles.length) throw new Error('Admin cert not found');
    const certPem = await fs.readFile(path.join(ADMIN_CERT_DIR, certFiles[0]), 'utf8');

    const keyFiles = await fs.readdir(ADMIN_KEY_DIR);
    if (!keyFiles.length) throw new Error('Admin key not found');
    const keyPem  = await fs.readFile(path.join(ADMIN_KEY_DIR, keyFiles[0]));
    const privKey = crypto.createPrivateKey(keyPem);

    // Strip PEM headers to get raw base64 DER
    const b64Cert = certPem
      .replace(/-----[A-Z ]+-----/g, '')
      .replace(/\s/g, '');

    const b64Body   = Buffer.from(bodyJson).toString('base64');
    const payload   = Buffer.from(`${b64Body}.${b64Cert}`);
    const sign      = crypto.createSign('SHA256');
    sign.update(payload);
    const b64Sig    = sign.sign(privKey, 'base64');

    return `${b64Cert}.${b64Sig}`;
  }

  private wrap<T>(res: any): T {
    if (!res.data?.success) {
      throw new ServiceUnavailableException(
        res.data?.errors?.[0]?.message ?? 'CA request failed',
      );
    }
    return res.data.result as T;
  }

  async getInfo(): Promise<CaInfo> {
    try {
      const http = await this.getHttp();
      const res  = await http.get('/api/v1/cainfo');
      const r    = res.data?.result ?? {};
      return {
        caName:         r.CAName         ?? 'ca-ficct',
        caChain:        r.CAChain        ?? '',
        issuerPublicKey: r.IssuerPublicKey ?? '',
        version:        r.Version        ?? '',
      };
    } catch (err: any) {
      this.logger.error(`CA info failed: ${err.message}`);
      throw new ServiceUnavailableException('CA no disponible');
    }
  }

  async listIdentities(): Promise<FabricIdentity[]> {
    try {
      const http  = await this.getHttp();
      const token = await this.buildAuthToken();
      const res   = await http.get('/api/v1/identities', {
        headers: { Authorization: token },
      });
      return (this.wrap<{ identities: any[] }>(res).identities ?? []).map(
        (i: any) => ({
          id:             i.id,
          type:           i.type,
          affiliation:    i.affiliation,
          maxEnrollments: i.max_enrollments,
          attrs:          i.attrs ?? [],
        }),
      );
    } catch (err: any) {
      this.logger.error(`List identities failed: ${err.message}`);
      throw new ServiceUnavailableException('No se pudo obtener identidades de la CA');
    }
  }

  async registerIdentity(dto: RegisterIdentityDto): Promise<{ secret: string }> {
    const body = JSON.stringify({
      id:              dto.id,
      secret:          dto.secret,
      type:            dto.type,
      affiliation:     dto.affiliation ?? 'ficct',
      max_enrollments: dto.maxEnrollments ?? -1,
      attrs:           [],
    });
    try {
      const http  = await this.getHttp();
      const token = await this.buildAuthToken(body);
      const res   = await http.post('/api/v1/identities', JSON.parse(body), {
        headers: { Authorization: token, 'Content-Type': 'application/json' },
      });
      return { secret: this.wrap<{ secret: string }>(res).secret };
    } catch (err: any) {
      this.logger.error(`Register identity failed: ${err.message}`);
      throw new ServiceUnavailableException(
        err.response?.data?.errors?.[0]?.message ?? 'Error al registrar identidad',
      );
    }
  }

  async revokeIdentity(id: string): Promise<void> {
    const body = JSON.stringify({ id, reason: 'unspecified', gencrl: false });
    try {
      const http  = await this.getHttp();
      const token = await this.buildAuthToken(body);
      await http.delete(`/api/v1/identities/${encodeURIComponent(id)}`, {
        headers: { Authorization: token },
      });
    } catch (err: any) {
      this.logger.error(`Revoke identity failed: ${err.message}`);
      throw new ServiceUnavailableException('Error al revocar identidad');
    }
  }

  async listCertificates(): Promise<FabricCertificate[]> {
    try {
      const http  = await this.getHttp();
      const token = await this.buildAuthToken();
      const res   = await http.get('/api/v1/certificates', {
        headers: { Authorization: token },
      });
      const certs: any[] = this.wrap<{ certs: any[] }>(res).certs ?? [];
      return certs.map((c) => ({
        id:        c.id       ?? '',
        serial:    c.serial_number ?? '',
        pem:       c.pem      ?? '',
        notAfter:  c.not_after  ?? '',
        notBefore: c.not_before ?? '',
        revoked:   !!c.revoked,
      }));
    } catch (err: any) {
      this.logger.error(`List certificates failed: ${err.message}`);
      throw new ServiceUnavailableException('No se pudo obtener certificados de la CA');
    }
  }
}
