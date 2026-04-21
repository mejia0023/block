contexto
El sistema separa responsabilidades: PostgreSQL gestiona identidad y reglas, mientras que Hyperledger Fabric garantiza la inmutabilidad del voto.
El anonimato se logra eliminando cualquier identificador del votante antes de registrar la transacción en blockchain, usando hashes irreversibles.
Cada voto es validado por múltiples nodos peer bajo una política de consenso, y registrado en CouchDB como estado mundial.
El backend NestJS actúa como intermediario seguro, evitando doble votación mediante control transaccional y emitiendo un comprobante único (txId) verificable en el ledger.

1 ya se descargo:
docker pull couchdb:latest
Levantar el contenedor: Para probarlo rápidamente, ejecuta el siguiente comando:

Bash
docker run -d --name my-couchdb -p 5984:5984 -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password couchdb
-p 5984:5984: Mapea el puerto del contenedor a tu máquina.

-e: Define el usuario y contraseña de administrador.


2.stack tecnologico
flutter para el movil
PostgreSQL 
    nombre: ficct_evoting_db
    username:postgres
    password:postgres
React:frontend con vite y typescript
NestJs:Backend con node.js
CouchDB (Fabric): Guarda los votos anónimos en formato JSON y el conteo inmutable.
El Ledger (Blockchain): Guarda la historia criptográfica y auditable de que el voto ocurrió, sin revelar de quién es.


PostgreSQL (Base central tradicional)
Usuarios (RU, login)
Elecciones (metadata)
Candidatos
Estado de votación (has_voted)
Logs de sincronización (tx_id)
CouchDB (dentro de Hyperledger Fabric)
SOLO:
votos (JSON)
resultados (tally)
NO usuarios
NO autenticación

### 2. Arquitectura Backend y Blockchain (Hyperledger Fabric)
El corazón del proyecto requiere definir cómo se estructurará la red para reflejar la realidad de la facultad.

* **Canales (Channels):** Puedes crear un único canal para toda la FICCT, o canales separados si hay elecciones de directores de carrera simultáneas y quieres aislar los datos.
* **Smart Contracts (Chaincode):** Aquí residirá la lógica de negocio. Debes programar funciones estrictas para: `iniciarEleccion()`, `registrarCandidato()`, `emitirVoto()` y `contabilizarResultados()`.
* **Privacidad del Voto:** Usarás el **MSP (Membership Service Provider)** de Fabric para validar que un usuario tiene permiso para votar. Sin embargo, el *chaincode* debe estar diseñado para separar la identidad del votante de su elección en el registro final (Ledger), garantizando el anonimato.
fuciones importantes
verificarVoto(txId)
getResultados(electionId)
cerrarEleccion()
validarEleccionActiva()
###3 cautnao tipso de nodos existe
al menos 6 nodos principales:
4 Peers (uno por carrera)
1 Orderer
1 CA emite las "identidades". Es el encargado de generar los certificados digitales tanto para los otros nodos como para los usuarios (estudiantes) que NestJS registrará.

###modulos
Para que tu defensa sea clara y directa, aquí tienes el resumen ejecutivo de cada módulo. Imagina que cada uno es una pieza del engranaje que garantiza que nadie haga fraude.



### 1. Módulo de Identidad (IAM)
**"El Portero Digital"**
* **Función:** Valida que quien entra sea realmente un estudiante de la FICCT.
* **En NestJS:** Verifica el R.U. y contraseña contra **PostgreSQL**.
* **En Fabric:** Si el usuario es válido, le pide a la **CA** (Certificate Authority) que le asigne una "identidad digital" única para que pueda interactuar con la Blockchain.
* **Dato clave:** Aquí nace la seguridad; sin certificado, no hay voto.

### 2. Módulo de Gestión (Admin)
**"El Organizador de la Elección"**
* **Interfaz:** React (Vite).
* **Función:** El Comité Electoral configura las reglas: fecha, cargos (Decano, Director) y frentes.
* **Control Maestro:** Tiene el "interruptor" para abrir o cerrar la urna digital. Al cerrar la elección, se dispara el proceso de conteo inmutable en el Smart Contract.

### 3. Módulo de Votación (Cliente)
**"El Cuarto Oscuro Virtual"**
* **Interfaz:** Flutter (Móvil).
* **Anonimato:** El sistema recibe el voto, pero **rompe el vínculo** con el R.U. del estudiante. La Blockchain registra: *"Un estudiante de Sistemas votó"*, pero no dice quién.
* **Comprobante:** Al finalizar, entrega un **TX ID (Hash)** al estudiante. Es su recibo digital para verificar que su voto entró en el bloque.



