/**
 * Plan de Cuentas Modelo (Ticket #382).
 *
 * Dataset derivado de docs/contable/Plantilla_Plan_de_Cuentas_6559_0006.xls.
 * NO editar a mano: regenerar desde el .xls si cambia la plantilla.
 *
 * - code: formato x.x.x/xx/xx (mismo que TSK-376).
 * - isLeaf: cuenta imputable (hoja). Las no-hoja son de sumatoria.
 * - El padre se deriva del código (último segmento no-cero a cero). Se omitió
 *   la raíz 4.0.0 (Resultado del Período) por mezclar tipos (INGRESOS/GASTOS),
 *   por lo que 4.1.x (REVENUE) y 4.2.x (EXPENSE) son ramas raíz.
 */
import type { AccountType } from "@/generated/prisma/enums";

export interface ModelAccount {
  code: string;
  name: string;
  type: AccountType;
  isLeaf: boolean;
}

export const MODEL_CHART_OF_ACCOUNTS: ModelAccount[] = [
  {
    "code": "1.0.0/00/00",
    "name": "ACTIVO",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.0/00/00",
    "name": "ACTIVO CORRIENTE",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.1/00/00",
    "name": "CAJA Y BANCOS",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.1/01/00",
    "name": "CAJAS",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.1/01/01",
    "name": "Caja",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.1/01/02",
    "name": "Caja chica",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.1/01/05",
    "name": "Caja en Moneda Extranjera",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.1/01/06",
    "name": "Valores a depositar",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.1/01/07",
    "name": "Tarjeta de crédito empresa",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.1/02/00",
    "name": "BANCOS",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.1/02/01",
    "name": "Banco Santander Río c/c en pesos",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.1/02/02",
    "name": "Banco Santander Río c/c en dolares",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.1/02/03",
    "name": "Banco Santander Dinero en Custodia",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.2/00/00",
    "name": "INVERSIONES TEMPORARIAS",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.2/01/00",
    "name": "INVERSIONES EN ACCIONES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.2/01/01",
    "name": "Acciones",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.2/01/02",
    "name": "Acciones Bonos y CEDEARs",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.2/01/03",
    "name": "Fondos Comunes de Inversion",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.2/02/00",
    "name": "DEPÓSITOS A PLAZO FIJO",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.2/02/01",
    "name": "Depósitos a Plazo Fijo en pesos",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.2/02/02",
    "name": "Depósitos a Plazo Fijo en moneda extranjera",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.3/00/00",
    "name": "CREDITOS POR VENTAS DE SERVICIOS",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.3/01/00",
    "name": "DEUDORES EN CTA. CTE.",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.3/01/01",
    "name": "Deudores locales",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.3/01/02",
    "name": "Deudores del exterior",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.3/02/00",
    "name": "Documentos a cobrar por Vtas. de Servicios (Ctes.)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.3/03/00",
    "name": "Previsión para deudores incobrables",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/00/00",
    "name": "OTROS CREDITOS CORRIENTES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.4/01/00",
    "name": "CRÉDITOS IMPOSITIVOS CORRIENTES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.4/01/01",
    "name": "Anticipos Impuesto a las Ganancias",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/02",
    "name": "Anticipos Impuesto a los IIBB",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/03",
    "name": "Percepciones y Retenciones Impto. a las Ganancias",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/04",
    "name": "Percepciones y Retenciones Impto. a los IIBB",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/05",
    "name": "IVA Crédito Fiscal",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/06",
    "name": "IVA Crédito Fiscal Exportación",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/07",
    "name": "IVA Saldo a Favor Técnico",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/08",
    "name": "IVA Saldo a Favor Técnico (exportaciones)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/09",
    "name": "IVA Saldo a Favor de Libre Disponibilidad",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/10",
    "name": "Percepciones y Retenciones de IVA",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/11",
    "name": "Crédito por quebrantos imposit. no utiliz. (Ctes.)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/12",
    "name": "Activos por Impuesto Diferido (Ctes.)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/13",
    "name": "Retenciones S.U.S.S. F931",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/15",
    "name": "IIBB Ingresos Brutos",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/16",
    "name": "Ganancias Saldo a favor de Libre Disponibilidad",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/01/30",
    "name": "Credito por Imp a los deb/cred",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/02/00",
    "name": "CREDITOS DIVERSOS CORRIENTES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.1.4/02/01",
    "name": "Cuenta Part. Socio 1",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/02/02",
    "name": "Cuenta Part. Socio 2",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/02/03",
    "name": "Cuenta Part. Socio 3",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/02/04",
    "name": "Anticipos a Proveedores (No cong.precio)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/02/05",
    "name": "Anticipos de Sueldos",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/02/06",
    "name": "Préstamos al personal",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/02/07",
    "name": "Depósitos pendientes de acreditación",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.4/02/08",
    "name": "Arrendamiento pagado por adelantado",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.1.6/00/00",
    "name": "OTROS ACTIVOS CORRIENTES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.0/00/00",
    "name": "ACTIVO NO CORRIENTE",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.1/00/00",
    "name": "INVERSIONES PERMANENTES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.1/01/00",
    "name": "BONOS DE DEUDA",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.1/01/01",
    "name": "Títulos Deuda Pública (Pesos)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.1/02/00",
    "name": "DEPÓSITOS A PLAZO FIJO NO CTE.",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.1/02/01",
    "name": "Depósitos a plazo fijo en pesos (no cte.)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.1/02/02",
    "name": "Depósitos a plazo fijo en mon. ext. (no cte.)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.1/03/00",
    "name": "INVERSIONES EN BIENES DEPRECIABLES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.1/03/01",
    "name": "Invers. en Inmuebles Valores Originales",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.1/03/02",
    "name": "Invers. en Inmuebles Actualizaciones",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.1/03/03",
    "name": "Amortizaciones Acumuladas Invers. en Inmuebles",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/00/00",
    "name": "BIENES DE USO",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.2/01/00",
    "name": "INMUEBLES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.2/01/01",
    "name": "Inmuebles Valores originales",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/01/02",
    "name": "Inmuebles Actualizaciones",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/01/03",
    "name": "Amortizaciones Acumuladas Inmuebles",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/02/00",
    "name": "MAQUINARIAS Y EQUIPOS",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.2/02/01",
    "name": "Maquinarias y Eq. Valores de origen",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/02/02",
    "name": "Maquinarias y Eq. Actualizaciones",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/02/03",
    "name": "Amortizaciones Acumuladas - Maquinarias y Eq.",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/03/00",
    "name": "MUEBLES Y UTILES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.2/03/01",
    "name": "Muebles y utiles Valores de Origen",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/03/02",
    "name": "Muebles y utiles Actualizaciones",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/03/03",
    "name": "Amortizaciones Acumuladas M. y Utiles",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/04/00",
    "name": "RODADOS",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.2/04/01",
    "name": "Rodados Valores Originales",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/04/02",
    "name": "Rodados Actualizaciones",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/04/03",
    "name": "Amortizac. Acumuladas Rodados",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/05/00",
    "name": "EQUIPOS TECNOLOGICOS",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.2/05/01",
    "name": "Equipos Tecnológicos Valor de Origen",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/05/03",
    "name": "Amortizaciónes Acumuladas Equipos Tecnológicos",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/07/00",
    "name": "TERRENOS",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.2/07/01",
    "name": "Terrenos valores originales",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/07/02",
    "name": "Terrenos Actualizaciones",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/08/00",
    "name": "INSTALACIONES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.2/08/01",
    "name": "Instalaciones Valores Originales",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/08/02",
    "name": "Instalaciones Ajuste",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/08/03",
    "name": "Amortizaciones Acumuladas Instalaciones",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/09/00",
    "name": "EQUIPOS DE COMUNICACION",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.2/09/01",
    "name": "Equipos Comunicacion valores originales",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/09/02",
    "name": "Equipos Comunicacion Ajuste",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.2/09/03",
    "name": "Amort Ac. Equipos de Comunicacion",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.3/00/00",
    "name": "ACTIVOS INTANGIBLES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.3/01/00",
    "name": "MARCAS Y PATENTES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.3/01/01",
    "name": "Marcas y Patentes Valores Originales",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.3/01/02",
    "name": "Marcas y Patentes Actualizaciones",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.3/01/03",
    "name": "Amortiz. Acumuladas - Marcas y Patentes",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.4/00/00",
    "name": "CRÉDITOS POR VENTAS DE SERVICIOS",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.4/01/00",
    "name": "DEUDORES NO CORRIENTES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.4/01/01",
    "name": "Deudores Locales (No Ctes.)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.4/02/00",
    "name": "Documentos a Cobrar por Vtas. de Serv. (No Ctes.)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.5/00/00",
    "name": "OTROS CRÉDITOS NO CORRIENTES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.5/01/00",
    "name": "CRÉDITOS IMPOSITIVOS NO CORRIENTES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.5/01/01",
    "name": "Activos por Impto. Diferido (No Ctes.)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.5/01/02",
    "name": "Créditos por Quebrantos Impos. No utiliz (No Ctes.",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.5/02/00",
    "name": "CRÉDITOS DIVERSOS NO CORRIENTES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.5/02/01",
    "name": "Cuentas Particulares Directores (No Ctes.)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.5/02/02",
    "name": "Cuentas Partic Socios / Accionistas (No Ctes.)",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "1.2.7/00/00",
    "name": "OTROS ACTIVOS NO CORRIENTES",
    "type": "ASSET" as AccountType,
    "isLeaf": false
  },
  {
    "code": "1.2.7/01/00",
    "name": "Llave de Negocio",
    "type": "ASSET" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.0.0/00/00",
    "name": "PASIVO",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.0/00/00",
    "name": "PASIVO CORRIENTE",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.1/00/00",
    "name": "DEUDAS COMERCIALES CORRIENTES",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.1/02/00",
    "name": "ACREEDORES",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.1/02/01",
    "name": "Acreedores Locales (Ctes.)",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.2/00/00",
    "name": "REMUNERACIONES Y CARGAS SOCIALES",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.2/01/00",
    "name": "Sueldos y Jornales a pagar",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.2/02/00",
    "name": "CARGAS SOCIALES A PAGAR",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.2/02/01",
    "name": "F931 a pagar",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.2/02/02",
    "name": "Sindicato a pagar",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.3/00/00",
    "name": "CARGAS FISCALES",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.3/01/00",
    "name": "IMPUESTO AL VALOR AGREGADO",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.3/01/01",
    "name": "IVA Debito Fiscal",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.3/01/02",
    "name": "IVA Débito Fiscal Sobretasa",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.3/01/03",
    "name": "Percepciones y Retenciones efectuadas IVA",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.3/01/05",
    "name": "IVA a Pagar",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.3/02/00",
    "name": "INGRESOS BRUTOS",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.3/02/01",
    "name": "Impuesto a los Ingresos Brutos a Pagar",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.3/02/10",
    "name": "Percepciones efectuadas Ing. Brutos",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.3/03/00",
    "name": "IMPUESTO A LAS GANANCIAS",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.3/03/01",
    "name": "Imp. Ganancia Minima Presunta a Pagar",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.3/03/02",
    "name": "Impuesto a las Ganancias a Pagar",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.3/03/03",
    "name": "Pasivo por Impuesto Diferido",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.3/03/10",
    "name": "Percepciones y Retenciones efectuadas Imp Gcias",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.3/04/00",
    "name": "Planes de Pago Cargas Fiscales",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.3/04/01",
    "name": "Plan Mis Facilidades AFIP",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.4/00/00",
    "name": "DEUDAS FINANCIERAS",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.4/01/00",
    "name": "Préstamo Banco Santander",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.4/02/00",
    "name": "Préstamo Otros",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.5/00/00",
    "name": "OTRAS DEUDAS CORRIENTES",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.5/01/00",
    "name": "Dividendos a pagar (Ctes.)",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.5/02/00",
    "name": "Honorarios Directores a Pagar (Ctes.)",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.1.6/00/00",
    "name": "PROVISIONES",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.1.6/01/00",
    "name": "Provisión para despidos",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.2.0/00/00",
    "name": "PASIVO NO CORRIENTE",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.2.1/00/00",
    "name": "DEUDAS FINANCIERAS NO CORRIENTES",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.2.1/01/00",
    "name": "Préstamo Banco de la Nación Arg. (No Cte.)",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.2.1/02/00",
    "name": "Préstamo Banco de la Pcia. de Bs. As. (No Cte.)",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.2.2/00/00",
    "name": "CARGAS FISCALES NO CORRIENTES",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.2.2/01/00",
    "name": "Moratoria",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.2.3/00/00",
    "name": "DEUDAS COMERCIALES",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.2.3/01/00",
    "name": "ACREEDORES",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "2.2.3/01/01",
    "name": "Acreedores Locales (No Ctes.)",
    "type": "LIABILITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "2.2.4/00/00",
    "name": "OTRAS DEUDAS NO CORRIENTES",
    "type": "LIABILITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "3.0.0/00/00",
    "name": "PATRIMONIO NETO",
    "type": "EQUITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "3.1.0/00/00",
    "name": "APORTE DE LOS PROPIETARIOS",
    "type": "EQUITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "3.1.1/00/00",
    "name": "CAPITAL SOCIAL",
    "type": "EQUITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "3.1.1/01/00",
    "name": "Acciones en Circulación",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "3.1.1/02/00",
    "name": "Aportes Irrevocables",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "3.1.1/03/00",
    "name": "Acciones a distribuir",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "3.1.2/00/00",
    "name": "Ajuste del Capital",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "3.3.0/00/00",
    "name": "RESERVAS",
    "type": "EQUITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "3.3.1/00/00",
    "name": "Reserva Legal",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "3.3.2/00/00",
    "name": "Reserva Facultativa",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "3.3.3/00/00",
    "name": "Reserva Estatutaria",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "3.3.4/00/00",
    "name": "Ajuste Reserva Legal",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "3.4.0/00/00",
    "name": "RESULTADOS ACUMULADOS",
    "type": "EQUITY" as AccountType,
    "isLeaf": false
  },
  {
    "code": "3.4.1/00/00",
    "name": "Resultado del ejercicio",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "3.4.2/00/00",
    "name": "Resultado ejercicios anteriores",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "3.4.3/00/00",
    "name": "A.R.E.A. (P)",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "3.4.4/00/00",
    "name": "A.R.E.A. (G)",
    "type": "EQUITY" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.1.0/00/00",
    "name": "INGRESOS",
    "type": "REVENUE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.1.1/00/00",
    "name": "INGRESOS ORDINARIOS",
    "type": "REVENUE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.1.1/01/00",
    "name": "INGRESOS POR SEVICIOS PRESTADOS",
    "type": "REVENUE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.1.1/01/01",
    "name": "Ventas de Serv. Liq Sueldos",
    "type": "REVENUE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.1.1/01/02",
    "name": "Venta Serv.Control Doc",
    "type": "REVENUE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.1.1/01/03",
    "name": "Ingresos de fuente extranjera",
    "type": "REVENUE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.1.1/01/05",
    "name": "Cursos dictados",
    "type": "REVENUE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.1.1/03/00",
    "name": "RESULTADOS FINANCIEROS Y POR TENENCIA",
    "type": "REVENUE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.1.1/03/01",
    "name": "Intereses Ganados",
    "type": "REVENUE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.1.1/03/02",
    "name": "Resultado por tenencia de acciones positivo",
    "type": "REVENUE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.1.1/03/03",
    "name": "Diferencia tipo cambio Comprador/Vendedor (Gcia.)",
    "type": "REVENUE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.1.1/04/00",
    "name": "OTROS INGRESOS ORDINARIOS",
    "type": "REVENUE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.1.2/00/00",
    "name": "INGRESOS EXTRAORDINARIOS",
    "type": "REVENUE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.1.2/01/00",
    "name": "Utilidad Venta Bienes de Uso",
    "type": "REVENUE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.1.2/02/00",
    "name": "Reintegro de Seguros",
    "type": "REVENUE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.1.2/03/00",
    "name": "Otros ingresos extraordinarios",
    "type": "REVENUE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.0/00/00",
    "name": "GASTOS",
    "type": "EXPENSE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.2.1/00/00",
    "name": "GASTOS ORDINARIOS",
    "type": "EXPENSE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.2.1/02/00",
    "name": "GASTOS DE EXPLOTACIÓN",
    "type": "EXPENSE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.2.1/02/01",
    "name": "Sueldos y Jornales - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/02",
    "name": "Cargas sociales - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/03",
    "name": "Energía - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/04",
    "name": "Honorarios Profesionales - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/05",
    "name": "Ropa de trabajo - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/06",
    "name": "Seguros - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/07",
    "name": "Despidos - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/08",
    "name": "Comida del personal - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/09",
    "name": "Cuota medica a cargo empleador - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/10",
    "name": "Amortizaciones - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/11",
    "name": "Capacitaciones",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/12",
    "name": "Internet y Telefonía",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/13",
    "name": "Software y Licencias -explotacion",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/14",
    "name": "Suscripción Editorial",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/18",
    "name": "Alquiler inmuebles",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/20",
    "name": "Repuestos y Reparaciones - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/21",
    "name": "Gastos de limpieza y Otros Ofic - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/22",
    "name": "Mantenimiento - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/23",
    "name": "Combustibles y Lubricantes - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/25",
    "name": "Insumos informaticos - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/26",
    "name": "Fletes - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/02/27",
    "name": "Patente Vehículos - Explotación",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/00",
    "name": "GASTOS DE ADMINISTRACION",
    "type": "EXPENSE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.2.1/03/01",
    "name": "Sueldos - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/02",
    "name": "Cargas Sociales - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/03",
    "name": "Despidos - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/04",
    "name": "Honorarios - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/05",
    "name": "Amortizaciones - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/06",
    "name": "Viáticos - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/07",
    "name": "Librería y Papelería - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/08",
    "name": "Certificaciones y Sellados - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/09",
    "name": "Gastos Bancarios - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/10",
    "name": "Gastos Varios - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/11",
    "name": "Insumos Computación - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/12",
    "name": "Correspondencia - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/13",
    "name": "Licencia Soft Contable",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/15",
    "name": "Mantenimiento - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/16",
    "name": "Energía - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/17",
    "name": "Seguros - Administración",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/18",
    "name": "Energía - Administración Distinto Titular",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/03/19",
    "name": "Multas",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/00",
    "name": "GASTOS DE COMERCIALIZACION",
    "type": "EXPENSE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.2.1/04/01",
    "name": "Sueldos - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/02",
    "name": "Cargas Sociales - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/03",
    "name": "Publicidad - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/04",
    "name": "Amortizaciones - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/05",
    "name": "Seguros - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/06",
    "name": "Honorarios - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/07",
    "name": "Gastos Varios - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/08",
    "name": "Fletes - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/11",
    "name": "IVA no computable - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/12",
    "name": "Descuentos otorgados a clientes - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/14",
    "name": "Comisiones de terceros - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/16",
    "name": "Quebrantos por deudores incobr. - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/04/17",
    "name": "Viáticos - Comercialización",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/05/00",
    "name": "GASTOS FINANCIEROS",
    "type": "EXPENSE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.2.1/05/01",
    "name": "Intereses y Gastos bancarios",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/05/02",
    "name": "Intereses de Proveedores",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/05/03",
    "name": "Intereses y recargos impositivos",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/05/04",
    "name": "Diferencia de Cambio",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/05/05",
    "name": "Diferencia de Cambio Balance en Moneda Extranjera",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/05/06",
    "name": "Diferencia tipo cambio Vendedor/Comprador",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/05/07",
    "name": "Diferencia por conversion en Bce. en Mon. Extranj.",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/05/08",
    "name": "Amortizaciones Inversiones en Bienes depreciables",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/05/09",
    "name": "Intereses Perdidos",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/05/10",
    "name": "R.E.C.P.A.M.",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/05/11",
    "name": "Resultado por tenencia negativo de acciones",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/07/00",
    "name": "IMPUESTOS",
    "type": "EXPENSE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.2.1/07/01",
    "name": "Impuesto a las Ganancias",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/07/02",
    "name": "Impuesto Ganancia mínima presunta",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/07/03",
    "name": "Impuesto a los Ingresos Brutos",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/07/04",
    "name": "Tasas",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/07/05",
    "name": "Impuestos Territoriales",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/07/06",
    "name": "Impuesto s/ los Débitos y Créditos Bancarios",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/07/07",
    "name": "Impuestos internos y varios",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.1/07/08",
    "name": "Impuesto PAIS (L 27541)",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.2/00/00",
    "name": "GASTOS EXTRAORDINARIOS",
    "type": "EXPENSE" as AccountType,
    "isLeaf": false
  },
  {
    "code": "4.2.2/01/00",
    "name": "Pérdida por venta bienes de uso",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.2/03/00",
    "name": "Amortizaciones extraordinarias",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.2/05/00",
    "name": "Ajuste del valor de los bienes",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "4.2.2/06/00",
    "name": "Ajuste de Amortizaciones acumul. de Bienes",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  },
  {
    "code": "6.0.0/00/00",
    "name": "RECPAM",
    "type": "EXPENSE" as AccountType,
    "isLeaf": true
  }
];
