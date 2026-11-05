import React, { useState } from 'react';
import {
  Wrench,
  Paintbrush,
  Box,
  Calendar,
  Droplet,
  ShieldCheck,
  Plus,
  QrCode,
  AlertTriangle,
  Lock,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import { ContratistaSgsstPorteriaPH } from './components/ResidentPortalConsole';
import ConsolaUnificadaPorteria from './components/ConsolaUnificadaPorteria';
import PanelAseoYServiciosFrecuenciaEnterprise from './components/PanelAseoYServiciosFrecuenciaEnterprise';
import type { VisitaQrPH, EncomiendaPH } from './App';

export interface CeldaParqueaderoPH {
  id: string;
  codigo_celda: string;
  ubicacion: string;
  tipo_permitido: string;
  estado: string;
  placa_actual?: string;
  tipo_vehiculo_actual?: string;
  unidad_visita_id?: number;
  numero_unidad_visita?: string;
  propietario_anfitrion?: string;
  visitante_nombre?: string;
  hora_entrada?: string;
  horas_transcurridas?: number;
}

export interface RegistroAccesoContratistaPuertaPH {
  id: string;
  cedula_nit: string;
  nombre_contratista_empresa: string;
  tipo_obra_reparacion: string;
  unidad_destino_id: number;
  numero_unidad_destino: string;
  propietario_destino: string;
  cartera_al_dia_verificada: boolean;
  arl_supervisor_aprobada: boolean;
  entidad_arl_planilla?: string;
  herramientas_ingreso: string[];
  hora_ingreso: string;
  estado_en_copropiedad: string;
  guarda_responsable: string;
}

export interface HistorialParqueaderoMovimientoPH {
  id: string;
  codigo_celda: string;
  placa: string;
  tipo_vehiculo: string;
  numero_unidad: string;
  visitante: string;
  hora_entrada: string;
  hora_salida: string;
  tiempo_total: string;
  observacion: string;
}

export const INITIAL_CELDAS_PARQUEADERO: CeldaParqueaderoPH[] = [
  { id: '1', codigo_celda: 'V-01', ubicacion: 'Sótano 1 - Visitantes', tipo_permitido: 'Automóvil', estado: 'Disponible' },
  { id: '2', codigo_celda: 'V-02', ubicacion: 'Sótano 1 - Visitantes', tipo_permitido: 'Automóvil', estado: 'Disponible' }
];

export const INITIAL_ACCESOS_CONTRATISTAS_PUERTA: RegistroAccesoContratistaPuertaPH[] = [];

export const INITIAL_HISTORIAL_PARQUEADERO: HistorialParqueaderoMovimientoPH[] = [];

export default function ModulosOperativosServiciosGenerales({
  vistaModo = 'servicios_generales',
  onCambiarVista,
  contratistasSgsst = [],
  onValidarQrContratistaPorteria,
  appendAuditLog,
  visitasQr = [],
  onActualizarEstadoVisitaQr,
  encomiendas = [],
  onRegistrarEncomienda,
  onEntregarEncomienda,
  onShowToast,
  visitasQrShared,
  setVisitasQrShared,
  encomiendasShared,
  setEncomiendasShared,
  rondasShared,
  setRondasShared,
  minutaShared,
  setMinutaShared,
  celdasParqueadero,
  setCeldasParqueadero,
  contratistasShared,
  setContratistasShared,
  tareasShared,
  setTareasShared,
  checklistConfig,
  setChecklistConfig,
  onDerivarMantenimientoTodero,
  onActivarAlertaCriticaSupervisor
}: {
  vistaModo?: string;
  onCambiarVista?: (v: any) => void;
  unidades?: any[];
  personal?: any[];
  ordenes?: any[];
  appendAuditLog?: (action: string, details: string, customUser?: string) => void;
  auditLogs?: any[];
  celdasParqueadero?: CeldaParqueaderoPH[];
  setCeldasParqueadero?: any;
  registrosContratistasPuerta?: RegistroAccesoContratistaPuertaPH[];
  setRegistrosContratistasPuerta?: any;
  historialParqueadero?: HistorialParqueaderoMovimientoPH[];
  setHistorialParqueadero?: any;
  contratistasSgsst?: ContratistaSgsstPorteriaPH[];
  onValidarQrContratistaPorteria?: (contratistaId: string) => void;
  visitasQr?: VisitaQrPH[];
  onActualizarEstadoVisitaQr?: (id: string, nuevoEstado: VisitaQrPH['estado'], celdaAsignada?: string) => void;
  encomiendas?: EncomiendaPH[];
  onRegistrarEncomienda?: (nueva: any) => void;
  onEntregarEncomienda?: (id: string, pin?: string) => void;
  onShowToast?: (msg: string) => void;
  visitasQrShared?: VisitaQrPH[];
  setVisitasQrShared?: React.Dispatch<React.SetStateAction<VisitaQrPH[]>>;
  encomiendasShared?: EncomiendaPH[];
  setEncomiendasShared?: React.Dispatch<React.SetStateAction<EncomiendaPH[]>>;
  rondasShared?: any[];
  setRondasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  minutaShared?: any[];
  setMinutaShared?: React.Dispatch<React.SetStateAction<any[]>>;
  contratistasShared?: any[];
  setContratistasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  tareasShared?: any[];
  setTareasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  checklistConfig?: any[];
  setChecklistConfig?: React.Dispatch<React.SetStateAction<any[]>>;
  onDerivarMantenimientoTodero?: (tarea: any) => void;
  onActivarAlertaCriticaSupervisor?: (alerta: any) => void;
}) {
  if (vistaModo === 'porteria') {
    return (
      <div className="w-full">
        <ConsolaUnificadaPorteria
          visitasQrShared={visitasQrShared || visitasQr}
          setVisitasQrShared={setVisitasQrShared}
          contratistasSgsst={contratistasSgsst}
          onValidarQrContratistaPorteria={onValidarQrContratistaPorteria}
          encomiendasShared={encomiendasShared || encomiendas}
          setEncomiendasShared={setEncomiendasShared}
          rondasShared={rondasShared}
          setRondasShared={setRondasShared}
          minutaShared={minutaShared}
          setMinutaShared={setMinutaShared}
          celdasParqueaderoShared={celdasParqueadero}
          setCeldasParqueaderoShared={setCeldasParqueadero}
          contratistasShared={contratistasShared}
          setContratistasShared={setContratistasShared}
          onShowToast={onShowToast}
          appendAuditLog={appendAuditLog}
          onDerivarMantenimientoTodero={onDerivarMantenimientoTodero}
          onActivarAlertaCriticaSupervisor={onActivarAlertaCriticaSupervisor}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 text-white font-sans max-w-7xl mx-auto space-y-6">
      {/* BARRA DE NAVEGACIÓN UNIFICADA Y FORZADA PARA TODOS LOS ROLES */}
      <nav className="flex items-center gap-2 overflow-x-auto py-1 px-2 bg-[#0b0f17]/90 border border-cyan-500/20 rounded-2xl shadow-lg w-full scrollbar-none whitespace-nowrap">
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer pointer-events-auto border shrink-0 bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.25)]"
          >
            Vista General
          </button>
          <span className="text-xs font-bold text-slate-300 font-mono px-3.5 py-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-xl border border-cyan-500/40 shrink-0">
            🧹 Control de Turno, Checklist de Aseo &amp; Órdenes de Trabajo
          </span>
        </div>
      </nav>

      <PanelAseoYServiciosFrecuenciaEnterprise
        checklistConfig={checklistConfig}
        setChecklistConfig={setChecklistConfig}
        tareasShared={tareasShared}
        setTareasShared={setTareasShared}
        onShowToast={onShowToast}
      />
    </div>
  );
}
