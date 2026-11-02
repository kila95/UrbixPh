import React, { useState } from 'react';
import { 
  Building2, Users, FileText, HardHat, DollarSign, 
  MessageSquare, ShieldCheck, AlertTriangle, Plus, 
  Search, Download, CheckCircle2, Clock, Calendar, 
  Printer, ArrowUpRight, Scale, Check, X, RefreshCw, Crown, UserCheck, ClipboardCheck
} from 'lucide-react';
import { MovimientoCajaMenorPH, INITIAL_CAJA_MENOR_MOVIMIENTOS } from './PanelSupervisorModulo4';

export interface PolizaBienesComunesPH {
  id: string;
  aseguradora: string;
  numero_poliza: string;
  cobertura_principal: string;
  monto_asegurado_cop: number;
  vigencia_inicio: string;
  vigencia_fin: string;
  canon_mensual: number;
  estado_poliza: 'Vigente ✅' | 'Próxima a Vencer (< 30 Días) ⚠️' | 'Vencida ⛔';
}

export interface CircularOficialPH {
  id: string;
  radicado_num: string;
  fecha_emision: string;
  asunto: string;
  destinatarios: string;
  firmado_por: string;
  hash_sha256: string;
  estado_difusion: 'Enviada WhatsApp & Correo' | 'Borrador';
}

export interface UnidadCarteraPH {
  id: number;
  numero_unidad: string;
  propietario: string;
  documento_nit: string;
  telefono_whatsapp: string;
  email: string;
  coeficiente: number;
  cuota_base: number;
  capital_vencido: number;
  intereses_mora: number;
  costos_prejuridicos: number;
  saldo_actual: number;
  estado_cartera: 'Al día' | 'Mora 30' | 'Mora 60' | 'Cobro Jurídico +90';
}

export interface RegistroRecaudoPH {
  id: string | number;
  unidad_id: number;
  numero_unidad: string;
  propietario: string;
  monto_pagado: number;
  concepto: 'Cuota Ordinaria' | 'Extraordinaria' | 'Acuerdo de Pago' | 'Multa';
  metodo_pago: 'PSE' | 'Transferencia' | 'Consignación';
  fecha: string;
}

export type CategoriaPresupuestalPH =
  | 'Vigilancia'
  | 'Aseo'
  | 'Servicios Públicos'
  | 'Mantenimiento'
  | 'Seguros/Legal'
  | 'Caja Menor';

export interface RegistroEgresoProveedorPH {
  id: string | number;
  comprobante_num: string;
  fecha: string;
  proveedor: string;
  nit_rut: string;
  categoria: CategoriaPresupuestalPH;
  concepto: string;
  numero_factura: string;
  monto: number;
  estado: 'Pagado' | 'Cuenta por Pagar / Pendiente';
  vencimiento?: string;
}

export interface RubroPresupuestoLey675 {
  id: string;
  categoriaKey: CategoriaPresupuestalPH;
  nombreRubro: string;
  detalleRubro: string;
  presupuestoAprobado: number;
}

export type RolOperativoPermitido = 'supervisor' | 'vigilante' | 'aseo' | 'contratista';

export type TurnoHorarioPH =
  | 'Diurno 6am-2pm'
  | 'Tarde 2pm-10pm'
  | 'Nocturno 10pm-6am'
  | 'Visita Técnica / Por Orden';

export interface PersonalOperativoPH {
  id: number;
  full_name: string;
  user_email: string;
  telefono_whatsapp: string;
  role: RolOperativoPermitido | 'super_admin' | 'admin';
  turno_horario: TurnoHorarioPH;
  estado_arl: 'Vigente ✅' | 'Pendiente Verificación ⚠️';
  entidad_arl: string;
  estado_puerta: 'En Turno / Adentro' | 'Fuera de Turno';
  coproperty_assigned: string;
}

export interface OrdenTrabajoContratista {
  id: string;
  contratista_id: number;
  contratista_nombre: string;
  tarea_especifica: string;
  zona_intervenida: string;
  fecha_ingreso_autorizada: string;
  costo_estimado: number;
  estado_orden: 'Autorizada en Portería' | 'En Ejecución' | 'Finalizada';
}

export type TipoFaltaConvivencia =
  | 'Ruido excesivo fuera de horario'
  | 'Mal uso de parqueaderos de visitantes'
  | 'Tenencia inadecuada de mascotas en zonas comunes'
  | 'Afectación a fachada / obras no autorizadas';

export type TipoSancionLey675 =
  | '1° Llamado de Atención Pedagógico ($0)'
  | 'Multa Económica Ley 675 (Se carga a la factura)';

