# Cargar Plan de Cuentas Modelo (Ticket #382)

**Fecha de inicio:** 2026-07-02
**Estado:** Implementación completada y verificada

---

## 1. Análisis

### 1.1 Problema

Debe existir un **Plan de Cuentas Modelo** que una empresa pueda **cargar opcionalmente** para no armar su plan desde cero. La fuente es la plantilla `docs/contable/Plantilla_Plan_de_Cuentas_6559_0006.xls` (provista por el usuario). La carga debe ser opcional (la empresa elige usarlo o no) e idealmente idempotente/segura (no duplicar si ya tiene cuentas).

### 1.2 Contexto actual

#### La plantilla `.xls` (parseada)
- Formato: Excel legacy (OLE2/BIFF), hoja **"PDC Detallado"** (+ hoja "Centros de Costos x CTA" vacía salvo encabezado).
- **278 cuentas** (filas 3+). Columnas relevantes:
  - **A `Código de cuenta`** → formato `x.x.x/xx/xx` (ej. `1.1.1/01/01`). **Coincide con el formato normalizado en TSK-376.**
  - **B `Descripcion`** → `name`.
  - **C `Imputable`** (SI/NO) → mapea a `isLeaf` (SI = hoja/imputable; NO = sumatoria). 202 SI / 76 NO.
  - **D `Capítulo`** → mapea a `AccountType`.
  - Resto de columnas (moneda, tipo de cambio, ajuste, RECPAM, centros de costo, leyendas debe/haber, etc.): metadata del sistema de origen, **no** presentes en nuestro modelo `Account` → se ignoran en esta iteración.
- **Mapeo Capítulo → AccountType** (nature se deriva con `validateAccountNature`):
  - `Activo` (115, cod. `1.x`) → **ASSET** (DEBIT)
  - `Pasivo` (44, cod. `2.x`) → **LIABILITY** (CREDIT)
  - `Patrimonio Neto` (17, cod. `3.x`) → **EQUITY** (CREDIT)
  - `Resultados` (102): se subdivide →
    - `4.1.x INGRESOS` → **REVENUE** (CREDIT)
    - `4.2.x GASTOS` → **EXPENSE** (DEBIT)
    - `4.0.0 RESULTADO DEL PERIODO` (raíz, no imputable) → padre de INGRESOS y GASTOS (¡tipos distintos! ver riesgo).
    - `6.0.0 RECPAM` (imputable, único) → cuenta de resultado por inflación; tipo a decidir (REVENUE o EXPENSE).
- **Jerarquía:** NO hay columna de padre; el padre se **deriva del código** `x.x.x/xx/xx` (el padre de una cuenta es la que tiene el último segmento no-cero puesto a cero). El JSON limpio parseado quedó en el scratchpad de la sesión (`plan-cuentas-modelo.json`, 278 cuentas: `{code, name, imputable, chapter}`), regenerable determinísticamente desde el `.xls`.

#### Cómo se cargan cuentas hoy
- Existe maquinaria de import/export Excel en `src/modules/accounting/features/accounts/lib/import-export.server.ts`:
  - `downloadAccountsTemplate()`, `exportAccountsToExcel(companyId)`, `importAccountsFromExcel(companyId, fileBuffer)`.
  - El import ya fue actualizado en TSK-376 (Fase 2) para normalizar `code`, validar padre mismo-tipo y setear `isLeaf`.
- UI: `components/_ImportExportButtons.tsx` (Download/Upload) en la pantalla de cuentas.
- No hay auto-seed de cuentas al crear una empresa (las cuentas se crean manualmente o por import).

#### Interacción con TSK-376 (ya implementado)
- `Account.code` normalizado a `x.x.x/xx/xx` (mismo formato del modelo → encaja).
- `isLeaf` mantenido automáticamente (cuenta con hijas = no imputable).
- **Regla `validateAccountParentSameType`**: una cuenta solo puede tener padre del MISMO `type`.

### 1.3 Archivos involucrados (estimado)
- **Datos del modelo:** nuevo archivo de datos en el repo (ej. `src/modules/accounting/features/accounts/data/model-chart-of-accounts.ts|json`) generado desde el `.xls`. (El `.xls` queda como fuente en `docs/contable/`, no versionado como dependencia de runtime.)
- **Server action nueva:** `loadModelChartOfAccounts(companyId, options?)` en el módulo accounts (crea las 278 cuentas respetando jerarquía/isLeaf/tipo, idempotente).
- **UI:** botón/acción "Cargar Plan Modelo" (probablemente junto a Import/Export en `_ImportExportButtons.tsx` o en el estado vacío de la lista de cuentas), con `AlertDialog` de confirmación.
- **Reutilización:** lógica de derivación de padre por código y validaciones ya existentes (import-export / validators de 376).
- **Docs/guía:** `docs/architecture/data-model.md` (si aplica), `_AccountingGuide.tsx`, specs Cypress.

