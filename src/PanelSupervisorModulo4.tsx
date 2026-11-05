import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

import { UnidadAsambleaPH, ReservaZonaComunDepPH } from './components/ResidentPortalConsole';
import {
  UnidadCarteraPH,
  RegistroRecaudoPH,
  RegistroEgresoProveedorPH,
  PersonalOperativoPH,
  OrdenTrabajoContratista,
  SancionConvivenciaPH,
  TipoFaltaConvivencia,
  INITIAL_PERSONAL_OPERATIVO,
  INITIAL_ORDENES_CONTRATISTAS,
  INITIAL_SANCIONES_CONVIVENCIA,
  AuditLogShared,
  EquipoCriticoPH,
  INITIAL_EQUIPOS_CRITICOS,
  ReformaMudanzaPH,
  INITIAL_REFORMAS_MUDANZAS,
  InsumoBodegaPH,
  INITIAL_INVENTARIO_BODEGA
} from './PanelAdministradorModulo3';
import {
  CeldaParqueaderoPH,
  RegistroAccesoContratistaPuertaPH,
  INITIAL_CELDAS_PARQUEADERO,
  INITIAL_ACCESOS_CONTRATISTAS_PUERTA
} from './ModulosOperativosServiciosGenerales';
import ModuloContratistasYVisitasTecnicas from './components/ModuloContratistasYVisitasTecnicas';
import PanelSupervisorConfiguracionAseo from './components/PanelSupervisorConfiguracionAseo';

const isPlaceholderSupabase = !isSupabaseConfigured;


export interface SoporteConciliacionPH {
  id: string;
  unidad_id: number;
  numero_unidad: string;
  propietario: string;
  monto_reportado: number;
  referencia_bancaria: string;
  canal_bancario: 'Transferencia Bancolombia' | 'PSE Pasarela' | 'Consignación Corresponsal';
  concepto: RegistroRecaudoPH['concepto'];
  fecha_reporte: string;
  cuenta_origen: string;
  estado: 'Pendiente por Conciliar' | 'Conciliado y Aplicado ✅' | 'Rechazado (Inconsistente) ❌';
  nota_observacion?: string;
}

export interface MovimientoCajaMenorPH {
  id: string;
  recibo_num: string;
  fecha: string;
  concepto: string;
  proveedor_ferreteria: string;
  nit_proveedor: string;
  monto: number;
  responsable: string;
  categoria_operativa: 'Eléctrico / Iluminación' | 'Ferretería / Locativo' | 'Cerrajería / Seguridad' | 'Mensajería / Papelería';
  estado_reembolso: 'Ejecutado de Fondo Fijo' | 'Incluido en Solicitud Reembolso' | 'Reembolsado por Admin ✅';
}

export interface SolicitudPqrsMudanzaPH {
  id: string;
  unidad_id: number;
  numero_unidad: string;
  propietario: string;
  tipo_solicitud: 'PQRS Técnica/Locativa' | 'Solicitud de Permiso de Mudanza / Trasteo o Ingreso de Material de Obra';
  asunto_detalle: string;
  ubicacion_exacta: string;
  prioridad: 'Normal' | 'Alta' | 'Urgente';
  fecha_hora: string;
  deposito_garantia: number; // Ej. $250.000 COP para mudanzas/obra
  deposito_consignado: boolean;
  empresa_transporte_placa?: string;
  fecha_programada_mudanza?: string;
  estado_atencion: 'Abierta Hoy' | 'En Verificación Terreno' | 'Autorizada Portería ✅' | 'Resuelta en Terreno ✅' | 'Bloqueada por Mora ⚠️';
}

const FONDO_FIJO_CAJA_MENOR_ASIGNADO = 1500000; // $1.500.000 COP asignados al Supervisor en Terreno
const TOPE_MAXIMO_GASTO_SUPERVISOR = 300000; // $300.000 COP máximo por recibo sin firma del Admin

const INITIAL_SOPORTES_CONCILIACION: SoporteConciliacionPH[] = [
  {
    id: 'SOP-2026-801',
    unidad_id: 3,
    numero_unidad: 'Torre 1 - Apto 504',
    propietario: 'Camilo Andrés Botero Ochoa',
    monto_reportado: 758686,
    referencia_bancaria: 'BANCOL-CUS-9948102',
    canal_bancario: 'Transferencia Bancolombia',
    concepto: 'Cuota Ordinaria',
    fecha_reporte: '2026-10-29 08:15',
    cuenta_origen: 'Ahorros Bancolombia *4419',
    estado: 'Pendiente por Conciliar'
  },
  {
    id: 'SOP-2026-802',
    unidad_id: 2,
    numero_unidad: 'Torre 1 - Apto 302',
    propietario: 'Alberto Jaramillo Vélez',
    monto_reportado: 846000,
    referencia_bancaria: 'PSE-ACH-77319044',
    canal_bancario: 'PSE Pasarela',
    concepto: 'Acuerdo de Pago',
    fecha_reporte: '2026-10-29 09:30',
    cuenta_origen: 'Banco de Bogotá PSE *1108',
    estado: 'Pendiente por Conciliar'
  },
  {
    id: 'SOP-2026-803',
    unidad_id: 6,
    numero_unidad: 'Torre 3 - Apto 402',
    propietario: 'Jorge Eliécer Giraldo Arango',
    monto_reportado: 787500,
    referencia_bancaria: 'BANCOL-CORR-551209',
    canal_bancario: 'Consignación Corresponsal',
    concepto: 'Acuerdo de Pago',
    fecha_reporte: '2026-10-29 10:05',
    cuenta_origen: 'Corresponsal El Tesoro #14',
    estado: 'Pendiente por Conciliar'
  },
  {
    id: 'SOP-2026-804',
    unidad_id: 4,
    numero_unidad: 'Torre 2 - Apto 204',
    propietario: 'Inversiones Londoño & Cía S.A.S.',
    monto_reportado: 1035000,
    referencia_bancaria: 'BANCOL-DUP-001928',
    canal_bancario: 'Transferencia Bancolombia',
    concepto: 'Acuerdo de Pago',
    fecha_reporte: '2026-10-28 17:45',
    cuenta_origen: 'Corriente Bancolombia *9920',
    estado: 'Pendiente por Conciliar'
  }
];

export const INITIAL_CAJA_MENOR_MOVIMIENTOS: MovimientoCajaMenorPH[] = [
  {
    id: 'CM-2026-101',
    recibo_num: 'FAC-FER-8812',
    fecha: '2026-10-27 11:20',
    concepto: 'Compra de 12 bombillos LED 18W para pasillos Torre 1 y lobby',
    proveedor_ferreteria: 'Ferretería y Eléctricos El Poblado S.A.S.',
    nit_proveedor: '900.788.120-5',
    monto: 245000,
    responsable: 'Supervisor en Terreno (Hernán Darío Mejía)',
    categoria_operativa: 'Eléctrico / Iluminación',
    estado_reembolso: 'Ejecutado de Fondo Fijo'
  },
  {
    id: 'CM-2026-102',
    recibo_num: 'REC-CER-309',
    fecha: '2026-10-28 09:40',
    concepto: 'Duplicado de 4 llaves de seguridad cuarto de bombas e hidrantes',
    proveedor_ferreteria: 'Cerrajería Express 24H Aburrá',
    nit_proveedor: '71.339.410-2',
    monto: 165000,
    responsable: 'Supervisor en Terreno (Hernán Darío Mejía)',
    categoria_operativa: 'Cerrajería / Seguridad',
    estado_reembolso: 'Ejecutado de Fondo Fijo'
  },
  {
    id: 'CM-2026-103',
    recibo_num: 'FAC-HOM-4410',
    fecha: '2026-10-28 16:05',
    concepto: 'Cinta antideslizante de alto tráfico para escaleras de emergencia Torre 2',
    proveedor_ferreteria: 'Homecenter Sodimac Colombia (San Juan)',
    nit_proveedor: '800.242.106-2',
    monto: 280000,
    responsable: 'Supervisor en Terreno (Hernán Darío Mejía)',
    categoria_operativa: 'Ferretería / Locativo',
    estado_reembolso: 'Ejecutado de Fondo Fijo'
  },
  {
    id: 'CM-2026-104',
    recibo_num: 'REC-MEN-094',
    fecha: '2026-10-29 07:50',
    concepto: 'Transporte mensajería urgente radicación DIAN y empaque válvula PVC 2"',
    proveedor_ferreteria: 'Suministros Hidráulicos La 10',
    nit_proveedor: '901.114.209-1',
    monto: 235000,
    responsable: 'Supervisor en Terreno (Hernán Darío Mejía)',
    categoria_operativa: 'Ferretería / Locativo',
    estado_reembolso: 'Ejecutado de Fondo Fijo'
  }
];

const INITIAL_PQRS_MUDANZAS: SolicitudPqrsMudanzaPH[] = [
  {
    id: 'PQRS-2026-401',
    unidad_id: 1,
    numero_unidad: 'Torre 1 - Apto 101',
    propietario: 'Martha Lucía Gómez Restrepo',
    tipo_solicitud: 'Solicitud de Permiso de Mudanza / Trasteo o Ingreso de Material de Obra',
    asunto_detalle: 'Mudanza de mobiliario sala-comedor y electrodomésticos (Camión furgón 3.5 Ton)',
    ubicacion_exacta: 'Ascensor de Carga Torre 1 · Sótano 1',
    prioridad: 'Alta',
    fecha_hora: '2026-10-29 08:00',
    deposito_garantia: 250000,
    deposito_consignado: true,
    empresa_transporte_placa: 'Mudanzas El Cóndor · Placa WLU-492',
    fecha_programada_mudanza: 'Sábado 31 Oct 2026 (08:00 AM - 01:00 PM)',
    estado_atencion: 'Abierta Hoy'
  },
  {
    id: 'PQRS-2026-402',
    unidad_id: 2,
    numero_unidad: 'Torre 1 - Apto 302',
    propietario: 'Alberto Jaramillo Vélez',
    tipo_solicitud: 'Solicitud de Permiso de Mudanza / Trasteo o Ingreso de Material de Obra',
    asunto_detalle: 'Solicitud de salida de trasteo parcial e ingreso de material de remodelación',
    ubicacion_exacta: 'Portería Principal · Torre 1 Piso 3',
    prioridad: 'Urgente',
    fecha_hora: '2026-10-29 08:45',
    deposito_garantia: 250000,
    deposito_consignado: true,
    empresa_transporte_placa: 'Transportes Antioquia · Placa KMP-811',
    fecha_programada_mudanza: 'Viernes 30 Oct 2026 (09:00 AM - 12:00 PM)',
    estado_atencion: 'Abierta Hoy'
  },
  {
    id: 'PQRS-2026-403',
    unidad_id: 5,
    numero_unidad: 'Torre 2 - Penthouse 801',
    propietario: 'Dra. Sofía Uribe Mejía',
    tipo_solicitud: 'PQRS Técnica/Locativa',
    asunto_detalle: 'Humedad en techo parqueadero 14 por filtración en bajante de aguas lluvias',
    ubicacion_exacta: 'Sótano 1 · Parqueadero Privado N° 14',
    prioridad: 'Urgente',
    fecha_hora: '2026-10-29 09:10',
    deposito_garantia: 0,
    deposito_consignado: false,
    estado_atencion: 'Abierta Hoy'
  },
  {
    id: 'PQRS-2026-404',
    unidad_id: 7,
    numero_unidad: 'Torre 3 - Apto 601',
    propietario: 'Natalia Echeverri Posada',
    tipo_solicitud: 'PQRS Técnica/Locativa',
    asunto_detalle: 'Ruido en motor de ascensor Torre 2 y luminaria fundida en lobby piso 6',
    ubicacion_exacta: 'Torre 2 / Torre 3 · Punto Fijo Piso 6',
    prioridad: 'Normal',
    fecha_hora: '2026-10-29 09:50',
    deposito_garantia: 0,
    deposito_consignado: false,
    estado_atencion: 'En Verificación Terreno'
  },
  {
    id: 'PQRS-2026-405',
    unidad_id: 7,
    numero_unidad: 'Torre 3 - Apto 601',
    propietario: 'Natalia Echeverri Posada',
    tipo_solicitud: 'Solicitud de Permiso de Mudanza / Trasteo o Ingreso de Material de Obra',
    asunto_detalle: 'Ingreso de material acústico, porcelanato y estudio de diseño modular',
    ubicacion_exacta: 'Torre 3 · Ascensor de Carga',
    prioridad: 'Normal',
    fecha_hora: '2026-10-29 10:15',
    deposito_garantia: 250000,
    deposito_consignado: true,
    empresa_transporte_placa: 'Logística Aburrá · Placa TZY-108',
    fecha_programada_mudanza: 'Lunes 02 Nov 2026 (08:30 AM - 12:30 PM)',
    estado_atencion: 'Abierta Hoy'
  }
];

export type RolCampoPermitidoSupervisor = 'vigilante' | 'aseo' | 'contratista';

export type PuestoZonaOperativaPH =
  | 'Portería Principal'
  | 'Rondero Perimetral'
  | 'Aseo Torres 1 y 2'
  | 'Zonas Verdes y Piscina'
  | 'Cuarto de Máquinas / Ascensores';

export type TurnoCampoSupervisorPH =
  | 'Diurno 6am-2pm'
  | 'Tarde 2pm-10pm'
  | 'Nocturno 10pm-6am'
  | 'Turno 12h';

export type EstadoPlanillaArlCampo =
  | 'Vigente ✅'
  | 'Vencida - Bloquear Ingreso ⛔';

export type EstadoAsistenciaCampo =
  | '🟢 En Puesto'
  | '🟡 En Almuerzo / Relevado'
  | '🔴 Ausente / Sin Llegar';

export interface MetaCampoTrabajador {
  cedula_id: string;
  empresa: string;
  puesto_zona: PuestoZonaOperativaPH;
  turno_campo: TurnoCampoSupervisorPH;
  planilla_arl_estado: EstadoPlanillaArlCampo;
  asistencia_hoy: EstadoAsistenciaCampo;
  hora_entrada: string;
  tareas_asignadas_hoy: string[];
  reemplazo_incapacidad?: string;
}

export interface MetaOrdenCampoSupervisor {
  orden_id: string;
  empresa_contratista: string;
  arl_verificada_porteria: boolean;
  acta_recibida_satisfaccion: boolean;
  checklist_calidad: {
    epp_alturas_verificado: boolean;
    pruebas_funcionamiento_ok: boolean;
    limpieza_area_entregada: boolean;
    sin_danos_bienes_comunes: boolean;
  };
  observaciones_tecnicas: string;
  fecha_firma_acta?: string;
}

const INITIAL_META_CAMPO_POR_TRABAJADOR: Record<number, MetaCampoTrabajador> = {
  202: {
    cedula_id: 'CC 71.389.410',
    empresa: 'Seguridad Antioquia Ltda.',
    puesto_zona: 'Portería Principal',
    turno_campo: 'Diurno 6am-2pm',
    planilla_arl_estado: 'Vigente ✅',
    asistencia_hoy: '🟢 En Puesto',
    hora_entrada: '05:52 AM (Puntual)',
    tareas_asignadas_hoy: [
      'Control de acceso vehicular y registro de visitantes en minuta digital',
      'Verificación de Paz y Salvo para mudanzas autorizadas (Apto 101 / Apto 601)',
      'Custodia de llaves de subestación eléctrica y cuarto de bombas'
    ]
  },
  203: {
    cedula_id: 'CC 98.612.044',
    empresa: 'Seguridad Antioquia Ltda.',
    puesto_zona: 'Rondero Perimetral',
    turno_campo: 'Nocturno 10pm-6am',
    planilla_arl_estado: 'Vigente ✅',
    asistencia_hoy: '🟡 En Almuerzo / Relevado',
    hora_entrada: '06:00 AM (Cierre Turno Nocturno / Relevado)',
    tareas_asignadas_hoy: [
      'Ronda perimetral sótanos 1 y 2 cada 45 minutos con marcación QR',
      'Inspección de cerraduras salón social, gimnasio y zona húmeda',
      'Reporte de luminarias fundidas en punto fijo Torre 3'
    ]
  },
  204: {
    cedula_id: 'CC 43.771.209',
    empresa: 'Aseo Total S.A.S.',
    puesto_zona: 'Aseo Torres 1 y 2',
    turno_campo: 'Diurno 6am-2pm',
    planilla_arl_estado: 'Vigente ✅',
    asistencia_hoy: '🟢 En Puesto',
    hora_entrada: '06:05 AM (En Labores)',
    tareas_asignadas_hoy: [
      'Desinfección de cabinas de ascensores y botoneras Torres 1 y 2',
      'Limpieza profunda de lobby principal y vidrieras de acceso',
      'Clasificación de residuos orgánicos y reciclaje en shut de basuras'
    ]
  },
  205: {
    cedula_id: 'CC 70.512.883',
    empresa: 'Aseo Total S.A.S.',
    puesto_zona: 'Zonas Verdes y Piscina',
    turno_campo: 'Tarde 2pm-10pm',
    planilla_arl_estado: 'Vigente ✅',
    asistencia_hoy: '🟢 En Puesto',
    hora_entrada: '01:55 PM (En Labores)',
    tareas_asignadas_hoy: [
      'Medición de pH y cloro residual en piscina climatizada y jacuzzi',
      'Poda de jardines perimetrales y recolección de hojarasca en cárcamos',
      'Aseo de terraza BBQ tras evento de fin de semana'
    ]
  },
  206: {
    cedula_id: 'CC 71.788.920',
    empresa: 'Ascensores Andinos S.A.S.',
    puesto_zona: 'Cuarto de Máquinas / Ascensores',
    turno_campo: 'Diurno 6am-2pm',
    planilla_arl_estado: 'Vigente ✅',
    asistencia_hoy: '🟢 En Puesto',
    hora_entrada: '08:25 AM (Ingreso Autorizado OT-2026-041)',
    tareas_asignadas_hoy: [
      'Mantenimiento Preventivo Ascensor Torre 1 (Variadores y frenos)',
      'Prueba de paracaídas electromecánico y citofonía de emergencia',
      'Entrega de bitácora técnica ONAC al Supervisor de Terreno'
    ]
  },
  207: {
    cedula_id: 'CC 1.037.441.902',
    empresa: 'Hidrobombas Medellín S.A.S.',
    puesto_zona: 'Cuarto de Máquinas / Ascensores',
    turno_campo: 'Diurno 6am-2pm',
    planilla_arl_estado: 'Vencida - Bloquear Ingreso ⛔',
    asistencia_hoy: '🔴 Ausente / Sin Llegar',
    hora_entrada: 'Retenido en Portería (Planilla PILA Vencida)',
    tareas_asignadas_hoy: [
      'Lavado y desinfección de tanques de agua potable',
      'Cambio de sello mecánico motobomba Torre 2 (Bloqueado hasta renovar ARL)'
    ]
  }
};

const EXTRA_PERSONAL_CAMPO_INICIAL: PersonalOperativoPH = {
  id: 208,
  full_name: 'Téc. Robinson Mosquera (Puertas Automáticas Aburrá)',
  user_email: 'rmosquera@puertasaburra.co',
  telefono_whatsapp: '573169081122',
  role: 'contratista',
  turno_horario: 'Visita Técnica / Por Orden',
  estado_arl: 'Vigente ✅',
  entidad_arl: 'ARL SURA Riesgo IV · PILA #901884',
  estado_puerta: 'En Turno / Adentro',
  coproperty_assigned: 'P.H. Reserva del Tesoro'
};

const EXTRA_META_208: MetaCampoTrabajador = {
  cedula_id: 'CC 1.017.229.310',
  empresa: 'Puertas Automáticas Aburrá S.A.S.',
  puesto_zona: 'Portería Principal',
  turno_campo: 'Turno 12h',
  planilla_arl_estado: 'Vigente ✅',
  asistencia_hoy: '🟢 En Puesto',
  hora_entrada: '09:10 AM (En Terreno)',
  tareas_asignadas_hoy: [
    'Reparación puerta eléctrica parqueadero Sótano 1',
    'Ajuste de fotoceldas de seguridad y brazos hidráulicos vehiculares'
  ]
};

const ORDENES_CAMPO_COMPLEMENTARIAS: OrdenTrabajoContratista[] = [
  {
    id: 'OT-2026-041',
    contratista_id: 206,
    contratista_nombre: 'Ing. Hernán Darío Vélez (Ascensores Andinos)',
    tarea_especifica: 'Mantenimiento Preventivo Ascensor Torre 1 (Calibración de variadores y frenos)',
    zona_intervenida: 'Cuarto de Máquinas / Ascensores (Torre 1)',
    fecha_ingreso_autorizada: '2026-10-29 08:30',
    costo_estimado: 1450000,
    estado_orden: 'En Ejecución'
  },
  {
    id: 'OT-2026-042',
    contratista_id: 207,
    contratista_nombre: 'Téc. Mauricio Castaño (Hidrobombas Medellín)',
    tarea_especifica: 'Lavado y desinfección de tanques de agua potable y revisión motobomba Torre 2',
    zona_intervenida: 'Subestación Hidráulica Sótano 2',
    fecha_ingreso_autorizada: '2026-10-29 09:00',
    costo_estimado: 980000,
    estado_orden: 'Autorizada en Portería'
  },
  {
    id: 'OT-2026-043',
    contratista_id: 208,
    contratista_nombre: 'Téc. Robinson Mosquera (Puertas Automáticas Aburrá)',
    tarea_especifica: 'Reparación puerta eléctrica parqueadero y calibración de fotoceldas Sótano 1',
    zona_intervenida: 'Portería Principal · Rampa Vehicular Sótano 1',
    fecha_ingreso_autorizada: '2026-10-29 09:15',
    costo_estimado: 640000,
    estado_orden: 'En Ejecución'
  }
];

// ============================================================================
// TIPOS Y DATOS INICIALES DEL SUB-MÓDULO 4.3: BITÁCORA DE RONDAS, EQUIPOS CRÍTICOS & CIERRE DE TURNO
// ============================================================================
export type EstadoEquipoCriticoPH =
  | '🟢 Operativo / Óptimo'
  | '🟡 Alerta Preventiva'
  | '🔴 En Falla / Urgente';

export interface EquipoCriticoVitalPH {
  id: 'EQ-BOMBAS' | 'EQ-PLANTA' | 'EQ-PISCINA' | 'EQ-ASCENSORES' | 'EQ-INCENDIOS';
  codigo_tag: string;
  letra_punto: 'a)' | 'b)' | 'c)' | 'd)' | 'e)';
  nombre_punto: string;
  ubicacion_tecnica: string;
  estado: EstadoEquipoCriticoPH;
  ultima_inspeccion: string;
  responsable_verificacion: string;
  metricas_clave: { label: string; valor: string; alerta?: boolean }[];
  items_checklist: { id: string; texto: string; verificado: boolean }[];
  sugerencia_falla: string;
  falla_reportada_admin?: string;
  orden_emergencia_id?: string;
}

export interface MedicionPiscinaLey1209 {
  ph_actual: number;
  cloro_residual_ppm: number;
  temperatura_c: number;
  claridad_agua:
    | 'Cristalina / Óptima ✅'
    | 'Turbiedad Leve - Filtrado ⚠️'
    | 'No Apta - Clausura Preventiva ⛔';
  ultima_medicion_hora: string;
  operario_piscinero: string;
}

export type PuntoControlRondaPH =
  | 'Perímetro y Cerramiento'
  | 'Sótanos y Parqueaderos'
  | 'Terrazas y Cubiertas'
  | 'Portería y CCTV'
  | 'Zonas Sociales';

export type EstadoRondaBitacoraPH =
  | '🟢 Sin Novedad'
  | '🟡 Hallazgo Menor / Mantenimiento'
  | '🔴 Incidente de Seguridad / Convivencia';

export interface RegistroRondaBitacoraPH {
  id: string;
  hora_exacta: string;
  fecha_dia: string;
  punto_control: PuntoControlRondaPH;
  estado: EstadoRondaBitacoraPH;
  observacion_detallada: string;
  responsable_ronda: string;
  tag_nfc_verificado: string;
  unidad_involucrada?: string;
  propietario_involucrado?: string;
  tipo_falta_convivencia?: TipoFaltaConvivencia;
  escalado_tab3_4?: boolean;
  acta_sancion_generada?: string;
}

const INITIAL_MEDICION_PISCINA_LEY1209: MedicionPiscinaLey1209 = {
  ph_actual: 7.4,
  cloro_residual_ppm: 1.8,
  temperatura_c: 27.5,
  claridad_agua: 'Cristalina / Óptima ✅',
  ultima_medicion_hora: '2026-10-29 06:45 AM',
  operario_piscinero: 'Jhon Jairo Gaviria (Piscinero / Zonas Verdes)'
};

const INITIAL_EQUIPOS_CRITICOS_VITALES: EquipoCriticoVitalPH[] = [
  {
    id: 'EQ-BOMBAS',
    codigo_tag: 'HIDRO-SUB-01',
    letra_punto: 'a)',
    nombre_punto: 'Cuarto de Bombas Hidroflo y Tanques de Reserva de Agua',
    ubicacion_tecnica: 'Subestación Hidráulica Sótano 2 • Torres 1, 2 y 3',
    estado: '🟢 Operativo / Óptimo',
    ultima_inspeccion: 'Hoy 06:20 AM',
    responsable_verificacion: 'Supervisor en Terreno / Rondero',
    metricas_clave: [
      { label: 'Presión Línea Hidroflo', valor: '65 PSI (Estable)' },
      { label: 'Nivel Tanques Reserva', valor: '94% (120 m³)' },
      { label: 'Inspección de Fugas', valor: '0 Fugas / Sellos OK' }
    ],
    items_checklist: [
      { id: 'chk_b1', texto: 'Alternancia automática entre Motobomba 1 y Motobomba 2 verificada', verificado: true },
      { id: 'chk_b2', texto: 'Sellos mecánicos, cheques y flanches sin goteo ni vibración anormal', verificado: true },
      { id: 'chk_b3', texto: 'Flotadores eléctricos y alarma de rebose en tanque subterráneo operativos', verificado: true }
    ],
    sugerencia_falla: 'Fuga en sello mecánico de motobomba 2 y caída de presión a 38 PSI'
  },
  {
    id: 'EQ-PLANTA',
    codigo_tag: 'GEN-CUMMINS-250KVA',
    letra_punto: 'b)',
    nombre_punto: 'Planta Eléctrica de Emergencia y Subestación',
    ubicacion_tecnica: 'Cuarto Técnico Acústico Sótano 1 • Transferencia Automática ATS',
    estado: '🟢 Operativo / Óptimo',
    ultima_inspeccion: 'Hoy 06:35 AM',
    responsable_verificacion: 'Supervisor en Terreno',
    metricas_clave: [
      { label: 'Nivel Combustible ACPM', valor: '88% (215 Galones)' },
      { label: 'Banco Baterías Arranque', valor: '27.4 VDC (Óptimo)' },
      { label: 'Prueba de Arranque', valor: 'Exitosa Hoy 06:30 AM' }
    ],
    items_checklist: [
      { id: 'chk_p1', texto: 'Precalentador de bloque a temperatura nominal (48 °C) y nivel de refrigerante OK', verificado: true },
      { id: 'chk_p2', texto: ' Cargador automático de baterías en flotación (27.4V) y bornes sulfatación cero', verificado: true },
      { id: 'chk_p3', texto: 'Selector de transferencia automática (ATS) en modo AUTO sin códigos de alarma', verificado: true }
    ],
    sugerencia_falla: 'Falla en solenoide de arranque y alerta de baja carga en batería de respaldo (19.2 VDC)'
  },
  {
    id: 'EQ-PISCINA',
    codigo_tag: 'ZONA-HUM-LEY1209',
    letra_punto: 'c)',
    nombre_punto: 'Piscina Climatizada, Jacuzzi y Baño Turco (Ley 1209)',
    ubicacion_tecnica: 'Deck Social Piso 1 • Cuarto de Filtrado y Dosificación',
    estado: '🟢 Operativo / Óptimo',
    ultima_inspeccion: 'Hoy 06:45 AM',
    responsable_verificacion: 'Jhon Jairo Gaviria (Aseo / Piscina)',
    metricas_clave: [
      { label: 'Nivel actual de pH', valor: '7.4 (Rango 7.2 - 7.6)' },
      { label: 'Cloro Residual Libre', valor: '1.8 ppm (Rango 1.0 - 3.0)' },
      { label: 'Temperatura & Claridad', valor: '27.5 °C • Cristalina ✅' }
    ],
    items_checklist: [
      { id: 'chk_z1', texto: 'Botón de parada de emergencia y rejillas antiatrapamiento certificadas (Ley 1209)', verificado: true },
      { id: 'chk_z2', texto: 'Retrolavado de filtro de arena y trampas de cabello en bombas recirculadoras', verificado: true },
      { id: 'chk_z3', texto: 'Bitácora física y digital firmada antes de apertura a residentes (07:00 AM)', verificado: true }
    ],
    sugerencia_falla: 'Bomba de recirculación de piscina bloqueada y desviación de cloro residual fuera de norma sanitaria'
  },
  {
    id: 'EQ-ASCENSORES',
    codigo_tag: 'ELEV-ANDINOS-T123',
    letra_punto: 'd)',
    nombre_punto: 'Ascensores de Pasajeros y Puertas Vehiculares',
    ubicacion_tecnica: 'Torres 1, 2 y 3 (6 Cabinas) + Rampa Vehicular Sótano 1 y 2',
    estado: '🟢 Operativo / Óptimo',
    ultima_inspeccion: 'Hoy 07:10 AM',
    responsable_verificacion: 'Supervisor en Terreno / Portería',
    metricas_clave: [
      { label: 'Sensores Fotocelda', valor: '6 / 6 Cabinas OK' },
      { label: 'Botoneras & Citofonía', valor: '100% Operativas' },
      { label: 'Ruidos en Rieles/Motor', valor: 'Sin Ruidos Anormales' }
    ],
    items_checklist: [
      { id: 'chk_a1', texto: 'Nivelación de piso exacta en todas las paradas de Torres 1, 2 y 3', verificado: true },
      { id: 'chk_a2', texto: 'Cortina infrarroja de puertas de cabina e intercomunicador de emergencia probados', verificado: true },
      { id: 'chk_a3', texto: 'Motores de puertas vehiculares Sótano 1 y 2 con apertura en < 6 segundos', verificado: true }
    ],
    sugerencia_falla: 'Ruido metálico en polea tractora de Ascensor Torre 2 y desnivel de 4 cm en piso 5'
  },
  {
    id: 'EQ-INCENDIOS',
    codigo_tag: 'RCI-NFPA-SHUT',
    letra_punto: 'e)',
    nombre_punto: 'Red Contra Incendios (RCI) y Shut de Basuras / Reciclaje',
    ubicacion_tecnica: 'Gabinetes Puntos Fijos T1-T3 + Cuarto Ambiental Sótano 1',
    estado: '🟢 Operativo / Óptimo',
    ultima_inspeccion: 'Hoy 07:30 AM',
    responsable_verificacion: 'Rondero Perimetral / Aseo',
    metricas_clave: [
      { label: 'Presión Red RCI', valor: '115 PSI (Bomba Jockey)' },
      { label: 'Extintores ABC / Solkaflam', valor: '42 / 42 Vigentes ✅' },
      { label: 'Shut y Cuarto Reciclaje', valor: 'Desinfectado y Evacuado' }
    ],
    items_checklist: [
      { id: 'chk_r1', texto: 'Bomba Jockey manteniendo línea presurizada a 115 PSI y válvulas siamesas despejadas', verificado: true },
      { id: 'chk_r2', texto: 'Mangueras, hachas, llaves spanner y sellos de seguridad en gabinetes de pisos 1 al 12', verificado: true },
      { id: 'chk_r3', texto: 'Compuertas cortafuego de shut herméticas y cuarto de reciclaje lavado con amonio cuaternario', verificado: true }
    ],
    sugerencia_falla: 'Despresurización en gabinete contra incendios Torre 3 Piso 4 y obstrucción en ducto de shut'
  }
];

const INITIAL_RONDAS_BITACORA_HOY: RegistroRondaBitacoraPH[] = [
  {
    id: 'RND-2026-901',
    hora_exacta: '06:05:18 AM',
    fecha_dia: '2026-10-29',
    punto_control: 'Perímetro y Cerramiento',
    estado: '🟢 Sin Novedad',
    observacion_detallada: 'Recorrido completo por malla eslabonada oriental, sensores fotoeléctricos perimetrales y concertina. Iluminación LED perimetral al 100%.',
    responsable_ronda: 'Wilmar Andrés Tapias (Rondero Perimetral)',
    tag_nfc_verificado: 'NFC-PERIM-NORTE-01'
  },
  {
    id: 'RND-2026-902',
    hora_exacta: '06:40:42 AM',
    fecha_dia: '2026-10-29',
    punto_control: 'Sótanos y Parqueaderos',
    estado: '🟡 Hallazgo Menor / Mantenimiento',
    observacion_detallada: 'Se detecta vehículo particular en celda de visitantes V-08 superando tiempo límite y 2 tubos LED T8 parpadeando en bahía Sótano 2.',
    responsable_ronda: 'Wilmar Andrés Tapias (Rondero Perimetral)',
    tag_nfc_verificado: 'NFC-SOTANO2-BAHIA-04'
  },
  {
    id: 'RND-2026-903',
    hora_exacta: '07:15:09 AM',
    fecha_dia: '2026-10-29',
    punto_control: 'Terrazas y Cubiertas',
    estado: '🟢 Sin Novedad',
    observacion_detallada: 'Revisión de bajantes de aguas lluvias, domos de punto fijo y puertas de acceso a terraza técnica con candado de seguridad.',
    responsable_ronda: 'Supervisor Operativo en Terreno',
    tag_nfc_verificado: 'NFC-CUBIERTA-T1T2-09'
  },
  {
    id: 'RND-2026-904',
    hora_exacta: '08:02:55 AM',
    fecha_dia: '2026-10-29',
    punto_control: 'Portería y CCTV',
    estado: '🟢 Sin Novedad',
    observacion_detallada: 'Verificación de 32 cámaras IP en NVR principal, talanqueras RFID vehiculares y minuta física contrastada con accesos biométricos.',
    responsable_ronda: 'Luis Fernando Pérez (Portería Principal)',
    tag_nfc_verificado: 'NFC-CCTV-PORTERIA-00'
  },
  {
    id: 'RND-2026-905',
    hora_exacta: '08:45:10 AM',
    fecha_dia: '2026-10-29',
    punto_control: 'Zonas Sociales',
    estado: '🔴 Incidente de Seguridad / Convivencia',
    observacion_detallada: 'Reporte nocturno consolidado: Música a alto volumen (78 dB medidos en pasillo) en Torre 3 - Apto 402 fuera de horario permitido y botellas en hall común.',
    responsable_ronda: 'Supervisor Operativo en Terreno',
    tag_nfc_verificado: 'NFC-ZSOCIAL-T3P4-11',
    unidad_involucrada: 'Torre 3 - Apto 402',
    propietario_involucrado: 'Jorge Eliécer Giraldo Arango',
    tipo_falta_convivencia: 'Ruido excesivo fuera de horario',
    escalado_tab3_4: true,
    acta_sancion_generada: 'ACTA-CONV-090'
  }
];

interface PanelSupervisorModulo4Props {
  unidades: UnidadCarteraPH[];
  setUnidades: React.Dispatch<React.SetStateAction<UnidadCarteraPH[]>>;
  recaudos: RegistroRecaudoPH[];
  setRecaudos: React.Dispatch<React.SetStateAction<RegistroRecaudoPH[]>>;
  egresos: RegistroEgresoProveedorPH[];
  setEgresos: React.Dispatch<React.SetStateAction<RegistroEgresoProveedorPH[]>>;
  personalExternal?: PersonalOperativoPH[];
  setPersonalExternal?: React.Dispatch<React.SetStateAction<PersonalOperativoPH[]>>;
  ordenesExternal?: OrdenTrabajoContratista[];
  setOrdenesExternal?: React.Dispatch<React.SetStateAction<OrdenTrabajoContratista[]>>;
  sancionesExternal?: SancionConvivenciaPH[];
  setSancionesExternal?: React.Dispatch<React.SetStateAction<SancionConvivenciaPH[]>>;
  cajaMenorExternal?: MovimientoCajaMenorPH[];
  setCajaMenorExternal?: React.Dispatch<React.SetStateAction<MovimientoCajaMenorPH[]>>;
  equiposCriticosExternal?: EquipoCriticoPH[];
  setEquiposCriticosExternal?: React.Dispatch<React.SetStateAction<EquipoCriticoPH[]>>;
  reformasMudanzasExternal?: ReformaMudanzaPH[];
  setReformasMudanzasExternal?: React.Dispatch<React.SetStateAction<ReformaMudanzaPH[]>>;
  inventarioBodegaExternal?: InsumoBodegaPH[];
  setInventarioBodegaExternal?: React.Dispatch<React.SetStateAction<InsumoBodegaPH[]>>;
  onSyncNewUserRole?: (newUser: {
    id: number;
    full_name: string;
    user_email: string;
    role: RolCampoPermitidoSupervisor;
    coproperty_assigned: string;
  }) => void;
  appendAuditLog: (action: string, details: string, customUser?: string) => void;
  auditLogs: AuditLogShared[];
  celdasParqueadero?: CeldaParqueaderoPH[];
  setCeldasParqueadero?: React.Dispatch<React.SetStateAction<CeldaParqueaderoPH[]>>;
  registrosContratistasPuerta?: RegistroAccesoContratistaPuertaPH[];
  setRegistrosContratistasPuerta?: React.Dispatch<React.SetStateAction<RegistroAccesoContratistaPuertaPH[]>>;
  unidadesAsamblea?: UnidadAsambleaPH[];
  onToggleAsistenciaAsamblea?: (id: string) => void;
  onTogglePoderAsamblea?: (id: string) => void;
  reservasZonasList?: ReservaZonaComunDepPH[];
  onToggleItemChecklistReserva?: (
    reservaId: string,
    campo: 'murosPinturaOk' | 'sillasMesasOk' | 'aseoProfundoOk' | 'sonidoVidriosOk'
  ) => void;
  onLiquidarDepositoReserva?: (reservaId: string, porcentajeRetenido: number, observacion: string) => void;
  rondasShared?: any[];
  setRondasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  minutaShared?: any[];
  setMinutaShared?: React.Dispatch<React.SetStateAction<any[]>>;
  tareasToderosRondasShared?: any[];
  setTareasToderosRondasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  checklistConfig?: any[];
  setChecklistConfig?: React.Dispatch<React.SetStateAction<any[]>>;
  alertasCriticasVigilanciaShared?: any[];
  setAlertasCriticasVigilanciaShared?: React.Dispatch<React.SetStateAction<any[]>>;
  contratistasShared?: any[];
  setContratistasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
}

export default function PanelSupervisorModulo4({
  unidades,
  setUnidades,
  recaudos,
  setRecaudos,
  egresos,
  setEgresos,
  personalExternal,
  setPersonalExternal,
  ordenesExternal,
  setOrdenesExternal,
  sancionesExternal,
  setSancionesExternal,
  cajaMenorExternal,
  setCajaMenorExternal,
  equiposCriticosExternal,
  setEquiposCriticosExternal,
  reformasMudanzasExternal,
  setReformasMudanzasExternal,
  inventarioBodegaExternal,
  setInventarioBodegaExternal,
  onSyncNewUserRole,
  appendAuditLog,
  auditLogs,
  celdasParqueadero = INITIAL_CELDAS_PARQUEADERO,
  setCeldasParqueadero,
  registrosContratistasPuerta = INITIAL_ACCESOS_CONTRATISTAS_PUERTA,
  setRegistrosContratistasPuerta,
  unidadesAsamblea = [],
  onToggleAsistenciaAsamblea,
  onTogglePoderAsamblea,
  reservasZonasList = [],
  onToggleItemChecklistReserva,
  onLiquidarDepositoReserva,
  rondasShared = [],
  minutaShared = [],
  tareasToderosRondasShared = [],
  setTareasToderosRondasShared,
  checklistConfig = [],
  setChecklistConfig,
  alertasCriticasVigilanciaShared = [],
  setAlertasCriticasVigilanciaShared,
  contratistasShared = [],
  setContratistasShared,
  onShowToast
}: PanelSupervisorModulo4Props) {
  // Sub-navegación de 5 pestañas dentro de [3. Panel Supervisor Operativo]
  const [activeSubTab, setActiveSubTab] = useState<'tab4_1' | 'tab4_2' | 'tab4_3' | 'asamblea_checkin' | 'checklist_zonas'>('tab4_3');
  const [filtroSeveridadRondasGarita, setFiltroSeveridadRondasGarita] = useState<string>('Todas');
  const [vistaFiltroBandejaMantenimiento, setVistaFiltroBandejaMantenimiento] = useState<'activas' | 'solucionadas'>('activas');
  const [filtroCategoriaMinutaAuditoria, setFiltroCategoriaMinutaAuditoria] = useState<string>('Todas');
  const [busquedaMinutaAuditoria, setBusquedaMinutaAuditoria] = useState<string>('');
  const [busquedaCheckinAsamblea, setBusquedaCheckinAsamblea] = useState('');

  // Estados del modal de inspección de herramientas y alerta de parqueadero en campo
  const [modalHerramientasSupervisor, setModalHerramientasSupervisor] = useState<RegistroAccesoContratistaPuertaPH | null>(null);
  const [modalAlertaParqueadero, setModalAlertaParqueadero] = useState<CeldaParqueaderoPH | null>(null);
  const [notaPernoctaInput, setNotaPernoctaInput] = useState<string>('Vehículo no reportó pernocta. Se notifica a vigilancia para requerimiento formal.');

  // Estados principales del Sub-Módulo 4.1
  const [soportesPago, setSoportesPago] = useState<SoporteConciliacionPH[]>(INITIAL_SOPORTES_CONCILIACION);
  const [movimientosCajaMenorLocal, setMovimientosCajaMenorLocal] = useState<MovimientoCajaMenorPH[]>(INITIAL_CAJA_MENOR_MOVIMIENTOS);
  const movimientosCajaMenor = cajaMenorExternal ?? movimientosCajaMenorLocal;
  const setMovimientosCajaMenor = setCajaMenorExternal ?? setMovimientosCajaMenorLocal;

  const [equiposCriticosSharedLocal, setEquiposCriticosSharedLocal] = useState<EquipoCriticoPH[]>(INITIAL_EQUIPOS_CRITICOS);
  const equiposCriticosSharedState = equiposCriticosExternal ?? equiposCriticosSharedLocal;
  const setEquiposCriticosSharedState = setEquiposCriticosExternal ?? setEquiposCriticosSharedLocal;

  const [reformasMudanzasLocal, setReformasMudanzasLocal] = useState<ReformaMudanzaPH[]>(INITIAL_REFORMAS_MUDANZAS);
  const reformasMudanzas = reformasMudanzasExternal ?? reformasMudanzasLocal;
  const setReformasMudanzas = setReformasMudanzasExternal ?? setReformasMudanzasLocal;

  const [inventarioBodegaLocal, setInventarioBodegaLocal] = useState<InsumoBodegaPH[]>(INITIAL_INVENTARIO_BODEGA);
  const inventarioBodega = inventarioBodegaExternal ?? inventarioBodegaLocal;
  const setInventarioBodega = setInventarioBodegaExternal ?? setInventarioBodegaLocal;

  const [solicitudesPqrsMudanza, setSolicitudesPqrsMudanza] = useState<SolicitudPqrsMudanzaPH[]>(INITIAL_PQRS_MUDANZAS);
  const [reembolsoSolicitadoPendiente, setReembolsoSolicitadoPendiente] = useState<boolean>(false);

  // Banner de feedback operativo
  const [feedbackSupervisor, setFeedbackSupervisor] = useState<{
    tipo: 'success' | 'warning' | 'danger' | 'info';
    mensaje: string;
  } | null>(null);

  // ACCIONES OPERATIVAS DEL SUPERVISOR EN CAMPO
  const handleCertificarReformaSinDanos = (reformaId: string) => {
    const ref = reformasMudanzas.find(r => r.id === reformaId);
    if (!ref) return;

    setReformasMudanzas(prev =>
      prev.map(r =>
        r.id === reformaId
          ? {
              ...r,
              supervision_estado: 'Certificado Sin Daños ✅',
              observacion_supervisor: 'Inspección de campo completada por Supervisora. Zonas comunes, ascensores y pasillos sin daños ni escombros.'
            }
          : r
      )
    );

    const detalleLog = `Certificó revisión de zonas comunes SIN DAÑOS para ${ref.tipo_evento} de ${ref.numero_unidad} (${ref.propietario_residente}). Habilitó devolución de depósito en Administración.`;
    appendAuditLog('CERTIFY_REFORMA_NO_DAMAGE', detalleLog, 'Julián Arango (Supervisor)');

    setFeedbackSupervisor({
      tipo: 'success',
      mensaje: `✅ Inspección certificada SIN DAÑOS para ${ref.numero_unidad}. Se habilitó el botón de devolución de depósito al Administrador.`
    });
  };

  const handleReportarDanoReforma = (reformaId: string) => {
    const ref = reformasMudanzas.find(r => r.id === reformaId);
    if (!ref) return;

    const detalleDano = prompt('Detalla la novedad o daño en bienes comunes constatado en campo:', 'Raspadura en marco de ascensor / Escombros dejados en pasillo');
    if (!detalleDano) return;

    setReformasMudanzas(prev =>
      prev.map(r =>
        r.id === reformaId
          ? {
              ...r,
              supervision_estado: 'Reportado Con Daño en Bienes Comunes ⚠️',
              observacion_supervisor: `Reporte de campo: ${detalleDano}`,
              monto_descuento_dano: 250000
            }
          : r
      )
    );

    const detalleLog = `Reportó DAÑO EN BIENES COMUNES para ${ref.tipo_evento} de ${ref.numero_unidad}: "${detalleDano}". Notificado a Administración para descuento del depósito.`;
    appendAuditLog('REPORT_MUDANZA_DAMAGE', detalleLog, 'Julián Arango (Supervisor)');

    setFeedbackSupervisor({
      tipo: 'warning',
      mensaje: `⚠️ Daño reportado para ${ref.numero_unidad}. Notificado inmediatamente al Administrador para liquidación del depósito.`
    });
  };

  const handleSalidaInsumoBodega = (insumoId: string, cantidad: number) => {
    const item = inventarioBodega.find(i => i.id === insumoId);
    if (!item) return;

    const nuevoStock = Math.max(0, item.stock_actual - cantidad);
    const esCritico = nuevoStock <= item.stock_minimo_critico;
    const nuevoEstado: InsumoBodegaPH['estado_stock'] = esCritico ? 'Stock Crítico ⚠️' : item.estado_stock;

    setInventarioBodega(prev =>
      prev.map(i =>
        i.id === insumoId
          ? {
              ...i,
              stock_actual: nuevoStock,
              estado_stock: nuevoEstado
            }
          : i
      )
    );

    const detalleLog = `Registró salida de ${cantidad} ${item.unidad_medida} de "${item.nombre}". Stock restante: ${nuevoStock} ${esCritico ? '(¡STOCK CRÍTICO! Alerta enviada a Admin)' : ''}`;
    appendAuditLog('SUPPLY_OUTPUT_DISPATCH', detalleLog, 'Julián Arango (Supervisor)');

    setFeedbackSupervisor({
      tipo: esCritico ? 'warning' : 'success',
      mensaje: esCritico
        ? `⚠️ Salida de ${item.nombre} registrada. ¡STOCK EN NIVEL CRÍTICO! Se envió alerta a Administración para reabastecimiento.`
        : `✅ Entrega de ${cantidad} ${item.unidad_medida} de ${item.nombre} registrada. Stock actual: ${nuevoStock}.`
    });
  };

  const handleSolicitarReabastecimientoBodega = (insumoId: string) => {
    const item = inventarioBodega.find(i => i.id === insumoId);
    if (!item) return;

    setInventarioBodega(prev =>
      prev.map(i =>
        i.id === insumoId
          ? { ...i, estado_stock: 'Solicitado a Administración 🛒' }
          : i
      )
    );

    const detalleLog = `Solicitó reabastecimiento urgente a Administración para insumo de bodega "${item.nombre}" (${item.codigo}). Stock actual: ${item.stock_actual} ${item.unidad_medida}.`;
    appendAuditLog('REQUEST_SUPPLY_REPLENISHMENT', detalleLog, 'Julián Arango (Supervisor)');

    setFeedbackSupervisor({
      tipo: 'info',
      mensaje: `🛒 Reabastecimiento de "${item.nombre}" solicitado a Administración con éxito.`
    });
  };

  const handleChecklistEquipoCampo = (equipoId: string, nuevoEstado: EquipoCriticoPH['estado_salud'], nota: string) => {
    const eq = equiposCriticosSharedState.find(e => e.id === equipoId);
    if (!eq) return;

    setEquiposCriticosSharedState(prev =>
      prev.map(e =>
        e.id === equipoId
          ? {
              ...e,
              estado_salud: nuevoEstado,
              observaciones_campo: nota,
              inspeccionado_por: 'Julián Arango (Supervisor)',
              ultima_inspeccion_fecha: new Date().toISOString().slice(0, 10)
            }
          : e
      )
    );

    const detalleLog = `Ejecutó checklist de campo sobre ${eq.nombre}: Estado ${nuevoEstado}. Nota: "${nota}"`;
    appendAuditLog('EQUIPMENT_CHECKLIST_SUPERVISOR', detalleLog, 'Julián Arango (Supervisor)');

    setFeedbackSupervisor({
      tipo: nuevoEstado === 'Óptimo' ? 'success' : 'warning',
      mensaje: `🛠️ Checklist de ${eq.nombre} actualizado a ${nuevoEstado}. Sincronizado en tiempo real con la consola del Administrador.`
    });
  };

  // Estados del Formulario de Caja Menor (Sección 3)
  const [cmConcepto, setCmConcepto] = useState<string>('');
  const [cmProveedor, setCmProveedor] = useState<string>('');
  const [cmNit, setCmNit] = useState<string>('900.788.120-5');
  const [cmRecibo, setCmRecibo] = useState<string>('');
  const [cmMonto, setCmMonto] = useState<string>('');
  const [cmCategoria, setCmCategoria] = useState<MovimientoCajaMenorPH['categoria_operativa']>('Eléctrico / Iluminación');

  // Estados del Formulario de PQRS Operativas y Mudanzas (Sección 4)
  const [pqrsUnidadId, setPqrsUnidadId] = useState<string>('1');
  const [pqrsTipo, setPqrsTipo] = useState<SolicitudPqrsMudanzaPH['tipo_solicitud']>(
    'Solicitud de Permiso de Mudanza / Trasteo o Ingreso de Material de Obra'
  );
  const [pqrsAsunto, setPqrsAsunto] = useState<string>('');
  const [pqrsUbicacion, setPqrsUbicacion] = useState<string>('Torre 1 · Ascensor de Carga / Portería');
  const [pqrsPrioridad, setPqrsPrioridad] = useState<SolicitudPqrsMudanzaPH['prioridad']>('Alta');
  const [pqrsDepositoConsignado, setPqrsDepositoConsignado] = useState<boolean>(true);
  const [pqrsPlacaEmpresa, setPqrsPlacaEmpresa] = useState<string>('Transportes Medellín · Placa JKL-901');
  const [pqrsFechaProgramada, setPqrsFechaProgramada] = useState<string>('Sábado 31 Oct 2026 (08:00 AM - 12:00 PM)');

  // Filtro en Centro de PQRS y Mudanzas
  const [filtroPqrsTipo, setFiltroPqrsTipo] = useState<'Todos' | 'Solo PQRS Locativas' | 'Solo Mudanzas y Obras'>('Todos');

  // Modales interactivos del Supervisor
  const [modalComprobanteConciliacion, setModalComprobanteConciliacion] = useState<SoporteConciliacionPH | null>(null);
  const [modalRechazoSoporte, setModalRechazoSoporte] = useState<SoporteConciliacionPH | null>(null);
  const [motivoRechazoInput, setMotivoRechazoInput] = useState<string>(
    'Referencia bancaria CUS no coincide con extracto Bancolombia / Monto incompleto'
  );
  const [modalSoporteCajaMenor, setModalSoporteCajaMenor] = useState<MovimientoCajaMenorPH | null>(null);
  const [modalOrdenPorteriaMudanza, setModalOrdenPorteriaMudanza] = useState<{
    solicitud: SolicitudPqrsMudanzaPH;
    unidad: UnidadCarteraPH;
  } | null>(null);

  // ============================================================================
  // ESTADOS DEL SUB-MÓDULO 4.2: CONTROL DE CUADRILLAS, TURNOS & CONTRATISTAS EN CAMPO
  // ============================================================================
  const [personalLocal, setPersonalLocal] = useState<PersonalOperativoPH[]>([
    ...INITIAL_PERSONAL_OPERATIVO,
    EXTRA_PERSONAL_CAMPO_INICIAL
  ]);
  const [ordenesLocal, setOrdenesLocal] = useState<OrdenTrabajoContratista[]>(ORDENES_CAMPO_COMPLEMENTARIAS);

  const personalList = personalExternal ?? personalLocal;
  const setPersonalList = setPersonalExternal ?? setPersonalLocal;
  const ordenesTrabajo = ordenesExternal ?? ordenesLocal;
  const setOrdenesTrabajo = setOrdenesExternal ?? setOrdenesLocal;

  // Asegurar que el contratista 208 y la orden OT-2026-043 existan también si se usa estado externo compartido
  useEffect(() => {
    setPersonalList(prev => {
      if (prev.some(p => p.id === 208)) return prev;
      return [...prev, EXTRA_PERSONAL_CAMPO_INICIAL];
    });
    setOrdenesTrabajo(prev => {
      const ids = new Set(prev.map(o => o.id));
      const nuevas = ORDENES_CAMPO_COMPLEMENTARIAS.filter(o => !ids.has(o.id));
      return nuevas.length > 0 ? [...prev, ...nuevas] : prev;
    });
  }, [setPersonalList, setOrdenesTrabajo]);

  const [metaCampoMap, setMetaCampoMap] = useState<Record<number, MetaCampoTrabajador>>({
    ...INITIAL_META_CAMPO_POR_TRABAJADOR,
    208: EXTRA_META_208
  });

  const [metaOrdenesMap, setMetaOrdenesMap] = useState<Record<string, MetaOrdenCampoSupervisor>>({
    'OT-2026-041': {
      orden_id: 'OT-2026-041',
      empresa_contratista: 'Ascensores Andinos S.A.S.',
      arl_verificada_porteria: true,
      acta_recibida_satisfaccion: false,
      checklist_calidad: {
        epp_alturas_verificado: true,
        pruebas_funcionamiento_ok: true,
        limpieza_area_entregada: true,
        sin_danos_bienes_comunes: true
      },
      observaciones_tecnicas: 'Variador VF calibrado, rieles lubricados y freno de emergencia certificado.'
    },
    'OT-2026-042': {
      orden_id: 'OT-2026-042',
      empresa_contratista: 'Hidrobombas Medellín S.A.S.',
      arl_verificada_porteria: false,
      acta_recibida_satisfaccion: false,
      checklist_calidad: {
        epp_alturas_verificado: false,
        pruebas_funcionamiento_ok: false,
        limpieza_area_entregada: false,
        sin_danos_bienes_comunes: true
      },
      observaciones_tecnicas: 'Pendiente renovación de planilla PILA / ARL antes de autorizar ingreso a tanque.'
    },
    'OT-2026-043': {
      orden_id: 'OT-2026-043',
      empresa_contratista: 'Puertas Automáticas Aburrá S.A.S.',
      arl_verificada_porteria: true,
      acta_recibida_satisfaccion: false,
      checklist_calidad: {
        epp_alturas_verificado: true,
        pruebas_funcionamiento_ok: true,
        limpieza_area_entregada: true,
        sin_danos_bienes_comunes: true
      },
      observaciones_tecnicas: 'Motorreductor y fotoceldas vehiculares operando al 100%.'
    }
  });

  // Estados del Formulario 2: "👷 Incorporar Personal a Cuadrilla / Autorizar Contratista" (Tope Jerárquico Estricto)
  const [cuadNombre, setCuadNombre] = useState<string>('');
  const [cuadCedula, setCuadCedula] = useState<string>('');
  const [cuadWhatsapp, setCuadWhatsapp] = useState<string>('');
  const [cuadEmpresa, setCuadEmpresa] = useState<string>('Seguridad Antioquia');
  const [cuadRol, setCuadRol] = useState<RolCampoPermitidoSupervisor>('vigilante');
  const [cuadPuesto, setCuadPuesto] = useState<PuestoZonaOperativaPH>('Portería Principal');
  const [cuadTurno, setCuadTurno] = useState<TurnoCampoSupervisorPH>('Diurno 6am-2pm');
  const [cuadArl, setCuadArl] = useState<EstadoPlanillaArlCampo>('Vigente ✅');

  // Filtros y buscador de la Tabla Operativa de Asistencia, Relevos y Zonas (Sección 4)
  const [filtroRolCuadrilla, setFiltroRolCuadrilla] = useState<'Todos' | 'Vigilantes' | 'Aseo' | 'Contratistas'>('Todos');
  const [busquedaCuadrilla, setBusquedaCuadrilla] = useState<string>('');

  // Modal de Acta Técnica de Recibo de Obra (Sección 3)
  const [modalActaOrden, setModalActaOrden] = useState<OrdenTrabajoContratista | null>(null);
  const [chkEpp, setChkEpp] = useState<boolean>(true);
  const [chkPruebas, setChkPruebas] = useState<boolean>(true);
  const [chkLimpieza, setChkLimpieza] = useState<boolean>(true);
  const [chkSinDanos, setChkSinDanos] = useState<boolean>(true);
  const [obsActaTecnica, setObsActaTecnica] = useState<string>('');

  // Modal de Expediente de Turno, Novedades y Reemplazo por Incapacidad (Sección 4)
  const [modalExpedienteTrabajador, setModalExpedienteTrabajador] = useState<PersonalOperativoPH | null>(null);
  const [reemplazoNombreInput, setReemplazoNombreInput] = useState<string>('');
  const [reemplazoMotivoInput, setReemplazoMotivoInput] = useState<string>('Incapacidad médica EPS / Calamidad doméstica');

  // ============================================================================
  // ESTADOS DEL SUB-MÓDULO 4.3: BITÁCORA DE RONDAS, EQUIPOS CRÍTICOS & CIERRE DE TURNO
  // ============================================================================
  const [sancionesLocal, setSancionesLocal] = useState<SancionConvivenciaPH[]>(INITIAL_SANCIONES_CONVIVENCIA);
  const sancionesList = sancionesExternal ?? sancionesLocal;
  const setSancionesList = setSancionesExternal ?? setSancionesLocal;

  const [equiposCriticos, setEquiposCriticos] = useState<EquipoCriticoVitalPH[]>(INITIAL_EQUIPOS_CRITICOS_VITALES);
  const [medicionPiscina, setMedicionPiscina] = useState<MedicionPiscinaLey1209>(INITIAL_MEDICION_PISCINA_LEY1209);
  const [rondasBitacora, setRondasBitacora] = useState<RegistroRondaBitacoraPH[]>(INITIAL_RONDAS_BITACORA_HOY);

  // Inputs del formulario rápido de Piscina, Jacuzzi y Turco (Ley 1209)
  const [inputPhPiscina, setInputPhPiscina] = useState<string>('7.4');
  const [inputCloroPiscina, setInputCloroPiscina] = useState<string>('1.8');
  const [inputTempPiscina, setInputTempPiscina] = useState<string>('27.5');
  const [inputClaridadPiscina, setInputClaridadPiscina] = useState<MedicionPiscinaLey1209['claridad_agua']>(
    'Cristalina / Óptima ✅'
  );

  // Inputs por equipo para personalizar o confirmar el reporte de falla crítica al Administrador
  const [fallaInputMap, setFallaInputMap] = useState<Record<string, string>>({
    'EQ-BOMBAS': 'Fuga en sello mecánico de motobomba 2 y caída de presión a 38 PSI',
    'EQ-PLANTA': 'Falla en solenoide de arranque y alerta de baja carga en batería de respaldo (19.2 VDC)',
    'EQ-PISCINA': 'Bomba de recirculación de piscina bloqueada y desviación de cloro residual fuera de norma sanitaria',
    'EQ-ASCENSORES': 'Ruido metálico en polea tractora de Ascensor Torre 2 y desnivel de 4 cm en piso 5',
    'EQ-INCENDIOS': 'Despresurización en gabinete contra incendios Torre 3 Piso 4 y obstrucción en ducto de shut'
  });

  // Estados del Formulario 3: "🔦 Registrar Ronda / Novedad en Bitácora"
  const [rondaPuntoControl, setRondaPuntoControl] = useState<PuntoControlRondaPH>('Perímetro y Cerramiento');
  const [rondaEstado, setRondaEstado] = useState<EstadoRondaBitacoraPH>('🟢 Sin Novedad');
  const [rondaObservacion, setRondaObservacion] = useState<string>('');
  const [rondaResponsable, setRondaResponsable] = useState<string>('Wilmar Andrés Tapias (Rondero Perimetral)');
  const [rondaUnidadInfractoraId, setRondaUnidadInfractoraId] = useState<string>('6');
  const [rondaTipoFalta, setRondaTipoFalta] = useState<TipoFaltaConvivencia>('Ruido excesivo fuera de horario');
  const [rondaEscalarTab34, setRondaEscalarTab34] = useState<boolean>(true);
  const [filtroRondasTimeline, setFiltroRondasTimeline] = useState<
    'Todas' | '🟢 Sin Novedad' | '🟡 Hallazgo Menor / Mantenimiento' | '🔴 Incidente de Seguridad / Convivencia'
  >('Todas');

  // Modales del Sub-Módulo 4.3
  const [modalDetalleRonda, setModalDetalleRonda] = useState<RegistroRondaBitacoraPH | null>(null);
  const [modalActaCierreTurno, setModalActaCierreTurno] = useState<boolean>(false);
  const [supervisorEntranteInput, setSupervisorEntranteInput] = useState<string>(
    'Héctor Fabio Quintero (Supervisor Turno Nocturno)'
  );
  const [consignasEntregaTurno, setConsignasEntregaTurno] = useState<string>(
    '1. Verificar presión de Cuarto de Bombas a las 22:00 hrs.\n2. Mantener control estricto de ruido en Torre 3 - Apto 402.\n3. Recibir planilla PILA renovada de Hidrobombas Medellín a primera hora.'
  );
  const [cierreTurnoFirmadoHoy, setCierreTurnoFirmadoHoy] = useState<{
    firmado: boolean;
    horaFirma: string;
    hashActa: string;
    recibidoPor: string;
  } | null>(null);

  // ============================================================================
  // 0. ESTADOS DE CABECERA OPERATIVA EN CAMPO Y BOTÓN DE PÁNICO / EMERGENCIA
  // ============================================================================
  const [relojOperativo, setRelojOperativo] = useState<string>(() => new Date().toTimeString().slice(0, 8));
  const [turnoActivoSupervisor, setTurnoActivoSupervisor] = useState<string>(
    'Turno Diurno (06:00 AM - 02:00 PM) • Hernán Darío Mejía'
  );
  const [unidadAsignadaSupervisor, setUnidadAsignadaSupervisor] = useState<string>(
    'Conjunto Residencial Bosques del Poblado - NIT 900.412.889-1'
  );
  const [modalBotonPanico, setModalBotonPanico] = useState<boolean>(false);
  const [ultimoDespachoEmergencia, setUltimoDespachoEmergencia] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setRelojOperativo(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleActivarProtocoloEmergencia = (entidad: string, linea: string, protocolo: string) => {
    const hora = new Date().toTimeString().slice(0, 8);
    const detalle = `[EMERGENCIA EN COPROPIEDAD ${hora}] Despacho inmediato a ${entidad} (${linea}): ${protocolo} en ${unidadAsignadaSupervisor}.`;
    setUltimoDespachoEmergencia(detalle);
    appendAuditLog('PANIC_BUTTON_EMERGENCY_DISPATCH', detalle, 'Supervisor en Terreno');
    setFeedbackSupervisor({
      tipo: 'danger',
      mensaje: `🚨 PROTOCOLO DE EMERGENCIA ACTIVADO (${hora}): Enlace directo con ${entidad} (${linea}) — ${protocolo}. Registrado en Bitácora Inmutable.`
    });
  };

  // ============================================================================
  // 1. ESTADOS DE DESGLOSE PROFUNDO TAB 4.1 (ARQUEO CAJA MENOR, ABONO PARCIAL, MUDANZAS)
  // ============================================================================
  const [modalArqueoCajaMenor, setModalArqueoCajaMenor] = useState<boolean>(false);
  const [valesProvisoriosCajaMenor, setValesProvisoriosCajaMenor] = useState<
    Array<{
      id: string;
      fecha: string;
      responsable: string;
      concepto: string;
      categoria_rapida: 'Ferretería/Eléctricos' | 'Aseo Urgente' | 'Cerrajería' | 'Papelería/Portería';
      monto: number;
      estado: 'Por Legalizar ⏳' | 'Legalizado en POS ✅';
    }>
  >([
    {
      id: 'VALE-PROV-01',
      fecha: '2026-10-29 07:30',
      responsable: 'Todero Carlos Mario Restrepo',
      concepto: 'Anticipo para compra urgente de empaque de válvula 2" y teflón industrial',
      categoria_rapida: 'Ferretería/Eléctricos',
      monto: 55000,
      estado: 'Por Legalizar ⏳'
    },
    {
      id: 'VALE-PROV-02',
      fecha: '2026-10-29 09:15',
      responsable: 'Portería Principal (Luis F. Pérez)',
      concepto: 'Compra de talonarios de control de visitantes y marcadores borrables',
      categoria_rapida: 'Papelería/Portería',
      monto: 30000,
      estado: 'Por Legalizar ⏳'
    }
  ]);
  const [reciboInspectorArqueo, setReciboInspectorArqueo] = useState<MovimientoCajaMenorPH | null>(null);

  // Estado para Abono Parcial en Modal de Auditoría de Soporte Bancario
  const [montoAbonoParcialInput, setMontoAbonoParcialInput] = useState<string>('');

  // Estados de Protocolo Completo de Mudanza / Obra (Checklist pre/post y custodia de depósito)
  const [mudanzaProtocoloMap, setMudanzaProtocoloMap] = useState<
    Record<
      string,
      {
        forrosAscensor: boolean;
        revisionParedesLobby: boolean;
        horarioPermitido: boolean;
        montoDepositoCustodia: number;
        estadoDeposito: 'En Custodia ($300.000 COP)' | 'Devuelto al Residente ✅' | 'Retenido por Daños en Zonas Comunes ⚠️';
        observacionInspeccion: string;
      }
    >
  >({
    'PQRS-2026-402': {
      forrosAscensor: true,
      revisionParedesLobby: true,
      horarioPermitido: true,
      montoDepositoCustodia: 300000,
      estadoDeposito: 'En Custodia ($300.000 COP)',
      observacionInspeccion: 'Ascensor de carga Torre 1 protegido con lona acolchada. Pisos de lobby sin rayones.'
    },
    'PQRS-2026-403': {
      forrosAscensor: true,
      revisionParedesLobby: false,
      horarioPermitido: true,
      montoDepositoCustodia: 300000,
      estadoDeposito: 'En Custodia ($300.000 COP)',
      observacionInspeccion: 'Pendiente pago de mora en Tab 3.1 para liberar ingreso de camión.'
    }
  });

  const getProtocoloMudanza = (idSolicitud: string) => {
    return (
      mudanzaProtocoloMap[idSolicitud] || {
        forrosAscensor: true,
        revisionParedesLobby: true,
        horarioPermitido: true,
        montoDepositoCustodia: 300000,
        estadoDeposito: 'En Custodia ($300.000 COP)' as const,
        observacionInspeccion: 'Protocolo pre/post mudanza activo en portería y lobby.'
      }
    );
  };

  const handleToggleChecklistMudanza = (
    idSolicitud: string,
    campo: 'forrosAscensor' | 'revisionParedesLobby' | 'horarioPermitido'
  ) => {
    const actual = getProtocoloMudanza(idSolicitud);
    setMudanzaProtocoloMap(prev => ({
      ...prev,
      [idSolicitud]: {
        ...actual,
        [campo]: !actual[campo]
      }
    }));
  };

  const handleAutorizarDevolucionORetencionDeposito = (
    solicitud: SolicitudPqrsMudanzaPH,
    accion: 'devolver' | 'retener'
  ) => {
    const actual = getProtocoloMudanza(solicitud.id);
    const nuevoEstadoDeposito =
      accion === 'devolver'
        ? ('Devuelto al Residente ✅' as const)
        : ('Retenido por Daños en Zonas Comunes ⚠️' as const);

    setMudanzaProtocoloMap(prev => ({
      ...prev,
      [solicitud.id]: {
        ...actual,
        estadoDeposito: nuevoEstadoDeposito,
        observacionInspeccion:
          accion === 'devolver'
            ? 'Inspección post-mudanza sin daños en ascensor ni lobby. Depósito de $300.000 COP devuelto al residente.'
            : 'Se detectaron afectaciones/rayones en bienes comunes durante el trasteo. Depósito de $300.000 COP retenido para reparación.'
      }
    }));

    appendAuditLog(
      accion === 'devolver' ? 'DEPOSITO_MUDANZA_DEVUELTO' : 'DEPOSITO_MUDANZA_RETENIDO_DANOS',
      `${
        accion === 'devolver'
          ? 'Autorizó devolución de Depósito de Garantía ($300.000 COP)'
          : 'Retuvo Depósito de Garantía ($300.000 COP) por daños en zonas comunes'
      } en expediente ${solicitud.id} (${solicitud.numero_unidad} - ${solicitud.propietario}).`,
      'Supervisor en Terreno'
    );

    setFeedbackSupervisor({
      tipo: accion === 'devolver' ? 'success' : 'warning',
      mensaje:
        accion === 'devolver'
          ? `💰 Depósito de Garantía ($300.000 COP) de ${solicitud.numero_unidad} autorizado para devolución tras verificar ascensor y lobby sin daños.`
          : `⚠️ Depósito de Garantía ($300.000 COP) de ${solicitud.numero_unidad} RETENIDO por daños detectados en zonas comunes. Notificado a Administración.`
    });
  };

  // ============================================================================
  // 2. ESTADOS DE DESGLOSE PROFUNDO TAB 4.2 (EXPEDIENTE CONTRATISTA ARL Y RUTINAS PUESTO)
  // ============================================================================
  const [detalleTecnicoOrdenMap, setDetalleTecnicoOrdenMap] = useState<
    Record<
      string,
      {
        numero_planilla_pila: string;
        nivel_riesgo_arl: string;
        certificado_alturas: string;
        herramientas_porteria: string;
        evidencia_antes: string;
        evidencia_despues: string;
        repuestos_instalados: string;
        tiempo_garantia: string;
      }
    >
  >({
    'OT-2026-041': {
      numero_planilla_pila: 'PILA-2026-99481204 (SURA)',
      nivel_riesgo_arl: 'Riesgo V (Trabajo en Alturas y Foso de Ascensores / Eléctrico)',
      certificado_alturas: 'SENA / CONTE Avanzado Alturas Vigente (Vence: 2027-04-15)',
      herramientas_porteria: 'Multímetro Fluke 117, Analizador VF, Juego Llaves Dinamométricas, Arnés Dieléctrico 4 Argollas',
      evidencia_antes: 'Variador de frecuencia con código de error E-14 y vibración en rieles piso 8.',
      evidencia_despues: 'Variador recalibrado, contactores limpios, frenos certificados y cabina nivelada a 0 mm.',
      repuestos_instalados: 'Kit de relés térmicos Schneider + 2 Litros lubricante sintético para guías',
      tiempo_garantia: '6 Meses de Garantía Técnica escrita en mano de obra y repuestos'
    },
    'OT-2026-042': {
      numero_planilla_pila: 'PILA-2026-77102940 (Positiva - VENCIDA)',
      nivel_riesgo_arl: 'Riesgo IV/V (Espacios Confinados e Hidráulica de Alta Presión)',
      certificado_alturas: 'Certificado Espacios Confinados y Alturas (Pendiente Renovar PILA)',
      herramientas_porteria: 'Manómetro Glicerinado 200 PSI, Extractor axial, Hidrolavadora industrial, Prensa-estopas',
      evidencia_antes: 'Goteo continuo en sello mecánico de Bomba #2 y caída de presión en red principal.',
      evidencia_despues: 'Pendiente ejecución tras desbloqueo de planilla PILA.',
      repuestos_instalados: 'Sello mecánico de tungsteno 2" + Empaquetadura EPDM',
      tiempo_garantia: '12 Meses de Garantía por Impermeabilización y Sellos'
    },
    'OT-2026-043': {
      numero_planilla_pila: 'PILA-2026-88392011 (Colmena ARL)',
      nivel_riesgo_arl: 'Riesgo IV (Mantenimiento Electromecánico y Automatización)',
      certificado_alturas: 'Certificado CONTE TE-4 Electromecánico Vigente',
      herramientas_porteria: 'Soldador Inverter, Taladro Percutor DeWalt, Tester de Fotoceldas IR, Remachadora',
      evidencia_antes: 'Brazo hidráulico vehicular Sur lento y fotocelda desalineada.',
      evidencia_despues: 'Motorreductor lubricado, fin de carrera ajustado y fotocelda anti-aplastamiento activa.',
      repuestos_instalados: 'Par de fotoceldas infrarrojas FAAC + Tarjeta receptora 433 MHz',
      tiempo_garantia: '8 Meses de Garantía en Automatización Vehicular'
    }
  });

  const getDetalleTecnicoOrden = (ordenId: string) => {
    return (
      detalleTecnicoOrdenMap[ordenId] || {
        numero_planilla_pila: 'PILA-2026-90124480 (ARL SURA)',
        nivel_riesgo_arl: 'Riesgo IV/V para trabajo en alturas o eléctrico',
        certificado_alturas: 'Certificado Avanzado Trabajo Seguro en Alturas Vigente ✅',
        herramientas_porteria: 'Caja de herramientas dieléctricas, Multímetro digital, EPP completo y Arnés certificado',
        evidencia_antes: 'Falla operativa reportada en inspección preliminar de terreno.',
        evidencia_despues: 'Equipo intervenido, probado bajo carga y operando dentro de parámetros nominales.',
        repuestos_instalados: 'Componentes originales certificados por fabricante',
        tiempo_garantia: '6 Meses de Garantía Técnica Integral'
      }
    );
  };

  // Rutinas por horas para personal de Aseo y Bitácora de Puesto para Vigilantes
  const [rutinasAseoMap, setRutinasAseoMap] = useState<
    Record<
      number,
      Array<{
        id: string;
        franja: string;
        actividad: string;
        completado: boolean;
      }>
    >
  >({});

  const getRutinaAseoTrabajador = (trabajadorId: number) => {
    if (rutinasAseoMap[trabajadorId]) return rutinasAseoMap[trabajadorId];
    return [
      {
        id: 'ASEO-7AM',
        franja: '7:00am',
        actividad: '7:00am Limpieza Lobby y Ascensores (Espejos, botoneras y tapetes desinfectantes)',
        completado: true
      },
      {
        id: 'ASEO-9AM',
        franja: '9:00am',
        actividad: '9:00am Shuts de Basura Torres 1-3 (Recolección, reciclaje y lavado de cuartos)',
        completado: true
      },
      {
        id: 'ASEO-11AM',
        franja: '11:00am',
        actividad: '11:00am Lavado Zonas Comunes (Pasillos, escaleras de emergencia y salón social)',
        completado: true
      },
      {
        id: 'ASEO-2PM',
        franja: '2:00pm',
        actividad: '2:00pm Desinfección Portería y Gimnasio (Máquinas multifuerza, baños y recepción)',
        completado: false
      }
    ];
  };

  const handleToggleTareaAseoHora = (trabajadorId: number, idTarea: string) => {
    const listaActual = getRutinaAseoTrabajador(trabajadorId);
    const nuevaLista = listaActual.map(t => (t.id === idTarea ? { ...t, completado: !t.completado } : t));
    setRutinasAseoMap(prev => ({
      ...prev,
      [trabajadorId]: nuevaLista
    }));
  };

  const getBitacoraVigilante = (_trabajadorId: number) => {
    return {
      minuta_puesto: [
        '06:00 AM — Recibo de puesto sin novedades en barreras vehiculares ni domos CCTV (16/16 cámaras en línea).',
        '08:20 AM — Verificación de planilla PILA a contratista de ascensores e ingreso de herramientas en libro de minuta.',
        '10:15 AM — Ronda preventiva completada en Sótano Técnico y Subestación sin alteraciones.'
      ],
      llaves_zonas_comunes: [
        { id: 'LL-01', llave: 'Llave Maestra Cuarto de Bombas y Subestación', estado: 'En Tablero Portería ✅' as const },
        { id: 'LL-02', llave: 'Llave Salón Social y Cocina BBQ', estado: 'En Tablero Portería ✅' as const },
        { id: 'LL-03', llave: 'Llave Cuarto de Máquinas Ascensores T1-T2', estado: 'Prestada en Terreno 🔑' as const },
        { id: 'LL-04', llave: 'Candado Shut de Basuras y Acopio', estado: 'En Tablero Portería ✅' as const }
      ],
      relevos_registrados: [
        '06:00 AM — Recibe turno de: Jhon Jairo Ospina (Turno Nocturno 10pm-6am) • Armamento no letal, 2 radios Motorola y minutero conforme.',
        '12:30 PM — Relevo temporal de almuerzo cubierto por Rondero Perimetral (Wilmar A. Tapias).'
      ]
    };
  };

  // ============================================================================
  // 3. ESTADOS DE DESGLOSE PROFUNDO TAB 4.3 (FICHA TÉCNICA EQUIPOS, MEDIDORES EPM, RONDAS QR)
  // ============================================================================
  const [modalFichaTecnicaEquipo, setModalFichaTecnicaEquipo] = useState<EquipoCriticoVitalPH | null>(null);

  const FICHAS_TECNICAS_EQUIPOS_MAP: Record<
    string,
    {
      marca_modelo: string;
      serie_activo: string;
      ultimo_mantenimiento: string;
      proximo_mantenimiento: string;
      proveedor_responsable: string;
      nit_telefono_proveedor: string;
      historial_lecturas: Array<{ fecha_hora: string; parametro: string; resultado: string; inspector: string }>;
    }
  > = {
    'EQ-BOMBAS': {
      marca_modelo: 'Sistema Hidroneumático Grundfos Hydro MPC-E 2x CRIE 15-3 (10 HP)',
      serie_activo: 'SN-GRUND-884120-MED',
      ultimo_mantenimiento: '2026-10-05 (Cambio de sellos y calibración de presostatos)',
      proximo_mantenimiento: '2026-11-05 (Mantenimiento Preventivo Mensual)',
      proveedor_responsable: 'Hidrobombas Medellín S.A.S.',
      nit_telefono_proveedor: 'NIT 900.411.209-3 • Urgencias 24/7: +57 310 449 8821',
      historial_lecturas: [
        { fecha_hora: 'Hoy 06:30 AM', parametro: 'Presión Red / Nivel Tanque', resultado: '64 PSI • Tanque 92% • Alternancia OK', inspector: 'Hernán D. Mejía' },
        { fecha_hora: 'Ayer 06:00 PM', parametro: 'Presión Red / Amperaje', resultado: '63 PSI • 14.2 A por línea • Sin fugas', inspector: 'Héctor F. Quintero' },
        { fecha_hora: '2026-10-27', parametro: 'Lavado y Desinfección Tanques', resultado: 'Certificado Sanitario SSSA Aprobado', inspector: 'Hidrobombas Medellín' }
      ]
    },
    'EQ-PLANTA': {
      marca_modelo: 'Planta Eléctrica Cummins Power Generation C150D6 (150 kVA) + Transferencia ABB',
      serie_activo: 'SN-CUMM-441098-COL',
      ultimo_mantenimiento: '2026-10-12 (Cambio de filtros ACPM y prueba con carga real)',
      proximo_mantenimiento: '2026-11-12 (Revisión bimensual de inyectores y banco de baterías)',
      proveedor_responsable: 'Cummins de los Andes / ElectroPlantas Antioquia S.A.S.',
      nit_telefono_proveedor: 'NIT 890.900.112-4 • Línea Técnica: +57 314 812 9000',
      historial_lecturas: [
        { fecha_hora: 'Hoy 07:00 AM', parametro: 'Nivel ACPM / Voltaje Baterías', resultado: 'ACPM 86% (310 Gal) • 24.4 VDC • Precalentador ON', inspector: 'Hernán D. Mejía' },
        { fecha_hora: '2026-10-26', parametro: 'Simulacro de Corte EPM (15 min)', resultado: 'Arranque automático en 4.2 seg • 208V / 60Hz estables', inspector: 'Supervisor en Terreno' }
      ]
    },
    'EQ-PISCINA': {
      marca_modelo: 'Sistema de Filtración Pentair WhisperFlo 3HP + Dosificador Automático Ley 1209 (Volumen: 120 m³)',
      serie_activo: 'SN-PENT-1209-AQ',
      ultimo_mantenimiento: '2026-10-22 (Retrolavado de filtro de arena sílice y calibración de sonda ORP)',
      proximo_mantenimiento: '2026-11-02 (Análisis microbiológico mensual de laboratorio acreditado)',
      proveedor_responsable: 'AquaQuímicos y Piscinas del Poblado S.A.S.',
      nit_telefono_proveedor: 'NIT 901.022.418-7 • Químico de Turno: +57 300 615 4410',
      historial_lecturas: [
        { fecha_hora: 'Hoy 06:45 AM (Mañana)', parametro: 'Medición Matutina Ley 1209', resultado: 'pH 7.3 • Cloro 1.6 ppm • Temp 27.0 °C • Cristalina', inspector: 'Carlos Mario Restrepo' },
        { fecha_hora: 'Hoy 01:30 PM (Tarde)', parametro: 'Medición Vespertina Ley 1209', resultado: `pH ${medicionPiscina.ph_actual.toFixed(1)} • Cloro ${medicionPiscina.cloro_residual_ppm.toFixed(1)} ppm • Temp ${medicionPiscina.temperatura_c} °C`, inspector: 'Hernán D. Mejía' },
        { fecha_hora: 'Ayer 05:00 PM', parametro: 'Cierre Zona Húmeda y Turco', resultado: 'pH 7.4 • Cloro 1.9 ppm • Botiquín y Gancho Salvavidas OK', inspector: 'Supervisor en Terreno' }
      ]
    },
    'EQ-ASCENSORES': {
      marca_modelo: 'Ascensores Otis Gen2 Regen (6 Cabinas • Capacidad 10 Pasajeros / 800 kg c/u)',
      serie_activo: 'SN-OTIS-G2-T1T3',
      ultimo_mantenimiento: '2026-10-28 (Calibración de variador VF y lubricación de rieles OT-2026-041)',
      proximo_mantenimiento: '2026-11-18 (Inspección anual certificada ONAC Norma NTC 5926-1)',
      proveedor_responsable: 'Ascensores Andinos S.A.S.',
      nit_telefono_proveedor: 'NIT 900.812.440-1 • Rescate 24/7: +57 314 778 9012',
      historial_lecturas: [
        { fecha_hora: 'Hoy 08:15 AM', parametro: 'Nivelación de Piso y Citofonía', resultado: '6/6 Cabinas Operativas • Frenos y Cortina IR al 100%', inspector: 'Hernán D. Mejía' },
        { fecha_hora: '2026-10-28', parametro: 'Mantenimiento Preventivo OT-2026-041', resultado: 'Variador VF calibrado sin códigos de falla', inspector: 'Ing. Roberto Carlos Cano' }
      ]
    },
    'EQ-INCENDIOS': {
      marca_modelo: 'Red Contra Incendios RCI Bomba Jockey + Principal 25 HP & Central Detección Simplex',
      serie_activo: 'SN-RCI-NFPA-2026',
      ultimo_mantenimiento: '2026-10-01 (Recarga anual de 24 extintores ABC/Solkaflam y prueba hidrostática)',
      proximo_mantenimiento: '2026-11-15 (Inspección trimestral de gabinetes, siamesa y válvulas de piso)',
      proveedor_responsable: 'Extintores y Redes NFPA Antioquia S.A.S.',
      nit_telefono_proveedor: 'NIT 900.519.330-8 • Emergencias: +57 311 309 4455',
      historial_lecturas: [
        { fecha_hora: 'Hoy 09:10 AM', parametro: 'Presión RCI / Shuts de Basura', resultado: '115 PSI estables • 24/24 Extintores vigentes • Shuts despejados', inspector: 'Hernán D. Mejía' },
        { fecha_hora: '2026-10-20', parametro: 'Inspección Sensores de Humo', resultado: '100% sensores ópticos operativos en lobbies T1-T3', inspector: 'Supervisor en Terreno' }
      ]
    }
  };

  // Historial de mediciones de Piscina del día (Mañana / Tarde) y dosificación aplicada
  const [historialPiscinaDia, setHistorialPiscinaDia] = useState<
    Array<{
      jornada: 'Mañana (06:45 AM)' | 'Tarde (01:30 PM)' | string;
      ph: number;
      cloro_ppm: number;
      temp_c: number;
      dosificacion_aplicada: string;
    }>
  >([
    {
      jornada: 'Mañana (06:45 AM)',
      ph: 7.3,
      cloro_ppm: 1.6,
      temp_c: 27.0,
      dosificacion_aplicada: 'Mantenimiento preventivo: 150 g de Hipoclorito de Calcio al 65%'
    },
    {
      jornada: 'Tarde (01:30 PM)',
      ph: 7.4,
      cloro_ppm: 1.8,
      temp_c: 27.5,
      dosificacion_aplicada: 'Parámetros en rango ideal Ley 1209 (Sin adición extra requerida)'
    }
  ]);

  // Sub-panel: "⚡ Lectura de Medidores de Zonas Comunes (Agua y Energía EPM)"
  const [lecturasMedidoresEpm, setLecturasMedidoresEpm] = useState<
    Array<{
      id: string;
      semana: string;
      fecha_registro: string;
      agua_lectura_anterior_m3: number;
      agua_lectura_actual_m3: number;
      agua_consumo_m3: number;
      energia_lectura_anterior_kwh: number;
      energia_lectura_actual_kwh: number;
      energia_consumo_kwh: number;
      estado_alerta: '🟢 Consumo Normal' | '⚠️ Alerta Posible Fuga / Sobrecosto EPM';
      observacion: string;
    }>
  >([
    {
      id: 'MED-EPM-W43',
      semana: 'Semana 43 (22 Oct - 29 Oct 2026)',
      fecha_registro: '2026-10-29 08:30',
      agua_lectura_anterior_m3: 4820,
      agua_lectura_actual_m3: 4862,
      agua_consumo_m3: 42,
      energia_lectura_anterior_kwh: 18450,
      energia_lectura_actual_kwh: 19140,
      energia_consumo_kwh: 690,
      estado_alerta: '🟢 Consumo Normal',
      observacion: 'Consumo dentro de la media histórica (40-48 m³ agua / 650-720 kWh energía).'
    },
    {
      id: 'MED-EPM-W42',
      semana: 'Semana 42 (15 Oct - 22 Oct 2026)',
      fecha_registro: '2026-10-22 08:30',
      agua_lectura_anterior_m3: 4761,
      agua_lectura_actual_m3: 4820,
      agua_consumo_m3: 59,
      energia_lectura_anterior_kwh: 17710,
      energia_lectura_actual_kwh: 18450,
      energia_consumo_kwh: 740,
      estado_alerta: '⚠️ Alerta Posible Fuga / Sobrecosto EPM',
      observacion: 'Se detectó pico de +17 m³ por válvula de llenado de piscina abierta; corregida a tiempo antes del corte de factura EPM.'
    }
  ]);

  const [inputLecturaAguaActual, setInputLecturaAguaActual] = useState<string>('4908');
  const [inputLecturaEnergiaActual, setInputLecturaEnergiaActual] = useState<string>('19850');
  const [inputObsMedidorEpm, setInputObsMedidorEpm] = useState<string>(
    'Verificación semanal de macromedidor Acueducto EPM y medidor trifásico de Zonas Comunes.'
  );

  const handleRegistrarLecturaMedidoresEpm = (e: React.FormEvent) => {
    e.preventDefault();
    const ultima = lecturasMedidoresEpm[0];
    const aguaAnt = ultima ? ultima.agua_lectura_actual_m3 : 4862;
    const energiaAnt = ultima ? ultima.energia_lectura_actual_kwh : 19140;

    const aguaAct = Number(inputLecturaAguaActual);
    const energiaAct = Number(inputLecturaEnergiaActual);

    if (isNaN(aguaAct) || isNaN(energiaAct) || aguaAct <= aguaAnt || energiaAct <= energiaAnt) {
      setFeedbackSupervisor({
        tipo: 'warning',
        mensaje: `⚠️ La lectura actual debe ser mayor a la lectura anterior registrada (${aguaAnt} m³ Agua / ${energiaAnt} kWh Energía).`
      });
      return;
    }

    const consumoAgua = Number((aguaAct - aguaAnt).toFixed(1));
    const consumoEnergia = Math.round(energiaAct - energiaAnt);
    const hayPicoFuga = consumoAgua > 52 || consumoEnergia > 780;

    const nuevoRegistro = {
      id: `MED-EPM-W${44 + lecturasMedidoresEpm.length - 1}`,
      semana: `Corte Semanal (${new Date().toISOString().slice(0, 10)})`,
      fecha_registro: new Date().toISOString().slice(0, 16).replace('T', ' '),
      agua_lectura_anterior_m3: aguaAnt,
      agua_lectura_actual_m3: aguaAct,
      agua_consumo_m3: consumoAgua,
      energia_lectura_anterior_kwh: energiaAnt,
      energia_lectura_actual_kwh: energiaAct,
      energia_consumo_kwh: consumoEnergia,
      estado_alerta: hayPicoFuga
        ? ('⚠️ Alerta Posible Fuga / Sobrecosto EPM' as const)
        : ('🟢 Consumo Normal' as const),
      observacion:
        inputObsMedidorEpm.trim() ||
        (hayPicoFuga
          ? '⚠️ Desviación superior al promedio semanal: Revisar flotadores de tanques y bombas.'
          : 'Consumo semanal dentro de parámetros normales.')
    };

    setLecturasMedidoresEpm(prev => [nuevoRegistro, ...prev]);
    setInputLecturaAguaActual(String(aguaAct + 44));
    setInputLecturaEnergiaActual(String(energiaAct + 680));

    appendAuditLog(
      hayPicoFuga ? 'EPM_METER_LEAK_ALERT' : 'EPM_METER_WEEKLY_READING',
      `Registró lectura de medidores EPM Zonas Comunes (${nuevoRegistro.id}): Agua ${consumoAgua} m³ (${aguaAnt}->${aguaAct}) | Energía ${consumoEnergia} kWh (${energiaAnt}->${energiaAct}). Estado: ${nuevoRegistro.estado_alerta}.`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: hayPicoFuga ? 'warning' : 'success',
      mensaje: hayPicoFuga
        ? `⚠️ ALERTA PREVENTIVA DE CONSUMO EPM: Se registraron ${consumoAgua} m³ de agua y ${consumoEnergia} kWh. Posible fuga interna detectada antes de que llegue la factura al Tab 3.2 del Admin.`
        : `⚡ Lectura semanal de medidores EPM registrada (${consumoAgua} m³ agua / ${consumoEnergia} kWh energía). Sin fugas detectadas.`
    });
  };

  // Escalar directamente cualquier daño técnico de una Ronda en Bitácora como Orden de Trabajo al Tab 4.2
  const handleEscalarRondaAOrdenTrabajoTab42 = (ronda: RegistroRondaBitacoraPH) => {
    const nuevoIdOt = `OT-2026-0${44 + ordenesTrabajo.length}`;
    const contratistaDefault = personalList.find(p => p.role === 'contratista') || personalList[0];

    const nuevaOrden: OrdenTrabajoContratista = {
      id: nuevoIdOt,
      contratista_id: contratistaDefault ? contratistaDefault.id : 208,
      contratista_nombre: contratistaDefault
        ? contratistaDefault.full_name
        : 'Mantenimiento Técnico Locativo S.A.S.',
      tarea_especifica: `[Escalada de Ronda ${ronda.id}] ${ronda.observacion_detallada}`,
      zona_intervenida: `${ronda.punto_control} (Tag ${ronda.tag_nfc_verificado})`,
      fecha_ingreso_autorizada: `Urgente Hoy (${ronda.hora_exacta})`,
      costo_estimado: 380000,
      estado_orden: 'Autorizada en Portería'
    };

    setOrdenesTrabajo(prev => [nuevaOrden, ...prev]);

    appendAuditLog(
      'RONDA_ESCALADA_ORDEN_TAB4_2',
      `Escaló hallazgo técnico de Ronda ${ronda.id} (${ronda.punto_control}) como nueva Orden de Trabajo ${nuevoIdOt} en el Tab 4.2 / Tab 3.3 Admin.`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'info',
      mensaje: `🛠️ Hallazgo de la Ronda ${ronda.id} escalado exitosamente como Orden de Trabajo ${nuevoIdOt} en el Tab 4.2 (Control de Contratistas).`
    });
  };

  // Escalar directamente cualquier ronda a Convivencia Tab 3.4 del Admin si no estaba escalada aún
  const handleEscalarRondaDirectoTab34 = (ronda: RegistroRondaBitacoraPH) => {
    if (ronda.escalado_tab3_4) {
      setFeedbackSupervisor({
        tipo: 'info',
        mensaje: `ℹ️ La Ronda ${ronda.id} ya se encuentra escalada al Tab 3.4 del Administrador (${ronda.acta_sancion_generada}).`
      });
      return;
    }

    const unidadRef: UnidadCarteraPH =
      unidades.find(u => u.numero_unidad === ronda.unidad_involucrada) ||
      unidades[5] ||
      unidades[0] || {
        id: 1,
        numero_unidad: ronda.unidad_involucrada || 'Torre 1 - Apto 101',
        propietario: ronda.propietario_involucrado || 'Propietario Registrado',
        documento_nit: 'CC 71.000.101',
        telefono_whatsapp: '+57 300 000 0000',
        email: 'propietario@urbix.ph',
        coeficiente: 1.5,
        cuota_base: 450000,
        capital_vencido: 0,
        intereses_mora: 0,
        costos_prejuridicos: 0,
        saldo_actual: 0,
        estado_cartera: 'Al día'
      };
    const codigoActa = `ACTA-CONV-0${91 + sancionesList.length}`;
    const nuevaSancionId = `SAN-2026-${String(sancionesList.length + 25).padStart(3, '0')}`;

    const nuevaSancion: SancionConvivenciaPH = {
      id: nuevaSancionId,
      acta_num: codigoActa,
      unidad_id: unidadRef.id,
      numero_unidad: unidadRef.numero_unidad,
      propietario: unidadRef.propietario,
      tipo_falta: ronda.tipo_falta_convivencia || 'Afectación a fachada / obras no autorizadas',
      tipo_sancion: '1° Llamado de Atención Pedagógico ($0)',
      monto_multa: 0,
      tope_maximo_legal: unidadRef.cuota_base * 2,
      fecha: ronda.fecha_dia,
      estado_proceso: 'Notificada - Descargos',
      observacion_acta: `Escalada desde Bitácora de Ronda ${ronda.id} (${ronda.tag_nfc_verificado} - ${ronda.hora_exacta}): ${ronda.observacion_detallada}`
    };

    setSancionesList(prev => [nuevaSancion, ...prev]);
    setRondasBitacora(prev =>
      prev.map(r =>
        r.id === ronda.id
          ? {
              ...r,
              escalado_tab3_4: true,
              acta_sancion_generada: codigoActa,
              unidad_involucrada: unidadRef.numero_unidad,
              propietario_involucrado: unidadRef.propietario
            }
          : r
      )
    );

    if (modalDetalleRonda && modalDetalleRonda.id === ronda.id) {
      setModalDetalleRonda({
        ...ronda,
        escalado_tab3_4: true,
        acta_sancion_generada: codigoActa,
        unidad_involucrada: unidadRef.numero_unidad,
        propietario_involucrado: unidadRef.propietario
      });
    }

    appendAuditLog(
      'RONDA_ESCALADA_TAB3_4_DIRECTO',
      `Escaló novedad de Ronda ${ronda.id} (${ronda.punto_control}) al Tab 3.4 del Administrador bajo expediente ${codigoActa} (${unidadRef.numero_unidad}).`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'warning',
      mensaje: `⚖️ Ronda ${ronda.id} escalada en vivo al Tab 3.4 del Administrador (${codigoActa} — ${unidadRef.numero_unidad}).`
    });
  };

  // Sincronización inicial opcional con Supabase (Modo Resiliente)
  useEffect(() => {
    async function syncSupervisorTables() {
      if (isPlaceholderSupabase) return;
      try {
        const { data: cmData } = await supabase.from('caja_menor_ph').select('*').order('id', { ascending: false });
        if (cmData && cmData.length > 0) {
          // Mantiene datos locales enriquecidos si la tabla está vacía
        }
      } catch {
        // Modo resiliente activo
      }
    }
    syncSupervisorTables();
  }, []);

  const formatCOP = (valor: number) => `$${Math.round(valor).toLocaleString('es-CO')} COP`;

  // ============================================================================
  // 1. CÁLCULOS DINÁMICOS DE LOS 4 KPIs OPERATIVOS DEL SUPERVISOR
  // ============================================================================
  const totalGastadoCajaMenorSemana = movimientosCajaMenor
    .filter(m => m.estado_reembolso !== 'Reembolsado por Admin ✅')
    .reduce((acc, m) => acc + m.monto, 0);

  const saldoCajaMenorDisponible = Math.max(0, FONDO_FIJO_CAJA_MENOR_ASIGNADO - totalGastadoCajaMenorSemana);
  const porcentajeDisponibleCajaMenor = Number(
    ((saldoCajaMenorDisponible / FONDO_FIJO_CAJA_MENOR_ASIGNADO) * 100).toFixed(1)
  );
  const alertaCajaMenorCritica = porcentajeDisponibleCajaMenor < 20;

  const soportesPendientesCount = soportesPago.filter(s => s.estado === 'Pendiente por Conciliar').length;
  const soportesConciliadosCount = soportesPago.filter(s => s.estado === 'Conciliado y Aplicado ✅').length;

  const pqrsYMudanzasAbiertasHoy = solicitudesPqrsMudanza.filter(
    s => s.estado_atencion === 'Abierta Hoy' || s.estado_atencion === 'En Verificación Terreno'
  ).length;

  const pqrsResueltasOAutorizadas = solicitudesPqrsMudanza.filter(
    s => s.estado_atencion === 'Autorizada Portería ✅' || s.estado_atencion === 'Resuelta en Terreno ✅'
  ).length;

  const nivelCumplimientoTerreno = Math.min(
    100,
    Math.round(
      86 +
        soportesConciliadosCount * 2.5 +
        pqrsResueltasOAutorizadas * 2
    )
  );

  // ============================================================================
  // 2. FUNCIONES DE CONCILIACIÓN RÁPIDA DE PAGOS (CONECTADA AL TAB 3.1 DEL ADMIN)
  // ============================================================================
  const handleConciliarYAplicarPago = async (
    soporte: SoporteConciliacionPH,
    montoAbonoOpcional?: number
  ) => {
    if (soporte.estado !== 'Pendiente por Conciliar') return;

    const unidadTarget: UnidadCarteraPH =
      unidades.find(u => u.id === soporte.unidad_id) || {
        id: soporte.unidad_id,
        numero_unidad: soporte.numero_unidad,
        propietario: soporte.propietario,
        documento_nit: 'CC 71.000.101',
        telefono_whatsapp: '+57 300 000 0000',
        email: 'propietario@urbix.ph',
        coeficiente: 1.5,
        cuota_base: 450000,
        capital_vencido: soporte.monto_reportado,
        intereses_mora: 0,
        costos_prejuridicos: 0,
        saldo_actual: soporte.monto_reportado,
        estado_cartera: 'Al día'
      };

    const montoAplicar =
      montoAbonoOpcional && montoAbonoOpcional > 0
        ? Math.round(montoAbonoOpcional)
        : soporte.monto_reportado;
    const esAbonoParcial = montoAplicar < soporte.monto_reportado || montoAplicar < (unidadTarget?.saldo_actual ?? 0);
    const fechaActual = new Date().toISOString().slice(0, 16).replace('T', ' ');

    // 1. Descontar automáticamente del saldo_actual de esa unidad en el estado compartido (Tab 3.1 Admin)
    setUnidades(prev =>
      prev.map(u => {
        if (u.id !== soporte.unidad_id) return u;
        let remanente = montoAplicar;

        const nuevoPrejuridico = Math.max(0, u.costos_prejuridicos - remanente);
        remanente = Math.max(0, remanente - u.costos_prejuridicos);

        const nuevoInteres = Math.max(0, u.intereses_mora - remanente);
        remanente = Math.max(0, remanente - u.intereses_mora);

        const nuevoCapital = Math.max(0, u.capital_vencido - remanente);
        const nuevoSaldo = Math.max(0, u.saldo_actual - montoAplicar);

        let nuevoEstado: UnidadCarteraPH['estado_cartera'] = u.estado_cartera;
        if (nuevoSaldo === 0) {
          nuevoEstado = 'Al día';
        } else if (nuevoSaldo <= u.cuota_base) {
          nuevoEstado = 'Mora 30';
        } else if (nuevoSaldo <= u.cuota_base * 2.5) {
          nuevoEstado = 'Mora 60';
        }

        return {
          ...u,
          costos_prejuridicos: nuevoPrejuridico,
          intereses_mora: nuevoInteres,
          capital_vencido: nuevoCapital,
          saldo_actual: nuevoSaldo,
          estado_cartera: nuevoEstado
        };
      })
    );

    // 2. Insertar en recaudos_ph (Estado compartido con Tab 3.1 del Admin)
    const metodoNormalizado: RegistroRecaudoPH['metodo_pago'] =
      soporte.canal_bancario === 'PSE Pasarela'
        ? 'PSE'
        : soporte.canal_bancario === 'Transferencia Bancolombia'
        ? 'Transferencia'
        : 'Consignación';

    const nuevoRecaudo: RegistroRecaudoPH = {
      id: `REC-SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      unidad_id: soporte.unidad_id,
      numero_unidad: soporte.numero_unidad,
      propietario: soporte.propietario,
      monto_pagado: montoAplicar,
      concepto: esAbonoParcial ? 'Acuerdo de Pago' : soporte.concepto,
      metodo_pago: metodoNormalizado,
      fecha: fechaActual
    };

    setRecaudos(prev => [nuevoRecaudo, ...prev]);

    // 3. Actualizar estado del soporte en la bandeja del Supervisor
    setSoportesPago(prev =>
      prev.map(s =>
        s.id === soporte.id
          ? {
              ...s,
              estado: 'Conciliado y Aplicado ✅',
              nota_observacion: esAbonoParcial
                ? `Abono parcial aplicado por ${formatCOP(montoAplicar)} (Ref. ${soporte.referencia_bancaria}) en Cartera Tab 3.1`
                : `Pago total verificado (${soporte.referencia_bancaria}) y aplicado a Cartera Tab 3.1`
            }
          : s
      )
    );

    // 4. Sincronizar con Supabase si está configurado
    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('recaudos_ph').insert([nuevoRecaudo]);
      } catch {
        // Respaldo local activo
      }
    }

    // 5. Registrar en audit_logs con ejecutor "Supervisor en Terreno"
    appendAuditLog(
      esAbonoParcial ? 'SUPERVISOR_PARTIAL_PAYMENT_APPLIED' : 'SUPERVISOR_PAYMENT_RECONCILED',
      `Concilió ${esAbonoParcial ? 'Abono Parcial' : 'Pago Total'} en soporte ${soporte.id} (${soporte.referencia_bancaria}) de ${soporte.numero_unidad} (${soporte.propietario}) por ${formatCOP(montoAplicar)}. Cartera Tab 3.1 actualizada en vivo.`,
      'Supervisor en Terreno'
    );

    setFeedbackSupervisor({
      tipo: 'success',
      mensaje: `✅ ${esAbonoParcial ? 'Abono Parcial' : 'Pago Total'} (${soporte.id}) conciliado con éxito. Se descontaron ${formatCOP(montoAplicar)} del saldo de ${soporte.numero_unidad} en el Tab 3.1 del Administrador.`
    });
    setModalComprobanteConciliacion(null);
  };

  const handleConfirmarRechazoSoporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRechazoSoporte) return;

    const observacionFinal = motivoRechazoInput.trim() || 'Inconsistencia en número de referencia bancaria o imagen ilegible';

    setSoportesPago(prev =>
      prev.map(s =>
        s.id === modalRechazoSoporte.id
          ? {
              ...s,
              estado: 'Rechazado (Inconsistente) ❌',
              nota_observacion: observacionFinal
            }
          : s
      )
    );

    appendAuditLog(
      'SUPERVISOR_PAYMENT_REJECTED',
      `Rechazó soporte ${modalRechazoSoporte.id} (${modalRechazoSoporte.referencia_bancaria}) de ${modalRechazoSoporte.numero_unidad}. Motivo: ${observacionFinal}`,
      'Supervisor en Terreno'
    );

    setFeedbackSupervisor({
      tipo: 'danger',
      mensaje: `❌ Soporte ${modalRechazoSoporte.id} (${modalRechazoSoporte.numero_unidad}) marcado como RECHAZADO por inconsistencia bancaria. Registrado en Bitácora.`
    });

    setModalRechazoSoporte(null);
  };

  // ============================================================================
  // 3. MOTOR DE GESTIÓN DE CAJA MENOR (CONECTADO AL TAB 3.2 DE EGRESOS DEL ADMIN)
  // ============================================================================
  const handleRegistrarGastoCajaMenor = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNumerico = Number(cmMonto);

    if (!cmConcepto.trim() || !cmProveedor.trim() || !cmRecibo.trim() || !montoNumerico || montoNumerico <= 0) {
      setFeedbackSupervisor({
        tipo: 'warning',
        mensaje: '⚠️ Completa el concepto del gasto, proveedor/ferretería, N° de recibo y un monto válido en COP.'
      });
      return;
    }

    // Validación estricta de tope máximo permitido para el Supervisor ($300.000 COP sin firma del Admin)
    if (montoNumerico > TOPE_MAXIMO_GASTO_SUPERVISOR) {
      appendAuditLog(
        'PETTY_CASH_LIMIT_BLOCKED',
        `Intento de gasto por ${formatCOP(montoNumerico)} (${cmConcepto}) bloqueado: supera el tope autónomo del Supervisor (${formatCOP(TOPE_MAXIMO_GASTO_SUPERVISOR)}). Requiere orden de compra firmada por el Administrador.`,
        'Supervisor en Terreno'
      );
      setFeedbackSupervisor({
        tipo: 'danger',
        mensaje: `⛔ TOPE EXCEDIDO: El monto (${formatCOP(montoNumerico)}) supera el límite autónomo del Supervisor de ${formatCOP(TOPE_MAXIMO_GASTO_SUPERVISOR)} por gasto sin firma del Administrador.`
      });
      return;
    }

    if (montoNumerico > saldoCajaMenorDisponible) {
      setFeedbackSupervisor({
        tipo: 'danger',
        mensaje: `⚠️ Fondos insuficientes en Caja Menor (Disponible: ${formatCOP(saldoCajaMenorDisponible)}). Solicita reembolso al Administrador antes de ejecutar este gasto.`
      });
      return;
    }

    const fechaHoy = new Date().toISOString().slice(0, 10);
    const fechaHora = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const nuevoIdCm = `CM-2026-${105 + movimientosCajaMenor.length}`;

    const nuevoMovimiento: MovimientoCajaMenorPH = {
      id: nuevoIdCm,
      recibo_num: cmRecibo.trim().toUpperCase(),
      fecha: fechaHora,
      concepto: cmConcepto.trim(),
      proveedor_ferreteria: cmProveedor.trim(),
      nit_proveedor: cmNit.trim() || '900.000.000-1',
      monto: montoNumerico,
      responsable: 'Supervisor en Terreno (Hernán Darío Mejía)',
      categoria_operativa: cmCategoria,
      estado_reembolso: 'Ejecutado de Fondo Fijo'
    };

    // 1. Agregar a movimientos de Caja Menor (descuenta automáticamente del saldo disponible)
    setMovimientosCajaMenor(prev => [nuevoMovimiento, ...prev]);

    // 2. Inyectar en tiempo real como gasto de categoría "Caja Menor" en el Tab 3.2 de Egresos del Administrador
    const nuevoEgresoAdmin: RegistroEgresoProveedorPH = {
      id: Date.now(),
      comprobante_num: `CM-SUP-${Math.floor(100 + Math.random() * 899)}`,
      fecha: fechaHoy,
      proveedor: cmProveedor.trim(),
      nit_rut: cmNit.trim() || '900.788.120-5',
      categoria: 'Caja Menor',
      concepto: `[Caja Menor Supervisor] ${cmConcepto.trim()}`,
      numero_factura: cmRecibo.trim().toUpperCase(),
      monto: montoNumerico,
      estado: 'Pagado'
    };

    setEgresos(prev => [nuevoEgresoAdmin, ...prev]);

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('caja_menor_ph').insert([nuevoMovimiento]);
        await supabase.from('egresos_ph').insert([nuevoEgresoAdmin]);
      } catch {
        // Modo resiliente
      }
    }

    // 3. Guardar en Bitácora Inmutable con ejecutor "Supervisor en Terreno"
    appendAuditLog(
      'SUPERVISOR_PETTY_CASH_EXPENSE',
      `Registró gasto de Caja Menor ${nuevoIdCm} (${cmRecibo.toUpperCase()}) en ${cmProveedor.trim()} por ${formatCOP(montoNumerico)} (${cmConcepto.trim()}). Sincronizado con Tab 3.2 Admin.`,
      'Supervisor en Terreno'
    );

    setFeedbackSupervisor({
      tipo: 'success',
      mensaje: `🧾 Gasto de Caja Menor (${formatCOP(montoNumerico)}) registrado y descontado del fondo fijo. Se inyectó automáticamente en el Tab 3.2 (Egresos) del Administrador.`
    });

    setCmConcepto('');
    setCmProveedor('');
    setCmRecibo('');
    setCmMonto('');
  };

  const handleSolicitarReembolsoCajaMenor = async () => {
    if (totalGastadoCajaMenorSemana <= 0) {
      setFeedbackSupervisor({
        tipo: 'info',
        mensaje: 'ℹ️ El Fondo Fijo de Caja Menor está al 100% ($1.500.000 COP). No hay gastos pendientes por reembolsar.'
      });
      return;
    }

    const montoReembolso = totalGastadoCajaMenorSemana;
    const fechaHoy = new Date().toISOString().slice(0, 10);
    const numSolicitud = `CXP-CM-${Math.floor(100 + Math.random() * 899)}`;

    // Crear Cuenta por Pagar en Tab 3.2 del Admin para el reembolso y marcar los recibos como reembolsados/repuestos
    const solicitudReembolsoEgreso: RegistroEgresoProveedorPH = {
      id: Date.now() + 1,
      comprobante_num: numSolicitud,
      fecha: fechaHoy,
      proveedor: 'Reembolso Fondo Fijo Caja Menor (Supervisor Terreno)',
      nit_rut: 'INTERNO-PH-675',
      categoria: 'Caja Menor',
      concepto: `Reposición de Fondo Fijo Caja Menor (${movimientosCajaMenor.filter(m => m.estado_reembolso !== 'Reembolsado por Admin ✅').length} soportes auditados)`,
      numero_factura: numSolicitud,
      monto: montoReembolso,
      estado: 'Cuenta por Pagar / Pendiente',
      vencimiento: 'Prioridad Caja Menor Hoy'
    };

    setEgresos(prev => [solicitudReembolsoEgreso, ...prev]);
    setMovimientosCajaMenor(prev =>
      prev.map(m => ({
        ...m,
        estado_reembolso: 'Reembolsado por Admin ✅'
      }))
    );
    setReembolsoSolicitadoPendiente(true);

    appendAuditLog(
      'SUPERVISOR_PETTY_CASH_REPLENISH',
      `Solicitó y legalizó reembolso de Caja Menor (${numSolicitud}) por ${formatCOP(montoReembolso)} ante el Administrador (Tab 3.2). Fondo fijo restaurado a ${formatCOP(FONDO_FIJO_CAJA_MENOR_ASIGNADO)}.`,
      'Supervisor en Terreno'
    );

    setFeedbackSupervisor({
      tipo: 'success',
      mensaje: `🔄 Legalización ${numSolicitud} enviada al Tab 3.2 del Administrador por ${formatCOP(montoReembolso)} y Fondo Fijo de Caja Menor restaurado a ${formatCOP(FONDO_FIJO_CAJA_MENOR_ASIGNADO)}.`
    });
  };

  // ============================================================================
  // 4. CENTRO DE ATENCIÓN DE PQRS OPERATIVAS Y AUTORIZACIÓN DE MUDANZAS
  // ============================================================================
  const handleRegistrarPqrsOMudanza = async (e: React.FormEvent) => {
    e.preventDefault();
    const unidadObj: UnidadCarteraPH =
      unidades.find(u => u.id === Number(pqrsUnidadId)) ||
      unidades[0] || {
        id: Number(pqrsUnidadId) || 1,
        numero_unidad: `Torre 1 - Apto ${pqrsUnidadId || '101'}`,
        propietario: 'Propietario Registrado',
        documento_nit: 'CC 71.000.101',
        telefono_whatsapp: '+57 300 000 0000',
        email: 'propietario@urbix.ph',
        coeficiente: 1.5,
        cuota_base: 450000,
        capital_vencido: 0,
        intereses_mora: 0,
        costos_prejuridicos: 0,
        saldo_actual: 0,
        estado_cartera: 'Al día'
      };
    if (!pqrsAsunto.trim()) {
      setFeedbackSupervisor({
        tipo: 'warning',
        mensaje: '⚠️ Selecciona la unidad solicitante y escribe el detalle de la PQRS o solicitud de mudanza/obra.'
      });
      return;
    }

    const esMudanza =
      pqrsTipo === 'Solicitud de Permiso de Mudanza / Trasteo o Ingreso de Material de Obra';
    const tieneMora = (unidadObj?.saldo_actual ?? 0) > 0;

    const nuevaSolicitud: SolicitudPqrsMudanzaPH = {
      id: `PQRS-2026-${401 + solicitudesPqrsMudanza.length}`,
      unidad_id: unidadObj.id,
      numero_unidad: unidadObj.numero_unidad,
      propietario: unidadObj.propietario,
      tipo_solicitud: pqrsTipo,
      asunto_detalle: pqrsAsunto.trim(),
      ubicacion_exacta: pqrsUbicacion.trim() || unidadObj.numero_unidad,
      prioridad: pqrsPrioridad,
      fecha_hora: new Date().toISOString().slice(0, 16).replace('T', ' '),
      deposito_garantia: esMudanza ? 250000 : 0,
      deposito_consignado: esMudanza ? pqrsDepositoConsignado : false,
      empresa_transporte_placa: esMudanza ? pqrsPlacaEmpresa.trim() : undefined,
      fecha_programada_mudanza: esMudanza ? pqrsFechaProgramada.trim() : undefined,
      estado_atencion: esMudanza && tieneMora ? 'Bloqueada por Mora ⚠️' : 'Abierta Hoy'
    };

    setSolicitudesPqrsMudanza(prev => [nuevaSolicitud, ...prev]);

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('pqrs_ph').insert([nuevaSolicitud]);
      } catch {
        // Respaldo en memoria
      }
    }

    appendAuditLog(
      'SUPERVISOR_PQRS_MOVING_LOG',
      `Radicó ${pqrsTipo} (${nuevaSolicitud.id}) para ${unidadObj.numero_unidad} (${unidadObj.propietario}): "${pqrsAsunto.trim()}". Estado cartera validado: ${tieneMora ? `MORA (${formatCOP(unidadObj.saldo_actual)})` : 'AL DÍA'}.`,
      'Supervisor en Terreno'
    );

    setFeedbackSupervisor({
      tipo: esMudanza && tieneMora ? 'warning' : 'success',
      mensaje:
        esMudanza && tieneMora
          ? `⚠️ Solicitud ${nuevaSolicitud.id} radicada, pero BLOQUEADA automáticamente: ${unidadObj.numero_unidad} presenta mora de ${formatCOP(unidadObj.saldo_actual)} en el Tab 3.1.`
          : `✅ Solicitud ${nuevaSolicitud.id} registrada exitosamente para ${unidadObj.numero_unidad}.`
    });

    setPqrsAsunto('');
  };

  const handleActualizarEstadoPqrs = (id: string, nuevoEstado: SolicitudPqrsMudanzaPH['estado_atencion']) => {
    const target = solicitudesPqrsMudanza.find(s => s.id === id);
    if (!target) return;

    setSolicitudesPqrsMudanza(prev =>
      prev.map(s => (s.id === id ? { ...s, estado_atencion: nuevoEstado } : s))
    );

    appendAuditLog(
      'SUPERVISOR_PQRS_STATUS',
      `Actualizó estado de ${id} (${target.numero_unidad}) a "${nuevoEstado}"`,
      'Supervisor en Terreno'
    );
  };

  const handleToggleDepositoMudanza = (id: string) => {
    setSolicitudesPqrsMudanza(prev =>
      prev.map(s =>
        s.id === id ? { ...s, deposito_consignado: !s.deposito_consignado } : s
      )
    );
  };

  const handleEmitirOrdenPorteriaMudanza = (solicitud: SolicitudPqrsMudanzaPH, unidadEnVivo: UnidadCarteraPH) => {
    setSolicitudesPqrsMudanza(prev =>
      prev.map(s =>
        s.id === solicitud.id ? { ...s, estado_atencion: 'Autorizada Portería ✅' } : s
      )
    );

    appendAuditLog(
      'SUPERVISOR_MOVING_PERMIT_ISSUED',
      `Emitió Paz y Salvo de Portería para Mudanza (${solicitud.id}) a favor de ${unidadEnVivo.numero_unidad} (${unidadEnVivo.propietario}). Cartera verificada: $0 COP.`,
      'Supervisor en Terreno'
    );

    setModalOrdenPorteriaMudanza({ solicitud, unidad: unidadEnVivo });
  };

  // ============================================================================
  // 5. EXPORTACIÓN .CSV DE CONCILIACIONES Y CAJA MENOR
  // ============================================================================
  const handleExportarCsvSupervisor = () => {
    const encabezadosConciliacion = [
      'SECCION',
      'ID_REGISTRO',
      'FECHA',
      'UNIDAD_O_PROVEEDOR',
      'TITULAR_O_NIT',
      'CONCEPTO_O_DETALLE',
      'REFERENCIA_O_RECIBO',
      'MONTO_COP',
      'ESTADO'
    ];

    const filasConciliacion = soportesPago.map(s => [
      'CONCILIACION_PAGOS',
      s.id,
      s.fecha_reporte,
      `"${s.numero_unidad}"`,
      `"${s.propietario}"`,
      `"${s.concepto} (${s.canal_bancario})"`,
      s.referencia_bancaria,
      s.monto_reportado,
      `"${s.estado}"`
    ]);

    const filasCajaMenor = movimientosCajaMenor.map(m => [
      'CAJA_MENOR_SUPERVISOR',
      m.id,
      m.fecha,
      `"${m.proveedor_ferreteria}"`,
      `"${m.nit_proveedor}"`,
      `"${m.concepto}"`,
      m.recibo_num,
      m.monto,
      `"${m.estado_reembolso}"`
    ]);

    const contenidoCsv = [
      encabezadosConciliacion.join(','),
      ...filasConciliacion.map(r => r.join(',')),
      ...filasCajaMenor.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UrbixPH_Supervisor_Conciliaciones_CajaMenor_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    appendAuditLog(
      'SUPERVISOR_CSV_EXPORT',
      `Exportó planilla consolidada de Conciliaciones (${soportesPago.length}) y Caja Menor (${movimientosCajaMenor.length}) en formato .CSV`,
      'Supervisor en Terreno'
    );
  };

  const solicitudesFiltradas = solicitudesPqrsMudanza.filter(item => {
    if (filtroPqrsTipo === 'Solo PQRS Locativas') {
      return item.tipo_solicitud === 'PQRS Técnica/Locativa';
    }
    if (filtroPqrsTipo === 'Solo Mudanzas y Obras') {
      return item.tipo_solicitud !== 'PQRS Técnica/Locativa';
    }
    return true;
  });

  // ============================================================================
  // LÓGICA Y HANDLERS DEL SUB-MÓDULO 4.2 (CONTROL DE CUADRILLAS, TURNOS & CONTRATISTAS)
  // ============================================================================
  // Restricción jerárquica estricta: el Supervisor SOLO puede ver, crear y gestionar
  // los roles 'vigilante', 'aseo' y 'contratista' (NUNCA 'super_admin', 'admin' ni 'supervisor').
  const cuadrillaOperativaCampo = personalList.filter(
    (p): p is PersonalOperativoPH & { role: RolCampoPermitidoSupervisor } =>
      p.role === 'vigilante' || p.role === 'aseo' || p.role === 'contratista'
  );

  const getMetaTrabajador = (p: PersonalOperativoPH): MetaCampoTrabajador => {
    const existing = metaCampoMap[p.id];
    if (existing) return existing;
    const defaultPuesto: PuestoZonaOperativaPH =
      p.role === 'vigilante'
        ? 'Portería Principal'
        : p.role === 'aseo'
        ? 'Aseo Torres 1 y 2'
        : 'Cuarto de Máquinas / Ascensores';
    const defaultTurno: TurnoCampoSupervisorPH =
      p.turno_horario === 'Tarde 2pm-10pm'
        ? 'Tarde 2pm-10pm'
        : p.turno_horario === 'Nocturno 10pm-6am'
        ? 'Nocturno 10pm-6am'
        : 'Diurno 6am-2pm';
    const defaultArl: EstadoPlanillaArlCampo =
      p.estado_arl === 'Vigente ✅' ? 'Vigente ✅' : 'Vencida - Bloquear Ingreso ⛔';
    const defaultAsistencia: EstadoAsistenciaCampo =
      p.estado_puerta === 'En Turno / Adentro' ? '🟢 En Puesto' : '🟡 En Almuerzo / Relevado';
    return {
      cedula_id: `CC 71.${String(p.id).padStart(3, '0')}.410`,
      empresa: p.entidad_arl.split('·')[0].trim() || 'Operación PH',
      puesto_zona: defaultPuesto,
      turno_campo: defaultTurno,
      planilla_arl_estado: defaultArl,
      asistencia_hoy: defaultAsistencia,
      hora_entrada: '06:00 AM (Registrado)',
      tareas_asignadas_hoy: [
        `Ejecución de protocolo operativo en ${defaultPuesto}`,
        'Reporte de novedades al Supervisor Operativo en terreno'
      ]
    };
  };

  // 1. Cálculos de los 4 KPIs de Mando en Terreno (Tab 4.2)
  const kpiVigilantesEnPuesto = cuadrillaOperativaCampo.filter(
    p => p.role === 'vigilante' && getMetaTrabajador(p).asistencia_hoy === '🟢 En Puesto'
  ).length;

  const kpiAseoEnTurnoActivo = cuadrillaOperativaCampo.filter(
    p => p.role === 'aseo' && getMetaTrabajador(p).asistencia_hoy === '🟢 En Puesto'
  ).length;

  const kpiContratistasTrabajandoHoy = cuadrillaOperativaCampo.filter(
    p => p.role === 'contratista' && getMetaTrabajador(p).asistencia_hoy === '🟢 En Puesto'
  ).length;

  const kpiAlertasArlVencida = cuadrillaOperativaCampo.filter(
    p => getMetaTrabajador(p).planilla_arl_estado === 'Vencida - Bloquear Ingreso ⛔' || p.estado_arl !== 'Vigente ✅'
  ).length;

  // 2. Handler: Alta Rápida de Cuadrilla Operativa y Asignación de Puesto (Herencia Módulo 2 con tope jerárquico)
  const handleIncorporarPersonalCuadrilla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuadNombre.trim() || !cuadCedula.trim() || !cuadWhatsapp.trim() || !cuadEmpresa.trim()) {
      setFeedbackSupervisor({
        tipo: 'warning',
        mensaje: '⚠️ Completa Nombre Completo, Cédula/ID, Teléfono WhatsApp y Empresa para incorporar al trabajador.'
      });
      return;
    }

    // Bloqueo jerárquico estricto de seguridad
    const rolesPermitidos: RolCampoPermitidoSupervisor[] = ['vigilante', 'aseo', 'contratista'];
    if (!rolesPermitidos.includes(cuadRol)) {
      setFeedbackSupervisor({
        tipo: 'danger',
        mensaje: '⛔ RESTRICCIÓN JERÁRQUICA: El Supervisor Operativo solo está autorizado para crear roles vigilante, aseo o contratista.'
      });
      return;
    }

    const nuevoId = Date.now();
    const emailGenerado = `${cuadNombre
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '.')
      .slice(0, 18)}@operaciones.urbix.ph`;

    const arlBloqueada = cuadArl === 'Vencida - Bloquear Ingreso ⛔';
    const turnoMapeadoAdmin: PersonalOperativoPH['turno_horario'] =
      cuadTurno === 'Turno 12h'
        ? 'Visita Técnica / Por Orden'
        : cuadTurno;

    const nuevoTrabajador: PersonalOperativoPH = {
      id: nuevoId,
      full_name: `${cuadNombre.trim()} (${cuadEmpresa.trim()})`,
      user_email: emailGenerado,
      telefono_whatsapp: cuadWhatsapp.trim(),
      role: cuadRol,
      turno_horario: turnoMapeadoAdmin,
      estado_arl: arlBloqueada ? 'Pendiente Verificación ⚠️' : 'Vigente ✅',
      entidad_arl: `${cuadEmpresa.trim()} · PILA ${arlBloqueada ? 'VENCIDA' : 'VIGENTE'}`,
      estado_puerta: arlBloqueada ? 'Fuera de Turno' : 'En Turno / Adentro',
      coproperty_assigned: 'P.H. Reserva del Tesoro'
    };

    const nuevaMeta: MetaCampoTrabajador = {
      cedula_id: cuadCedula.trim().toUpperCase(),
      empresa: cuadEmpresa.trim(),
      puesto_zona: cuadPuesto,
      turno_campo: cuadTurno,
      planilla_arl_estado: cuadArl,
      asistencia_hoy: arlBloqueada ? '🔴 Ausente / Sin Llegar' : '🟢 En Puesto',
      hora_entrada: arlBloqueada
        ? 'INGRESO BLOQUEADO EN PORTERÍA (ARL VENCIDA)'
        : `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Asignado Hoy)`,
      tareas_asignadas_hoy: [
        `Operación en puesto asignado: ${cuadPuesto} (${cuadTurno})`,
        `Cumplimiento de protocolo SG-SST con empresa ${cuadEmpresa.trim()}`
      ]
    };

    // 1. Insertar en el estado compartido de personalList (Tab 3.3 Admin)
    setPersonalList(prev => [nuevoTrabajador, ...prev]);
    setMetaCampoMap(prev => ({ ...prev, [nuevoId]: nuevaMeta }));

    // 2. Sincronizar en vivo con la tabla user_roles del Módulo 2 (Superadmin)
    if (onSyncNewUserRole) {
      onSyncNewUserRole({
        id: nuevoId,
        full_name: nuevoTrabajador.full_name,
        user_email: emailGenerado,
        role: cuadRol,
        coproperty_assigned: 'P.H. Reserva del Tesoro'
      });
    }

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('user_roles').insert([
          {
            full_name: nuevoTrabajador.full_name,
            user_email: emailGenerado,
            role: cuadRol,
            coproperty_assigned: 'P.H. Reserva del Tesoro'
          }
        ]);
      } catch {
        // Respaldo en memoria activo
      }
    }

    // 3. Registrar en audit_logs con ejecutor "Supervisor Operativo"
    appendAuditLog(
      'SUPERVISOR_CREW_ONBOARDING',
      `Incorporó a ${cuadNombre.trim()} (${cuadCedula.trim()} - ${cuadEmpresa.trim()}) con rol [${cuadRol.toUpperCase()}] en puesto "${cuadPuesto}" (${cuadTurno}). ARL: ${cuadArl}. Sincronizado con Módulo 2 y Tab 3.3 Admin.`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: arlBloqueada ? 'warning' : 'success',
      mensaje: arlBloqueada
        ? `⚠️ ${cuadNombre.trim()} fue registrado en user_roles, pero su ingreso en Portería quedó BLOQUEADO automáticamente por tener Planilla PILA / ARL Vencida.`
        : `✅ ${cuadNombre.trim()} (${cuadRol.toUpperCase()}) incorporado a la cuadrilla en "${cuadPuesto}" y sincronizado en vivo con el Tab 3.3 del Admin y Módulo 2.`
    });

    setCuadNombre('');
    setCuadCedula('');
    setCuadWhatsapp('');
  };

  // 3. Handlers: Supervisión y Acta de Recibo de Órdenes de Trabajo (Conectado a Tab 3.2 y 3.3 del Admin)
  const handleValidarArlAutorizarIngresoOrden = (orden: OrdenTrabajoContratista) => {
    const contratista = personalList.find(p => p.id === orden.contratista_id);
    const metaContratista = contratista ? getMetaTrabajador(contratista) : null;
    const arlVencida =
      metaContratista?.planilla_arl_estado === 'Vencida - Bloquear Ingreso ⛔' ||
      contratista?.estado_arl === 'Pendiente Verificación ⚠️';

    if (arlVencida) {
      appendAuditLog(
        'PORTERIA_ARL_ACCESS_BLOCKED',
        `Bloqueó ingreso en portería para Orden ${orden.id} (${orden.contratista_nombre}): Planilla PILA / ARL Vencida. Prohibido ingreso por riesgo legal Ley 675 / SG-SST.`,
        'Supervisor Operativo'
      );
      setFeedbackSupervisor({
        tipo: 'danger',
        mensaje: `⛔ BLOQUEO LEGAL EN PORTERÍA (${orden.id}): El contratista ${orden.contratista_nombre} tiene la Planilla PILA / ARL Vencida. Actualice su ARL en la tabla de cuadrilla antes de autorizar el ingreso.`
      });
      return;
    }

    setOrdenesTrabajo(prev =>
      prev.map(o => (o.id === orden.id ? { ...o, estado_orden: 'En Ejecución' } : o))
    );

    setMetaOrdenesMap(prev => ({
      ...prev,
      [orden.id]: {
        ...(prev[orden.id] || {
          orden_id: orden.id,
          empresa_contratista: orden.contratista_nombre,
          acta_recibida_satisfaccion: false,
          checklist_calidad: {
            epp_alturas_verificado: true,
            pruebas_funcionamiento_ok: true,
            limpieza_area_entregada: true,
            sin_danos_bienes_comunes: true
          },
          observaciones_tecnicas: 'Ingreso validado en portería con ARL vigente.'
        }),
        arl_verificada_porteria: true
      }
    }));

    appendAuditLog(
      'SUPERVISOR_WORK_ORDER_ENTRY_OK',
      `Validó ARL vigente y autorizó ingreso en portería para Orden ${orden.id} (${orden.contratista_nombre}) en zona "${orden.zona_intervenida}".`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'success',
      mensaje: `🪪 ARL verificada con éxito. Ingreso autorizado en Portería para ${orden.contratista_nombre} (Orden ${orden.id} en ejecución).`
    });
  };

  const handleAbrirModalInspeccionObra = (orden: OrdenTrabajoContratista) => {
    const meta = metaOrdenesMap[orden.id];
    setChkEpp(meta ? meta.checklist_calidad.epp_alturas_verificado : true);
    setChkPruebas(meta ? meta.checklist_calidad.pruebas_funcionamiento_ok : true);
    setChkLimpieza(meta ? meta.checklist_calidad.limpieza_area_entregada : true);
    setChkSinDanos(meta ? meta.checklist_calidad.sin_danos_bienes_comunes : true);
    setObsActaTecnica(
      meta?.observaciones_tecnicas ||
        `Inspección técnica en terreno de "${orden.tarea_especifica}" completada conforme a normas técnicas.`
    );
    setModalActaOrden(orden);
  };

  const handleFirmarRecibidoSatisfaccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalActaOrden) return;

    if (!chkEpp || !chkPruebas || !chkLimpieza || !chkSinDanos) {
      setFeedbackSupervisor({
        tipo: 'warning',
        mensaje: '⚠️ Debes verificar y marcar los 4 puntos del Checklist de Calidad Técnica antes de firmar el Recibido a Satisfacción.'
      });
      return;
    }

    const fechaFirma = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const fechaHoy = new Date().toISOString().slice(0, 10);

    // 1. Actualizar estado de la Orden de Trabajo a 'Finalizada' (Sincronizado con Tab 3.3 Admin)
    setOrdenesTrabajo(prev =>
      prev.map(o => (o.id === modalActaOrden.id ? { ...o, estado_orden: 'Finalizada' } : o))
    );

    setMetaOrdenesMap(prev => ({
      ...prev,
      [modalActaOrden.id]: {
        orden_id: modalActaOrden.id,
        empresa_contratista: modalActaOrden.contratista_nombre,
        arl_verificada_porteria: true,
        acta_recibida_satisfaccion: true,
        checklist_calidad: {
          epp_alturas_verificado: chkEpp,
          pruebas_funcionamiento_ok: chkPruebas,
          limpieza_area_entregada: chkLimpieza,
          sin_danos_bienes_comunes: chkSinDanos
        },
        observaciones_tecnicas: obsActaTecnica.trim(),
        fecha_firma_acta: fechaFirma
      }
    }));

    // 2. Habilitar el pago al Administrador en el Tab 3.2 (Egresos):
    // Si existe una cuenta por pagar relacionada o creamos el registro avalado para pago en Tab 3.2
    const nuevoComprobanteAvalado: RegistroEgresoProveedorPH = {
      id: Date.now(),
      comprobante_num: `AVAL-${modalActaOrden.id}`,
      fecha: fechaHoy,
      proveedor: modalActaOrden.contratista_nombre,
      nit_rut: '900.812.440-1',
      categoria: 'Mantenimiento',
      concepto: `[AVAL TÉCNICO SUPERVISOR ✅ - HABILITADO PAGO] ${modalActaOrden.tarea_especifica} (${obsActaTecnica.trim()})`,
      numero_factura: `FAC-${modalActaOrden.id}`,
      monto: modalActaOrden.costo_estimado,
      estado: 'Cuenta por Pagar / Pendiente',
      vencimiento: 'Avalada por Supervisor - Lista para Pago'
    };

    setEgresos(prev => [nuevoComprobanteAvalado, ...prev]);

    // 3. Registrar en audit_logs con ejecutor "Supervisor Operativo"
    appendAuditLog(
      'SUPERVISOR_WORK_ORDER_SIGNED_OK',
      `Firmó Acta de Recibido a Satisfacción para Orden ${modalActaOrden.id} (${modalActaOrden.contratista_nombre}) por ${formatCOP(modalActaOrden.costo_estimado)}. Habilitó pago de factura en Tab 3.2 del Administrador.`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'success',
      mensaje: `✅ Acta Técnica de la Orden ${modalActaOrden.id} firmada a satisfacción. Se notificó y habilitó la factura por ${formatCOP(modalActaOrden.costo_estimado)} en el Tab 3.2 del Administrador.`
    });

    setModalActaOrden(null);
  };

  // 4. Handlers: Tabla Operativa de Control de Asistencia, Relevos y Zonas
  const handleCambiarPuestoTrabajador = (trabajador: PersonalOperativoPH, nuevoPuesto: PuestoZonaOperativaPH) => {
    const metaActual = getMetaTrabajador(trabajador);
    setMetaCampoMap(prev => ({
      ...prev,
      [trabajador.id]: {
        ...metaActual,
        puesto_zona: nuevoPuesto
      }
    }));

    appendAuditLog(
      'SUPERVISOR_POST_REASSIGNMENT',
      `Reubicó a ${trabajador.full_name} al puesto/zona "${nuevoPuesto}" por contingencia operativa.`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'info',
      mensaje: `📍 ${trabajador.full_name} reubicado inmediatamente al puesto "${nuevoPuesto}".`
    });
  };

  const handleCambiarTurnoTrabajador = (trabajador: PersonalOperativoPH, nuevoTurno: TurnoCampoSupervisorPH) => {
    const metaActual = getMetaTrabajador(trabajador);
    const turnoMapeadoAdmin: PersonalOperativoPH['turno_horario'] =
      nuevoTurno === 'Turno 12h' ? 'Visita Técnica / Por Orden' : nuevoTurno;

    setPersonalList(prev =>
      prev.map(p => (p.id === trabajador.id ? { ...p, turno_horario: turnoMapeadoAdmin } : p))
    );

    setMetaCampoMap(prev => ({
      ...prev,
      [trabajador.id]: {
        ...metaActual,
        turno_campo: nuevoTurno
      }
    }));

    appendAuditLog(
      'SUPERVISOR_SHIFT_CHANGE',
      `Cambió el turno de ${trabajador.full_name} a "${nuevoTurno}" (Sincronizado con Tab 3.3 Admin).`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'info',
      mensaje: `🕒 Turno de ${trabajador.full_name} actualizado a "${nuevoTurno}".`
    });
  };

  const handleToggleEstadoArlTrabajador = (trabajador: PersonalOperativoPH) => {
    const metaActual = getMetaTrabajador(trabajador);
    const estabaVigente = metaActual.planilla_arl_estado === 'Vigente ✅';
    const nuevoEstadoArl: EstadoPlanillaArlCampo = estabaVigente
      ? 'Vencida - Bloquear Ingreso ⛔'
      : 'Vigente ✅';

    setPersonalList(prev =>
      prev.map(p =>
        p.id === trabajador.id
          ? {
              ...p,
              estado_arl: nuevoEstadoArl === 'Vigente ✅' ? 'Vigente ✅' : 'Pendiente Verificación ⚠️',
              estado_puerta: nuevoEstadoArl === 'Vigente ✅' ? 'En Turno / Adentro' : 'Fuera de Turno'
            }
          : p
      )
    );

    setMetaCampoMap(prev => ({
      ...prev,
      [trabajador.id]: {
        ...metaActual,
        planilla_arl_estado: nuevoEstadoArl,
        asistencia_hoy:
          nuevoEstadoArl === 'Vencida - Bloquear Ingreso ⛔'
            ? '🔴 Ausente / Sin Llegar'
            : '🟢 En Puesto',
        hora_entrada:
          nuevoEstadoArl === 'Vencida - Bloquear Ingreso ⛔'
            ? 'BLOQUEADO EN PORTERÍA (ARL VENCIDA)'
            : `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (PILA Verificada)`
      }
    }));

    appendAuditLog(
      'SUPERVISOR_ARL_STATUS_UPDATE',
      `Actualizó estado de Planilla PILA / ARL de ${trabajador.full_name} a "${nuevoEstadoArl}".`,
      'Supervisor Operativo'
    );
  };

  const handleMarcarEntradaRelevoTurno = (trabajador: PersonalOperativoPH) => {
    const metaActual = getMetaTrabajador(trabajador);

    if (metaActual.planilla_arl_estado === 'Vencida - Bloquear Ingreso ⛔') {
      setFeedbackSupervisor({
        tipo: 'danger',
        mensaje: `⛔ INGRESO BLOQUEADO: ${trabajador.full_name} presenta ARL / Seguridad Social Vencida. No puede marcar entrada en portería.`
      });
      return;
    }

    const ordenCiclo: EstadoAsistenciaCampo[] = [
      '🟢 En Puesto',
      '🟡 En Almuerzo / Relevado',
      '🔴 Ausente / Sin Llegar'
    ];
    const idxActual = ordenCiclo.indexOf(metaActual.asistencia_hoy);
    const siguienteAsistencia = ordenCiclo[(idxActual + 1) % ordenCiclo.length];
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setPersonalList(prev =>
      prev.map(p =>
        p.id === trabajador.id
          ? {
              ...p,
              estado_puerta: siguienteAsistencia === '🟢 En Puesto' ? 'En Turno / Adentro' : 'Fuera de Turno'
            }
          : p
      )
    );

    setMetaCampoMap(prev => ({
      ...prev,
      [trabajador.id]: {
        ...metaActual,
        asistencia_hoy: siguienteAsistencia,
        hora_entrada:
          siguienteAsistencia === '🟢 En Puesto'
            ? `${horaActual} (Entrada en Puesto)`
            : siguienteAsistencia === '🟡 En Almuerzo / Relevado'
            ? `${horaActual} (En Relevo Temporal)`
            : `${horaActual} (Ausente de Puesto)`
      }
    }));

    appendAuditLog(
      'SUPERVISOR_ATTENDANCE_RELIEF',
      `Marcó novedad de asistencia/relevo para ${trabajador.full_name}: "${siguienteAsistencia}" a las ${horaActual}.`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'success',
      mensaje: `✅ Asistencia / Relevo actualizado para ${trabajador.full_name}: ${siguienteAsistencia} (${horaActual}).`
    });
  };

  const handleReportarReemplazoIncapacidad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalExpedienteTrabajador || !reemplazoNombreInput.trim()) return;

    const metaActual = getMetaTrabajador(modalExpedienteTrabajador);
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const detalleReemplazo = `Reemplazado por ${reemplazoNombreInput.trim()} (${reemplazoMotivoInput.trim()}) a las ${horaActual}`;

    setMetaCampoMap(prev => ({
      ...prev,
      [modalExpedienteTrabajador.id]: {
        ...metaActual,
        asistencia_hoy: '🟡 En Almuerzo / Relevado',
        reemplazo_incapacidad: detalleReemplazo
      }
    }));

    appendAuditLog(
      'SUPERVISOR_SICK_LEAVE_REPLACEMENT',
      `Registró reemplazo por incapacidad para ${modalExpedienteTrabajador.full_name} en puesto "${metaActual.puesto_zona}": cubre ${reemplazoNombreInput.trim()} (${reemplazoMotivoInput.trim()}).`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'info',
      mensaje: `🔄 Reemplazo por incapacidad registrado: ${reemplazoNombreInput.trim()} asume el puesto "${metaActual.puesto_zona}" de ${modalExpedienteTrabajador.full_name}.`
    });

    setReemplazoNombreInput('');
    setModalExpedienteTrabajador(null);
  };

  // Exportar Planilla de Turnos y Asistencia (.CSV)
  const handleExportarPlanillaTurnosCsv = () => {
    const headers = [
      'ID',
      'TRABAJADOR',
      'CEDULA_ID',
      'EMPRESA',
      'ROL_OPERATIVO',
      'PUESTO_ZONA_ASIGNADA',
      'TURNO_ACTUAL',
      'ESTADO_ARL_PILA',
      'ASISTENCIA_HOY',
      'HORA_ENTRADA_O_NOVEDAD',
      'REEMPLAZO_CONTINGENCIA'
    ];

    const rows = cuadrillaOperativaCampo.map(p => {
      const m = getMetaTrabajador(p);
      return [
        p.id,
        `"${p.full_name}"`,
        `"${m.cedula_id}"`,
        `"${m.empresa}"`,
        p.role.toUpperCase(),
        `"${m.puesto_zona}"`,
        `"${m.turno_campo}"`,
        `"${m.planilla_arl_estado}"`,
        `"${m.asistencia_hoy}"`,
        `"${m.hora_entrada}"`,
        `"${m.reemplazo_incapacidad || 'Titular en Puesto'}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UrbixPH_Planilla_Turnos_Asistencia_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    appendAuditLog(
      'SUPERVISOR_EXPORT_SHIFTS_CSV',
      `Exportó Planilla de Turnos, Cuadrillas y Asistencia (${cuadrillaOperativaCampo.length} operarios) en formato .CSV`,
      'Supervisor Operativo'
    );
  };

  const cuadrillaFiltrada = cuadrillaOperativaCampo.filter(p => {
    const meta = getMetaTrabajador(p);
    const cumpleRol =
      filtroRolCuadrilla === 'Todos'
        ? true
        : filtroRolCuadrilla === 'Vigilantes'
        ? p.role === 'vigilante'
        : filtroRolCuadrilla === 'Aseo'
        ? p.role === 'aseo'
        : p.role === 'contratista';

    const term = busquedaCuadrilla.trim().toLowerCase();
    const cumpleBusqueda =
      !term ||
      p.full_name.toLowerCase().includes(term) ||
      meta.cedula_id.toLowerCase().includes(term) ||
      meta.empresa.toLowerCase().includes(term) ||
      meta.puesto_zona.toLowerCase().includes(term);

    return cumpleRol && cumpleBusqueda;
  });

  // ============================================================================
  // LÓGICA Y HANDLERS DEL SUB-MÓDULO 4.3 (BITÁCORA DE RONDAS, EQUIPOS CRÍTICOS & CIERRE DE TURNO)
  // ============================================================================
  // 1. Cálculos de los 4 KPIs de Salud Técnica e Infraestructura de la Unidad
  const rondasVerificadasCount = rondasBitacora.length;
  const metaRondasDiarias = 4;

  const equiposOperativosCount = equiposCriticos.filter(
    eq => eq.estado === '🟢 Operativo / Óptimo'
  ).length;
  const equiposEnFallaCount = equiposCriticos.filter(
    eq => eq.estado === '🔴 En Falla / Urgente'
  ).length;
  const porcentajeOperatividadEquipos = Math.round(
    (equiposOperativosCount / equiposCriticos.length) * 100
  );

  // Cumplimiento sanitario Ley 1209 de 2008: pH ideal [7.2 - 7.6], Cloro Residual ideal [1.0 - 3.0 ppm]
  const cumplePhLey1209 =
    medicionPiscina.ph_actual >= 7.2 && medicionPiscina.ph_actual <= 7.6;
  const cumpleCloroLey1209 =
    medicionPiscina.cloro_residual_ppm >= 1.0 &&
    medicionPiscina.cloro_residual_ppm <= 3.0;
  const cumpleLey1209Piscina =
    cumplePhLey1209 &&
    cumpleCloroLey1209 &&
    medicionPiscina.claridad_agua !== 'No Apta - Clausura Preventiva ⛔';

  const incidentesSeguridad24hCount =
    rondasBitacora.filter(r => r.estado !== '🟢 Sin Novedad').length +
    equiposEnFallaCount;

  // 2. Handler: Alternar ítem de checklist técnico en vivo
  const handleToggleChecklistEquipo = (
    equipoId: EquipoCriticoVitalPH['id'],
    itemId: string
  ) => {
    setEquiposCriticos(prev =>
      prev.map(eq => {
        if (eq.id !== equipoId) return eq;
        const nuevosItems = eq.items_checklist.map(it =>
          it.id === itemId ? { ...it, verificado: !it.verificado } : it
        );
        return {
          ...eq,
          items_checklist: nuevosItems,
          ultima_inspeccion: `Hoy ${new Date().toTimeString().slice(0, 5)}`
        };
      })
    );
  };

  // Handler: Registrar medición sanitaria diaria de Piscina, Jacuzzi y Turco (Ley 1209)
  const handleRegistrarMedicionPiscinaLey1209 = async (e: React.FormEvent) => {
    e.preventDefault();
    const phNum = Number(inputPhPiscina);
    const cloroNum = Number(inputCloroPiscina);
    const tempNum = Number(inputTempPiscina);

    if (
      Number.isNaN(phNum) ||
      phNum <= 0 ||
      Number.isNaN(cloroNum) ||
      cloroNum < 0 ||
      Number.isNaN(tempNum)
    ) {
      setFeedbackSupervisor({
        tipo: 'warning',
        mensaje: '⚠️ Ingresa valores numéricos válidos para pH, Cloro Residual (ppm) y Temperatura (°C).'
      });
      return;
    }

    const horaMedicion = new Date().toTimeString().slice(0, 5);
    const phOk = phNum >= 7.2 && phNum <= 7.6;
    const cloroOk = cloroNum >= 1.0 && cloroNum <= 3.0;
    const sanitariaOk =
      phOk && cloroOk && inputClaridadPiscina !== 'No Apta - Clausura Preventiva ⛔';

    const nuevaMedicion: MedicionPiscinaLey1209 = {
      ph_actual: Number(phNum.toFixed(2)),
      cloro_residual_ppm: Number(cloroNum.toFixed(2)),
      temperatura_c: Number(tempNum.toFixed(1)),
      claridad_agua: inputClaridadPiscina,
      ultima_medicion_hora: `Hoy ${horaMedicion}`,
      operario_piscinero: 'Supervisor Operativo / Piscinero'
    };

    setMedicionPiscina(nuevaMedicion);

    setEquiposCriticos(prev =>
      prev.map(eq =>
        eq.id === 'EQ-PISCINA'
          ? {
              ...eq,
              estado: sanitariaOk
                ? '🟢 Operativo / Óptimo'
                : '🔴 En Falla / Urgente',
              ultima_inspeccion: `Hoy ${horaMedicion}`,
              metricas_clave: [
                {
                  label: 'Nivel actual de pH',
                  valor: `${nuevaMedicion.ph_actual} (Ideal 7.2 - 7.6)`,
                  alerta: !phOk
                },
                {
                  label: 'Cloro Residual Libre',
                  valor: `${nuevaMedicion.cloro_residual_ppm} ppm (Ideal 1.0 - 3.0)`,
                  alerta: !cloroOk
                },
                {
                  label: 'Temperatura & Claridad',
                  valor: `${nuevaMedicion.temperatura_c} °C • ${nuevaMedicion.claridad_agua}`,
                  alerta: !sanitariaOk
                }
              ],
              falla_reportada_admin: sanitariaOk
                ? undefined
                : `Parámetros fuera de rango Ley 1209 (pH: ${nuevaMedicion.ph_actual}, Cloro: ${nuevaMedicion.cloro_residual_ppm} ppm)`
            }
          : eq
      )
    );

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('equipos_criticos_ph').insert([
          {
            codigo_tag: 'ZONA-HUM-LEY1209',
            equipo: 'Piscina, Jacuzzi y Turco',
            ph_actual: nuevaMedicion.ph_actual,
            cloro_ppm: nuevaMedicion.cloro_residual_ppm,
            temperatura_c: nuevaMedicion.temperatura_c,
            estado: sanitariaOk ? 'Operativo' : 'Alerta Sanitaria Ley 1209',
            created_at: new Date().toISOString()
          }
        ]);
      } catch {
        // Estado local actualizado
      }
    }

    appendAuditLog(
      'LEY_1209_PISCINA_CHECK',
      `Bitácora Sanitaria Piscina/Zonas Húmedas actualizada: pH ${nuevaMedicion.ph_actual} | Cloro ${nuevaMedicion.cloro_residual_ppm} ppm | Temp ${nuevaMedicion.temperatura_c}°C (${sanitariaOk ? 'CUMPLE LEY 1209' : 'ALERTA SANITARIA / CIERRE PREVENTIVO'})`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: sanitariaOk ? 'success' : 'danger',
      mensaje: sanitariaOk
        ? `✅ Medición sanitaria Ley 1209 registrada: pH ${nuevaMedicion.ph_actual} y Cloro ${nuevaMedicion.cloro_residual_ppm} ppm dentro del rango normativo.`
        : `🚨 ALERTA SANITARIA LEY 1209: pH (${nuevaMedicion.ph_actual}) o Cloro (${nuevaMedicion.cloro_residual_ppm} ppm) fuera de rango normativo. Se activó alerta preventiva en zona húmeda.`
    });
  };

  // Handler: Reportar Falla Crítica al Administrador desde cualquiera de los 5 Equipos Críticos
  const handleReportarFallaCriticaEquipo = async (equipo: EquipoCriticoVitalPH) => {
    const detalleFalla =
      (fallaInputMap[equipo.id] || equipo.sugerencia_falla).trim() ||
      equipo.sugerencia_falla;
    const horaReporte = new Date().toTimeString().slice(0, 5);
    const nuevaOrdenId = `OT-EMG-${String(ordenesTrabajo.length + 45).padStart(3, '0')}`;

    // 1. Cambiar estado del equipo a "🔴 En Falla / Urgente"
    setEquiposCriticos(prev =>
      prev.map(eq =>
        eq.id === equipo.id
          ? {
              ...eq,
              estado: '🔴 En Falla / Urgente',
              ultima_inspeccion: `Hoy ${horaReporte} (FALLA CRÍTICA)`,
              falla_reportada_admin: detalleFalla,
              orden_emergencia_id: nuevaOrdenId,
              metricas_clave: eq.metricas_clave.map((m, idx) =>
                idx === 0
                  ? { ...m, valor: `⚠️ ALERTA: ${detalleFalla.slice(0, 28)}...`, alerta: true }
                  : m
              )
            }
          : eq
      )
    );

    // 2. Crear automáticamente solicitud/orden prioritaria visible para el Administrador en Tab 3.3
    const contratistaSugerido =
      equipo.id === 'EQ-BOMBAS'
        ? { id: 207, nombre: 'Téc. Mauricio Castaño (Hidrobombas Medellín)' }
        : equipo.id === 'EQ-ASCENSORES'
        ? { id: 206, nombre: 'Ing. Hernán Darío Vélez (Ascensores Andinos)' }
        : { id: 208, nombre: 'Cuadrilla de Emergencia Mantenimiento PH' };

    const nuevaOrdenEmergencia: OrdenTrabajoContratista = {
      id: nuevaOrdenId,
      contratista_id: contratistaSugerido.id,
      contratista_nombre: contratistaSugerido.nombre,
      tarea_especifica: `🚨 URGENCIA INFRAESTRUCTURA (${equipo.nombre_punto}): ${detalleFalla}`,
      zona_intervenida: equipo.ubicacion_tecnica,
      fecha_ingreso_autorizada: `2026-10-29 ${horaReporte} (PRIORIDAD CRÍTICA)`,
      costo_estimado: 850000,
      estado_orden: 'Autorizada en Portería'
    };

    setOrdenesTrabajo(prev => [nuevaOrdenEmergencia, ...prev]);

    // 3. Agregar registro automático en la línea de tiempo de Bitácora Técnica del día
    const nuevaEntradaBitacora: RegistroRondaBitacoraPH = {
      id: `RND-EMG-${Date.now().toString().slice(-4)}`,
      hora_exacta: `${horaReporte}:00`,
      fecha_dia: '2026-10-29',
      punto_control:
        equipo.id === 'EQ-PISCINA'
          ? 'Zonas Sociales'
          : equipo.id === 'EQ-ASCENSORES'
          ? 'Portería y CCTV'
          : 'Sótanos y Parqueaderos',
      estado: '🔴 Incidente de Seguridad / Convivencia',
      observacion_detallada: `[FALLA CRÍTICA EQUIPO ${equipo.codigo_tag}] ${equipo.nombre_punto}: ${detalleFalla}. Se generó Orden Prioritaria ${nuevaOrdenId} para el Administrador.`,
      responsable_ronda: 'Supervisor Operativo (Alerta Técnica)',
      tag_nfc_verificado: `TAG-${equipo.codigo_tag}`
    };
    setRondasBitacora(prev => [nuevaEntradaBitacora, ...prev]);

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('equipos_criticos_ph').insert([
          {
            codigo_tag: equipo.codigo_tag,
            nombre_punto: equipo.nombre_punto,
            estado: '🔴 En Falla / Urgente',
            falla_reportada: detalleFalla,
            orden_emergencia_id: nuevaOrdenId,
            created_at: new Date().toISOString()
          }
        ]);
      } catch {
        // Estado local sincronizado
      }
    }

    appendAuditLog(
      'FALLA_CRITICA_EQUIPO_PH',
      `Supervisor reportó FALLA CRÍTICA en ${equipo.nombre_punto} (${equipo.codigo_tag}): "${detalleFalla}" -> Estado cambiado a 🔴 En Falla / Urgente y Orden Prioritaria ${nuevaOrdenId} enviada al Administrador (Tab 3.3).`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'danger',
      mensaje: `🚨 FALLA CRÍTICA ESCALADA AL ADMINISTRADOR: "${equipo.nombre_punto}" pasó a estado 🔴 En Falla / Urgente. Se creó automáticamente la Orden de Emergencia ${nuevaOrdenId} en el Panel del Administrador.`
    });
  };

  // Handler: Restablecer equipo crítico a 🟢 Operativo / Óptimo tras verificación en campo
  const handleRestablecerEquipoOperativo = (equipo: EquipoCriticoVitalPH) => {
    const horaActual = new Date().toTimeString().slice(0, 5);
    const plantillaOriginal = INITIAL_EQUIPOS_CRITICOS_VITALES.find(e => e.id === equipo.id);

    setEquiposCriticos(prev =>
      prev.map(eq =>
        eq.id === equipo.id
          ? {
              ...eq,
              estado: '🟢 Operativo / Óptimo',
              ultima_inspeccion: `Hoy ${horaActual} (Verificado OK)`,
              falla_reportada_admin: undefined,
              metricas_clave: plantillaOriginal ? plantillaOriginal.metricas_clave : eq.metricas_clave,
              items_checklist: eq.items_checklist.map(it => ({ ...it, verificado: true }))
            }
          : eq
      )
    );

    appendAuditLog(
      'CHECKLIST_EQUIPO_OK',
      `Supervisor verificó y restableció estado 🟢 Operativo / Óptimo en ${equipo.nombre_punto} (${equipo.codigo_tag}).`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'success',
      mensaje: `✅ Checklist técnico verificado: ${equipo.nombre_punto} se encuentra en estado 🟢 Operativo / Óptimo.`
    });
  };

  // 3. Handler: "🔦 Registrar Ronda / Novedad en Bitácora" (con escalamiento opcional al Tab 3.4 del Admin)
  const handleRegistrarRondaBitacora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rondaObservacion.trim()) {
      setFeedbackSupervisor({
        tipo: 'warning',
        mensaje: '⚠️ Escribe la observación detallada de la ronda o hallazgo antes de guardar en la bitácora.'
      });
      return;
    }

    const ahora = new Date();
    const horaExacta = `${String(ahora.getHours()).padStart(2, '0')}:${String(
      ahora.getMinutes()
    ).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`;
    const nuevaRondaId = `RND-2026-${String(rondasBitacora.length + 901)}`;

    const unidadSeleccionada = unidades.find(
      u => u.id === Number(rondaUnidadInfractoraId)
    );

    let codigoActaGenerada: string | undefined;
    const debeEscalarTab34 =
      rondaEstado === '🔴 Incidente de Seguridad / Convivencia' &&
      rondaEscalarTab34 &&
      Boolean(unidadSeleccionada);

    if (debeEscalarTab34 && unidadSeleccionada) {
      codigoActaGenerada = `ACTA-CONV-${String(sancionesList.length + 91).padStart(3, '0')}`;
      const nuevaSancionId = `SAN-2026-${String(sancionesList.length + 17).padStart(3, '0')}`;

      const nuevaSancionEscalacion: SancionConvivenciaPH = {
        id: nuevaSancionId,
        acta_num: codigoActaGenerada,
        unidad_id: unidadSeleccionada.id,
        numero_unidad: unidadSeleccionada.numero_unidad,
        propietario: unidadSeleccionada.propietario,
        tipo_falta: rondaTipoFalta,
        tipo_sancion: '1° Llamado de Atención Pedagógico ($0)',
        monto_multa: 0,
        tope_maximo_legal: unidadSeleccionada.cuota_base * 2,
        fecha: ahora.toISOString().slice(0, 10),
        estado_proceso: 'Notificada - Descargos',
        observacion_acta: `[EVIDENCIA ESCALADA DESDE BITÁCORA SUPERVISOR ${nuevaRondaId} - ${horaExacta}] Punto: ${rondaPuntoControl}. Detalle: ${rondaObservacion.trim()}`
      };

      setSancionesList(prev => [nuevaSancionEscalacion, ...prev]);
    }

    const tagMap: Record<PuntoControlRondaPH, string> = {
      'Perímetro y Cerramiento': 'NFC-PERIM-MALLA-01',
      'Sótanos y Parqueaderos': 'NFC-SOTANOS-CELDAS-02',
      'Terrazas y Cubiertas': 'NFC-CUBIERTA-DOMO-03',
      'Portería y CCTV': 'NFC-PORTERIA-NVR-04',
      'Zonas Sociales': 'NFC-ZSOCIAL-SALON-05'
    };

    const nuevaRonda: RegistroRondaBitacoraPH = {
      id: nuevaRondaId,
      hora_exacta: horaExacta,
      fecha_dia: ahora.toISOString().slice(0, 10),
      punto_control: rondaPuntoControl,
      estado: rondaEstado,
      observacion_detallada: rondaObservacion.trim(),
      responsable_ronda: rondaResponsable,
      tag_nfc_verificado: tagMap[rondaPuntoControl],
      unidad_involucrada:
        rondaEstado === '🔴 Incidente de Seguridad / Convivencia' && unidadSeleccionada
          ? unidadSeleccionada.numero_unidad
          : undefined,
      propietario_involucrado:
        rondaEstado === '🔴 Incidente de Seguridad / Convivencia' && unidadSeleccionada
          ? unidadSeleccionada.propietario
          : undefined,
      tipo_falta_convivencia:
        rondaEstado === '🔴 Incidente de Seguridad / Convivencia'
          ? rondaTipoFalta
          : undefined,
      escalado_tab3_4: debeEscalarTab34,
      acta_sancion_generada: codigoActaGenerada
    };

    setRondasBitacora(prev => [nuevaRonda, ...prev]);

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('rondas_ph').insert([
          {
            codigo_ronda: nuevaRonda.id,
            punto_control: nuevaRonda.punto_control,
            estado: nuevaRonda.estado,
            observacion: nuevaRonda.observacion_detallada,
            responsable: nuevaRonda.responsable_ronda,
            escalado_convivencia: Boolean(debeEscalarTab34),
            created_at: ahora.toISOString()
          }
        ]);
        await supabase.from('minuta_digital_ph').insert([
          {
            ronda_id: nuevaRonda.id,
            punto_control: nuevaRonda.punto_control,
            novedad: nuevaRonda.observacion_detallada,
            estado: nuevaRonda.estado,
            created_at: ahora.toISOString()
          }
        ]);
      } catch {
        // Guardado en memoria reactiva
      }
    }

    appendAuditLog(
      debeEscalarTab34 ? 'RONDA_ESCALADA_TAB3_4' : 'BITACORA_RONDA_REGISTRO',
      `Ronda ${nuevaRonda.id} verificada en [${nuevaRonda.punto_control}] con estado "${nuevaRonda.estado}": "${nuevaRonda.observacion_detallada}"${
        debeEscalarTab34 && unidadSeleccionada
          ? ` | ⚖️ Evidencia escalada al Tab 3.4 del Administrador (${codigoActaGenerada} - ${unidadSeleccionada.numero_unidad})`
          : ''
      }`,
      'Supervisor Operativo'
    );

    setRondaObservacion('');
    setFeedbackSupervisor({
      tipo:
        rondaEstado === '🔴 Incidente de Seguridad / Convivencia'
          ? 'danger'
          : rondaEstado === '🟡 Hallazgo Menor / Mantenimiento'
          ? 'warning'
          : 'success',
      mensaje: debeEscalarTab34 && unidadSeleccionada
        ? `⚖️ Ronda ${nuevaRonda.id} registrada y EVIDENCIA ESCALADA AL TAB 3.4 DEL ADMINISTRADOR: Se abrió el expediente ${codigoActaGenerada} para ${unidadSeleccionada.numero_unidad} (${rondaTipoFalta}).`
        : `🔦 Ronda ${nuevaRonda.id} (${rondaPuntoControl}) registrada exitosamente en la Bitácora Digital con hora ${horaExacta}.`
    });
  };

  // 4. Handler: Exportar Bitácora Técnica, Equipos Críticos y Rondas en archivo .CSV
  const handleExportarBitacoraRondasCsv = () => {
    const encabezados = [
      'Tipo_Registro',
      'ID_Codigo',
      'Punto_Control_O_Equipo',
      'Estado_Semaforo',
      'Hora_Verificacion',
      'Responsable',
      'Observacion_O_Metricas',
      'Escalado_Admin_Tab34_O_Orden'
    ];

    const filasEquipos = equiposCriticos.map(eq => [
      'EQUIPO_CRITICO',
      eq.codigo_tag,
      `"${eq.nombre_punto.replace(/"/g, '""')}"`,
      `"${eq.estado}"`,
      `"${eq.ultima_inspeccion}"`,
      `"${eq.responsable_verificacion}"`,
      `"${eq.metricas_clave.map(m => `${m.label}: ${m.valor}`).join(' | ')}"`,
      `"${eq.orden_emergencia_id || 'Operación Normal'}"`
    ]);

    const filasRondas = rondasBitacora.map(r => [
      'RONDA_BITACORA',
      r.id,
      `"${r.punto_control}"`,
      `"${r.estado}"`,
      r.hora_exacta,
      `"${r.responsable_ronda}"`,
      `"${r.observacion_detallada.replace(/"/g, '""')}"`,
      `"${
        r.escalado_tab3_4
          ? `Escalado Tab 3.4 (${r.acta_sancion_generada} - ${r.unidad_involucrada})`
          : 'No Escalado'
      }"`
    ]);

    const csvContent = [
      encabezados.join(','),
      ...filasEquipos.map(f => f.join(',')),
      ...filasRondas.map(f => f.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bitacora_Tecnica_Y_Rondas_Urbix_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    appendAuditLog(
      'SUPERVISOR_EXPORT_BITACORA_CSV',
      `Exportó Bitácora Técnica de Equipos Críticos (${equiposCriticos.length}) y Rondas del Día (${rondasBitacora.length}) en formato .CSV`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'info',
      mensaje: `📥 Bitácora Técnica y Rondas (.CSV) exportada con ${equiposCriticos.length} equipos críticos y ${rondasBitacora.length} rondas verificadas.`
    });
  };

  // Handler: Firmar y Enviar Cierre de Turno al Administrador (Modal de Acta Consolidada)
  const handleFirmarYEnviarCierreTurno = async () => {
    const ahora = new Date();
    const horaFirma = ahora.toTimeString().slice(0, 8);
    const hashGenerado =
      'sha256:cierre_' + Math.random().toString(16).substring(2, 12);

    setCierreTurnoFirmadoHoy({
      firmado: true,
      horaFirma,
      hashActa: hashGenerado,
      recibidoPor: supervisorEntranteInput.trim() || 'Supervisor Turno Entrante'
    });

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('minuta_digital_ph').insert([
          {
            tipo_evento: 'ACTA_ENTREGA_Y_CIERRE_TURNO',
            saldo_caja_menor: saldoCajaMenorDisponible,
            pagos_conciliados: soportesConciliadosCount,
            rondas_completadas: rondasVerificadasCount,
            operatividad_equipos_pct: porcentajeOperatividadEquipos,
            ph_piscina: medicionPiscina.ph_actual,
            cloro_piscina: medicionPiscina.cloro_residual_ppm,
            supervisor_entrante: supervisorEntranteInput,
            consignas: consignasEntregaTurno,
            hash_firma: hashGenerado,
            created_at: ahora.toISOString()
          }
        ]);
      } catch {
        // Estado local actualizado
      }
    }

    appendAuditLog(
      'CIERRE_TURNO_OFICIAL_FIRMADO',
      `Acta Oficial de Entrega y Cierre de Turno firmada (${hashGenerado}). Caja Menor: ${formatCOP(
        saldoCajaMenorDisponible
      )} | Conciliados: ${soportesConciliadosCount} | Cuadrilla Activa: ${
        kpiVigilantesEnPuesto + kpiAseoEnTurnoActivo
      } | Rondas: ${rondasVerificadasCount}/${metaRondasDiarias} | Equipos: ${porcentajeOperatividadEquipos}% | Recibe: ${supervisorEntranteInput}`,
      'Supervisor Operativo'
    );

    setFeedbackSupervisor({
      tipo: 'success',
      mensaje: `✍️ ACTA DE CIERRE DE TURNO FIRMADA Y ENVIADA AL ADMINISTRADOR (${hashGenerado}): Consolidado diario transmitido y registrado en minuta_digital_ph y audit_logs.`
    });
  };

  const rondasTimelineFiltradas = rondasBitacora.filter(r => {
    if (filtroRondasTimeline === 'Todas') return true;
    return r.estado === filtroRondasTimeline;
  });

  const alertasCriticasActivas = alertasCriticasVigilanciaShared.filter((a: any) => !a.atendidaPorSupervisor);

  const handleAtenderAlertaCriticaVigilancia = (alerta: any) => {
    const horaAtencion = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    if (setAlertasCriticasVigilanciaShared) {
      setAlertasCriticasVigilanciaShared((prev: any[]) =>
        prev.map((item) =>
          item.id === alerta.id
            ? { ...item, atendidaPorSupervisor: true, horaAtencion }
            : item
        )
      );
    }
    appendAuditLog(
      'SUPERVISOR_CRITICAL_ALERT_DISPATCHED',
      `Supervisor atendió y despachó protocolo de emergencia para alerta crítica [${alerta.id}] en "${alerta.punto}" (${alerta.codigoNfcQr}) reportada por ${alerta.guarda}. Hora de atención: ${horaAtencion}.`,
      'Hernán Darío Mejía (Supervisor Operativo)'
    );
    setFeedbackSupervisor({
      tipo: 'success',
      mensaje: `🛡️ Protocolo de reacción despachado para "${alerta.punto}" (${alerta.codigoNfcQr}). Quedó asentado en Auditoría Cruzada.`
    });
  };

  const handleActualizarEstadoTareaTodero = (
    tarea: any,
    nuevoEstado: 'Pendiente Asignación' | 'En Reparación por Todero' | 'Resuelto y Verificado ✅'
  ) => {
    const estadoCorto =
      nuevoEstado === 'Resuelto y Verificado ✅'
        ? 'Solucionado'
        : nuevoEstado === 'En Reparación por Todero'
        ? 'En Proceso'
        : 'Pendiente';
    if (setTareasToderosRondasShared) {
      setTareasToderosRondasShared((prev: any[]) =>
        prev.map((t) =>
          t.id === tarea.id ? { ...t, estadoTarea: nuevoEstado, estado: estadoCorto } : t
        )
      );
    }
    const estadoOrdenEquivalente: OrdenTrabajoContratista['estado_orden'] =
      nuevoEstado === 'Resuelto y Verificado ✅'
        ? 'Finalizada'
        : nuevoEstado === 'En Reparación por Todero'
        ? 'En Ejecución'
        : 'Autorizada en Portería';

    setOrdenesTrabajo((prev) =>
      prev.map((ord) =>
        ord.id === tarea.id || ord.tarea_especifica.includes(tarea.hallazgo || '')
          ? { ...ord, estado_orden: estadoOrdenEquivalente }
          : ord
      )
    );

    appendAuditLog(
      'SUPERVISOR_TODERO_TASK_UPDATE',
      `Supervisor actualizó orden/tarea de mantenimiento derivada de ronda [${tarea.id}] en zona "${tarea.zona}" (${tarea.codigoNfcQr}) a estado "${nuevoEstado}". Reportada originalmente por ${tarea.guardaReportante}.`,
      'Hernán Darío Mejía (Supervisor Operativo)'
    );
    setFeedbackSupervisor({
      tipo: 'info',
      mensaje: `🛠️ Orden de Mantenimiento [${tarea.id}] en "${tarea.zona}" actualizada a: ${
        nuevoEstado === 'Resuelto y Verificado ✅'
          ? 'Solucionado (Enviada al Historial Secundario)'
          : nuevoEstado === 'En Reparación por Todero'
          ? 'En Proceso'
          : 'Pendiente'
      }.`
    });
  };

  // Normalizador para fusionar las alertas de rondas (Checkpoints del Vigilante) y las Órdenes de Trabajo en una única bandeja
  const normalizarEstadoBandeja = (estadoRaw: string): 'Pendiente' | 'En Proceso' | 'Solucionado' => {
    if (
      estadoRaw === 'Resuelto y Verificado ✅' ||
      estadoRaw === 'Finalizada' ||
      estadoRaw === 'Solucionado'
    ) {
      return 'Solucionado';
    }
    if (
      estadoRaw === 'En Reparación por Todero' ||
      estadoRaw === 'En Ejecución' ||
      estadoRaw === 'En Proceso'
    ) {
      return 'En Proceso';
    }
    return 'Pendiente';
  };

  // Bandeja Unificada: Alertas de Checkpoints de Rondas + Órdenes de Trabajo (sin duplicar las derivadas)
  const bandejaMantenimientoUnificada = [
    ...tareasToderosRondasShared.map((t: any) => ({
      id: t.id,
      origen: 'CHECKPOINT RONDA VIGILANTE' as const,
      codigoNfcQr: t.codigoNfcQr || 'NFC-RONDA',
      zona: t.zona || t.area || t.titulo || 'Zona Común',
      descripcion: t.hallazgo || t.detalle || 'Novedad operativa',
      responsable: t.guardaReportante || 'Equipo de Toderos / Mantenimiento Interno',
      horaFecha: t.fechaReporte || t.horaReporte || 'Hoy',
      estadoNormalizado: normalizarEstadoBandeja(t.estado || t.estadoTarea),
      rawTarea: t,
      rawOrden: null as OrdenTrabajoContratista | null,
      costoEstimado: 0
    })),
    ...ordenesTrabajo
      .filter(
        (ord) =>
          !tareasToderosRondasShared.some(
            (t: any) => t.id === ord.id || (t.hallazgo && ord.tarea_especifica.includes(t.hallazgo))
          )
      )
      .map((ord) => {
        const metaOrden = metaOrdenesMap[ord.id];
        const isFin = ord.estado_orden === 'Finalizada' || Boolean(metaOrden?.acta_recibida_satisfaccion);
        return {
          id: ord.id,
          origen: (ord.id.startsWith('OT-RONDA') ? 'CHECKPOINT RONDA VIGILANTE' : 'ORDEN DE TRABAJO / CAMPO') as
            | 'CHECKPOINT RONDA VIGILANTE'
            | 'ORDEN DE TRABAJO / CAMPO',
          codigoNfcQr: ord.id.startsWith('OT-RONDA') ? 'NFC-CHECKPOINT' : 'OT-CAMPO',
          zona: ord.zona_intervenida,
          descripcion: ord.tarea_especifica,
          responsable: ord.contratista_nombre,
          horaFecha: ord.fecha_ingreso_autorizada,
          estadoNormalizado: isFin ? ('Solucionado' as const) : normalizarEstadoBandeja(ord.estado_orden),
          rawTarea: null as any,
          rawOrden: ord,
          costoEstimado: ord.costo_estimado
        };
      })
  ];

  const tareasActivasBandeja = bandejaMantenimientoUnificada.filter(
    (item) => item.estadoNormalizado === 'Pendiente' || item.estadoNormalizado === 'En Proceso'
  );
  const tareasSolucionadasHistorial = bandejaMantenimientoUnificada.filter(
    (item) => item.estadoNormalizado === 'Solucionado'
  );
  const itemsBandejaVisibles =
    vistaFiltroBandejaMantenimiento === 'activas' ? tareasActivasBandeja : tareasSolucionadasHistorial;

  const handleCambiarEstadoItemUnificado = (
    item: (typeof bandejaMantenimientoUnificada)[number],
    nuevoEstadoNorm: 'Pendiente' | 'En Proceso' | 'Solucionado'
  ) => {
    if (item.rawTarea) {
      const mapEst =
        nuevoEstadoNorm === 'Solucionado'
          ? 'Resuelto y Verificado ✅'
          : nuevoEstadoNorm === 'En Proceso'
          ? 'En Reparación por Todero'
          : 'Pendiente Asignación';
      handleActualizarEstadoTareaTodero(item.rawTarea, mapEst);
    } else if (item.rawOrden) {
      const mapOrd: OrdenTrabajoContratista['estado_orden'] =
        nuevoEstadoNorm === 'Solucionado'
          ? 'Finalizada'
          : nuevoEstadoNorm === 'En Proceso'
          ? 'En Ejecución'
          : 'Autorizada en Portería';
      setOrdenesTrabajo((prev) =>
        prev.map((o) => (o.id === item.rawOrden!.id ? { ...o, estado_orden: mapOrd } : o))
      );
      appendAuditLog(
        'SUPERVISOR_UNIFIED_ORDER_STATE',
        `Supervisor actualizó orden de trabajo [${item.id}] en "${item.zona}" a estado "${nuevoEstadoNorm}".`,
        'Hernán Darío Mejía (Supervisor Operativo)'
      );
      setFeedbackSupervisor({
        tipo: nuevoEstadoNorm === 'Solucionado' ? 'success' : 'info',
        mensaje:
          nuevoEstadoNorm === 'Solucionado'
            ? `✅ Orden [${item.id}] marcada como Solucionado y archivada en el Historial Secundario para evitar saturación visual.`
            : `🔧 Orden [${item.id}] actualizada a estado: ${nuevoEstadoNorm}.`
      });
    }
  };

  const minutaFiltradaAuditoria = minutaShared.filter((nota: any) => {
    const cumpleCat =
      filtroCategoriaMinutaAuditoria === 'Todas' || nota.categoria === filtroCategoriaMinutaAuditoria;
    const term = busquedaMinutaAuditoria.trim().toLowerCase();
    const cumpleBusq =
      !term ||
      (nota.detalle || '').toLowerCase().includes(term) ||
      (nota.guarda || '').toLowerCase().includes(term) ||
      (nota.categoria || '').toLowerCase().includes(term);
    return cumpleCat && cumpleBusq;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      <style>{`
        @keyframes supervisorCriticalPulse {
          0%, 100% {
            box-shadow: 0 0 18px rgba(239, 68, 68, 0.45), inset 0 0 12px rgba(239, 68, 68, 0.2);
            border-color: #ef4444;
          }
          50% {
            box-shadow: 0 0 38px rgba(248, 113, 113, 0.95), inset 0 0 24px rgba(239, 68, 68, 0.45);
            border-color: #fecaca;
          }
        }
        @keyframes supervisorBadgeBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.98); }
        }
      `}</style>

      {/* ============================================================================
          0. CABECERA OPERATIVA DEL SUPERVISOR EN CAMPO + MONITOR DE ALERTAS CRÍTICAS EN TIEMPO REAL
      ============================================================================ */}
      <div
        style={{
          backgroundColor: '#141416',
          border: '1px solid #262629',
          borderRadius: '12px',
          padding: '24px'
        }}
      >
        {/* MONITOR DE ALERTAS CRÍTICAS EN TIEMPO REAL INTEGRADO EN LA CABECERA DEL SUPERVISOR */}
        <div
          style={{
            backgroundColor: alertasCriticasActivas.length > 0 ? 'rgba(127, 29, 29, 0.94)' : '#18181b',
            border: alertasCriticasActivas.length > 0 ? '2px solid #ef4444' : '1px solid #27272a',
            borderLeft: alertasCriticasActivas.length > 0 ? '6px solid #ef4444' : '4px solid #34d399',
            borderRadius: '10px',
            padding: alertasCriticasActivas.length > 0 ? '18px' : '10px 16px',
            marginBottom: '16px',
            animation: alertasCriticasActivas.length > 0 ? 'supervisorCriticalPulse 1.2s infinite ease-in-out' : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span
                style={{
                  backgroundColor: alertasCriticasActivas.length > 0 ? '#ef4444' : 'rgba(52, 211, 153, 0.14)',
                  color: alertasCriticasActivas.length > 0 ? '#ffffff' : '#34d399',
                  border: `1px solid ${alertasCriticasActivas.length > 0 ? '#fecaca' : 'rgba(52, 211, 153, 0.4)'}`,
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: '900',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  letterSpacing: '0.5px',
                  animation: alertasCriticasActivas.length > 0 ? 'supervisorBadgeBlink 0.9s infinite ease-in-out' : 'none'
                }}
              >
                {alertasCriticasActivas.length > 0
                  ? `🚨 MONITOR DE ALERTAS CRÍTICAS ACTIVO (${alertasCriticasActivas.length} EN VIVO)`
                  : '🟢 MONITOR DE ALERTAS CRÍTICAS EN TIEMPO REAL: SIN EMERGENCIAS ACTIVAS'}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: alertasCriticasActivas.length > 0 ? '#fecaca' : '#94a3b8',
                  fontWeight: 'bold'
                }}
              >
                {alertasCriticasActivas.length > 0
                  ? '⚡ AVISO VISUAL INMEDIATO DESDE GARITA: Botón de Pánico Táctico / Checkpoint de Seguridad Crítica accionado'
                  : 'Escuchando en vivo Botón de Pánico Táctico y Checkpoints Críticos de Rondas sin recargar página'}
              </span>
            </div>

            <span
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: alertasCriticasActivas.length > 0 ? '#fca5a5' : '#22d3ee',
                backgroundColor: '#09090b',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #27272a'
              }}
            >
              🔒 Roles Separados: Registro Visitantes / QR / Encomiendas exclusivos de Garita
            </span>
          </div>

          {alertasCriticasActivas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              {alertasCriticasActivas.map((alerta: any) => (
                <div
                  key={alerta.id}
                  style={{
                    backgroundColor: '#141416',
                    border: '1px solid #f87171',
                    borderLeft: '5px solid #ef4444',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          fontWeight: '900',
                          backgroundColor: 'rgba(239, 68, 68, 0.25)',
                          color: '#fecaca',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #ef4444'
                        }}
                      >
                        {alerta.tipo === 'BOTON_PANICO_RUTA' ? '🆘 BOTÓN DE PÁNICO TÁCTICO EN RUTA' : '🚨 ALERTA DE SEGURIDAD CRÍTICA EN CHECKPOINT'}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#22d3ee', fontWeight: 'bold' }}>
                        [{alerta.codigoNfcQr}]
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#ffffff' }}>
                        {alerta.punto}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#fbbf24' }}>
                        🕒 {alerta.timestamp}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#f8fafc', marginBottom: '4px' }}>
                      {alerta.detalle}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                      👮 Guarda Reportante: <strong style={{ color: '#e2e8f0' }}>{alerta.guarda}</strong> • Ubicación: {alerta.ubicacion || 'Copropiedad'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAtenderAlertaCriticaVigilancia(alerta)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: '1px solid #fca5a5',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🛡️ Confirmar Recepción y Despachar Protocolo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Barra Superior de Estado Operativo en Vivo en Campo */}
        <div
          style={{
            backgroundColor: '#1c1c1f',
            borderTop: '1px solid #262629',
            borderRight: '1px solid #262629',
            borderBottom: '1px solid #262629',
            borderLeft: '4px solid #22d3ee',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontFamily: 'monospace'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold' }}>
                🏢 UNIDAD RESIDENCIAL ASIGNADA EN TERRENO
              </div>
              <select
                value={unidadAsignadaSupervisor}
                onChange={e => setUnidadAsignadaSupervisor(e.target.value)}
                style={{
                  backgroundColor: '#141416',
                  border: '1px solid #262629',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  marginTop: '3px',
                  cursor: 'pointer'
                }}
              >
                <option value="Conjunto Residencial Bosques del Poblado - NIT 900.412.889-1">
                  Conjunto Residencial Bosques del Poblado - NIT 900.412.889-1
                </option>
                <option value="P.H. Reserva del Tesoro - NIT 901.204.511-6">
                  P.H. Reserva del Tesoro - NIT 901.204.511-6
                </option>
                <option value="Edificio Mirador de Las Palmas - NIT 890.915.302-4">
                  Edificio Mirador de Las Palmas - NIT 890.915.302-4
                </option>
              </select>
            </div>

            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold' }}>
                👮 TURNO ACTIVO DEL SUPERVISOR
              </div>
              <select
                value={turnoActivoSupervisor}
                onChange={e => setTurnoActivoSupervisor(e.target.value)}
                style={{
                  backgroundColor: '#141416',
                  border: '1px solid #262629',
                  color: '#34d399',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  marginTop: '3px',
                  cursor: 'pointer'
                }}
              >
                <option value="Turno Diurno (06:00 AM - 02:00 PM) • Hernán Darío Mejía">
                  Turno Diurno (06:00 AM - 02:00 PM) • Hernán Darío Mejía
                </option>
                <option value="Turno Tarde (02:00 PM - 10:00 PM) • Carlos Mario Restrepo">
                  Turno Tarde (02:00 PM - 10:00 PM) • Carlos Mario Restrepo
                </option>
                <option value="Turno Nocturno (10:00 PM - 06:00 AM) • Héctor Fabio Quintero">
                  Turno Nocturno (10:00 PM - 06:00 AM) • Héctor Fabio Quintero
                </option>
              </select>
            </div>

            <div
              style={{
                backgroundColor: '#141416',
                border: '1px solid #262629',
                borderRadius: '6px',
                padding: '6px 12px'
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold' }}>
                ⏱️ RELOJ OPERATIVO EN VIVO
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#22d3ee', letterSpacing: '1px' }}>
                {relojOperativo} COT
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalBotonPanico(true)}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: '2px solid #fca5a5',
              padding: '10px 16px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: '900',
              cursor: 'pointer',
              letterSpacing: '0.3px'
            }}
          >
            🚨 Central de Reacción / Emergencia en Copropiedad
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(34, 211, 238, 0.12)',
                  color: '#22d3ee',
                  border: '1px solid rgba(34, 211, 238, 0.35)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                [ MÓDULO 4 • PANEL SUPERVISOR OPERATIVO EN TERRENO • LEY 675 ]
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                ● SINCRONIZADO EN VIVO CON MÓDULO 3 (CARTERA TAB 3.1 &amp; EGRESOS TAB 3.2)
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', margin: '10px 0 4px 0' }}>
              Consola del Supervisor Operativo: Caja Menor, Conciliación &amp; Control de Terreno
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Verificación en vivo de soportes de pago de residentes, ejecución de caja menor con control de topes ($300.000 COP máx.), PQRS locativas y autorización de mudanzas/trasteos.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setModalActaCierreTurno(true)}
              style={{
                backgroundColor: '#fbbf24',
                color: '#09090b',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              📋 Generar Acta de Entrega de Turno (Consolidado Diario)
            </button>

            <button
              type="button"
              onClick={handleExportarBitacoraRondasCsv}
              style={{
                backgroundColor: '#1c1c1f',
                color: '#22d3ee',
                border: '1px solid #22d3ee',
                padding: '10px 14px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              📥 Exportar Bitácora Técnica y Rondas (.CSV)
            </button>

            <button
              type="button"
              onClick={handleExportarPlanillaTurnosCsv}
              style={{
                backgroundColor: '#34d399',
                color: '#09090b',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              📥 Exportar Planilla Turnos (.CSV)
            </button>

            <button
              type="button"
              onClick={handleExportarCsvSupervisor}
              style={{
                backgroundColor: '#22d3ee',
                color: '#09090b',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              📥 Exportar Caja Menor (.CSV)
            </button>
          </div>
        </div>

        {/* BARRA DE NAVEGACIÓN UNIFICADA Y FORZADA PARA TODOS LOS ROLES */}
        <nav className="flex items-center gap-2 overflow-x-auto py-1 px-2 bg-[#0b0f17]/90 border border-cyan-500/20 rounded-2xl shadow-lg w-full scrollbar-none whitespace-nowrap">
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => setActiveSubTab('tab4_3')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer pointer-events-auto border shrink-0 ${
                activeSubTab === 'tab4_3'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700 hover:bg-slate-800'
              }`}
            >
              Vista General
            </button>

            {[
              { id: 'tab4_1', label: 'Tab 4.1: Caja Menor, Conciliación & PQRS / Mudanzas', badge: '100% ACTIVO' },
              { id: 'tab4_2', label: 'Tab 4.2: Control de Cuadrillas, Turnos & Contratistas', badge: '100% ACTIVO' },
              { id: 'tab4_3', label: 'Tab 4.3: Bitácora de Rondas, Checklists & Cierre de Turno', badge: 'ACTIVA AHORA' },
              { id: 'asamblea_checkin', label: '📋 Check-in Asamblea', badge: 'EN VIVO LEY 675' },
              { id: 'checklist_zonas', label: '🥂 Checklist Salón / BBQ (Depósitos)', badge: 'TABLET ENTREGA' }
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* BANNER DE RETROALIMENTACIÓN EN TIEMPO REAL */}
      {feedbackSupervisor && (
        <div
          style={{
            backgroundColor:
              feedbackSupervisor.tipo === 'success'
                ? 'rgba(52, 211, 153, 0.1)'
                : feedbackSupervisor.tipo === 'danger'
                ? 'rgba(239, 68, 68, 0.12)'
                : feedbackSupervisor.tipo === 'warning'
                ? 'rgba(251, 191, 36, 0.12)'
                : 'rgba(34, 211, 238, 0.1)',
            border: `1px solid ${
              feedbackSupervisor.tipo === 'success'
                ? '#34d399'
                : feedbackSupervisor.tipo === 'danger'
                ? '#ef4444'
                : feedbackSupervisor.tipo === 'warning'
                ? '#fbbf24'
                : '#22d3ee'
            }`,
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        >
          <span
            style={{
              color:
                feedbackSupervisor.tipo === 'success'
                  ? '#34d399'
                  : feedbackSupervisor.tipo === 'danger'
                  ? '#ef4444'
                  : feedbackSupervisor.tipo === 'warning'
                  ? '#fbbf24'
                  : '#22d3ee',
              fontWeight: 'bold'
            }}
          >
            {feedbackSupervisor.mensaje}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackSupervisor(null)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #262629',
              color: '#94a3b8',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '11px'
            }}
          >
            ✕ Cerrar
          </button>
        </div>
      )}

      {/* ============================================================================
          CONTENIDO DE LA PESTAÑA ACTIVA: 📋 CHECK-IN ASAMBLEA (PUERTA SALÓN SOCIAL)
      ============================================================================ */}
      {activeSubTab === 'asamblea_checkin' && (() => {
        const coefPresencial = Number(unidadesAsamblea.filter(u => u.presente).reduce((acc, u) => acc + u.coeficiente, 0).toFixed(1));
        const coefPoder = Number(unidadesAsamblea.filter(u => !u.presente && u.poder).reduce((acc, u) => acc + u.coeficiente, 0).toFixed(1));
        const quorumTotal = Number(unidadesAsamblea.filter(u => u.presente || u.poder).reduce((acc, u) => acc + u.coeficiente, 0).toFixed(1));
        const unidadesFiltradas = unidadesAsamblea.filter(u =>
          !busquedaCheckinAsamblea.trim() ||
          u.unidad.toLowerCase().includes(busquedaCheckinAsamblea.toLowerCase()) ||
          u.propietario.toLowerCase().includes(busquedaCheckinAsamblea.toLowerCase())
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', backgroundColor: 'rgba(52, 211, 153, 0.12)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.35)', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    [ CONTROL LOGÍSTICO EN PUERTA SALÓN SOCIAL • SINCRONIZADO CON ADMINISTRADOR ]
                  </span>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', margin: '8px 0 4px 0' }}>
                    📋 Check-in de Propietarios y Validación de Poderes (Ley 675)
                  </h2>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    Rol Supervisor: Registra la llegada de propietarios o valida poderes físicos en la entrada del salón social. (Sin permisos para lanzar preguntas ni cerrar votaciones).
                  </p>
                </div>

                <div style={{ backgroundColor: '#1c1c1f', border: `1px solid ${quorumTotal > 50 ? '#34d399' : '#f87171'}`, borderRadius: '10px', padding: '10px 16px', fontFamily: 'monospace', textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>QUÓRUM EN SALA EN TIEMPO REAL</span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: quorumTotal > 50 ? '#34d399' : '#f87171' }}>
                    {quorumTotal.toFixed(1)}% {quorumTotal >= 70 ? '• CALIFICADO (≥70%)' : quorumTotal > 50 ? '• DELIBERATORIO (>50%)' : '• EN FORMACIÓN'}
                  </span>
                </div>
              </div>

              {/* BARRA DE QUÓRUM EN TIEMPO REAL CON MARCADORES 50%+1 Y 70% */}
              <div style={{ backgroundColor: '#1c1c1f', border: '1px solid #262629', borderRadius: '10px', padding: '14px 16px', fontFamily: 'monospace', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: '#cbd5e1', marginBottom: '8px' }}>
                  <span>Presentes Directos: <strong style={{ color: '#34d399' }}>{coefPresencial.toFixed(1)}%</strong> | Por Poder: <strong style={{ color: '#22d3ee' }}>{coefPoder.toFixed(1)}%</strong></span>
                  <span>Marcadores Ley 675: <strong style={{ color: '#22d3ee' }}>50%+1 (Simple)</strong> • <strong style={{ color: '#34d399' }}>70.0% (Mayoría Calificada)</strong></span>
                </div>
                <div style={{ position: 'relative', width: '100%', height: '12px', backgroundColor: '#141416', borderRadius: '6px', overflow: 'hidden', border: '1px solid #262629' }}>
                  <div style={{ width: `${Math.min(100, quorumTotal)}%`, height: '100%', backgroundColor: quorumTotal >= 70 ? '#34d399' : quorumTotal > 50 ? '#22d3ee' : '#f59e0b', transition: 'width 0.3s ease' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '51%', width: '2px', backgroundColor: '#ffffff' }} title="50% + 1 Quórum Deliberatorio" />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '70%', width: '2px', backgroundColor: '#34d399' }} title="70% Mayoría Calificada Ley 675" />
                </div>
              </div>

              {/* BUSCADOR RÁPIDO DE UNIDAD EN PUERTA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <input
                  type="text"
                  value={busquedaCheckinAsamblea}
                  onChange={e => setBusquedaCheckinAsamblea(e.target.value)}
                  placeholder="🔍 Buscar apartamento o propietario en fila de ingreso..."
                  style={{ flex: 1, minWidth: '260px', backgroundColor: '#1c1c1f', border: '1px solid #262629', color: '#ffffff', padding: '10px 14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}
                />
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
                  Habilitados: <strong style={{ color: '#34d399' }}>{unidadesAsamblea.filter(u => u.presente || u.poder).length}</strong> de {unidadesAsamblea.length} unidades/bloques
                </span>
              </div>

              {/* TABLA DE CHECK-IN DE APARTAMENTOS */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'monospace', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', borderBottom: '1px solid #262629' }}>
                      <th style={{ padding: '12px' }}>Apartamento / Unidad</th>
                      <th style={{ padding: '12px' }}>Propietario Registrado</th>
                      <th style={{ padding: '12px' }}>Coeficiente (%)</th>
                      <th style={{ padding: '12px' }}>Check-in Presencial</th>
                      <th style={{ padding: '12px' }}>Validación de Poder</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Estado Tarjetón</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unidadesFiltradas.map(u => {
                      const habilitado = u.presente || u.poder;
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid #262629', backgroundColor: habilitado ? 'rgba(52, 211, 153, 0.03)' : 'transparent' }}>
                          <td style={{ padding: '12px', color: '#ffffff', fontWeight: 'bold' }}>
                            {u.unidad}
                            {u.esResidenteActual && (
                              <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee', border: '1px solid rgba(34, 211, 238, 0.3)' }}>
                                Portal Residente
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px', color: '#cbd5e1' }}>{u.propietario}</td>
                          <td style={{ padding: '12px', color: '#22d3ee', fontWeight: 'bold' }}>{u.coeficiente.toFixed(1)}%</td>
                          <td style={{ padding: '12px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (onToggleAsistenciaAsamblea) onToggleAsistenciaAsamblea(u.id);
                                appendAuditLog('SUPERVISOR_ASSEMBLY_CHECKIN', `Supervisor actualizó asistencia en puerta de ${u.unidad} (${u.propietario})`, 'Supervisor Operativo');
                              }}
                              style={{
                                backgroundColor: u.presente ? '#34d399' : '#1c1c1f',
                                color: u.presente ? '#09090b' : '#94a3b8',
                                border: `1px solid ${u.presente ? '#34d399' : '#262629'}`,
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              {u.presente ? '🟢 Presente en Sala' : 'Marcar Presente'}
                            </button>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (onTogglePoderAsamblea) onTogglePoderAsamblea(u.id);
                                appendAuditLog('SUPERVISOR_ASSEMBLY_PROXY', `Supervisor validó/revocó poder escrito de ${u.unidad} (${u.propietario})`, 'Supervisor Operativo');
                              }}
                              style={{
                                backgroundColor: u.poder ? '#22d3ee' : '#1c1c1f',
                                color: u.poder ? '#09090b' : '#94a3b8',
                                border: `1px solid ${u.poder ? '#22d3ee' : '#262629'}`,
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              {u.poder ? '📄 Poder Validado' : 'Validar Poder'}
                            </button>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: habilitado ? '#34d399' : '#64748b' }}>
                            {habilitado ? `✓ Habilitado (+${u.coeficiente.toFixed(1)}%)` : '⚪ Sin Ingreso'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================================
          CONTENIDO DE LA PESTAÑA ACTIVA: 🥂 CHECKLIST DIGITAL SALÓN SOCIAL / BBQ (TABLET SUPERVISOR)
      ============================================================================ */}
      {activeSubTab === 'checklist_zonas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '24px' }}>
            <div style={{ marginBottom: '18px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'monospace', backgroundColor: 'rgba(34, 211, 238, 0.12)', color: '#22d3ee', border: '1px solid rgba(34, 211, 238, 0.35)', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                [ TABLET DE INSPECCIÓN DE ZONAS COMUNES • DEPÓSITO DE GARANTÍA REEMBOLSABLE $100.000 COP ]
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', margin: '8px 0 4px 0' }}>
                🥂 Checklist de Entrega Digital Post-Evento (Salón Social &amp; BBQ)
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                Inspecciona el estado de muros, sillas, aseo y equipos al finalizar el evento. Con un clic puedes reembolsar el 100% del depósito o retener un porcentaje generando sanción automática al extracto del apartamento.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reservasZonasList.map(res => (
                <div key={res.id} style={{ backgroundColor: '#1c1c1f', border: '1px solid #262629', borderRadius: '12px', padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee', fontWeight: 'bold' }}>
                          {res.codigoReserva}
                        </span>
                        <strong style={{ color: '#ffffff', fontSize: '15px' }}>{res.zona}</strong>
                        <span style={{ color: '#94a3b8' }}>• {res.unidad} ({res.propietario})</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                        Fecha: {res.fechaEvento} ({res.horario}) • Tarifa Uso: ${res.tarifaUso.toLocaleString()} + Depósito Custodia: <strong style={{ color: '#34d399' }}>${res.depositoGarantia.toLocaleString()} COP</strong>
                      </div>
                    </div>

                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      backgroundColor: res.estadoDeposito.includes('Reembolsado')
                        ? 'rgba(52, 211, 153, 0.15)'
                        : res.estadoDeposito.includes('Retenido')
                        ? 'rgba(248, 113, 113, 0.15)'
                        : 'rgba(34, 211, 238, 0.15)',
                      color: res.estadoDeposito.includes('Reembolsado')
                        ? '#34d399'
                        : res.estadoDeposito.includes('Retenido')
                        ? '#f87171'
                        : '#22d3ee',
                      border: '1px solid #262629'
                    }}>
                      {res.estadoDeposito}
                    </span>
                  </div>

                  {/* BOTONES INTERACTIVOS DEL CHECKLIST DIGITAL */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    {([
                      { key: 'murosPinturaOk', label: '1. Muros y Pintura sin daños' },
                      { key: 'sillasMesasOk', label: '2. Sillas y Mesas completas' },
                      { key: 'aseoProfundoOk', label: '3. Aseo y Entrega Limpia' },
                      { key: 'sonidoVidriosOk', label: '4. Sonido y Vidrios intactos' }
                    ] as const).map(item => {
                      const ok = res.checklist[item.key];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => onToggleItemChecklistReserva && onToggleItemChecklistReserva(res.id, item.key)}
                          style={{
                            backgroundColor: '#141416',
                            border: `1px solid ${ok ? '#34d399' : '#ef4444'}`,
                            color: ok ? '#34d399' : '#f87171',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>{item.label}</span>
                          <span>{ok ? '✓ OK' : '✕ DAÑO'}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ACCIONES DE LIQUIDACIÓN DE DEPÓSITO Y CARGO A EXTRACTO */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#141416', padding: '12px 14px', borderRadius: '8px', border: '1px solid #262629' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '11px' }}>
                      Dictamen actual: <strong>{res.checklist.observacionesInspector}</strong>
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() =>
                          onLiquidarDepositoReserva &&
                          onLiquidarDepositoReserva(res.id, 0, 'Entrega verificada a satisfacción en tablet sin daños. Depósito reembolsado 100%.')
                        }
                        style={{ backgroundColor: '#34d399', color: '#09090b', border: 'none', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                      >
                        ✅ Reembolsar 100% ($100.000)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onLiquidarDepositoReserva &&
                          onLiquidarDepositoReserva(res.id, 50, 'Incumplimiento de aseo / manchas en muros detectadas en tablet. Se retiene 50% del depósito.')
                        }
                        style={{ backgroundColor: '#f59e0b', color: '#09090b', border: 'none', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                      >
                        ⚠️ Retener 50% ($50.000) + Sanción
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onLiquidarDepositoReserva &&
                          onLiquidarDepositoReserva(res.id, 100, 'Daños en muros/mobiliario verificados en tablet. Se retiene 100% del depósito y se carga sanción al extracto.')
                        }
                        style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                      >
                        🚨 Retener 100% ($100.000) + Cargar al Extracto
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          CONTENIDO DE LA PESTAÑA ACTIVA: TAB 4.1
      ============================================================================ */}
      {activeSubTab === 'tab4_1' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 1. TARJETAS KPI OPERATIVAS DEL SUPERVISOR (4 KPIs) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}
          >
            {/* KPI 1: Fondo Fijo de Caja Menor Disponible vs Gastado */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: `1px solid ${alertaCajaMenorCritica ? '#ef4444' : '#262629'}`,
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                    1. FONDO FIJO DE CAJA MENOR DISPONIBLE
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: alertaCajaMenorCritica ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.12)',
                      color: alertaCajaMenorCritica ? '#ef4444' : '#fbbf24',
                      fontWeight: 'bold'
                    }}
                  >
                    {porcentajeDisponibleCajaMenor}% Disp.
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                    color: alertaCajaMenorCritica ? '#ef4444' : '#fbbf24',
                    marginTop: '10px'
                  }}
                >
                  {formatCOP(saldoCajaMenorDisponible)}
                </div>

                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '4px' }}>
                  Gastado en la Semana: <strong style={{ color: '#ffffff' }}>{formatCOP(totalGastadoCajaMenorSemana)}</strong> / {formatCOP(FONDO_FIJO_CAJA_MENOR_ASIGNADO)}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                {alertaCajaMenorCritica ? (
                  <div
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: '900',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>⚠️ Solicitar Reembolso al Admin (&lt;20%)</span>
                    <button
                      type="button"
                      onClick={handleSolicitarReembolsoCajaMenor}
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#09090b',
                        border: 'none',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Reponer
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#141416',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid #262629'
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, porcentajeDisponibleCajaMenor)}%`,
                        height: '100%',
                        backgroundColor: porcentajeDisponibleCajaMenor < 35 ? '#fbbf24' : '#34d399'
                      }}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setReciboInspectorArqueo(movimientosCajaMenor[0] || null);
                    setModalArqueoCajaMenor(true);
                  }}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    backgroundColor: '#141416',
                    color: '#fbbf24',
                    border: '1px solid rgba(251, 191, 36, 0.45)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🪙 Arqueo Físico y Desglose de Caja Menor
                </button>
              </div>
            </div>

            {/* KPI 2: Soportes de Pago de Residentes Pendientes por Conciliar/Verificar */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                    2. SOPORTES DE PAGO POR CONCILIAR
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: '#22d3ee',
                      backgroundColor: 'rgba(34, 211, 238, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    Tab 3.1 Sync
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                    color: soportesPendientesCount > 0 ? '#fbbf24' : '#34d399',
                    marginTop: '10px'
                  }}
                >
                  {soportesPendientesCount} Pendientes
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '4px' }}>
                  Monto por aplicar:{' '}
                  <strong style={{ color: '#22d3ee' }}>
                    {formatCOP(
                      soportesPago
                        .filter(s => s.estado === 'Pendiente por Conciliar')
                        .reduce((acc, s) => acc + s.monto_reportado, 0)
                    )}
                  </strong>
                </div>
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#34d399', marginTop: '10px' }}>
                ✓ {soportesConciliadosCount} soporte(s) conciliados y abonados hoy
              </div>
            </div>

            {/* KPI 3: PQRS Operativas y Solicitudes de Mudanza/Trasteo Abiertas Hoy */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                    3. PQRS OPERATIVAS &amp; MUDANZAS HOY
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: '#fbbf24',
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    Portería / Terreno
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                    color: '#22d3ee',
                    marginTop: '10px'
                  }}
                >
                  {pqrsYMudanzasAbiertasHoy} Abiertas Hoy
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '4px' }}>
                  {solicitudesPqrsMudanza.filter(s => s.tipo_solicitud === 'PQRS Técnica/Locativa').length} PQRS Locativas •{' '}
                  {solicitudesPqrsMudanza.filter(s => s.tipo_solicitud !== 'PQRS Técnica/Locativa').length} Trasteos/Obras
                </div>
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '10px' }}>
                Validador automático contra Mora de Cartera activo
              </div>
            </div>

            {/* KPI 4: Nivel de Cumplimiento Operativo en Terreno (%) */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                    4. CUMPLIMIENTO OPERATIVO EN TERRENO
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: '#34d399',
                      backgroundColor: 'rgba(52, 211, 153, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    SLA Óptimo
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                    color: '#34d399',
                    marginTop: '10px'
                  }}
                >
                  {nivelCumplimientoTerreno}%
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '4px' }}>
                  Supervisor Activo: <strong>Hernán Darío Mejía</strong>
                </div>
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#22d3ee', marginTop: '10px' }}>
                ● Bitácora SHA-256: {auditLogs.length} eventos firmados
              </div>
            </div>
          </div>

          {/* ============================================================================
              2. BANDEJA DE CONCILIACIÓN RÁPIDA DE PAGOS (CONECTADA EN VIVO AL TAB 3.1 DEL ADMIN)
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '18px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                    color: '#22d3ee',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  [ 4.1.A BANDEJA DE CONCILIACIÓN RÁPIDA DE PAGOS • CONEXIÓN DIRECTA CON TAB 3.1 ADMIN ]
                </span>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '17px', color: '#ffffff' }}>
                  2. Bandeja de Conciliación Rápida de Pagos (Transferencias Bancolombia / PSE por Confirmar)
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Al aprobar un comprobante, el sistema descuenta automáticamente el monto del <code>saldo_actual</code> de la unidad en el <strong>Tab 3.1 del Administrador</strong>, inserta en <code>recaudos_ph</code> y firma en <code>audit_logs</code>.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#cbd5e1'
                }}
              >
                Recaudo Global Tab 3.1:{' '}
                <strong style={{ color: '#34d399' }}>
                  {formatCOP(recaudos.reduce((acc, r) => acc + r.monto_pagado, 0))}
                </strong>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '12px' }}>ID / Fecha Reporte</th>
                    <th style={{ padding: '12px' }}>Unidad / Propietario</th>
                    <th style={{ padding: '12px' }}>Saldo Actual (Tab 3.1)</th>
                    <th style={{ padding: '12px' }}>Monto Reportado</th>
                    <th style={{ padding: '12px' }}>Referencia Bancaria / Canal</th>
                    <th style={{ padding: '12px' }}>Concepto</th>
                    <th style={{ padding: '12px' }}>Estado Soporte</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Acciones de Conciliación</th>
                  </tr>
                </thead>
                <tbody>
                  {soportesPago.map(sop => {
                    const unidadLive = unidades.find(u => u.id === sop.unidad_id);
                    const saldoEnVivo = unidadLive ? unidadLive.saldo_actual : 0;
                    const isPendiente = sop.estado === 'Pendiente por Conciliar';
                    const isConciliado = sop.estado === 'Conciliado y Aplicado ✅';

                    return (
                      <tr key={sop.id} style={{ borderBottom: '1px solid #262629' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1' }}>
                          <div style={{ fontWeight: 'bold', color: '#22d3ee' }}>{sop.id}</div>
                          <div style={{ color: '#64748b', fontSize: '10px' }}>{sop.fecha_reporte}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{sop.numero_unidad}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{sop.propietario}</div>
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                          <span
                            style={{
                              color: saldoEnVivo === 0 ? '#34d399' : '#ef4444',
                              fontWeight: 'bold'
                            }}
                          >
                            {formatCOP(saldoEnVivo)}
                          </span>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            Estado: {unidadLive?.estado_cartera || 'Al día'}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: '900', color: '#34d399', fontSize: '14px' }}>
                          {formatCOP(sop.monto_reportado)}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px' }}>
                          <div style={{ color: '#ffffff', fontWeight: 'bold' }}>{sop.referencia_bancaria}</div>
                          <div style={{ color: '#94a3b8', fontSize: '10px' }}>
                            {sop.canal_bancario} • {sop.cuenta_origen}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1' }}>
                          {sop.concepto}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              backgroundColor: isConciliado
                                ? 'rgba(52, 211, 153, 0.12)'
                                : isPendiente
                                ? 'rgba(251, 191, 36, 0.12)'
                                : 'rgba(239, 68, 68, 0.12)',
                              color: isConciliado ? '#34d399' : isPendiente ? '#fbbf24' : '#ef4444',
                              border: `1px solid ${
                                isConciliado
                                  ? 'rgba(52, 211, 153, 0.35)'
                                  : isPendiente
                                  ? 'rgba(251, 191, 36, 0.35)'
                                  : 'rgba(239, 68, 68, 0.35)'
                              }`,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {sop.estado}
                          </span>
                          {sop.nota_observacion && (
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', maxWidth: '210px' }}>
                              {sop.nota_observacion}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setMontoAbonoParcialInput(String(Math.round(sop.monto_reportado / 2)));
                                setModalComprobanteConciliacion(sop);
                              }}
                              style={{
                                backgroundColor: '#1c1c1f',
                                color: '#22d3ee',
                                border: '1px solid rgba(34, 211, 238, 0.4)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              🔍 Auditar Soporte Bancario
                            </button>

                            {isPendiente && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleConciliarYAplicarPago(sop)}
                                  style={{
                                    backgroundColor: '#34d399',
                                    color: '#09090b',
                                    border: 'none',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    fontFamily: 'monospace',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✅ Conciliar y Aplicar a Cartera
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalRechazoSoporte(sop);
                                    setMotivoRechazoInput(
                                      `Inconsistencia en comprobante ${sop.referencia_bancaria}: transferencia no reflejada en cuenta recaudadora P.H.`
                                    );
                                  }}
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.14)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    fontFamily: 'monospace',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ❌ Rechazar Soporte (Inconsistente)
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================================
              3. MOTOR DE GESTIÓN DE CAJA MENOR (CONECTADO EN VIVO AL TAB 3.2 DE EGRESOS DEL ADMIN)
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(251, 191, 36, 0.12)',
                    color: '#fbbf24',
                    border: '1px solid rgba(251, 191, 36, 0.35)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  [ 4.1.B MOTOR DE GESTIÓN DE CAJA MENOR • SINCRONIZADO CON TAB 3.2 EGRESOS ADMIN ]
                </span>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '17px', color: '#ffffff' }}>
                  3. Motor de Gestión de Caja Menor (Urgencias Operativas en Terreno)
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Registra gastos operativos urgentes con tope autónomo de hasta <strong style={{ color: '#fbbf24' }}>$300.000 COP</strong> por recibo sin firma del Administrador. Cada registro se inyecta en vivo en el <strong>Tab 3.2 de Egresos</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setReciboInspectorArqueo(movimientosCajaMenor[0] || null);
                    setModalArqueoCajaMenor(true);
                  }}
                  style={{
                    backgroundColor: '#fbbf24',
                    color: '#09090b',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  🪙 Arqueo Físico y Desglose de Caja Menor
                </button>

                <button
                  type="button"
                  onClick={handleSolicitarReembolsoCajaMenor}
                  style={{
                    backgroundColor: '#1c1c1f',
                    color: '#fbbf24',
                    border: '1px solid #fbbf24',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Solicitar Reembolso de Caja Menor al Administrador
                </button>
              </div>
            </div>

            {/* Formulario: 🧾 Registrar Gasto de Caja Menor (Urgencias Operativas) */}
            <form
              onSubmit={handleRegistrarGastoCajaMenor}
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '10px',
                padding: '18px',
                marginBottom: '20px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '14px'
                }}
              >
                <h4 style={{ margin: 0, fontSize: '14px', color: '#ffffff', fontFamily: 'monospace' }}>
                  🧾 Registrar Gasto de Caja Menor (Urgencias Operativas)
                </h4>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#fbbf24' }}>
                  Tope Máximo Autónomo Supervisor: <strong>$300.000 COP</strong> por gasto • Disponible Hoy:{' '}
                  <strong style={{ color: '#34d399' }}>{formatCOP(saldoCajaMenorDisponible)}</strong>
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}
              >
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    CONCEPTO DEL GASTO MENOR (EJ. BOMBILLOS LED, CINTA ANTIDESLIZANTE, COPIA DE LLAVES) *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Compra de bombillos LED pasillo Torre 1 / Copia de llaves cuarto de bombas"
                    value={cmConcepto}
                    onChange={e => setCmConcepto(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {[
                      'Compra de bombillos LED pasillo Torre 1',
                      'Cinta antideslizante escaleras',
                      'Copia de llaves cuarto de bombas',
                      'Transporte mensajería urgente DIAN'
                    ].map(sug => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setCmConcepto(sug)}
                        style={{
                          backgroundColor: '#141416',
                          color: '#22d3ee',
                          border: '1px solid #262629',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          cursor: 'pointer'
                        }}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    PROVEEDOR / FERRETERÍA *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Ferretería El Poblado"
                    value={cmProveedor}
                    onChange={e => setCmProveedor(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    N° RECIBO / FACTURA POS *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. POS-9941"
                    value={cmRecibo}
                    onChange={e => setCmRecibo(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#22d3ee',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    CATEGORÍA OPERATIVA
                  </label>
                  <select
                    value={cmCategoria}
                    onChange={e => setCmCategoria(e.target.value as MovimientoCajaMenorPH['categoria_operativa'])}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  >
                    <option value="Eléctrico / Iluminación">Eléctrico / Iluminación</option>
                    <option value="Ferretería / Locativo">Ferretería / Locativo</option>
                    <option value="Cerrajería / Seguridad">Cerrajería / Seguridad</option>
                    <option value="Mensajería / Papelería">Mensajería / Papelería</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    MONTO ($ COP - MÁX. $300.000) *
                  </label>
                  <input
                    type="number"
                    step="5000"
                    placeholder="Ej. 145000"
                    value={cmMonto}
                    onChange={e => setCmMonto(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: `1px solid ${Number(cmMonto) > TOPE_MAXIMO_GASTO_SUPERVISOR ? '#ef4444' : '#262629'}`,
                      color: Number(cmMonto) > TOPE_MAXIMO_GASTO_SUPERVISOR ? '#ef4444' : '#fbbf24',
                      fontWeight: 'bold',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}
                  />
                  {Number(cmMonto) > TOPE_MAXIMO_GASTO_SUPERVISOR && (
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#ef4444', display: 'block', marginTop: '3px' }}>
                      ⚠️ Excede tope de $300.000 COP sin firma del Admin
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#fbbf24',
                    color: '#09090b',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  + REGISTRAR GASTO DE CAJA MENOR &amp; SINCRONIZAR CON TAB 3.2 ADMIN
                </button>
              </div>
            </form>

            {/* Tabla de Movimientos de Caja Menor */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '12px' }}>ID / N° Recibo</th>
                    <th style={{ padding: '12px' }}>Fecha</th>
                    <th style={{ padding: '12px' }}>Concepto Operativo</th>
                    <th style={{ padding: '12px' }}>Proveedor / Ferretería</th>
                    <th style={{ padding: '12px' }}>Rubro</th>
                    <th style={{ padding: '12px' }}>Monto ($ COP)</th>
                    <th style={{ padding: '12px' }}>Estado Fondo / Tab 3.2</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Soporte</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosCajaMenor.map(mov => (
                    <tr key={mov.id} style={{ borderBottom: '1px solid #262629' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px' }}>
                        <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>{mov.id}</div>
                        <div style={{ color: '#94a3b8', fontSize: '10px' }}>Recibo: {mov.recibo_num}</div>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1' }}>
                        {mov.fecha}
                      </td>
                      <td style={{ padding: '12px', color: '#ffffff', fontWeight: '600' }}>
                        {mov.concepto}
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#cbd5e1' }}>
                        {mov.proveedor_ferreteria}
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748b' }}>NIT: {mov.nit_proveedor}</div>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#22d3ee' }}>
                        {mov.categoria_operativa}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#fbbf24' }}>
                        -{formatCOP(mov.monto)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            backgroundColor:
                              mov.estado_reembolso === 'Reembolsado por Admin ✅'
                                ? 'rgba(52, 211, 153, 0.12)'
                                : 'rgba(251, 191, 36, 0.12)',
                            color: mov.estado_reembolso === 'Reembolsado por Admin ✅' ? '#34d399' : '#fbbf24',
                            border: `1px solid ${
                              mov.estado_reembolso === 'Reembolsado por Admin ✅'
                                ? 'rgba(52, 211, 153, 0.35)'
                                : 'rgba(251, 191, 36, 0.35)'
                            }`
                          }}
                        >
                          {mov.estado_reembolso}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setModalSoporteCajaMenor(mov)}
                          style={{
                            backgroundColor: '#1c1c1f',
                            color: '#22d3ee',
                            border: '1px solid rgba(34, 211, 238, 0.4)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          🔍 Ver Soporte de Gasto
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================================
              4. CENTRO DE ATENCIÓN DE PQRS OPERATIVAS Y AUTORIZACIÓN DE MUDANZAS / TRASTEOS
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  [ 4.1.C CENTRO DE PQRS OPERATIVAS &amp; VALIDADOR INTELIGENTE DE MUDANZAS ]
                </span>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '17px', color: '#ffffff' }}>
                  4. Centro de Atención de PQRS Operativas y Autorización de Mudanzas / Trasteos
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  El sistema consulta en tiempo real la cartera del <strong>Tab 3.1 del Administrador</strong>: si el apartamento solicitante registra deuda, bloquea el Paz y Salvo de Portería; si está <strong>Al día</strong> y consignó depósito, habilita la orden oficial para los vigilantes.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['Todos', 'Solo PQRS Locativas', 'Solo Mudanzas y Obras'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFiltroPqrsTipo(f)}
                    style={{
                      backgroundColor: filtroPqrsTipo === f ? '#22d3ee' : '#1c1c1f',
                      color: filtroPqrsTipo === f ? '#09090b' : '#cbd5e1',
                      border: `1px solid ${filtroPqrsTipo === f ? '#22d3ee' : '#262629'}`,
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Formulario para radicar nueva PQRS Técnica/Locativa o Solicitud de Permiso de Mudanza */}
            <form
              onSubmit={handleRegistrarPqrsOMudanza}
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '10px',
                padding: '18px',
                marginBottom: '20px'
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#ffffff', fontFamily: 'monospace' }}>
                + Radicar Nueva PQRS Técnica/Locativa o Solicitud de Permiso de Mudanza / Obra
              </h4>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '12px'
                }}
              >
                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    UNIDAD / APARTAMENTO SOLICITANTE (LECTURA TAB 3.1) *
                  </label>
                  <select
                    value={pqrsUnidadId}
                    onChange={e => setPqrsUnidadId(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  >
                    {unidades.length > 0 ? (
                      unidades.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.numero_unidad} — {u.propietario} ({(u.saldo_actual ?? 0) === 0 ? 'AL DÍA ✅' : `MORA: ${formatCOP(u.saldo_actual ?? 0)}`})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="1">Torre 1 - Apto 101 — Propietario Registrado (AL DÍA ✅)</option>
                        <option value="2">Torre 1 - Apto 204 — Propietario Registrado (AL DÍA ✅)</option>
                        <option value="3">Torre 2 - Apto 302 — Propietario Registrado (AL DÍA ✅)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    TIPO DE SOLICITUD *
                  </label>
                  <select
                    value={pqrsTipo}
                    onChange={e => setPqrsTipo(e.target.value as SolicitudPqrsMudanzaPH['tipo_solicitud'])}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#22d3ee',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  >
                    <option value="Solicitud de Permiso de Mudanza / Trasteo o Ingreso de Material de Obra">
                      b) Solicitud de Permiso de Mudanza / Trasteo o Ingreso de Material de Obra
                    </option>
                    <option value="PQRS Técnica/Locativa">
                      a) PQRS Técnica/Locativa (Humedad, Ascensor, Luminaria)
                    </option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    UBICACIÓN / ZONA O PUNTO FIJO
                  </label>
                  <input
                    type="text"
                    value={pqrsUbicacion}
                    onChange={e => setPqrsUbicacion(e.target.value)}
                    placeholder="Ej. Parqueadero 14 / Ascensor Torre 2"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    PRIORIDAD OPERATIVA
                  </label>
                  <select
                    value={pqrsPrioridad}
                    onChange={e => setPqrsPrioridad(e.target.value as SolicitudPqrsMudanzaPH['prioridad'])}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    DESCRIPCIÓN DE LA PQRS LOCATIVA O DETALLE DE MUDANZA / MATERIAL DE OBRA *
                  </label>
                  <input
                    type="text"
                    value={pqrsAsunto}
                    onChange={e => setPqrsAsunto(e.target.value)}
                    placeholder="Ej. Humedad en techo parqueadero 14 / Salida de trasteo camión furgón placa WLU-492"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                {pqrsTipo !== 'PQRS Técnica/Locativa' && (
                  <>
                    <div>
                      <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        EMPRESA TRANSPORTADORA &amp; PLACA VEHÍCULO
                      </label>
                      <input
                        type="text"
                        value={pqrsPlacaEmpresa}
                        onChange={e => setPqrsPlacaEmpresa(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: '#141416',
                          border: '1px solid #262629',
                          color: '#cbd5e1',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        FRANJA PROGRAMADA MUDANZA / OBRA
                      </label>
                      <input
                        type="text"
                        value={pqrsFechaProgramada}
                        onChange={e => setPqrsFechaProgramada(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: '#141416',
                          border: '1px solid #262629',
                          color: '#cbd5e1',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
                      <input
                        type="checkbox"
                        id="chkDepositoMudanza"
                        checked={pqrsDepositoConsignado}
                        onChange={e => setPqrsDepositoConsignado(e.target.checked)}
                      />
                      <label htmlFor="chkDepositoMudanza" style={{ fontSize: '11px', fontFamily: 'monospace', color: '#34d399', cursor: 'pointer' }}>
                        Depósito de Garantía ($250.000 COP) Recibido
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#34d399',
                    color: '#09090b',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  + RADICAR SOLICITUD Y VALIDAR ESTADO DE CARTERA EN VIVO
                </button>
              </div>
            </form>

            {/* Tabla de PQRS Operativas y Autorización de Mudanzas/Trasteos */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '12px' }}>Radicado / Tipo</th>
                    <th style={{ padding: '12px' }}>Unidad / Solicitante</th>
                    <th style={{ padding: '12px' }}>Detalle Técnico o Logística Trasteo</th>
                    <th style={{ padding: '12px' }}>Validación Cartera (Tab 3.1 en Vivo)</th>
                    <th style={{ padding: '12px' }}>Estado Operativo</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Acción / Paz y Salvo Portería</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesFiltradas.map(sol => {
                    const unidadEnVivo: UnidadCarteraPH =
                      unidades.find(u => u.id === sol.unidad_id) ||
                      unidades[0] || {
                        id: sol.unidad_id,
                        numero_unidad: sol.numero_unidad,
                        propietario: sol.propietario,
                        documento_nit: 'CC 71.000.101',
                        telefono_whatsapp: '+57 300 000 0000',
                        email: 'propietario@urbix.ph',
                        coeficiente: 1.5,
                        cuota_base: 450000,
                        capital_vencido: 0,
                        intereses_mora: 0,
                        costos_prejuridicos: 0,
                        saldo_actual: 0,
                        estado_cartera: 'Al día'
                      };
                    const tieneDeudaEnVivo = (unidadEnVivo?.saldo_actual ?? 0) > 0;
                    const esMudanza = sol.tipo_solicitud !== 'PQRS Técnica/Locativa';
                    const habilitadoMudanza = esMudanza && !tieneDeudaEnVivo && sol.deposito_consignado;

                    return (
                      <tr key={sol.id} style={{ borderBottom: '1px solid #262629' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px' }}>
                          <div style={{ color: '#22d3ee', fontWeight: 'bold' }}>{sol.id}</div>
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '9px',
                              backgroundColor: esMudanza ? 'rgba(251, 191, 36, 0.12)' : 'rgba(34, 211, 238, 0.12)',
                              color: esMudanza ? '#fbbf24' : '#22d3ee',
                              border: `1px solid ${esMudanza ? 'rgba(251, 191, 36, 0.35)' : 'rgba(34, 211, 238, 0.35)'}`
                            }}
                          >
                            {esMudanza ? 'MUDANZA / OBRA' : 'PQRS LOCATIVA'}
                          </span>
                        </td>

                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{sol.numero_unidad}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{sol.propietario}</div>
                          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748b', marginTop: '2px' }}>
                            📍 {sol.ubicacion_exacta}
                          </div>
                        </td>

                        <td style={{ padding: '12px', maxWidth: '300px' }}>
                          <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '12px' }}>{sol.asunto_detalle}</div>
                          {esMudanza && (
                            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '4px' }}>
                              🚛 {sol.empresa_transporte_placa || 'Vehículo Particular'} • 📅 {sol.fecha_programada_mudanza || 'Por confirmar'}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px' }}>
                          {esMudanza ? (
                            tieneDeudaEnVivo ? (
                              <div
                                style={{
                                  backgroundColor: 'rgba(239, 68, 68, 0.14)',
                                  border: '1px solid #ef4444',
                                  color: '#ef4444',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontWeight: 'bold',
                                  fontSize: '10px'
                                }}
                              >
                                ⚠️ Unidad con Mora - Requiere Autorización Especial del Admin
                                <div style={{ color: '#fca5a5', marginTop: '2px', fontWeight: 'normal' }}>
                                  Deuda en Tab 3.1: <strong>{formatCOP(unidadEnVivo?.saldo_actual ?? 0)}</strong> ({unidadEnVivo?.estado_cartera ?? 'Al día'})
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                                  border: '1px solid rgba(52, 211, 153, 0.35)',
                                  color: '#34d399',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}
                              >
                                ✅ CARTERA AL DÍA ($0 COP)
                                <div style={{ color: '#cbd5e1', marginTop: '3px', fontWeight: 'normal' }}>
                                  Depósito $250k:{' '}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleDepositoMudanza(sol.id)}
                                    style={{
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      color: sol.deposito_consignado ? '#34d399' : '#fbbf24',
                                      textDecoration: 'underline',
                                      fontFamily: 'monospace',
                                      fontSize: '10px',
                                      cursor: 'pointer',
                                      padding: 0
                                    }}
                                  >
                                    {sol.deposito_consignado ? 'En Custodia ✅' : 'Pendiente (Click p/ Confirmar)'}
                                  </button>
                                </div>
                              </div>
                            )
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                              Prioridad:{' '}
                              <strong
                                style={{
                                  color:
                                    sol.prioridad === 'Urgente'
                                      ? '#ef4444'
                                      : sol.prioridad === 'Alta'
                                      ? '#fbbf24'
                                      : '#22d3ee'
                                }}
                              >
                                {sol.prioridad.toUpperCase()}
                              </strong>
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              backgroundColor:
                                sol.estado_atencion.includes('✅')
                                  ? 'rgba(52, 211, 153, 0.12)'
                                  : esMudanza && tieneDeudaEnVivo
                                  ? 'rgba(239, 68, 68, 0.14)'
                                  : 'rgba(251, 191, 36, 0.12)',
                              color:
                                sol.estado_atencion.includes('✅')
                                  ? '#34d399'
                                  : esMudanza && tieneDeudaEnVivo
                                  ? '#ef4444'
                                  : '#fbbf24',
                              border: `1px solid ${
                                sol.estado_atencion.includes('✅')
                                  ? 'rgba(52, 211, 153, 0.35)'
                                  : esMudanza && tieneDeudaEnVivo
                                  ? 'rgba(239, 68, 68, 0.4)'
                                  : 'rgba(251, 191, 36, 0.35)'
                              }`
                            }}
                          >
                            {esMudanza && tieneDeudaEnVivo ? 'Bloqueada por Mora ⚠️' : sol.estado_atencion}
                          </span>
                        </td>

                        <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {esMudanza ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setModalOrdenPorteriaMudanza({ solicitud: sol, unidad: unidadEnVivo })}
                                style={{
                                  backgroundColor: '#1c1c1f',
                                  color: '#22d3ee',
                                  border: '1px solid rgba(34, 211, 238, 0.45)',
                                  padding: '7px 11px',
                                  borderRadius: '6px',
                                  fontFamily: 'monospace',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                🔍 Expediente de Mudanza / Obra
                              </button>

                              {habilitadoMudanza ? (
                                <button
                                  type="button"
                                  onClick={() => handleEmitirOrdenPorteriaMudanza(sol, unidadEnVivo)}
                                  style={{
                                    backgroundColor: '#34d399',
                                    color: '#09090b',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    fontFamily: 'monospace',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    cursor: 'pointer'
                                  }}
                                >
                                  🚚 Emitir Paz y Salvo de Portería
                                </button>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                    color: '#ef4444',
                                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    display: 'inline-block'
                                  }}
                                >
                                  🔒 Bloqueado por Mora (Tab 3.1)
                                </span>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => handleActualizarEstadoPqrs(sol.id, 'En Verificación Terreno')}
                                style={{
                                  backgroundColor: '#1c1c1f',
                                  color: '#22d3ee',
                                  border: '1px solid #262629',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontFamily: 'monospace',
                                  fontSize: '10px',
                                  cursor: 'pointer'
                                }}
                              >
                                🛠️ En Atención
                              </button>
                              <button
                                type="button"
                                onClick={() => handleActualizarEstadoPqrs(sol.id, 'Resuelta en Terreno ✅')}
                                style={{
                                  backgroundColor: 'rgba(52, 211, 153, 0.15)',
                                  color: '#34d399',
                                  border: '1px solid rgba(52, 211, 153, 0.4)',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontFamily: 'monospace',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                ✓ Marcar Resuelta
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================================
              5. BITÁCORA DE AUDITORÍA DEL SUPERVISOR EN TIEMPO REAL (SHARED AUDIT_LOGS)
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#22d3ee', fontWeight: 'bold' }}>
                🔒 TRAZABILIDAD INMUTABLE DEL SUPERVISOR EN TERRENO (CONECTADA A MÓDULO 2 &amp; MÓDULO 3)
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#34d399' }}>
                Ejecutor Activo: Supervisor en Terreno
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
              {auditLogs.slice(0, 4).map(log => (
                <div
                  key={log.id}
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #262629',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22d3ee', fontWeight: 'bold' }}>
                    <span>[{log.action || log.action_type}]</span>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>{log.timestamp}</span>
                  </div>
                  <div style={{ color: '#f8fafc', marginTop: '4px', fontSize: '11px' }}>{log.details}</div>
                  <div style={{ color: '#34d399', marginTop: '4px', fontSize: '10px' }}>
                    Ejecutor: {log.user || log.user_executor}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================================
              6. AUDITORÍA DE PARQUEADEROS DE VISITANTES Y BAHÍAS (SINCRONIZADO CON PORTERÍA)
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '18px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(34, 211, 238, 0.12)',
                    color: '#22d3ee',
                    border: '1px solid rgba(34, 211, 238, 0.35)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  [ 4.1.F AUDITORÍA DE PARQUEADEROS DE VISITANTES &amp; BAHÍAS EXTERIORES • LEY 675 ]
                </span>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '17px', color: '#ffffff' }}>
                  6. Auditoría de Parqueaderos de Visitantes, Bahías y Control de Pernocta
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Monitoreo en tiempo real de celdas asignadas en portería, control de sobrecupo y detección automática de vehículos con permanencia superior a 12 horas.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #262629',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>Total Bahías:</span>{' '}
                  <strong style={{ color: '#ffffff' }}>{celdasParqueadero.length} Celdas</strong>
                </div>
                <div
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #34d399',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                >
                  <span style={{ color: '#34d399' }}>Libres:</span>{' '}
                  <strong style={{ color: '#34d399' }}>{celdasParqueadero.filter(c => c.estado === '🟢 Libre').length}</strong>
                </div>
                <div
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                >
                  <span style={{ color: '#ef4444' }}>Ocupadas:</span>{' '}
                  <strong style={{ color: '#ef4444' }}>{celdasParqueadero.filter(c => c.estado !== '🟢 Libre').length}</strong>
                </div>
                <div
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #fbbf24',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                >
                  <span style={{ color: '#fbbf24' }}>Excedidas (+12h):</span>{' '}
                  <strong style={{ color: '#fbbf24' }}>
                    {celdasParqueadero.filter(c => c.estado === '🟡 Excedido de tiempo (+12h)').length}
                  </strong>
                </div>
              </div>
            </div>

            {/* Tabla de celdas ocupadas y en alerta */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '12px' }}>Celda / Ubicación</th>
                    <th style={{ padding: '12px' }}>Vehículo &amp; Placa</th>
                    <th style={{ padding: '12px' }}>Unidad Anfitriona</th>
                    <th style={{ padding: '12px' }}>Visitante</th>
                    <th style={{ padding: '12px' }}>Hora Entrada</th>
                    <th style={{ padding: '12px' }}>Tiempo Transcurrido</th>
                    <th style={{ padding: '12px' }}>Estado Bahía</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Acción Supervisor</th>
                  </tr>
                </thead>
                <tbody>
                  {celdasParqueadero.map(celda => {
                    const isLibre = celda.estado === '🟢 Libre';
                    const isExcedido = celda.estado === '🟡 Excedido de tiempo (+12h)';

                    return (
                      <tr key={celda.id} style={{ borderBottom: '1px solid #262629' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                          <span style={{ fontWeight: 'bold', color: isLibre ? '#34d399' : isExcedido ? '#fbbf24' : '#22d3ee' }}>
                            {celda.codigo_celda}
                          </span>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{celda.ubicacion}</div>
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                          {isLibre ? (
                            <span style={{ color: '#64748b' }}>— Sin Vehículo —</span>
                          ) : (
                            <div>
                              <strong style={{ color: '#ffffff', fontSize: '14px' }}>{celda.placa_actual}</strong>
                              <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '6px' }}>({celda.tipo_vehiculo_actual})</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {isLibre ? (
                            <span style={{ color: '#64748b', fontFamily: 'monospace' }}>—</span>
                          ) : (
                            <div>
                              <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>{celda.numero_unidad_visita}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{celda.propietario_anfitrion}</div>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>
                          {isLibre ? '—' : celda.visitante_nombre || 'Visitante'}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8', fontSize: '11px' }}>
                          {isLibre ? '—' : celda.hora_entrada}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {isLibre ? (
                            <span style={{ color: '#64748b' }}>0.0h</span>
                          ) : (
                            <span style={{ color: isExcedido ? '#fbbf24' : '#34d399' }}>
                              ⏱️ {celda.horas_transcurridas?.toFixed(1) || '1.0'}h
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              backgroundColor: isLibre
                                ? 'rgba(52, 211, 153, 0.12)'
                                : isExcedido
                                ? 'rgba(251, 191, 36, 0.15)'
                                : 'rgba(239, 68, 68, 0.12)',
                              color: isLibre ? '#34d399' : isExcedido ? '#fbbf24' : '#ef4444',
                              border: `1px solid ${isLibre ? '#34d399' : isExcedido ? '#fbbf24' : '#ef4444'}`
                            }}
                          >
                            {celda.estado}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {!isLibre ? (
                            <button
                              type="button"
                              onClick={() => {
                                setModalAlertaParqueadero(celda);
                                setNotaPernoctaInput(
                                  isExcedido
                                    ? `ALERTA PERNOCTA: El vehículo placa ${celda.placa_actual} acumula ${celda.horas_transcurridas?.toFixed(1)}h en celda ${celda.codigo_celda} (${celda.numero_unidad_visita}). Se requiere requerimiento formal a residente.`
                                    : `Novedad sobre bahía ${celda.codigo_celda}: vehículo ${celda.placa_actual} verificado en terreno.`
                                );
                              }}
                              style={{
                                backgroundColor: isExcedido ? '#fbbf24' : '#1c1c1f',
                                color: isExcedido ? '#09090b' : '#22d3ee',
                                border: `1px solid ${isExcedido ? '#fbbf24' : 'rgba(34, 211, 238, 0.4)'}`,
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              {isExcedido ? '⚠️ Notificar Pernocta' : '🔍 Auditar Bahía'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>Libre</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7. INSPECCIÓN Y CERTIFICACIÓN DE CAMPO EN MUDANZAS Y REFORMAS LOCATIVAS */}
          <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', backgroundColor: 'rgba(34, 211, 238, 0.12)', color: '#22d3ee', border: '1px solid rgba(34, 211, 238, 0.35)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  [ 4.1.G SUPERVISIÓN EN CAMPO · MUDANZAS Y REFORMAS LOCATIVAS ]
                </span>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '17px', color: '#ffffff' }}>
                  7. Inspección de Bienes Comunes y Certificación de Trasteos / Obras
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Supervisa la protección de ascensores, manejo de escombros y horarios. Emite el dictamen para devolución o retención de depósitos.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '12px' }}>Evento / Unidad</th>
                    <th style={{ padding: '12px' }}>Responsable / Empresa</th>
                    <th style={{ padding: '10px' }}>Horario Programado</th>
                    <th style={{ padding: '10px' }}>Depósito Custodia</th>
                    <th style={{ padding: '10px' }}>Estado Inspección</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Dictamen de Campo (Supervisora)</th>
                  </tr>
                </thead>
                <tbody>
                  {reformasMudanzas.map(ref => {
                    const isSinDanos = ref.supervision_estado === 'Certificado Sin Daños ✅';
                    const isConDano = ref.supervision_estado === 'Reportado Con Daño en Bienes Comunes ⚠️';

                    return (
                      <tr key={ref.id} style={{ borderBottom: '1px solid #262629' }}>
                        <td style={{ padding: '12px', color: '#ffffff', fontWeight: 'bold' }}>
                          {ref.tipo_evento}
                          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#22d3ee' }}>
                            {ref.numero_unidad} ({ref.id})
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>
                          <strong>{ref.propietario_residente}</strong>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{ref.contratista_responsable}</div>
                        </td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1' }}>
                          {ref.fecha_inicio} al {ref.fecha_fin}
                        </td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', color: '#34d399', fontWeight: 'bold' }}>
                          ${ref.deposito_garantia_cop.toLocaleString()} COP
                        </td>
                        <td style={{ padding: '10px', fontSize: '11px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              fontSize: '10px',
                              backgroundColor: isSinDanos ? 'rgba(52, 211, 153, 0.15)' : isConDano ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                              color: isSinDanos ? '#34d399' : isConDano ? '#ef4444' : '#fbbf24',
                              border: `1px solid ${isSinDanos ? '#34d399' : isConDano ? '#ef4444' : '#fbbf24'}`
                            }}
                          >
                            {ref.supervision_estado.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleCertificarReformaSinDanos(ref.id)}
                              style={{
                                backgroundColor: isSinDanos ? '#34d399' : '#1c1c1f',
                                color: isSinDanos ? '#09090b' : '#34d399',
                                border: '1px solid #34d399',
                                padding: '5px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              ✅ Certificar Sin Daños
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReportarDanoReforma(ref.id)}
                              style={{
                                backgroundColor: isConDano ? '#ef4444' : '#1c1c1f',
                                color: isConDano ? '#ffffff' : '#ef4444',
                                border: '1px solid #ef4444',
                                padding: '5px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              ⚠️ Reportar Daño
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 8. DESPACHO DE INSUMOS DE BODEGA Y SOLICITUD DE REABASTECIMIENTO */}
          <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', backgroundColor: 'rgba(52, 211, 153, 0.12)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.35)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  [ 4.1.H CONTROL DE INVENTARIO EN BODEGA DE CAMPO ]
                </span>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '17px', color: '#ffffff' }}>
                  8. Despacho de Insumos de Bodega a Personal (Aseo / Todero) y Alertas
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Registra entregas diarias de insumos de aseo o iluminación. Dispara la solicitud de reabastecimiento directo a Administración.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '10px' }}>Insumo / Código</th>
                    <th style={{ padding: '10px' }}>Categoría</th>
                    <th style={{ padding: '10px' }}>Stock Actual</th>
                    <th style={{ padding: '10px' }}>Estado Bodega</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Entrega a Campo &amp; Solicitud</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarioBodega.map(item => {
                    const isCritico = item.estado_stock === 'Stock Crítico ⚠️';
                    const isSolicitado = item.estado_stock === 'Solicitado a Administración 🛒';

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #262629' }}>
                        <td style={{ padding: '10px', color: '#ffffff', fontWeight: 'bold' }}>
                          {item.nombre}
                          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#22d3ee' }}>{item.codigo}</div>
                        </td>
                        <td style={{ padding: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{item.categoria}</td>
                        <td style={{ padding: '10px', fontFamily: 'monospace' }}>
                          <strong style={{ color: isCritico || isSolicitado ? '#ef4444' : '#34d399', fontSize: '14px' }}>
                            {item.stock_actual}
                          </strong>{' '}
                          {item.unidad_medida}
                        </td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '10px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: isCritico ? 'rgba(239, 68, 68, 0.15)' : isSolicitado ? 'rgba(251, 191, 36, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                              color: isCritico ? '#ef4444' : isSolicitado ? '#fbbf24' : '#34d399',
                              border: `1px solid ${isCritico ? '#ef4444' : isSolicitado ? '#fbbf24' : '#34d399'}`
                            }}
                          >
                            {item.estado_stock.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleSalidaInsumoBodega(item.id, 1)}
                              disabled={item.stock_actual <= 0}
                              style={{
                                backgroundColor: '#1c1c1f',
                                border: '1px solid #34d399',
                                color: '#34d399',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                cursor: item.stock_actual > 0 ? 'pointer' : 'not-allowed'
                              }}
                            >
                              📦 Despachar -1 {item.unidad_medida}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSolicitarReabastecimientoBodega(item.id)}
                              style={{
                                backgroundColor: isSolicitado ? '#fbbf24' : '#1c1c1f',
                                border: '1px solid #fbbf24',
                                color: isSolicitado ? '#09090b' : '#fbbf24',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              🛒 Solicitar Compra a Admin
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================================
          CONTENIDO DE LA PESTAÑA ACTIVA: TAB 4.2 (CONTROL DE CUADRILLAS, TURNOS & CONTRATISTAS EN CAMPO)
      ============================================================================ */}
      {activeSubTab === 'tab4_2' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 1. TARJETAS KPI DE MANDO EN TERRENO (4 KPIs) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))',
              gap: '16px'
            }}
          >
            {/* KPI 1: Vigilantes en Puesto Ahora Mismo */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                    1. VIGILANTES EN PUESTO AHORA MISMO
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(52, 211, 153, 0.12)',
                      color: '#34d399',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    24/7 Activo
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                    color: '#34d399',
                    marginTop: '10px'
                  }}
                >
                  {kpiVigilantesEnPuesto} en Puesto
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '4px' }}>
                  Portería Principal, Rondero, Parqueaderos
                </div>
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '10px' }}>
                Total guardas en nómina operativa: {cuadrillaOperativaCampo.filter(p => p.role === 'vigilante').length}
              </div>
            </div>

            {/* KPI 2: Personal de Aseo y Mantenimiento en Turno Activo */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                    2. ASEO Y MANTENIMIENTO EN TURNO
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(34, 211, 238, 0.12)',
                      color: '#22d3ee',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    Zonas Comunes
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                    color: '#22d3ee',
                    marginTop: '10px'
                  }}
                >
                  {kpiAseoEnTurnoActivo} Operarios
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '4px' }}>
                  Torres 1 y 2 • Zonas Verdes y Piscina
                </div>
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#34d399', marginTop: '10px' }}>
                ✓ Rutina de desinfección y paisajismo al día
              </div>
            </div>

            {/* KPI 3: Contratistas Externos Trabajando Dentro de la Copropiedad Hoy */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                    3. CONTRATISTAS TRABAJANDO HOY
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(251, 191, 36, 0.12)',
                      color: '#fbbf24',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    {ordenesTrabajo.filter(o => o.estado_orden !== 'Finalizada').length} Órdenes Activas
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                    color: '#fbbf24',
                    marginTop: '10px'
                  }}
                >
                  {kpiContratistasTrabajandoHoy} en Terreno
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '4px' }}>
                  Ascensores, Tanques y Puertas Eléctricas
                </div>
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#22d3ee', marginTop: '10px' }}>
                Sincronizado con Órdenes de Trabajo (Tab 3.3 Admin)
              </div>
            </div>

            {/* KPI 4: Alertas de ARL / Seguridad Social Vencida */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: `1px solid ${kpiAlertasArlVencida > 0 ? '#ef4444' : '#262629'}`,
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                    4. ALERTAS ARL / PILA VENCIDA
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      backgroundColor: kpiAlertasArlVencida > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.12)',
                      color: kpiAlertasArlVencida > 0 ? '#ef4444' : '#34d399',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    {kpiAlertasArlVencida > 0 ? '⛔ Bloqueo Portería' : '✓ 100% Vigente'}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                    color: kpiAlertasArlVencida > 0 ? '#ef4444' : '#34d399',
                    marginTop: '10px'
                  }}
                >
                  {kpiAlertasArlVencida} Alerta(s) ARL
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '4px' }}>
                  Bloqueo de ingreso inmediato en portería
                </div>
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: kpiAlertasArlVencida > 0 ? '#ef4444' : '#34d399', marginTop: '10px' }}>
                {kpiAlertasArlVencida > 0
                  ? '⚠️ Retenido en Portería hasta presentar PILA vigente'
                  : '✓ Cumplimiento SG-SST Decreto 1072 verificado'}
              </div>
            </div>
          </div>

          {/* MÓDULO SG-SST DECRETO 1072 • CONTROL DE CONTRATISTAS Y VISITAS TÉCNICAS (SINCRONIZADO CON PORTERÍA) */}
          <ModuloContratistasYVisitasTecnicas
            contratistasShared={contratistasShared}
            setContratistasShared={setContratistasShared}
            onShowToast={(msg) => {
              onShowToast?.(msg);
              setFeedbackSupervisor({ tipo: 'info', mensaje: msg });
            }}
          />

          {/* MÓDULO DE CONFIGURACIÓN DE FRECUENCIAS DE ASEO Y ASIGNACIÓN DE ÓRDENES (SINCRONIZADO CON OPERARIO) */}
          <PanelSupervisorConfiguracionAseo
            checklistConfig={checklistConfig}
            setChecklistConfig={setChecklistConfig}
            tareasShared={tareasToderosRondasShared}
            setTareasShared={setTareasToderosRondasShared}
            onShowToast={(msg) => {
              onShowToast?.(msg);
              setFeedbackSupervisor({ tipo: 'success', mensaje: msg });
            }}
          />

          {/* ============================================================================
              2. ALTA RÁPIDA DE CUADRILLA OPERATIVA Y ASIGNACIÓN DE PUESTO (HERENCIA MÓDULO 2 CON TOPE JERÁRQUICO)
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                    color: '#22d3ee',
                    border: '1px solid rgba(34, 211, 238, 0.35)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  [ 4.2.A HERENCIA MÓDULO 2 CON RESTRICCIÓN JERÁRQUICA ESTRICTA • USER_ROLES SYNC ]
                </span>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '17px', color: '#ffffff' }}>
                  2. 👷 Incorporar Personal a Cuadrilla / Autorizar Contratista
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  El Supervisor Operativo tiene bloqueo jerárquico por hardware/RLS: <strong>solo puede ver, crear y gestionar los roles</strong> <code>vigilante</code>, <code>aseo</code> y <code>contratista</code> (nunca <code>super_admin</code>, <code>admin</code> ni <code>supervisor</code>). Se sincroniza en vivo con <strong>Tab 3.3 Admin</strong> y <strong>Módulo 2 Superadmin</strong>.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#34d399'
                }}
              >
                🔒 Tope de Rol Activo: <strong>vigilante | aseo | contratista</strong>
              </div>
            </div>

            <form
              onSubmit={handleIncorporarPersonalCuadrilla}
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '10px',
                padding: '18px'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '12px'
                }}
              >
                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    NOMBRE COMPLETO DEL OPERARIO / TÉCNICO *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Duván Darío Zapata"
                    value={cuadNombre}
                    onChange={e => setCuadNombre(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    CÉDULA / ID DOCUMENTO *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. CC 1.036.912.408"
                    value={cuadCedula}
                    onChange={e => setCuadCedula(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#22d3ee',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    TELÉFONO WHATSAPP *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 573105541920"
                    value={cuadWhatsapp}
                    onChange={e => setCuadWhatsapp(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    EMPRESA EMPLEADORA / CONTRATISTA *
                  </label>
                  <input
                    type="text"
                    list="empresasCatalogoSupervisor"
                    placeholder="Ej. Aseo Total S.A.S / Seguridad Antioquia / Independiente"
                    value={cuadEmpresa}
                    onChange={e => setCuadEmpresa(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <datalist id="empresasCatalogoSupervisor">
                    <option value="Aseo Total S.A.S" />
                    <option value="Seguridad Antioquia" />
                    <option value="Independiente" />
                    <option value="Ascensores Andinos S.A.S" />
                    <option value="Hidrobombas Medellín" />
                  </datalist>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#22d3ee', display: 'block', marginBottom: '4px' }}>
                    ROL OPERATIVO (BLOQUEADO A CAMPO) *
                  </label>
                  <select
                    value={cuadRol}
                    onChange={e => setCuadRol(e.target.value as RolCampoPermitidoSupervisor)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #22d3ee',
                      color: '#22d3ee',
                      fontWeight: 'bold',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  >
                    <option value="vigilante">vigilante (Guarda / Rondero)</option>
                    <option value="aseo">aseo (Aseo / Jardinería / Todero)</option>
                    <option value="contratista">contratista (Técnico Externo)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    PUESTO / ZONA ASIGNADA *
                  </label>
                  <select
                    value={cuadPuesto}
                    onChange={e => setCuadPuesto(e.target.value as PuestoZonaOperativaPH)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  >
                    <option value="Portería Principal">Portería Principal</option>
                    <option value="Rondero Perimetral">Rondero Perimetral</option>
                    <option value="Aseo Torres 1 y 2">Aseo Torres 1 y 2</option>
                    <option value="Zonas Verdes y Piscina">Zonas Verdes y Piscina</option>
                    <option value="Cuarto de Máquinas / Ascensores">Cuarto de Máquinas / Ascensores</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    TURNO OPERATIVO *
                  </label>
                  <select
                    value={cuadTurno}
                    onChange={e => setCuadTurno(e.target.value as TurnoCampoSupervisorPH)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  >
                    <option value="Diurno 6am-2pm">Diurno 6am-2pm</option>
                    <option value="Tarde 2pm-10pm">Tarde 2pm-10pm</option>
                    <option value="Nocturno 10pm-6am">Nocturno 10pm-6am</option>
                    <option value="Turno 12h">Turno 12h</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    PLANILLA PILA / ARL *
                  </label>
                  <select
                    value={cuadArl}
                    onChange={e => setCuadArl(e.target.value as EstadoPlanillaArlCampo)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: `1px solid ${cuadArl === 'Vigente ✅' ? '#34d399' : '#ef4444'}`,
                      color: cuadArl === 'Vigente ✅' ? '#34d399' : '#ef4444',
                      fontWeight: 'bold',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  >
                    <option value="Vigente ✅">Vigente ✅</option>
                    <option value="Vencida - Bloquear Ingreso ⛔">Vencida - Bloquear Ingreso ⛔</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#22d3ee',
                    color: '#09090b',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  👷 INCORPORAR PERSONAL A CUADRILLA / AUTORIZAR CONTRATISTA (SYNC USER_ROLES)
                </button>
              </div>
            </form>
          </div>

          {/* ============================================================================
              3. BANDEJA UNIFICADA DE ÓRDENES DE TRABAJO Y MANTENIMIENTO (ALIMENTADA POR CHECKPOINTS DE RONDAS & CONTRATISTAS)
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '18px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(251, 191, 36, 0.12)',
                    color: '#fbbf24',
                    border: '1px solid rgba(251, 191, 36, 0.35)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  [ 4.2.B BANDEJA UNIFICADA DE ÓRDENES DE TRABAJO Y MANTENIMIENTO • CHECKPOINTS RONDAS + CONTRATISTAS ]
                </span>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '17px', color: '#ffffff' }}>
                  3. Bandeja Unificada de Órdenes de Trabajo y Mantenimiento (Filtro Activo: Pendiente y En Proceso)
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Fusiona automáticamente los hallazgos de mantenimiento reportados en los Checkpoints de Rondas del vigilante con las órdenes técnicas. Por defecto muestra únicamente tareas <strong>Pendiente</strong> y <strong>En Proceso</strong>, enviando las <strong>Solucionadas</strong> al historial secundario.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setVistaFiltroBandejaMantenimiento('activas')}
                  style={{
                    backgroundColor: vistaFiltroBandejaMantenimiento === 'activas' ? '#fbbf24' : '#1c1c1f',
                    color: vistaFiltroBandejaMantenimiento === 'activas' ? '#09090b' : '#cbd5e1',
                    border: `1px solid ${vistaFiltroBandejaMantenimiento === 'activas' ? '#fbbf24' : '#262629'}`,
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  🛠️ Activas: Pendiente y En Proceso ({tareasActivasBandeja.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVistaFiltroBandejaMantenimiento('solucionadas')}
                  style={{
                    backgroundColor: vistaFiltroBandejaMantenimiento === 'solucionadas' ? '#34d399' : '#1c1c1f',
                    color: vistaFiltroBandejaMantenimiento === 'solucionadas' ? '#09090b' : '#94a3b8',
                    border: `1px solid ${vistaFiltroBandejaMantenimiento === 'solucionadas' ? '#34d399' : '#262629'}`,
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🗄️ Historial Secundario: Solucionado ({tareasSolucionadasHistorial.length})
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {itemsBandejaVisibles.map(item => {
                const orden = item.rawOrden;
                const contratistaObj = orden ? personalList.find(p => p.id === orden.contratista_id) : null;
                const metaContratista = contratistaObj ? getMetaTrabajador(contratistaObj) : null;
                const arlVencida =
                  metaContratista?.planilla_arl_estado === 'Vencida - Bloquear Ingreso ⛔' ||
                  contratistaObj?.estado_arl === 'Pendiente Verificación ⚠️';
                const metaOrden = orden ? metaOrdenesMap[orden.id] : undefined;
                const isFinalizada = item.estadoNormalizado === 'Solucionado';

                return (
                  <div
                    key={`tab42-unif-${item.id}`}
                    style={{
                      backgroundColor: '#1c1c1f',
                      border: `1px solid ${
                        isFinalizada
                          ? 'rgba(52, 211, 153, 0.45)'
                          : arlVencida
                          ? 'rgba(239, 68, 68, 0.5)'
                          : item.origen === 'CHECKPOINT RONDA VIGILANTE'
                          ? 'rgba(251, 191, 36, 0.45)'
                          : '#262629'
                      }`,
                      borderRadius: '10px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold', color: '#22d3ee' }}>
                            {item.id}
                          </span>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '9px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor:
                                item.origen === 'CHECKPOINT RONDA VIGILANTE'
                                  ? 'rgba(251, 191, 36, 0.14)'
                                  : 'rgba(34, 211, 238, 0.12)',
                              color: item.origen === 'CHECKPOINT RONDA VIGILANTE' ? '#fbbf24' : '#22d3ee'
                            }}
                          >
                            {item.origen}
                          </span>
                        </div>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            backgroundColor: isFinalizada
                              ? 'rgba(52, 211, 153, 0.14)'
                              : item.estadoNormalizado === 'En Proceso'
                              ? 'rgba(251, 191, 36, 0.14)'
                              : 'rgba(34, 211, 238, 0.14)',
                            color: isFinalizada
                              ? '#34d399'
                              : item.estadoNormalizado === 'En Proceso'
                              ? '#fbbf24'
                              : '#22d3ee'
                          }}
                        >
                          {item.estadoNormalizado.toUpperCase()}
                        </span>
                      </div>

                      <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#ffffff' }}>
                        {item.descripcion}
                      </h4>

                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>👷 <strong>Responsable / Reportante:</strong> {item.responsable}</div>
                        <div>📍 <strong>Zona / Checkpoint:</strong> {item.zona} ({item.codigoNfcQr})</div>
                        {item.costoEstimado > 0 && (
                          <div>💰 <strong>Valor Orden / Factura:</strong> <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{formatCOP(item.costoEstimado)}</span></div>
                        )}
                        {orden && (
                          <div>
                            🛡️ <strong>Estado ARL / PILA:</strong>{' '}
                            <span style={{ color: arlVencida ? '#ef4444' : '#34d399', fontWeight: 'bold' }}>
                              {arlVencida ? '⛔ Vencida - Bloquear Ingreso' : '✅ Vigente y Verificada'}
                            </span>
                          </div>
                        )}
                      </div>

                      {arlVencida && (
                        <div
                          style={{
                            marginTop: '10px',
                            backgroundColor: 'rgba(239, 68, 68, 0.14)',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            color: '#ef4444',
                            fontWeight: 'bold'
                          }}
                        >
                          ⛔ ALERTA ROJA LEGAL (SG-SST): Prohibido autorizar ingreso mientras la planilla PILA/ARL del contratista se encuentre vencida.
                        </div>
                      )}

                      {metaOrden?.acta_recibida_satisfaccion && (
                        <div
                          style={{
                            marginTop: '10px',
                            backgroundColor: 'rgba(52, 211, 153, 0.1)',
                            border: '1px solid rgba(52, 211, 153, 0.35)',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            color: '#34d399'
                          }}
                        >
                          ✓ <strong>Acta Técnica Firmada ({metaOrden.fecha_firma_acta}):</strong> {metaOrden.observaciones_tecnicas}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {item.estadoNormalizado === 'Pendiente' && (
                          <button
                            type="button"
                            onClick={() => handleCambiarEstadoItemUnificado(item, 'En Proceso')}
                            style={{
                              flex: 1,
                              backgroundColor: '#fbbf24',
                              color: '#09090b',
                              border: 'none',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              fontWeight: '900',
                              cursor: 'pointer'
                            }}
                          >
                            🔧 Pasar a En Proceso
                          </button>
                        )}
                        {item.estadoNormalizado !== 'Solucionado' ? (
                          <button
                            type="button"
                            onClick={() => handleCambiarEstadoItemUnificado(item, 'Solucionado')}
                            style={{
                              flex: 1,
                              backgroundColor: '#34d399',
                              color: '#09090b',
                              border: 'none',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              fontWeight: '900',
                              cursor: 'pointer'
                            }}
                          >
                            ✅ Marcar Solucionado
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCambiarEstadoItemUnificado(item, 'En Proceso')}
                            style={{
                              flex: 1,
                              backgroundColor: '#141416',
                              color: '#fbbf24',
                              border: '1px solid #fbbf24',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              fontFamily: 'monospace',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            ↩ Reabrir a En Proceso
                          </button>
                        )}
                      </div>

                      {orden && (
                        <button
                          type="button"
                          onClick={() => handleAbrirModalInspeccionObra(orden)}
                          style={{
                            width: '100%',
                            backgroundColor: '#141416',
                            color: '#22d3ee',
                            border: '1px solid #22d3ee',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          🔍 Expediente Técnico de Obra y ARL
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================================
              3.5 MONITOREO EN TIEMPO REAL: CONTRATISTAS ACTIVOS EN OBRA EN APARTAMENTOS (CONTROL DE PORTERÍA & HERRAMIENTAS)
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '18px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  [ 4.2.B MONITOREO DE CONTRATISTAS EN OBRA ADENTRO DEL EDIFICIO • REPORTADOS POR PORTERÍA ]
                </span>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '17px', color: '#ffffff' }}>
                  Contratistas Activos en Obras Privadas en Apartamentos e Inventario de Herramientas
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Supervisión directa de personal externo ejecutando remodelaciones en apartamentos, validación de ARL en puerta y custodia del inventario de herramientas registrado.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #262629',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>En Obra Adentro:</span>{' '}
                  <strong style={{ color: '#34d399' }}>
                    {registrosContratistasPuerta.filter(r => r.estado_en_copropiedad === '🟢 En Obra Adentro').length} Contratistas
                  </strong>
                </div>

                <div
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #262629',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>Total Herramientas:</span>{' '}
                  <strong style={{ color: '#22d3ee' }}>
                    {registrosContratistasPuerta.reduce((acc, curr) => acc + curr.herramientas_ingreso.length, 0)} Ítems
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
              {registrosContratistasPuerta.map(contratista => {
                const isAdentro = contratista.estado_en_copropiedad === '🟢 En Obra Adentro';

                return (
                  <div
                    key={contratista.id}
                    style={{
                      backgroundColor: '#1c1c1f',
                      borderTop: `1px solid ${isAdentro ? '#22d3ee' : '#262629'}`,
                      borderRight: `1px solid ${isAdentro ? '#22d3ee' : '#262629'}`,
                      borderBottom: `1px solid ${isAdentro ? '#22d3ee' : '#262629'}`,
                      borderLeft: `4px solid ${isAdentro ? '#34d399' : '#64748b'}`,
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      fontFamily: 'monospace'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {contratista.id} • NIT {contratista.cedula_nit}
                          </span>
                          <h4 style={{ margin: '4px 0', fontSize: '14px', color: '#ffffff' }}>
                            {contratista.nombre_contratista_empresa}
                          </h4>
                        </div>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            backgroundColor: isAdentro ? 'rgba(52, 211, 153, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                            color: isAdentro ? '#34d399' : '#94a3b8',
                            fontWeight: 'bold',
                            border: `1px solid ${isAdentro ? '#34d399' : '#3f3f46'}`
                          }}
                        >
                          {contratista.estado_en_copropiedad}
                        </span>
                      </div>

                      <div style={{ backgroundColor: '#141416', padding: '10px', borderRadius: '6px', border: '1px solid #262629', margin: '10px 0' }}>
                        <div style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold' }}>
                          🏢 Unidad Destino: {contratista.numero_unidad_destino} ({contratista.propietario_destino})
                        </div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
                          Labor: {contratista.tipo_obra_reparacion}
                        </div>
                        <div style={{ fontSize: '10px', color: '#34d399', marginTop: '4px' }}>
                          ✓ ARL Verificada: {contratista.entidad_arl_planilla}
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#fbbf24', marginBottom: '8px' }}>
                        🧰 Inventario declarado en portería: <strong>{contratista.herramientas_ingreso.length} herramientas</strong>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                          {contratista.herramientas_ingreso.slice(0, 3).join(', ')}
                          {contratista.herramientas_ingreso.length > 3 ? ` y ${contratista.herramientas_ingreso.length - 3} más...` : ''}
                        </div>
                      </div>

                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        Ingreso: {contratista.hora_ingreso} • Guarda: {contratista.guarda_responsable}
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setModalHerramientasSupervisor(contratista)}
                        style={{
                          flex: 1,
                          backgroundColor: '#141416',
                          color: '#22d3ee',
                          border: '1px solid #22d3ee',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        🔍 Auditar Inventario de Herramientas
                      </button>

                      {isAdentro && (
                        <button
                          type="button"
                          onClick={() => {
                            appendAuditLog(
                              'SUPERVISOR_FIELD_INSPECTION_CONTRACTOR',
                              `Supervisor inspeccionó obra de ${contratista.nombre_contratista_empresa} en ${contratista.numero_unidad_destino}. Protocolo SG-SST verificado en terreno.`,
                              'Supervisor Operativo'
                            );
                            setFeedbackSupervisor({
                              tipo: 'success',
                              mensaje: `✅ Inspección registrada: Obra de ${contratista.nombre_contratista_empresa} en ${contratista.numero_unidad_destino} cumple con protocolos técnicos y SG-SST.`
                            });
                          }}
                          style={{
                            backgroundColor: 'rgba(52, 211, 153, 0.15)',
                            color: '#34d399',
                            border: '1px solid #34d399',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Validar en Terreno
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================================
              4. TABLA OPERATIVA DE CONTROL DE ASISTENCIA, RELEVOS Y ZONAS
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '18px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  [ 4.2.C TABLA OPERATIVA DE CONTROL DE ASISTENCIA, RELEVOS &amp; ZONAS EN TIEMPO REAL ]
                </span>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '17px', color: '#ffffff' }}>
                  4. Tabla Operativa de Control de Asistencia, Relevos y Zonas Asignadas
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Reubica operarios de puesto o turno ante contingencias, marca entradas/relevos y consulta el expediente individual de turno con registro de reemplazos por incapacidad.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {(['Todos', 'Vigilantes', 'Aseo', 'Contratistas'] as const).map(rolTab => (
                  <button
                    key={rolTab}
                    type="button"
                    onClick={() => setFiltroRolCuadrilla(rolTab)}
                    style={{
                      backgroundColor: filtroRolCuadrilla === rolTab ? '#22d3ee' : '#1c1c1f',
                      color: filtroRolCuadrilla === rolTab ? '#09090b' : '#cbd5e1',
                      border: `1px solid ${filtroRolCuadrilla === rolTab ? '#22d3ee' : '#262629'}`,
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {rolTab}
                  </button>
                ))}

                <input
                  type="text"
                  placeholder="🔍 Buscar operario, cédula, empresa o puesto..."
                  value={busquedaCuadrilla}
                  onChange={e => setBusquedaCuadrilla(e.target.value)}
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #262629',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    minWidth: '240px'
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '12px' }}>Trabajador / Empresa</th>
                    <th style={{ padding: '12px' }}>Rol</th>
                    <th style={{ padding: '12px' }}>Puesto / Zona Asignada (Reubicar)</th>
                    <th style={{ padding: '12px' }}>Turno Actual (Cambiar)</th>
                    <th style={{ padding: '12px' }}>Estado ARL / PILA</th>
                    <th style={{ padding: '12px' }}>Asistencia Hoy</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Acciones de Mando &amp; Expediente</th>
                  </tr>
                </thead>
                <tbody>
                  {cuadrillaFiltrada.map(trab => {
                    const meta = getMetaTrabajador(trab);
                    const arlVigente = meta.planilla_arl_estado === 'Vigente ✅';

                    return (
                      <tr key={trab.id} style={{ borderBottom: '1px solid #262629' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{trab.full_name}</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '2px' }}>
                            {meta.cedula_id} • {meta.empresa} • 📞 {trab.telefono_whatsapp}
                          </div>
                          {meta.reemplazo_incapacidad && (
                            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#fbbf24', marginTop: '3px' }}>
                              🔄 {meta.reemplazo_incapacidad}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              backgroundColor:
                                trab.role === 'vigilante'
                                  ? 'rgba(34, 211, 238, 0.12)'
                                  : trab.role === 'aseo'
                                  ? 'rgba(52, 211, 153, 0.12)'
                                  : 'rgba(251, 191, 36, 0.12)',
                              color:
                                trab.role === 'vigilante'
                                  ? '#22d3ee'
                                  : trab.role === 'aseo'
                                  ? '#34d399'
                                  : '#fbbf24',
                              border: `1px solid ${
                                trab.role === 'vigilante'
                                  ? 'rgba(34, 211, 238, 0.35)'
                                  : trab.role === 'aseo'
                                  ? 'rgba(52, 211, 153, 0.35)'
                                  : 'rgba(251, 191, 36, 0.35)'
                              }`
                            }}
                          >
                            {trab.role.toUpperCase()}
                          </span>
                        </td>

                        <td style={{ padding: '12px' }}>
                          <select
                            value={meta.puesto_zona}
                            onChange={e => handleCambiarPuestoTrabajador(trab, e.target.value as PuestoZonaOperativaPH)}
                            style={{
                              backgroundColor: '#1c1c1f',
                              border: '1px solid #262629',
                              color: '#ffffff',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Portería Principal">Portería Principal</option>
                            <option value="Rondero Perimetral">Rondero Perimetral</option>
                            <option value="Aseo Torres 1 y 2">Aseo Torres 1 y 2</option>
                            <option value="Zonas Verdes y Piscina">Zonas Verdes y Piscina</option>
                            <option value="Cuarto de Máquinas / Ascensores">Cuarto de Máquinas / Ascensores</option>
                          </select>
                        </td>

                        <td style={{ padding: '12px' }}>
                          <select
                            value={meta.turno_campo}
                            onChange={e => handleCambiarTurnoTrabajador(trab, e.target.value as TurnoCampoSupervisorPH)}
                            style={{
                              backgroundColor: '#1c1c1f',
                              border: '1px solid #262629',
                              color: '#cbd5e1',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Diurno 6am-2pm">Diurno 6am-2pm</option>
                            <option value="Tarde 2pm-10pm">Tarde 2pm-10pm</option>
                            <option value="Nocturno 10pm-6am">Nocturno 10pm-6am</option>
                            <option value="Turno 12h">Turno 12h</option>
                          </select>
                        </td>

                        <td style={{ padding: '12px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleEstadoArlTrabajador(trab)}
                            title="Click para actualizar verificación de Planilla PILA / ARL"
                            style={{
                              backgroundColor: arlVigente ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                              color: arlVigente ? '#34d399' : '#ef4444',
                              border: `1px solid ${arlVigente ? 'rgba(52, 211, 153, 0.35)' : '#ef4444'}`,
                              padding: '5px 8px',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {meta.planilla_arl_estado}
                          </button>
                        </td>

                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px' }}>
                          <span
                            style={{
                              color:
                                meta.asistencia_hoy === '🟢 En Puesto'
                                  ? '#34d399'
                                  : meta.asistencia_hoy === '🟡 En Almuerzo / Relevado'
                                  ? '#fbbf24'
                                  : '#ef4444',
                              fontWeight: 'bold'
                            }}
                          >
                            {meta.asistencia_hoy}
                          </span>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                            {meta.hora_entrada}
                          </div>
                        </td>

                        <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleMarcarEntradaRelevoTurno(trab)}
                              style={{
                                backgroundColor: '#34d399',
                                color: '#09090b',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                fontWeight: '900',
                                cursor: 'pointer'
                              }}
                            >
                              ✅ Marcar Entrada / Relevo de Turno
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setModalExpedienteTrabajador(trab);
                                setReemplazoNombreInput('');
                              }}
                              style={{
                                backgroundColor: '#1c1c1f',
                                color: '#22d3ee',
                                border: '1px solid rgba(34, 211, 238, 0.4)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              🔍 Ver Rutina y Puesto
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          SUB-MÓDULO 4.3 (100% ACTIVO): BITÁCORA DE RONDAS, EQUIPOS CRÍTICOS & CIERRE DE TURNO
      ============================================================================ */}
      {activeSubTab === 'tab4_3' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 1. TARJETAS KPI DE SALUD TÉCNICA E INFRAESTRUCTURA DE LA UNIDAD */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))',
              gap: '16px'
            }}
          >
            {/* KPI 1: RONDAS PERIMETRALES Y DE TORRES COMPLETADAS HOY */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                borderTop: '1px solid #262629',
                borderRight: '1px solid #262629',
                borderBottom: '1px solid #262629',
                borderLeft: '4px solid #34d399',
                borderRadius: '10px',
                padding: '18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                  1. RONDAS PERIMETRALES Y DE TORRES HOY
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(52, 211, 153, 0.14)',
                    color: '#34d399',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  NFC ACTIVO
                </span>
              </div>
              <div
                style={{
                  fontSize: '23px',
                  fontFamily: 'monospace',
                  fontWeight: '900',
                  color: '#34d399',
                  margin: '10px 0 6px 0'
                }}
              >
                {rondasVerificadasCount} / {metaRondasDiarias} Rondas Verificadas ✅
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                Perímetro, Sótanos, Cubiertas, CCTV y Zonas Sociales
              </div>
            </div>

            {/* KPI 2: ESTADO DE EQUIPOS CRÍTICOS (% OPERATIVIDAD) */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                borderTop: `1px solid ${equiposEnFallaCount > 0 ? '#ef4444' : '#262629'}`,
                borderRight: `1px solid ${equiposEnFallaCount > 0 ? '#ef4444' : '#262629'}`,
                borderBottom: `1px solid ${equiposEnFallaCount > 0 ? '#ef4444' : '#262629'}`,
                borderLeft: `4px solid ${equiposEnFallaCount > 0 ? '#ef4444' : '#22d3ee'}`,
                borderRadius: '10px',
                padding: '18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                  2. ESTADO DE EQUIPOS CRÍTICOS (5 PUNTOS)
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor:
                      equiposEnFallaCount > 0
                        ? 'rgba(239, 68, 68, 0.18)'
                        : 'rgba(34, 211, 238, 0.14)',
                    color: equiposEnFallaCount > 0 ? '#ef4444' : '#22d3ee',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  {equiposEnFallaCount > 0 ? `${equiposEnFallaCount} EN FALLA 🔴` : '100% EN LÍNEA'}
                </span>
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontFamily: 'monospace',
                  fontWeight: '900',
                  color: equiposEnFallaCount > 0 ? '#ef4444' : '#22d3ee',
                  margin: '10px 0 6px 0'
                }}
              >
                {porcentajeOperatividadEquipos}% Operatividad
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                Motobombas, Planta ACPM, Ascensores, RCI y Piscina
              </div>
            </div>

            {/* KPI 3: CONTROL NORMATIVO DE PISCINA Y ZONAS HÚMEDAS (LEY 1209) */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                borderTop: `1px solid ${cumpleLey1209Piscina ? '#262629' : '#ef4444'}`,
                borderRight: `1px solid ${cumpleLey1209Piscina ? '#262629' : '#ef4444'}`,
                borderBottom: `1px solid ${cumpleLey1209Piscina ? '#262629' : '#ef4444'}`,
                borderLeft: `4px solid ${cumpleLey1209Piscina ? '#34d399' : '#ef4444'}`,
                borderRadius: '10px',
                padding: '18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                  3. PISCINA Y ZONAS HÚMEDAS (LEY 1209)
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: cumpleLey1209Piscina
                      ? 'rgba(52, 211, 153, 0.15)'
                      : 'rgba(239, 68, 68, 0.18)',
                    color: cumpleLey1209Piscina ? '#34d399' : '#ef4444',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  {cumpleLey1209Piscina ? 'CUMPLE SANITARIO ✅' : 'FUERA DE NORMA ⛔'}
                </span>
              </div>
              <div
                style={{
                  fontSize: '21px',
                  fontFamily: 'monospace',
                  fontWeight: '900',
                  color: cumpleLey1209Piscina ? '#34d399' : '#ef4444',
                  margin: '10px 0 6px 0'
                }}
              >
                pH {medicionPiscina.ph_actual.toFixed(1)} | Cloro {medicionPiscina.cloro_residual_ppm.toFixed(1)} ppm
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                Ideal: pH 7.2-7.6 • Cloro 1.0-3.0 ppm • {medicionPiscina.temperatura_c} °C
              </div>
            </div>

            {/* KPI 4: INCIDENTES O NOVEDADES DE SEGURIDAD EN LAS ÚLTIMAS 24 HORAS */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                borderTop: '1px solid #262629',
                borderRight: '1px solid #262629',
                borderBottom: '1px solid #262629',
                borderLeft: `4px solid ${incidentesSeguridad24hCount > 2 ? '#ef4444' : '#fbbf24'}`,
                borderRadius: '10px',
                padding: '18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                  4. INCIDENTES / NOVEDADES (ÚLTIMAS 24H)
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(251, 191, 36, 0.14)',
                    color: '#fbbf24',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  MINUTA 24/7
                </span>
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontFamily: 'monospace',
                  fontWeight: '900',
                  color: incidentesSeguridad24hCount > 2 ? '#ef4444' : '#fbbf24',
                  margin: '10px 0 6px 0'
                }}
              >
                {incidentesSeguridad24hCount} Eventos en Minuta
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                {rondasBitacora.filter(r => r.escalado_tab3_4).length} escalados a Tab 3.4 (Multas Ley 675)
              </div>
            </div>
          </div>

          {/* MÓDULO DE CONFIGURACIÓN DE FRECUENCIAS DE ASEO Y ASIGNACIÓN DE ÓRDENES (SINCRONIZADO EN VIVO CON OPERARIO DE ASEO & SERVICIOS) */}
          <PanelSupervisorConfiguracionAseo
            checklistConfig={checklistConfig}
            setChecklistConfig={setChecklistConfig}
            tareasShared={tareasToderosRondasShared}
            setTareasShared={setTareasToderosRondasShared}
            onShowToast={(msg) => {
              onShowToast?.(msg);
              setFeedbackSupervisor({ tipo: 'success', mensaje: msg });
            }}
          />

          {/* ============================================================================
              1.B OPTIMIZACIÓN Y SINCRONIZACIÓN CON LA CONSOLA DEL GUARDA:
              - BANDEJA UNIFICADA DE ÓRDENES DE TRABAJO Y MANTENIMIENTO (FILTRADA A PENDIENTE Y EN PROCESO POR DEFECTO)
              - SECCIÓN DE LECTURA Y AUDITORÍA DE MINUTA DIGITAL INMUTABLE (RELEVOS Y SELLOS SHA-256)
              - HISTORIAL GERENCIAL DE PATRULLAJES GEORREFERENCIADOS
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #22d3ee',
              borderRadius: '12px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '22px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(34, 211, 238, 0.15)',
                      color: '#22d3ee',
                      border: '1px solid rgba(34, 211, 238, 0.4)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    [ PANEL DEL SUPERVISOR OPTIMIZADO • SIN CONTROLES OPERATIVOS DE GARITA ]
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(52, 211, 153, 0.14)',
                      color: '#34d399',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    ● AUDITORÍA SHA-256 VERIFIED &amp; BANDEJA FUSIONADA ACTIVA
                  </span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', margin: '8px 0 4px 0' }}>
                  📡 Centro de Mando del Supervisor: Bandeja Unificada de Mantenimiento y Auditoría de Minuta Digital
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  El registro de visitantes, aprobación de pases QR y casilleros de encomiendas operan exclusivamente en la garita del vigilante. Aquí el supervisor gestiona las órdenes activas derivadas de checkpoints y audita el libro de minuta inmutable.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontFamily: 'monospace', fontSize: '11px' }}>
                <div style={{ backgroundColor: '#1c1c1f', border: '1px solid #fbbf24', padding: '8px 12px', borderRadius: '8px' }}>
                  Órdenes Activas: <strong style={{ color: '#fbbf24' }}>{tareasActivasBandeja.length} (Pendiente / En Proceso)</strong>
                </div>
                <div style={{ backgroundColor: '#1c1c1f', border: '1px solid #262629', padding: '8px 12px', borderRadius: '8px' }}>
                  Historial Solucionadas: <strong style={{ color: '#34d399' }}>{tareasSolucionadasHistorial.length} archivadas</strong>
                </div>
                <div style={{ backgroundColor: '#1c1c1f', border: '1px solid #2dd4bf', padding: '8px 12px', borderRadius: '8px' }}>
                  Minuta Auditada: <strong style={{ color: '#2dd4bf' }}>{minutaShared.length} asientos SHA-256</strong>
                </div>
              </div>
            </div>

            {/* BLOQUE 1: BANDEJA UNIFICADA DE ÓRDENES DE TRABAJO Y MANTENIMIENTO (FUSIÓN AUTOMÁTICA DE CHECKPOINTS DE RONDAS) */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderTop: '3px solid #fbbf24',
                borderRadius: '10px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#fbbf24', fontWeight: 'bold' }}>
                    1. BANDEJA FUSIONADA Y AUTOMATIZADA DE NOVEDADES DE RONDAS Y MANTENIMIENTO
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', margin: '3px 0 2px 0' }}>
                    🛠️ Bandeja Unificada de Órdenes de Trabajo y Mantenimiento
                  </h3>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                    Visualizando por defecto únicamente tareas en estado <strong>Pendiente</strong> y <strong>En Proceso</strong>. Las tareas marcadas como <strong>Solucionado</strong> se envían al historial secundario para evitar saturación visual.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setVistaFiltroBandejaMantenimiento('activas')}
                    style={{
                      backgroundColor: vistaFiltroBandejaMantenimiento === 'activas' ? '#fbbf24' : '#141416',
                      color: vistaFiltroBandejaMantenimiento === 'activas' ? '#09090b' : '#cbd5e1',
                      border: `1px solid ${vistaFiltroBandejaMantenimiento === 'activas' ? '#fbbf24' : '#262629'}`,
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Vista por Defecto: Pendiente y En Proceso ({tareasActivasBandeja.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistaFiltroBandejaMantenimiento('solucionadas')}
                    style={{
                      backgroundColor: vistaFiltroBandejaMantenimiento === 'solucionadas' ? '#34d399' : '#141416',
                      color: vistaFiltroBandejaMantenimiento === 'solucionadas' ? '#09090b' : '#94a3b8',
                      border: `1px solid ${vistaFiltroBandejaMantenimiento === 'solucionadas' ? '#34d399' : '#262629'}`,
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🗄️ Historial Secundario: Solucionado ({tareasSolucionadasHistorial.length})
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '12px' }}>
                {itemsBandejaVisibles.length > 0 ? (
                  itemsBandejaVisibles.map((item) => {
                    const esSolucionado = item.estadoNormalizado === 'Solucionado';
                    const esEnProceso = item.estadoNormalizado === 'En Proceso';
                    const colorEstado = esSolucionado ? '#34d399' : esEnProceso ? '#fbbf24' : '#22d3ee';

                    return (
                      <div
                        key={`unif-${item.id}`}
                        style={{
                          backgroundColor: '#141416',
                          border: '1px solid #262629',
                          borderLeft: `4px solid ${colorEstado}`,
                          borderRadius: '8px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: '900', color: '#fbbf24' }}>
                                [{item.id}]
                              </span>
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: '9px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor:
                                    item.origen === 'CHECKPOINT RONDA VIGILANTE'
                                      ? 'rgba(251, 191, 36, 0.14)'
                                      : 'rgba(34, 211, 238, 0.12)',
                                  color: item.origen === 'CHECKPOINT RONDA VIGILANTE' ? '#fbbf24' : '#22d3ee',
                                  border: `1px solid ${
                                    item.origen === 'CHECKPOINT RONDA VIGILANTE'
                                      ? 'rgba(251, 191, 36, 0.35)'
                                      : 'rgba(34, 211, 238, 0.35)'
                                  }`
                                }}
                              >
                                {item.origen}
                              </span>
                              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' }}>
                                {item.codigoNfcQr}
                              </span>
                            </div>

                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                fontWeight: '900',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: esSolucionado
                                  ? 'rgba(52, 211, 153, 0.15)'
                                  : esEnProceso
                                  ? 'rgba(251, 191, 36, 0.15)'
                                  : 'rgba(34, 211, 238, 0.15)',
                                color: colorEstado
                              }}
                            >
                              {item.estadoNormalizado.toUpperCase()}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                            📍 {item.zona}
                          </div>
                          <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.4 }}>{item.descripcion}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px dashed #262629', paddingTop: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' }}>
                            👮 {item.responsable} • 🕒 {item.horaFecha}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {item.estadoNormalizado === 'Pendiente' && (
                              <button
                                type="button"
                                onClick={() => handleCambiarEstadoItemUnificado(item, 'En Proceso')}
                                style={{
                                  backgroundColor: '#fbbf24',
                                  color: '#09090b',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '10px',
                                  fontWeight: '900',
                                  cursor: 'pointer'
                                }}
                              >
                                🔧 Pasar a En Proceso
                              </button>
                            )}
                            {item.estadoNormalizado !== 'Solucionado' ? (
                              <button
                                type="button"
                                onClick={() => handleCambiarEstadoItemUnificado(item, 'Solucionado')}
                                style={{
                                  backgroundColor: '#34d399',
                                  color: '#09090b',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '10px',
                                  fontWeight: '900',
                                  cursor: 'pointer'
                                }}
                              >
                                ✅ Marcar Solucionado
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCambiarEstadoItemUnificado(item, 'En Proceso')}
                                style={{
                                  backgroundColor: '#1c1c1f',
                                  color: '#fbbf24',
                                  border: '1px solid #fbbf24',
                                  padding: '4px 9px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                ↩ Reabrir a En Proceso
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '18px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontFamily: 'monospace', gridColumn: '1 / -1' }}>
                    {vistaFiltroBandejaMantenimiento === 'activas'
                      ? '✅ No hay órdenes de trabajo ni hallazgos de rondas en estado Pendiente o En Proceso.'
                      : 'Sin tareas archivadas aún en el historial secundario de Solucionadas.'}
                  </div>
                )}
              </div>
            </div>

            {/* BLOQUE 2: AUDITORÍA EN TIEMPO REAL DEL LIBRO DE MINUTA DIGITAL INMUTABLE (MODO SOLO LECTURA) */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderTop: '3px solid #2dd4bf',
                borderRadius: '10px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#2dd4bf', fontWeight: 'bold' }}>
                      2. SECCIÓN DE LECTURA Y AUDITORÍA NORMATIVA DE MINUTA DIGITAL (TIEMPO REAL)
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        backgroundColor: 'rgba(45, 212, 191, 0.14)',
                        color: '#2dd4bf',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: '1px solid rgba(45, 212, 191, 0.35)',
                        fontWeight: 'bold'
                      }}
                    >
                      🔒 MODO SOLO LECTURA • LIBRO INMUTABLE DEL VIGILANTE
                    </span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', margin: '4px 0 2px 0' }}>
                    📖 Auditoría del Libro de Minuta Digital, Relevos de Turno y Sellos Criptográficos (SHA-256 Verified)
                  </h3>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                    Inspección supervisora en vivo de cada asiento registrado por el guarda en garita, verificando entregas de puesto (Relevos de Turno), novedades operativas y sellos inmutables de validación de seguridad.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {['Todas', 'Relevo de Turno', 'Incidente de Seguridad', 'Mantenimiento / Daño', 'Novedad General'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFiltroCategoriaMinutaAuditoria(cat)}
                      style={{
                        backgroundColor: filtroCategoriaMinutaAuditoria === cat ? '#2dd4bf' : '#141416',
                        color: filtroCategoriaMinutaAuditoria === cat ? '#09090b' : '#cbd5e1',
                        border: `1px solid ${filtroCategoriaMinutaAuditoria === cat ? '#2dd4bf' : '#262629'}`,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {cat === 'Relevo de Turno' ? '🔄 Relevos de Turno' : cat}
                    </button>
                  ))}

                  <input
                    type="text"
                    value={busquedaMinutaAuditoria}
                    onChange={(e) => setBusquedaMinutaAuditoria(e.target.value)}
                    placeholder="🔍 Filtrar por guarda o novedad..."
                    style={{
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      minWidth: '210px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                {minutaFiltradaAuditoria.length > 0 ? (
                  minutaFiltradaAuditoria.map((nota: any) => {
                    const esRelevo = nota.categoria === 'Relevo de Turno';
                    const esIncidente = nota.categoria === 'Incidente de Seguridad';
                    return (
                      <div
                        key={nota.id}
                        style={{
                          backgroundColor: '#141416',
                          border: '1px solid #262629',
                          borderLeft: `4px solid ${esIncidente ? '#ef4444' : esRelevo ? '#22d3ee' : '#2dd4bf'}`,
                          borderRadius: '8px',
                          padding: '12px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                fontWeight: '900',
                                color: '#2dd4bf',
                                backgroundColor: '#1c1c1f',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                border: '1px solid rgba(45, 212, 191, 0.3)'
                              }}
                            >
                              🕒 {nota.timestamp} {nota.fecha ? `• ${nota.fecha}` : ''}
                            </span>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                color: esIncidente ? '#fca5a5' : esRelevo ? '#22d3ee' : '#ffffff',
                                backgroundColor: esIncidente
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : esRelevo
                                  ? 'rgba(34, 211, 238, 0.15)'
                                  : '#27272a',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              {esRelevo ? '🔄 RELEVO DE TURNO VERIFICADO' : nota.categoria}
                            </span>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold' }}>
                              👮 {nota.guarda}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.45 }}>{nota.detalle}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              color: '#2dd4bf',
                              backgroundColor: '#09090b',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(45, 212, 191, 0.35)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            🛡️ {nota.firmaHash || 'SHA-256 Verified'}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#64748b' }}>
                            SELLO DE SEGURIDAD CONFORME
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
                    No se encontraron registros en el Libro de Minuta Digital para el filtro seleccionado.
                  </div>
                )}
              </div>
            </div>

            {/* BLOQUE 3: HISTORIAL GERENCIAL DE PATRULLAJES Y CHECKPOINTS GEORREFERENCIADOS (rondasShared) */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderTop: '3px solid #34d399',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#34d399', fontWeight: 'bold' }}>
                    3. HISTORIAL GERENCIAL DE PATRULLAJES Y TRAZABILIDAD DE CHECKPOINTS (GARITA)
                  </span>
                  <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', margin: '2px 0 0 0' }}>
                    🧭 Registro en Vivo de Checkpoints Verificados por los Guardas ({rondasShared.length})
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['Todas', 'Verificado Normal', 'Novedad Operativa / Mantenimiento', 'Alerta de Seguridad Crítica'].map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setFiltroSeveridadRondasGarita(sev)}
                      style={{
                        backgroundColor: filtroSeveridadRondasGarita === sev ? '#22d3ee' : '#141416',
                        color: filtroSeveridadRondasGarita === sev ? '#09090b' : '#cbd5e1',
                        border: `1px solid ${filtroSeveridadRondasGarita === sev ? '#22d3ee' : '#262629'}`,
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                {rondasShared
                  .filter((r: any) => filtroSeveridadRondasGarita === 'Todas' || r.estado === filtroSeveridadRondasGarita)
                  .map((r: any) => {
                    const esCrit = r.estado === 'Alerta de Seguridad Crítica';
                    const esNov = r.estado === 'Novedad Operativa / Mantenimiento';
                    const colorSem = esCrit ? '#ef4444' : esNov ? '#fbbf24' : '#34d399';
                    return (
                      <div
                        key={r.id}
                        style={{
                          backgroundColor: '#141416',
                          border: '1px solid #262629',
                          borderLeft: `4px solid ${colorSem}`,
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: '900', color: '#22d3ee' }}>
                              🕒 {r.timestamp}
                            </span>
                            {r.codigoNfcQr && (
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: '10px',
                                  color: '#22d3ee',
                                  backgroundColor: '#1c1c1f',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #262629'
                                }}
                              >
                                {r.codigoNfcQr}
                              </span>
                            )}
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: esCrit
                                  ? 'rgba(239, 68, 68, 0.16)'
                                  : esNov
                                  ? 'rgba(251, 191, 36, 0.14)'
                                  : 'rgba(52, 211, 153, 0.14)',
                                color: colorSem
                              }}
                            >
                              {r.estado}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff' }}>{r.punto}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{r.observacion}</div>
                          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '4px' }}>
                            👮 Validado por: <strong style={{ color: '#f8fafc' }}>{r.guarda || 'Guarda en Turno'}</strong> • Destino:{' '}
                            <span style={{ color: '#22d3ee' }}>{r.derivacionAutomatica || 'Historial Gerencial de Patrullajes'}</span>
                          </div>
                        </div>

                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            color: '#34d399',
                            backgroundColor: '#09090b',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(52, 211, 153, 0.3)'
                          }}
                        >
                          {r.firmaHash || 'SHA-256 Verified'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* MÓDULO SG-SST DECRETO 1072 • CONTROL DE CONTRATISTAS Y VISITAS TÉCNICAS (SINCRONIZADO CON PORTERÍA) */}
          <ModuloContratistasYVisitasTecnicas
            contratistasShared={contratistasShared}
            setContratistasShared={setContratistasShared}
            onShowToast={(msg) => {
              onShowToast?.(msg);
              setFeedbackSupervisor({ tipo: 'info', mensaje: msg });
            }}
          />

          {/* ============================================================================
              2. PANEL INTERACTIVO DE CHECKLISTS TÉCNICOS Y EQUIPOS CRÍTICOS (CON SEMÁFORO EN VIVO)
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '22px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '18px'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#22d3ee', fontWeight: 'bold' }}>
                  [ SECCIÓN 2 • TABLA supabase.equipos_criticos_ph &amp; SINCRONIZACIÓN CON ORDENES TAB 3.3 ]
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', margin: '4px 0 0 0' }}>
                  Checklists Técnicos de los 5 Puntos Vitales y Semáforo de Equipos Críticos
                </h2>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  backgroundColor: '#1c1c1f',
                  color: '#cbd5e1',
                  border: '1px solid #262629',
                  padding: '6px 12px',
                  borderRadius: '6px'
                }}
              >
                Equipos Operativos: <strong style={{ color: '#34d399' }}>{equiposOperativosCount}/5</strong> • En Falla:{' '}
                <strong style={{ color: '#ef4444' }}>{equiposEnFallaCount}</strong>
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
                gap: '16px'
              }}
            >
              {equiposCriticos.map(equipo => {
                const esFalla = equipo.estado === '🔴 En Falla / Urgente';
                const esAlerta = equipo.estado === '🟡 Alerta Preventiva';
                const colorEstado = esFalla ? '#ef4444' : esAlerta ? '#fbbf24' : '#34d399';

                return (
                  <div
                    key={equipo.id}
                    style={{
                      backgroundColor: '#1c1c1f',
                      border: `1px solid ${esFalla ? '#ef4444' : '#262629'}`,
                      borderTop: `4px solid ${colorEstado}`,
                      borderRadius: '10px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px'
                    }}
                  >
                    <div>
                      {/* Cabecera de la tarjeta del equipo crítico */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '10px',
                          marginBottom: '10px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                color: '#22d3ee',
                                fontWeight: '900'
                              }}
                            >
                              {equipo.letra_punto} [{equipo.codigo_tag}]
                            </span>
                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8' }}>
                              • Últ. Inspección: {equipo.ultima_inspeccion}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', margin: '4px 0 2px 0' }}>
                            {equipo.nombre_punto}
                          </h3>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                            📍 {equipo.ubicacion_tecnica}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            fontWeight: '900',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap',
                            backgroundColor: esFalla
                              ? 'rgba(239, 68, 68, 0.16)'
                              : esAlerta
                              ? 'rgba(251, 191, 36, 0.15)'
                              : 'rgba(52, 211, 153, 0.14)',
                            color: colorEstado,
                            border: `1px solid ${colorEstado}`
                          }}
                        >
                          {equipo.estado}
                        </span>
                      </div>

                      {/* Métricas telemetría / parámetros técnicos en monospace */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px',
                          marginBottom: '12px'
                        }}
                      >
                        {equipo.metricas_clave.map((met, idx) => (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: '#141416',
                              border: `1px solid ${met.alerta ? '#ef4444' : '#262629'}`,
                              borderRadius: '6px',
                              padding: '8px 10px',
                              fontFamily: 'monospace'
                            }}
                          >
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{met.label}</div>
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: '900',
                                color: met.alerta ? '#ef4444' : '#f8fafc',
                                marginTop: '3px'
                              }}
                            >
                              {met.valor}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Formulario rápido exclusivo en Punto c): Piscina, Jacuzzi y Turco (Ley 1209) */}
                      {equipo.id === 'EQ-PISCINA' && (
                        <form
                          onSubmit={handleRegistrarMedicionPiscinaLey1209}
                          style={{
                            backgroundColor: '#141416',
                            border: '1px solid rgba(34, 211, 238, 0.35)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '12px',
                            fontFamily: 'monospace'
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#22d3ee',
                              fontWeight: 'bold',
                              marginBottom: '8px',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span>🧪 REGISTRO RÁPIDO DIARIO DE PARÁMETROS LEY 1209 (PISCINA / JACUZZI / TURCO)</span>
                            <span style={{ color: '#94a3b8' }}>{medicionPiscina.ultima_medicion_hora}</span>
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                              gap: '8px',
                              alignItems: 'end'
                            }}
                          >
                            <div>
                              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                                NIVEL pH (7.2-7.6)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={inputPhPiscina}
                                onChange={e => setInputPhPiscina(e.target.value)}
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  backgroundColor: '#1c1c1f',
                                  border: '1px solid #262629',
                                  color: '#34d399',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                                CLORO (1.0-3.0 ppm)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={inputCloroPiscina}
                                onChange={e => setInputCloroPiscina(e.target.value)}
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  backgroundColor: '#1c1c1f',
                                  border: '1px solid #262629',
                                  color: '#22d3ee',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                                TEMP (°C)
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                value={inputTempPiscina}
                                onChange={e => setInputTempPiscina(e.target.value)}
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  backgroundColor: '#1c1c1f',
                                  border: '1px solid #262629',
                                  color: '#ffffff',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '12px'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                                CLARIDAD DEL AGUA
                              </label>
                              <select
                                value={inputClaridadPiscina}
                                onChange={e =>
                                  setInputClaridadPiscina(
                                    e.target.value as MedicionPiscinaLey1209['claridad_agua']
                                  )
                                }
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  backgroundColor: '#1c1c1f',
                                  border: '1px solid #262629',
                                  color: '#ffffff',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '11px'
                                }}
                              >
                                <option value="Cristalina / Óptima ✅">Cristalina / Óptima ✅</option>
                                <option value="Turbiedad Leve - Filtrado ⚠️">Turbiedad Leve - Filtrado ⚠️</option>
                                <option value="No Apta - Clausura Preventiva ⛔">No Apta - Clausura Preventiva ⛔</option>
                              </select>
                            </div>
                            <button
                              type="submit"
                              style={{
                                backgroundColor: '#22d3ee',
                                color: '#09090b',
                                border: 'none',
                                padding: '7px 12px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                fontWeight: '900',
                                cursor: 'pointer'
                              }}
                            >
                              💧 Guardar Medición
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Lista de ítems de Checklist Técnico del Equipo */}
                      <div
                        style={{
                          backgroundColor: '#141416',
                          border: '1px solid #262629',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'bold' }}>
                          CHECKLIST DE VERIFICACIÓN EN CAMPO:
                        </div>
                        {equipo.items_checklist.map(item => (
                          <label
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '11px',
                              color: item.verificado ? '#e2e8f0' : '#94a3b8',
                              cursor: 'pointer',
                              fontFamily: 'monospace'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={item.verificado}
                              onChange={() => handleToggleChecklistEquipo(equipo.id, item.id)}
                            />
                            <span>{item.texto}</span>
                          </label>
                        ))}
                      </div>

                      {/* Alerta activa si ya se reportó falla crítica al Administrador */}
                      {equipo.falla_reportada_admin && (
                        <div
                          style={{
                            marginTop: '10px',
                            backgroundColor: 'rgba(239, 68, 68, 0.14)',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            padding: '10px 12px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: '#fecaca'
                          }}
                        >
                          🚨 <strong>FALLA ACTIVA ESCALADA AL ADMIN ({equipo.orden_emergencia_id || 'URGENTE'}):</strong>{' '}
                          {equipo.falla_reportada_admin}
                        </div>
                      )}
                    </div>

                    {/* Zona inferior: Diagnóstico de falla + Botón "🚨 Reportar Falla Crítica al Administrador" */}
                    <div
                      style={{
                        borderTop: '1px solid #262629',
                        paddingTop: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <input
                        type="text"
                        value={fallaInputMap[equipo.id] ?? equipo.sugerencia_falla}
                        onChange={e =>
                          setFallaInputMap(prev => ({
                            ...prev,
                            [equipo.id]: e.target.value
                          }))
                        }
                        placeholder="Describe el daño crítico detectado para escalar al Administrador..."
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: '#141416',
                          border: '1px solid #262629',
                          color: '#f8fafc',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '11px'
                        }}
                      />

                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setModalFichaTecnicaEquipo(equipo)}
                          style={{
                            width: '100%',
                            backgroundColor: '#141416',
                            color: '#22d3ee',
                            border: '1px solid #22d3ee',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: '900',
                            cursor: 'pointer'
                          }}
                        >
                          🔍 Ver Ficha Técnica e Historial de Lecturas
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReportarFallaCriticaEquipo(equipo)}
                          style={{
                            flex: 1,
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: '900',
                            cursor: 'pointer'
                          }}
                        >
                          🚨 Reportar Falla Crítica al Administrador
                        </button>

                        {esFalla && (
                          <button
                            type="button"
                            onClick={() => handleRestablecerEquipoOperativo(equipo)}
                            style={{
                              backgroundColor: '#141416',
                              color: '#34d399',
                              border: '1px solid #34d399',
                              padding: '9px 12px',
                              borderRadius: '6px',
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            🔧 Restablecer a 🟢 Operativo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================================
              2.B SUB-PANEL: ⚡ LECTURA DE MEDIDORES DE ZONAS COMUNES (AGUA Y ENERGÍA EPM)
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '22px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(251, 191, 36, 0.14)',
                    color: '#fbbf24',
                    border: '1px solid rgba(251, 191, 36, 0.4)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  [ 4.3.B CONTROL PREVENTIVO DE SERVICIOS PÚBLICOS • DETECCIÓN TEMPRANA DE FUGAS INTERNAS ]
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', margin: '8px 0 4px 0' }}>
                  ⚡ Lectura de Medidores de Zonas Comunes (Agua y Energía EPM)
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Registra la lectura semanal de macromedidores (<code>m³</code> de agua y <code>kWh</code> de energía) para detectar fugas ocultas en tanques, piscina o sobretensiones antes de que llegue la factura costosa al <strong>Tab 3.2 del Administrador</strong>.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontFamily: 'monospace',
                  fontSize: '11px'
                }}
              >
                Umbral Preventivo Semanal: <strong style={{ color: '#22d3ee' }}>Máx. 52 m³ Agua</strong> •{' '}
                <strong style={{ color: '#fbbf24' }}>Máx. 780 kWh Energía</strong>
              </div>
            </div>

            <form
              onSubmit={handleRegistrarLecturaMedidoresEpm}
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '18px'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '12px',
                  alignItems: 'end'
                }}
              >
                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    LECTURA ACTUAL AGUA EPM (m³) — ANT: {lecturasMedidoresEpm[0]?.agua_lectura_actual_m3 || 4862} m³
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={inputLecturaAguaActual}
                    onChange={e => setInputLecturaAguaActual(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #22d3ee',
                      color: '#22d3ee',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      fontWeight: 'bold'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    LECTURA ACTUAL ENERGÍA EPM (kWh) — ANT: {lecturasMedidoresEpm[0]?.energia_lectura_actual_kwh || 19140} kWh
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={inputLecturaEnergiaActual}
                    onChange={e => setInputLecturaEnergiaActual(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #fbbf24',
                      color: '#fbbf24',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      fontWeight: 'bold'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    OBSERVACIÓN TÉCNICA DEL AFORO / REVISIÓN DE FLOTADORES
                  </label>
                  <input
                    type="text"
                    value={inputObsMedidorEpm}
                    onChange={e => setInputObsMedidorEpm(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#fbbf24',
                    color: '#09090b',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Registrar Lectura Semanal de Medidores EPM y Evaluar Fugas
                </button>
              </div>
            </form>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', fontFamily: 'monospace' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontSize: '11px' }}>
                    <th style={{ padding: '10px 12px' }}>ID / Semana Corte</th>
                    <th style={{ padding: '10px 12px' }}>Lectura Agua (Ant → Act)</th>
                    <th style={{ padding: '10px 12px' }}>Consumo Agua (m³)</th>
                    <th style={{ padding: '10px 12px' }}>Lectura Energía (Ant → Act)</th>
                    <th style={{ padding: '10px 12px' }}>Consumo Energía (kWh)</th>
                    <th style={{ padding: '10px 12px' }}>Diagnóstico / Alerta Fugas</th>
                    <th style={{ padding: '10px 12px' }}>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturasMedidoresEpm.map(lec => {
                    const esAlerta = lec.estado_alerta.includes('⚠️');
                    return (
                      <tr key={lec.id} style={{ borderBottom: '1px solid #262629' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ color: '#22d3ee', fontWeight: 'bold' }}>{lec.id}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>{lec.semana}</div>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                          {lec.agua_lectura_anterior_m3} m³ → <strong style={{ color: '#ffffff' }}>{lec.agua_lectura_actual_m3} m³</strong>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: '900', color: lec.agua_consumo_m3 > 52 ? '#ef4444' : '#22d3ee' }}>
                          +{lec.agua_consumo_m3} m³
                        </td>
                        <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                          {lec.energia_lectura_anterior_kwh} kWh → <strong style={{ color: '#ffffff' }}>{lec.energia_lectura_actual_kwh} kWh</strong>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: '900', color: lec.energia_consumo_kwh > 780 ? '#ef4444' : '#fbbf24' }}>
                          +{lec.energia_consumo_kwh} kWh
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              backgroundColor: esAlerta ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.12)',
                              color: esAlerta ? '#ef4444' : '#34d399',
                              border: `1px solid ${esAlerta ? '#ef4444' : 'rgba(52, 211, 153, 0.35)'}`
                            }}
                          >
                            {lec.estado_alerta}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: '#cbd5e1', maxWidth: '280px' }}>
                          {lec.observacion}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================================
              3. BITÁCORA DIGITAL DE RONDAS Y MINUTA DE NOVEDADES EN TERRENO
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '22px'
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#34d399', fontWeight: 'bold' }}>
                [ SECCIÓN 3 • TABLAS supabase.rondas_ph &amp; supabase.minuta_digital_ph • CONECTADA AL TAB 3.4 DEL ADMIN ]
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', margin: '4px 0 0 0' }}>
                🔦 Registrar Ronda / Novedad en Bitácora y Línea de Tiempo (Timeline) del Turno
              </h2>
            </div>

            {/* Formulario "🔦 Registrar Ronda / Novedad en Bitácora" */}
            <form
              onSubmit={handleRegistrarRondaBitacora}
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '10px',
                padding: '18px',
                marginBottom: '20px'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  marginBottom: '12px'
                }}
              >
                <div>
                  <label style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    PUNTO DE CONTROL VERIFICADO *
                  </label>
                  <select
                    value={rondaPuntoControl}
                    onChange={e => setRondaPuntoControl(e.target.value as PuntoControlRondaPH)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #22d3ee',
                      color: '#22d3ee',
                      padding: '10px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    <option value="Perímetro y Cerramiento">Perímetro y Cerramiento</option>
                    <option value="Sótanos y Parqueaderos">Sótanos y Parqueaderos</option>
                    <option value="Terrazas y Cubiertas">Terrazas y Cubiertas</option>
                    <option value="Portería y CCTV">Portería y CCTV</option>
                    <option value="Zonas Sociales">Zonas Sociales</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    ESTADO DE LA RONDA / HALLAZGO *
                  </label>
                  <select
                    value={rondaEstado}
                    onChange={e => setRondaEstado(e.target.value as EstadoRondaBitacoraPH)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: `1px solid ${
                        rondaEstado === '🔴 Incidente de Seguridad / Convivencia'
                          ? '#ef4444'
                          : rondaEstado === '🟡 Hallazgo Menor / Mantenimiento'
                          ? '#fbbf24'
                          : '#34d399'
                      }`,
                      color:
                        rondaEstado === '🔴 Incidente de Seguridad / Convivencia'
                          ? '#ef4444'
                          : rondaEstado === '🟡 Hallazgo Menor / Mantenimiento'
                          ? '#fbbf24'
                          : '#34d399',
                      padding: '10px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    <option value="🟢 Sin Novedad">🟢 Sin Novedad</option>
                    <option value="🟡 Hallazgo Menor / Mantenimiento">🟡 Hallazgo Menor / Mantenimiento</option>
                    <option value="🔴 Incidente de Seguridad / Convivencia">🔴 Incidente de Seguridad / Convivencia</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    GUARDA / RESPONSABLE EN TERRENO
                  </label>
                  <select
                    value={rondaResponsable}
                    onChange={e => setRondaResponsable(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#141416',
                      border: '1px solid #262629',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '12px'
                    }}
                  >
                    <option value="Wilmar Andrés Tapias (Rondero Perimetral)">
                      Wilmar Andrés Tapias (Rondero Perimetral)
                    </option>
                    <option value="Luis Fernando Pérez (Portería Principal)">
                      Luis Fernando Pérez (Portería Principal)
                    </option>
                    <option value="Supervisor Operativo en Terreno">
                      Supervisor Operativo en Terreno
                    </option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  OBSERVACIÓN DETALLADA DE LA RONDA O MINUTA *
                </label>
                <input
                  type="text"
                  value={rondaObservacion}
                  onChange={e => setRondaObservacion(e.target.value)}
                  placeholder="Ej. Fiesta ruidosa en Apto 402 a la 01:00 AM con exceso de decibeles / Vehículo mal parqueado en bahía común..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#141416',
                    border: '1px solid #262629',
                    color: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                />
              </div>

              {/* Panel Condicional: Si el hallazgo es un "🔴 Incidente de Seguridad / Convivencia" */}
              {rondaEstado === '🔴 Incidente de Seguridad / Convivencia' && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.09)',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '14px',
                    fontFamily: 'monospace'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '900', marginBottom: '10px' }}>
                    ⚖️ PROTOCOLO DE ESCALAMIENTO POR CONVIVENCIA (CONEXIÓN DIRECTA CON TAB 3.4 DEL ADMINISTRADOR):
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '12px',
                      marginBottom: '10px'
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '10px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                        UNIDAD RESIDENCIAL INVOLUCRADA
                      </label>
                      <select
                        value={rondaUnidadInfractoraId}
                        onChange={e => setRondaUnidadInfractoraId(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: '#141416',
                          border: '1px solid #262629',
                          color: '#ffffff',
                          padding: '8px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '11px'
                        }}
                      >
                        {unidades.map(u => (
                          <option key={u.id} value={String(u.id)}>
                            {u.numero_unidad} — {u.propietario}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                        CAUSAL / TIPO DE FALTA LEY 675 (ART. 59)
                      </label>
                      <select
                        value={rondaTipoFalta}
                        onChange={e => setRondaTipoFalta(e.target.value as TipoFaltaConvivencia)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: '#141416',
                          border: '1px solid #262629',
                          color: '#fbbf24',
                          padding: '8px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      >
                        <option value="Ruido excesivo fuera de horario">Ruido excesivo fuera de horario</option>
                        <option value="Mal uso de parqueaderos de visitantes">
                          Mal uso de parqueaderos de visitantes
                        </option>
                        <option value="Mascotas sin traílla en zonas comunes">
                          Mascotas sin traílla en zonas comunes
                        </option>
                        <option value="Afectación a fachada / obras no autorizadas">
                          Afectación a fachada / obras no autorizadas
                        </option>
                      </select>
                    </div>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      backgroundColor: '#141416',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(251, 191, 36, 0.45)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={rondaEscalarTab34}
                      onChange={e => setRondaEscalarTab34(e.target.checked)}
                    />
                    <span>
                      ⚖️ Escalar evidencia al Tab 3.4 del Administrador para Multa/Llamado de Atención
                    </span>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                  * Registra sello de tiempo, Tag NFC del punto de control y sincroniza con <code>minuta_digital_ph</code>.
                </span>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#34d399',
                    color: '#09090b',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  🔦 Registrar Ronda / Novedad en Bitácora
                </button>
              </div>
            </form>

            {/* Desglose de Puntos de Control QR / NFC Verificados con Hora Exacta */}
            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '18px',
                fontFamily: 'monospace'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold' }}>
                  📲 DESGLOSE DE PUNTOS DE CONTROL QR / NFC VERIFICADOS EN TERRENO (HORA EXACTA):
                </span>
                <span style={{ fontSize: '10px', color: '#34d399' }}>
                  ✓ {rondasBitacora.length} Tags QR/NFC autenticados hoy sin saltos de ruta
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
                  gap: '8px'
                }}
              >
                {rondasBitacora.slice(0, 5).map(rn => (
                  <div
                    key={`qr-${rn.id}`}
                    style={{
                      backgroundColor: '#141416',
                      borderTop: '1px solid #262629',
                      borderRight: '1px solid #262629',
                      borderBottom: '1px solid #262629',
                      borderLeft: `3px solid ${
                        rn.estado.includes('🔴') ? '#ef4444' : rn.estado.includes('🟡') ? '#fbbf24' : '#34d399'
                      }`,
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22d3ee', fontWeight: 'bold' }}>
                      <span>▣ {rn.tag_nfc_verificado}</span>
                      <span style={{ color: '#ffffff' }}>{rn.hora_exacta}</span>
                    </div>
                    <div style={{ color: '#cbd5e1', marginTop: '3px', fontWeight: 'bold' }}>{rn.punto_control}</div>
                    <div style={{ color: '#94a3b8', marginTop: '2px' }}>{rn.estado}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Línea de Tiempo (Timeline) de todas las rondas y novedades registradas en el día */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '12px'
              }}
            >
              <div style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 'bold', color: '#ffffff' }}>
                ⏱️ LÍNEA DE TIEMPO (TIMELINE) DE RONDAS Y MINUTA DEL DÍA ({rondasTimelineFiltradas.length})
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(
                  [
                    'Todas',
                    '🟢 Sin Novedad',
                    '🟡 Hallazgo Menor / Mantenimiento',
                    '🔴 Incidente de Seguridad / Convivencia'
                  ] as const
                ).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFiltroRondasTimeline(f)}
                    style={{
                      backgroundColor: filtroRondasTimeline === f ? '#22d3ee' : '#1c1c1f',
                      color: filtroRondasTimeline === f ? '#09090b' : '#cbd5e1',
                      border: `1px solid ${filtroRondasTimeline === f ? '#22d3ee' : '#262629'}`,
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rondasTimelineFiltradas.map(ronda => {
                const esIncidente = ronda.estado === '🔴 Incidente de Seguridad / Convivencia';
                const esHallazgo = ronda.estado === '🟡 Hallazgo Menor / Mantenimiento';
                const colorBorde = esIncidente ? '#ef4444' : esHallazgo ? '#fbbf24' : '#34d399';

                return (
                  <div
                    key={ronda.id}
                    style={{
                      backgroundColor: '#1c1c1f',
                      borderTop: '1px solid #262629',
                      borderRight: '1px solid #262629',
                      borderBottom: '1px solid #262629',
                      borderLeft: `4px solid ${colorBorde}`,
                      borderRadius: '8px',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            fontWeight: '900',
                            color: '#22d3ee',
                            backgroundColor: '#141416',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid #262629'
                          }}
                        >
                          🕒 {ronda.hora_exacta}
                        </span>
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: '900', color: '#ffffff' }}>
                          [{ronda.id}] {ronda.punto_control}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: esIncidente
                              ? 'rgba(239, 68, 68, 0.16)'
                              : esHallazgo
                              ? 'rgba(251, 191, 36, 0.14)'
                              : 'rgba(52, 211, 153, 0.14)',
                            color: colorBorde
                          }}
                        >
                          {ronda.estado}
                        </span>
                        {ronda.escalado_tab3_4 && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              fontWeight: '900',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(251, 191, 36, 0.18)',
                              color: '#fbbf24',
                              border: '1px solid rgba(251, 191, 36, 0.4)'
                            }}
                          >
                            ⚖️ Escalado a Tab 3.4 ({ronda.acta_sancion_generada} • {ronda.unidad_involucrada})
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '4px' }}>
                        {ronda.observacion_detallada}
                      </div>

                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                        👮 Responsable: <strong style={{ color: '#cbd5e1' }}>{ronda.responsable_ronda}</strong> • Checkpoint QR/NFC:{' '}
                        <span style={{ color: '#22d3ee' }}>{ronda.tag_nfc_verificado}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleEscalarRondaAOrdenTrabajoTab42(ronda)}
                        style={{
                          backgroundColor: '#141416',
                          color: '#fbbf24',
                          border: '1px solid rgba(251, 191, 36, 0.45)',
                          padding: '7px 11px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🛠️ Escalar Daño a Orden Tab 4.2
                      </button>

                      {!ronda.escalado_tab3_4 && (
                        <button
                          type="button"
                          onClick={() => handleEscalarRondaDirectoTab34(ronda)}
                          style={{
                            backgroundColor: '#141416',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.45)',
                            padding: '7px 11px',
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          ⚖️ Escalar Convivencia Tab 3.4
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setModalDetalleRonda(ronda)}
                        style={{
                          backgroundColor: '#141416',
                          color: '#22d3ee',
                          border: '1px solid #22d3ee',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🔍 Ver Detalle QR / NFC
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================================
              4. GENERADOR DE ACTA OFICIAL DE ENTREGA Y CIERRE DE TURNO
          ============================================================================ */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #fbbf24',
              borderRadius: '12px',
              padding: '22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#fbbf24', fontWeight: 'bold' }}>
                [ SECCIÓN 4 • CONSOLIDADO OFICIAL DE JORNADA • TABS 4.1 + 4.2 + 4.3 ]
              </span>
              <h2 style={{ fontSize: '19px', fontWeight: '900', color: '#ffffff', margin: '4px 0 4px 0' }}>
                📋 Generador de Acta Oficial de Entrega y Cierre de Turno
              </h2>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
                Consolida automáticamente el arqueo de Caja Menor y conciliaciones (Tab 4.1), asistencia de cuadrillas y obras recibidas (Tab 4.2), y el estado de motobombas, piscina Ley 1209 y rondas cerradas (Tab 4.3).
              </p>
              {cierreTurnoFirmadoHoy && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#34d399',
                    fontWeight: 'bold'
                  }}
                >
                  ✅ Cierre de Turno firmado hoy a las {cierreTurnoFirmadoHoy.horaFirma} • Entregado a:{' '}
                  {cierreTurnoFirmadoHoy.recibidoPor} ({cierreTurnoFirmadoHoy.hashActa})
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportarBitacoraRondasCsv}
                style={{
                  backgroundColor: '#1c1c1f',
                  color: '#22d3ee',
                  border: '1px solid #22d3ee',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                📥 Exportar Bitácora Técnica y Rondas (.CSV)
              </button>

              <button
                type="button"
                onClick={() => setModalActaCierreTurno(true)}
                style={{
                  backgroundColor: '#fbbf24',
                  color: '#09090b',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                📋 Generar Acta de Entrega de Turno (Consolidado Diario)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 1: 🔍 AUDITAR SOPORTE BANCARIO CON COMPARACIÓN LADO A LADO Y ABONO PARCIAL (TAB 4.1)
      ============================================================================ */}
      {modalComprobanteConciliacion && (() => {
        const unidadAsociada = unidades.find(u => u.id === modalComprobanteConciliacion.unidad_id);
        const saldoActualTab31 = unidadAsociada?.saldo_actual || 0;
        const montoAbonoNum = Number(montoAbonoParcialInput) || modalComprobanteConciliacion.monto_reportado;
        const saldoProyectadoTrasPago = Math.max(0, saldoActualTab31 - montoAbonoNum);
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                backgroundColor: '#141416',
                border: '1px solid #22d3ee',
                borderRadius: '12px',
                maxWidth: '760px',
                width: '100%',
                padding: '24px',
                fontFamily: 'monospace',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold' }}>
                  [ AUDITORÍA DE SOPORTE BANCARIO LADO A LADO • {modalComprobanteConciliacion.id} ]
                </span>
                <button
                  type="button"
                  onClick={() => setModalComprobanteConciliacion(null)}
                  style={{
                    backgroundColor: '#1c1c1f',
                    color: '#cbd5e1',
                    border: '1px solid #262629',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'monospace'
                  }}
                >
                  ✕ Cerrar
                </button>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#ffffff' }}>
                🔍 Contraste de Comprobante PSE/Transferencia vs. Cartera Real Tab 3.1 ({modalComprobanteConciliacion.numero_unidad})
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'sans-serif' }}>
                Verifica la autenticidad del CUS / Referencia bancaria frente al estado contable del apartamento antes de abonar o saldar.
              </p>

              {/* Comparación Lado a Lado */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '14px',
                  marginBottom: '16px'
                }}
              >
                {/* Columna Izquierda: Datos reportados por el residente + N° Comprobante CUS/PSE */}
                <div
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #22d3ee',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold', borderBottom: '1px solid #262629', paddingBottom: '6px' }}>
                    [ 1. DATOS REPORTADOS POR EL RESIDENTE + COMPROBANTE CUS/PSE ]
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Inmueble / Propietario:</span>
                    <strong style={{ color: '#ffffff' }}>
                      {modalComprobanteConciliacion.numero_unidad} ({modalComprobanteConciliacion.propietario})
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Canal &amp; Cuenta Origen:</span>
                    <span style={{ color: '#22d3ee' }}>
                      {modalComprobanteConciliacion.canal_bancario} ({modalComprobanteConciliacion.cuenta_origen})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>N° Comprobante CUS / PSE:</span>
                    <strong style={{ color: '#fbbf24' }}>{modalComprobanteConciliacion.referencia_bancaria}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Fecha / Hora Transacción:</span>
                    <span style={{ color: '#cbd5e1' }}>{modalComprobanteConciliacion.fecha_reporte}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #262629', paddingTop: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Valor en Soporte Bancario:</span>
                    <strong style={{ color: '#34d399', fontSize: '15px' }}>
                      {formatCOP(modalComprobanteConciliacion.monto_reportado)}
                    </strong>
                  </div>
                </div>

                {/* Columna Derecha: Saldo actual real del apartamento en el Tab 3.1 */}
                <div
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold', borderBottom: '1px solid #262629', paddingBottom: '6px' }}>
                    [ 2. SALDO ACTUAL REAL DEL APARTAMENTO EN TAB 3.1 ADMIN ]
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Cuota Mensual Ordinaria:</span>
                    <span style={{ color: '#ffffff' }}>{formatCOP(unidadAsociada?.cuota_base || 450000)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Estado Cartera Actual:</span>
                    <strong style={{ color: saldoActualTab31 > 0 ? '#ef4444' : '#34d399' }}>
                      {unidadAsociada?.estado_cartera || 'Al día'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Saldo Real en Tab 3.1:</span>
                    <strong style={{ color: saldoActualTab31 > 0 ? '#ef4444' : '#34d399', fontSize: '15px' }}>
                      {formatCOP(saldoActualTab31)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #262629', paddingTop: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Nuevo Saldo Proyectado:</span>
                    <strong style={{ color: saldoProyectadoTrasPago === 0 ? '#34d399' : '#fbbf24', fontSize: '14px' }}>
                      {formatCOP(saldoProyectadoTrasPago)} {saldoProyectadoTrasPago === 0 ? '(PAZ Y SALVO ✅)' : '(SALDO PENDIENTE)'}
                    </strong>
                  </div>
                </div>
              </div>

              {modalComprobanteConciliacion.estado === 'Pendiente por Conciliar' && (
                <div
                  style={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #262629',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '14px'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold', marginBottom: '8px' }}>
                    ⚙️ MODALIDAD DE APLICACIÓN A CARTERA (PAGO TOTAL VS. ABONO PARCIAL):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        MONTO A APLICAR EN CARTERA TAB 3.1 ($ COP) — EDITABLE PARA ABONO PARCIAL:
                      </label>
                      <input
                        type="number"
                        value={montoAbonoParcialInput}
                        onChange={e => setMontoAbonoParcialInput(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: '#1c1c1f',
                          border: '1px solid #22d3ee',
                          color: '#34d399',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          fontWeight: 'bold'
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleConciliarYAplicarPago(
                          modalComprobanteConciliacion,
                          Math.min(
                            modalComprobanteConciliacion.monto_reportado,
                            Math.max(10000, Number(montoAbonoParcialInput) || Math.round(modalComprobanteConciliacion.monto_reportado / 2))
                          )
                        )
                      }
                      style={{
                        backgroundColor: '#fbbf24',
                        color: '#09090b',
                        border: 'none',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer'
                      }}
                    >
                      ➗ Aplicar Abono Parcial ({formatCOP(montoAbonoNum)})
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleConciliarYAplicarPago(
                          modalComprobanteConciliacion,
                          modalComprobanteConciliacion.monto_reportado
                        )
                      }
                      style={{
                        backgroundColor: '#34d399',
                        color: '#09090b',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ Aplicar Pago Total ({formatCOP(modalComprobanteConciliacion.monto_reportado)})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ============================================================================
          MODAL 2: ❌ RECHAZAR SOPORTE POR INCONSISTENCIA CON OBSERVACIÓN
      ============================================================================ */}
      {modalRechazoSoporte && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <form
            onSubmit={handleConfirmarRechazoSoporte}
            style={{
              backgroundColor: '#141416',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              fontFamily: 'monospace'
            }}
          >
            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>
              [ RECHAZO DE SOPORTE INCONSISTENTE • {modalRechazoSoporte.id} ]
            </span>
            <h3 style={{ margin: '8px 0 12px 0', fontSize: '16px', color: '#ffffff' }}>
              Registrar Observación de Rechazo ({modalRechazoSoporte.numero_unidad})
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0', fontFamily: 'sans-serif' }}>
              Indica la inconsistencia detectada en el comprobante <strong>{modalRechazoSoporte.referencia_bancaria}</strong> para notificar al propietario y dejar constancia en <code>audit_logs</code>:
            </p>
            <textarea
              rows={3}
              value={motivoRechazoInput}
              onChange={e => setMotivoRechazoInput(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                color: '#ffffff',
                padding: '10px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setModalRechazoSoporte(null)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #262629',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#09090b',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                ❌ Confirmar Rechazo y Auditar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================================
          MODAL 3: 🔍 VER SOPORTE DE GASTO DE CAJA MENOR CON TIRILLA POS DIGITALIZADA
      ============================================================================ */}
      {modalSoporteCajaMenor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #fbbf24',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              fontFamily: 'monospace'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold' }}>
                [ VISOR DE FACTURA / RECIBO DE CAJA MENOR • {modalSoporteCajaMenor.id} ]
              </span>
              <button
                type="button"
                onClick={() => setModalSoporteCajaMenor(null)}
                style={{
                  backgroundColor: '#1c1c1f',
                  color: '#cbd5e1',
                  border: '1px solid #262629',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >
                ✕ Cerrar
              </button>
            </div>

            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#ffffff' }}>
              🧾 Recibo / Factura POS Digitalizada: {modalSoporteCajaMenor.recibo_num}
            </h3>

            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Proveedor / Ferretería:</span>
                <strong style={{ color: '#ffffff' }}>{modalSoporteCajaMenor.proveedor_ferreteria}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>NIT de la Ferretería / Comercio:</span>
                <strong style={{ color: '#22d3ee' }}>{modalSoporteCajaMenor.nit_proveedor}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Rubro / Categoría Operativa:</span>
                <span style={{ color: '#cbd5e1' }}>{modalSoporteCajaMenor.categoria_operativa}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Concepto Operativo:</span>
                <span style={{ color: '#22d3ee', textAlign: 'right' }}>{modalSoporteCajaMenor.concepto}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Valor Pagado por Caja Menor:</span>
                <strong style={{ color: '#fbbf24', fontSize: '15px' }}>{formatCOP(modalSoporteCajaMenor.monto)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Estado de Reembolso ante el Admin:</span>
                <strong style={{ color: reembolsoSolicitadoPendiente ? '#fbbf24' : '#34d399' }}>
                  {reembolsoSolicitadoPendiente
                    ? '⏳ En Solicitud de Reintegro ante Administración (Tab 3.2)'
                    : '✅ Legalizado y Sincronizado en Tab 3.2 (Egresos Admin)'}
                </strong>
              </div>
            </div>

            {/* Simulación de Tirilla / Foto del Soporte Físico */}
            <div
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px dashed #fbbf24',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '11px',
                color: '#cbd5e1'
              }}
            >
              <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '6px' }}>
                📸 EVIDENCIA DIGITAL DEL SOPORTE FÍSICO (TIRILLA POS ESCANEADA):
              </div>
              <div>
                TIRILLA POS #{modalSoporteCajaMenor.recibo_num} • {modalSoporteCajaMenor.proveedor_ferreteria} ({modalSoporteCajaMenor.nit_proveedor})
              </div>
              <div style={{ color: '#94a3b8', marginTop: '4px' }}>
                Fecha Emisión: {modalSoporteCajaMenor.fecha} • Pagado en Efectivo Caja Menor • Firma Sello Recibido Portería/Supervisor ✅
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 4: 🔍 EXPEDIENTE DE MUDANZA / OBRA (PROTOCOLO PRE/POST Y DEPÓSITO GARANTÍA)
      ============================================================================ */}
      {modalOrdenPorteriaMudanza && (() => {
        const protocolo = getProtocoloMudanza(modalOrdenPorteriaMudanza.solicitud.id);
        const unidadViva: UnidadCarteraPH =
          unidades.find(u => u.id === modalOrdenPorteriaMudanza.unidad?.id) ||
          modalOrdenPorteriaMudanza.unidad || {
            id: modalOrdenPorteriaMudanza.solicitud.unidad_id,
            numero_unidad: modalOrdenPorteriaMudanza.solicitud.numero_unidad,
            propietario: modalOrdenPorteriaMudanza.solicitud.propietario,
            documento_nit: 'CC 71.000.101',
            telefono_whatsapp: '+57 300 000 0000',
            email: 'propietario@urbix.ph',
            coeficiente: 1.5,
            cuota_base: 450000,
            capital_vencido: 0,
            intereses_mora: 0,
            costos_prejuridicos: 0,
            saldo_actual: 0,
            estado_cartera: 'Al día'
          };
        const estaEnMoraReal = (unidadViva?.saldo_actual ?? 0) > 0 || (unidadViva?.estado_cartera ?? 'Al día') !== 'Al día';
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.86)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                backgroundColor: '#141416',
                border: `2px solid ${estaEnMoraReal ? '#ef4444' : '#34d399'}`,
                borderRadius: '12px',
                maxWidth: '720px',
                width: '100%',
                padding: '24px',
                fontFamily: 'monospace',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    backgroundColor: estaEnMoraReal ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                    color: estaEnMoraReal ? '#ef4444' : '#34d399',
                    border: `1px solid ${estaEnMoraReal ? '#ef4444' : '#34d399'}`,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  [ EXPEDIENTE DE MUDANZA / OBRA EN APARTAMENTO • {modalOrdenPorteriaMudanza.solicitud.id} ]
                </span>
                <button
                  type="button"
                  onClick={() => setModalOrdenPorteriaMudanza(null)}
                  style={{
                    backgroundColor: '#1c1c1f',
                    color: '#cbd5e1',
                    border: '1px solid #262629',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'monospace'
                  }}
                >
                  ✕ Cerrar
                </button>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#ffffff' }}>
                🚚 Protocolo Completo de Mudanza / Obra Civil: {unidadViva.numero_unidad}
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0', fontFamily: 'sans-serif' }}>
                Verificación automática en tiempo real contra Cartera Tab 3.1, Custodia de Depósito de Garantía y Checklist de Portería.
              </p>

              <div
                style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #262629', paddingBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Inmueble &amp; Propietario / Residente:</span>
                  <strong style={{ color: '#ffffff' }}>
                    {unidadViva.numero_unidad} • {unidadViva.propietario}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #262629', paddingBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Verificación Automática de Cartera (Tab 3.1):</span>
                  <strong style={{ color: estaEnMoraReal ? '#ef4444' : '#34d399' }}>
                    {estaEnMoraReal
                      ? `⛔ EN MORA (${formatCOP(unidadViva?.saldo_actual ?? 0)} pendiente)`
                      : '✅ AL DÍA ($0 COP — Paz y Salvo Verificado)'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #262629', paddingBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Estado del Depósito de Garantía ($300.000 COP):</span>
                  <strong
                    style={{
                      color:
                        protocolo.estadoDeposito === 'Devuelto al Residente ✅'
                          ? '#34d399'
                          : protocolo.estadoDeposito.includes('Retenido')
                          ? '#ef4444'
                          : '#fbbf24'
                    }}
                  >
                    {protocolo.estadoDeposito}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #262629', paddingBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Empresa Transportadora y Placa del Camión:</span>
                  <strong style={{ color: '#22d3ee' }}>
                    {modalOrdenPorteriaMudanza.solicitud.empresa_transporte_placa ||
                      'Transportes Mudanzas El Poblado • Placa WXY-842'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Programación Autorizada:</span>
                  <span style={{ color: '#ffffff' }}>
                    {modalOrdenPorteriaMudanza.solicitud.fecha_programada_mudanza ||
                      'Lunes a Sábado 08:00 AM - 04:00 PM'}
                  </span>
                </div>
              </div>

              {/* Checklist Interactivo Pre/Post Mudanza */}
              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '14px',
                  fontSize: '12px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold', marginBottom: '10px' }}>
                  📋 CHECKLIST PRE / POST MUDANZA EN ASCENSOR Y ZONAS COMUNES:
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={protocolo.forrosAscensor}
                    onChange={() =>
                      handleToggleChecklistMudanza(modalOrdenPorteriaMudanza.solicitud.id, 'forrosAscensor')
                    }
                  />
                  <span>1. Forros protectores acolchados instalados en ascensor de carga</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={protocolo.revisionParedesLobby}
                    onChange={() =>
                      handleToggleChecklistMudanza(modalOrdenPorteriaMudanza.solicitud.id, 'revisionParedesLobby')
                    }
                  />
                  <span>2. Revisión de paredes, espejos y pisos de lobby (Pre y Post trasteo sin rayones)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={protocolo.horarioPermitido}
                    onChange={() =>
                      handleToggleChecklistMudanza(modalOrdenPorteriaMudanza.solicitud.id, 'horarioPermitido')
                    }
                  />
                  <span>3. Horario permitido verificado (Lunes a Sábado 8am - 4pm según Reglamento PH)</span>
                </label>

                <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', borderTop: '1px dashed #262629', paddingTop: '8px' }}>
                  <strong>Bitácora de Inspección:</strong> {protocolo.observacionInspeccion}
                </div>
              </div>

              {/* Botones de Custodia de Depósito y Cierre */}
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() =>
                      handleAutorizarDevolucionORetencionDeposito(
                        modalOrdenPorteriaMudanza.solicitud,
                        'devolver'
                      )
                    }
                    style={{
                      backgroundColor: '#34d399',
                      color: '#09090b',
                      border: 'none',
                      padding: '9px 14px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer'
                    }}
                  >
                    💰 Autorizar Devolución de Depósito
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAutorizarDevolucionORetencionDeposito(
                        modalOrdenPorteriaMudanza.solicitud,
                        'retener'
                      )
                    }
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.16)',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      padding: '9px 14px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer'
                    }}
                  >
                    ⚠️ Retener Depósito por Daños en Zonas Comunes
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOrdenPorteriaMudanza(null)}
                  style={{
                    backgroundColor: '#1c1c1f',
                    color: '#22d3ee',
                    border: '1px solid #22d3ee',
                    padding: '9px 16px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Transmitida a Portería (Cerrar)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================================
          MODAL 5 (TAB 4.2): 🔍 EXPEDIENTE TÉCNICO DE OBRA, ARL Y ACTA DE RECIBO
      ============================================================================ */}
      {modalActaOrden && (() => {
        const detTec = getDetalleTecnicoOrden(modalActaOrden.id);
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.86)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <form
              onSubmit={handleFirmarRecibidoSatisfaccion}
              style={{
                backgroundColor: '#141416',
                border: '2px solid #fbbf24',
                borderRadius: '12px',
                maxWidth: '740px',
                width: '100%',
                padding: '24px',
                fontFamily: 'monospace',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    backgroundColor: 'rgba(251, 191, 36, 0.14)',
                    color: '#fbbf24',
                    border: '1px solid #fbbf24',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  [ EXPEDIENTE TÉCNICO DE OBRA, SEGURIDAD SOCIAL ARL Y RECIBO • {modalActaOrden.id} ]
                </span>
                <button
                  type="button"
                  onClick={() => setModalActaOrden(null)}
                  style={{
                    backgroundColor: '#1c1c1f',
                    color: '#cbd5e1',
                    border: '1px solid #262629',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'monospace'
                  }}
                >
                  ✕ Cerrar
                </button>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#ffffff' }}>
                🔍 Expediente Técnico y ARL: {modalActaOrden.tarea_especifica}
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0', fontFamily: 'sans-serif' }}>
                Contratista: <strong style={{ color: '#ffffff' }}>{modalActaOrden.contratista_nombre}</strong> • Zona: {modalActaOrden.zona_intervenida} • Valor a liberar en Tab 3.2: <strong style={{ color: '#34d399' }}>{formatCOP(modalActaOrden.costo_estimado)}</strong>
              </p>

              {/* Bloque 1: Validación Detallada de Seguridad Social (PILA, Riesgo IV/V, Alturas y Herramientas) */}
              <div
                style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #22d3ee',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '14px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '7px'
                }}
              >
                <div style={{ color: '#22d3ee', fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                  🛡️ VALIDACIÓN DETALLADA DE SEGURIDAD SOCIAL Y CONTROL DE PORTERÍA:
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #262629', paddingBottom: '5px' }}>
                  <span style={{ color: '#94a3b8' }}>Número de Planilla PILA:</span>
                  <strong style={{ color: '#34d399' }}>{detTec.numero_planilla_pila}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #262629', paddingBottom: '5px' }}>
                  <span style={{ color: '#94a3b8' }}>Nivel de Riesgo ARL:</span>
                  <strong style={{ color: '#fbbf24' }}>{detTec.nivel_riesgo_arl}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #262629', paddingBottom: '5px' }}>
                  <span style={{ color: '#94a3b8' }}>Certificado de Trabajo en Alturas:</span>
                  <strong style={{ color: '#34d399' }}>{detTec.certificado_alturas}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                    🧰 Inventario de Herramientas Ingresadas por Portería:
                  </span>
                  <span style={{ color: '#e2e8f0', fontSize: '11px' }}>{detTec.herramientas_porteria}</span>
                </div>
              </div>

              {/* Bloque 2: Evidencia Antes vs. Después, Repuestos Instalados y Garantía */}
              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '14px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '11px' }}>
                  📸 REGISTRO DE EVIDENCIA ANTES VS. DESPUÉS, REPUESTOS Y GARANTÍA DEL ARREGLO:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', marginBottom: '4px' }}>
                      [ EVIDENCIA ANTES DE INTERVENCIÓN ]
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{detTec.evidencia_antes}</div>
                  </div>
                  <div style={{ backgroundColor: '#141416', border: '1px solid #34d399', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 'bold', marginBottom: '4px' }}>
                      [ EVIDENCIA DESPUÉS DE INTERVENCIÓN ]
                    </div>
                    <div style={{ fontSize: '11px', color: '#f8fafc' }}>{detTec.evidencia_despues}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      REPUESTOS INSTALADOS EN OBRA:
                    </label>
                    <input
                      type="text"
                      value={detTec.repuestos_instalados}
                      onChange={e =>
                        setDetalleTecnicoOrdenMap(prev => ({
                          ...prev,
                          [modalActaOrden.id]: {
                            ...detTec,
                            repuestos_instalados: e.target.value
                          }
                        }))
                      }
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: '#141416',
                        border: '1px solid #262629',
                        color: '#ffffff',
                        padding: '8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      TIEMPO DE GARANTÍA DEL ARREGLO:
                    </label>
                    <input
                      type="text"
                      value={detTec.tiempo_garantia}
                      onChange={e =>
                        setDetalleTecnicoOrdenMap(prev => ({
                          ...prev,
                          [modalActaOrden.id]: {
                            ...detTec,
                            tiempo_garantia: e.target.value
                          }
                        }))
                      }
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: '#141416',
                        border: '1px solid #262629',
                        color: '#34d399',
                        padding: '8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 3: Checklist Técnico de Campo */}
              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12px'
                }}
              >
                <div style={{ color: '#22d3ee', fontWeight: 'bold', fontSize: '11px' }}>
                  CHECKLIST DE VERIFICACIÓN TÉCNICA Y SEGURIDAD EN TERRENO:
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', cursor: 'pointer' }}>
                  <input type="checkbox" checked={chkEpp} onChange={e => setChkEpp(e.target.checked)} />
                  <span>1. Uso completo de EPP, señalización preventiva y cumplimiento de normas SG-SST</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', cursor: 'pointer' }}>
                  <input type="checkbox" checked={chkPruebas} onChange={e => setChkPruebas(e.target.checked)} />
                  <span>2. Pruebas de operación y arranque verificadas en presencia del Supervisor Operativo</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', cursor: 'pointer' }}>
                  <input type="checkbox" checked={chkLimpieza} onChange={e => setChkLimpieza(e.target.checked)} />
                  <span>3. Área de trabajo entregada limpia, libre de escombros y residuos peligrosos</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', cursor: 'pointer' }}>
                  <input type="checkbox" checked={chkSinDanos} onChange={e => setChkSinDanos(e.target.checked)} />
                  <span>4. Sin afectaciones ni daños colaterales a bienes comunes de la copropiedad</span>
                </label>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  OBSERVACIONES TÉCNICAS DEL SUPERVISOR (SE ADJUNTAN A LA FACTURA EN TAB 3.2 ADMIN) *
                </label>
                <textarea
                  rows={2}
                  value={obsActaTecnica}
                  onChange={e => setObsActaTecnica(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #262629',
                    color: '#ffffff',
                    padding: '10px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalActaOrden(null)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #262629',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#34d399',
                    color: '#09090b',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Firmar Recibo Técnico y Desbloquear Pago en Tab 3.2 Admin
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ============================================================================
          MODAL 6 (TAB 4.2): 🔍 VER RUTINA Y PUESTO (ASEO POR HORAS / MINUTA VIGILANTES)
      ============================================================================ */}
      {modalExpedienteTrabajador && (() => {
        const metaExp = getMetaTrabajador(modalExpedienteTrabajador);
        const rutinaAseoHoras = getRutinaAseoTrabajador(modalExpedienteTrabajador.id);
        const bitacoraGuarda = getBitacoraVigilante(modalExpedienteTrabajador.id);
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.86)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                backgroundColor: '#141416',
                border: '1px solid #22d3ee',
                borderRadius: '12px',
                maxWidth: '720px',
                width: '100%',
                padding: '24px',
                fontFamily: 'monospace',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold' }}>
                  [ INSPECTOR DE RUTINA Y PUESTO EN CAMPO • ID #{modalExpedienteTrabajador.id} ]
                </span>
                <button
                  type="button"
                  onClick={() => setModalExpedienteTrabajador(null)}
                  style={{
                    backgroundColor: '#1c1c1f',
                    color: '#cbd5e1',
                    border: '1px solid #262629',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'monospace'
                  }}
                >
                  ✕ Cerrar
                </button>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#ffffff' }}>
                🔍 {modalExpedienteTrabajador.full_name} — {metaExp.puesto_zona}
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0' }}>
                {metaExp.cedula_id} • Empresa: {metaExp.empresa} • Rol:{' '}
                <strong style={{ color: '#22d3ee' }}>{modalExpedienteTrabajador.role.toUpperCase()}</strong> • Turno: {metaExp.turno_campo}
              </p>

              {/* Desglose específico según Rol: ASEO (Checklist por horas) vs VIGILANTE (Minuta, Llaves, Paquetes y Relevos) */}
              {modalExpedienteTrabajador.role === 'aseo' ? (
                <div
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #34d399',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '12px',
                    marginBottom: '14px'
                  }}
                >
                  <div style={{ color: '#34d399', fontWeight: 'bold', fontSize: '11px', marginBottom: '10px' }}>
                    🧹 CHECKLIST OPERATIVO DE ASEO Y MANTENIMIENTO POR HORAS (INTERACTIVO):
                  </div>
                  {rutinaAseoHoras.map(item => (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        backgroundColor: '#141416',
                        border: '1px solid #262629',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: item.completado ? '#34d399' : '#f8fafc' }}>
                        <input
                          type="checkbox"
                          checked={item.completado}
                          onChange={() => handleToggleTareaAseoHora(modalExpedienteTrabajador.id, item.id)}
                        />
                        <span>{item.actividad}</span>
                      </div>
                      <span style={{ fontSize: '10px', color: item.completado ? '#34d399' : '#fbbf24', fontWeight: 'bold' }}>
                        {item.completado ? 'VERIFICADO ✅' : 'EN CURSO ⏳'}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '14px'
                  }}
                >
                  {/* Aviso de separación de funciones operativas de garita */}
                  <div
                    style={{
                      backgroundColor: 'rgba(34, 211, 238, 0.08)',
                      border: '1px solid rgba(34, 211, 238, 0.35)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '11px',
                      color: '#cbd5e1'
                    }}
                  >
                    🔒 <strong style={{ color: '#22d3ee' }}>AUDITORÍA DE SUPERVISIÓN (SOLO LECTURA):</strong> El registro de visitantes, aprobación de pases QR y manipulación de casilleros de encomiendas operan exclusivamente desde la Consola de Garita del Vigilante.
                  </div>

                  {/* 1. Auditoría de Minuta del Puesto */}
                  <div
                    style={{
                      backgroundColor: '#1c1c1f',
                      border: '1px solid #22d3ee',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '11px'
                    }}
                  >
                    <div style={{ color: '#22d3ee', fontWeight: 'bold', marginBottom: '6px' }}>
                      📘 AUDITORÍA DE MINUTA DEL PUESTO DE VIGILANCIA (SOLO LECTURA):
                    </div>
                    {bitacoraGuarda.minuta_puesto.map((linea, idx) => (
                      <div key={idx} style={{ color: '#e2e8f0', padding: '4px 0', borderBottom: '1px dashed #262629' }}>
                        • {linea}
                      </div>
                    ))}
                  </div>

                  {/* 2. Auditoría de Relevos Registrados y Sellos de Seguridad */}
                  <div
                    style={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #262629',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '11px'
                    }}
                  >
                    <div style={{ color: '#34d399', fontWeight: 'bold', marginBottom: '6px' }}>
                      🔄 AUDITORÍA DE RELEVOS DE TURNO Y SELLOS DE VALIDACIÓN:
                    </div>
                    {bitacoraGuarda.relevos_registrados.map((rel, idx) => (
                      <div key={idx} style={{ color: '#94a3b8', padding: '4px 0', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <span>• {rel}</span>
                        <span style={{ color: '#2dd4bf', whiteSpace: 'nowrap' }}>SHA-256 Verified</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario de Reemplazo por Incapacidad */}
              <form
                onSubmit={handleReportarReemplazoIncapacidad}
                style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '14px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '8px' }}>
                  🔄 REPORTAR REEMPLAZO POR INCAPACIDAD O AUSENCIA EN PUESTO:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      OPERARIO REEMPLAZANTE (SUPLENTE) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Ferney Ospina (Supernumerario)"
                      value={reemplazoNombreInput}
                      onChange={e => setReemplazoNombreInput(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#ffffff',
                        padding: '8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      CAUSAL / SOPORTE EPS
                    </label>
                    <input
                      type="text"
                      value={reemplazoMotivoInput}
                      onChange={e => setReemplazoMotivoInput(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#cbd5e1',
                        padding: '8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#fbbf24',
                      color: '#09090b',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer'
                    }}
                  >
                    + Registrar Reemplazo por Incapacidad en Bitácora
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ============================================================================
          MODAL 7 (TAB 4.3): 🔍 VER DETALLE DE RONDA, PUNTO QR/NFC Y ESCALAMIENTO DIRECTO
      ============================================================================ */}
      {modalDetalleRonda && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #22d3ee',
              borderRadius: '12px',
              maxWidth: '620px',
              width: '100%',
              padding: '24px',
              fontFamily: 'monospace'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold' }}>
                [ EXPEDIENTE DE RONDA Y PUNTO DE CONTROL QR / NFC • {modalDetalleRonda.id} ]
              </span>
              <button
                type="button"
                onClick={() => setModalDetalleRonda(null)}
                style={{
                  backgroundColor: '#1c1c1f',
                  color: '#cbd5e1',
                  border: '1px solid #262629',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >
                ✕ Cerrar
              </button>
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#ffffff' }}>
              Punto Verificado: {modalDetalleRonda.punto_control}
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0' }}>
              Fecha: {modalDetalleRonda.fecha_dia} • Hora Exacta: <strong style={{ color: '#22d3ee' }}>{modalDetalleRonda.hora_exacta}</strong>
            </p>

            <div
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Estado del Recorrido:</span>
                <strong
                  style={{
                    color:
                      modalDetalleRonda.estado === '🔴 Incidente de Seguridad / Convivencia'
                        ? '#ef4444'
                        : modalDetalleRonda.estado === '🟡 Hallazgo Menor / Mantenimiento'
                        ? '#fbbf24'
                        : '#34d399'
                  }}
                >
                  {modalDetalleRonda.estado}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Responsable en Terreno:</span>
                <strong style={{ color: '#ffffff' }}>{modalDetalleRonda.responsable_ronda}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Tag NFC / QR Leído:</span>
                <span style={{ color: '#22d3ee' }}>{modalDetalleRonda.tag_nfc_verificado}</span>
              </div>
              {modalDetalleRonda.unidad_involucrada && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #262629', paddingTop: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Unidad Infractora Reportada:</span>
                  <strong style={{ color: '#fbbf24' }}>
                    {modalDetalleRonda.unidad_involucrada} ({modalDetalleRonda.propietario_involucrado})
                  </strong>
                </div>
              )}
              {modalDetalleRonda.escalado_tab3_4 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Sincronización Tab 3.4 Admin:</span>
                  <strong style={{ color: '#34d399' }}>
                    ⚖️ Escalado ({modalDetalleRonda.acta_sancion_generada})
                  </strong>
                </div>
              )}
            </div>

            <div
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #262629',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: '#f8fafc',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                MINUTA DETALLADA REGISTRADA EN CAMPO:
              </div>
              {modalDetalleRonda.observacion_detallada}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleEscalarRondaAOrdenTrabajoTab42(modalDetalleRonda)}
                  style={{
                    backgroundColor: 'rgba(251, 191, 36, 0.14)',
                    color: '#fbbf24',
                    border: '1px solid #fbbf24',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🛠️ Escalar Daño a Orden de Trabajo (Tab 4.2)
                </button>
                <button
                  type="button"
                  onClick={() => handleEscalarRondaDirectoTab34(modalDetalleRonda)}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.14)',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ⚖️ Escalar Incidente de Convivencia (Tab 3.4)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setModalDetalleRonda(null)}
                style={{
                  backgroundColor: '#22d3ee',
                  color: '#09090b',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                ✓ Entendido (Cerrar)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 8 (TAB 4.3): 📋 ACTA OFICIAL DE ENTREGA Y CIERRE DE TURNO (CONSOLIDADO DIARIO)
      ============================================================================ */}
      {modalActaCierreTurno && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #fbbf24',
              borderRadius: '12px',
              maxWidth: '760px',
              width: '100%',
              padding: '24px',
              fontFamily: 'monospace',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold' }}>
                [ ACTA OFICIAL DE ENTREGA Y CIERRE DE TURNO • CONSOLIDADO TABS 4.1 + 4.2 + 4.3 ]
              </span>
              <button
                type="button"
                onClick={() => setModalActaCierreTurno(false)}
                style={{
                  backgroundColor: '#1c1c1f',
                  color: '#cbd5e1',
                  border: '1px solid #262629',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >
                ✕ Cerrar
              </button>
            </div>

            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#ffffff' }}>
              📋 Consolidado Diario de Gestión Operativa del Supervisor
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0', fontFamily: 'sans-serif' }}>
              Resumen certificado en tiempo real de Caja Menor, Conciliaciones, Cuadrillas, Obras Recibidas, Equipos Críticos y Rondas de Seguridad.
            </p>

            {/* Grid de 4 Bloques Consolidados */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              {/* Bloque 1: Caja Menor (Tab 4.1) */}
              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  borderTop: '1px solid #262629',
                  borderRight: '1px solid #262629',
                  borderBottom: '1px solid #262629',
                  borderLeft: '3px solid #34d399',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 'bold', marginBottom: '6px' }}>
                  1. BALANCE DE CAJA MENOR (TAB 4.1)
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Saldo Final Disponible:</span>
                  <strong style={{ color: '#34d399' }}>{formatCOP(saldoCajaMenorDisponible)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Gastos Ejecutados en Turno:</span>
                  <strong style={{ color: '#fbbf24' }}>
                    {formatCOP(totalGastadoCajaMenorSemana)} ({movimientosCajaMenor.length} recibos)
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#94a3b8' }}>Solicitud de Reembolso Admin:</span>
                  <span style={{ color: '#22d3ee' }}>
                    {reembolsoSolicitadoPendiente ? 'Enviada a Tab 3.2 ✅' : 'En Operación Normal'}
                  </span>
                </div>
              </div>

              {/* Bloque 2: Conciliaciones y PQRS / Mudanzas (Tab 4.1) */}
              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  borderTop: '1px solid #262629',
                  borderRight: '1px solid #262629',
                  borderBottom: '1px solid #262629',
                  borderLeft: '3px solid #22d3ee',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold', marginBottom: '6px' }}>
                  2. CONCILIACIÓN Y PQRS / MUDANZAS (TAB 4.1)
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Pagos Conciliados Hoy (Tab 3.1):</span>
                  <strong style={{ color: '#34d399' }}>
                    {soportesConciliadosCount} aplicados / {soportesPendientesCount} pendientes
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>PQRS y Mudanzas Gestionadas:</span>
                  <strong style={{ color: '#ffffff' }}>
                    {pqrsResueltasOAutorizadas} resueltas / {pqrsYMudanzasAbiertasHoy} en curso
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#94a3b8' }}>Trasteos Bloqueados por Mora:</span>
                  <strong style={{ color: '#ef4444' }}>
                    {solicitudesPqrsMudanza.filter(s => s.estado_atencion === 'Bloqueada por Mora ⚠️').length} bloqueos
                  </strong>
                </div>
              </div>

              {/* Bloque 3: Asistencia Cuadrillas y Contratistas (Tab 4.2) */}
              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  borderTop: '1px solid #262629',
                  borderRight: '1px solid #262629',
                  borderBottom: '1px solid #262629',
                  borderLeft: '3px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '6px' }}>
                  3. CUADRILLAS Y OBRAS RECIBIDAS (TAB 4.2)
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Personal Activo en Puesto:</span>
                  <strong style={{ color: '#34d399' }}>
                    {kpiVigilantesEnPuesto} Vigilantes • {kpiAseoEnTurnoActivo} Aseo • {kpiContratistasTrabajandoHoy} Contratistas
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Obras Recibidas a Satisfacción:</span>
                  <strong style={{ color: '#22d3ee' }}>
                    {ordenesTrabajo.filter(o => o.estado_orden === 'Finalizada').length} / {ordenesTrabajo.length} Órdenes
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#94a3b8' }}>Alertas ARL Bloqueadas Portería:</span>
                  <strong style={{ color: '#ef4444' }}>{kpiAlertasArlVencida} bloqueadas ⛔</strong>
                </div>
              </div>

              {/* Bloque 4: Equipos Críticos, Piscina Ley 1209 y Rondas (Tab 4.3) */}
              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  borderTop: '1px solid #262629',
                  borderRight: '1px solid #262629',
                  borderBottom: '1px solid #262629',
                  borderLeft: `3px solid ${equiposEnFallaCount > 0 ? '#ef4444' : '#34d399'}`,
                  borderRadius: '8px',
                  padding: '12px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 'bold', marginBottom: '6px' }}>
                  4. EQUIPOS CRÍTICOS, PISCINA Y RONDAS (TAB 4.3)
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Rondas Verificadas &amp; Equipos:</span>
                  <strong style={{ color: '#34d399' }}>
                    {rondasVerificadasCount}/{metaRondasDiarias} Rondas • {porcentajeOperatividadEquipos}% Operatividad
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Piscina Ley 1209 (pH / Cloro):</span>
                  <strong style={{ color: cumpleLey1209Piscina ? '#34d399' : '#ef4444' }}>
                    pH {medicionPiscina.ph_actual} | {medicionPiscina.cloro_residual_ppm} ppm ({cumpleLey1209Piscina ? 'APTA' : 'ALERTA'})
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#94a3b8' }}>Casos Escalados a Tab 3.4 Admin:</span>
                  <strong style={{ color: '#fbbf24' }}>
                    {rondasBitacora.filter(r => r.escalado_tab3_4).length} expedientes convivencia
                  </strong>
                </div>
              </div>
            </div>

            {/* Campos de entrega formal al Supervisor o Guarda entrante */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  SUPERVISOR / JEFE DE TURNO QUE RECIBE LA UNIDAD RESIDENCIAL:
                </label>
                <input
                  type="text"
                  value={supervisorEntranteInput}
                  onChange={e => setSupervisorEntranteInput(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #262629',
                    color: '#ffffff',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  CONSIGNAS ESPECIALES Y PENDIENTES PARA EL TURNO ENTRANTE:
                </label>
                <textarea
                  rows={3}
                  value={consignasEntregaTurno}
                  onChange={e => setConsignasEntregaTurno(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#1c1c1f',
                    border: '1px solid #262629',
                    color: '#e2e8f0',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                />
              </div>
            </div>

            {cierreTurnoFirmadoHoy && (
              <div
                style={{
                  backgroundColor: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid #34d399',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '11px',
                  color: '#34d399',
                  marginBottom: '14px'
                }}
              >
                ✅ <strong>ACTA SELLADA Y ENVIADA AL ADMINISTRADOR:</strong> Firmada a las{' '}
                {cierreTurnoFirmadoHoy.horaFirma} con hash criptográfico <code>{cierreTurnoFirmadoHoy.hashActa}</code>.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={handleExportarBitacoraRondasCsv}
                style={{
                  backgroundColor: '#1c1c1f',
                  color: '#22d3ee',
                  border: '1px solid #22d3ee',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                📥 Exportar Bitácora Técnica y Rondas (.CSV)
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalActaCierreTurno(false)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #262629',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar Vista
                </button>
                <button
                  type="button"
                  onClick={handleFirmarYEnviarCierreTurno}
                  style={{
                    backgroundColor: '#34d399',
                    color: '#09090b',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  ✍️ Firmar y Enviar Cierre de Turno al Administrador
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 9 (CABECERA): 🚨 BOTÓN DE PÁNICO / PROTOCOLO DE EMERGENCIA EN COPROPIEDAD
      ============================================================================ */}
      {modalBotonPanico && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              backgroundColor: '#141416',
              border: '2px solid #ef4444',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              padding: '24px',
              fontFamily: 'monospace'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                [ PROTOCOLO RÁPIDO DE REACCIÓN Y EMERGENCIA EN COPROPIEDAD ]
              </span>
              <button
                type="button"
                onClick={() => setModalBotonPanico(false)}
                style={{
                  backgroundColor: '#1c1c1f',
                  color: '#cbd5e1',
                  border: '1px solid #262629',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >
                ✕ Cerrar
              </button>
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#ffffff' }}>
              🚨 Central de Reacción Inmediata — {unidadAsignadaSupervisor}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'sans-serif' }}>
              Activa el protocolo correspondiente para notificar en un clic a las autoridades, central de monitoreo y Administración, dejando registro automático en <code>audit_logs</code>.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              {[
                {
                  entidad: 'Policía Nacional — Cuadrante 14 Poblado',
                  linea: '123 / +57 300 911 0414',
                  protocolo: 'Intrusión perimetral, alteración grave de orden público o riña en áreas comunes',
                  color: '#ef4444'
                },
                {
                  entidad: 'Cuerpo Oficial de Bomberos Medellín / DAGRD',
                  linea: '119 / (604) 444 0119',
                  protocolo: 'Conato de incendio, fuga de gas, rescate en ascensor o inundación en sótanos',
                  color: '#fbbf24'
                },
                {
                  entidad: 'Empresa de Vigilancia (Central Omega 24/7)',
                  linea: '(604) 322 9900 • Canal Radio #1',
                  protocolo: 'Apoyo motorizado de supervisor de zona y bloqueo total de esclusas vehiculares',
                  color: '#22d3ee'
                },
                {
                  entidad: 'Administrador Representante Legal PH',
                  linea: 'Dra. Claudia M. Botero (+57 310 555 8890)',
                  protocolo: 'Reporte urgente de siniestro para activación de Póliza de Bienes Comunes (Ley 675)',
                  color: '#34d399'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: `1px solid ${item.color}`,
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 'bold', marginBottom: '4px' }}>
                      {item.entidad}
                    </div>
                    <div style={{ fontSize: '11px', color: item.color, fontWeight: 'bold', marginBottom: '6px' }}>
                      📞 Línea Directa: {item.linea}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'sans-serif' }}>
                      {item.protocolo}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleActivarProtocoloEmergencia(item.entidad, item.linea, item.protocolo)}
                    style={{
                      backgroundColor: item.color,
                      color: '#09090b',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer'
                    }}
                  >
                    🚨 Despachar Alerta y Registrar en Bitácora
                  </button>
                </div>
              ))}
            </div>

            {ultimoDespachoEmergencia && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.14)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '11px',
                  color: '#f8fafc'
                }}
              >
                ⚡ <strong>ÚLTIMO DESPACHO REGISTRADO:</strong> {ultimoDespachoEmergencia}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 10 (TAB 4.1): 🪙 ARQUEO FÍSICO Y DESGLOSE DE CAJA MENOR POR CATEGORÍA
      ============================================================================ */}
      {modalArqueoCajaMenor && (() => {
        const totalValesProvisorios = valesProvisoriosCajaMenor
          .filter(v => v.estado === 'Por Legalizar ⏳')
          .reduce((acc, v) => acc + v.monto, 0);
        const efectivoFisicoEnCofre = Math.max(0, saldoCajaMenorDisponible - totalValesProvisorios);

        const gastoFerreteria = movimientosCajaMenor
          .filter(m => m.categoria_operativa.includes('Ferretería') || m.categoria_operativa.includes('Eléctrico'))
          .reduce((acc, m) => acc + m.monto, 0);
        const gastoAseo = movimientosCajaMenor
          .filter(m => m.concepto.toLowerCase().includes('aseo') || m.concepto.toLowerCase().includes('limpieza'))
          .reduce((acc, m) => acc + m.monto, 0);
        const gastoCerrajeria = movimientosCajaMenor
          .filter(m => m.categoria_operativa.includes('Cerrajería'))
          .reduce((acc, m) => acc + m.monto, 0);
        const gastoPapeleria = Math.max(0, totalGastadoCajaMenorSemana - (gastoFerreteria + gastoAseo + gastoCerrajeria));

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.86)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                backgroundColor: '#141416',
                border: '2px solid #fbbf24',
                borderRadius: '12px',
                maxWidth: '780px',
                width: '100%',
                padding: '24px',
                fontFamily: 'monospace',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold' }}>
                  [ ARQUEO FÍSICO DE COFRE Y AUDITORÍA DE CAJA MENOR • TAB 4.1 ]
                </span>
                <button
                  type="button"
                  onClick={() => setModalArqueoCajaMenor(false)}
                  style={{
                    backgroundColor: '#1c1c1f',
                    color: '#cbd5e1',
                    border: '1px solid #262629',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'monospace'
                  }}
                >
                  ✕ Cerrar
                </button>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#ffffff' }}>
                🪙 Arqueo Físico y Desglose de Caja Menor ($1.500.000 COP)
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'sans-serif' }}>
                Conciliación exacta entre el Fondo Fijo Asignado, Efectivo Físico en Caja, Vales Provisorios por Legalizar y Facturas POS causadas.
              </p>

              {/* 1. Ecuación de Balance de Arqueo */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '10px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ backgroundColor: '#1c1c1f', border: '1px solid #262629', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>FONDO FIJO ASIGNADO</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', marginTop: '4px' }}>
                    {formatCOP(FONDO_FIJO_CAJA_MENOR_ASIGNADO)}
                  </div>
                </div>
                <div style={{ backgroundColor: '#1c1c1f', border: '1px solid #34d399', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#34d399' }}>EFECTIVO FÍSICO EN COFRE</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#34d399', marginTop: '4px' }}>
                    {formatCOP(efectivoFisicoEnCofre)}
                  </div>
                </div>
                <div style={{ backgroundColor: '#1c1c1f', border: '1px solid #fbbf24', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#fbbf24' }}>VALES PROVISORIOS POR LEGALIZAR</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#fbbf24', marginTop: '4px' }}>
                    {formatCOP(totalValesProvisorios)}
                  </div>
                </div>
                <div style={{ backgroundColor: '#1c1c1f', border: '1px solid #22d3ee', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#22d3ee' }}>FACTURAS POS LEGALIZADAS</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#22d3ee', marginTop: '4px' }}>
                    {formatCOP(totalGastadoCajaMenorSemana)}
                  </div>
                </div>
              </div>

              {/* 2. Desglose por Categoría Rápida */}
              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold', marginBottom: '10px' }}>
                  📊 DESGLOSE DE GASTOS POR CATEGORÍA RÁPIDA EN CAMPO:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '8px', fontSize: '11px' }}>
                  <div style={{ backgroundColor: '#141416', padding: '8px 10px', borderRadius: '6px', border: '1px solid #262629' }}>
                    <div style={{ color: '#94a3b8' }}>🔧 Ferretería / Eléctricos</div>
                    <strong style={{ color: '#fbbf24', fontSize: '13px' }}>{formatCOP(gastoFerreteria)}</strong>
                  </div>
                  <div style={{ backgroundColor: '#141416', padding: '8px 10px', borderRadius: '6px', border: '1px solid #262629' }}>
                    <div style={{ color: '#94a3b8' }}>🧹 Aseo Urgente</div>
                    <strong style={{ color: '#34d399', fontSize: '13px' }}>{formatCOP(gastoAseo)}</strong>
                  </div>
                  <div style={{ backgroundColor: '#141416', padding: '8px 10px', borderRadius: '6px', border: '1px solid #262629' }}>
                    <div style={{ color: '#94a3b8' }}>🔑 Cerrajería</div>
                    <strong style={{ color: '#22d3ee', fontSize: '13px' }}>{formatCOP(gastoCerrajeria)}</strong>
                  </div>
                  <div style={{ backgroundColor: '#141416', padding: '8px 10px', borderRadius: '6px', border: '1px solid #262629' }}>
                    <div style={{ color: '#94a3b8' }}>📎 Papelería / Portería</div>
                    <strong style={{ color: '#cbd5e1', fontSize: '13px' }}>{formatCOP(gastoPapeleria)}</strong>
                  </div>
                </div>
              </div>

              {/* 3. Vales Provisorios en Terreno */}
              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '16px',
                  fontSize: '11px'
                }}
              >
                <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '8px' }}>
                  🧾 VALES PROVISORIOS ENTREGADOS EN TERRENO (PENDIENTES DE FACTURA POS):
                </div>
                {valesProvisoriosCajaMenor.map(vale => (
                  <div
                    key={vale.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: '1px dashed #262629'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#ffffff' }}>{vale.id}</strong> • {vale.responsable} ({vale.categoria_rapida})
                      <div style={{ color: '#94a3b8', fontSize: '10px' }}>{vale.concepto}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#fbbf24' }}>{formatCOP(vale.monto)}</strong>
                      <button
                        type="button"
                        onClick={() =>
                          setValesProvisoriosCajaMenor(prev =>
                            prev.map(v =>
                              v.id === vale.id
                                ? {
                                    ...v,
                                    estado:
                                      v.estado === 'Por Legalizar ⏳'
                                        ? 'Legalizado en POS ✅'
                                        : 'Por Legalizar ⏳'
                                  }
                                : v
                            )
                          )
                        }
                        style={{
                          backgroundColor: vale.estado.includes('Legalizado')
                            ? 'rgba(52, 211, 153, 0.14)'
                            : 'rgba(251, 191, 36, 0.14)',
                          color: vale.estado.includes('Legalizado') ? '#34d399' : '#fbbf24',
                          border: `1px solid ${vale.estado.includes('Legalizado') ? '#34d399' : '#fbbf24'}`,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {vale.estado}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 4. Visor Detallado de Cada Factura/Recibo con NIT, Foto Simulada y Estado de Reembolso */}
              <div
                style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #22d3ee',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '11px'
                }}
              >
                <div style={{ color: '#22d3ee', fontWeight: 'bold', marginBottom: '8px' }}>
                  🔍 VISOR DETALLADO DE FACTURAS POS Y ESTADO DE REEMBOLSO ANTE EL ADMINISTRADOR:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {movimientosCajaMenor.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setReciboInspectorArqueo(m)}
                      style={{
                        backgroundColor: reciboInspectorArqueo?.id === m.id ? '#22d3ee' : '#1c1c1f',
                        color: reciboInspectorArqueo?.id === m.id ? '#09090b' : '#e2e8f0',
                        border: '1px solid #22d3ee',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      🧾 {m.recibo_num} ({formatCOP(m.monto)})
                    </button>
                  ))}
                </div>

                {reciboInspectorArqueo && (
                  <div
                    style={{
                      backgroundColor: '#141416',
                      border: '1px dashed #22d3ee',
                      borderRadius: '6px',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Comercio / Ferretería &amp; NIT:</span>
                      <strong style={{ color: '#ffffff' }}>
                        {reciboInspectorArqueo.proveedor_ferreteria} • {reciboInspectorArqueo.nit_proveedor}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Concepto &amp; Soporte POS:</span>
                      <span style={{ color: '#22d3ee' }}>
                        {reciboInspectorArqueo.concepto} ({reciboInspectorArqueo.recibo_num})
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Foto / Escaneo del Soporte:</span>
                      <span style={{ color: '#34d399' }}>
                        📸 IMG_POS_{reciboInspectorArqueo.recibo_num}.JPG (Sello Cancelado Efectivo)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Estado de Reembolso ante el Administrador:</span>
                      <strong style={{ color: reembolsoSolicitadoPendiente ? '#fbbf24' : '#34d399' }}>
                        {reembolsoSolicitadoPendiente
                          ? '⏳ En Trámite de Reembolso (Tab 3.2 Admin)'
                          : '✅ Causado y Respaldado en Egresos Tab 3.2'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================================
          MODAL 11 (TAB 4.3): 🔍 FICHA TÉCNICA DE EQUIPO CRÍTICO, HISTORIAL Y CALCULADORA LEY 1209
      ============================================================================ */}
      {modalFichaTecnicaEquipo && (() => {
        const ficha = FICHAS_TECNICAS_EQUIPOS_MAP[modalFichaTecnicaEquipo.id] || FICHAS_TECNICAS_EQUIPOS_MAP['EQ-BOMBAS'];
        const esPiscina = modalFichaTecnicaEquipo.id === 'EQ-PISCINA';
        const gramosHipocloritoSugeridos =
          medicionPiscina.cloro_residual_ppm < 1.0
            ? Math.round((1.5 - medicionPiscina.cloro_residual_ppm) * 185)
            : 0;
        const mlReductorPhSugeridos =
          medicionPiscina.ph_actual > 7.6
            ? Math.round((medicionPiscina.ph_actual - 7.4) * 450)
            : 0;

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.86)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                backgroundColor: '#141416',
                border: '2px solid #22d3ee',
                borderRadius: '12px',
                maxWidth: '760px',
                width: '100%',
                padding: '24px',
                fontFamily: 'monospace',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold' }}>
                  [ FICHA TÉCNICA DE ACTIVO CRÍTICO E HISTORIAL DE LECTURAS • {modalFichaTecnicaEquipo.id} ]
                </span>
                <button
                  type="button"
                  onClick={() => setModalFichaTecnicaEquipo(null)}
                  style={{
                    backgroundColor: '#1c1c1f',
                    color: '#cbd5e1',
                    border: '1px solid #262629',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'monospace'
                  }}
                >
                  ✕ Cerrar
                </button>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#ffffff' }}>
                {modalFichaTecnicaEquipo.letra_punto} {modalFichaTecnicaEquipo.nombre_punto}
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#94a3b8' }}>
                Ubicación: {modalFichaTecnicaEquipo.ubicacion_tecnica} • Estado:{' '}
                <strong style={{ color: '#34d399' }}>{modalFichaTecnicaEquipo.estado}</strong>
              </p>

              {/* Datos de Ficha Técnica del Equipo */}
              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #262629', paddingBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Marca / Modelo del Equipo:</span>
                  <strong style={{ color: '#ffffff' }}>{ficha.marca_modelo}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #262629', paddingBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Serial de Activo PH:</span>
                  <span style={{ color: '#22d3ee' }}>{ficha.serie_activo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #262629', paddingBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Fecha de Último Mantenimiento Preventivo:</span>
                  <strong style={{ color: '#34d399' }}>{ficha.ultimo_mantenimiento}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #262629', paddingBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Fecha de Próximo Mantenimiento Programado:</span>
                  <strong style={{ color: '#fbbf24' }}>{ficha.proximo_mantenimiento}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Proveedor Responsable &amp; Contacto 24/7:</span>
                  <strong style={{ color: '#22d3ee' }}>
                    {ficha.proveedor_responsable} ({ficha.nit_telefono_proveedor})
                  </strong>
                </div>
              </div>

              {/* Bloque Exclusivo para Piscina (Ley 1209): Historial Mañana/Tarde + Calculadora Automática de Dosificación */}
              {esPiscina && (
                <div
                  style={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #22d3ee',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '14px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ color: '#22d3ee', fontWeight: 'bold', fontSize: '11px', marginBottom: '8px' }}>
                    🏊‍♂️ PROTOCOLO PISCINA LEY 1209: MEDICIONES DEL DÍA (MAÑANA / TARDE) Y CALCULADORA DE DOSIFICACIÓN QUÍMICA
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    {historialPiscinaDia.map((med, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#1c1c1f',
                          border: '1px solid #262629',
                          borderRadius: '6px',
                          padding: '10px',
                          fontSize: '11px'
                        }}
                      >
                        <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '4px' }}>
                          ⏱️ {med.jornada}
                        </div>
                        <div style={{ color: '#ffffff' }}>
                          pH: <strong>{med.ph.toFixed(1)}</strong> • Cloro: <strong>{med.cloro_ppm.toFixed(1)} ppm</strong> • Temp: {med.temp_c} °C
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '4px' }}>
                          {med.dosificacion_aplicada}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calculadora Automática de Dosificación */}
                  <div
                    style={{
                      backgroundColor: 'rgba(34, 211, 238, 0.08)',
                      border: '1px dashed #22d3ee',
                      borderRadius: '6px',
                      padding: '10px',
                      fontSize: '11px'
                    }}
                  >
                    <div style={{ color: '#34d399', fontWeight: 'bold', marginBottom: '4px' }}>
                      🧪 CALCULADORA AUTOMÁTICA DE DOSIFICACIÓN SUGERIDA (VOLUMEN PISCINA: 120 m³):
                    </div>
                    {medicionPiscina.cloro_residual_ppm < 1.0 ? (
                      <div style={{ color: '#fbbf24' }}>
                        ⚠️ <strong>Fórmula Activa (Cloro {'<'} 1.0 ppm):</strong> Con Cloro actual en{' '}
                        {medicionPiscina.cloro_residual_ppm.toFixed(1)} ppm {'->'} Aplicar{' '}
                        <strong>{gramosHipocloritoSugeridos} gramos de Hipoclorito de Calcio al 65%</strong> diluidos en skimmer para restablecer a 1.5 ppm.
                      </div>
                    ) : (
                      <div style={{ color: '#cbd5e1' }}>
                        ✓ <strong>Regla de Dosificación:</strong> (Si Cloro {'<'} 1.0 ppm {'->'} Aplicar 185 g de Hipoclorito por cada 1.0 ppm faltante). Lectura actual ({medicionPiscina.cloro_residual_ppm.toFixed(1)} ppm) en rango óptimo: mantener dosificación base de <strong>120 gramos/día</strong>.
                      </div>
                    )}
                    {mlReductorPhSugeridos > 0 && (
                      <div style={{ color: '#fbbf24', marginTop: '4px' }}>
                        ⚠️ <strong>Corrección de pH ({medicionPiscina.ph_actual.toFixed(1)}):</strong> Aplicar{' '}
                        <strong>{mlReductorPhSugeridos} ml de Bisulfato de Sodio (Reductor de pH)</strong>.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Historial de Lecturas del Equipo */}
              <div
                style={{
                  backgroundColor: '#1c1c1f',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '11px'
                }}
              >
                <div style={{ color: '#34d399', fontWeight: 'bold', marginBottom: '8px' }}>
                  📈 HISTORIAL DE LECTURAS TÉCNICAS E INSPECCIONES EN CAMPO:
                </div>
                {ficha.historial_lecturas.map((lec, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: idx < ficha.historial_lecturas.length - 1 ? '1px dashed #262629' : 'none'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#22d3ee' }}>{lec.fecha_hora}</strong> —{' '}
                      <span style={{ color: '#ffffff' }}>{lec.parametro}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#34d399' }}>{lec.resultado}</strong>
                      <span style={{ color: '#94a3b8', marginLeft: '8px' }}>({lec.inspector})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================================
          MODAL 12: 🔍 AUDITORÍA DE INVENTARIO DE HERRAMIENTAS DE CONTRATISTA (SUPERVISOR)
      ============================================================================ */}
      {modalHerramientasSupervisor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#1c1c1f',
              border: '1px solid #22d3ee',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '580px',
              width: '100%',
              fontFamily: 'monospace',
              color: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 'bold' }}>
                [ CONTROL DE SG-SST &amp; CUSTODIA DE HERRAMIENTAS • SUPERVISOR EN CAMPO ]
              </span>
              <button
                type="button"
                onClick={() => setModalHerramientasSupervisor(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px' }}>
              {modalHerramientasSupervisor.nombre_contratista_empresa}
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              NIT: {modalHerramientasSupervisor.cedula_nit} • Unidad Destino:{' '}
              <strong style={{ color: '#ffffff' }}>{modalHerramientasSupervisor.numero_unidad_destino}</strong> ({modalHerramientasSupervisor.propietario_destino})
            </p>

            <div style={{ backgroundColor: '#141416', padding: '14px', borderRadius: '8px', border: '1px solid #262629', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 'bold', marginBottom: '6px' }}>
                ✓ REPORTE DE INGRESO REGISTRADO EN PORTERÍA:
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                Hora de Entrada: <strong>{modalHerramientasSupervisor.hora_ingreso}</strong> • Guarda Responsable: {modalHerramientasSupervisor.guarda_responsable}
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                Labor Autorizada: {modalHerramientasSupervisor.tipo_obra_reparacion}
              </div>
              <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>
                {modalHerramientasSupervisor.entidad_arl_planilla}
              </div>
            </div>

            <div style={{ backgroundColor: '#141416', padding: '14px', borderRadius: '8px', border: '1px solid #262629', marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '10px' }}>
                🧰 DETALLE DE {modalHerramientasSupervisor.herramientas_ingreso.length} HERRAMIENTAS INVENTARIADAS AL INGRESO:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {modalHerramientasSupervisor.herramientas_ingreso.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#1c1c1f',
                      border: '1px solid #262629',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ color: '#ffffff' }}>🛠️ {item}</span>
                    <span style={{ color: '#34d399', fontSize: '10px' }}>✓ En custodia</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setModalHerramientasSupervisor(null)}
                style={{
                  backgroundColor: '#22d3ee',
                  border: 'none',
                  color: '#09090b',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 13: ⚠️ NOTIFICACIÓN Y ALERTA DE PERNOCTA / TIEMPO EXCEDIDO EN BAHÍA
      ============================================================================ */}
      {modalAlertaParqueadero && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#1c1c1f',
              border: '1px solid #fbbf24',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '540px',
              width: '100%',
              fontFamily: 'monospace',
              color: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold' }}>
                [ GESTIÓN DE PERNOCTA &amp; SOBRECUPO EN BAHÍAS DE VISITANTES ]
              </span>
              <button
                type="button"
                onClick={() => setModalAlertaParqueadero(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px' }}>
              Alerta Bahía {modalAlertaParqueadero.codigo_celda} ({modalAlertaParqueadero.ubicacion})
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Vehículo Placa: <strong style={{ color: '#ffffff' }}>{modalAlertaParqueadero.placa_actual}</strong> • Unidad Anfitriona:{' '}
              <strong style={{ color: '#22d3ee' }}>{modalAlertaParqueadero.numero_unidad_visita}</strong> ({modalAlertaParqueadero.propietario_anfitrion})
            </p>

            <div style={{ backgroundColor: '#141416', padding: '12px', borderRadius: '8px', border: '1px solid #262629', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                Hora de Entrada: <strong>{modalAlertaParqueadero.hora_entrada}</strong> • Tiempo Acumulado:{' '}
                <strong style={{ color: modalAlertaParqueadero.estado.includes('Excedido') ? '#ef4444' : '#34d399' }}>
                  {modalAlertaParqueadero.horas_transcurridas?.toFixed(1) || '1.0'} horas
                </strong>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Visitante registrado: {modalAlertaParqueadero.visitante_nombre || 'Visitante particular'}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                OBSERVACIÓN OPERATIVA / NOVEDAD A REGISTRAR EN MINUTA
              </label>
              <textarea
                rows={3}
                value={notaPernoctaInput}
                onChange={e => setNotaPernoctaInput(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#141416',
                  border: '1px solid #262629',
                  color: '#ffffff',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setModalAlertaParqueadero(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #262629',
                  color: '#94a3b8',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  appendAuditLog(
                    'SUPERVISOR_PARKING_OVERTIME_NOTICE',
                    `Supervisor emitió novedad sobre celda ${modalAlertaParqueadero.codigo_celda} (Vehículo ${modalAlertaParqueadero.placa_actual} - ${modalAlertaParqueadero.numero_unidad_visita}): "${notaPernoctaInput}"`,
                    'Supervisor Operativo'
                  );
                  setFeedbackSupervisor({
                    tipo: 'warning',
                    mensaje: `⚠️ Novedad registrada en bitácora para celda ${modalAlertaParqueadero.codigo_celda} (${modalAlertaParqueadero.placa_actual}). Notificado a portería.`
                  });
                  setModalAlertaParqueadero(null);
                }}
                style={{
                  backgroundColor: '#fbbf24',
                  border: 'none',
                  color: '#09090b',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                ⚠️ Registrar Novedad en Minuta de Portería
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