export interface SancionConvivenciaPH {
  id: string;
  acta_num: string;
  unidad_id: number;
  numero_unidad: string;
  propietario: string;
  tipo_falta: TipoFaltaConvivencia;
  tipo_sancion: TipoSancionLey675;
  monto_multa: number;
  tope_maximo_legal: number;
  fecha: string;
  estado_proceso: 'Notificada - Descargos' | 'En Firme - Cargada a Factura' | 'Cumplida / Pedagógica';
  observacion_acta: string;
}

export interface EquipoCriticoPH {
  id: string;
  nombre: string;
  tipo: 'Ascensor' | 'Motobomba' | 'Planta Eléctrica' | 'Red Incendios' | 'Portón Eléctrico';
  ubicacion: string;
  estado_salud: 'Óptimo' | 'Alerta Preventiva' | 'Fallo Crítico';
  lectura_horometro_presion: string;
  ultima_inspeccion_fecha: string;
  inspeccionado_por: string;
  vencimiento_garantia_poliza: string;
  proveedor_mantenimiento: string;
  observaciones_campo: string;
}

export interface ReformaMudanzaPH {
  id: string;
  unidad_id: number;
  numero_unidad: string;
  propietario_residente: string;
  tipo_evento: 'Reforma Locativa / Obra' | 'Mudanza Entrada' | 'Mudanza Salida';
  contratista_responsable: string;
  deposito_garantia_cop: number;
  estado_deposito: 'En Custodia Admin 🛡️' | 'Devuelto al Residente ✅' | 'Descontado por Daños ⚠️';
  fecha_inicio: string;
  fecha_fin: string;
  supervision_estado: 'En Ejecución / Pendiente Revisión 🕒' | 'Certificado Sin Daños ✅' | 'Reportado Con Daño en Bienes Comunes ⚠️';
  observacion_supervisor: string;
  monto_descuento_dano: number;
}

export interface InsumoBodegaPH {
  id: string;
  codigo: string;
  nombre: string;
  categoria: 'Aseo y Desinfección' | 'Luminarias y Eléctricos' | 'Cerrajería y Seguridad' | 'Ferretería General';
  stock_actual: number;
  stock_minimo_critico: number;
  unidad_medida: string;
  estado_stock: 'Normal' | 'Stock Crítico ⚠️' | 'Solicitado a Administración 🛒';
  ultimo_reabastecimiento: string;
  costo_unitario_estimado: number;
}

export interface AuditLogShared {
  id: string | number;
  timestamp: string;
  user_executor: string;
  user?: string;
  action_type: string;
  action?: string;
  details: string;
  hash?: string;
}

export const INITIAL_UNIDADES_MEDELLIN: UnidadCarteraPH[] = [];
export const INITIAL_RECAUDOS_MES: RegistroRecaudoPH[] = [];
export const INITIAL_EGRESOS_MEDELLIN: RegistroEgresoProveedorPH[] = [];
export const INITIAL_PERSONAL_OPERATIVO: PersonalOperativoPH[] = [];
export const INITIAL_ORDENES_CONTRATISTAS: OrdenTrabajoContratista[] = [];
export const INITIAL_SANCIONES_CONVIVENCIA: SancionConvivenciaPH[] = [];
export const INITIAL_EQUIPOS_CRITICOS: EquipoCriticoPH[] = [];
export const INITIAL_REFORMAS_MUDANZAS: ReformaMudanzaPH[] = [];
export const INITIAL_INVENTARIO_BODEGA: InsumoBodegaPH[] = [];

interface PanelAdministradorModulo3Props {
  appendAuditLog: (action: string, details: string, customUser?: string) => void;
  auditLogs: AuditLogShared[];
  unidadesExternal?: UnidadCarteraPH[];
  setUnidadesExternal?: React.Dispatch<React.SetStateAction<UnidadCarteraPH[]>>;
  recaudosExternal?: RegistroRecaudoPH[];
  setRecaudosExternal?: React.Dispatch<React.SetStateAction<RegistroRecaudoPH[]>>;
  egresosExternal?: RegistroEgresoProveedorPH[];
  setEgresosExternal?: React.Dispatch<React.SetStateAction<RegistroEgresoProveedorPH[]>>;
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
  initialSubTab?: 'tab3_1' | 'tab3_2' | 'tab3_3' | 'tab3_4';
}

