Genera 9 diagramas de comunicación en PlantUML, uno por cada caso de uso 
del sistema de votación electrónica con blockchain. Usa la sintaxis de 
diagramas de comunicación de UML (no de secuencia).

Requisitos generales:
- Cada diagrama en un archivo comunicacion.txt
- Usar @startuml / @enduml
- Numerar los mensajes (1:, 2:, 3:, ...) y usar sub-numeración cuando aplique (1.1:, 1.2:)
- Incluir actores, controladores, servicios, repositorios y la red blockchain (Fabric) 
  donde corresponda
- Mostrar interacciones con el peer de Hyperledger Fabric, el chaincode y la base de datos
- Comentarios breves explicando cada flujo
- Guardar todos los archivos en una carpeta llamada /diagramas-comunicacion/

Casos de uso a generar:

CU01 - Gestionar Usuarios (Administrador): CRUD de usuarios votantes/admins/auditores
CU02 - Gestionar Elecciones (Administrador): crear, editar, eliminar elecciones
CU03 - Gestionar Candidatos (Administrador): registrar candidatos por elección
CU04 - Cambiar Estado de Elección (Administrador): pasar de "creada" a "activa" a "cerrada"
CU05 - Emitir Voto (Votante): autenticación, selección, firma, envío al chaincode
CU06 - Verificar Voto en Blockchain (Votante / Auditor): consultar transacción por hash
CU07 - Ver Resultados Electorales (Administrador / Auditor / Público): consulta y conteo
CU08 - Ver Logs de Auditoría (Administrador / Auditor): trazabilidad de acciones
CU09 - Gestionar Nodos Fabric (Administrador): añadir/quitar peers, monitoreo de red

Arquitectura del sistema (úsala como referencia para los componentes):
- Frontend (React/Angular)
- API Gateway / Backend (Node.js o Spring Boot)
- Servicio de Autenticación (JWT)
- Servicios de negocio (UsuarioService, EleccionService, VotoService, etc.)
- Repositorios (BD relacional para datos no sensibles)
- SDK de Hyperledger Fabric
- Peer Fabric + Chaincode (votación, auditoría)
- Ledger blockchain