### 4. Módulo de Auditoría (Escrutinio)
**"El Ojo de los Frentes"**
* **Transparencia:** Permite a delegados y alumnos ver cómo crecen los bloques en tiempo real a través de **Hyperledger Explorer**.
* **Conteo:** Los resultados no se calculan en el servidor de NestJS, se consultan directamente al **Ledger**. Esto garantiza que el número final sea matemáticamente imposible de alterar sin el consenso de los nodos (Sistemas, Informática, Redes).



estrutjutu de carpetas del frontend
frontend/src/
├── api/                            # Configuración de Clientes
│   └── axios.config.ts             # Instancia de Axios con Interceptor para el JWT
│
├── assets/                         # Imágenes, logos de la FICCT y estilos globales
│
├── components/                     # Componentes reutilizables (UI)
│   ├── common/                     # Botones, Inputs, Spinners de carga
│   ├── layout/                     # Navbar, Sidebar, Footer del Admin
│   └── voting/                     # Cards de candidatos, Modal de confirmación
│
├── hooks/                          # Lógica extraída (Custom Hooks)
│   ├── useAuth.ts                  # Manejo del estado del login y permisos
│   └── useElections.ts             # Fetching de datos de elecciones y resultados
│
├── pages/                          # Vistas completas (Rutas)
│   ├── admin/                      # --- ROL ADMINISTRADOR ---
│   │   ├── Dashboard.tsx           # Resumen general del sistema
│   │   ├── ElectionManager.tsx     # Crear/Editar elecciones y candidatos
│   │   └── AuditLogs.tsx           # Ver transacciones de la Blockchain (Sync logs)
│   ├── public/                     # --- ROL PÚBLICO / AUDITOR ---
│   │   ├── LiveResults.tsx         # Gráficos en tiempo real del conteo inmutable
│   │   └── Login.tsx               # Acceso al sistema
│   └── Unauthorized.tsx            # Error 403 para accesos no permitidos
│
├── routes/                         # Configuración de React Router
│   └── AppRouter.tsx               # Definición de rutas protegidas por Rol
│
└── store/                          # Estado Global (Zustand o Context API)
    └── auth.store.ts               # Guardar datos del admin/usuario logueado      # Lógica reutilizable

estructurará de carpetas del backend
backend/src/
├── app.module.ts                   # Módulo raíz que integra todo
├── main.ts                         # Punto de entrada de la aplicación
│
├── auth/                           # Gestión de sesiones y seguridad
│   ├── auth.service.ts             # Lógica de validación de RU y Password (Bcrypt)
│   ├── auth.controller.ts          # Endpoints: /auth/login
│   ├── jwt.strategy.ts             # Configuración de protección de rutas con Token
│   └── dto/                        # Objetos para validar entrada de Login
│
├── users/                          # Gestión de Estudiantes/Docentes (PostgreSQL)
│   ├── user.entity.ts              # Definición de la tabla 'users' (TypeORM)
│   ├── users.service.ts            # Buscar usuarios, marcar "has_voted" en TRUE
│   └── users.controller.ts         # Endpoints para el perfil del usuario
│
├── elections/                      # Gestión Administrativa (PostgreSQL)
│   ├── election.entity.ts          # Definición de tabla 'elections'
│   ├── candidate.entity.ts         # Definición de tabla 'candidates'
│   ├── elections.service.ts        # CRUD de elecciones y candidatos
│   └── elections.controller.ts     # Endpoints para el panel del Admin
│
├── fabric/                         # INTERFAZ CON BLOCKCHAIN (Hyperledger SDK)
│   ├── fabric.service.ts           # Lógica pesada: Conexión al Gateway y Network
│   ├── ca.service.ts               # Registro y enrolamiento de usuarios en la CA
│   ├── fabric.controller.ts        # Endpoints: /fabric/vote, /fabric/results
│   ├── fabric.constants.ts         # Nombres de canales y nombres de chaincode
│   └── wallets/                    # Almacenamiento físico de certificados (.id)
│
└── chaincode/                      # Contratos Inteligentes (Lógica de la Urna)
    ├── voting.contract.ts          # Funciones: emitirVoto(), getTally(), initLedger()
    └── models/                     # Interfaces JSON para Voto y Tally en CouchDB

base de datos fifct_evotiina


-- Definición de tipos ENUM
CREATE TYPE career_type AS ENUM ('SISTEMAS', 'INFORMATICA', 'REDES', 'ROBOTICA');
CREATE TYPE role_type AS ENUM ('ESTUDIANTE', 'DOCENTE', 'ADMIN');
CREATE TYPE position_type AS ENUM ('DECANO', 'DIRECTOR_SISTEMAS', 'DIRECTOR_INFORMATICA', 'DIRECTOR_REDES', 'DIRECTOR_ROBOTICA');
CREATE TYPE election_status AS ENUM ('PROGRAMADA', 'ACTIVA', 'CERRADA', 'ESCRUTADA');

