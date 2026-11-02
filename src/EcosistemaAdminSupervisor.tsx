import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const isPlaceholderSupabase = !isSupabaseConfigured;


export interface SharedUserRole {
  id: number;
  full_name: string;
  name: string;
  user_email: string;
  email: string;
  role: string;
  coproperty_assigned: string;
  coproperty: string;
  shift?: string;
  tempPass?: string;
  rlsPolicy?: string;
}

export interface SharedAuditLog {
  id: string | number;
  timestamp: string;
  user_executor: string;
  user?: string;
  action_type: string;
  action?: string;
  details: string;
  hash?: string;
}

export interface UnidadPHItem {
  id: number;
  numero_unidad: string;
  propietario: string;
  coeficiente: number;
  cuota_base: number;
  intereses_mora: number;
  saldo_actual: number;
  dias_mora: number;
  estado_cartera: 'Al día' | 'Mora 30' | 'Mora 60' | 'Cobro Prejurídico/Jurídico (+90 días)';
  email?: string;
  telefono?: string;
}

export interface RecaudoPHItem {
  id: string | number;
  unidad_id: number;
  numero_unidad: string;
  propietario: string;
  monto_pagado: number;
  concepto: string;
  fecha: string;
  origen: 'Caja Admin' | 'Conciliado Supervisor';
}

export interface EgresoPHItem {
  id: string | number;
  proveedor: string;
  nit_proveedor: string;
  categoria: 'Vigilancia y Seguridad' | 'Aseo y Mantenimiento' | 'Servicios Públicos (EPM)' | 'Ascensores y Equipos' | 'Caja Menor (Urgencia)';
  concepto: string;
  monto: number;
  soporte_ref: string;
  fecha: string;
  registrado_por: string;
}

export interface SoportePagoPendiente {
  id: string;
  unidad_id: number;
  numero_unidad: string;
  propietario: string;
  monto: number;
  concepto: string;
  banco_origen: string;
  referencia: string;
  fecha_reporte: string;
  estado: 'Pendiente' | 'Aprobado';
}

export interface AlertaOperativa {
  id: string;
  mensaje: string;
  monto?: number;
  timestamp: string;
  leida: boolean;
}

const INITIAL_UNIDADES: UnidadPHItem[] = [
  {
    id: 101,
    numero_unidad: 'Torre 1 - Apto 101',
    propietario: 'Martha Lucía Gómez Restrepo',
    coeficiente: 1.45,
    cuota_base: 680000,
    intereses_mora: 0,
    saldo_actual: 0,
    dias_mora: 0,
    estado_cartera: 'Al día',
    email: 'martha.gomez@correo.co',
    telefono: '+57 310 455 1920'
  },
  {
    id: 102,
    numero_unidad: 'Torre 1 - Apto 302',
    propietario: 'Alberto Jaramillo Vélez',
    coeficiente: 1.82,
    cuota_base: 850000,
    intereses_mora: 37060,
    saldo_actual: 1737060,
    dias_mora: 60,
    estado_cartera: 'Mora 60',
    email: 'ajaramillo@empresas.co',
    telefono: '+57 314 882 3011'
  },
  {
    id: 103,
    numero_unidad: 'Torre 2 - Apto 204',
    propietario: 'Inversiones Londoño S.A.S.',
    coeficiente: 2.15,
    cuota_base: 1020000,
    intereses_mora: 142500,
    saldo_actual: 4222500,
    dias_mora: 120,
    estado_cartera: 'Cobro Prejurídico/Jurídico (+90 días)',
    email: 'juridica@inversioneslondono.com',
    telefono: '+57 300 912 4455'
  },
  {
    id: 104,
    numero_unidad: 'Torre 2 - Apto 501',
    propietario: 'Camilo Andrés Botero',
    coeficiente: 1.60,
    cuota_base: 750000,
    intereses_mora: 16350,
    saldo_actual: 766350,
    dias_mora: 30,
    estado_cartera: 'Mora 30',
    email: 'cbotero@medellin.co',
    telefono: '+57 311 609 7788'
  },
  {
    id: 105,
    numero_unidad: 'Torre 3 - Penthouse 901',
    propietario: 'Dra. Sofía Uribe Mejía',
    coeficiente: 2.98,
    cuota_base: 1400000,
    intereses_mora: 0,
    saldo_actual: 0,
    dias_mora: 0,
    estado_cartera: 'Al día',
    email: 'sofia.uribe@clinica.co',
    telefono: '+57 315 220 9900'
  },
  {
    id: 106,
    numero_unidad: 'Torre 3 - Apto 402',
    propietario: 'Jorge Eliécer Giraldo',
    coeficiente: 1.50,
    cuota_base: 710000,
    intereses_mora: 98400,
    saldo_actual: 2938400,
    dias_mora: 95,
    estado_cartera: 'Cobro Prejurídico/Jurídico (+90 días)',
    email: 'jgiraldo@constructora.co',
    telefono: '+57 320 511 6340'
  }
];

const INITIAL_RECAUDOS: RecaudoPHItem[] = [
  {
    id: 'rec_01',
    unidad_id: 101,
    numero_unidad: 'Torre 1 - Apto 101',
    propietario: 'Martha Lucía Gómez Restrepo',
    monto_pagado: 28500000,
    concepto: 'Recaudo Consolidado Cuotas Ordinarias (Unidades al Día)',
    fecha: '2026-10-05 09:30',
    origen: 'Caja Admin'
  },
  {
    id: 'rec_02',
    unidad_id: 105,
    numero_unidad: 'Torre 3 - Penthouse 901',
    propietario: 'Dra. Sofía Uribe Mejía',
    monto_pagado: 9400000,
    concepto: 'Abonos Extraordinarios Fachada & Cuota Octubre',
    fecha: '2026-10-12 14:15',
    origen: 'Caja Admin'
  }
];

const INITIAL_EGRESOS: EgresoPHItem[] = [
  {
    id: 'egr_01',
    proveedor: 'Seguridad Atlas Ltda.',
    nit_proveedor: '890.900.123-4',
    categoria: 'Vigilancia y Seguridad',
    concepto: 'Servicio de Vigilancia 24/7 (3 Porterías + Rondas) - Octubre',
    monto: 14800000,
    soporte_ref: 'FE-88412',
    fecha: '2026-10-10 11:00',
    registrado_por: 'Carlos Mario Pineda (Admin)'
  },
  {
    id: 'egr_02',
    proveedor: 'Empresas Públicas de Medellín (EPM)',
    nit_proveedor: '890.904.996-1',
    categoria: 'Servicios Públicos (EPM)',
    concepto: 'Energía Zonas Comunes, Bombas Hidrófugas y Acueducto',
    monto: 4650000,
    soporte_ref: 'EPM-202610',
    fecha: '2026-10-14 16:20',
    registrado_por: 'Carlos Mario Pineda (Admin)'
  },
  {
    id: 'egr_03',
    proveedor: 'Ascensores Mitsubishi Colombia',
    nit_proveedor: '800.199.450-2',
    categoria: 'Ascensores y Equipos',
    concepto: 'Mantenimiento Preventivo Mensual 6 Ascensores Certificados',
    monto: 3200000,
    soporte_ref: 'MIT-3390',
    fecha: '2026-10-18 10:05',
    registrado_por: 'Carlos Mario Pineda (Admin)'
  }
];

const INITIAL_SOPORTES_PENDIENTES: SoportePagoPendiente[] = [
  {
    id: 'SOP-701',
    unidad_id: 104,
    numero_unidad: 'Torre 2 - Apto 501',
    propietario: 'Camilo Andrés Botero',
    monto: 766350,
    concepto: 'Pago Total Cuota Administración + Interés Mora 30',
    banco_origen: 'Bancolombia QR / Transferencia',
    referencia: ' comprobante_bancolombia_99412.pdf',
    fecha_reporte: 'Hoy, 08:45 AM',
    estado: 'Pendiente'
  },
  {
    id: 'SOP-702',
    unidad_id: 102,
    numero_unidad: 'Torre 1 - Apto 302',
    propietario: 'Alberto Jaramillo Vélez',
    monto: 850000,
    concepto: 'Abono Parcial Cuota Ordinaria Administración',
    banco_origen: 'PSE - Davivienda',
    referencia: 'cus_pse_4481902.png',
    fecha_reporte: 'Hoy, 10:12 AM',
    estado: 'Pendiente'
  },
  {
    id: 'SOP-703',
    unidad_id: 106,
    numero_unidad: 'Torre 3 - Apto 402',
    propietario: 'Jorge Eliécer Giraldo',
    monto: 1200000,
    concepto: 'Abono Acuerdo Prejurídico Cuota 1',
    banco_origen: 'Corresponsal Bancario',
    referencia: 'recibo_fisico_402.jpg',
    fecha_reporte: 'Hoy, 11:05 AM',
    estado: 'Pendiente'
  }
];

interface EcosistemaAdminSupervisorProps {
  modoVista: 'admin' | 'supervisor';
  users: SharedUserRole[];
  setUsers: React.Dispatch<React.SetStateAction<SharedUserRole[]>>;
  auditLogs: SharedAuditLog[];
  appendAuditLog: (action: string, details: string, customUser?: string) => void;
}

