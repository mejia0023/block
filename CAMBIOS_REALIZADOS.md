# Cambios Realizados - Mejoras Sistema de Votación

## Fecha: 26 de abril de 2026

---

## 1. Logo del Frente en Candidados ✅

### Backend
- **Archivo:** `backend/src/elections/dto/create-candidate.dto.ts`
  - Agregado campo `logoFrente?: string` con validación `@IsUrl()`

- **Archivo:** `backend/src/elections/elections.service.ts`
  - Actualizada interfaz `Candidate` con campo `logoFrente: string | null`
  - Actualizada función `mapCandidate()` para mapear `logo_frente`
  - Actualizado `createCandidate()` para guardar `logo_frente`

### Frontend
- **Archivo:** `frontend/src/types/index.ts`
  - Agregado `logoFrente?: string | null` a interfaz `Candidate`

- **Archivo:** `frontend/src/pages/admin/ElectionManager.tsx`
  - Agregado campo `logoFrente` al estado del formulario
  - Agregado input "URL logo frente (opcional)" en el formulario
  - Actualizados tipos del `CandidatePanel`

- **Archivo:** `frontend/src/pages/voter/VotingPage.tsx`
  - Mostrado logo del frente (16x16px) cuando existe
  - Si no hay logo, muestra badge con nombre del frente

- **Archivo:** `frontend/src/pages/public/LiveResults.tsx`
  - Mostrado logo del frente (14x14px) cuando existe
  - Si no hay logo, muestra texto con nombre del frente

### Base de Datos
- **Archivo:** `add_logo_frente_column.sql`
  ```sql
  ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS logo_frente TEXT;
  ```

---

## 2. Auditoría Blockchain ✅

### Problema
El módulo `AuditModule` no importaba `DatabaseModule`, por lo que el controller no podía inyectar `DatabaseService`.

### Solución
- **Archivo:** `backend/src/audit/audit.module.ts`
  ```typescript
  import { DatabaseModule } from '../database/database.module';
  
  @Module({
    imports: [DatabaseModule],
    controllers: [AuditController],
  })
  ```

### Funcionamiento
El endpoint `/audit/logs` ahora devuelve los registros de la tabla `recibos_voto`:
- `txId`: ID de transacción blockchain
- `electionId`: ID de la elección
- `status`: PENDING | CONFIRMED | FAILED
- `errorMessage`: Mensaje de error si falló
- `createdAt`: Fecha de creación

---

## 3. Mejoras Visuales en Tarjetas de Candidatos ✅

### VotingPage.tsx
- **Top accent line:** Línea superior de 1.5px con gradiente índigo
- **Photo area mejorada:**
  - Fondo con gradiente slate-índigo
  - Avatar circular con gradiente cuando no hay foto
  - Badge de check en esquina que se llena al seleccionar
  - Overlay gradiente en hover
- **Info area:**
  - Logo del frente (16x16px) o badge con nombre
  - Patrón radial sutil en hover
- **Bottom action bar:** Línea inferior que cambia a esmeralda cuando está seleccionado
- **Estados mejorados:**
  - Seleccionado: border índigo + ring + scale 1.03 + shadow 2xl
  - No seleccionado: hover con borde índigo suave

### LiveResults.tsx
- **Top accent bar:** 2px con gradiente ámbar (líder) o índigo (hover)
- **Photo area:**
  - Gradiente slate-índigo de fondo
  - Avatar circular con gradiente
  - Badge de "Líder" con gradiente ámbar + shadow
  - Badges de ranking (1º, 2º, 3º) con gradientes metálicos
- **Result badge:**
  - Glow de fondo blur
  - Gradiente ámbar para líder, slate oscuro para demás
  - Shadow coloreado

---

## 4. Instrucciones para Aplicar Cambios

### Paso 1: Ejecutar migración de base de datos
```bash
# Conéctate a PostgreSQL
psql -U postgres -d evoting_db

# Ejecuta la migración
\i add_logo_frente_column.sql

# O ejecuta directamente:
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS logo_frente TEXT;
```

### Paso 2: Reiniciar backend
```bash
cd backend
npm run build
npm run start:dev
```

### Paso 3: Probar en frontend
```bash
cd frontend
npm run dev
```

---

## 5. Cómo Agregar Candidatos con Logo

1. Ve a Admin → Elecciones
2. Expande una elección en estado PROGRAMADA
3. En "Agregar candidato":
   - Selecciona usuario
   - Ingresa cargo
   - Ingresa nombre del frente
   - (Opcional) Misión
   - (Opcional) URL foto candidato
   - **(Opcional) URL logo frente** ← NUEVO
4. Click en "Agregar candidato"

### Ejemplo de URLs para logos:
```
https://img.icons8.com/color/96/vote.png
https://cdn-icons-png.flaticon.com/512/2983/2983976.png
https://img.freepik.com/free-vector/hand-drawn-flat-design-voting-logo_23-2149687795.jpg
```

---

## 6. Notas sobre Estados de Elecciones

