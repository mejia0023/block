# 🔧 CORRECCIONES Y SIGUIENTE PASO

## ❌ PROBLEMA DETECTADO en la documentación generada

La sección **5.2.1.1 (Identificación de Paquetes)** y **5.2.1.2 
(Relacionar Paquetes y Casos de Uso)** tiene 10 paquetes con 1 CU 
cada uno, lo cual es un mal diseño arquitectónico.

Un paquete debe **agrupar casos de uso por funcionalidad cohesiva**,
no ser uno por cada CU.

---

## ✅ CORRECCIÓN OBLIGATORIA

Reemplaza los 10 paquetes por estos **4 paquetes funcionales**:

### 📦 Paquete 1: Seguridad
**Responsabilidad:** Autenticación y control de acceso al sistema.
**Casos de uso:**
- CU01 - Iniciar Sesión

### 📦 Paquete 2: Gestión Electoral
**Responsabilidad:** Administración del ciclo de vida de las elecciones.
**Casos de uso:**
- CU02 - Crear Elección
- CU03 - Registrar Candidato
- CU04 - Registrar Votante en Padrón
- CU05 - Cerrar Elección

### 📦 Paquete 3: Votación
**Responsabilidad:** Proceso de emisión y verificación del voto.
**Casos de uso:**
- CU06 - Emitir Voto
- CU07 - Verificar Voto Emitido

### 📦 Paquete 4: Auditoría y Reportes
**Responsabilidad:** Verificación de integridad y generación de reportes.
**Casos de uso:**
- CU08 - Auditar Bloques de la Cadena
- CU09 - Verificar Integridad
- CU10 - Generar Reporte de Resultados

---

## 🔄 Acciones a ejecutar

1. **Modifica el script** `generar_documento.py`:
   - Actualiza la sección 5.2.1.1 con los 4 paquetes nuevos
   - Actualiza la sección 5.2.1.2 con la relación correcta paquete↔CU
   - Actualiza la sección 5.2.4 con el diagrama general de los 4 paquetes
   
2. **Re-genera** el documento Word:
```bash
   python generar_documento.py
```

3. **Confirma** los cambios:
   > ✅ Paquetes corregidos: 10 → 4
   > ✅ Documento regenerado: docs/documentacion_evoto.docx

---

═══════════════════════════════════════════════════════════════
# 📦 SIGUIENTE PASO — GENERAR ARCHIVO XMI ÚNICO
═══════════════════════════════════════════════════════════════

Una vez corregidos los paquetes, genera **UN SOLO archivo XMI** 
con TODOS los diagramas del proyecto, listo para importar en 
Enterprise Architect.

## 📂 Salida

```
/docs/evoto_modelo.xmi
```

## ⚙️ Especificaciones técnicas

- **Formato:** XMI 2.1
- **Encoding:** UTF-8
- **Namespace UML:** `http://www.omg.org/spec/UML/20110701`
- **Namespace XMI:** `http://www.omg.org/spec/XMI/20110701`
- **Exporter:** "Enterprise Architect"
- **ExporterVersion:** "6.5"

## 🏗️ Estructura jerárquica del modelo

```
📦 Modelo E-Voto
│
├── 📁 1. Casos de Uso
│   ├── 👤 Actor: Administrador
│   ├── 👤 Actor: Votante
│   ├── 👤 Actor: Auditor
│   ├── 📊 Diagrama General de Casos de Uso
│   └── 📊 Diagramas individuales (CU01 a CU10)
│
├── 📁 2. Análisis
│   ├── 📦 Paquete: Seguridad
│   ├── 📦 Paquete: Gestión Electoral
│   ├── 📦 Paquete: Votación
│   ├── 📦 Paquete: Auditoría y Reportes
│   ├── 📊 Diagrama Paquetes ↔ CU (con <<trace>>)
│   ├── 📊 Diagrama General de Paquetes
│   └── 📊 Diagramas de Comunicación (con boundary/control/entity)
│
├── 📁 3. Diseño
│   ├── 📊 Diagrama de Despliegue (peers Fabric, orderers, etc.)
│   ├── 📊 Diagrama de Clases (basado en database.sql)
│   └── 📊 Diagramas de Secuencia (uno por cada CU)
│
└── 📁 4. Implementación
    └── 📊 Componentes principales
```

## ✅ Reglas obligatorias

1. **UN solo archivo** `.xmi` con todo dentro.
2. **IDs únicos** formato `EAID_xxxxxxxx`.
3. **Tipos UML correctos:**
   - `uml:Actor` para los 3 actores
   - `uml:UseCase` para los 10 CU
   - `uml:Package` para los 4 paquetes
   - `uml:Class` para clases de la BD
   - `uml:Component` y `uml:Node` para despliegue
   - `uml:Lifeline` para diagramas de secuencia
4. **Relaciones correctas:**
   - `uml:Association` (actor ↔ CU)
   - `uml:Dependency` con stereotype `trace` (paquete → CU)
   - `uml:Message` (en secuencia y comunicación)
5. **Estereotipos** declarados en `<extension>`:
   - `<<boundary>>`, `<<control>>`, `<<entity>>`, `<<trace>>`
6. **NO usar** `<<extend>>` ni `<<include>>` en CU individuales.
7. **Cada `<diagram>`** debe referenciar correctamente sus `<elements>`.

## 🚀 Ejecución

```bash
mkdir -p docs
python generar_xmi.py
```

## 🧪 Validación final

- [ ] Archivo abre sin errores en Enterprise Architect
- [ ] Importar con: `Project → Import/Export → Import Package from XMI`
- [ ] Los 4 paquetes aparecen con sus CU dentro
- [ ] Los 3 actores aparecen como stick figures
- [ ] Todos los diagramas se visualizan correctamente
- [ ] Estereotipos boundary/control/entity se renderizan

## 📋 Confirmación esperada

```
✅ Paquetes en XMI: 4 (Seguridad, Gestión Electoral, Votación, Auditoría)
✅ Casos de uso: 10
✅ Actores: 3
✅ Diagramas totales: ~17
   - 1 general de CU
   - 10 individuales de CU
   - 1 de paquetes ↔ CU
   - 1 general de paquetes
   - 2-3 de comunicación
   - 1 de despliegue
   - 1 de clases (BD)
   - 10 de secuencia
✅ Archivo: docs/evoto_modelo.xmi
✅ Listo para Enterprise Architect 15+
```