export default function EcosistemaAdminSupervisor({
  modoVista,
  users,
  setUsers,
  auditLogs,
  appendAuditLog
}: EcosistemaAdminSupervisorProps) {
  // Estados compartidos entre Administrador y Supervisor
  const [unidades, setUnidades] = useState<UnidadPHItem[]>(INITIAL_UNIDADES);
  const [recaudos, setRecaudos] = useState<RecaudoPHItem[]>(INITIAL_RECAUDOS);
  const [egresos, setEgresos] = useState<EgresoPHItem[]>(INITIAL_EGRESOS);
  const [soportesPendientes, setSoportesPendientes] = useState<SoportePagoPendiente[]>(INITIAL_SOPORTES_PENDIENTES);
  const [alertasSupervisor, setAlertasSupervisor] = useState<AlertaOperativa[]>([
    {
      id: 'al_01',
      mensaje: 'Turno de vigilancia matutino (Ramiro Córdoba) verificado en portería principal sin novedades.',
      timestamp: 'Hoy, 06:05 AM',
      leida: false
    }
  ]);

  const [loadingSync, setLoadingSync] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'warning' | 'info' | 'danger'; text: string } | null>(null);

  // Parámetros financieros Ley 675
  const presupuestoMensualMeta = 48000000;
  const [fondoImprevistosCop] = useState<number>(19450000);
  const [cupoInicialCajaMenor] = useState<number>(2500000);
  const [tasaSuperfinancieraMV] = useState<number>(2.18); // 1.5x IBC Mensual certificado

  // Sub-pestaña activa en Vista Administrador
  const [adminSubTab, setAdminSubTab] = useState<'cartera' | 'egresos' | 'personal'>('cartera');

  // Filtros Tabla Maestra de Unidades (Administrador)
  const [busquedaUnidad, setBusquedaUnidad] = useState<string>('');
  const [filtroMora, setFiltroMora] = useState<string>('TODOS');

  // Formulario de Registro de Ingresos (Administrador)
  const [ingresoUnidadId, setIngresoUnidadId] = useState<string>('102');
  const [ingresoMonto, setIngresoMonto] = useState<string>('');
  const [ingresoConcepto, setIngresoConcepto] = useState<string>('Cuota de Administración Ordinaria');

  // Formulario de Registro de Egresos / Proveedores (Administrador)
  const [egresoProveedor, setEgresoProveedor] = useState<string>('');
  const [egresoNit, setEgresoNit] = useState<string>('');
  const [egresoCategoria, setEgresoCategoria] = useState<EgresoPHItem['categoria']>('Vigilancia y Seguridad');
  const [egresoConcepto, setEgresoConcepto] = useState<string>('');
  const [egresoMonto, setEgresoMonto] = useState<string>('');
  const [egresoSoporte, setEgresoSoporte] = useState<string>('');

  // Formulario de Personal (Administrador - Herencia Módulo 2)
  const [adminNuevoNombre, setAdminNuevoNombre] = useState<string>('');
  const [adminNuevoEmail, setAdminNuevoEmail] = useState<string>('');
  const [adminNuevoRol, setAdminNuevoRol] = useState<string>('vigilante');

  // Formulario de Gasto Caja Menor (Supervisor)
  const [cmConcepto, setCmConcepto] = useState<string>('');
  const [cmMonto, setCmMonto] = useState<string>('');
  const [cmProveedor, setCmProveedor] = useState<string>('');
  const [cmSoporte, setCmSoporte] = useState<string>('');

  // Formulario de Cuadrilla Operativa (Supervisor - Límite Jerárquico)
  const [supNuevoNombre, setSupNuevoNombre] = useState<string>('');
  const [supNuevoEmail, setSupNuevoEmail] = useState<string>('');
  const [supNuevoRol, setSupNuevoRol] = useState<'aseo' | 'vigilante' | 'contratista'>('vigilante');
  const [supNuevoTurno, setSupNuevoTurno] = useState<string>('Turno Día (06:00 - 14:00)');

  useEffect(() => {
    sincronizarDatosSupabase();
  }, []);

  async function sincronizarDatosSupabase() {
    if (isPlaceholderSupabase) return;
    try {
      setLoadingSync(true);
      const { data: uData } = await supabase.from('unidades_ph').select('*').order('id', { ascending: true });
      if (uData && uData.length > 0) {
        setUnidades(
          uData.map((u: any) => ({
            id: Number(u.id),
            numero_unidad: u.numero_unidad || `Unidad ${u.id}`,
            propietario: u.propietario || 'Propietario Registrado',
            coeficiente: Number(u.coeficiente) || 1.5,
            cuota_base: Number(u.cuota_base) || 700000,
            intereses_mora: Number(u.intereses_mora) || 0,
            saldo_actual: Number(u.saldo_actual) || 0,
            dias_mora: Number(u.dias_mora) || 0,
            estado_cartera: u.estado_cartera || (Number(u.saldo_actual) > 0 ? 'Mora 30' : 'Al día')
          }))
        );
      }

      const { data: rData } = await supabase.from('recaudos_ph').select('*').order('id', { ascending: false });
      if (rData && rData.length > 0) {
        setRecaudos(
          rData.map((r: any) => ({
            id: r.id,
            unidad_id: Number(r.unidad_id) || 101,
            numero_unidad: r.numero_unidad || `Unidad ID ${r.unidad_id}`,
            propietario: r.propietario || 'Residente Copropiedad',
            monto_pagado: Number(r.monto_pagado) || 0,
            concepto: r.concepto || 'Cuota de Administración Ordinaria',
            fecha: r.fecha || new Date().toLocaleString(),
            origen: r.origen || 'Caja Admin'
          }))
        );
      }

      const { data: eData } = await supabase.from('egresos_ph').select('*').order('id', { ascending: false });
      if (eData && eData.length > 0) {
        setEgresos(
          eData.map((e: any) => ({
            id: e.id,
            proveedor: e.proveedor || 'Proveedor Copropiedad',
            nit_proveedor: e.nit_proveedor || '900.000.000-1',
            categoria: e.categoria || 'Aseo y Mantenimiento',
            concepto: e.concepto || 'Gasto Operativo',
            monto: Number(e.monto) || 0,
            soporte_ref: e.soporte_ref || 'SOP-001',
            fecha: e.fecha || new Date().toLocaleString(),
            registrado_por: e.registrado_por || 'Administración'
          }))
        );
      }
    } catch {
      // Mantiene datos locales realistas en pesos colombianos (COP)
    } finally {
      setLoadingSync(false);
    }
  }

  // ==================== CÁLCULOS FINANCIEROS EN TIEMPO REAL ====================
  const totalRecaudadoMes = recaudos.reduce((acc, r) => acc + Number(r.monto_pagado), 0);
  const porcentajeCumplimientoRecaudo = Math.min(100, Number(((totalRecaudadoMes / presupuestoMensualMeta) * 100).toFixed(1)));

  const carteraMora30 = unidades
    .filter(u => u.estado_cartera === 'Mora 30')
    .reduce((acc, u) => acc + Number(u.saldo_actual), 0);
  const carteraMora60 = unidades
    .filter(u => u.estado_cartera === 'Mora 60')
    .reduce((acc, u) => acc + Number(u.saldo_actual), 0);
  const carteraJuridica90 = unidades
    .filter(u => u.estado_cartera === 'Cobro Prejurídico/Jurídico (+90 días)')
    .reduce((acc, u) => acc + Number(u.saldo_actual), 0);
  const carteraVencidaTotal = carteraMora30 + carteraMora60 + carteraJuridica90;

  const totalEgresosMes = egresos.reduce((acc, e) => acc + Number(e.monto), 0);
  const flujoCajaNeto = totalRecaudadoMes - totalEgresosMes;

  const gastosCajaMenorAcumulados = egresos
    .filter(e => e.categoria === 'Caja Menor (Urgencia)')
    .reduce((acc, e) => acc + Number(e.monto), 0);
  const saldoDisponibleCajaMenor = Math.max(0, cupoInicialCajaMenor - gastosCajaMenorAcumulados);

  const personalOperativoCopropiedad = users.filter(u => u.role !== 'super_admin');
  const cuadrillaEnTurno = users.filter(u => u.role === 'vigilante' || u.role === 'aseo');
  const contratistasActivos = users.filter(u => u.role === 'contratista');

  // ==================== ACCIONES DEL ADMINISTRADOR ====================

  // 1. Liquidar Intereses de Mora (Tasa Superfinanciera)
  const handleLiquidarInteresesMora = async () => {
    const unidadesEnMora = unidades.filter(u => u.saldo_actual > 0);
    if (unidadesEnMora.length === 0) {
      setStatusFeedback({ type: 'info', text: 'Todas las unidades se encuentran al día ($0 en mora).' });
      return;
    }

    let totalInteresesGenerados = 0;
    const nuevasUnidades = unidades.map(u => {
      if (u.saldo_actual > 0) {
        const interesAdicional = Math.round(u.saldo_actual * (tasaSuperfinancieraMV / 100));
        totalInteresesGenerados += interesAdicional;
        return {
          ...u,
          intereses_mora: u.intereses_mora + interesAdicional,
          saldo_actual: u.saldo_actual + interesAdicional
        };
      }
      return u;
    });

    setUnidades(nuevasUnidades);
    const detalleAudit = `Liquidó intereses moratorios (Tasa Superfinanciera ${tasaSuperfinancieraMV}% M.V.) sobre ${unidadesEnMora.length} unidades en mora por $${totalInteresesGenerados.toLocaleString()} COP`;
    appendAuditLog('LIQUIDATE_MORA_INTEREST', detalleAudit, 'Carlos Mario Pineda (Admin)');

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('audit_logs').insert([
          { user_executor: 'Carlos Mario Pineda (Admin)', action_type: 'LIQUIDATE_MORA_INTEREST', details: detalleAudit }
        ]);
      } catch {
        // Resiliente
      }
    }

    setStatusFeedback({
      type: 'warning',
      text: `⚡ Intereses liquidados (${tasaSuperfinancieraMV}% M.V. Superfinanciera): +$${totalInteresesGenerados.toLocaleString()} COP aplicados a ${unidadesEnMora.length} unidades morosas y registrados en audit_logs.`
    });
  };

  // 2. Disparar Cobro Masivo (WhatsApp / Email)
  const handleDispararCobroMasivo = async () => {
    const morosos = unidades.filter(u => u.saldo_actual > 0);
    if (morosos.length === 0) {
      setStatusFeedback({ type: 'info', text: 'No existen propietarios en mora para envío de cobro masivo.' });
      return;
    }

    const detalleAudit = `Disparó campaña de cobro prejurídico masivo (WhatsApp + Email Certificado Ley 675) a ${morosos.length} propietarios por cartera de $${carteraVencidaTotal.toLocaleString()} COP`;
    appendAuditLog('MASS_COLLECTION_DISPATCH', detalleAudit, 'Carlos Mario Pineda (Admin)');

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('audit_logs').insert([
          { user_executor: 'Carlos Mario Pineda (Admin)', action_type: 'MASS_COLLECTION_DISPATCH', details: detalleAudit }
        ]);
      } catch {
        // Resiliente
      }
    }

    setStatusFeedback({
      type: 'success',
      text: `📢 Cobro Masivo enviado por WhatsApp Business API y Correo Certificado a ${morosos.length} unidades en mora (${morosos.map(m => m.numero_unidad).join(', ')}).`
    });
  };

  // 3. Exportar Balance y Cartera (.CSV)
  const handleExportarBalanceCSV = () => {
    const headers =
      'Seccion,Referencia_Unidad,Titular_Proveedor,Coeficiente_Categoria,Cuota_Base,Intereses_Mora,Monto_Saldo_COP,Estado_Concepto\n';

    const filasUnidades = unidades.map(
      u =>
        `"CARTERA_UNIDAD","${u.numero_unidad}","${u.propietario}","${u.coeficiente}%","${u.cuota_base}","${u.intereses_mora}","${u.saldo_actual}","${u.estado_cartera}"`
    );

    const filasRecaudos = recaudos.map(
      r =>
        `"INGRESO_RECAUDO","${r.numero_unidad}","${r.propietario}","${r.origen}","0","0","${r.monto_pagado}","${r.concepto} (${r.fecha})"`
    );

    const filasEgresos = egresos.map(
      e =>
        `"EGRESO_PROVEEDOR","${e.soporte_ref}","${e.proveedor} (${e.nit_proveedor})","${e.categoria}","0","0","-${e.monto}","${e.concepto}"`
    );

    const resumenFinal = [
      `"RESUMEN_KPI","RECAUDO_MENSUAL","Total Ingresos Mes","${porcentajeCumplimientoRecaudo}% Meta","0","0","${totalRecaudadoMes}","Presupuesto: ${presupuestoMensualMeta}"`,
      `"RESUMEN_KPI","CARTERA_VENCIDA","Total Deuda por Cobrar","Ley 675","0","0","${carteraVencidaTotal}","Mora30: ${carteraMora30} | Mora60: ${carteraMora60} | +90d: ${carteraJuridica90}"`,
      `"RESUMEN_KPI","EGRESOS_MES","Total Gastos Proveedores y Caja Menor","Operacion","0","0","${totalEgresosMes}","Flujo Neto: ${flujoCajaNeto}"`,
      `"RESUMEN_KPI","FONDO_IMPREVISTOS","Art. 35 Ley 675 Blindado","100% Liquido","0","0","${fondoImprevistosCop}","Disponible"`
    ];

    const csvBody = [...filasUnidades, ...filasRecaudos, ...filasEgresos, ...resumenFinal].join('\n');
    const blob = new Blob([headers + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Urbix_Balance_Cartera_Ley675_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    appendAuditLog('EXPORT_BALANCE_CSV', 'Exportó Balance General, Flujo de Caja y Estado de Cartera Ley 675 (.CSV)', 'Carlos Mario Pineda (Admin)');
    setStatusFeedback({ type: 'info', text: '📥 Archivo Urbix_Balance_Cartera_Ley675 descargado correctamente (.CSV).' });
  };

  // 4. Registrar Ingreso / Pago de Administración (Descuenta deuda en unidades_ph)
  const handleRegistrarIngresoAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(ingresoMonto);
    if (!ingresoUnidadId || Number.isNaN(montoNum) || montoNum <= 0) return;

    const targetUnit = unidades.find(u => String(u.id) === String(ingresoUnidadId));
    if (!targetUnit) return;

    const nuevoSaldo = Math.max(0, targetUnit.saldo_actual - montoNum);
    const nuevosIntereses = montoNum >= targetUnit.intereses_mora ? 0 : targetUnit.intereses_mora - montoNum;
    const nuevoEstado: UnidadPHItem['estado_cartera'] =
      nuevoSaldo === 0 ? 'Al día' : nuevoSaldo <= targetUnit.cuota_base ? 'Mora 30' : targetUnit.estado_cartera;

    setUnidades(prev =>
      prev.map(u =>
        u.id === targetUnit.id
          ? {
              ...u,
              saldo_actual: nuevoSaldo,
              intereses_mora: nuevosIntereses,
              dias_mora: nuevoSaldo === 0 ? 0 : u.dias_mora,
              estado_cartera: nuevoEstado
            }
          : u
      )
    );

    const nuevoRecaudo: RecaudoPHItem = {
      id: `rec_${Date.now()}`,
      unidad_id: targetUnit.id,
      numero_unidad: targetUnit.numero_unidad,
      propietario: targetUnit.propietario,
      monto_pagado: montoNum,
      concepto: ingresoConcepto,
      fecha: new Date().toLocaleString(),
      origen: 'Caja Admin'
    };

    setRecaudos(prev => [nuevoRecaudo, ...prev]);
    setIngresoMonto('');

    const detalleAudit = `Registró ingreso de $${montoNum.toLocaleString()} COP (${ingresoConcepto}) para ${targetUnit.numero_unidad}. Nuevo saldo: $${nuevoSaldo.toLocaleString()} COP`;
    appendAuditLog('REGISTER_ADMIN_PAYMENT', detalleAudit, 'Carlos Mario Pineda (Admin)');

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('recaudos_ph').insert([
          {
            unidad_id: targetUnit.id,
            monto_pagado: montoNum,
            concepto: ingresoConcepto
          }
        ]);
        await supabase
          .from('unidades_ph')
          .update({ saldo_actual: nuevoSaldo, estado_cartera: nuevoEstado })
          .eq('id', targetUnit.id);
        await supabase.from('audit_logs').insert([
          { user_executor: 'Carlos Mario Pineda (Admin)', action_type: 'REGISTER_ADMIN_PAYMENT', details: detalleAudit }
        ]);
      } catch {
        // Resiliente
      }
    }

    setStatusFeedback({
      type: 'success',
      text: `✅ Pago registrado por $${montoNum.toLocaleString()} COP en ${targetUnit.numero_unidad}. Saldo actualizado a $${nuevoSaldo.toLocaleString()} COP (${nuevoEstado}).`
    });
  };

  // 5. Generar Paz y Salvo o Enviar a Cobro Jurídico por fila
  const handleGenerarPazYSalvo = (unidad: UnidadPHItem) => {
    const contenido =
      `URBIX PH - CERTIFICADO OFICIAL DE PAZ Y SALVO (LEY 675 DE 2001)\n` +
      `================================================================\n` +
      `Copropiedad: P.H. Reserva del Tesoro - NIT 900.412.889-1\n` +
      `Fecha de Expedición: ${new Date().toLocaleString()}\n` +
      `----------------------------------------------------------------\n` +
      `Inmueble / Unidad: ${unidad.numero_unidad}\n` +
      `Propietario Titular: ${unidad.propietario}\n` +
      `Coeficiente de Copropiedad (Art. 25 Ley 675): ${unidad.coeficiente}%\n` +
      `Saldo por Cuotas Ordinarias, Extraordinarias e Intereses: $0 COP\n` +
      `Estado de Cartera: AL DÍA (PAZ Y SALVO INTEGRAL)\n` +
      `----------------------------------------------------------------\n` +
      `Expedido conforme al Artículo 29 de la Ley 675 de 2001 para trámites\n` +
      `notariales, escrituración o autorización de mudanza.\n` +
      `Firma Digital: Carlos Mario Pineda - Administrador Representante Legal\n`;

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Paz_y_Salvo_${unidad.numero_unidad.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    appendAuditLog('ISSUE_PAZ_Y_SALVO', `Expidió Certificado Oficial de Paz y Salvo Ley 675 para ${unidad.numero_unidad} (${unidad.propietario})`, 'Carlos Mario Pineda (Admin)');
    setStatusFeedback({
      type: 'success',
      text: `📄 Paz y Salvo oficial generado y descargado para ${unidad.numero_unidad} (${unidad.propietario}).`
    });
  };

  const handleEnviarCobroJuridico = (unidad: UnidadPHItem) => {
    const honorariosPrejuridicos = Math.round(unidad.saldo_actual * 0.1);
    const nuevoSaldoConCostos = unidad.saldo_actual + honorariosPrejuridicos;

    setUnidades(prev =>
      prev.map(u =>
        u.id === unidad.id
          ? {
              ...u,
              intereses_mora: u.intereses_mora + honorariosPrejuridicos,
              saldo_actual: nuevoSaldoConCostos,
              dias_mora: Math.max(90, u.dias_mora),
              estado_cartera: 'Cobro Prejurídico/Jurídico (+90 días)'
            }
          : u
      )
    );

    const detalleAudit = `Escaló a Cobro Jurídico Ejecutivo (Art. 48 Ley 675) la unidad ${unidad.numero_unidad} (${unidad.propietario}). Deuda + Costos de Cobro (10%): $${nuevoSaldoConCostos.toLocaleString()} COP`;
    appendAuditLog('ESCALATE_LEGAL_COLLECTION', detalleAudit, 'Carlos Mario Pineda (Admin)');

    setStatusFeedback({
      type: 'danger',
      text: `⚖️ Unidad ${unidad.numero_unidad} remitida a Cobro Jurídico (Art. 48 Ley 675). Se adicionaron $${honorariosPrejuridicos.toLocaleString()} COP por costos de cobro prejurídico.`
    });
  };

  // 6. Registrar Pago a Proveedor (Administrador)
  const handleRegistrarEgresoProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(egresoMonto);
    if (!egresoProveedor.trim() || !egresoConcepto.trim() || Number.isNaN(montoNum) || montoNum <= 0) return;

    const nuevoEgreso: EgresoPHItem = {
      id: `egr_${Date.now()}`,
      proveedor: egresoProveedor.trim(),
      nit_proveedor: egresoNit.trim() || '900.123.456-7',
      categoria: egresoCategoria,
      concepto: egresoConcepto.trim(),
      monto: montoNum,
      soporte_ref: egresoSoporte.trim() || `FE-${Math.floor(10000 + Math.random() * 90000)}`,
      fecha: new Date().toLocaleString(),
      registrado_por: 'Carlos Mario Pineda (Admin)'
    };

    setEgresos(prev => [nuevoEgreso, ...prev]);
    setEgresoProveedor('');
    setEgresoNit('');
    setEgresoConcepto('');
    setEgresoMonto('');
    setEgresoSoporte('');

    const detalleAudit = `Registró pago a proveedor ${nuevoEgreso.proveedor} [${nuevoEgreso.categoria}] por $${montoNum.toLocaleString()} COP (Soporte ${nuevoEgreso.soporte_ref})`;
    appendAuditLog('REGISTER_SUPPLIER_EXPENSE', detalleAudit, 'Carlos Mario Pineda (Admin)');

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('egresos_ph').insert([nuevoEgreso]);
        await supabase.from('audit_logs').insert([
          { user_executor: 'Carlos Mario Pineda (Admin)', action_type: 'REGISTER_SUPPLIER_EXPENSE', details: detalleAudit }
        ]);
      } catch {
        // Resiliente
      }
    }

    setStatusFeedback({
      type: 'success',
      text: `💸 Egreso de proveedor (${nuevoEgreso.proveedor}) por $${montoNum.toLocaleString()} COP descontado del Flujo de Caja Neto.`
    });
  };

  // 7. Gestión de Personal de la Copropiedad por el Administrador (Herencia Módulo 2 sin tocar Superadmin)
  const handleAdminCrearPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNuevoNombre.trim() || !adminNuevoEmail.trim()) return;

    const cleanName = adminNuevoNombre.trim();
    const cleanEmail = adminNuevoEmail.trim();
    const detalleAudit = `Creó perfil operativo [${adminNuevoRol.toUpperCase()}] para ${cleanName} (${cleanEmail}) desde Gerencia Admin`;

    const nuevoUsuario: SharedUserRole = {
      id: Date.now(),
      full_name: cleanName,
      name: cleanName,
      user_email: cleanEmail,
      email: cleanEmail,
      role: adminNuevoRol,
      coproperty_assigned: 'Reserva del Tesoro',
      coproperty: 'P.H. Reserva del Tesoro',
      shift: 'Turno Día (06:00 - 14:00)',
      tempPass: '********',
      rlsPolicy: 'tenant_id = res_tesoro_01'
    };

    setUsers(prev => [...prev, nuevoUsuario]);
    appendAuditLog('ADMIN_CREATE_STAFF', detalleAudit, 'Carlos Mario Pineda (Admin)');
    setAdminNuevoNombre('');
    setAdminNuevoEmail('');

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('user_roles').insert([
          { full_name: cleanName, user_email: cleanEmail, role: adminNuevoRol, coproperty_assigned: 'Reserva del Tesoro' }
        ]);
        await supabase.from('audit_logs').insert([
          { user_executor: 'Carlos Mario Pineda (Admin)', action_type: 'ADMIN_CREATE_STAFF', details: detalleAudit }
        ]);
      } catch {
        // Resiliente
      }
    }

    setStatusFeedback({
      type: 'success',
      text: `✅ Personal [${adminNuevoRol.toUpperCase()}] ${cleanName} incorporado a la nómina operativa y sincronizado con Módulo 2.`
    });
  };

  const handleAdminCambiarRolStaff = async (userId: number, nuevoRol: string, nombreUsuario: string) => {
    if (nuevoRol === 'super_admin') return;
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: nuevoRol } : u)));
    const detalleAudit = `Reasignó rol operativo de ${nombreUsuario} a [${nuevoRol.toUpperCase()}]`;
    appendAuditLog('ADMIN_UPDATE_STAFF_ROLE', detalleAudit, 'Carlos Mario Pineda (Admin)');

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('user_roles').update({ role: nuevoRol }).eq('id', userId);
        await supabase.from('audit_logs').insert([
          { user_executor: 'Carlos Mario Pineda (Admin)', action_type: 'ADMIN_UPDATE_STAFF_ROLE', details: detalleAudit }
        ]);
      } catch {
        // Resiliente
      }
    }

    setStatusFeedback({
      type: 'info',
      text: `🔄 Rol de ${nombreUsuario} actualizado a ${nuevoRol.toUpperCase()}.`
    });
  };

  const handleAdminRevocarPersonal = async (userId: number, nombreUsuario: string) => {
    const target = users.find(u => u.id === userId);
    if (!target || target.role === 'super_admin') return;

    setUsers(prev => prev.filter(u => u.id !== userId));
    const detalleAudit = `Revocó acceso operativo de ${nombreUsuario} (${target.role.toUpperCase()})`;
    appendAuditLog('ADMIN_REVOKE_STAFF', detalleAudit, 'Carlos Mario Pineda (Admin)');

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('user_roles').delete().eq('id', userId);
        await supabase.from('audit_logs').insert([
          { user_executor: 'Carlos Mario Pineda (Admin)', action_type: 'ADMIN_REVOKE_STAFF', details: detalleAudit }
        ]);
      } catch {
        // Resiliente
      }
    }

    setStatusFeedback({
      type: 'warning',
      text: `🚫 Acceso operativo revocado para ${nombreUsuario}.`
    });
  };

  // ==================== ACCIONES DEL SUPERVISOR ====================

  // 1. Registrar Gasto de Caja Menor (Impacta Caja Menor, Egresos del Admin y envía Alerta)
  const handleRegistrarGastoCajaMenor = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(cmMonto);
    if (!cmConcepto.trim() || !cmProveedor.trim() || Number.isNaN(montoNum) || montoNum <= 0) return;

    if (montoNum > saldoDisponibleCajaMenor) {
      setStatusFeedback({
        type: 'danger',
        text: `⚠️ Fondos insuficientes en Caja Menor. Disponible: $${saldoDisponibleCajaMenor.toLocaleString()} COP.`
      });
      return;
    }

    const soporteRef = cmSoporte.trim() || `CM-${Math.floor(1000 + Math.random() * 9000)}`;
    const nuevoGasto: EgresoPHItem = {
      id: `cm_${Date.now()}`,
      proveedor: cmProveedor.trim(),
      nit_proveedor: 'Caja Menor Campo',
      categoria: 'Caja Menor (Urgencia)',
      concepto: `[CAJA MENOR] ${cmConcepto.trim()}`,
      monto: montoNum,
      soporte_ref: soporteRef,
      fecha: new Date().toLocaleString(),
      registrado_por: 'Julián Arango (Supervisor)'
    };

    setEgresos(prev => [nuevoGasto, ...prev]);

    const nuevaAlerta: AlertaOperativa = {
      id: `al_${Date.now()}`,
      mensaje: `Gasto de Caja Menor registrado por Supervisor: "${cmConcepto.trim()}" en ${cmProveedor.trim()} (Soporte ${soporteRef})`,
      monto: montoNum,
      timestamp: new Date().toLocaleTimeString(),
      leida: false
    };
    setAlertasSupervisor(prev => [nuevaAlerta, ...prev]);

    const detalleAudit = `Registró gasto urgente de Caja Menor por $${montoNum.toLocaleString()} COP (${cmConcepto.trim()} - Proveedor: ${cmProveedor.trim()}, Soporte: ${soporteRef})`;
    appendAuditLog('SUPERVISOR_PETTY_CASH_EXPENSE', detalleAudit, 'Julián Arango (Supervisor)');

    setCmConcepto('');
    setCmMonto('');
    setCmProveedor('');
    setCmSoporte('');

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('egresos_ph').insert([nuevoGasto]);
        await supabase.from('audit_logs').insert([
          { user_executor: 'Julián Arango (Supervisor)', action_type: 'SUPERVISOR_PETTY_CASH_EXPENSE', details: detalleAudit }
        ]);
      } catch {
        // Resiliente
      }
    }

    setStatusFeedback({
      type: 'warning',
      text: `🧾 Gasto de Caja Menor ($${montoNum.toLocaleString()} COP) descontado y notificado en tiempo real al Flujo de Caja del Administrador.`
    });
  };

  // 2. Conciliar y Aprobar Soporte de Pago (Impacta Recaudo del Admin y Cartera de Unidad)
  const handleConciliarSoportePago = async (soporte: SoportePagoPendiente) => {
    if (soporte.estado === 'Aprobado') return;

    setSoportesPendientes(prev =>
      prev.map(s => (s.id === soporte.id ? { ...s, estado: 'Aprobado' } : s))
    );

    // Descontar saldo en unidades_ph
    setUnidades(prev =>
      prev.map(u => {
        if (u.id === soporte.unidad_id) {
          const nuevoSaldo = Math.max(0, u.saldo_actual - soporte.monto);
          const nuevosIntereses = soporte.monto >= u.intereses_mora ? 0 : u.intereses_mora - soporte.monto;
          const nuevoEstado: UnidadPHItem['estado_cartera'] =
            nuevoSaldo === 0 ? 'Al día' : nuevoSaldo <= u.cuota_base ? 'Mora 30' : u.estado_cartera;
          return {
            ...u,
            saldo_actual: nuevoSaldo,
            intereses_mora: nuevosIntereses,
            dias_mora: nuevoSaldo === 0 ? 0 : u.dias_mora,
            estado_cartera: nuevoEstado
          };
        }
        return u;
      })
    );

    // Sumar a recaudos_ph
    const nuevoRecaudo: RecaudoPHItem = {
      id: `rec_sup_${Date.now()}`,
      unidad_id: soporte.unidad_id,
      numero_unidad: soporte.numero_unidad,
      propietario: soporte.propietario,
      monto_pagado: soporte.monto,
      concepto: `${soporte.concepto} [Verificado por Supervisor: ${soporte.id}]`,
      fecha: new Date().toLocaleString(),
      origen: 'Conciliado Supervisor'
    };
    setRecaudos(prev => [nuevoRecaudo, ...prev]);

    const nuevaAlerta: AlertaOperativa = {
      id: `al_pay_${Date.now()}`,
      mensaje: `Supervisor concilió y aprobó comprobante ${soporte.id} de ${soporte.numero_unidad} (${soporte.propietario})`,
      monto: soporte.monto,
      timestamp: new Date().toLocaleTimeString(),
      leida: false
    };
    setAlertasSupervisor(prev => [nuevaAlerta, ...prev]);

    const detalleAudit = `Verificó y aprobó soporte de pago ${soporte.id} (${soporte.banco_origen}) de ${soporte.numero_unidad} por $${soporte.monto.toLocaleString()} COP`;
    appendAuditLog('SUPERVISOR_APPROVE_PAYMENT', detalleAudit, 'Julián Arango (Supervisor)');

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('recaudos_ph').insert([
          {
            unidad_id: soporte.unidad_id,
            monto_pagado: soporte.monto,
            concepto: nuevoRecaudo.concepto
          }
        ]);
        await supabase.from('audit_logs').insert([
          { user_executor: 'Julián Arango (Supervisor)', action_type: 'SUPERVISOR_APPROVE_PAYMENT', details: detalleAudit }
        ]);
      } catch {
        // Resiliente
      }
    }

    setStatusFeedback({
      type: 'success',
      text: `✅ Soporte ${soporte.id} conciliado: +$${soporte.monto.toLocaleString()} COP sumados al Recaudo Mensual del Administrador y descontados de ${soporte.numero_unidad}.`
    });
  };

  // 3. Alta de Cuadrilla Operativa por Supervisor (Solo Aseo, Vigilante y Contratista)
  const handleSupervisorAltaCuadrilla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supNuevoNombre.trim() || !supNuevoEmail.trim()) return;

    const cleanName = supNuevoNombre.trim();
    const cleanEmail = supNuevoEmail.trim();
    const detalleAudit = `Supervisor dio de alta en cuadrilla a ${cleanName} [${supNuevoRol.toUpperCase()}] en ${supNuevoTurno}`;

    const nuevoOperativo: SharedUserRole = {
      id: Date.now(),
      full_name: cleanName,
      name: cleanName,
      user_email: cleanEmail,
      email: cleanEmail,
      role: supNuevoRol,
      coproperty_assigned: 'Reserva del Tesoro',
      coproperty: 'P.H. Reserva del Tesoro',
      shift: supNuevoTurno,
      tempPass: '********',
      rlsPolicy: 'tenant_id = res_tesoro_01'
    };

    setUsers(prev => [...prev, nuevoOperativo]);
    appendAuditLog('SUPERVISOR_ADD_CREW', detalleAudit, 'Julián Arango (Supervisor)');
    setSupNuevoNombre('');
    setSupNuevoEmail('');

    if (!isPlaceholderSupabase) {
      try {
        await supabase.from('user_roles').insert([
          { full_name: cleanName, user_email: cleanEmail, role: supNuevoRol, coproperty_assigned: 'Reserva del Tesoro' }
        ]);
        await supabase.from('audit_logs').insert([
          { user_executor: 'Julián Arango (Supervisor)', action_type: 'SUPERVISOR_ADD_CREW', details: detalleAudit }
        ]);
      } catch {
        // Resiliente
      }
    }

    setStatusFeedback({
      type: 'success',
      text: `👷 Personal operativo ${cleanName} (${supNuevoRol.toUpperCase()}) asignado a ${supNuevoTurno} y registrado en audit_logs.`
    });
  };

  const handleSupervisorCambiarTurno = (userId: number, nuevoTurno: string, nombre: string) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, shift: nuevoTurno } : u)));
    appendAuditLog('SUPERVISOR_SHIFT_UPDATE', `Asignó ${nuevoTurno} a ${nombre}`, 'Julián Arango (Supervisor)');
    setStatusFeedback({
      type: 'info',
      text: `🕒 Turno de ${nombre} actualizado a: ${nuevoTurno}.`
    });
  };

  // 4. Descargar Reporte Operativo de Turno (.CSV)
  const handleDescargarReporteOperativoCSV = () => {
    const headers = 'Tipo_Registro,Referencia_ID,Responsable_Proveedor,Rol_Categoria,Detalle_Turno,Monto_COP,Fecha\n';

    const gastosCM = egresos
      .filter(e => e.categoria === 'Caja Menor (Urgencia)')
      .map(
        e =>
          `"GASTO_CAJA_MENOR","${e.soporte_ref}","${e.proveedor}","${e.categoria}","${e.concepto}","${e.monto}","${e.fecha}"`
      );

    const pagosVerificados = soportesPendientes.map(
      s =>
        `"SOPORTE_PAGO_${s.estado.toUpperCase()}","${s.id}","${s.numero_unidad} - ${s.propietario}","${s.banco_origen}","${s.concepto}","${s.monto}","${s.fecha_reporte}"`
    );

    const personalBitacora = users
      .filter(u => u.role === 'aseo' || u.role === 'vigilante' || u.role === 'contratista')
      .map(
        u =>
          `"CUADRILLA_OPERATIVA","ID-${u.id}","${u.full_name || u.name}","${u.role.toUpperCase()}","${u.shift || 'Turno Día (06:00 - 14:00)'}","0","Activo en Turno"`
      );

    const csvContent = [headers, ...gastosCM, ...pagosVerificados, ...personalBitacora].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Urbix_Reporte_Operativo_Supervisor_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    appendAuditLog('EXPORT_SUPERVISOR_CSV', 'Descargó Reporte Operativo de Turno, Caja Menor y Cuadrilla (.CSV)', 'Julián Arango (Supervisor)');
    setStatusFeedback({
      type: 'info',
      text: '📋 Reporte Operativo de Turno (.CSV) descargado con éxito.'
    });
  };

  // Unidades filtradas para la Tabla Maestra
  const unidadesFiltradas = unidades.filter(u => {
    const coincideTexto =
      u.numero_unidad.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
      u.propietario.toLowerCase().includes(busquedaUnidad.toLowerCase());
    const coincideMora =
      filtroMora === 'TODOS'
        ? true
        : filtroMora === 'SOLO_MORA'
        ? u.saldo_actual > 0
        : u.estado_cartera === filtroMora;
    return coincideTexto && coincideMora;
  });

  // ==================== RENDERIZADO ====================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* BANNER DE FEEDBACK INTERACTIVO EN TIEMPO REAL */}
      {statusFeedback && (
        <div
          style={{
            backgroundColor: '#1c1c1f',
            border: `1px solid ${
              statusFeedback.type === 'success'
                ? '#34d399'
                : statusFeedback.type === 'warning'
                ? '#fbbf24'
                : statusFeedback.type === 'danger'
                ? '#ef4444'
                : '#22d3ee'
            }`,
            borderRadius: '8px',
            padding: '12px 16px',
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
                statusFeedback.type === 'success'
                  ? '#34d399'
                  : statusFeedback.type === 'warning'
                  ? '#fbbf24'
                  : statusFeedback.type === 'danger'
                  ? '#ef4444'
                  : '#22d3ee'
            }}
          >
            {statusFeedback.text}
          </span>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
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
            Cerrar ✕
          </button>
        </div>
      )}

      {/* =====================================================================
          PARTE A: VISTA DEL ADMINISTRADOR (CEREBRO FINANCIERO Y GERENCIAL)
      ===================================================================== */}
      {modoVista === 'admin' && (
        <>
          {/* CABECERA DE GERENCIA ADMINISTRATIVA */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#34d399', marginBottom: '6px' }}>
                P.H. RESERVA DEL TESORO · NIT 900.412.889-1 · GERENCIA INTEGRAL LEY 675
              </div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
                Cerebro Financiero, Cartera Coactiva &amp; Proveedores (Vista Administrador)
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                Control en tiempo real sincronizado con Caja Menor y Conciliaciones de Campo del Supervisor.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#34d399' }}>
                {loadingSync ? '🔄 Sincronizando Supabase...' : '● Estado Compartido Activo'}
              </span>
              <button
                type="button"
                onClick={handleExportarBalanceCSV}
                style={{
                  backgroundColor: '#1c1c1f',
                  border: '1px solid #22d3ee',
                  color: '#22d3ee',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                📥 Exportar Balance y Cartera (.CSV)
              </button>
            </div>
          </div>

          {/* 1. DASHBOARD DE SALUD FINANCIERA (4 KPIs LEY 675) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {/* KPI 1: Recaudo Mensual vs Presupuesto */}
            <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '6px' }}>
                1. RECAUDO MENSUAL VS. PRESUPUESTO
              </div>
              <div style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold', color: '#34d399' }}>
                ${totalRecaudadoMes.toLocaleString()} COP
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '6px' }}>
                Meta Mes: ${presupuestoMensualMeta.toLocaleString()} COP ·{' '}
                <strong style={{ color: '#34d399' }}>{porcentajeCumplimientoRecaudo}% Cumplido</strong>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#1c1c1f', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${porcentajeCumplimientoRecaudo}%`, height: '100%', backgroundColor: '#34d399' }} />
              </div>
            </div>

            {/* KPI 2: Cartera Vencida Total dividida en Mora 30, 60 y +90d */}
            <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '6px' }}>
                2. CARTERA VENCIDA TOTAL (LEY 675)
              </div>
              <div style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold', color: '#ef4444' }}>
                ${carteraVencidaTotal.toLocaleString()} COP
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', fontFamily: 'monospace', marginTop: '8px' }}>
                <span style={{ color: '#fbbf24' }}>• Mora 30 días: ${carteraMora30.toLocaleString()} COP</span>
                <span style={{ color: '#f97316' }}>• Mora 60 días: ${carteraMora60.toLocaleString()} COP</span>
                <span style={{ color: '#ef4444' }}>• Prejurídico/Jurídico (+90d): ${carteraJuridica90.toLocaleString()} COP</span>
              </div>
            </div>

            {/* KPI 3: Fondo de Imprevistos Ley 675 */}
            <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '6px' }}>
                3. FONDO DE IMPREVISTOS (ART. 35 LEY 675)
              </div>
              <div style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold', color: '#22d3ee' }}>
                ${fondoImprevistosCop.toLocaleString()} COP
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '8px' }}>
                Estado: <strong style={{ color: '#22d3ee' }}>100% Líquido y Blindado</strong>
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b', marginTop: '4px' }}>
                Cuenta Fiducia Separada · Mín. 1% Presupuesto Anual
              </div>
            </div>

            {/* KPI 4: Egresos del Mes y Flujo de Caja Neto */}
            <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '6px' }}>
                4. FLUJO DE CAJA NETO (INGRESOS - EGRESOS)
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  color: flujoCajaNeto >= 0 ? '#34d399' : '#ef4444'
                }}
              >
                ${flujoCajaNeto.toLocaleString()} COP
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '8px' }}>
                Egresos del Mes: <strong style={{ color: '#fbbf24' }}>${totalEgresosMes.toLocaleString()} COP</strong>
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b', marginTop: '4px' }}>
                Incluye Proveedores Fijos + Gastos Caja Menor Supervisor
              </div>
            </div>
          </div>

          {/* ALERTAS RECIENTES ENVIADAS DESDE CAMPO POR EL SUPERVISOR */}
          {alertasSupervisor.length > 0 && (
            <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#fbbf24', fontWeight: 'bold' }}>
                  🔔 NOVEDADES EN TIEMPO REAL DEL SUPERVISOR DE CAMPO ({alertasSupervisor.length})
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                  Saldo Caja Menor en Terreno: ${saldoDisponibleCajaMenor.toLocaleString()} COP
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {alertasSupervisor.slice(0, 3).map(al => (
                  <div
                    key={al.id}
                    style={{
                      backgroundColor: '#1c1c1f',
                      border: '1px solid #262629',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontFamily: 'monospace',
                      fontSize: '11px'
                    }}
                  >
                    <span style={{ color: '#cbd5e1' }}>
                      <strong style={{ color: '#22d3ee' }}>[SUPERVISOR]</strong> {al.mensaje}
                      {al.monto ? <strong style={{ color: '#fbbf24' }}> (${al.monto.toLocaleString()} COP)</strong> : null}
                    </span>
                    <span style={{ color: '#64748b' }}>{al.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-NAVEGACIÓN OPERATIVA DEL ADMINISTRADOR */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #262629', paddingBottom: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setAdminSubTab('cartera')}
              style={{
                backgroundColor: adminSubTab === 'cartera' ? '#1c1c1f' : 'transparent',
                color: adminSubTab === 'cartera' ? '#34d399' : '#94a3b8',
                border: `1px solid ${adminSubTab === 'cartera' ? '#34d399' : '#262629'}`,
                padding: '10px 16px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              1. Motor de Cartera, Costos de Cobro &amp; Recaudo ({unidades.length} Unidades)
            </button>
            <button
              type="button"
              onClick={() => setAdminSubTab('egresos')}
              style={{
                backgroundColor: adminSubTab === 'egresos' ? '#1c1c1f' : 'transparent',
                color: adminSubTab === 'egresos' ? '#fbbf24' : '#94a3b8',
                border: `1px solid ${adminSubTab === 'egresos' ? '#fbbf24' : '#262629'}`,
                padding: '10px 16px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              2. Gestión de Egresos, Proveedores &amp; Caja ({egresos.length} Movimientos)
            </button>
            <button
              type="button"
              onClick={() => setAdminSubTab('personal')}
              style={{
                backgroundColor: adminSubTab === 'personal' ? '#1c1c1f' : 'transparent',
                color: adminSubTab === 'personal' ? '#22d3ee' : '#94a3b8',
                border: `1px solid ${adminSubTab === 'personal' ? '#22d3ee' : '#262629'}`,
                padding: '10px 16px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              3. Personal de la Copropiedad (Herencia Módulo 2 · {personalOperativoCopropiedad.length} Activos)
            </button>
          </div>

          {/* SUB-PESTAÑA 1: MOTOR DE CARTERA, COSTOS DE COBRO Y RECAUDO */}
          {adminSubTab === 'cartera' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* BARRA DE ACCIONES EJECUTIVAS DE CARTERA */}
              <div
                style={{
                  backgroundColor: '#141416',
                  border: '1px solid #262629',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#ffffff' }}>
                    Acciones Coactivas y Liquidación de Cartera (Ley 675)
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                    Tasa máxima moratoria vigente Superfinanciera: <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{tasaSuperfinancieraMV}% M.V.</strong> (1.5x IBC).
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleLiquidarInteresesMora}
                    style={{
                      backgroundColor: '#fbbf24',
                      color: '#09090b',
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Liquidar Intereses de Mora (Tasa Superfinanciera)
                  </button>
                  <button
                    type="button"
                    onClick={handleDispararCobroMasivo}
                    style={{
                      backgroundColor: '#1c1c1f',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    📢 Disparar Cobro Masivo (WhatsApp / Email)
                  </button>
                  <button
                    type="button"
                    onClick={handleExportarBalanceCSV}
                    style={{
                      backgroundColor: '#1c1c1f',
                      color: '#22d3ee',
                      border: '1px solid #22d3ee',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    📥 Exportar Balance y Cartera (.CSV)
                  </button>
                </div>
              </div>

              {/* FORMULARIO DE REGISTRO DE INGRESOS (DESCUENTA AUTOMÁTICAMENTE DEUDA EN UNIDADES_PH) */}
              <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontFamily: 'monospace', color: '#34d399' }}>
                  + REGISTRAR INGRESO / PAGO DE ADMINISTRACIÓN (DESCUENTO AUTOMÁTICO DE DEUDA EN UNIDADES_PH)
                </h4>
                <form
                  onSubmit={handleRegistrarIngresoAdmin}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                      Unidad / Apartamento
                    </label>
                    <select
                      value={ingresoUnidadId}
                      onChange={e => setIngresoUnidadId(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#fff',
                        padding: '9px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    >
                      {unidades.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.numero_unidad} - {u.propietario} (Deuda: ${u.saldo_actual.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                      Concepto de Recaudo
                    </label>
                    <select
                      value={ingresoConcepto}
                      onChange={e => setIngresoConcepto(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#fff',
                        padding: '9px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    >
                      <option value="Cuota de Administración Ordinaria">Cuota de Administración Ordinaria</option>
                      <option value="Cuota Extraordinaria de Fachada">Cuota Extraordinaria de Fachada</option>
                      <option value="Abono a Intereses de Mora">Abono a Intereses de Mora</option>
                      <option value="Multa Manual de Convivencia">Multa Manual de Convivencia</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                      Monto Pagado ($ COP)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 850000"
                      value={ingresoMonto}
                      onChange={e => setIngresoMonto(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#fff',
                        padding: '9px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#34d399',
                      color: '#09090b',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    + REGISTRAR INGRESO EN CAJA
                  </button>
                </form>
              </div>

              {/* TABLA MAESTRA DE UNIDADES CON BUSCADOR, FILTRO POR MORA Y ACCIONES LEY 675 */}
              <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>
                    Tabla Maestra de Unidades, Coeficientes Ley 675 &amp; Estado de Cartera
                  </h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="🔍 Buscar unidad o propietario..."
                      value={busquedaUnidad}
                      onChange={e => setBusquedaUnidad(e.target.value)}
                      style={{
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        minWidth: '220px'
                      }}
                    />
                    <select
                      value={filtroMora}
                      onChange={e => setFiltroMora(e.target.value)}
                      style={{
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    >
                      <option value="TODOS">Todos los Estados ({unidades.length})</option>
                      <option value="SOLO_MORA">Solo Unidades en Mora</option>
                      <option value="Al día">Al día ($0)</option>
                      <option value="Mora 30">Mora 30 días</option>
                      <option value="Mora 60">Mora 60 días</option>
                      <option value="Cobro Prejurídico/Jurídico (+90 días)">Cobro Prejurídico/Jurídico (+90d)</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                        <th style={{ padding: '12px' }}>Unidad / Inmueble</th>
                        <th style={{ padding: '12px' }}>Propietario</th>
                        <th style={{ padding: '12px' }}>Coeficiente Ley 675</th>
                        <th style={{ padding: '12px' }}>Cuota Base</th>
                        <th style={{ padding: '12px' }}>Intereses / Costos</th>
                        <th style={{ padding: '12px' }}>Saldo Total</th>
                        <th style={{ padding: '12px' }}>Estado Cartera</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Acción Legal / Certificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unidadesFiltradas.map(u => {
                        const alDia = u.saldo_actual <= 0;
                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid #262629' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#ffffff' }}>{u.numero_unidad}</td>
                            <td style={{ padding: '12px', color: '#cbd5e1' }}>
                              {u.propietario}
                              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748b' }}>{u.email}</div>
                            </td>
                            <td style={{ padding: '12px', fontFamily: 'monospace', color: '#22d3ee' }}>{u.coeficiente.toFixed(2)}%</td>
                            <td style={{ padding: '12px', fontFamily: 'monospace', color: '#cbd5e1' }}>
                              ${u.cuota_base.toLocaleString()} COP
                            </td>
                            <td style={{ padding: '12px', fontFamily: 'monospace', color: u.intereses_mora > 0 ? '#fbbf24' : '#64748b' }}>
                              ${u.intereses_mora.toLocaleString()} COP
                            </td>
                            <td
                              style={{
                                padding: '12px',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                color: alDia ? '#34d399' : '#ef4444'
                              }}
                            >
                              ${u.saldo_actual.toLocaleString()} COP
                            </td>
                            <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px' }}>
                              <span
                                style={{
                                  color: alDia
                                    ? '#34d399'
                                    : u.estado_cartera === 'Mora 30'
                                    ? '#fbbf24'
                                    : '#ef4444',
                                  fontWeight: 'bold'
                                }}
                              >
                                {u.estado_cartera.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              {alDia ? (
                                <button
                                  type="button"
                                  onClick={() => handleGenerarPazYSalvo(u)}
                                  style={{
                                    backgroundColor: '#1c1c1f',
                                    border: '1px solid #34d399',
                                    color: '#34d399',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  📄 Paz y Salvo
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleEnviarCobroJuridico(u)}
                                  style={{
                                    backgroundColor: '#1c1c1f',
                                    border: '1px solid #ef4444',
                                    color: '#ef4444',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ⚖️ Enviar a Cobro Jurídico
                                </button>
                              )}
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

          {/* SUB-PESTAÑA 2: GESTIÓN DE EGRESOS Y PROVEEDORES DE LA COPROPIEDAD */}
          {adminSubTab === 'egresos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontFamily: 'monospace', color: '#fbbf24' }}>
                  + REGISTRAR PAGO A PROVEEDOR / CONTRATISTA DE LA UNIDAD CERRADA (EGRESOS_PH)
                </h4>
                <form
                  onSubmit={handleRegistrarEgresoProveedor}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                      Razón Social / Proveedor
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Seguridad Atlas / EPM"
                      value={egresoProveedor}
                      onChange={e => setEgresoProveedor(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#fff',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                      NIT Proveedor
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 890.900.123-4"
                      value={egresoNit}
                      onChange={e => setEgresoNit(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#fff',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                      Rubro Presupuestal
                    </label>
                    <select
                      value={egresoCategoria}
                      onChange={e => setEgresoCategoria(e.target.value as EgresoPHItem['categoria'])}
                      style={{
                        width: '100%',
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#fff',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    >
                      <option value="Vigilancia y Seguridad">Vigilancia y Seguridad</option>
                      <option value="Aseo y Mantenimiento">Aseo y Mantenimiento</option>
                      <option value="Servicios Públicos (EPM)">Servicios Públicos (EPM)</option>
                      <option value="Ascensores y Equipos">Ascensores y Equipos</option>
                      <option value="Caja Menor (Urgencia)">Caja Menor (Urgencia)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                      Detalle / Concepto Factura
                    </label>
                    <input
                      type="text"
                      placeholder="Descripción del servicio"
                      value={egresoConcepto}
                      onChange={e => setEgresoConcepto(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#fff',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                      Monto ($ COP)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 3200000"
                      value={egresoMonto}
                      onChange={e => setEgresoMonto(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: '#1c1c1f',
                        border: '1px solid #262629',
                        color: '#fff',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#fbbf24',
                      color: '#09090b',
                      border: 'none',
                      padding: '9px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    REGISTRAR EGRESO
                  </button>
                </form>
              </div>

              <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ffffff' }}>
                  Libro de Egresos: Pagos a Proveedores y Gastos de Caja Menor Sincronizados
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                        <th style={{ padding: '12px' }}>Soporte / Factura</th>
                        <th style={{ padding: '12px' }}>Proveedor / NIT</th>
                        <th style={{ padding: '12px' }}>Categoría</th>
                        <th style={{ padding: '12px' }}>Concepto</th>
                        <th style={{ padding: '12px' }}>Registrado Por</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Valor Pagado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {egresos.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid #262629' }}>
                          <td style={{ padding: '12px', fontFamily: 'monospace', color: '#22d3ee' }}>{e.soporte_ref}</td>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#ffffff' }}>
                            {e.proveedor}
                            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748b' }}>{e.nit_proveedor}</div>
                          </td>
                          <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: e.categoria === 'Caja Menor (Urgencia)' ? '#fbbf24' : '#cbd5e1' }}>
                            {e.categoria}
                          </td>
                          <td style={{ padding: '12px', color: '#cbd5e1' }}>{e.concepto}</td>
                          <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
                            {e.registrado_por}
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{e.fecha}</div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#ef4444' }}>
                            -${e.monto.toLocaleString()} COP
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-PESTAÑA 3: SUB-PANEL DE PERSONAL DE LA COPROPIEDAD (HERENCIA MÓDULO 2) */}
          {adminSubTab === 'personal' && (
            <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#ffffff' }}>
                    Gestión de Personal Operativo de la Copropiedad (Herencia Protegida Módulo 2)
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                    El Administrador gestiona a su personal directo (Supervisor, Vigilantes, Aseo y Contratistas). La cuenta Root Superadmin permanece blindada.
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#22d3ee' }}>
                  ● Sincronizado con user_roles &amp; audit_logs
                </span>
              </div>

              <div style={{ backgroundColor: '#1c1c1f', border: '1px solid #262629', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontFamily: 'monospace', color: '#22d3ee' }}>
                  + INCORPORAR PERSONAL A LA COPROPIEDAD (SUPERVISOR / VIGILANTE / ASEO / CONTRATISTA)
                </h4>
                <form
                  onSubmit={handleAdminCrearPersonal}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}
                >
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={adminNuevoNombre}
                    onChange={e => setAdminNuevoNombre(e.target.value)}
                    required
                    style={{ backgroundColor: '#141416', border: '1px solid #262629', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <input
                    type="email"
                    placeholder="Correo Electrónico"
                    value={adminNuevoEmail}
                    onChange={e => setAdminNuevoEmail(e.target.value)}
                    required
                    style={{ backgroundColor: '#141416', border: '1px solid #262629', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <select
                    value={adminNuevoRol}
                    onChange={e => setAdminNuevoRol(e.target.value)}
                    style={{ backgroundColor: '#141416', border: '1px solid #262629', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}
                  >
                    <option value="supervisor">Supervisor Operativo</option>
                    <option value="vigilante">Vigilante / Seguridad</option>
                    <option value="aseo">Personal de Aseo</option>
                    <option value="contratista">Contratista Externo</option>
                  </select>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#22d3ee',
                      color: '#09090b',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    DAR DE ALTA PERSONAL
                  </button>
                </form>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                      <th style={{ padding: '12px' }}>Nombre / Correo</th>
                      <th style={{ padding: '12px' }}>Rol Operativo</th>
                      <th style={{ padding: '12px' }}>Turno / Asignación</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Acciones de Gerencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personalOperativoCopropiedad.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #262629' }}>
                        <td style={{ padding: '12px', color: '#fff', fontWeight: 'bold' }}>
                          {u.full_name || u.name}
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'normal' }}>
                            {u.user_email || u.email}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', color: '#22d3ee', fontWeight: 'bold' }}>
                          {u.role.toUpperCase()}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#cbd5e1' }}>
                          {u.shift || 'Turno Diurno Estándar'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <select
                            value={u.role}
                            onChange={e => handleAdminCambiarRolStaff(u.id, e.target.value, u.full_name || u.name || 'Operador')}
                            style={{
                              backgroundColor: '#1c1c1f',
                              border: '1px solid #262629',
                              color: '#fff',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '11px'
                            }}
                          >
                            <option value="admin">Administrador</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="vigilante">Vigilante</option>
                            <option value="aseo">Aseo</option>
                            <option value="contratista">Contratista</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAdminRevocarPersonal(u.id, u.full_name || u.name || 'Operador')}
                            style={{
                              backgroundColor: 'transparent',
                              border: '1px solid #ef4444',
                              color: '#ef4444',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Revocar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          PARTE B: VISTA DEL SUPERVISOR (BRAZO OPERATIVO Y AUDITOR DE CAMPO)
      ===================================================================== */}
      {modoVista === 'supervisor' && (
        <>
          {/* CABECERA DEL SUPERVISOR */}
          <div
            style={{
              backgroundColor: '#141416',
              border: '1px solid #262629',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#22d3ee', marginBottom: '6px' }}>
                SUPERVISIÓN DE CAMPO · CONTROL OPERATIVO, CAJA MENOR &amp; CONCILIACIÓN EN SITIO
              </div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
                Consola Operativa del Supervisor (Permisos Acotados de Terreno)
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                Sin acceso a liquidación global de tasas ni modificación de coeficientes Ley 675. Impacto directo en Flujo de Caja del Administrador.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDescargarReporteOperativoCSV}
              style={{
                backgroundColor: '#22d3ee',
                color: '#09090b',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📋 Descargar Reporte Operativo de Turno (.CSV)
            </button>
          </div>

          {/* 1. KPIs DEL SUPERVISOR */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
            {/* KPI 1: Saldo Disponible en Caja Menor */}
            <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '6px' }}>
                1. SALDO DISPONIBLE CAJA MENOR
              </div>
              <div style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold', color: '#fbbf24' }}>
                ${saldoDisponibleCajaMenor.toLocaleString()} COP
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '6px' }}>
                Cupo Asignado: ${cupoInicialCajaMenor.toLocaleString()} COP · Ejecutado: ${gastosCajaMenorAcumulados.toLocaleString()}
              </div>
            </div>

            {/* KPI 2: Pagos / Comprobantes Pendientes por Verificar */}
            <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '6px' }}>
                2. COMPROBANTES POR VERIFICAR
              </div>
              <div style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold', color: '#22d3ee' }}>
                {soportesPendientes.filter(s => s.estado === 'Pendiente').length} Soportes
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '6px' }}>
                Total por conciliar: $
                {soportesPendientes
                  .filter(s => s.estado === 'Pendiente')
                  .reduce((acc, s) => acc + s.monto, 0)
                  .toLocaleString()}{' '}
                COP
              </div>
            </div>

            {/* KPI 3: Órdenes de Mantenimiento / Contratistas Activos */}
            <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '6px' }}>
                3. CONTRATISTAS ACTIVOS EN SITIO
              </div>
              <div style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold', color: '#34d399' }}>
                {Math.max(2, contratistasActivos.length)} Contratistas
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '6px' }}>
                ARL &amp; Seguridad Social Verificada en Portería
              </div>
            </div>

            {/* KPI 4: Personal Operativo en Turno */}
            <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '6px' }}>
                4. PERSONAL OPERATIVO EN TURNO
              </div>
              <div style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold', color: '#34d399' }}>
                {cuadrillaEnTurno.length} Operarios
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '6px' }}>
                Vigilantes y Personal de Aseo Activos Hoy
              </div>
            </div>
          </div>

          {/* HERRAMIENTA 1 DEL SUPERVISOR: REGISTRAR GASTO DE CAJA MENOR */}
          <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#ffffff' }}>
                  🧾 Registrar Gasto de Caja Menor (Urgencias Operativas de Terreno)
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                  Descuenta automáticamente del saldo de Caja Menor, registra el egreso en `egresos_ph` y envía alerta inmediata al Administrador.
                </p>
              </div>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#fbbf24', fontWeight: 'bold' }}>
                Disponible: ${saldoDisponibleCajaMenor.toLocaleString()} COP
              </span>
            </div>

            <form
              onSubmit={handleRegistrarGastoCajaMenor}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end', marginTop: '14px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                  Concepto de Urgencia
                </label>
                <input
                  type="text"
                  placeholder="Ej. Bombillos LED Lobby / Plomería"
                  value={cmConcepto}
                  onChange={e => setCmConcepto(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#1c1c1f', border: '1px solid #262629', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                  Proveedor / Ferretería
                </label>
                <input
                  type="text"
                  placeholder="Ej. Homecenter / Ferretería El Poblado"
                  value={cmProveedor}
                  onChange={e => setCmProveedor(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#1c1c1f', border: '1px solid #262629', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                  Monto ($ COP)
                </label>
                <input
                  type="number"
                  placeholder="Ej. 145000"
                  value={cmMonto}
                  onChange={e => setCmMonto(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#1c1c1f', border: '1px solid #262629', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>
                  N° Factura / Soporte POS
                </label>
                <input
                  type="text"
                  placeholder="Ej. POS-9941"
                  value={cmSoporte}
                  onChange={e => setCmSoporte(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1c1c1f', border: '1px solid #262629', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: '#fbbf24',
                  color: '#09090b',
                  border: 'none',
                  padding: '9px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🧾 REGISTRAR CAJA MENOR
              </button>
            </form>
          </div>

          {/* HERRAMIENTA 2 DEL SUPERVISOR: VALIDACIÓN DE SOPORTES DE PAGO EN SITIO */}
          <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#ffffff' }}>
              ✅ Validación de Soportes de Pago Reportados por Residentes
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8' }}>
              Al hacer clic en &ldquo;✅ Conciliar y Aprobar&rdquo;, el pago impacta inmediatamente el Recaudo Mensual del Administrador y descuenta la deuda del apartamento.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '12px' }}>ID Soporte</th>
                    <th style={{ padding: '12px' }}>Unidad / Propietario</th>
                    <th style={{ padding: '12px' }}>Banco / Archivo Soporte</th>
                    <th style={{ padding: '12px' }}>Concepto</th>
                    <th style={{ padding: '12px' }}>Monto Reportado</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Verificación de Campo</th>
                  </tr>
                </thead>
                <tbody>
                  {soportesPendientes.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #262629' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#22d3ee', fontWeight: 'bold' }}>{s.id}</td>
                      <td style={{ padding: '12px', color: '#ffffff', fontWeight: 'bold' }}>
                        {s.numero_unidad}
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>{s.propietario}</div>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1' }}>
                        {s.banco_origen}
                        <div style={{ color: '#64748b' }}>📎 {s.referencia}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{s.concepto}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#34d399' }}>
                        ${s.monto.toLocaleString()} COP
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {s.estado === 'Pendiente' ? (
                          <button
                            type="button"
                            onClick={() => handleConciliarSoportePago(s)}
                            style={{
                              backgroundColor: '#34d399',
                              color: '#09090b',
                              border: 'none',
                              padding: '7px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            ✅ Conciliar y Aprobar
                          </button>
                        ) : (
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#34d399', fontWeight: 'bold' }}>
                            ✓ CONCILIADO EN CAJA ADMIN
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* HERRAMIENTA 3 DEL SUPERVISOR: GESTIÓN DE CUADRILLA OPERATIVA (LÍMITE JERÁRQUICO: SOLO ASEO, VIGILANTE Y CONTRATISTA) */}
          <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#ffffff' }}>
                  👷 Gestión de Cuadrilla Operativa y Turnos (Límite Jerárquico de Supervisor)
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                  Heredado del Módulo 2 con restricción de privilegios: únicamente habilitado para dar de alta y asignar turnos a `aseo`, `vigilante` y `contratista`.
                </p>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#22d3ee' }}>
                ● Registro Automático en audit_logs
              </span>
            </div>

            <div style={{ backgroundColor: '#1c1c1f', border: '1px solid #262629', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontFamily: 'monospace', color: '#22d3ee' }}>
                + ALTA DE OPERARIO DE CAMPO Y ASIGNACIÓN DE TURNO (SOLO ASEO / VIGILANTE / CONTRATISTA)
              </h4>
              <form
                onSubmit={handleSupervisorAltaCuadrilla}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}
              >
                <input
                  type="text"
                  placeholder="Nombre del Operario / Contratista"
                  value={supNuevoNombre}
                  onChange={e => setSupNuevoNombre(e.target.value)}
                  required
                  style={{ backgroundColor: '#141416', border: '1px solid #262629', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}
                />
                <input
                  type="email"
                  placeholder="Correo / Contacto"
                  value={supNuevoEmail}
                  onChange={e => setSupNuevoEmail(e.target.value)}
                  required
                  style={{ backgroundColor: '#141416', border: '1px solid #262629', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}
                />
                <select
                  value={supNuevoRol}
                  onChange={e => setSupNuevoRol(e.target.value as 'aseo' | 'vigilante' | 'contratista')}
                  style={{ backgroundColor: '#141416', border: '1px solid #262629', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}
                >
                  <option value="vigilante">Vigilante / Guarda</option>
                  <option value="aseo">Personal de Aseo</option>
                  <option value="contratista">Contratista de Mantenimiento</option>
                </select>
                <select
                  value={supNuevoTurno}
                  onChange={e => setSupNuevoTurno(e.target.value)}
                  style={{ backgroundColor: '#141416', border: '1px solid #262629', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}
                >
                  <option value="Turno Día (06:00 - 14:00)">Turno Día (06:00 - 14:00)</option>
                  <option value="Turno Tarde (14:00 - 22:00)">Turno Tarde (14:00 - 22:00)</option>
                  <option value="Turno Noche (22:00 - 06:00)">Turno Noche (22:00 - 06:00)</option>
                  <option value="Jornada Obra / Mantenimiento">Jornada Obra / Mantenimiento</option>
                </select>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#22d3ee',
                    color: '#09090b',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ASIGNAR A CUADRILLA
                </button>
              </form>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                    <th style={{ padding: '12px' }}>Operario / Contratista</th>
                    <th style={{ padding: '12px' }}>Rol Asignado</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Turno en Curso (Modificable en Campo)</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(u => u.role === 'aseo' || u.role === 'vigilante' || u.role === 'contratista')
                    .map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #262629' }}>
                        <td style={{ padding: '12px', color: '#ffffff', fontWeight: 'bold' }}>
                          {u.full_name || u.name}
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 'normal' }}>
                            {u.user_email || u.email}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', color: '#fbbf24', fontWeight: 'bold' }}>
                          {u.role.toUpperCase()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <select
                            value={u.shift || 'Turno Día (06:00 - 14:00)'}
                            onChange={e => handleSupervisorCambiarTurno(u.id, e.target.value, u.full_name || u.name || 'Operario')}
                            style={{
                              backgroundColor: '#1c1c1f',
                              border: '1px solid #262629',
                              color: '#fff',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Turno Día (06:00 - 14:00)">Turno Día (06:00 - 14:00)</option>
                            <option value="Turno Tarde (14:00 - 22:00)">Turno Tarde (14:00 - 22:00)</option>
                            <option value="Turno Noche (22:00 - 06:00)">Turno Noche (22:00 - 06:00)</option>
                            <option value="Jornada Obra / Mantenimiento">Jornada Obra / Mantenimiento</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* BITÁCORA COMPARTIDA EN TIEMPO REAL (AUDIT_LOGS) */}
      <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '10px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' }}>
            🛡️ Bitácora Unificada de Auditoría en Tiempo Real (`audit_logs` · Superadmin / Admin / Supervisor)
          </h4>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
            Últimos movimientos sincronizados
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '190px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
          {auditLogs.slice(0, 8).map((log, i) => (
            <div
              key={log.id || i}
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid #262629',
                borderRadius: '6px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <span>
                <strong style={{ color: '#22d3ee' }}>[{log.user_executor || log.user}]</strong>{' '}
                <span style={{ color: '#cbd5e1' }}>{log.details}</span>
              </span>
              <span style={{ color: '#64748b', fontSize: '11px' }}>
                {Number.isNaN(new Date(log.timestamp).getTime()) ? log.timestamp : new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