### Problema Reportado: "Solo aparece ACTIVA"
El dashboard muestra TODAS las elecciones, agrupadas por estado:
- **PROGRAMADA:** Creadas pero no iniciadas
- **ACTIVA:** En curso actualmente
- **CERRADA:** Finalizadas, en escrutinio
- **ESCRUTADA:** Resultados oficiales

Si solo ves 1 en ACTIVA, es porque las otras 4 pueden estar en PROGRAMADA o CERRADA.

**Verificar en Admin → Elecciones** para ver el estado real de cada una.

---

## 7. Auditoría de Votos

### Endpoint: `/audit/logs`
Devuelve todos los recibos de voto registrados:

```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "electionId": "uuid",
    "txId": "fabric-tx-id...",
    "status": "CONFIRMED",
    "errorMessage": null,
    "createdAt": "2026-04-26T20:00:00.000Z"
  }
]
```

### Estados posibles:
- **PENDING:** Voto emitido, esperando confirmación de Fabric
- **CONFIRMED:** Voto confirmado en blockchain
- **FAILED:** Error al sincronizar con Fabric

### Cómo probar:
1. Ve a Admin → Auditoría
2. Filtra por estado (PENDING, CONFIRMED, FAILED)
3. Busca por txId

---

## 8. Resumen de Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `backend/src/elections/dto/create-candidate.dto.ts` | Campo `logoFrente` |
| `backend/src/elections/elections.service.ts` | Mapeo `logoFrente` |
| `backend/src/audit/audit.module.ts` | Import `DatabaseModule` |
| `frontend/src/types/index.ts` | Interfaz `Candidate` con `logoFrente` |
| `frontend/src/pages/admin/ElectionManager.tsx` | Formulario con logo |
| `frontend/src/pages/voter/VotingPage.tsx` | Mostrar logo + mejoras visuales |
| `frontend/src/pages/public/LiveResults.tsx` | Mostrar logo + mejoras visuales |
| `add_logo_frente_column.sql` | Migración DB |

---

## 9. Próximos Pasos Sugeridos (Sesión 1)

1. ✅ Ejecutar migración `add_logo_frente_column.sql`
2. ✅ Reiniciar backend
3. ✅ Probar creación de candidatos con logo
4. ✅ Probar visualización en votación
5. ✅ Probar auditoría de votos
6. ✅ Verificar que todas las elecciones aparecen en Dashboard

---

---

# Sesión 2 — Integración Real con Blockchain (27 de abril de 2026)

> Objetivo: hacer que el sistema funcione con Docker/Hyperledger Fabric de forma real, no solo visualmente con PostgreSQL.

---

## 10. Corrección del Chaincode Desplegado ✅

### Problema
Existían **dos versiones del chaincode**:
- `fabric/chaincode/evoting/` — contrato `EVotingContract` (VIEJO, sin `initEleccion` ni `cerrarEleccion`)
- `chaincode/` — contrato `VotingContract` (NUEVO, completo, con nombre `FicctVoting`)

Los scripts de setup (`setup.sh`, `add-peer-dynamic.sh`) y el `docker-compose.yml` apuntaban a la versión vieja.

### Solución

**`fabric/network/docker-compose.yml`**
```yaml
# ANTES:
- ../chaincode:/chaincode

# DESPUÉS:
- ../../chaincode:/chaincode
```

**`fabric/network/scripts/setup.sh`**
```bash
# ANTES:
CHAINCODE_DIR="$(dirname "$NETWORK_DIR")/chaincode/evoting"
--path "/chaincode/evoting"

# DESPUÉS:
CHAINCODE_DIR="$(dirname "$(dirname "$NETWORK_DIR")")/chaincode"
--path "/chaincode"
```

**`fabric/network/scripts/add-peer-dynamic.sh`**
```bash
# ANTES: --path "/chaincode/evoting"
# DESPUÉS: --path "/chaincode"
```

---

## 11. Corrección del Nombre del Contrato en el Gateway SDK ✅

### Problema
`VotingContract` se registra con el nombre `FicctVoting` via `super('FicctVoting')`.
El backend llamaba `getContract(CHAINCODE_NAME)` sin especificar el nombre del contrato,
por lo que Fabric no podía rutear las transacciones al contrato correcto.

### Solución — `backend/src/fabric/fabric.service.ts`

```typescript
// ANTES:
const contract = network.getContract(CHAINCODE_NAME);

// DESPUÉS:
const contract = network.getContract(CHAINCODE_NAME, 'FicctVoting');
```
Ambas llamadas (canal por defecto y por elección) fueron corregidas.

---

## 12. Implementación de `initEleccion` en Backend ✅

### Problema
`VotingContract.emitirVoto()` requiere que exista el estado de la elección en el ledger (inicializado por `initEleccion`). Nunca se llamaba a ese método al activar una elección.

### Solución

**`backend/src/fabric/fabric.service.ts`** — nuevo método:
```typescript
async initEleccion(electionId: string): Promise<void> {
  const channel  = await this.getElectionChannel(electionId);
  const contract = this.getContractForChannel(channel);
  await contract.submitTransaction('initEleccion', electionId);
}
```