export default function PanelAdministradorModulo3({
  initialSubTab = 'tab3_1'
}: PanelAdministradorModulo3Props) {
  const [activeSubTab, setActiveSubTab] = useState<'tab3_1' | 'tab3_2' | 'tab3_3' | 'tab3_4'>(initialSubTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* CABECERA DEL PANEL */}
      <div
        style={{
          backgroundColor: '#141416',
          border: '1px solid #262629',
          borderRadius: '12px',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#34d399', marginBottom: '4px' }}>
            MÓDULO DE ADMINISTRACIÓN · GESTIÓN EMPRESARIAL PH (LEY 675 DE 2001)
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
            Panel Central del Administrador de Copropiedad
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            Selecciona un módulo superior para empezar a configurar su información.
          </p>
        </div>
      </div>

      {/* BARRA DE SUB-NAVEGACIÓN DE 4 MÓDULOS */}
      <div
        style={{
          backgroundColor: '#141416',
          border: '1px solid #262629',
          borderRadius: '10px',
          padding: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '8px'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('tab3_1')}
          style={{
            backgroundColor: activeSubTab === 'tab3_1' ? '#1c1c1f' : 'transparent',
            border: `1px solid ${activeSubTab === 'tab3_1' ? '#34d399' : '#262629'}`,
            color: activeSubTab === 'tab3_1' ? '#34d399' : '#cbd5e1',
            padding: '12px 14px',
            borderRadius: '8px',
            textAlign: 'left',
            fontFamily: 'monospace',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '10px', color: activeSubTab === 'tab3_1' ? '#34d399' : '#64748b', fontWeight: 'bold' }}>
            MÓDULO 3
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>
            Cartera Ley 675
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tab3_2')}
          style={{
            backgroundColor: activeSubTab === 'tab3_2' ? '#1c1c1f' : 'transparent',
            border: `1px solid ${activeSubTab === 'tab3_2' ? '#fbbf24' : '#262629'}`,
            color: activeSubTab === 'tab3_2' ? '#fbbf24' : '#cbd5e1',
            padding: '12px 14px',
            borderRadius: '8px',
            textAlign: 'left',
            fontFamily: 'monospace',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '10px', color: activeSubTab === 'tab3_2' ? '#fbbf24' : '#64748b', fontWeight: 'bold' }}>
            MÓDULO 4
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>
            Tesorería &amp; Presupuesto
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tab3_3')}
          style={{
            backgroundColor: activeSubTab === 'tab3_3' ? '#1c1c1f' : 'transparent',
            border: `1px solid ${activeSubTab === 'tab3_3' ? '#22d3ee' : '#262629'}`,
            color: activeSubTab === 'tab3_3' ? '#22d3ee' : '#cbd5e1',
            padding: '12px 14px',
            borderRadius: '8px',
            textAlign: 'left',
            fontFamily: 'monospace',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '10px', color: activeSubTab === 'tab3_3' ? '#22d3ee' : '#64748b', fontWeight: 'bold' }}>
            MÓDULO 5
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>
            Nómina Staff
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tab3_4')}
          style={{
            backgroundColor: activeSubTab === 'tab3_4' ? '#1c1c1f' : 'transparent',
            border: `1px solid ${activeSubTab === 'tab3_4' ? '#34d399' : '#262629'}`,
            color: activeSubTab === 'tab3_4' ? '#34d399' : '#cbd5e1',
            padding: '12px 14px',
            borderRadius: '8px',
            textAlign: 'left',
            fontFamily: 'monospace',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '10px', color: activeSubTab === 'tab3_4' ? '#34d399' : '#64748b', fontWeight: 'bold' }}>
            MÓDULO 6
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>
            Obras &amp; SG-SST
          </div>
        </button>
      </div>

      {/* CONTENIDO DE LOS MÓDULOS (VACÍOS Y LISTOS PARA LLENAR) */}
      {activeSubTab === 'tab3_1' && (
        <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '60px 20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>Módulo 3. Cartera Ley 675</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Módulo vacío. Listo para empezar a llenarlo con su respectiva información.</p>
        </div>
      )}

      {activeSubTab === 'tab3_2' && (
        <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '60px 20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>Módulo 4. Tesorería &amp; Presupuesto</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Módulo vacío. Listo para empezar a llenarlo con su respectiva información.</p>
        </div>
      )}

      {activeSubTab === 'tab3_3' && (
        <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '60px 20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>Módulo 5. Nómina Staff</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Módulo vacío. Listo para empezar a llenarlo con su respectiva información.</p>
        </div>
      )}

      {activeSubTab === 'tab3_4' && (
        <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '60px 20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>Módulo 6. Obras &amp; SG-SST</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Módulo vacío. Listo para empezar a llenarlo con su respectiva información.</p>
        </div>
      )}

    </div>
  );
}
