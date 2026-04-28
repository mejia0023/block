# Guía de Desarrollo - Sistema de Votación Blockchain

## 1. Contexto del Proyecto e Información Académica
- **Proyecto:** E-Voting System (Hyperledger Fabric + NestJS + React).
- **Materia:** Ingeniería de Software II (UAGRM).
- **Stack:** Node.js (NestJS), React (Vite/TS), Hyperledger Fabric (Go/TS), PostgreSQL.
- **Arquitectura:** Monorepo distribuido por servicios (Backend, Frontend, Chaincode).

## 2. Reglas de Interacción (Token Saving)
- **Prohibido el análisis completo:** No leas archivos fuera del alcance de la tarea actual.
- **Respuestas Concisas:** Sin explicaciones de conceptos básicos. Directo a la solución técnica.
- **Código Limpio:** No incluyas comentarios explicativos en el código generado (salvo lógica extremadamente compleja).
- **Lectura Selectiva:** Si el grafo de dependencias es ambiguo, solicita aclaración antes de leer archivos masivos.
- **Ediciones Parciales:** Prioriza el uso de la herramienta `replace` para modificar partes exactas del código en lugar de reescribir archivos completos.

## 3. Comandos Frecuentes (Don't ask, just use)
### Backend
- `cd backend && npm run build` | `npm run lint` | `npm run test`
### Frontend
- `cd frontend && npm run build` | `npm run lint`
### Chaincode
- `cd chaincode && npm run build`
### Raíz
- `npm run seed` (Poblar BD)

## 4. Guía de Estilo y Patrones
- **Principios:** Adherencia estricta a SOLID y DRY.
- **Naming:** 
  - `camelCase` para variables y funciones.
  - `PascalCase` para clases, componentes React e interfaces.
  - `kebab-case` para nombres de archivos.
- **Tipado:** TypeScript estricto. Prohibido el uso de `any`.
- **Estructura NestJS:** Mantener separación clara entre Controller, Service y DTO.

## 5. Recomendaciones de Eficiencia
1. **Contexto Específico:** Referenciar rutas exactas (ej. `backend/src/auth/...`).
2. **Tipos:** Consultar `frontend/src/types/index.ts` antes de proponer cambios en interfaces.
3. **Validación:** Tras cada cambio, ejecutar el comando de `lint` o `build` correspondiente para asegurar integridad sin pedir permiso.