**`backend/src/elections/elections.service.ts`** — llamada al cambiar estado:
```typescript
if (dto.status === 'ACTIVA') {
  try {
    await this.fabricService.initEleccion(id);
  } catch (err) {
    this.logger.error(`initEleccion falló para ${id}: ...`);
  }
}
```

---

## 13. Creación de Canal — Eliminación de WSL ✅

### Problema
La creación de canales usaba `wsl bash -c "bash '/mnt/c/Disco D/...'"`.
En Windows con Docker Desktop, las rutas con espacios causan error:
```
/bin/sh: bash: Permission denied
```

### Solución — `backend/src/channels/channels.service.ts` (reescritura completa)

Se eliminó toda dependencia de WSL. Ahora usa directamente `docker exec cli` y `docker cp`:

```typescript
// Copiar configtx.yaml al contenedor CLI
await run(`docker cp "${configtxSrc}" cli:/tmp/configtx.yaml`, ...);

// Generar channel transaction dentro del CLI
await run(`docker exec cli configtxgen -profile EvotingChannel ...`, ...);

// Crear canal en el orderer
await run(`docker exec cli peer channel create ...`, ...);

// Unir peers
await run(`docker exec cli peer channel join ...`, ...);

// Aprobar y confirmar chaincode (opcional si ya está instalado)
await run(`docker exec cli peer lifecycle chaincode approveformyorg ...`, true);
await run(`docker exec cli peer lifecycle chaincode commit ...`, true);
```

Flujo completo:
1. Validar nombre del canal (regex `^[a-z][a-z0-9-]{2,48}$`)
2. `docker cp configtx.yaml` → CLI container
3. `configtxgen` genera la tx de creación del canal
4. `peer channel create` crea el canal en el orderer
5. `peer channel join` une peer0 (obligatorio) y peer1 (opcional)
6. Detecta Package ID instalado → `approveformyorg` + `commit` (opcionales)
7. Persiste en `canales_fabric` en PostgreSQL

---

## 14. CA — Identidades y Certificados desde Filesystem ✅

### Problema
`listIdentities()` y `listCertificates()` llamaban a la REST API de Fabric CA
(`/api/v1/identities`, `/api/v1/certificates`). La CA exige un token de autenticación
firmado con un certificado **emitido por esa misma CA**. Los certificados generados
con `cryptogen` no son reconocidos, por lo que devolvía error 401.

### Solución — `backend/src/ca/ca.service.ts`

**`listIdentities()`** — lee el directorio `crypto-material/` directamente:
```typescript
// Lee peerOrganizations/.../users  → tipo admin/client
// Lee peerOrganizations/.../peers  → tipo peer
// Lee ordererOrganizations/.../orderers → tipo orderer
```

**`listCertificates()`** — escanea `msp/signcerts/*.pem` y parsea con `crypto.X509Certificate`:
```typescript
const x509 = new crypto.X509Certificate(pem);
return {
  id, serial: x509.serialNumber, pem,
  notAfter: x509.validTo, notBefore: x509.validFrom, revoked: false,
};
```

`registerIdentity()` y `revokeIdentity()` siguen usando la REST API de CA (operaciones de escritura que sí requieren autenticación real con CA).

---

## 15. Auto-detección de Puerto para Nodos ✅

### Problema
Al crear un nodo nuevo, el formulario pedía ingresar el puerto manualmente.
No había validación de que el puerto no estuviese en uso.

### Solución

**`backend/src/nodes/nodes.service.ts`** — nuevo método `getNextFreePort()`:
```typescript
async getNextFreePort() {
  // Consulta puertos ya usados en BD
  // Excluye puertos reservados de Fabric: 7050, 7051, 7052, 7054, 8051, 8052
  // Usa net.createServer() para verificar disponibilidad real desde 9051
  // Retorna: { port, endpoint, hostAlias, nombre }
}
```

**`backend/src/nodes/nodes.controller.ts`** — nuevo endpoint:
```typescript
@Get('free-port')
getFreePort() {
  return this.nodesService.getNextFreePort();
}
```

**`frontend/src/pages/admin/NodesPage.tsx`** — `openAddForm()`:
```typescript
async function openAddForm() {
  // Al abrir el panel, llama GET /nodes/free-port
  // Pre-rellena nombre, endpoint y hostAlias automáticamente
  // Muestra spinner durante la carga, inputs deshabilitados
  // El usuario puede editar manualmente si lo necesita
}
```

---

## 16. Script de Reinicio de Red (Windows nativo) ✅

### Archivo: `fabric/network/restart-network.ps1`

Script PowerShell que reinicia la red Fabric completa usando material criptográfico
ya existente (sin necesidad de `cryptogen` ni `configtxgen` instalados localmente):

1. Compila el chaincode (`npm run build` en `chaincode/`)
2. Baja los contenedores (`docker-compose down -v`)
3. Sube los contenedores (`docker-compose up -d`)
4. Espera que peers estén listos
5. Crea el canal `evoting` via `docker exec cli`
6. Une peer0 y peer1 al canal
7. Instala, aprueba y confirma el chaincode
8. Verifica que `initLedger` responde correctamente

