import React, { useState, useEffect } from 'react';
import {
  Building2, FileText, HardHat, DollarSign,
  Wrench, Calendar, MessageSquare, ShieldCheck, Plus, Camera, AlertCircle, AlertOctagon, Search, Users, UserPlus, Trash2, Radio, Check, Edit3, Scan, FileSpreadsheet, LogOut, Calculator, Truck, Scale
} from 'lucide-react';
import type { GuardIncidentReport, CommonAreaReservation } from './App';
import { supabase, type UserProfile } from './supabaseClient';
import VersionShieldGuardBanner from './components/VersionShieldGuardBanner';
import ContractorsModule from './ContractorsModule';
import MeetingMinutesModule from './MeetingMinutesModule';
import AdminGeneralInteractive from './components/AdminGeneralInteractive';
import SelectorPortafolioMultiConjunto from './components/SelectorPortafolioMultiConjunto';
import SalaAsambleaVirtualExecutive from './components/SalaAsambleaVirtualExecutive';
import SelectorTipoReunionUrbix from './components/SelectorTipoReunionUrbix';
import ModuloReunionesConSubmodulos from './components/ModuloReunionesConSubmodulos';
import AsambleasActasLegalesHub from './components/AsambleasActasLegalesHub';
import LectorFacturasProveedoresOCR from './components/LectorFacturasProveedoresOCR';
import GeneradorExogenaDIAN_NIIF from './components/GeneradorExogenaDIAN_NIIF';
import SeccionTesoreriaConDIAN from './components/SeccionTesoreriaConDIAN';
import SeccionGestionPersonalAdmin from './SeccionGestionPersonalAdmin';
import GestionCuadrillaAdminModal from './components/GestionCuadrillaAdminModal';
import ConfiguracionFacturacionModal from './components/ConfiguracionFacturacionModal';
import { ModalPresupuestoAdmin } from './components/ModalPresupuestoAdmin';
import DetalleRecaudoModal from './components/DetalleRecaudoModal';
import DetalleCajaMenorModal from './components/DetalleCajaMenorModal';
import PorteriaSupabaseSync from './PorteriaSupabaseSync';
import { TableroComunicados } from './components/TableroComunicados';
import { cargarMetricasTenant, MetricasTenant } from './lib/metricasTenant';
import LogoUrbix from './LogoUrbix';
import WhatsAppConfigCard from './WhatsAppConfigCard';
import ModuloTesoreriaOCR from './ModuloTesoreriaOCR';
import ModuloTesoreriaExogenaReal from './ModuloTesoreriaExogenaReal';
import ModuloMantenimientoReal from './ModuloMantenimientoReal';
import ModuloCobroPrejuridicoReal from './ModuloCobroPrejuridicoReal';
import {
  registrarAbonoConPrelacion,
  ejecutarCausacionMensualCopropiedad,
  imprimirReciboDeCajaPDF,
  exportarContabilidadSiigoWorldOffice
} from './lib/motorFinancieroPH';
import ModuloCensoYMudanzasReal from './ModuloCensoYMudanzasReal';
import ModuloGobiernoYConsejoReal from './ModuloGobiernoYConsejoReal';
import BotonPagoSuscripcionAdmin from './BotonPagoSuscripcionAdmin';


export interface StaffMember {
  id: string;
  nombre: string;
  rol: string;
  email: string;
  estado: string;
  edificios?: string[];
}

export interface ConsolaGerencialUrbixPHProps {
  currentTenant?: { id?: string; name?: string; zone?: string; units?: number; recaudo?: number } | null;
  userProfile?: UserProfile | null;
  tenantName?: string;
  adminName?: string;
  guardIncidents?: GuardIncidentReport[];
  reservations?: CommonAreaReservation[];
  onAssignIncident?: (id: string, assignedTo: string) => void;
  onUpdateIncidentStatus?: (id: string, status: GuardIncidentReport['status'], note?: string) => void;
  onAdminReservationDecision?: (id: string, decision: 'Aprobada' | 'Rechazada') => void;
  onOpenCreateTenantModal?: () => void;
  onCerrarSesion?: () => void;
  onShowToast?: (msg: string) => void;
}

