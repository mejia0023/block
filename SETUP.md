# FICCT E-Voting — Guía de instalación

Sistema de votación electrónica basado en Hyperledger Fabric para la UAGRM-FICCT.

---

## Requisitos previos

Instalar las siguientes herramientas antes de continuar:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | 18 LTS o superior | https://nodejs.org |
| Docker Desktop | 4.x | https://www.docker.com/products/docker-desktop |
| PostgreSQL | 14 o superior | https://www.postgresql.org/download |
| Fabric Binaries (`cryptogen`, `configtxgen`) | 2.5 | Ver instrucciones abajo |
| Git Bash (Windows) | Cualquiera | Incluido con Git for Windows |

> **Windows:** Todos los comandos de la red Fabric deben ejecutarse desde **Git Bash**, no desde PowerShell ni CMD.

### Instalar Fabric Binaries (cryptogen, configtxgen)

```bash
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5 --docker-images
```

Esto descarga los binarios en `fabric-samples/bin/`. Copia `cryptogen` y `configtxgen` a una carpeta en tu PATH, por ejemplo:

```bash
# Windows Git Bash
cp fabric-samples/bin/cryptogen.exe /usr/local/bin/
cp fabric-samples/bin/configtxgen.exe /usr/local/bin/
```

Verifica que funcionen:
```bash
cryptogen version
configtxgen --version
```

---

## Estructura del proyecto

```
P1/
├── backend/          # API NestJS (puerto 3000)
├── frontend/         # UI React + Vite (puerto 5173)
├── fabric/
│   ├── chaincode/evoting/   # Smart contract TypeScript
│   └── network/             # Docker Compose + scripts
├── ficct_evoting_db.sql     # Schema PostgreSQL
└── SETUP.md
```

---

## Paso 1 — Base de datos PostgreSQL

Crear la base de datos y aplicar el schema:

```bash
psql -h localhost -U postgres -c "CREATE DATABASE ficct_evoting_db;"
psql -h localhost -U postgres -d ficct_evoting_db -f ficct_evoting_db.sql
```

Insertar usuario administrador (contraseña: `admin123`):

```bash
psql -h localhost -U postgres -d ficct_evoting_db -c "
INSERT INTO users (ru, name, email, password_hash, career, role)
VALUES ('9999', 'Admin FICCT', 'admin@ficct.edu.bo',
'\$2b\$10\$m1JtfJxwhk6IOVXdvdyJ/.gSSBEH85wgP6BCaQ5OlxJIVVKWPp5Tq',
'SISTEMAS', 'ADMIN')
ON CONFLICT (ru) DO NOTHING;"
```

Insertar usuario estudiante de prueba (contraseña: `admin123`):

```bash
psql -h localhost -U postgres -d ficct_evoting_db -c "
INSERT INTO users (ru, name, email, password_hash, career, role)
VALUES ('1000', 'Estudiante Test', 'estudiante1000@ficct.edu.bo',
'\$2b\$10\$4Us1XXQcSkDAcJYaUm4TK.KrHmsg5.jTR2K/a9fAB63j8IWcwfNQu',
'SISTEMAS', 'ESTUDIANTE')
ON CONFLICT (ru) DO NOTHING;"
```

---

## Paso 2 — Red Hyperledger Fabric

```bash
cd fabric/network/scripts
chmod +x setup.sh teardown.sh
./setup.sh
```

El script hace todo automáticamente:
- Genera material criptográfico con `cryptogen`
- Crea el genesis block y canal `evoting`
- Levanta los contenedores Docker (orderer, peer, CouchDB, CA, CLI)
- Compila e instala el chaincode `evoting-cc`

> El script tarda aproximadamente **2-3 minutos**. Docker Desktop debe estar corriendo.

Para detener y limpiar la red:
```bash
./teardown.sh
```

---

## Paso 3 — Backend (NestJS)

```bash
cd backend
npm install
```

Crear el archivo `.env` en `backend/`:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ficct_evoting_db

JWT_SECRET=change_this_secret_in_production
JWT_EXPIRES_IN=8h

FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_PEER_HOST_ALIAS=peer0.ficct.edu.bo
FABRIC_MSP_ID=FICCTOrgMSP
FABRIC_CHANNEL=evoting
FABRIC_CHAINCODE=evoting-cc
FABRIC_CRYPTO_PATH=<RUTA_ABSOLUTA>/fabric/network/crypto-material
```

> **Importante:** Reemplaza `<RUTA_ABSOLUTA>` con la ruta completa al proyecto en tu máquina.  
> Ejemplo Windows: `C:/Users/TuUsuario/Documents/P1/fabric/network/crypto-material`  
> Ejemplo Linux/Mac: `/home/usuario/P1/fabric/network/crypto-material`

Iniciar el backend:
```bash
npm run start:dev
```

El backend estará disponible en `http://localhost:3000`.

---

## Paso 4 — Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Orden de inicio (cada vez que uses el proyecto)

Seguir este orden en cada sesión:

```
1. Iniciar Docker Desktop
2. Iniciar PostgreSQL (si no está como servicio)
3. cd fabric/network/scripts && docker-compose -f ../docker-compose.yml up -d
4. cd backend && npm run start:dev
5. cd frontend && npm run dev
```

> Si ya corriste `setup.sh` antes y los volúmenes Docker siguen intactos, **no necesitas volver a correr `setup.sh`** — solo levanta los contenedores con `docker-compose up -d`.

---

## Accesos del sistema

| Servicio | URL | Credenciales |
|---|---|---|
| Frontend (admin) | http://localhost:5173 | R.U: `9999` / Pass: `admin123` |
| Frontend (votante) | http://localhost:5173 | R.U: `1000` / Pass: `admin123` |
| Backend API | http://localhost:3000 | — |
| CouchDB (Fabric) | http://localhost:5984/_utils | `admin` / `adminpw` |
| PostgreSQL | localhost:5432 | `postgres` / `postgres` |

---

## Flujo de uso básico

1. Iniciar sesión como **admin** (R.U. `9999`) → ir a `/elections`
2. Crear una elección y agregar candidatos
3. Cambiar el estado de la elección a **ACTIVA**
4. Iniciar sesión como **estudiante** (R.U. `1000`) → ir a `/vote`
5. Seleccionar candidato → confirmar → recibir `txId` de recibo
6. Verificar el voto en CouchDB: `http://localhost:5984/_utils` → base de datos `evoting_evoting-cc`

---

## Solución de problemas comunes

**El backend no conecta a Fabric (`ENOENT cert.pem`)**  
→ La red Fabric no está corriendo. Ejecuta `docker-compose up -d` en `fabric/network/`.

**Error `cryptogen: command not found`**  
→ Los Fabric binaries no están en el PATH. Revisa el Paso 0.

**Docker bind-mount error al correr `setup.sh`**  
→ Reinicia Docker Desktop desde la barra de tareas de Windows.

**El peer no arranca (`core.yaml not found`)**  
→ Problema de volúmenes residuales. Ejecuta `./teardown.sh` y luego `./setup.sh` de nuevo.