### Archivo: `fabric/network/install-fabric-tools.ps1`

Descarga los binarios de Hyperledger Fabric 2.5.12 para Windows desde GitHub Releases
y los agrega al `PATH` del usuario.

---

## 17. Resumen de Archivos Modificados (Sesión 2)

| Archivo | Cambio |
|---------|--------|
| `fabric/network/docker-compose.yml` | Volumen CLI apunta a `chaincode/` raíz |
| `fabric/network/scripts/setup.sh` | Path del chaincode corregido |
| `fabric/network/scripts/add-peer-dynamic.sh` | Path del chaincode corregido |
| `backend/src/fabric/fabric.service.ts` | `getContract(..., 'FicctVoting')` + método `initEleccion` |
| `backend/src/elections/elections.service.ts` | Llamada a `initEleccion` al activar elección |
| `backend/src/channels/channels.service.ts` | Reescritura: Docker directo, sin WSL |
| `backend/src/ca/ca.service.ts` | `listIdentities` y `listCertificates` desde filesystem |
| `backend/src/nodes/nodes.service.ts` | Método `getNextFreePort()` |
| `backend/src/nodes/nodes.controller.ts` | Endpoint `GET /nodes/free-port` |
| `frontend/src/pages/admin/NodesPage.tsx` | Auto-relleno de formulario con puerto libre |
| `fabric/network/restart-network.ps1` | Script nuevo de reinicio de red |
| `fabric/network/install-fabric-tools.ps1` | Script nuevo de instalación de binarios |

---

## 18. Pasos para Levantar el Sistema Completo

### Requisitos previos
- Docker Desktop corriendo
- Node.js 18+
- El crypto-material ya fue generado previamente (`setup.sh` ejecutado al menos una vez)

### 1. Reiniciar la red Fabric
```powershell
cd fabric/network
.\restart-network.ps1
```

### 2. Levantar el backend
```bash
cd backend
npm run build
npm run start:dev
```

### 3. Levantar el frontend
```bash
cd frontend
npm run dev
```

### 4. Verificar funcionamiento
- Admin → CA: pestaña "Identidades" y "Certificados" deben mostrar datos del crypto-material
- Admin → Canales: "Crear canal" debe funcionar sin error de WSL
- Admin → Nodos: "Agregar Nodo" debe pre-rellenar endpoint automáticamente
- Admin → Elecciones: cambiar estado a ACTIVA debe inicializar la elección en el ledger
- Votante: emitir voto debe generar `txId` real de Fabric

---

---

---

# Sesión 3 — Corrección de Red Fabric desde Cero (27 de abril de 2026)

> Objetivo: resolver todos los errores que surgieron al querer levantar el sistema completamente limpio con `setup.sh`, dejando el flujo completo funcional (red Fabric → canales → chaincode → votación).

---

## 19. Corrección de `setup.sh` — Rutas de configtxgen en Windows ✅

### Problema
`configtxgen` fallaba con:
```
open C:\...\fabric\network\.configtx-local\crypto-material\ordererOrganizations\...\tls\server.crt: The system cannot find the path specified.
```
Tres causas encadenadas:
1. El `sed` reemplazaba `/crypto/` con `crypto-material/` (relativo a `.configtx-local/`) pero `configtxgen` resolvía esa ruta relativa desde `.configtx-local/`, generando un path inexistente.
2. Usar `cygpath -m` producía paths como `/c/Disco D/...` que `configtxgen` (binario Windows) trataba como relativos.
3. `cryptogen` en Windows generaba `config.yaml` con backslashes (`cacerts\ca.ficct.edu.bo-cert.pem`) que los peers Linux no podían leer.

### Solución — `fabric/network/scripts/setup.sh` (reescritura completa)

- **`cryptogen` ahora corre via Docker** (`fabric-tools:2.5`) → genera paths Linux correctos en los archivos MSP.
- **`configtxgen` ahora corre via Docker** con `-v crypto-material:/crypto` → usa directamente los paths `/crypto/...` del `configtx.yaml` original sin necesidad de `sed`.
- **`MSYS_NO_PATHCONV=1`** al inicio del script → evita que Git Bash convierta rutas `/crypto/...` a `C:/Program Files/Git/crypto/...` en todos los `docker exec` y `docker run`.
- Se elimina por completo el directorio `.configtx-local` y la transformación `sed`.
- Se agrega `docker-compose down -v` al inicio para garantizar un estado limpio.