### 1.4 Dependencias
- TSK-376 aplicado (formato de code, isLeaf, mismo-tipo) — **ya está aplicado en DB dev**.
- `getActiveCompanyId`, permisos `accounting.accounts` (create), Prisma transacción.

### 1.5 Restricciones y reglas (CLAUDE.md)
- `checkPermission('accounting.accounts','create')` en la action; `PermissionGuard`/`usePermissions` en UI.
- Transacción Prisma para crear el árbol completo de forma atómica.
- `AlertDialog` (no confirm) para confirmar la carga.
- moment.js, logger, no imports cross-module, Decimal→Number (no aplica mucho acá), componentes < 200 líneas.
- Migraciones no aplican (es carga de datos por empresa, no cambio de schema).

### 1.6 Riesgos / decisiones de diseño abiertas
1. **Conflicto raíz de Resultados vs regla mismo-tipo (TSK-376).** `4.0.0 RESULTADO DEL PERIODO` es padre de `4.1 INGRESOS` (REVENUE) y `4.2 GASTOS` (EXPENSE), tipos distintos → viola `validateAccountParentSameType`. Opciones:
   - (a) Asignar a `4.0.0` (y toda la rama `4.x` no imputable) un tipo y **saltar la validación de mismo-tipo solo en la carga del modelo** (la carga es un dataset curado).
   - (b) No crear el nodo `4.0.0` como cuenta y dejar `4.1 INGRESOS` y `4.2 GASTOS` como raíces separadas (REVENUE/EXPENSE).
   - (c) Modelar `4.x` (INGRESOS/GASTOS) como tipo único (ej. todo REVENUE o un tipo "RESULT") — descartable porque perdemos la distinción REVENUE/EXPENSE que el resto del sistema usa.
   - **Recomendación: (a)** — importar el árbol tal cual con los tipos por sub-rama y permitir que la carga del modelo omita la validación de mismo-tipo (o la aplique con una excepción para la rama Resultados), documentándolo.
2. **Mapeo REVENUE/EXPENSE dentro de Resultados**: por sub-código (`4.1*`→REVENUE, `4.2*`→EXPENSE). `4.0.0` y `6.0.0 RECPAM` requieren asignación explícita (RECPAM → EXPENSE o REVENUE; sugerido EXPENSE por convención de pérdida, pero es configurable).
3. **Idempotencia / colisiones**: si la empresa ya tiene cuentas con esos códigos, ¿se omite, se hace merge, o se bloquea la carga? Sugerido: bloquear/omitir por código ya existente y reportar, sin sobrescribir. Definir si la carga solo se ofrece cuando el plan está vacío.
4. **Dónde vive el dataset del modelo**: convertir el `.xls` a un `.ts/.json` versionado (fuente única para runtime) vs. leer el `.xls` en runtime (requiere parser de xls legacy, que el proyecto no tiene). **Recomendado: convertir a dato versionado** en build/commit y no depender del `.xls` en runtime.
5. **Nature**: se deriva del tipo con `validateAccountNature`; la columna C del `.xls` no la trae. OK.
6. **Metadata ignorada** (moneda, ajuste por inflación, centros de costo, leyendas): se descarta en esta iteración; si luego se necesita, habrá que extender el modelo `Account`.

### 1.7 Decisiones tomadas (2026-07-02)

1. **Sin cuenta raíz de Resultados.** NO se crea el nodo `4.0.0 RESULTADO DEL PERIODO`. `4.1.x INGRESOS` (REVENUE) y `4.2.x GASTOS` (EXPENSE) quedan como ramas raíz separadas. Así se respeta la regla mismo-tipo de 376 sin excepciones. (Los otros capítulos sí conservan su raíz: `1.0.0` ASSET, `2.0.0` LIABILITY, `3.0.0` EQUITY, todos de tipo único.)
2. **Carga solo si el plan está vacío.** La acción "Cargar Plan Modelo" se ofrece únicamente cuando la empresa no tiene cuentas. Evita colisiones/duplicados.
3. **RECPAM (6.0.0) → EXPENSE** (naturaleza deudora).
4. **Dataset versionado** derivado del `.xls` (no se lee el `.xls` en runtime).

