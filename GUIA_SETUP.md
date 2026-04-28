# Guía de Instalación y Pruebas — Sistema de Votación Blockchain

> Guía completa para levantar el proyecto en una máquina nueva después de clonar el repositorio.  
> **Sistema Operativo:** Windows 10/11 con Docker Desktop.

---

## Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Clonar el Repositorio](#2-clonar-el-repositorio)
3. [Instalar Dependencias](#3-instalar-dependencias)
4. [Crear el archivo `.env`](#4-crear-el-archivo-env)
5. [Configurar PostgreSQL](#5-configurar-postgresql)
6. [Poblar la Base de Datos](#6-poblar-la-base-de-datos)
7. [Levantar la Red Hyperledger Fabric](#7-levantar-la-red-hyperledger-fabric)
8. [Iniciar Backend y Frontend](#8-iniciar-backend-y-frontend)
9. [Registrar los Nodos en la Plataforma](#9-registrar-los-nodos-en-la-plataforma)
10. [Credenciales de Prueba](#10-credenciales-de-prueba)
11. [Solución de Problemas](#11-solución-de-problemas)

---

## 1. Requisitos Previos

Instalar **en este orden** antes de continuar:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| **Git + Git Bash** | cualquier versión reciente | https://git-scm.com/downloads |
| **Node.js** | 18 LTS | https://nodejs.org |
| **Docker Desktop** | 4.x o superior | https://www.docker.com/products/docker-desktop |
| **PostgreSQL** | 15 | https://www.postgresql.org/download/windows/ |

> **Importante:** Docker Desktop debe estar corriendo antes de ejecutar cualquier script de Fabric.  
> En la instalación de PostgreSQL, recuerda la contraseña que pongas al usuario `postgres` — la necesitarás en el paso 4.

---

## 2. Clonar el Repositorio

Abre **Git Bash** y ejecuta:

```bash
git clone <URL_DEL_REPOSITORIO>
cd <nombre-de-la-carpeta>
```

Todos los comandos siguientes se ejecutan desde la **raíz del proyecto** a menos que se indique lo contrario.

---

## 3. Instalar Dependencias

Ejecuta los siguientes comandos (pueden ir en cualquier orden, son independientes):

```bash
# Raíz (scripts de seed y utilidades)
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Chaincode
cd chaincode && npm install && cd ..
```

---

## 4. Crear el archivo `.env`

El archivo `.env` **no está en el repositorio** (está en `.gitignore`). Debes crearlo manualmente en la carpeta `backend/`.

Crea el archivo `backend/.env` con el siguiente contenido:

```env
# ── Base de Datos ──────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<TU_CONTRASEÑA_DE_POSTGRES>
DB_NAME=evoting_db

# ── JWT ────────────────────────────────────────────────────
JWT_SECRET=supersecretjwt2025evoting

# ── Hyperledger Fabric ─────────────────────────────────────
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_PEER_HOST_ALIAS=peer0.ficct.edu.bo
FABRIC_MSP_ID=FICCTOrgMSP
FABRIC_CHANNEL=evoting
FABRIC_CHAINCODE=evoting-cc

# Ajusta esta ruta a la ubicación REAL del proyecto en tu máquina
# Ejemplo Windows (con barras hacia adelante):
FABRIC_CRYPTO_PATH=C:/Users/TU_USUARIO/ruta/al/proyecto/fabric/network/crypto-material
```

**Importante:** Reemplaza:
- `<TU_CONTRASEÑA_DE_POSTGRES>` con la contraseña que configuraste al instalar PostgreSQL.
- `FABRIC_CRYPTO_PATH` con la ruta absoluta real a la carpeta `fabric/network/crypto-material` en tu máquina. Usa barras hacia adelante `/`, no `\`.

Ejemplo de `FABRIC_CRYPTO_PATH`:
```
FABRIC_CRYPTO_PATH=C:/Users/Juan/Documents/block/fabric/network/crypto-material
```

---

## 5. Configurar PostgreSQL

### 5.1 Crear la base de datos

Abre **pgAdmin** o la terminal de PostgreSQL (`psql`) y ejecuta:

```sql
CREATE DATABASE evoting_db;
```

O desde la terminal (Git Bash o CMD):

```bash
psql -U postgres -c "CREATE DATABASE evoting_db;"
```

### 5.2 Ejecutar el esquema principal

Desde la **raíz del proyecto**:

```bash
psql -U postgres -d evoting_db -f database.sql
```

Este comando crea todas las tablas, enums, índices y datos iniciales necesarios (organización base, usuario admin, canal `evoting`).

> Si `psql` no está en el PATH, usa la ruta completa, por ejemplo:  
> `"C:/Program Files/PostgreSQL/15/bin/psql.exe" -U postgres -d evoting_db -f database.sql`

---

## 6. Poblar la Base de Datos

Desde la **raíz del proyecto**:

```bash
npm run seed
```

Este comando crea 100 usuarios de prueba, 5 elecciones activas y registros de auditoría de ejemplo.

**Lo que genera el seed:**
- 100 usuarios con RUs del `21900001` al `21900100`
- Contraseña de todos: `password123`
- Usuarios 1–5 → rol `ADMINISTRADOR`
- Usuarios 6–10 → rol `AUDITOR`
- Usuarios 11–100 → rol `VOTANTE`
- 5 elecciones activas con candidatos

---

## 7. Levantar la Red Hyperledger Fabric

Este paso levanta todos los contenedores Docker (orderer, peers, CouchDB, CLI) y despliega el chaincode.

Abre **Git Bash** (no PowerShell ni CMD) y navega hasta la carpeta de red:

```bash
cd fabric/network
bash scripts/setup.sh
```

El script tarda entre **3 y 8 minutos** la primera vez (descarga imágenes Docker si no las tiene).

Al finalizar verás:
```
══════════════════════════════════════════════
  Red Fabric lista!
  Canal:     evoting
  Chaincode: evoting-cc v1.0
  Peer:      localhost:7051
  CouchDB:   http://localhost:5984/_utils
══════════════════════════════════════════════
```

### Verificar que los contenedores están corriendo

```bash
docker ps
```

Debes ver contenedores activos con nombres: `peer0.ficct.edu.bo`, `peer1.ficct.edu.bo`, `orderer.ficct.edu.bo`, `couchdb0`, `couchdb1`, `cli`, `ca.ficct.edu.bo`.

---

## 8. Iniciar Backend y Frontend

Abre **dos terminales separadas**.

**Terminal 1 — Backend:**
```bash
cd backend
npm run start:dev
```

Espera hasta ver: `Application is running on: http://[::1]:3000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Espera hasta ver: `Local: http://localhost:5173/`

Abre el navegador en: **http://localhost:5173**

---

## 9. Registrar los Nodos en la Plataforma

La base de datos arranca vacía de nodos. Debes registrar peer0 y peer1 manualmente desde el panel de administración.

1. Inicia sesión con una cuenta de administrador (ver sección 10).
2. Ve al menú **Nodos Fabric** en el panel lateral.
3. Haz clic en **"Agregar Nodo"** y registra los dos peers:

**Peer 0:**
| Campo | Valor |
|---|---|
| Nombre | `peer0.ficct.edu.bo` |
| Endpoint | `localhost:7051` |
| Host Alias | `peer0.ficct.edu.bo` |

**Peer 1:**
| Campo | Valor |
|---|---|
| Nombre | `peer1.ficct.edu.bo` |
| Endpoint | `localhost:8051` |
| Host Alias | `peer1.ficct.edu.bo` |

> Usa **"Agregar Nodo"** (para nodos ya en ejecución), **no** el botón "Desplegar Peer" (que crea un peer nuevo con Docker).

---

## 10. Credenciales de Prueba

### Administrador (creado por `database.sql`)
| Campo | Valor |
|---|---|
| RU / Identificador | `admin` |
| Contraseña | `password123` |

### Administrador (creado por `npm run seed`)
| Campo | Valor |
|---|---|
| RU / Identificador | `21900001` |
| Contraseña | `password123` |

### Auditor
| Campo | Valor |
|---|---|
| RU / Identificador | `21900006` |
| Contraseña | `password123` |

### Votante (ejemplos)
| RU | Contraseña |
|---|---|
| `21900011` | `password123` |
| `21900050` | `password123` |
| `21900100` | `password123` |

> **Nota:** Los votantes solo ven las elecciones del canal al que están asignados. Para asignar un usuario a un canal, un administrador debe ir a **Usuarios → Editar usuario → Canales asignados**.

---

## 11. Solución de Problemas

### Error: `ECONNREFUSED` al iniciar el backend
- Verifica que PostgreSQL esté corriendo.
- Verifica las credenciales en `backend/.env`.
- Asegúrate de haber ejecutado `database.sql`.

### Error: `FABRIC_CRYPTO_PATH` / `no such file or directory`
- El valor de `FABRIC_CRYPTO_PATH` en `.env` apunta a una ruta que no existe en tu máquina.
- Verifica que hayas ejecutado `bash scripts/setup.sh` primero (este paso genera el directorio `crypto-material`).
- Usa la ruta absoluta correcta con barras `/`.

### Error de Docker: `port is already allocated`
- Algún puerto (7051, 8051, 5984, etc.) está en uso.
- Ejecuta `docker ps -a` para ver qué contenedores están usando esos puertos.
- Si hay contenedores viejos del proyecto: `docker-compose down` desde `fabric/network`.

### La red Fabric se reinicia sola / chaincode no responde
- Detén todo: `docker-compose down -v` desde `fabric/network`.
- Vuelve a ejecutar `bash scripts/setup.sh` desde `fabric/network`.

### "No hay papeletas activas" en la página de votación
- El votante no está asignado a ningún canal de Fabric.
- Inicia sesión como administrador → **Usuarios** → Editar el votante → asignarle el canal `evoting-ficct` u otro canal activo.

### El seed falla: `relation "organizaciones" does not exist` o `violates foreign key constraint`
- No ejecutaste el paso 5.2. Vuelve a correr `database.sql`.

### Cómo reiniciar todo desde cero
```bash
# 1. Detener red Fabric
cd fabric/network
docker-compose down -v

# 2. Limpiar base de datos
psql -U postgres -d evoting_db -f database.sql

# 3. Sembrar datos
cd ../..
npm run seed

# 4. Volver a levantar Fabric
cd fabric/network
bash scripts/setup.sh
```

---

## Resumen rápido (flujo completo)

```
git clone <repo> && cd <repo>
npm install && cd backend && npm install && cd ../frontend && npm install && cd ../chaincode && npm install && cd ..
# → Crear backend/.env con tus datos
psql -U postgres -c "CREATE DATABASE evoting_db;"
psql -U postgres -d evoting_db -f database.sql
npm run seed
cd fabric/network && bash scripts/setup.sh && cd ../..
# Terminal 1:
cd backend && npm run start:dev
# Terminal 2:
cd frontend && npm run dev
# → Abrir http://localhost:5173
# → Login con 21900001 / password123
# → Registrar peer0 y peer1 en "Nodos Fabric"
```