```bash
# ANTES (roto):
cryptogen generate ...          # binario Windows → backslashes
sed 's|/crypto/|crypto-material/|g' configtx.yaml > .configtx-local/configtx.yaml
export FABRIC_CFG_PATH="$WIN_CFG_PATH"   # path relativo roto
configtxgen ...

# DESPUÉS (correcto):
export MSYS_NO_PATHCONV=1
WIN_NETWORK_DIR=$(cygpath -m "$NETWORK_DIR")
docker run --rm -v "${WIN_NETWORK_DIR}:/network" hyperledger/fabric-tools:2.5 \
    cryptogen generate --config=/network/crypto-config.yaml --output=/network/crypto-material

docker run --rm -v "${WIN_NETWORK_DIR}:/network" -v "${WIN_NETWORK_DIR}/crypto-material:/crypto" \
    -e FABRIC_CFG_PATH=/network hyperledger/fabric-tools:2.5 \
    configtxgen -profile EvotingOrdererGenesis ...
```

---

## 20. Corrección de `channels.service.ts` — CORE_PEER_ADDRESS en todos los comandos ✅

### Problema
`approveformyorg` y `queryinstalled` en `deployChaincodeToChannel` corrían sin sobreescribir `CORE_PEER_ADDRESS`, usando el peer por defecto del CLI (`peer0.ficct.edu.bo:7051`). Si el canal fue unido por un peer diferente, o el CLI apuntaba a otro peer, fallaba con:
```
Error: proposal failed with status: 500 - channel 'uagrm' not found
```

### Solución — `backend/src/channels/channels.service.ts`

Se creó la función `peerEnv(node)` que inyecta las tres variables de entorno en **todos** los comandos de `deployChaincodeToChannel`:

```typescript
const peerEnv = (node: FabricNodeRow) => [
  `-e "CORE_PEER_ADDRESS=${this.peerAddress(node)}"`,
  `-e "CORE_PEER_TLS_ROOTCERT_FILE=${this.peerTlsPath(node)}"`,
  `-e "CORE_PEER_MSPCONFIGPATH=${ADMIN_MSP}"`,
].join(' ');
```

Ahora `querycommitted`, `queryinstalled`, `approveformyorg` y `commit` usan siempre el mismo nodo (el primero activo), evitando inconsistencias.

---

## 21. Corrección de Peers Inalcanzables en `channels.service.ts` ✅

### Problema
Al desplegar chaincode en un canal, si un peer en `nodos_fabric` estaba caído o no existía como contenedor Docker, el error era críptico:
```
failed to create new connection: dial tcp: lookup peer2.ficct.edu.bo on 127.0.0.11:53: no such host
```

### Solución

Se agrega un **filtro de alcanzabilidad** antes de ejecutar cualquier comando de chaincode. Ahora se verifica que el peer esté en el canal específico (no solo que responda en general):

```typescript
const channelList = await run(
  `docker exec ${peerEnv(node)} cli peer channel list`, ..., true
);
if (channelList.includes(channelName)) {
  activeNodes.push(node);
} else {
  log(`[WARN] ${node.nombre} no está en canal ${channelName} — omitido`);
}
```

Si ningún peer está en el canal, se lanza `BadRequestException` con mensaje claro.

---

## 22. Corrección de Race Condition — Join → Approve ✅

### Problema
Tras unir un peer al canal con `peer channel join`, el ledger del canal aún no estaba completamente inicializado cuando `approveformyorg` llegaba. El peer respondía:
```
Error: proposal failed with status: 500 - channel 'evoting-uagrm' not found
```
aunque el join había retornado exitosamente.

### Solución — `backend/src/channels/channels.service.ts`

Se agrega un sleep de 10 segundos después de unir todos los peers y antes de desplegar el chaincode:

```typescript
log('[INFO] Esperando que los peers inicialicen el ledger del canal (10s)...');
await sleep(10000);
await this.deployChaincodeToChannel(channelName, log, joinedNodes);
```

---

## 23. Limpieza de `nodos_fabric` — Peer2 con Certificado Incorrecto ✅

### Problema
`peer2.ficct.edu.bo` estaba en la tabla `nodos_fabric` con un certificado TLS generado incorrectamente (SAN: `DNS:peer2.1.ficct.edu.bo` en lugar de `DNS:peer2.ficct.edu.bo`). Causaba:
```
ERR_TLS_CERT_ALTNAME_INVALID: Host: peer2.ficct.edu.bo is not in the cert's altnames: DNS:peer2.1.ficct.edu.bo
```

Además, `peer2.ficct.edu.bo` no existía como contenedor Docker en `evoting_network`, causando error de DNS en comandos `docker exec`.

### Solución

SQL ejecutado en pgAdmin para limpiar y reconfigurar:
```sql
DELETE FROM nodos_fabric;
INSERT INTO nodos_fabric (nombre, endpoint, host_alias, activo, prioridad)
VALUES
  ('peer0', 'localhost:7051', 'peer0.ficct.edu.bo', true, 1),
  ('peer1', 'localhost:8051', 'peer1.ficct.edu.bo', true, 2);
```

Peer0 y Peer1 tienen certificados correctos generados por `cryptogen` en `setup.sh`.

---

## 24. Corrección de Visibilidad de Elecciones para Votantes ✅