Mapeo final Código → AccountType:
- `1.*` → ASSET · `2.*` → LIABILITY · `3.*` → EQUITY
- `4.1.*` → REVENUE · `4.2.*` → EXPENSE · `6.*` → EXPENSE
- Se omite `4.0.0/00/00`. Padre derivado del código `x.x.x/xx/xx` (último segmento no-cero a cero); si el padre derivado no existe en el dataset (ej. 4.1.0 cuyo padre sería 4.0.0), la cuenta es raíz.

---

## 2. Planificación

Feature acotada, implementada en un solo tramo (el usuario pidió completar toda la tarea):
1. Dataset versionado del plan modelo (derivado del `.xls`).
2. Helpers puros: `getParentCode` (deriva padre por código) y `natureForType` (naturaleza por tipo).
3. Server action `loadModelChartOfAccounts` (crea el árbol, solo si el plan está vacío).
4. UI: botón "Cargar Plan Modelo" (AlertDialog), visible solo con plan vacío.
5. Guía de usuario + unit tests.

## 3. Diseño

- **Dataset:** `data/model-chart-of-accounts.ts` → `MODEL_CHART_OF_ACCOUNTS: ModelAccount[]` (`{code,name,type,isLeaf}`), 277 cuentas. Se omite `4.0.0`; tipos por prefijo (1→ASSET, 2→LIABILITY, 3→EQUITY, 4.1→REVENUE, 4.2→EXPENSE, 6→EXPENSE).
- **Padre derivado** del código con `getParentCode`; si el padre derivado no existe (4.1.0/4.2.0 → 4.0.0 omitido), la cuenta es raíz.
- **Action** `loadModelChartOfAccounts(companyId)`: `checkPermission('accounting.accounts','create')`, valida plan vacío (count==0, con recheck dentro de la transacción), pre-genera UUIDs con `crypto.randomUUID()` para enlazar padres sin round-trips, ordena por código ascendente (padres antes que hijas) y hace un único `createMany` en transacción (timeout 30s). Devuelve `{ created }`.
- **UI** `_LoadModelChartButton.tsx` (client): AlertDialog que explica el efecto; se renderiza en `AccountsList` solo cuando `accounts.length === 0`, dentro de `PermissionGuard create`.

## 4. Implementación

- **Archivos creados:**
  - `src/modules/accounting/features/accounts/data/model-chart-of-accounts.ts` — dataset (277 cuentas) derivado del `.xls`.
  - `src/modules/accounting/features/accounts/components/_LoadModelChartButton.tsx` — botón + AlertDialog.
  - `src/modules/accounting/features/accounts/data/model-chart-of-accounts.test.ts` — tests de integridad del dataset.
- **Archivos modificados:**
  - `.../accounts/actions.server.ts` — nueva `loadModelChartOfAccounts` + imports.
  - `.../accounts/AccountsList.tsx` — render condicional del botón (plan vacío).
  - `shared/utils/account-code.ts` — nuevo `getParentCode`.
  - `shared/validators/index.ts` — nuevo `natureForType` (refactor de `validateAccountNature`); se quitó import `logger` sin uso.
  - `shared/utils/account-code.test.ts` — tests de `getParentCode`.
  - `_AccountingGuide.tsx` — sección "Cargar Plan Modelo".
- **Fuente:** `docs/contable/Plantilla_Plan_de_Cuentas_6559_0006.xls` (no versionado como dependencia de runtime; el dataset `.ts` es la fuente en runtime).

## 5. Verificación

- **check-types:** sin errores nuevos en los archivos de la feature.
- **lint:** limpio en los archivos tocados (se eliminó el único warning, `logger` sin uso).
- **unit tests (Vitest):** 18/18 — `getParentCode` + `validateAccountCodeFormat` + integridad del dataset (sin `4.0.0`, padre/hija mismo tipo, RECPAM=EXPENSE, sin duplicados, huérfanas = 4.1.0/4.2.0).
- **Funcional contra DB (con rollback, sin persistir):** carga sobre empresa vacía → `createMany` de **277 cuentas** con FK auto-referencial OK; 6 raíces; 202 imputables; tipos ASSET 115 / LIABILITY 44 / EQUITY 17 / REVENUE 16 / EXPENSE 85; cuenta hoja de ejemplo con padre enlazado, isLeaf y naturaleza correctos; rollback dejó 0 cuentas.
- **Pendiente QA manual:** ejecutar la carga real desde la UI en una empresa vacía y validar el árbol renderizado.

**Estado:** Implementación completada y verificada.