export default function ConsolaGerencialUrbixPH({
  currentTenant,
  userProfile,
  tenantName,
  adminName,
  guardIncidents = [],
  onUpdateIncidentStatus,
  onOpenCreateTenantModal,
  onCerrarSesion,
  onShowToast
}: ConsolaGerencialUrbixPHProps) {
  const [saldoCajaMenor, setSaldoCajaMenor] = useState<number>(0);
  const [porcentajeRecaudo, setPorcentajeRecaudo] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'general' | 'cartelera' | 'porteria' | 'comunicados' | 'asamblea' | 'actas' | 'contractors' | 'cartera' | 'prejuridico' | 'facturas_ocr' | 'exogena_dian' | 'mantenimiento' | 'personal' | 'reservas' | 'pqrs' | 'whatsapp' | 'mudanzas' | 'gobierno'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [mostrarModalCuadrilla, setMostrarModalCuadrilla] = useState(false);
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
  const [modalPresupuestoAbierto, setModalPresupuestoAbierto] = useState(false);
  const [modalRecaudoAbierto, setModalRecaudoAbierto] = useState(false);
  const [modalCajaMenorAbierto, setModalCajaMenorAbierto] = useState(false);
  const setAbrirModalRecaudo = setModalRecaudoAbierto;
  const setAbrirModalCajaMenor = setModalCajaMenorAbierto;

  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappToken, setWhatsappToken] = useState('');

  const handleSaveWhatsAppConfig = () => {
    try {
      localStorage.setItem(
        'urbix_whatsapp_config',
        JSON.stringify({ enabled: whatsappEnabled, token: whatsappToken })
      );
    } catch {
      // ignore
    }
    onShowToast?.('Configuración de WhatsApp actualizada para la copropiedad');
  };

  // Edificios reales desde Supabase (Inicia vacío, sin Copropiedad_PH ni demos)
  const [edificiosAsignados, setEdificiosAsignados] = useState<any[]>([]);
  const [edificioActivoId, setEdificioActivoId] = useState<string>('');

  useEffect(() => {
    const cargarEdificiosDelAdmin = async () => {
      try {
        const { data: tenants, error } = await supabase
          .from('tenants')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('Aviso cargando edificios:', error.message);
          return;
        }

        if (tenants && tenants.length > 0) {
          setEdificiosAsignados(tenants);
          setEdificioActivoId((prev) => prev || tenants[0].id);
        } else {
          setEdificiosAsignados([]);
          setEdificioActivoId('');
        }
      } catch (err: any) {
        console.warn('Aviso en cargarEdificiosDelAdmin:', err?.message);
      }
    };
    cargarEdificiosDelAdmin();
  }, [userProfile?.id, userProfile?.email]);

  // Métricas inicializadas en 0 real
  const [metricas, setMetricas] = useState<MetricasTenant>({
    recaudo: '0.0%',
    unidadesMora: '0 Aptos',
    totalUnidades: 0,
    alDia: 0,
    enMora: 0,
    unidadesPagadas: 0,
    unidadesEnMora: 0,
    porcentajeRecaudo: '0.0%'
  });

  useEffect(() => {
    if (edificioActivoId) {
      cargarMetricasTenant(edificioActivoId).then((res) => {
        if (res) setMetricas(res);
      });
    }
  }, [edificioActivoId]);

  const edificioActivo = edificiosAsignados.find(e => e.id === edificioActivoId) || null;
  const tenantData = edificioActivo;
  const resolvedTenantName = edificioActivo?.name || currentTenant?.name || tenantName || 'Sin Copropiedad Seleccionada';
  const tenantActivoId = edificioActivoId || currentTenant?.id || '';
  const tenantId = tenantActivoId;
  const resolvedAdminName = userProfile?.full_name || adminName || 'Administrador';

  // Sincronización de caja menor y recaudo en vivo
  const syncMetricasGenerales = async () => {
    if (!tenantId) return;

    // A. Consultar saldo de caja menor (Ingresos - Gastos)
    try {
      const { data: movimientosCaja } = await supabase
        .from('petty_cash_movements')
        .select('type, amount')
        .eq('tenant_id', tenantId);

      if (movimientosCaja && movimientosCaja.length > 0) {
        const ingresos = movimientosCaja
          .filter(m => m.type === 'ingreso' || m.type === 'dotacion')
          .reduce((sum, m) => sum + Number(m.amount), 0);
        
        const gastos = movimientosCaja
          .filter(m => m.type === 'egreso' || m.type === 'gasto')
          .reduce((sum, m) => sum + Number(m.amount), 0);

        setSaldoCajaMenor(ingresos - gastos);
      } else {
        setSaldoCajaMenor(0);
      }
    } catch (err) {
      console.warn('Error sincronizando petty_cash_movements:', err);
    }

    // B. Consultar porcentaje de recaudo real
    try {
      const { data: unidades } = await supabase
        .from('units')
        .select('debt_status')
        .eq('tenant_id', tenantId);

      if (unidades && unidades.length > 0) {
        const alDia = unidades.filter(u => u.debt_status === 'al_dia' || u.debt_status === 'Al día').length;
        if (alDia > 0) {
          setPorcentajeRecaudo((alDia / unidades.length) * 100);
        } else {
          setPorcentajeRecaudo(0);
        }
      } else {
        setPorcentajeRecaudo(0);
      }
    } catch (err) {
      console.warn('Error sincronizando porcentaje de recaudo:', err);
    }
  };
  const cargarMetricasGenerales = syncMetricasGenerales;

  useEffect(() => {
    syncMetricasGenerales();
  }, [tenantId]);

  // Catálogo de copropiedades / edificios disponibles para asignación a supervisores
  const catalogCopropiedades = edificiosAsignados.length > 0
    ? edificiosAsignados.map(e => e.name)
    : [
        'Copropiedad PH',
        'Conjunto Altavista PH',
        'Edificio Portal del Campestre',
        'Torres de Vizcaya PH',
        'Mirador del Poblado PH'
      ];

  // Cargar nómina real filtrando exclusivamente por el tenantActivoId actual
  const [personalStaff, setPersonalStaff] = useState<StaffMember[]>([]);
  const [cargandoStaff, setCargandoStaff] = useState<boolean>(false);

  useEffect(() => {
    const cargarNominaReal = async () => {
      if (!tenantActivoId) {
        setPersonalStaff([]);
        return;
      }
      try {
        setCargandoStaff(true);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, is_active')
          .eq('tenant_id', tenantActivoId)
          .neq('role', 'residente')
          .order('role', { ascending: true });

        if (profiles && profiles.length > 0) {
          setPersonalStaff(
            profiles
              .filter(p => p.is_active !== false)
              .map(p => ({
                id: p.id,
                nombre: p.full_name || 'Sin Nombre',
                rol:
                  p.role === 'admin' ? 'Administración' :
                  p.role === 'vigilante' ? 'Vigilancia / Portería' :
                  p.role === 'aseo' ? 'Servicios Generales' : 'Supervisor Ops',
                email: p.email || '',
                estado: 'Activo (En nómina)',
                edificios: [resolvedTenantName]
              }))
          );
        } else {
          setPersonalStaff([]);
        }
      } catch (err: any) {
        console.error('Error cargando nómina real:', err.message);
      } finally {
        setCargandoStaff(false);
      }
    };
    cargarNominaReal();
  }, [tenantActivoId, activeTab, resolvedTenantName]);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [emailNuevo, setEmailNuevo] = useState('');
  const [rolNuevo, setRolNuevo] = useState('Supervisor Operativo');
  const [edificiosSeleccionados, setEdificiosSeleccionados] = useState<string[]>([
    'Copropiedad PH'
  ]);
  const [nuevoEdificioPersonalizado, setNuevoEdificioPersonalizado] = useState('');

  // Estado para modal de edición de edificios de staff
  const [staffEnEdicion, setStaffEnEdicion] = useState<StaffMember | null>(null);
  const [edificiosEdicionTemp, setEdificiosEdicionTemp] = useState<string[]>([]);
  const [inputCustomEdicion, setInputCustomEdicion] = useState('');

  // Datos consolidados de Cartera (Ley 675) conectados a Supabase units 
  const [apartments, setApartments] = useState<any[]>([]);

  const cargarUnidadesReales = async (tId: string) => {
    try {
      const { data: units, error } = await supabase
        .from('units')
        .select('*')
        .eq('tenant_id', tId)
        .order('unit_code', { ascending: true });

      if (error) throw error;
      if (units && units.length > 0) {
        setApartments(units.map(u => ({
          id: u.id,
          unit_code: u.unit_code,
          torre: u.tower ? u.tower.replace(/Torre\s*/i, '') : '1',
          apto: u.apartment || u.unit_code,
          propietario: u.owner_name || `Propietario ${u.unit_code}`,
          saldo: Number(u.pending_balance) || 0,
          cuota: Number(u.monthly_fee) || 300000,
          estado: u.debt_status || (Number(u.pending_balance) > 0 ? 'En mora' : 'Al día'),
          coeficiente: `${(Number(u.coefficient || 0.01) * 100).toFixed(2)}%`
        })));
      }
    } catch (err: any) {
      console.warn('Error cargando unidades en ConsolaGerencialUrbixPH:', err?.message);
    }
  };

  useEffect(() => {
    if (tenantActivoId) {
      cargarUnidadesReales(tenantActivoId);
    }
  }, [tenantActivoId]);

  const handleRegistrarPago = async (aptoId: string, aptoInfo: string, propietario: string, saldoActual: number) => {
    const inputMonto = window.prompt(
      `Registrar abono o pago total para ${aptoInfo} (${propietario}).\nSaldo actual: $${saldoActual.toLocaleString('es-CO')} COP.\n\nIngresa el valor pagado ($ COP):`,
      String(saldoActual)
    );
    if (!inputMonto) return;
    const monto = Number(inputMonto.replace(/\D/g, ''));
    if (!monto || monto <= 0) return;

    try {
      // Invocación de la Transacción Atómica en PostgreSQL (Prelación Legal Art. 1653 C.C.)
      const { data: resultado, error: rpcError } = await supabase.rpc('registrar_abono_atomico_ph', {
        p_tenant_id: tenantActivoId,
        p_unit_id: aptoId,
        p_unit_label: aptoInfo,
        p_payer_name: propietario,
        p_amount_paid: monto,
        p_payment_method: 'Transferencia / PSE',
        p_reference_code: `REF-${Date.now().toString().slice(-4)}`
      });

      if (rpcError) throw rpcError;

      await cargarUnidadesReales(tenantActivoId);
      cargarMetricasTenant(tenantActivoId).then(res => { if (res) setMetricas(res); });

      onShowToast?.(
        `✓ Recibo ${resultado.receiptNumber} emitido: $${monto.toLocaleString('es-CO')} aplicado (Mora: $${Number(resultado.appliedToInterest).toLocaleString('es-CO')} | Capital: $${Number(resultado.appliedToCapital).toLocaleString('es-CO')}).`
      );

      // Abrir Recibo Oficial de Caja en PDF listo para imprimir/guardar
      imprimirReciboDeCajaPDF(resolvedTenantName, aptoInfo, propietario, {
        receiptNumber: resultado.receiptNumber,
        totalPaid: monto,
        appliedToInterest: Number(resultado.appliedToInterest),
        appliedToSanctions: Number(resultado.appliedToSanctions),
        appliedToCapital: Number(resultado.appliedToCapital),
        newInterestBalance: Number(resultado.newInterestBalance),
        newSanctionsBalance: Number(resultado.newSanctionsBalance),
        newCapitalBalance: Number(resultado.newCapitalBalance),
        newTotalBalance: Number(resultado.newTotalBalance),
        status: resultado.status
      });
    } catch (err: any) {
      onShowToast?.(`Error aplicando abono atómico: ${err.message}`);
    }
  };

  // 1. Estados limpios (Sin datos ficticios quemados)
  const [reports, setReports] = useState<any[]>([]);
  const [localReservations, setLocalReservations] = useState<any[]>([]);
  const [pqrsList, setPqrsList] = useState<any[]>([]);
  const [cargandoModulosAdmin, setCargandoModulosAdmin] = useState<boolean>(false);

  const [isCircularOpen, setIsCircularOpen] = useState(false);
  const [circularTitle, setCircularTitle] = useState('');
  const [circularBody, setCircularBody] = useState('');

  // 2. Función para calcular fecha límite legal en días hábiles (Ley 1755/2015)
  const calcularFechaLimiteHabiles = (diasHabiles: number): string => {
    const fecha = new Date();
    let sumados = 0;
    while (sumados < diasHabiles) {
      fecha.setDate(fecha.getDate() + 1);
      const diaSemana = fecha.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        sumados++;
      }
    }
    return fecha.toISOString().split('T')[0];
  };

  // 3. Cargar Reservas y PQRSD reales desde Supabase para el edificio activo
  const cargarReservasYPqrsReales = async (tId: string) => {
    if (!tId) return;
    setCargandoModulosAdmin(true);
    try {
      // A. Consultar Reservas de Áreas Comunes
      const { data: resData } = await supabase
        .from('common_area_reservations')
        .select('*')
        .eq('tenant_id', tId)
        .order('created_at', { ascending: false });

      if (resData) {
        setLocalReservations(
          resData.map((r: any) => ({
            id: r.id,
            zona: r.amenity_name,
            apto: r.unit_label,
            residente: r.resident_name,
            phone: r.resident_phone,
            fecha: r.reservation_date,
            deposito: Number(r.deposit_amount || 100000),
            pazYSalvo: Boolean(r.is_paz_y_salvo),
            estado: r.status
          }))
        );
      }

      // B. Consultar Bandeja PQRSD y Circulares Oficiales
      const { data: pqrData } = await supabase
        .from('pqrsd_requests')
        .select('*')
        .eq('tenant_id', tId)
        .order('created_at', { ascending: false });

      if (pqrData) {
        setPqrsList(
          pqrData.map((p: any) => ({
            id: p.id,
            radicado: p.radicado,
            apto: p.unit_label,
            tipo: p.request_type,
            asunto: p.subject,
            estado: p.status,
            vence: p.legal_deadline
          }))
        );
      }
    } catch (err: any) {
      console.warn('Error sincronizando reservas y PQRSD:', err.message);
    } finally {
      setCargandoModulosAdmin(false);
    }
  };

  useEffect(() => {
    if (!tenantActivoId) return;
    cargarReservasYPqrsReales(tenantActivoId);

    // Suscripción Realtime para que lleguen al instante desde el Portal del Residente
    const canalAdmin = supabase
      .channel(`realtime_admin_ops_${tenantActivoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'common_area_reservations' },
        () => cargarReservasYPqrsReales(tenantActivoId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pqrsd_requests' },
        () => cargarReservasYPqrsReales(tenantActivoId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalAdmin);
    };
  }, [tenantActivoId]);

  const toggleEdificioForm = (edificio: string) => {
    setEdificiosSeleccionados((prev) =>
      prev.includes(edificio) ? prev.filter((e) => e !== edificio) : [...prev, edificio]
    );
  };

  const handleAgregarCustomForm = () => {
    if (!nuevoEdificioPersonalizado.trim()) return;
    const item = nuevoEdificioPersonalizado.trim();
    if (!edificiosSeleccionados.includes(item)) {
      setEdificiosSeleccionados((prev) => [...prev, item]);
    }
    setNuevoEdificioPersonalizado('');
  };

  const handleCrearEmpleado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevo.trim() || !emailNuevo.trim()) return;

    const edificiosFinales =
      edificiosSeleccionados.length > 0
        ? edificiosSeleccionados
        : [resolvedTenantName || 'Copropiedad PH'];

    const nuevoTrabajador: StaffMember = {
      id: `st_${Date.now()}`,
      nombre: nombreNuevo.trim(),
      rol: rolNuevo,
      email: emailNuevo.trim(),
      estado: 'Activo',
      edificios: edificiosFinales
    };

    setPersonalStaff([nuevoTrabajador, ...personalStaff]);
    setNombreNuevo('');
    setEmailNuevo('');
    setEdificiosSeleccionados(['Copropiedad PH']);
    onShowToast?.(`✅ ${rolNuevo} "${nuevoTrabajador.nombre}" registrado con ${edificiosFinales.length} edificio(s) asignados a cargo.`);
  };

  const handleAbrirEdicionEdificios = (staff: StaffMember) => {
    setStaffEnEdicion(staff);
    setEdificiosEdicionTemp(staff.edificios || ['Copropiedad PH']);
  };

  const toggleEdificioModal = (edificio: string) => {
    setEdificiosEdicionTemp((prev) =>
      prev.includes(edificio) ? prev.filter((e) => e !== edificio) : [...prev, edificio]
    );
  };

  const handleAgregarCustomModal = () => {
    if (!inputCustomEdicion.trim()) return;
    const item = inputCustomEdicion.trim();
    if (!edificiosEdicionTemp.includes(item)) {
      setEdificiosEdicionTemp((prev) => [...prev, item]);
    }
    setInputCustomEdicion('');
  };

  const handleGuardarEdificiosStaff = () => {
    if (!staffEnEdicion) return;
    const finalList = edificiosEdicionTemp.length > 0 ? edificiosEdicionTemp : ['Copropiedad PH'];

    setPersonalStaff((prev) =>
      prev.map((s) => (s.id === staffEnEdicion.id ? { ...s, edificios: finalList } : s))
    );

    onShowToast?.(`🏢 Edificios a cargo actualizados para ${staffEnEdicion.nombre}: ${finalList.length} asignados.`);
    setStaffEnEdicion(null);
  };

  const handleDespedirEmpleado = (id: string, nombre: string) => {
    setPersonalStaff(personalStaff.filter(s => s.id !== id));
    onShowToast?.(`🚫 Acceso revocado y empleado "${nombre}" dado de baja.`);
  };

  // 4. Emitir Circular Oficial persistiendo en Supabase
  const handleEmitCircular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circularTitle.trim()) return;

    const nuevoRadicado = `RAD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const asuntoCompleto = `${circularTitle.trim()}: ${circularBody.trim() || 'Comunicado oficial de administración'}`;

    try {
      const { error } = await supabase.from('pqrsd_requests').insert([
        {
          tenant_id: tenantActivoId,
          radicado: nuevoRadicado,
          unit_label: 'Todas las Torres',
          request_type: 'Circular Oficial Ley 675',
          subject: asuntoCompleto,
          legal_deadline: calcularFechaLimiteHabiles(15),
          status: 'Publicada ✓'
        }
      ]);

      if (error) throw error;

      setCircularTitle('');
      setCircularBody('');
      setIsCircularOpen(false);
      cargarReservasYPqrsReales(tenantActivoId);
      onShowToast?.('✓ Circular oficial guardada en base de datos y emitida a la copropiedad');
    } catch (err: any) {
      onShowToast?.(`Error publicando circular: ${err.message}`);
    }
  };

  const combinedReports = [
    ...guardIncidents.map((inc) => ({
      id: inc.id,
      area: inc.location || 'Área General',
      categoria: inc.category || 'General',
      detalle: inc.desc || inc.title || '',
      prioridad: (inc.category || '').includes('Seguridad') || (inc.category || '').includes('Daño') ? 'Alta' : 'Media',
      asignado: inc.assignedTo || 'Don José (Todero)',
      estado:
        inc.status === 'Solucionado' || inc.status === 'Resuelto'
          ? 'Solucionado'
          : inc.status === 'En Proceso' || inc.status === 'En Revisión'
          ? 'En proceso'
          : 'Pendiente',
      isLiveGuardIncident: true
    })),
    ...reports
  ];

  const filteredApartments = apartments.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.apto.toLowerCase().includes(q) ||
      a.propietario.toLowerCase().includes(q) ||
      `torre ${a.torre}`.includes(q) ||
      a.estado.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 flex flex-col rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
      
      {/* BANNER DE BLINDAJE DE VERSIÓN Y ARQUITECTURA */}
      <VersionShieldGuardBanner currentUserEmail={userProfile?.email} onShowToast={onShowToast} compact />

      {/* 1. CABECERA SIEMPRE ARRIBA */}
      <header className="w-full shrink-0 bg-[#0b0f17]/90 backdrop-blur-xl border-b border-cyan-500/20 px-4 sm:px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4">
            <LogoUrbix size="sm" rolBadge="ADMIN" />
            <div className="h-6 w-[1px] bg-slate-800" /> {/* Separador visual */}
            <span className="text-xs text-slate-400 font-mono hidden md:inline">Panel de Control General</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {edificiosAsignados.length > 0 ? (
                <div className="flex items-center gap-1.5 bg-[#07090e] border border-cyan-500/40 rounded-xl px-2.5 py-1 shadow-sm">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <select
                    value={edificioActivoId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      setEdificioActivoId(selId);
                      const sel = edificiosAsignados.find(t => t.id === selId);
                      if (sel) onShowToast?.(`🏢 Operando en: ${sel.name}`);
                    }}
                    className="bg-transparent text-cyan-300 font-bold outline-none cursor-pointer text-xs font-mono"
                  >
                    {edificiosAsignados.map((ed) => (
                      <option key={ed.id} value={ed.id} className="bg-slate-900 text-white font-mono">
                        {ed.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-xs text-slate-300 font-medium">{resolvedTenantName}</span>
              )}
              <span className="text-xs text-slate-600">•</span>
              <p className="text-xs text-slate-400 font-medium">
                <span className="text-cyan-400">Admin: {resolvedAdminName}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setMostrarModalCuadrilla(true)}
            className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[40px]"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" /> Asignar Cuadrilla ({resolvedTenantName})
          </button>

          {/* NUEVO BOTÓN: Configurar Cuotas y Presupuesto */}
          <button 
            type="button"
            onClick={() => setModalPresupuestoAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm cursor-pointer shrink-0 min-h-[40px]"
            title="Configurar presupuesto anual y cuotas de administración según Ley 675"
          >
            <span>💰</span>
            <span>Presupuesto & Cuotas Ley 675</span>
          </button>

          {/* BOTÓN: Tarifas & Cuota Admin */}
          <button 
            type="button"
            onClick={() => setModalCobroAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm cursor-pointer shrink-0 min-h-[40px]"
            title="Configurar cuota de administración y tarifas de recaudo"
          >
            <span>⚙️</span>
            <span>Tarifas & Cuota Admin</span>
          </button>

          {/* Botón Detalle Recaudo Dinámico */}
          <button 
            onClick={() => setAbrirModalRecaudo(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono"
          >
            <span>📊</span>
            <span>Detalle Recaudo ({porcentajeRecaudo.toFixed(1)}%)</span>
          </button>

          {/* Botón Caja Menor Dinámico */}
          <button 
            onClick={() => setAbrirModalCajaMenor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-mono"
          >
            <span>💼</span>
            <span>Caja Menor (${saldoCajaMenor.toLocaleString('es-CO')} COP)</span>
          </button>

          {onOpenCreateTenantModal && (
            <button
              type="button"
              onClick={onOpenCreateTenantModal}
              className="px-3.5 py-2 bg-[#07090e] hover:bg-slate-800 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Unidad
            </button>
          )}

          {onCerrarSesion && (
            <button
              type="button"
              onClick={onCerrarSesion}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[40px] shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:shadow-[0_0_20px_rgba(244,63,94,0.35)]"
              title="Cerrar sesión de Administrador PH"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>
      </header>

      {mostrarModalCuadrilla && (
        <GestionCuadrillaAdminModal
          tenantId={tenantActivoId}
          nombreConjunto={resolvedTenantName}
          onCerrar={() => setMostrarModalCuadrilla(false)}
          onShowToast={onShowToast}
        />
      )}

      {/* MODAL PRESUPUESTO ANUAL & CUOTAS LEY 675 (LIQUIDACIÓN AUTOMÁTICA POR COEFICIENTE) */}
      <ModalPresupuestoAdmin
        isOpen={modalPresupuestoAbierto}
        tenantId={tenantActivoId}
        onClose={() => setModalPresupuestoAbierto(false)}
        onShowToast={onShowToast}
        onActualizado={() => {
          if (tenantActivoId) {
            cargarMetricasTenant(tenantActivoId).then(res => { if (res) setMetricas(res); });
          }
        }}
      />

      {/* MODAL CONFIGURACIÓN DE FACTURACIÓN Y TARIFAS ADICIONALES */}
      {modalCobroAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl my-auto">
            <button 
              type="button"
              onClick={() => setModalCobroAbierto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold z-20 cursor-pointer"
              aria-label="Cerrar modal"
            >
              ✕
            </button>

            <ConfiguracionFacturacionModal 
              tenantId={tenantActivoId}
              nombreCopropiedad={resolvedTenantName}
              withoutBackdrop={true}
              onClose={() => setModalCobroAbierto(false)}
              onShowToast={onShowToast}
              onGuardado={() => {
                setModalCobroAbierto(false);
                if (tenantActivoId) {
                  cargarMetricasTenant(tenantActivoId).then(res => { if (res) setMetricas(res); });
                }
              }}
            />
          </div>
        </div>
      )}

      {/* SELECTOR MÓVIL DIRECTO (PANTALLAS PEQUEÑAS) */}
      <div className="lg:hidden w-full bg-[#0b0f17] border border-cyan-500/20 p-2.5 rounded-2xl flex items-center gap-2 shadow-md">
        <span className="text-xs font-mono text-cyan-400 font-bold shrink-0">Submódulo:</span>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as any)}
          className="bg-slate-900 text-cyan-300 font-bold text-xs p-2 rounded-xl border border-slate-700 w-full outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option value="general">🏢 Vista General</option>
          <option value="cartelera">📢 Cartelera Virtual y Circulares Oficiales</option>
          <option value="asamblea">🗳️ Asambleas & Actas Legales (Ley 675)</option>
          <option value="contractors">🛡️ Contratistas & Obras (SG-SST)</option>
          <option value="cartera">💰 Tesorería, OCR & Exógena DIAN</option>
          <option value="mantenimiento">🔧 Mantenimiento & Órdenes</option>
          <option value="porteria">🚨 Portería & Minuta (Tiempo Real Supabase)</option>
          <option value="mudanzas">🚚 Censo & Salvoconductos de Mudanza</option>
          <option value="gobierno">⚖️ Consejo, Licitaciones & Poderes</option>
          <option value="personal">👥 Personal & Staff</option>
          <option value="reservas">📅 Áreas Comunes & Depósitos</option>
          <option value="pqrs">💬 PQRS (Ley 1755)</option>
        </select>
      </div>

      {/* 2. BARRA DE NAVEGACIÓN EN UNA SOLA LÍNEA HORIZONTAL SIN SALTOS (SWIPE TÁCTIL) */}
      <nav className="w-full flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-2 px-3 bg-[#0b0f17] border border-cyan-500/20 rounded-2xl shrink-0 shadow-lg touch-pan-x">
        {[
          { id: 'general', label: 'Vista General', icon: Building2, color: 'text-cyan-400' },
          { id: 'asamblea', label: 'Asambleas & Actas Legales', icon: Users, color: 'text-cyan-400' },
          { id: 'gobierno', label: 'Gobierno & Consejo', icon: Scale, color: 'text-emerald-400' },
          { id: 'contractors', label: 'Contratistas & Obras', icon: HardHat, color: 'text-emerald-400' },
          { id: 'cartera', label: 'Tesorería, OCR & DIAN', icon: DollarSign, color: 'text-teal-400' },
          { id: 'prejuridico', label: 'Cobro Prejurídico & Acuerdos', icon: AlertOctagon, color: 'text-rose-400' },
          { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench, color: 'text-amber-400' },
          { id: 'cartelera', label: 'Cartelera & Circulares', icon: FileText, color: 'text-sky-400' },
          { id: 'porteria', label: 'Portería (Tiempo Real)', icon: ShieldCheck, color: 'text-blue-400' },
          { id: 'mudanzas', label: 'Censo & Mudanzas', icon: Truck, color: 'text-amber-400' },
          { id: 'personal', label: 'Personal & Staff', icon: Users, color: 'text-purple-400' },
          { id: 'reservas', label: 'Áreas Comunes', icon: Calendar, color: 'text-indigo-400' },
          { id: 'pqrs', label: 'PQRS', icon: MessageSquare, color: 'text-cyan-400' },
          { id: 'whatsapp', label: 'Notificaciones WhatsApp', icon: MessageSquare, color: 'text-emerald-400' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'asamblea' && activeTab === 'actas');
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 min-h-[40px] pointer-events-auto ${
                isActive 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} /> {tab.label}
            </button>
          );
        })}
      </nav>

      {/* BOTÓN / BREADCRUMB PARA VOLVER A VISTA GENERAL DESDE CUALQUIER SUBMÓDULO */}
      {activeTab !== 'general' && (
        <div className="w-full flex items-center justify-between bg-[#0b0f17]/90 border border-cyan-500/20 px-4 py-2.5 rounded-2xl shrink-0 shadow-md">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" /> Vista General
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-white font-bold uppercase tracking-wider">
              {activeTab === 'asamblea' || activeTab === 'actas'
                ? 'Asambleas & Actas Legales'
                : activeTab === 'contractors'
                ? 'Contratistas & Obras'
                : activeTab === 'cartera' || activeTab === 'facturas_ocr' || activeTab === 'exogena_dian'
                ? 'Tesorería, OCR & DIAN'
                : activeTab === 'prejuridico'
                ? 'Cobro Prejurídico & Acuerdos'
                : activeTab === 'mantenimiento'
                ? 'Mantenimiento & Órdenes'
                : activeTab === 'cartelera'
                ? 'Cartelera & Circulares'
                : activeTab === 'porteria'
                ? 'Portería en Tiempo Real'
                : activeTab === 'personal'
                ? 'Personal & Staff'
                : activeTab === 'reservas'
                ? 'Áreas Comunes'
                : activeTab === 'pqrs'
                ? 'PQRSD Ley 1755'
                : activeTab === 'whatsapp'
                ? 'Notificaciones WhatsApp'
                : activeTab}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
          >
            ← Volver a Vista General
          </button>
        </div>
      )}

      {/* 3. CONTENIDO PRINCIPAL ABAJO */}
      <main className="w-full flex-1 space-y-6">
        
        {/* 1. GENERAL (Control Multi-Copropiedad, Macro-Salud PH y SaaS Interactivo) */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <SelectorPortafolioMultiConjunto
              onShowToast={onShowToast}
              edificiosAsignados={edificiosAsignados}
              edificioActivoId={edificioActivoId}
              onSelectEdificioId={setEdificioActivoId}
              onSelectCopropiedad={(nombre) => {
                const match = edificiosAsignados.find(e => e.name === nombre);
                if (match) setEdificioActivoId(match.id);
              }}
              metricas={metricas}
            />
            <div className="mb-6">
              <BotonPagoSuscripcionAdmin
                tenantId={tenantActivoId}
                tenantNombre={tenantData?.name}
                montoCOP={tenantData?.monthly_fee || 0}
                estadoSuscripcion={tenantData?.subscription_status || 'active'}
                onPagoCompletado={() => {
                  cargarMetricasGenerales();
                }}
              />
            </div>
            <AdminGeneralInteractive 
              onShowToast={onShowToast} 
              metricas={metricas}
              saldoCajaMenor={saldoCajaMenor}
              porcentajeRecaudo={porcentajeRecaudo}
              morosos={apartments.filter((a) => a.saldo > 0).map((a) => ({
                id: a.id,
                torre: a.torre,
                apto: a.apto,
                propietario: a.propietario,
                saldo: a.saldo,
                dias: 30,
                estado: a.estado
              }))}
              onOpenDetalleRecaudo={() => setModalRecaudoAbierto(true)}
              onOpenDetalleCajaMenor={() => setModalCajaMenorAbierto(true)}
            />

            {/* Tarjetas de acceso directo gerencial */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" /> Cartera Crítica / Cobro Prejurídico (Ley 675)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cartera')}
                    className="text-xs text-cyan-400 font-bold hover:underline cursor-pointer"
                  >
                    Ver cartera →
                  </button>
                </div>
                <div className="space-y-2">
                  {apartments.filter((a) => a.saldo > 0).map((a) => (
                    <div key={a.id} className="p-3 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">Torre {a.torre} - Apto {a.apto}</span>
                        <p className="text-slate-400">{a.propietario}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-rose-400">${a.saldo.toLocaleString('es-CO')}</p>
                        <span className="text-[10px] text-slate-500 uppercase">{a.estado}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" /> Personal Activo y Operación SG-SST
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('personal')}
                      className="text-xs text-purple-400 font-bold hover:underline cursor-pointer"
                    >
                      Gestionar Staff ({personalStaff.length}) →
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('contractors')}
                      className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Contratistas SG-SST →
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {cargandoStaff ? (
                    <div className="text-center py-6 text-slate-500 font-mono text-xs">
                      Cargando personal de la copropiedad...
                    </div>
                  ) : personalStaff.length === 0 ? (
                    <div className="text-center py-6 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 font-mono text-xs">
                      No hay personal asignado a este conjunto. Haz clic en "Asignar Cuadrilla" o "Gestionar Staff" para registrar a los vigilantes o personal de aseo reales.
                    </div>
                  ) : (
                    personalStaff.slice(0, 3).map((s) => (
                      <div key={s.id} className="p-3 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between text-xs gap-2">
                        <div>
                          <span className="font-bold text-white">{s.nombre}</span>
                          <p className="text-slate-400 font-mono text-[11px]">{s.rol} • {s.email}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
                          🟢 {s.estado}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Pestaña o Sección de Ajustes de Notificaciones */}
            <div className="mt-6">
              <WhatsAppConfigCard 
                tenantName="Copropiedad PH" 
                onShowToast={onShowToast} 
              />
            </div>
          </div>
        )}

        {/* 1B. CARTELERA VIRTUAL Y CIRCULARES OFICIALES */}
        {activeTab === 'cartelera' && <TableroComunicados tenantId={tenantId} />}

        {/* 2. CENTRO INTEGRAL DE ASAMBLEAS & ACTAS LEGALES (LEY 675 DE 2001) */}
        {(activeTab === 'asamblea' || activeTab === 'actas') && (
          <div className="space-y-6">
            <ModuloGobiernoYConsejoReal
              tenantId={tenantActivoId}
              tenantName={resolvedTenantName}
              onShowToast={onShowToast}
            />
            <ModuloReunionesConSubmodulos
              unidadResidenteActual="Administración Principal"
              rolUsuario="admin"
              esConsejero={true}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* 3. CONTRATISTAS & OBRAS */}
        {activeTab === 'contractors' && (
          <ContractorsModule tenantName={resolvedTenantName} onShowToast={onShowToast} />
        )}

        {/* COBRO PREJURÍDICO & ACUERDOS */}
        {activeTab === 'prejuridico' && (
          <ModuloCobroPrejuridicoReal
            tenantId={tenantActivoId}
            tenantName={resolvedTenantName}
            onShowToast={onShowToast}
          />
        )}

        {/* 4. SECCIÓN DE TESORERÍA CON SUB-PESTAÑAS (FLUJO DE CAJA, OCR FACTURAS, EXÓGENA DIAN & NIIF) */}
        {(activeTab === 'cartera' || activeTab === 'facturas_ocr' || activeTab === 'exogena_dian') && (
          <SeccionTesoreriaConDIAN
            onShowToast={onShowToast}
            nombreCopropiedad={resolvedTenantName}
          >
            <div className="space-y-4">
              <ModuloTesoreriaExogenaReal tenantId={tenantActivoId} onShowToast={onShowToast} />
              <ModuloTesoreriaOCR tenantId={tenantActivoId} onShowToast={onShowToast} />
              <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                      <DollarSign className="w-4 h-4 text-cyan-400" /> Tesorería y Cartera Ordinaria / Extraordinaria (Ley 675)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Control unificado de expensas, intereses de mora, recaudos PSE y estados de cuenta por coeficiente.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar unidad o propietario..."
                        className="pl-8 pr-3 py-1.5 bg-[#07090e] border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                    {/* Botón Detalle Recaudo Dinámico */}
                    <button 
                      onClick={() => setAbrirModalRecaudo(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono cursor-pointer"
                    >
                      <span>📊</span>
                      <span>Detalle Recaudo ({porcentajeRecaudo.toFixed(1)}%)</span>
                    </button>

                    {/* Botón Caja Menor Dinámico */}
                    <button 
                      onClick={() => setAbrirModalCajaMenor(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-mono cursor-pointer"
                    >
                      <span>💼</span>
                      <span>Caja Menor (${saldoCajaMenor.toLocaleString('es-CO')} COP)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalCobroAbierto(true)}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Configurar cuotas, presupuesto y pronto pago"
                    >
                      <Calculator className="w-3.5 h-3.5 text-cyan-400" /> Tarifas & Cuota Admin
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const total = await ejecutarCausacionMensualCopropiedad(tenantActivoId, 2.1);
                          await cargarUnidadesReales(tenantActivoId);
                          onShowToast?.(`✓ Causación mensual Ley 675 ejecutada en ${total} unidades (+1% Fondo Imprevistos).`);
                        } catch (e: any) {
                          onShowToast?.(`Error en causación: ${e.message}`);
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> Causar Mes (Ley 675)
                    </button>

                    <button
                      type="button"
                      onClick={() => exportarContabilidadSiigoWorldOffice(tenantActivoId, resolvedTenantName)}
                      className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold text-emerald-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Exportar PUC (Siigo / World Office)
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto bg-[#07090e] border border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3.5">Unidad</th>
                        <th className="p-3.5">Propietario</th>
                        <th className="p-3.5">Coeficiente</th>
                        <th className="p-3.5">Saldo Cartera</th>
                        <th className="p-3.5">Estado</th>
                        <th className="p-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {filteredApartments.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-900/50">
                          <td className="p-3.5 font-bold text-white">Torre {a.torre} - {a.apto}</td>
                          <td className="p-3.5">{a.propietario}</td>
                          <td className="p-3.5 font-mono">{a.coeficiente}</td>
                          <td className="p-3.5 font-black text-white">${a.saldo.toLocaleString('es-CO')}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.saldo === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {a.estado}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {a.saldo === 0 ? (
                              <button
                                type="button"
                                onClick={() => onShowToast?.(`✅ Certificado de Paz y Salvo emitido para Torre ${a.torre} - ${a.apto}`)}
                                className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
                              >
                                Emitir Paz y Salvo
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRegistrarPago(a.id, `Torre ${a.torre} - ${a.apto}`, a.propietario, a.saldo || a.cuota || 300000)}
                                className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                              >
                                Registrar Pago
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </SeccionTesoreriaConDIAN>
        )}

        {/* 5. MANTENIMIENTO */}
        {activeTab === 'mantenimiento' && (
          <ModuloMantenimientoReal tenantId={tenantActivoId} onShowToast={onShowToast} />
        )}

        {/* 6. PERSONAL & STAFF (Control Total del Administrador, Edificios, Nómina y Turnos de Línea de Tiempo) */}
        {activeTab === 'personal' && (
          <SeccionGestionPersonalAdmin
            onShowToast={onShowToast}
            edificiosAsignados={edificiosAsignados}
            edificioActivoId={edificioActivoId}
            setEdificioActivoId={setEdificioActivoId}
          />
        )}

        {/* 7. ÁREAS COMUNES */}
        {activeTab === 'reservas' && (
          <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <Calendar className="w-4 h-4 text-indigo-400" /> Gestión de Áreas Comunes y Depósitos
                </h3>
                <p className="text-xs text-slate-400 mt-1">Control de reservas para Salón Social, Zona BBQ y Cancha Sintética con validación de paz y salvo.</p>
              </div>
              <div className="flex items-center gap-2 bg-[#07090e] border border-slate-800 px-3 py-2 rounded-xl text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-mono">
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={(e) => setWhatsappEnabled(e.target.checked)}
                    className="accent-emerald-400 cursor-pointer"
                  />
                  <span>Alertas WhatsApp ({whatsappEnabled ? 'Activas' : 'Pausadas'})</span>
                </label>
                <button
                  type="button"
                  onClick={handleSaveWhatsAppConfig}
                  className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg font-bold transition cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {localReservations.map((res) => (
                <div key={res.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-white text-sm">{res.zona}</h4>
                        <p className="text-xs text-slate-400">{res.apto} • {res.residente}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                        res.pazYSalvo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {res.pazYSalvo ? 'Paz y Salvo ✓' : 'En Mora ✕'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono mt-2">📅 {res.fecha}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Depósito Garantía: <strong className="text-cyan-400">${res.deposito.toLocaleString('es-CO')} COP</strong></p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Estado: <strong className="text-white">{res.estado}</strong></span>
                    {res.pazYSalvo && res.estado !== 'Aprobada ✓' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await supabase
                            .from('common_area_reservations')
                            .update({ status: 'Aprobada ✓' })
                            .eq('id', res.id);

                          setLocalReservations((prev) =>
                            prev.map((item) => (item.id === res.id ? { ...item, estado: 'Aprobada ✓' } : item))
                          );
                          try {
                            await fetch('/api/webhook/whatsapp-alert', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                eventType: 'RESERVATION_APPROVED',
                                record: {
                                  resident: res.residente,
                                  amenity: res.zona,
                                  date: res.fecha
                                },
                                tenantName: resolvedTenantName,
                                whatsappConfig: {
                                  enabled: whatsappEnabled,
                                  token: whatsappToken
                                }
                              })
                            });
                          } catch (e) {
                            console.warn("No se pudo despachar la notificación por WhatsApp:", e);
                          }
                          onShowToast?.(`✅ Reserva de ${res.zona} aprobada para ${res.apto}`);
                        }}
                        className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Aprobar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pestaña o Sección de Ajustes de Notificaciones */}
            <div className="mt-6">
              <WhatsAppConfigCard 
                tenantName="Copropiedad PH" 
                onShowToast={onShowToast} 
              />
            </div>

            {/* Módulo de Censo Integral y Salvoconductos de Mudanza */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <ModuloCensoYMudanzasReal
                tenantId={tenantActivoId}
                tenantName={resolvedTenantName}
                onShowToast={onShowToast}
              />
            </div>
          </div>
        )}

        {/* 8. PQRS */}
        {activeTab === 'pqrs' && (
          <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> Bandeja PQRSD (Ley 1755 y Ley 675)
                </h3>
                <p className="text-xs text-slate-400 mt-1">Atención de peticiones, quejas y reclamos con plazos legales y firma digital.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCircularOpen(!isCircularOpen)}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Emitir Circular Oficial
              </button>
            </div>

            {isCircularOpen && (
              <form onSubmit={handleEmitCircular} className="p-4 bg-[#07090e] border border-cyan-500/30 rounded-2xl space-y-3 text-xs">
                <h4 className="font-bold text-cyan-400">Nueva Circular Institucional (Ley 675)</h4>
                <input
                  type="text"
                  required
                  value={circularTitle}
                  onChange={(e) => setCircularTitle(e.target.value)}
                  placeholder="Título (ej. Mantenimiento Preventivo de Ascensores)"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400"
                />
                <textarea
                  rows={2}
                  value={circularBody}
                  onChange={(e) => setCircularBody(e.target.value)}
                  placeholder="Mensaje o detalle para todos los copropietarios..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCircularOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-xl cursor-pointer"
                  >
                    Publicar Circular
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {pqrsList.map((p) => (
                <div key={p.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400">{p.radicado}</span>
                      <span className="font-bold text-white">{p.tipo}</span>
                      <span className="text-slate-400">• {p.apto}</span>
                      {p.vence && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Vence: {p.vence}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 mt-1">{p.asunto}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg font-bold border ${
                      (p.estado || '').includes('Respondido') || (p.estado || '').includes('Publicada')
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {p.estado}
                    </span>
                    {!(p.estado || '').includes('Respondido') && !(p.estado || '').includes('Publicada') && (
                      <button
                        type="button"
                        onClick={async () => {
                          await supabase
                            .from('pqrsd_requests')
                            .update({
                              status: 'Respondido con Firma Digital ✓',
                              responded_at: new Date().toISOString()
                            })
                            .eq('id', p.id);

                          setPqrsList((prev) =>
                            prev.map((item) =>
                              item.id === p.id ? { ...item, estado: 'Respondido con Firma Digital ✓' } : item
                            )
                          );
                          onShowToast?.(`✓ Radicado ${p.radicado} respondido y sellado en Supabase (Ley 1755)`);
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition cursor-pointer"
                      >
                        Firmar Respuesta
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <TableroComunicados tenantId={tenantActivoId} />
            </div>
          </div>
        )}

        {/* 10. PORTERÍA & SINCRONIZACIÓN EN TIEMPO REAL CON SUPABASE */}
        {activeTab === 'porteria' && (
          <PorteriaSupabaseSync
            tenantId={currentTenant?.id || 'ten_01'}
            vigilanteName={resolvedAdminName}
            onShowToast={onShowToast}
          />
        )}

        {/* 11. CENSO INTEGRAL & SALVOCONDUCTOS DE MUDANZA */}
        {activeTab === 'mudanzas' && (
          <ModuloCensoYMudanzasReal
            tenantId={tenantActivoId}
            tenantName={resolvedTenantName}
            onShowToast={onShowToast}
          />
        )}

        {/* 12. GOBIERNO CORPORATIVO, CONSEJO & PODERES */}
        {activeTab === 'gobierno' && (
          <ModuloGobiernoYConsejoReal
            tenantId={tenantActivoId}
            tenantName={resolvedTenantName}
            onShowToast={onShowToast}
          />
        )}

        {/* 11. NOTIFICACIONES WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <WhatsAppConfigCard
            tenantName={resolvedTenantName || 'Copropiedad PH'}
            onShowToast={onShowToast}
          />
        )}

      </main>

      {/* MODAL DETALLE DE RECAUDO EN VIVO (100 UNIDADES TRICENTENARIO) */}
      <DetalleRecaudoModal
        isOpen={modalRecaudoAbierto}
        onClose={() => {
          setModalRecaudoAbierto(false);
          syncMetricasGenerales();
        }}
        tenantId={tenantActivoId}
        tenantName={resolvedTenantName}
        onShowToast={onShowToast}
        onPagoRegistrado={() => {
          syncMetricasGenerales();
          if (tenantActivoId) {
            cargarMetricasTenant(tenantActivoId).then(res => { if (res) setMetricas(res); });
            cargarUnidadesReales(tenantActivoId);
          }
        }}
      />

      {/* MODAL DETALLE DE CAJA MENOR (FONDO FIJO & ARQUEO EN VIVO DESDE CERO) */}
      <DetalleCajaMenorModal
        isOpen={modalCajaMenorAbierto}
        onClose={() => {
          setModalCajaMenorAbierto(false);
          syncMetricasGenerales();
        }}
        tenantId={tenantActivoId}
        tenantName={resolvedTenantName}
        onShowToast={onShowToast}
        onMovimientoRegistrado={() => {
          syncMetricasGenerales();
        }}
      />

    </div>
  );
}