### Problema
Los votantes no veían ninguna elección activa ni sus candidatos. La consulta en `findCurrentVoterElections` usaba:
```sql
INNER JOIN usuario_canales uc ON uc.canal_fabric = e.canal_fabric
WHERE uc.id_usuario = $2
```
Como la tabla `usuario_canales` estaba vacía (no se habían asignado usuarios a canales), el INNER JOIN devolvía cero filas.

### Solución — `backend/src/elections/elections.service.ts`

Se simplificó la consulta para mostrar **todas las elecciones ACTIVA** a todos los votantes, sin filtro de canal:

```typescript
// ANTES: INNER JOIN usuario_canales (vacío → sin resultados)
// DESPUÉS:
SELECT e.*
FROM elecciones e
WHERE e.id_organizacion = $1
  AND e.estado = 'ACTIVA'
ORDER BY e.creado_en DESC
```

Esto garantiza que cualquier votante autenticado vea las elecciones activas y sus candidatos.

---

## 25. Resumen de Archivos Modificados (Sesión 3)

| Archivo | Cambio |
|---------|--------|
| `fabric/network/scripts/setup.sh` | Reescritura completa: Docker para cryptogen/configtxgen, MSYS_NO_PATHCONV, limpieza previa |
| `backend/src/channels/channels.service.ts` | `peerEnv()` en todos los comandos, filtro de alcanzabilidad por canal, sleep post-join |
| `backend/src/elections/elections.service.ts` | `findCurrentVoterElections` simplificado — muestra todas las ACTIVA |

---

## 26. Estado Final del Sistema (27 de abril de 2026)

### Flujo completo verificado ✅

1. **`bash scripts/setup.sh`** desde Git Bash → genera crypto, artefactos, levanta Docker, crea canal `evoting`, despliega chaincode
2. **Admin → Nodos** → peer0 y peer1 registrados en DB con certs correctos
3. **Admin → Canales** → crear canal nuevo (ej. `evoting-uagrm`) → join automático + despliegue de chaincode
4. **Admin → Elecciones** → crear elección, agregar candidatos, activar → `initEleccion` en Fabric
5. **Votante** → ve las elecciones activas con sus candidatos → vota → recibe `txId` de blockchain
6. **Resultados** → conteos reflejados en tiempo real desde la BD sincronizada con Fabric

### Comandos para levantar desde cero

```bash
# 1. Red Fabric (desde Git Bash en fabric/network)
bash scripts/setup.sh

# 2. Backend
cd backend && npm run start:dev

# 3. Frontend
cd frontend && npm run dev

# 4. SQL inicial en pgAdmin
DELETE FROM nodos_fabric;
INSERT INTO nodos_fabric (nombre, endpoint, host_alias, activo, prioridad)
VALUES ('peer0','localhost:7051','peer0.ficct.edu.bo',true,1),
       ('peer1','localhost:8051','peer1.ficct.edu.bo',true,2);
```

---

---

---

# Sesión 4 — Corrección de Bugs Críticos Post-Integración (28 de abril de 2026)

> Objetivo: resolver fallos que surgieron en uso real del sistema: cierre de sesión al votar, colisión de puertos al desplegar peers, nodos duplicados, filtrado de elecciones por canal y pantalla de votación en blanco.

---

## 27. Corrección de Cierre de Sesión al Votar ✅

### Problema
Al hacer clic en "Registrar Votos Oficiales" en la pantalla del votante, el sistema cerraba la sesión y redirigía al login. La causa raíz era que `assertCanVote` en `users.service.ts` verificaba si el usuario estaba asignado al canal de la elección mediante un `INNER JOIN` con `usuario_canales`. Como esa tabla estaba vacía, lanzaba `UnauthorizedException` (HTTP 401), que el interceptor de axios interpretaba como token inválido y ejecutaba el logout.

### Solución — `backend/src/users/users.service.ts`

Se eliminó la verificación de canal de `assertCanVote`, que en ese momento no era necesaria porque `usuario_canales` estaba vacía:

```typescript
// ANTES: lanzaba UnauthorizedException(401) → axios cerraba sesión
const channelRes = await this.db.query(`
  SELECT 1 FROM elecciones e
  INNER JOIN usuario_canales uc ON uc.canal_fabric = e.canal_fabric
  WHERE e.id = $1 AND uc.id_usuario = $2 LIMIT 1`, [electionId, userId]);
if (channelRes.rows.length === 0)
  throw new UnauthorizedException('El usuario no está asignado al canal de esta elección');

// DESPUÉS: solo verifica cuenta habilitada y si ya votó
```

---

## 28. Corrección de Colisión de Puertos al Desplegar Peers ✅

### Problema
Al desplegar un nuevo peer desde la UI, el CouchDB asociado fallaba con:
```
Bind for 0.0.0.0:7984 failed: port is already allocated
```
y luego:
```
Bind for 0.0.0.0:7985 failed: port is already allocated
```

Dos causas:

1. **`findFreePort` tenía un bug**: si el puerto inicial estaba en la lista de excluidos, solo saltaba `+1`. Si ese también estaba excluido, lo intentaba igualmente y Docker rechazaba el bind.
2. **Los puertos Docker no son visibles desde Node.js en Windows con WSL2**: `net.createServer().listen(port)` retornaba "libre" para puertos que Docker ya tenía asignados, porque Docker Desktop en Windows usa su propia pila de red separada del stack TCP de Windows.

