# Sistema de Votación Electrónica con Blockchain
## Explicación Detallada para Personas sin Conocimientos Técnicos

---

## 📋 Índice

1. [¿Qué es este sistema?](#-qué-es-este-sistema)
2. [¿Por qué usar Blockchain para votar?](#-por-qué-usar-blockchain-para-votar)
3. [Componentes del Sistema (Explicación con Analogías)](#-componentes-del-sistema-explicación-con-analogías)
4. [¿Cómo Funciona el Proceso de Votación?](#-cómo-funciona-el-proceso-de-votación)
5. [Arquitectura Técnica (Paso a Paso)](#-arquitectura-técnica-paso-a-paso)
6. [Funciones del Sistema](#-funciones-del-sistema)
7. [Ejemplo Práctico: Así se Vota](#-ejemplo-práctico-así-se-vota)
8. [Garantías de Seguridad](#-garantías-de-seguridad)
9. [Conclusión](#-conclusión)

---

## 🎯 ¿Qué es este sistema?

Imagina que quieres organizar una elección donde las personas puedan votar de manera **segura**, **transparente** y **sin posibilidad de fraude**. Este sistema es como una **urna digital inteligente** que usa una tecnología llamada **Blockchain** (cadena de bloques) para garantizar que:

- ✅ Cada voto se registre de forma permanente
- ✅ Nadie pueda modificar los votos ya emitidos
- ✅ Cualquiera pueda verificar que su voto fue contado
- ✅ El conteo final sea exacto y confiable

**En términos simples:** Es como tener un libro de actas digital donde cada página (bloque) contiene votos, y una vez que se escribe algo en una página, **ya no se puede borrar ni cambiar**.

---

## 🤔 ¿Por qué usar Blockchain para votar?

### El problema de los sistemas tradicionales

En una elección tradicional (incluso las digitales), existen problemas:

| Problema | Descripción |
|----------|-------------|
| 📝 **Votos modificables** | Alguien con acceso podría cambiar votos en la base de datos |
| 🔒 **Falta de transparencia** | No puedes verificar si tu voto fue contado correctamente |
| 🗑️ **Votos perdidos** | Los sistemas pueden fallar y perder información |
| 👤 **Identificación del votante** | Es difícil garantizar anonimato y evitar votos duplicados |

### La solución Blockchain

Blockchain resuelve estos problemas porque:

1. **Inmutable**: Una vez escrito, no se puede cambiar (como tallar en piedra)
2. **Transparente**: Cualquiera puede verificar lo que está escrito
3. **Descentralizado**: La información está copiada en múltiples lugares
4. **Seguro**: Usa criptografía (códigos matemáticos) para proteger los datos

**Analogía:** Imagina que en lugar de tener un solo libro de actas, tienes **100 copias idénticas** distribuidas en diferentes oficinas. Cada vez que alguien vota, **todas las copias se actualizan al mismo tiempo**. Si alguien intenta cambiar una copia, las otras 99 revelarán el fraude.

---

## 🏗️ Componentes del Sistema (Explicación con Analogías)

### 1. **La Red Blockchain (Hyperledger Fabric)**

Piensa en la red como un **edificio gubernamental** con diferentes oficinas:

```
┌─────────────────────────────────────────────────────────────┐
│                    EDIFICIO ELECTORAL                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   OFICINA   │  │   OFICINA   │  │   OFICINA   │         │
│  │  PEER 0     │  │  PEER 1     │  │  ORDERER    │         │
│  │  (Copia 1)  │  │  (Copia 2)  │  │  (Juez)     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │  ARCHIVO    │  │  ARCHIVO    │                          │
│  │  COUCHDB 0  │  │  COUCHDB 1  │                          │
│  │  (Caja      │  │  (Caja      │                          │
│  │   fuerte)   │  │   fuerte)   │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

| Componente | Función | Analogía |
|------------|---------|----------|
| **Peer 0** | Guarda una copia completa de todos los votos | Como una notaría que tiene copias de todas las actas |
| **Peer 1** | Guarda otra copia idéntica | Otra notaría en diferente ubicación |
| **Orderer** | Organiza los votos en orden cronológico | Como el juez que valida el orden de los eventos |
| **CouchDB** | Almacena los votos de forma organizada | Cajas fuertes donde se guardan las papeletas |
| **CA (Autoridad de Certificados)** | Verifica quién tiene permiso para entrar | La mesa de identificación electoral |

### 2. **El Chaincode (Código Inteligente)**

El **chaincode** es como el **reglamento electoral** escrito en código de computadora. Define las reglas que todos deben seguir:

```javascript
// Reglas principales del chaincode:

1. emitirVoto(voteId, electionId, candidateId)
   → Registra un nuevo voto en el ledger

2. getResultados(electionId)
   → Devuelve el conteo actual de votos

3. verificarVoto(txId)
   → Permite verificar un voto específico usando su recibo
```

**Analogía:** Es como tener un funcionario electoral robotizado que:
- ✅ Solo permite votar una vez por persona
- ✅ Automatically cuenta los votos
- ✅ Entrega un recibo con código de verificación

### 3. **Los Contenedores Docker**

Los **contenedores Docker** son como **cajas mágicas** que permiten que cada componente funcione de manera aislada:

```
┌────────────────────────────────────────────────────────────┐
│                    TU COMPUTADORA                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Peer 0   │ │ Peer 1   │ │ Orderer  │ │  CA      │      │
│  │ 📦       │ │ 📦       │ │ 📦       │ │ 📦       │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ CouchDB0 │ │ CouchDB1 │ │  CLI     │ │Chaincode │      │
│  │ 📦       │ │ 📦       │ │ 📦       │ │ 📦       │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└────────────────────────────────────────────────────────────┘
```

Cada caja (contenedor) tiene su propio espacio y no interfere con las demás.

---

## 🗳️ ¿Cómo Funciona el Proceso de Votación?

### Flujo Completo Paso a Paso

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESO DE VOTACIÓN                          │
│                                                                 │
│  PASO 1: Identificación                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Votante → Sistema de Identificación → UUID Único       │   │
│  │  (Se genera un código único que NO revela tu identidad) │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  PASO 2: Emisión del Voto                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  UUID + Elección + Candidato → Chaincode                │   │
│  │  El chaincode verifica que no hayas votado antes        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  PASO 3: Registro en Blockchain                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Voto → Peer 0 + Peer 1 + Orderer                       │   │
│  │  Se guarda en todas las copias simultáneamente          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  PASO 4: Actualización del Conteo                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Tally (Conteo) → Se actualiza automáticamente          │   │
│  │  Candidato X: +1 voto                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  PASO 5: Recibo de Verificación                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  txId (Transaction ID) → Entregado al votante           │   │
│  │  Con este código puedes verificar tu voto después      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Arquitectura Técnica (Paso a Paso)

### Nivel 1: Infraestructura Física

```
Tu Computadora (Windows con Docker Desktop)
│
├── Procesador: Ejecuta todos los componentes
├── Memoria RAM: 16GB+ recomendados
└── Disco Duro: Almacena los datos de la blockchain
```

### Nivel 2: Contenedores Docker

Cada contenedor es un **servidor virtual** que ejecuta una parte del sistema:

| Contenedor | Puerto | Función |
|------------|--------|---------|
| `ca.ficct.edu.bo` | 7054 | Autoridad de Certificados (identidad) |
| `orderer.ficct.edu.bo` | 7050 | Ordenador de transacciones |
| `peer0.ficct.edu.bo` | 7051 | Nodo principal de la red |
| `peer1.ficct.edu.bo` | 8051 | Nodo secundario (réplica) |
| `couchdb0` | 5984 | Base de datos del Peer 0 |
| `couchdb1` | 6984 | Base de datos del Peer 1 |
| `cli` | - | Consola de administración |

### Nivel 3: Canal de Comunicación

El **canal `evoting`** es como una **sala privada** donde solo los participantes autorizados pueden comunicarse:

```
┌──────────────────────────────────────────────────────────────┐
│                    CANAL "EVOTING"                           │
│                                                              │
│   ┌──────────┐                        ┌──────────┐          │
│   │  Peer 0  │ ←───────────────────→ │  Peer 1  │          │
│   └──────────┘    Comunicación        └──────────┘          │
│                     Privada                                │
│                          ↑                                 │
│                          │                                 │
│                   ┌──────────────┐                         │
│                   │   Orderer    │                         │
│                   │  (Coordina)  │                         │
│                   └──────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

### Nivel 4: Chaincode (Lógica de Negocio)

El chaincode está escrito en **TypeScript** (un lenguaje de programación) y contiene:

```typescript
// Estructura de un Voto
interface VoteAsset {
  assetType: 'vote';           // Tipo de activo
  id: string;                   // UUID único del voto
  electionId: string;           // Identificador de la elección
  candidateId: string;          // Candidato seleccionado
  timestamp: string;            // Fecha y hora del voto
  txId: string;                 // ID de la transacción (recibo)
}

// Estructura del Conteo
interface TallyAsset {
  assetType: 'tally';           // Tipo de activo
  electionId: string;           // Identificador de la elección
  results: Record<string, number>; // Conteo por candidato
  lastUpdated: string;          // Última actualización
}
```

### Nivel 5: Almacenamiento en Ledger

El **ledger** (libro mayor) es donde se guarda todo:

```
┌─────────────────────────────────────────────────────────────┐
│                      LEDGER (LIBRO MAYOR)                   │
│                                                             │
│  BLOQUE 1 (Génesis)                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Configuración inicial del canal                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  BLOQUE 2                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Voto: vote-001 → candidato-1 | txId: abc123...      │   │
│  │ Voto: vote-002 → candidato-2 | txId: def456...      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  BLOQUE 3                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Voto: vote-003 → candidato-1 | txId: ghi789...      │   │
│  │ ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Funciones del Sistema

### 1. `emitirVoto(voteId, electionId, candidateId)`

**¿Qué hace?** Registra un nuevo voto en la blockchain.

**Proceso interno:**

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: Verificar que el voto no exista                   │
│  → Busca en el ledger si ya hay un voto con ese voteId     │
│  → Si existe → ERROR: "Voto ya fue emitido"                │
│  → Si no existe → Continuar                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: Crear el activo de voto                            │
│  → Genera un objeto con:                                    │
│    - ID del voto                                            │
│    - ID de la elección                                      │
│    - Candidato seleccionado                                 │
│    - Timestamp (fecha/hora)                                 │
│    - txId (recibo de la transacción)                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: Guardar en el ledger                               │
│  → Escribe en la blockchain: VOTE_{voteId} = datos del voto │
│  → Crea índice inverso: TXID_{txId} = voteId                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 4: Actualizar el conteo (Tally)                       │
│  → Busca el conteo actual de la elección                    │
│  → Suma 1 voto al candidato seleccionado                    │
│  → Guarda el nuevo conteo actualizado                       │
└─────────────────────────────────────────────────────────────┘
```

**Ejemplo de uso:**
```
emitirVoto("vote-001", "eleccion-presidente-2026", "candidato-A")
```

### 2. `getResultados(electionId)`

**¿Qué hace?** Devuelve el conteo actual de votos para una elección.

**Proceso interno:**

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: Buscar el tally en el ledger                       │
│  → Busca: TALLY_{electionId}                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: Verificar si existe                                │
│  → Si NO existe → Devuelve conteo vacío (0 votos)           │
│  → Si existe → Continuar                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: Devolver resultados                                │
│  → Retorna JSON con el conteo por candidato                 │
└─────────────────────────────────────────────────────────────┘
```

**Ejemplo de resultado:**
```json
{
  "assetType": "tally",
  "electionId": "eleccion-presidente-2026",
  "results": {
    "candidato-A": 150,
    "candidato-B": 120,
    "candidato-C": 80,
    "votos_blancos": 25,
    "votos_nulos": 10
  },
  "lastUpdated": "2026-04-27T10:30:00.000Z"
}
```

### 3. `verificarVoto(txId)`

**¿Qué hace?** Permite verificar un voto específico usando el ID de transacción (recibo).

**Proceso interno:**

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: Buscar el voteId usando el txId                    │
│  → Busca: TXID_{txId}                                       │
│  → Si no existe → ERROR: "Transacción no encontrada"        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: Buscar los datos del voto                          │
│  → Busca: VOTE_{voteId}                                     │
│  → Si no existe → ERROR: "Voto no encontrado"               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: Devolver los datos del voto                        │
│  → Retorna toda la información del voto                     │
│  → El votante puede verificar que su voto está registrado   │
└─────────────────────────────────────────────────────────────┘
```

**Importante:** Esta función garantiza el **anonimato** porque:
- El `txId` no revela la identidad del votante
- El `voteId` es un UUID aleatorio (no contiene información personal)
- Cualquiera puede verificar, pero nadie puede saber quién votó por quién

---

## 📝 Ejemplo Práctico: Así se Vota

### Escenario: Elección de Representante Estudiantil

**Candidatos:**
- María González (candidata-1)
- Juan Pérez (candidato-2)
- Votos en blanco (votos_blancos)
- Votos nulos (votos_nulos)

### Paso 1: El votante se identifica

```
Votante: "Soy Pedro Ramírez, quiero votar"
Sistema de Identificación: genera UUID → "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

⚠️ **Importante:** Este UUID **NO** contiene el nombre ni información personal de Pedro. Es un código completamente aleatorio.

### Paso 2: Pedro emite su voto

```
Votante: "Quiero votar por María González"
Sistema: emitirVoto("a1b2c3d4-...", "eleccion-representante-2026", "candidata-1")
```

### Paso 3: La blockchain procesa el voto

```
┌─────────────────────────────────────────────────────────────┐
│                    PROCESAMIENTO                            │
│                                                             │
│  Peer 0: "Verificando que no haya votado antes..." ✓       │
│  Peer 1: "Verificando que no haya votado antes..." ✓       │
│  Orderer: "Ordenando transacción en el bloque..." ✓        │
│                                                             │
│  Chaincode: "Registrando voto..." ✓                        │
│  CouchDB: "Actualizando base de datos..." ✓                │
│  Tally: "candidata-1 ahora tiene 1 voto" ✓                 │
│                                                             │
│  Resultado: txId = "9f8e7d6c5b4a3210..."                   │
└─────────────────────────────────────────────────────────────┘
```

### Paso 4: Pedro recibe su recibo

```
┌─────────────────────────────────────────────────────────────┐
│              RECIBO DE VOTACIÓN                             │
│                                                             │
│  Transacción ID: 9f8e7d6c5b4a3210...                       │
│  Fecha: 27/04/2026 10:30:00                                │
│                                                             │
│  Con este código puedes verificar tu voto en:              │
│  https://verificacion.eleccion.edu.bo                      │
└─────────────────────────────────────────────────────────────┘
```

### Paso 5: Pedro verifica su voto (opcional)

```
Pedro (en casa): "Quiero verificar que mi voto fue contado"
Ingresa txId: "9f8e7d6c5b4a3210..."

Sistema: verificarVoto("9f8e7d6c5b4a3210...")

Resultado:
{
  "assetType": "vote",
  "electionId": "eleccion-representante-2026",
  "candidateId": "candidata-1",
  "timestamp": "2026-04-27T10:30:00.000Z",
  "txId": "9f8e7d6c5b4a3210..."
}

Pedro: "¡Perfecto! Mi voto está registrado correctamente"
```

⚠️ **Nota:** Pedro puede verificar QUE votó, pero el sistema NO revela POR QUIÉN votó (eso sería romper el anonimato).

### Paso 6: Resultados en tiempo real

Cualquier persona puede consultar los resultados:

```
Sistema: getResultados("eleccion-representante-2026")

Resultado:
{
  "candidata-1": 1547,
  "candidato-2": 1203,
  "votos_blancos": 89,
  "votos_nulos": 34
}

Total votos: 2873
```

---

## 🔐 Garantías de Seguridad

### 1. Inmutabilidad

**¿Qué significa?** Una vez que un voto se registra, **no se puede cambiar**.

**¿Cómo funciona?**
```
┌─────────────────────────────────────────────────────────────┐
│  BLOQUE ACTUAL (con votos)                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Hash: abc123...                                     │   │
│  │ Voto 1: candidato-A                                 │   │
│  │ Voto 2: candidato-B                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│              Hash del bloque anterior                       │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ BLOQUE ANTERIOR                                      │   │
│  │ Hash: def456... ← Este hash está guardado            │   │
│  │ en el bloque actual                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

Si alguien intenta cambiar un voto en el Bloque Actual:
1. El hash del bloque cambiaría
2. El siguiente bloque ya no coincidiría
3. La red detectaría la inconsistencia
4. El cambio sería rechazado

### 2. Descentralización

**¿Qué significa?** La información está en múltiples lugares.

```
┌─────────────────────────────────────────────────────────────┐
│                    RED DESCENTRALIZADA                      │
│                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│   │  Peer 0  │    │  Peer 1  │    │  Orderer │            │
│   │  ✅      │    │  ✅      │    │  ✅      │            │
│   │  Copia   │    │  Copia   │    │  Copia   │            │
│   │  Completa│    │  Completa│    │  Completa│            │
│   └──────────┘    └──────────┘    └──────────┘            │
│                                                             │
│   Si Peer 0 falla → Peer 1 sigue funcionando               │
│   Si Peer 1 falla → Peer 0 sigue funcionando               │
│   Si Orderer falla → Se elige nuevo orderer                │
└─────────────────────────────────────────────────────────────┘
```

### 3. Consenso

**¿Qué significa?** Todos los nodos deben estar de acuerdo.

```
Proceso de validación:

Voto nuevo → Peer 0 valida → Peer 1 valida → Orderer ordena

Si Peer 0 dice "VOTO VÁLIDO" ✓
Si Peer 1 dice "VOTO VÁLIDO" ✓
→ Voto se registra en la blockchain

Si Peer 0 dice "VOTO VÁLIDO" ✓
Si Peer 1 dice "VOTO DUPLICADO" ✗
→ Voto es RECHAZADO
```

### 4. Criptografía

**¿Qué significa?** Los datos están protegidos con matemáticas avanzadas.

```
┌─────────────────────────────────────────────────────────────┐
│                    PROTECCIÓN CRIPTOGRÁFICA                 │
│                                                             │
│  TLS (Transport Layer Security):                           │
│  → Todas las comunicaciones están encriptadas              │
│  → Como HTTPS en tu navegador                              │
│                                                             │
│  Certificados Digitales:                                   │
│  → Cada componente tiene su propia identidad               │
│  → Nadie puede hacerse pasar por otro                      │
│                                                             │
│  Hashing:                                                  │
│  → Cada bloque tiene una "huella digital" única            │
│  → Cualquier cambio altera la huella                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Resumen Visual del Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SISTEMA DE VOTACIÓN BLOCKCHAIN               │
│                                                                     │
│  VOTANTE                                                           │
│     │                                                              │
│     ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  1. IDENTIFICACIÓN                                          │   │
│  │     → Generación de UUID único (sin datos personales)       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│     │                                                              │
│     ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  2. EMISIÓN DEL VOTO                                        │   │
│  │     → Votante selecciona candidato                          │   │
│  │     → Sistema crea transacción                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│     │                                                              │
│     ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  3. VALIDACIÓN (Chaincode)                                  │   │
│  │     → ¿Ya votó este UUID? NO → Continuar                    │   │
│  │     → ¿Datos válidos? SI → Continuar                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│     │                                                              │
│     ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  4. CONSENSO (Peers)                                        │   │
│  │     → Peer 0 valida transacción ✓                           │   │
│  │     → Peer 1 valida transacción ✓                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│     │                                                              │
│     ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  5. ORDENAMIENTO (Orderer)                                  │   │
│  │     → Ordena transacciones en bloque                        │   │
│  │     → Crea nuevo bloque                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│     │                                                              │
│     ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  6. REGISTRO (Ledger + CouchDB)                             │   │
│  │     → Guarda voto en blockchain                             │   │
│  │     → Actualiza base de datos                               │   │
│  │     → Actualiza conteo (Tally)                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│     │                                                              │
│     ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  7. RECIBO (txId)                                           │   │
│  │     → Entrega código de verificación al votante             │   │
│  │     → Votante puede verificar después                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎓 Conclusión

Este sistema de votación blockchain es como tener:

1. **Una urna de cristal** → Todos pueden ver que hay votos dentro
2. **Un notario digital** → Verifica que cada persona vote solo una vez
3. **Un libro de actas inmutable** → Una vez escrito, no se puede cambiar
4. **100 copias idénticas** → Si una se pierde, las demás mantienen la información
5. **Un recibo de verificación** → Cada votante puede confirmar que su voto fue contado

### Beneficios Clave

| Beneficio | Descripción |
|-----------|-------------|
| 🔒 **Seguridad** | Imposible de hackear (requeriría hackear todos los nodos simultáneamente) |
| 👁️ **Transparencia** | Cualquiera puede auditar los resultados |
| 🤐 **Anonimato** | Nadie puede saber por quién votaste |
| ✅ **Verificabilidad** | Puedes confirmar que tu voto fue contado |
| 📊 **Tiempo Real** | Resultados disponibles inmediatamente |
| 🔄 **Disponibilidad** | El sistema sigue funcionando aunque fallen componentes |

### ¿Por qué es importante?

En un mundo donde la **confianza en las instituciones** es cada vez más cuestionada, la tecnología blockchain ofrece una manera de realizar elecciones donde:

- **No necesitas confiar en una persona** → Confías en las matemáticas
- **No necesitas confiar en un servidor** → Confías en la red descentralizada
- **No necesitas tomar la palabra de nadie** → Puedes verificar tú mismo

---

## 📚 Glosario de Términos

| Término | Significado Simple |
|---------|-------------------|
| **Blockchain** | Libro de actas digital que no se puede modificar |
| **Bloque** | Página del libro que contiene varios votos |
| **Ledger** | El libro completo de todos los votos |
| **Peer** | Computadora que guarda una copia completa |
| **Orderer** | Computadora que organiza los votos en orden |
| **Chaincode** | Reglamento electoral escrito en código |
| **TxId** | Recibo de tu transacción (voto) |
| **UUID** | Código único que no revela tu identidad |
| **Consenso** | Acuerdo entre todas las computadoras |
| **Criptografía** | Códigos matemáticos que protegen datos |
| **Inmutable** | Que no se puede cambiar |
| **Descentralizado** | Que no depende de un solo lugar |

---

---

# Sección 2 — Integración Técnica Real con Blockchain (27 de abril de 2026)

Esta sección documenta cómo se conectó el backend NestJS con Hyperledger Fabric de forma funcional, los errores encontrados y las soluciones aplicadas.

---

## Arquitectura de Comunicación Backend ↔ Fabric

```
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (NestJS)                            │
│                                                                 │
│  ElectionsService                                               │
│       │  al cambiar estado → ACTIVA                            │
│       ▼                                                         │
│  FabricService.initEleccion(electionId)                        │
│       │                                                         │
│       ▼                                                         │
│  fabric-gateway SDK                                             │
│       │  getContract('evoting-cc', 'FicctVoting')              │
│       │  submitTransaction('initEleccion', electionId)         │
│       ▼                                                         │
│  peer0.ficct.edu.bo:7051 (o peer1:8051)                        │
│       │                                                         │
│       ▼                                                         │
│  Chaincode VotingContract (FicctVoting)                        │
│       │  initEleccion → crea election:{id} en el ledger        │
│       │  emitirVoto   → valida election, registra voto         │
│       │  getResultados → lee tally:{electionId}                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ciclo de Vida de una Elección en el Ledger

```
PROGRAMADA → ACTIVA:
  Backend llama initEleccion(id)
  Chaincode crea:  election:{id} = { status: 'ACTIVA', ... }

ACTIVA (votación):
  Backend llama emitirVoto(voteId, electionId, candidateId)
  Chaincode:
    1. Lee election:{id} → verifica que esté ACTIVA
    2. Crea     vote:{voteId} = { electionId, candidateId, txId, ... }
    3. Actualiza tally:{electionId}.results[candidateId] += 1

ACTIVA → CERRADA:
  Backend llama cerrarEleccion(id)
  Chaincode actualiza election:{id}.status = 'CERRADA'
```

---

## Claves del Ledger (World State en CouchDB)

| Prefijo de clave | Contenido |
|-----------------|-----------|
| `election:{uuid}` | Estado y metadatos de la elección |
| `vote:{uuid}` | Voto individual con candidato, elección y txId |
| `tally:{uuid}` | Conteo acumulado por candidato para una elección |

---

## Por Qué el Chaincode Necesita el Nombre del Contrato

`VotingContract` extiende `Contract` con nombre explícito:

```typescript
export class VotingContract extends Contract {
  constructor() {
    super('FicctVoting');   // nombre del namespace
  }
}
```

El SDK `fabric-gateway` necesita este nombre para enrutar:

```typescript
// SIN nombre (INCORRECTO — falla silenciosamente o devuelve null):
network.getContract('evoting-cc')

// CON nombre (CORRECTO):
network.getContract('evoting-cc', 'FicctVoting')
```

---

## Por Qué la CA REST API No Funciona con Cryptogen

Hyperledger Fabric CA tiene dos modos de operación:

| Modo | Cómo se emiten los certificados | Token de autenticación |
|------|---------------------------------|------------------------|
| **Cryptogen** | `cryptogen generate` (offline) | Certificados NO reconocidos por CA |
| **Fabric CA** | `fabric-ca-client enroll` (online) | Certificados emitidos por la CA |

En esta red se usa `cryptogen` para el material criptográfico, pero el contenedor
`ca.ficct.edu.bo` también está corriendo. La REST API de la CA rechaza tokens
firmados con certificados de cryptogen porque no los emitió ella.

**Solución:** `listIdentities()` y `listCertificates()` leen directamente del filesystem
`crypto-material/peerOrganizations/...` sin pasar por la REST API.

---

## Flujo de Creación de Canal (Sin WSL)

```
Usuario → POST /channels

Backend:
  1. docker cp configtx.yaml → cli:/tmp/configtx.yaml
  2. docker exec cli configtxgen
       -profile EvotingChannel
       -outputCreateChannelTx /channel-artifacts/{name}.tx
       -channelID {name}
  3. docker exec cli peer channel create
       -o orderer.ficct.edu.bo:7050
       -c {name} -f /channel-artifacts/{name}.tx
       → genera /channel-artifacts/{name}.block
  4. docker exec cli peer channel join
       -b /channel-artifacts/{name}.block
  5. (opcional) peer lifecycle chaincode approveformyorg
  6. (opcional) peer lifecycle chaincode commit
  7. INSERT INTO canales_fabric
```

Todo via Node.js `child_process.exec` sin pasar por WSL ni scripts bash externos.

---

## Auto-detección de Puerto Libre para Nuevos Nodos

```
GET /nodes/free-port

1. Consulta BD: SELECT endpoint FROM nodos_fabric
2. Extrae puertos usados: regex /:(\d+)$/
3. Excluye puertos reservados Fabric:
   7050 (orderer), 7051 (peer0), 7052 (peer0-cc),
   7054 (CA), 8051 (peer1), 8052 (peer1-cc), 17050 (orderer metrics)
4. Llama net.createServer().listen(port) desde 9051
   → si el puerto responde, avanza al siguiente
5. Retorna: { port, endpoint: "localhost:{port}",
              hostAlias: "peer{n}.ficct.edu.bo", nombre: "peer{n}" }
```

El frontend llama este endpoint al abrir el formulario "Agregar Nodo"
y pre-rellena los campos automáticamente.

---

## Comandos de Verificación del Chaincode

Ejecutar dentro del CLI de Docker para confirmar que el chaincode está correcto:

```bash
# Ver chaincode instalado
docker exec cli peer lifecycle chaincode queryinstalled

# Ver chaincode confirmado en el canal
docker exec cli peer lifecycle chaincode querycommitted \
  --channelID evoting --name evoting-cc

# Invocar initEleccion manualmente (prueba)
docker exec cli peer chaincode invoke \
  -o orderer.ficct.edu.bo:7050 --tls \
  --cafile /crypto/ordererOrganizations/ficct.edu.bo/orderers/orderer.ficct.edu.bo/msp/tlscacerts/tlsca.ficct.edu.bo-cert.pem \
  -C evoting -n evoting-cc \
  -c '{"function":"FicctVoting:initEleccion","Args":["test-election-id"]}'

# Consultar resultados
docker exec cli peer chaincode query \
  -C evoting -n evoting-cc \
  -c '{"function":"FicctVoting:getResultados","Args":["test-election-id"]}'
```

---

## Variables de Entorno del Backend (`.env`)

```env
# Conexión al peer (puede ser peer0:7051 o peer1:8051)
FABRIC_PEER_ENDPOINT=localhost:8051
FABRIC_PEER_HOST_ALIAS=peer1.ficct.edu.bo

# Ruta al crypto-material generado por cryptogen
FABRIC_CRYPTO_PATH=C:/Disco D/.../fabric/network/crypto-material

# Canal principal
FABRIC_CHANNEL_NAME=evoting

# Nombre del chaincode desplegado
FABRIC_CHAINCODE_NAME=evoting-cc
```

---

*Documento actualizado — Integración Blockchain Real — Ingeniería en Software II — 1er Parcial*

*Fecha: 27 de abril de 2026*