### 2. Creación de Tablas
He añadido algunas restricciones básicas como `NOT NULL` y valores por defecto para asegurar que la base de datos sea robusta.

#### Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ru VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    career career_type NOT NULL,
    role role_type NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    has_voted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

#### Tabla de Candidatos / Frentes
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    front_name VARCHAR(100) NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    position position_type NOT NULL,
    photo_url TEXT,
        mission TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

#### Tabla de Procesos Electorales

CREATE TABLE elections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status election_status DEFAULT 'PROGRAMADA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Validación simple: la fecha de fin no puede ser menor a la de inicio
    CONSTRAINT check_dates CHECK (end_date > start_date)
);
CREATE TABLE blockchain_sync_logs (
    id SERIAL PRIMARY KEY,
    election_id UUID REFERENCES elections(id),
    tx_id TEXT UNIQUE, -- El ID que devuelve Fabric
    status TEXT, -- 'CONFIRMED', 'FAILED'
    created_at TIMESTAMP DEFAULT NOW()
);
BASE DE DATOS Fabric

//Fabric Datase
//Voto
{
  "assetType": "vote",
  "id": "voto_hash_uagrm_123...", 
  "electionId": "uuid_de_la_eleccion",
  "candidateId": "uuid_del_candidato",
  "timestamp": "2026-04-20T14:30:00Z",
  "txId": "id_de_transaccion_blockchain"
}
//ElectionResult

{
  "assetType": "tally",
  "electionId": "uuid_de_la_eleccion",
  "results": {
    "candidato_id_1": 1500,
    "candidato_id_2": 1200,
    "votos_blancos": 50,
    "votos_nulos": 20
  },
  "lastUpdated": "2026-04-20T14:35:00Z"
}


###Actorres del sistema
Actor,Responsabilidad Principal,Interfaz,Acción en Fabric
Administrador (Comité Electoral),"Configura la elección, sube candidatos y habilita el padrón.",React (Admin),Ejecuta initLedger y registra candidatos en CouchDB.
Votante (Estudiante/Docente),Emite un voto único y anónimo.,Flutter,Ejecuta emitirVoto (Invoke).
Delegado de Frente (Auditor),Observa que el proceso sea limpio sin ver por quién votó cada uno.,React (Dashboard),Solo lectura (queryVotos).
Operador de Red (TI FICCT),Mantiene los nodos Peer y la CA encendidos.,CLI / Docker,Administra la infraestructura (no toca los votos).



Falta el flujo completo de votación
Corrección (flujo claro)
Flujo real del voto:
Login (React / Flutter)
NestJS valida usuario (PostgreSQL)
NestJS consulta:
has_voted = false
NestJS solicita identidad a Fabric CA
Usuario vota
NestJS:
genera hash anónimo
llama a emitirVoto() en Fabric
Fabric:
guarda voto en CouchDB
genera txId
NestJS:
guarda txId en PostgreSQL
marca has_voted = true
Usuario recibe:
comprobante txId


###política de consenso
Política de endorsement:

Al menos 2 de 4 peers deben validar una transacción

###seguridad en backend
Transacciones en DB:
BEGIN;
SELECT has_voted FOR UPDATE;
UPDATE users SET has_voted = true;
COMMIT;

👉 Evita doble voto por race condition

###Auditoría
El auditor puede:

Ver número total de votos
Ver txId
Ver integridad de bloques
NO ver identidad del votante

##rol de Flutter vs React
Flutter → votación (usuarios)
React → administración + auditoría

#FALTA PROTEGER EL HASH (ahora mismo es débil)
✔ Corrección (importante)

Debes usar:

salt secreto del sistema
o mejor:
UUID aleatorio

👉 Mejor opción:

voteId = uuidv4()

o

voteId = sha256(RU + timestamp + SECRET_KEY)

👉 Y decir:

Se utiliza un salt secreto del servidor para evitar correlación o ataques de reconstrucción del voto.


##CONTEO ES EN TIEMPO REAL O FINAL
conteo en tiempo real en chaincode

##QUÉ PASA SI FALLA FABRIC
🔁 Flujo correcto (transaccional real)
Usuario vota
NestJS:
genera voto
envía a Fabric
Fabric responde txId
RECIÉN AHÍ:
guardar has_voted = true
guardar txId

👉 Y además:

Tabla:

status: 'PENDING' | 'CONFIRMED' | 'FAILED'