### Solución — `backend/src/nodes/nodes.service.ts`

**Nueva función `getDockerAllocatedPorts()`** — consulta `docker ps -a` y extrae todos los puertos mapeados al host:
```typescript
async function getDockerAllocatedPorts(): Promise<number[]> {
  const { stdout } = await execAsync('docker ps -a --format "{{.Ports}}"');
  const ports: number[] = [];
  const re = /:(\d{4,5})->/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stdout)) !== null) ports.push(parseInt(m[1]));
  return ports;
}
```

**`findFreePort` reescrita** — usa un `Set` y función recursiva que salta **todos** los puertos excluidos antes del bind, no solo el primero:
```typescript
function findFreePort(start: number, exclude: number[] = []): Promise<number> {
  const excluded = new Set(exclude);
  const tryPort = (p: number): Promise<number> => {
    if (excluded.has(p)) return tryPort(p + 1);  // salta todos los excluidos
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(p, '0.0.0.0', () => {
        server.close(() => resolve((server.address() as net.AddressInfo).port));
      });
      server.on('error', () => tryPort(p + 1).then(resolve, reject));
    });
  };
  return tryPort(start);
}
```

**`deployPeer` y `getNextFreePort`** — llaman `getDockerAllocatedPorts()` una sola vez y pasan el resultado a todos los `findFreePort`:
```typescript
const dockerPorts = await getDockerAllocatedPorts();
const peerPort   = await findFreePort(9051,  dockerPorts);
const couchPort  = await findFreePort(7984,  [...dockerPorts, peerPort]);
const opsPort    = await findFreePort(10000, [...dockerPorts, peerPort, couchPort]);
```

---

## 29. Corrección de Nodos Duplicados al Desplegar ✅

### Problema
Al desplegar un peer con "Desplegar Peer", aparecían 2 entradas en la tabla de nodos del frontend. El usuario creía que debía usar primero "Agregar Nodo" (para registrar en BD) y luego "Desplegar Peer" (para lanzar el contenedor), generando dos registros para el mismo peer.

### Solución

**Backend — `backend/src/nodes/nodes.service.ts`**: el método `create()` ahora usa `ON CONFLICT (nombre) DO UPDATE` para hacer upsert en lugar de insert ciego:
```typescript
await this.db.query(`
  INSERT INTO nodos_fabric (nombre, endpoint, host_alias, activo)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (nombre) DO UPDATE
    SET endpoint   = EXCLUDED.endpoint,
        host_alias = EXCLUDED.host_alias,
        activo     = EXCLUDED.activo
  RETURNING *`, [dto.nombre, dto.endpoint, dto.hostAlias, dto.activo ?? true]);
```

**Base de datos** — se agrega constraint único para hacerlo imposible a nivel de BD:
```sql
ALTER TABLE nodos_fabric ADD CONSTRAINT nodos_fabric_nombre_unique UNIQUE (nombre);
```

**Limpieza de duplicados existentes** — se identificaron y eliminaron duplicados con endpoints/hostAlias incorrectos:
```sql
-- peer6 tenía host_alias 'peer4.ficct.edu.bo' (incorrecto)
-- peer8 tenía endpoint 'localhost:9054' (contenedor inexistente)
-- peer7 nunca llegó a desplegarse (solo couchdb en estado Created)
DELETE FROM nodos_fabric WHERE id IN (
  'cf47db78-e57f-4dca-8f64-055dd4d832cc',
  'b02520af-c21a-412a-a930-0eca06fce45a'
);
DELETE FROM nodos_fabric WHERE nombre = 'peer7';
docker rm couchdb-peer7
```

**Frontend — `frontend/src/pages/admin/NodesPage.tsx`** — se actualizaron los textos de ambos formularios para dejar claro que son operaciones distintas:
- "Desplegar Peer": genera certificados, inicia Docker, une al canal y **registra automáticamente** el nodo.
- "Agregar Nodo": solo para peers que ya están corriendo en Docker.

---

## 30. Restauración del Filtro de Canal para Votantes ✅

### Problema
Los votantes veían **todas** las elecciones activas sin importar su canal asignado. Un usuario en `evoting-veterinaria` podía ver y votar en la elección de `evoting-ficct`.

### Solución — tres archivos modificados

**`backend/src/elections/elections.service.ts`** — restaurado el `INNER JOIN` en `findCurrentVoterElections`:
```sql
SELECT e.*
FROM elecciones e
INNER JOIN usuario_canales uc ON uc.canal_fabric = e.canal_fabric
WHERE e.id_organizacion = $1
  AND e.estado = 'ACTIVA'
  AND uc.id_usuario = $2
ORDER BY e.creado_en DESC
```

**`backend/src/users/users.service.ts`** — restaurada la verificación de canal en `assertCanVote`, ahora usando `ForbiddenException` (HTTP 403) en lugar de `UnauthorizedException` (401):
```typescript
import { ForbiddenException } from '@nestjs/common';

const channelRes = await this.db.query(`
  SELECT 1 FROM elecciones e
  INNER JOIN usuario_canales uc ON uc.canal_fabric = e.canal_fabric
  WHERE e.id = $1 AND uc.id_usuario = $2 LIMIT 1`, [electionId, userId]);
if (channelRes.rows.length === 0)
  throw new ForbiddenException('No tienes acceso al canal de esta elección');
```

**`frontend/src/api/axios.config.ts`** — el interceptor ahora solo cierra sesión en 401 (token inválido/expirado), no en 403 (sin permiso de canal):
```typescript
if (error.response?.status === 401) {
  localStorage.removeItem('access_token');
  if (!window.location.pathname.startsWith('/elecciones')) {
    window.location.href = '/login';
  }
}
// 403 → el componente maneja el error sin cerrar sesión
```

### Regla de visibilidad
Un votante solo ve una elección si está asignado al canal de esa elección en `usuario_canales`. La asignación se hace desde Admin → Usuarios → Editar → seleccionar canal(es).

---

## 31. Corrección de Pantalla en Blanco "No hay papeletas activas" ✅

### Problema
Al navegar a "Emitir Voto", la pantalla mostraba "No hay papeletas activas" incluso cuando el usuario sí tenía elecciones asignadas. Dos causas:

1. **`useElections` inicializaba `loading = false`**: en el primer render (antes de que llegara la respuesta del API), `elections = []` y `loading = false` → el componente mostraba inmediatamente "No hay papeletas activas" en lugar del spinner.
2. **Los errores del API se silenciaban**: si `GET /elections` fallaba por cualquier razón (500, red), `elections` quedaba en `[]` y el usuario veía el mismo mensaje sin ninguna pista del error real.

### Solución

**`frontend/src/hooks/useElections.ts`** — estado inicial corregido:
```typescript
// ANTES: const [loading, setLoading] = useState(false);
const [loading, setLoading] = useState(true); // muestra spinner hasta que llegue la respuesta
```

**`frontend/src/pages/voter/VotingPage.tsx`** — se agrega bloque de error visible y se mejora el mensaje de estado vacío:
```tsx
if (electionsError) {
  return (
    <div>
      <p>Error al cargar elecciones</p>
      <p>{electionsError}</p>
    </div>
  );
}
if (activeElections.length === 0) {
  return (
    <p>Tu cuenta no está asignada a ningún canal con elección en curso</p>
  );
}
```

---

## 32. Resumen de Archivos Modificados (Sesión 4)

| Archivo | Cambio |
|---------|--------|
| `backend/src/users/users.service.ts` | `assertCanVote`: elimina check de canal (sesión 4a) → restaura con `ForbiddenException` (sesión 4d) |
| `backend/src/nodes/nodes.service.ts` | `getDockerAllocatedPorts()`, `findFreePort` con Set recursivo, `create()` con upsert ON CONFLICT |
| `backend/src/elections/elections.service.ts` | `findCurrentVoterElections` restaura INNER JOIN con `usuario_canales` |
| `frontend/src/api/axios.config.ts` | Interceptor: solo logout en 401, no en 403 |
| `frontend/src/hooks/useElections.ts` | `loading` inicializa en `true` |
| `frontend/src/pages/voter/VotingPage.tsx` | Manejo visible de errores del API, mensaje mejorado de estado vacío |
| `frontend/src/pages/admin/NodesPage.tsx` | Textos descriptivos en formularios "Desplegar Peer" y "Agregar Nodo" |
| Base de datos | `UNIQUE (nombre)` en `nodos_fabric`, limpieza de peer6/peer7/peer8 duplicados |

---

## 33. Estado del Sistema (28 de abril de 2026)

### Nodos activos en Docker y BD
| Peer | Endpoint | Docker |
|------|----------|--------|
| peer0 | localhost:7051 | ✅ Up |
| peer1 | localhost:8051 | ✅ Up |
| peer6 | localhost:9052 | ✅ Up |
| peer8 | localhost:9053 | ✅ Up |

### Canales y elecciones activas
| Canal | Elección activa | Usuarios asignados |
|-------|----------------|--------------------|
| `evoting` | FICCT | — (sin asignaciones) |
| `evoting-ficct` | FICCT2026 | 21900090 |
| `evoting-veterinaria` | Veterinaria 2026 | 21900096 |
| `evoting-uagrm` | — (ninguna activa) | 21900097–100 |

### Flujo completo verificado ✅

1. Admin asigna usuario a canal desde Usuarios → Editar
2. Votante inicia sesión → ve solo las elecciones de su canal
3. Selecciona candidato → confirma → `POST /fabric/vote` → txId registrado en blockchain
4. Si el usuario no está en el canal de la elección → error 403 (no cierra sesión)
5. Resultados en tiempo real disponibles en `/elecciones` (vista pública)

---

*Documento actualizado — Sistema de Votación Blockchain FICCT*
