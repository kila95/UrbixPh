import React, { useState } from 'react';
import { 
  Building2, Home, QrCode, Package, Send, Sparkles, Camera, Bot, User, Calendar, MessageSquare, Download, Store, Globe, Tag, Clock, Flame, MapPin, CheckCircle2, Share2, Copy, Car, Shield, AlertCircle, PhoneCall, LogOut
} from 'lucide-react';
import ResidenteEmprendimientosApp from './ResidenteEmprendimientosApp';
import RedMarketplaceOfertasApp from './RedMarketplaceOfertasApp';
import ResidenteModuloFinancieroApp from './ResidenteModuloFinancieroApp';
import ResidenteMiApartamentoGeneral from './ResidenteMiApartamentoGeneral';
import SalaAsambleaVirtualExecutive from './SalaAsambleaVirtualExecutive';
import ModuloReunionesConSubmodulos from './ModuloReunionesConSubmodulos';
import CitofonoVirtualUrbix from './CitofonoVirtualUrbix';
import { UnidadCarteraPH, ReformaMudanzaPH, SancionConvivenciaPH } from '../PanelAdministradorModulo3';
import type { VisitaQrPH, EncomiendaPH } from '../App';

export interface UnidadAsambleaPH {
  id: string;
  unidad: string;
  propietario: string;
  coeficiente: number;
  presente: boolean;
  poder: boolean;
  esResidenteActual?: boolean;
}

export interface MocionAsambleaPH {
  id: string;
  titulo: string;
  descripcion: string;
  tipoMayoria: 'Simple (50% + 1)' | 'Calificada (70% Ley 675)';
  estado: 'Activa' | 'Cerrada';
  resultado?: 'APROBADA (Ley 675)' | 'RECHAZADA (No alcanza mayoría)';
  votosFavor: number;
  votosContra: number;
  votosAbstencion: number;
  unidadesQueVotaron: string[];
  votosDetalle?: Record<string, 'favor' | 'contra' | 'abstencion'>;
}

export interface CasoPqrsdLey1755 {
  id: string;
  radicado: string;
  unidad: string;
  propietario: string;
  tipo:
    | 'Derecho de Petición General (15 días hábiles - Ley 1755)'
    | 'Reclamo Técnico: Filtración / Humedad Bienes Comunes (10 días hábiles)'
    | 'Queja de Convivencia / Ruido / Mascotas (10 días hábiles - Ley 675)'
    | 'Solicitud de Copias de Actas / Contratos (10 días hábiles)';
  asunto: string;
  descripcion: string;
  fechaRadicacion: string;
  terminoDiasHabiles: number;
  diasHabilesRestantes: number;
  horasRestantes: number;
  estado:
    | 'En Término Legal'
    | 'Escalado a Comité de Convivencia'
    | 'Respondido con Firma Digital'
    | 'Alerta Vencimiento (<48h)';
  respuestaOficial?: string;
  firmaDigitalHash?: string;
  soporteAdjunto?: string;
  fechaRespuesta?: string;
}

export interface ReservaZonaComunDepPH {
  id: string;
  codigoReserva: string;
  unidad: string;
  propietario: string;
  zona:
    | 'Salón Social Principal'
    | 'Terraza BBQ Panorámica'
    | 'Zona Teppanyaki & Lounge'
    | 'Salón Infantil & Juegos';
  fechaEvento: string;
  horario: string;
  tarifaUso: number;
  depositoGarantia: number;
  totalPagadoPasarela: number;
  referenciaPasarela: string;
  checklist: {
    murosPinturaOk: boolean;
    sillasMesasOk: boolean;
    aseoProfundoOk: boolean;
    sonidoVidriosOk: boolean;
    observacionesInspector: string;
  };
  estadoDeposito:
    | 'En Custodia ($100.000 COP)'
    | 'Reembolsado 100% al Residente'
    | 'Retenido + Sanción Cargada al Extracto';
  porcentajeRetenido: number;
  montoRetenido: number;
  sancionExtractoGenerada?: string;
}

export interface ContratistaSgsstPorteriaPH {
  id: string;
  empresa: string;
  tecnicoNombre: string;
  cedula: string;
  especialidad:
    | 'Ascensores (Schindler / Andinos)'
    | 'Jardinería y Paisajismo'
    | 'Pintura de Fachadas y Alturas'
    | 'Mantenimiento Hidrobombas';
  codigoQr: string;
  polizaRce: {
    numero: string;
    aseguradora: string;
    vencimiento: string;
    vigente: boolean;
  };
  arlPlanilla: {
    entidad: string;
    nivelRiesgo: 'Riesgo V (Alturas/Eléctrico)' | 'Riesgo IV' | 'Riesgo III';
    planillaPila: string;
    vencimiento: string;
    vigente: boolean;
  };
  epsSalud: {
    entidad: string;
    vigente: boolean;
  };
  estadoPorteria:
    | 'QR HABILITADO (SG-SST OK)'
    | 'BLOQUEADO EN PORTERÍA (Riesgo Solidario)'
    | 'Adentro en Labor';
  ultimoEscaneo?: string;
}

// =========================================================================
// URBIX PH - PORTAL DEL RESIDENTE (COMPLETO: FASES, EMPRENDIMIENTOS Y ASISTENTE IA LEY 675)
// =========================================================================

export default function ResidentPortalConsole({ 
  onShowToast,
  unidades = [],
  reformasMudanzas = [],
  sanciones = [],
  unidadesAsamblea = [],
  mociones = [],
  onVotarMocion,
  onToggleAsistenciaResidente,
  pqrsdList = [],
  onRadicarPqrsd,
  reservasZonasList = [],
  onCrearReservaZona,
  visitasQr = [],
  onCrearVisitaQr,
  encomiendas = [],
  onEntregarEncomienda,
  visitasQrShared,
  setVisitasQrShared,
  encomiendasShared,
  setEncomiendasShared,
  onCerrarSesion,
  userProfile
}: { 
  onShowToast?: (msg: string) => void;
  unidades?: UnidadCarteraPH[];
  reformasMudanzas?: ReformaMudanzaPH[];
  sanciones?: SancionConvivenciaPH[];
  unidadesAsamblea?: UnidadAsambleaPH[];
  mociones?: MocionAsambleaPH[];
  onVotarMocion?: (mocionId: string, unidadId: string, sentido: 'favor' | 'contra' | 'abstencion') => void;
  onToggleAsistenciaResidente?: (unidadId: string) => void;
  pqrsdList?: CasoPqrsdLey1755[];
  onRadicarPqrsd?: (nuevoCaso: {
    tipo: CasoPqrsdLey1755['tipo'];
    asunto: string;
    descripcion: string;
  }) => void;
  reservasZonasList?: ReservaZonaComunDepPH[];
  onCrearReservaZona?: (nuevaReserva: {
    zona: ReservaZonaComunDepPH['zona'];
    fechaEvento: string;
    horario: string;
    tarifaUso: number;
    depositoGarantia: number;
  }) => void;
  visitasQr?: VisitaQrPH[];
  onCrearVisitaQr?: (visita: any) => VisitaQrPH | void;
  encomiendas?: EncomiendaPH[];
  onEntregarEncomienda?: (encomiendaId: string, pin?: string) => boolean;
  visitasQrShared?: VisitaQrPH[];
  setVisitasQrShared?: React.Dispatch<React.SetStateAction<VisitaQrPH[]>>;
  encomiendasShared?: EncomiendaPH[];
  setEncomiendasShared?: React.Dispatch<React.SetStateAction<EncomiendaPH[]>>;
  onCerrarSesion?: () => void;
  userProfile?: any;
}) {
  const activeVisitasQr = visitasQrShared || visitasQr;
  const activeEncomiendas = encomiendasShared || encomiendas;
  const [activeTabResidente, setActiveTabResidente] = useState('mi_apartamento');
  const [zonaSeleccionadaReserva, setZonaSeleccionadaReserva] = useState<ReservaZonaComunDepPH['zona']>('Salón Social Principal');
  const [fechaReservaInput, setFechaReservaInput] = useState('2026-11-14');
  const [horarioReservaInput, setHorarioReservaInput] = useState('02:00 PM - 10:00 PM');
  const [tipoPqrsdInput, setTipoPqrsdInput] = useState<CasoPqrsdLey1755['tipo']>('Reclamo Técnico: Filtración / Humedad Bienes Comunes (10 días hábiles)');
  const [asuntoPqrsdInput, setAsuntoPqrsdInput] = useState('');
  const [descPqrsdInput, setDescPqrsdInput] = useState(''); 

  const unidadResidente = unidadesAsamblea.find(u => u.esResidenteActual) || {
    id: 'u1',
    unidad: 'Torre 2 - 301',
    propietario: 'Esteban Ochoa',
    coeficiente: 18.5,
    presente: true,
    poder: false,
    esResidenteActual: true
  };

  const hayMocionActiva = mociones.some(m => m.estado === 'Activa');
  const mocionesActivasCount = mociones.filter(m => m.estado === 'Activa').length;
  const quorumActual = Number(
    unidadesAsamblea
      .filter(u => u.presente || u.poder)
      .reduce((acc, u) => acc + u.coeficiente, 0)
      .toFixed(1)
  );

  // Estado local para los pases QR generados por el residente
  const [pasesQRResidente] = useState([
    { id: '1', visitante: 'Maria Gomez', cedula: '43281920', fecha: '2026-10-25', codigoQR: 'URBIX-QR-8842', estado: 'Activo' }
  ]);

  const [misPaquetes] = useState([
    { 
      id: '1', 
      destino: 'Torre 2 - 301', 
      empresa: 'Servientrega', 
      descripcion: 'Caja mediana sellada (Amazon)', 
      fotoLlegada: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=300&q=80',
      estado: 'En Custodia', 
      fechaLlegada: '2026-10-24 08:30 AM'
    }
  ]);

  const [misReservas, setMisReservas] = useState([
    { id: '1', zona: 'Salón Social Principal', fecha: '2026-11-05', hora: '12:00 PM - 08:00 PM', costo: 80000, estado: 'Aprobado' }
  ]);

  const [misPqrsd, setMisPqrsd] = useState([
    { id: '1', tipo: 'Solicitud de Mantenimiento', asunto: 'Bombillo fundado en pasillo Torre 2 piso 3', fecha: '2026-10-24', estado: 'En Proceso' }
  ]);

  // Estados para Urbix Copilot (Asistente IA)
  const [chatMensajes, setChatMensajes] = useState([
    { id: '1', remitente: 'ia', texto: '¡Hola, Esteban! Soy tu **Urbix Copilot Vecinal**. Estoy aquí para ayudarte con consultas sobre la Ley 675, radicar reportes con foto o revisar el estado de tu apartamento. ¿En qué te puedo colaborar hoy?' }
  ]);
  const [inputChat, setInputChat] = useState('');

  // Función para manejar el Chat Inteligente
  const enviarMensajeIA = (e: any) => {
    e.preventDefault();
    if (!inputChat.trim()) return;

    const mensajeUsuario = { id: Date.now().toString(), remitente: 'usuario', texto: inputChat };
    setChatMensajes(prev => [...prev, mensajeUsuario]);
    const consulta = inputChat.toLowerCase();
    setInputChat('');

    // Simulación de respuesta inteligente de la IA según el contexto de la copropiedad
    setTimeout(() => {
      let respuestaTexto = "Entendido. He registrado tu solicitud en el sistema de la copropiedad.";
      
      if (consulta.includes('mora') || consulta.includes('dejar de pagar') || consulta.includes('intereses')) {
        respuestaTexto = `⚖️ **Consecuencias de la mora en Propiedad Horizontal (Ley 675):**\n\n1. **Intereses de mora:** Se causarán intereses moratorios a la tasa máxima legal permitida por la Superintendencia Financiera.\n2. **Cobro Jurídico:** Con más de 2 cuotas vencidas, la administración puede iniciar un proceso ejecutivo de cobro con posible embargo.\n3. **Restricciones:** Se pueden restringir derechos de uso de bienes comunes no esenciales (como el salón social).`;
      } else if (consulta.includes('mudanza') || consulta.includes('horario')) {
        respuestaTexto = "📦 **Normativa de Mudanzas (Ley 675 / Manual Interno):** Las mudanzas están permitidas de lunes a sábado de 8:00 AM a 5:00 PM. Debes notificar a portería con 24 horas de anticipación.";
      } else if (consulta.includes('perros') || consulta.includes('mascota')) {
        respuestaTexto = "🐕 **Normativa de Mascotas:** Permitidas según manual interno. En zonas comunes obligatoriamente deben transitar con correa y bozal si aplican razas de manejo especial.";
      } else if (consulta.includes('saldo') || consulta.includes('cuenta') || consulta.includes('paz y salvo')) {
        respuestaTexto = `💳 Tu cuota mensual es de $ ${miEstadoCuenta.cuotaMensual.toLocaleString()} COP. Actualmente te encuentras **Al día** con un saldo de $0 COP. ¡Felicitaciones!`;
      } else if (consulta.includes('agua') || consulta.includes('luz') || consulta.includes('fuga') || consulta.includes('daño')) {
        respuestaTexto = "🔧 ¡Reporte entendido! He clasificado esto como una **Urgencia Operativa** y acabo de notificar automáticamente al Supervisor Operativo en terreno para que envíe a la cuadrilla.";
      }

      const respuestaIA = { id: (Date.now() + 1).toString(), remitente: 'ia', texto: respuestaTexto };
      setChatMensajes(prev => [...prev, respuestaIA]);
    }, 800);
  };

  // Estado financiero de la unidad (Fase 3)
  const [miEstadoCuenta, setMiEstadoCuenta] = useState({
    unidad: 'Torre 2 - 301',
    propietario: 'Esteban Ochoa',
    coeficiente: '18.5%',
    cuotaMensual: 450000,
    saldoActual: 0,
    estadoCartera: 'Al día',
    movimientos: [
      { id: '1', concepto: 'Cuota Ordinaria Octubre 2026', cargo: 450000, abono: 450000, fecha: '2026-10-02', ref: 'CUS-98312' },
      { id: '2', concepto: 'Cuota Ordinaria Septiembre 2026', cargo: 450000, abono: 450000, fecha: '2026-09-03', ref: 'CUS-87120' }
    ]
  });

  // Función para generar pase QR y sincronizarlo en tiempo real con Portería
  const generarPaseQRResidente = (e: any) => {
    e.preventDefault();
    const visitante = e.target.nomVisRes.value;
    const cedula = e.target.cedVisRes.value;
    const fecha = e.target.fechVisRes.value;
    
    let nuevoPase: VisitaQrPH | void = undefined;
    if (onCrearVisitaQr) {
      nuevoPase = onCrearVisitaQr({
        nombreVisitante: visitante,
        cedula: cedula,
        tipo: 'Visita / Familiar',
        unidad: 'Torre 2 - 301',
        residenteAnfitrion: 'Esteban Ochoa Mesa',
        tipoVehiculo: 'Peatonal',
        observaciones: `Pase QR generado para el ${fecha}`
      });
    } else if (setVisitasQrShared) {
      const rawPin = Math.floor(1000 + Math.random() * 9000).toString();
      const codigoQr = `QR-${rawPin}`;
      const paseObj: VisitaQrPH = {
        id: `vis_${Date.now()}`,
        codigo: codigoQr,
        codigoQr,
        pin: rawPin,
        visitante,
        nombreVisitante: visitante,
        cedula,
        tipo: 'Visita / Familiar',
        unidad: 'Torre 2 - 301',
        residenteAnfitrion: 'Esteban Ochoa Mesa',
        tipoVehiculo: 'Peatonal',
        estado: 'Autorizado',
        horaIngreso: 'Pendiente de escaneo en portería',
        fechaVisita: fecha || new Date().toISOString().split('T')[0]
      };
      setVisitasQrShared(prev => [paseObj, ...prev]);
      nuevoPase = paseObj;
    }
    
    e.target.reset();

    const codigoGenerado = (nuevoPase as any)?.codigoQr || (nuevoPase as any)?.codigo || `QR-${Math.floor(1000 + Math.random() * 9000)}`;
    const mensajeWhatsApp = encodeURIComponent(`Hola ${visitante}, aquí tienes tu pase QR de acceso para Urbix PH: *${codigoGenerado}* para el ${fecha}. Presenta este código en portería.`);
    if (confirm(`¡Pase QR "${codigoGenerado}" generado y enviado a Portería en tiempo real!\n\n¿Deseas abrir WhatsApp para enviárselo también al visitante?`)) {
      window.open(`https://api.whatsapp.com/send?text=${mensajeWhatsApp}`, '_blank');
    }
    if (onShowToast) onShowToast(`🚀 Pase QR "${codigoGenerado}" enviado a Portería y al Visitante.`);
  };

  // Función para registrar reserva
  const registrarReserva = (e: any) => {
    e.preventDefault();
    const zona = e.target.zonaComun.value;
    const fecha = e.target.fechaReserva.value;
    const hora = e.target.horaReserva.value;
    const costo = zona.includes('Salón') ? 80000 : 40000;

    const nuevaReserva = {
      id: Date.now().toString(),
      zona,
      fecha,
      hora,
      costo,
      estado: 'Pendiente Aprobación'
    };

    setMisReservas([nuevaReserva, ...misReservas]);
    e.target.reset();
    alert("¡Reserva solicitada con éxito! Quedará sujeta a validación de administración.");
    if (onShowToast) onShowToast(`📅 Reserva para ${zona} solicitada.`);
  };

  // Función para enviar PQRSD
  const enviarPqrsd = (e: any) => {
    e.preventDefault();
    const tipo = e.target.tipoPqrsd.value;
    const asunto = e.target.asuntoPqrsd.value;

    const nuevaPqrsd = {
      id: Date.now().toString(),
      tipo,
      asunto,
      fecha: new Date().toLocaleDateString(),
      estado: 'Radicado'
    };

    setMisPqrsd([nuevaPqrsd, ...misPqrsd]);
    e.target.reset();
    alert("¡PQRSD radicada correctamente ante la administración!");
    if (onShowToast) onShowToast(`💬 PQRSD radicada: ${tipo}.`);
  };

  // Función para simular descarga de Paz y Salvo
  const descargarPazYSalvo = () => {
    if(miEstadoCuenta.saldoActual === 0) {
      alert("📥 CERTIFICADO DE PAZ Y SALVO:\n\nGenerando documento PDF oficial firmado digitalmente por la Administración bajo Ley 675. ¡Descarga iniciada con éxito!");
      if (onShowToast) onShowToast(`📥 Paz y Salvo descargado.`);
    } else {
      alert("⚠️ No es posible emitir el certificado de Paz y Salvo debido a que registra un saldo pendiente en cartera.");
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 flex flex-col">
      
      {/* 1. CABECERA SIEMPRE ARRIBA */}
      <header className="w-full shrink-0 bg-[#1c1c1f] border border-[#262629] rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/30 shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
              URBIX PH <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Portal Residente + IA Ley 675</span>
            </h1>
            <p className="text-xs text-gray-400">{miEstadoCuenta.unidad} • {miEstadoCuenta.propietario} • Coeficiente: <span className="text-cyan-400 font-mono font-bold">{unidadResidente.coeficiente}%</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className={`px-3 py-1.5 rounded font-mono text-xs font-bold ${miEstadoCuenta.saldoActual === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {miEstadoCuenta.saldoActual === 0 ? '🟢 Paz y Salvo Vigente' : '🔴 En Mora'}
          </span>
          {onCerrarSesion && (
            <button
              type="button"
              onClick={onCerrarSesion}
              className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:shadow-[0_0_20px_rgba(244,63,94,0.35)]"
              title="Cerrar sesión de Residente"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>
      </header>

      {/* SELECTOR MÓVIL DIRECTO (PANTALLAS PEQUEÑAS) */}
      <div className="lg:hidden w-full bg-[#0b0f17] border border-cyan-500/20 p-2.5 rounded-2xl flex items-center gap-2 shadow-md">
        <span className="text-xs font-mono text-cyan-400 font-bold shrink-0">Submódulo:</span>
        <select
          value={activeTabResidente}
          onChange={(e) => setActiveTabResidente(e.target.value)}
          className="bg-slate-900 text-cyan-300 font-bold text-xs p-2 rounded-xl border border-slate-700 w-full outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option value="mi_apartamento">🏠 Mi Apartamento (Ficha & General)</option>
          <option value="citofono">📞 Citófono Virtual Directo (Garita ⇄ Apto)</option>
          <option value="asistente">🤖 Urbix Copilot (IA Ley 675)</option>
          <option value="asamblea">🗳️ Asamblea en Vivo</option>
          <option value="pqrsd">⚖️ PQRSD Ley 1755 ({pqrsdList.length})</option>
          <option value="reservas_deposito">🥂 Salón Social / BBQ & Depósito</option>
          <option value="qr">📱 Pases QR</option>
          <option value="mispaquetes">📦 Mis Paquetes ({misPaquetes.filter(p => p.estado === 'En Custodia').length})</option>
          <option value="financiero">💳 Financiero</option>
          <option value="emprendimientos">🏪 Mercadillo</option>
          <option value="red">🌐 Red Vecinal</option>
        </select>
      </div>

      {/* 2. BARRA DE NAVEGACIÓN EN UNA SOLA LÍNEA HORIZONTAL SIN SALTOS (SWIPE TÁCTIL) */}
      <nav className="w-full flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-2 px-3 bg-[#0b0f17] border border-cyan-500/20 rounded-2xl shrink-0 shadow-lg touch-pan-x">
        <span className="text-xs font-bold text-cyan-400 font-mono px-3 py-1.5 bg-cyan-500/10 rounded-xl border border-cyan-500/30 shrink-0">
          ⚡ Módulos Sincronizados (Executive Glass)
        </span>
        <button 
          onClick={() => setActiveTabResidente('mi_apartamento')} 
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${activeTabResidente === 'mi_apartamento' ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'}`}
        >
          <Home className="w-4 h-4 text-cyan-400" /> Mi Apartamento
        </button>
        <button 
          onClick={() => setActiveTabResidente('citofono')} 
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${activeTabResidente === 'citofono' ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'}`}
        >
          <PhoneCall className="w-4 h-4 text-cyan-400" /> Citófono Virtual
        </button>
        <button 
          onClick={() => setActiveTabResidente('asistente')} 
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${activeTabResidente === 'asistente' ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'}`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" /> Urbix Copilot
        </button>
        <button 
          onClick={() => setActiveTabResidente('asamblea')} 
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${activeTabResidente === 'asamblea' ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'}`}
        >
          <span>🗳️ Asamblea en Vivo</span>
          {hayMocionActiva && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              {mocionesActivasCount} ACTIVA{mocionesActivasCount > 1 ? 'S' : ''}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTabResidente('pqrsd')} 
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${activeTabResidente === 'pqrsd' ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'}`}
        >
          ⚖️ PQRSD Ley 1755 ({pqrsdList.length})
        </button>
        <button 
          onClick={() => setActiveTabResidente('reservas_deposito')} 
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${activeTabResidente === 'reservas_deposito' ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'}`}
        >
          🥂 Salón Social / BBQ &amp; Depósito
        </button>
        <button 
          onClick={() => setActiveTabResidente('qr')} 
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${activeTabResidente === 'qr' ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'}`}
        >
          📱 Pases QR
        </button>
        <button 
          onClick={() => setActiveTabResidente('mispaquetes')} 
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${activeTabResidente === 'mispaquetes' ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'}`}
        >
          📦 Mis Paquetes ({misPaquetes.filter(p => p.estado === 'En Custodia').length})
        </button>
        <button 
          onClick={() => setActiveTabResidente('financiero')} 
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${activeTabResidente === 'financiero' ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'}`}
        >
          💳 Financiero
        </button>
        <button 
          onClick={() => setActiveTabResidente('emprendimientos')} 
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${activeTabResidente === 'emprendimientos' ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'}`}
        >
          🏪 Mercadillo
        </button>
        <button 
          onClick={() => setActiveTabResidente('red')} 
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${activeTabResidente === 'red' ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'}`}
        >
          🌐 Red Vecinal
        </button>
      </nav>

      {/* 3. CONTENIDO PRINCIPAL ABAJO (SOLO EL SUBMÓDULO SELECCIONADO) */}
      <main className="w-full flex-1 space-y-6">

        {/* PESTAÑA: MI APARTAMENTO (VISTA GENERAL) */}
        {activeTabResidente === 'mi_apartamento' && (
          <ResidenteMiApartamentoGeneral
            unidad={unidadResidente}
            onShowToast={onShowToast}
            onNavigateTab={(tabId) => setActiveTabResidente(tabId)}
          />
        )}

        {/* PESTAÑA: CITÓFONO VIRTUAL DIRECTO (RESIDENTE ⇄ GARITA) */}
        {activeTabResidente === 'citofono' && (
          <CitofonoVirtualUrbix 
            unidadResidenteActual={miEstadoCuenta.unidad || unidadResidente.unidad || 'Torre 2 - 301'}
            onShowToast={onShowToast}
          />
        )}

        {/* PESTAÑA: URBIX COPILOT (ASISTENTE IA) */}
        {activeTabResidente === 'asistente' && (
          <div className="bg-[#1c1c1f] border border-[#262629] rounded-2xl flex flex-col h-[650px] overflow-hidden">
            <div className="p-4 bg-[#141416] border-b border-[#262629] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/20 p-2 rounded-xl border border-cyan-500/40">
                  <Bot className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Urbix Copilot Vecinal</h3>
                  <p className="text-[11px] text-emerald-400 font-mono">IA Activa • Consultas de Cartera y Ley 675</p>
                </div>
              </div>
              <span className="text-xs font-mono text-gray-400 bg-[#1c1c1f] px-3 py-1 rounded-lg border border-[#262629]">
                💡 Prueba preguntar: "Qué pasa si dejo de pagar la administración"
              </span>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-xs">
              {chatMensajes.map(msg => (
                <div key={msg.id} className={`flex ${msg.remitente === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xl p-4 rounded-2xl border whitespace-pre-line ${msg.remitente === 'usuario' ? 'bg-cyan-500/10 border-cyan-500/30 text-white' : 'bg-[#141416] border-[#262629] text-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.remitente === 'ia' ? <Bot className="w-3.5 h-3.5 text-cyan-400" /> : <User className="w-3.5 h-3.5 text-gray-400" />}
                      <span className="font-bold text-[10px] text-gray-400">{msg.remitente === 'ia' ? 'Urbix Copilot' : 'Tú'}</span>
                    </div>
                    <p className="leading-relaxed">{msg.texto}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={enviarMensajeIA} className="p-4 bg-[#141416] border-t border-[#262629] flex items-center gap-3">
              <button type="button" onClick={() => alert("📷 Foto capturada para análisis IA.")} className="bg-[#1c1c1f] border border-[#262629] p-2.5 rounded-xl text-gray-400 hover:text-cyan-400 transition-all">
                <Camera className="w-5 h-5" />
              </button>
              <input 
                type="text" 
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                placeholder="Pregunta sobre la Ley 675, mora o reporta un caso..." 
                className="flex-1 bg-[#1c1c1f] border border-[#262629] rounded-xl px-4 py-3 text-xs font-mono text-white focus:border-cyan-500 outline-none"
              />
              <button type="submit" className="bg-cyan-500 text-black font-bold px-5 py-3 rounded-xl text-xs hover:bg-cyan-400 transition-all">
                Enviar
              </button>
            </form>
          </div>
        )}

        {/* PESTAÑA: ASAMBLEA VIRTUAL EN VIVO (MÓDULO INTEGRAL CON 5 SUBMÓDULOS LEY 675) */}
        {activeTabResidente === 'asamblea' && (
          <div className="w-full">
            <ModuloReunionesConSubmodulos
              unidadResidenteActual={unidadResidente.unidad}
              esConsejero={true}
              rolUsuario="residente"
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* PESTAÑA: MÓDULO DE PQRSD E INSPECCIÓN JURÍDICA (LEY 1755 / LEY 675) */}
        {activeTabResidente === 'pqrsd' && (
          <div className="space-y-6">
            <div className="bg-[#1c1c1f] border border-[#262629] rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#262629] pb-4 mb-5">
                <div>
                  <span className="inline-block text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 mb-2">
                    ⚖️ SISTEMA OFICIAL DE PQRSD • LEY 1755 DE 2015 &amp; LEY 675 DE 2001
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    Radicación de Peticiones, Quejas, Reclamos y Solicitudes con Término Legal
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Todo caso genera automáticamente un Número de Radicado Oficial y activa el reloj jurídico de cuenta regresiva (10 a 15 días hábiles) para la Administración.
                  </p>
                </div>
                <div className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2.5 font-mono text-xs text-right">
                  <span className="block text-[10px] text-gray-400">GARANTÍA ART. 23 C.P.</span>
                  <span className="text-emerald-400 font-bold">Silencio Administrativo Protegido</span>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!asuntoPqrsdInput.trim() || !descPqrsdInput.trim()) return;
                  if (onRadicarPqrsd) {
                    onRadicarPqrsd({
                      tipo: tipoPqrsdInput,
                      asunto: asuntoPqrsdInput.trim(),
                      descripcion: descPqrsdInput.trim()
                    });
                  }
                  setAsuntoPqrsdInput('');
                  setDescPqrsdInput('');
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs"
              >
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1.5 uppercase">Clasificación Legal (Ley 1755)</label>
                  <select
                    value={tipoPqrsdInput}
                    onChange={(e) => setTipoPqrsdInput(e.target.value as CasoPqrsdLey1755['tipo'])}
                    className="w-full bg-[#141416] border border-[#262629] rounded-xl px-3 py-2.5 text-cyan-400 font-bold outline-none focus:border-cyan-500"
                  >
                    <option value="Reclamo Técnico: Filtración / Humedad Bienes Comunes (10 días hábiles)">
                      Reclamo Técnico: Filtración / Humedad (10 días hábiles)
                    </option>
                    <option value="Queja de Convivencia / Ruido / Mascotas (10 días hábiles - Ley 675)">
                      Queja de Convivencia / Ruido (10 días hábiles)
                    </option>
                    <option value="Derecho de Petición General (15 días hábiles - Ley 1755)">
                      Derecho de Petición General (15 días hábiles)
                    </option>
                    <option value="Solicitud de Copias de Actas / Contratos (10 días hábiles)">
                      Solicitud de Copias de Actas / Contratos (10 días hábiles)
                    </option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] text-gray-400 mb-1.5 uppercase">Asunto Principal del Caso</label>
                  <input
                    type="text"
                    required
                    value={asuntoPqrsdInput}
                    onChange={(e) => setAsuntoPqrsdInput(e.target.value)}
                    placeholder="Ej: Filtración de humedad en techo de alcoba principal desde terraza común..."
                    className="w-full bg-[#141416] border border-[#262629] rounded-xl px-4 py-2.5 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] text-gray-400 mb-1.5 uppercase">Descripción Detallada de Hechos y Pretensión Jurídica</label>
                  <input
                    type="text"
                    required
                    value={descPqrsdInput}
                    onChange={(e) => setDescPqrsdInput(e.target.value)}
                    placeholder="Describa fecha del hallazgo, afectación al bien privado o común y solicitud formal..."
                    className="w-full bg-[#141416] border border-[#262629] rounded-xl px-4 py-2.5 text-gray-200 outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    ⚖️ Radicar con Reloj Legal Ley 1755
                  </button>
                </div>
              </form>
            </div>

            {/* EXPEDIENTES RADICADOS Y RELOJ DE TÉRMINOS */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                📂 Expedientes Radicados y Términos Legales en Curso ({pqrsdList.length})
              </h3>

              {pqrsdList.map((caso) => (
                <div key={caso.id} className="bg-[#1c1c1f] border border-[#262629] rounded-2xl p-5 space-y-4 font-mono text-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#262629] pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                          {caso.radicado}
                        </span>
                        <span className="text-gray-400">• {caso.unidad} ({caso.propietario})</span>
                        <span className="px-2 py-0.5 rounded bg-[#141416] text-gray-300 border border-[#262629]">
                          {caso.tipo}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white font-sans">{caso.asunto}</h4>
                      <p className="text-xs text-gray-400 font-sans mt-1">{caso.descripcion}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-3 py-1 rounded-lg font-bold border ${
                        caso.estado === 'Respondido con Firma Digital'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          : caso.estado === 'Escalado a Comité de Convivencia'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      }`}>
                        {caso.estado === 'Respondido con Firma Digital'
                          ? '✅ Respondido con Firma Digital'
                          : caso.estado === 'Escalado a Comité de Convivencia'
                          ? '⚖️ Escalado al Comité de Convivencia'
                          : `⏱️ Cuenta Regresiva: ${caso.diasHabilesRestantes}d hábiles : ${caso.horasRestantes}h`}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Radicado el {caso.fechaRadicacion} • Término máx: {caso.terminoDiasHabiles} días hábiles
                      </span>
                    </div>
                  </div>

                  {caso.respuestaOficial ? (
                    <div className="bg-[#141416] border border-emerald-500/30 rounded-xl p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-emerald-400 font-bold">
                        <span>✍️ RESPUESTA OFICIAL DE LA ADMINISTRACIÓN (LEY 1755)</span>
                        <span className="text-[10px] text-cyan-400">{caso.firmaDigitalHash}</span>
                      </div>
                      <p className="text-gray-200 font-sans leading-relaxed">{caso.respuestaOficial}</p>
                      {caso.soporteAdjunto && (
                        <div className="pt-1 flex items-center gap-2 text-[11px] text-cyan-400">
                          <span>📎 Soporte Adjunto Verificado: <strong>{caso.soporteAdjunto}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 flex items-center justify-between">
                      <span>El Administrador tiene abierto este expediente en la Consola Jurídica PQRSD.</span>
                      <span className="text-cyan-400">Trazabilidad SHA-256 Activa</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA: RESERVAS DE ZONAS COMUNES CON DEPÓSITO DE GARANTÍA REEMBOLSABLE */}
        {activeTabResidente === 'reservas_deposito' && (() => {
          const tarifaCalculada =
            zonaSeleccionadaReserva === 'Salón Social Principal'
              ? 80000
              : zonaSeleccionadaReserva === 'Terraza BBQ Panorámica'
              ? 55000
              : 45000;
          const depositoFijo = 100000;
          const totalPasarela = tarifaCalculada + depositoFijo;

          return (
            <div className="space-y-6">
              <div className="bg-[#1c1c1f] border border-[#262629] rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#262629] pb-4 mb-5">
                  <div>
                    <span className="inline-block text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-2">
                      🥂 RESERVAS DE ZONAS COMUNES + DEPÓSITO DE GARANTÍA EN CUSTODIA
                    </span>
                    <h2 className="text-lg font-bold text-white">
                      Apartar Salón Social / BBQ con Depósito Reembolsable Automático
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      La pasarela procesa la tarifa de uso más un Depósito de Garantía Reembolsable de $100.000 COP sujeto al Checklist Digital de Entrega.
                    </p>
                  </div>
                  <div className="bg-[#141416] border border-emerald-500/30 rounded-xl px-4 py-2.5 font-mono text-right">
                    <span className="block text-[10px] text-gray-400">TOTAL PASARELA PSE / WOMPI</span>
                    <span className="text-lg font-extrabold text-emerald-400">
                      ${totalPasarela.toLocaleString()} COP
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onCrearReservaZona) {
                      onCrearReservaZona({
                        zona: zonaSeleccionadaReserva,
                        fechaEvento: fechaReservaInput,
                        horario: horarioReservaInput,
                        tarifaUso: tarifaCalculada,
                        depositoGarantia: depositoFijo
                      });
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs"
                >
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1.5 uppercase">Zona Común</label>
                    <select
                      value={zonaSeleccionadaReserva}
                      onChange={(e) => setZonaSeleccionadaReserva(e.target.value as ReservaZonaComunDepPH['zona'])}
                      className="w-full bg-[#141416] border border-[#262629] rounded-xl px-3 py-2.5 text-white font-bold outline-none focus:border-emerald-500"
                    >
                      <option value="Salón Social Principal">Salón Social Principal ($80.000)</option>
                      <option value="Terraza BBQ Panorámica">Terraza BBQ Panorámica ($55.000)</option>
                      <option value="Zona Teppanyaki & Lounge">Zona Teppanyaki &amp; Lounge ($45.000)</option>
                      <option value="Salón Infantil & Juegos">Salón Infantil &amp; Juegos ($45.000)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1.5 uppercase">Fecha del Evento</label>
                    <input
                      type="date"
                      required
                      value={fechaReservaInput}
                      onChange={(e) => setFechaReservaInput(e.target.value)}
                      className="w-full bg-[#141416] border border-[#262629] rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1.5 uppercase">Franja Horaria</label>
                    <select
                      value={horarioReservaInput}
                      onChange={(e) => setHorarioReservaInput(e.target.value)}
                      className="w-full bg-[#141416] border border-[#262629] rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                    >
                      <option value="10:00 AM - 04:00 PM">Diurno (10:00 AM - 04:00 PM)</option>
                      <option value="02:00 PM - 10:00 PM">Tarde/Noche (02:00 PM - 10:00 PM)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                    >
                      💳 Pagar Uso + Depósito (${totalPasarela.toLocaleString()})
                    </button>
                  </div>
                </form>

                <div className="mt-4 bg-[#141416] border border-[#262629] rounded-xl p-3 flex flex-wrap justify-between items-center gap-2 font-mono text-xs text-gray-300">
                  <span>• Tarifa de Uso y Aseo Base: <strong className="text-white">${tarifaCalculada.toLocaleString()} COP</strong></span>
                  <span>• Depósito de Garantía Reembolsable: <strong className="text-cyan-400">${depositoFijo.toLocaleString()} COP</strong></span>
                  <span>• Reembolso automático tras Checklist Digital sin daños en tablet del Supervisor/Admin</span>
                </div>
              </div>

              {/* HISTORIAL DE RESERVAS Y ESTADO DEL CHECKLIST DE ENTREGA DIGITAL */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  📋 Mis Reservas, Custodia de Depósitos y Checklist de Entrega ({reservasZonasList.length})
                </h3>

                {reservasZonasList.map((res) => (
                  <div key={res.id} className="bg-[#1c1c1f] border border-[#262629] rounded-2xl p-5 space-y-4 font-mono text-xs">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#262629] pb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                            {res.codigoReserva}
                          </span>
                          <span className="text-white font-bold text-sm font-sans">{res.zona}</span>
                          <span className="text-gray-400">• {res.unidad} ({res.propietario})</span>
                        </div>
                        <p className="text-gray-400">
                          📅 Fecha: {res.fechaEvento} ({res.horario}) • Pasarela: <span className="text-cyan-400">{res.referenciaPasarela}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-lg font-bold border ${
                          res.estadoDeposito === 'Reembolsado 100% al Residente'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                            : res.estadoDeposito === 'Retenido + Sanción Cargada al Extracto'
                            ? 'bg-red-500/15 text-red-400 border-red-500/40'
                            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                        }`}>
                          {res.estadoDeposito}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Pagado: ${res.totalPagadoPasarela.toLocaleString()} (Uso: ${res.tarifaUso.toLocaleString()} + Depósito: ${res.depositoGarantia.toLocaleString()})
                        </p>
                      </div>
                    </div>

                    {/* VISTA EN TIEMPO REAL DEL CHECKLIST DE ENTREGA OPERADO POR SUPERVISOR/ADMIN */}
                    <div className="bg-[#141416] border border-[#262629] rounded-xl p-4 space-y-2">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="text-gray-300 font-bold">🔎 Estado del Checklist Digital Post-Evento (Tablet Supervisor/Admin):</span>
                        {res.porcentajeRetenido > 0 && (
                          <span className="text-red-400 font-bold">
                            ⚠️ Retención Aplicada: {res.porcentajeRetenido}% (-${res.montoRetenido.toLocaleString()} COP)
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                        <div className={`p-2 rounded border ${res.checklist.murosPinturaOk ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/40 text-red-400'}`}>
                          {res.checklist.murosPinturaOk ? '✓ Muros y Pintura OK' : '✕ Daño en Muros/Pintura'}
                        </div>
                        <div className={`p-2 rounded border ${res.checklist.sillasMesasOk ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/40 text-red-400'}`}>
                          {res.checklist.sillasMesasOk ? '✓ Sillas y Mesas OK' : '✕ Daño en Sillas/Mesas'}
                        </div>
                        <div className={`p-2 rounded border ${res.checklist.aseoProfundoOk ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/40 text-red-400'}`}>
                          {res.checklist.aseoProfundoOk ? '✓ Aseo de Entrega OK' : '✕ Incumplimiento Aseo'}
                        </div>
                        <div className={`p-2 rounded border ${res.checklist.sonidoVidriosOk ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/40 text-red-400'}`}>
                          {res.checklist.sonidoVidriosOk ? '✓ Vidrios y Equipos OK' : '✕ Daño Vidrios/Equipos'}
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 pt-1">
                        Dictamen de Inspección: <span className="text-gray-200">{res.checklist.observacionesInspector}</span>
                      </p>
                      {res.sancionExtractoGenerada && (
                        <p className="text-[11px] text-red-400 font-bold">
                          📌 Cargo automático aplicado al extracto del apartamento: {res.sancionExtractoGenerada}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* PESTAÑA: QR */}
        {activeTabResidente === 'qr' && (
          <div className="space-y-6">
            <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
              <h3 className="text-md font-semibold text-white mb-2">Crear Autorización de Ingreso (Pase QR)</h3>
              <p className="text-xs text-gray-400 mb-4">Genera un código de acceso temporal para tus visitas y compártelo de inmediato.</p>
              
              <form onSubmit={generarPaseQRResidente} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input name="nomVisRes" type="text" placeholder="Nombre del Visitante" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2 text-xs font-mono text-white focus:border-cyan-500 outline-none" />
                <input name="cedVisRes" type="text" placeholder="Número de Cédula" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2 text-xs font-mono text-white focus:border-cyan-500 outline-none" />
                <input name="fechVisRes" type="date" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2 text-xs font-mono text-white focus:border-cyan-500 outline-none" />
                <button type="submit" className="bg-cyan-500 text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <QrCode className="w-4 h-4" /> Generar & Enviar QR
                </button>
              </form>
            </div>

            {/* LISTA EN TIEMPO REAL DE PASES QR CONECTADOS CON PORTERÍA */}
            <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#262629] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    🎫 Pases QR Generados y Estado en Portería ({activeVisitasQr.length})
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Sincronización en tiempo real con la garita de Vigilancia.</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  ⚡ Sincronizado en Vivo con Portería
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeVisitasQr.map((vis) => {
                  const codStr = vis.codigoQr || vis.codigo || 'QR-DESCONOCIDO';
                  const nombre = vis.nombreVisitante || vis.visitante || 'Visitante';
                  const esAdentro = vis.estado === 'Adentro';
                  const esSalio = vis.estado === 'Salió';

                  return (
                    <div
                      key={vis.id}
                      className={`bg-[#141416] border rounded-xl p-4 font-mono text-xs space-y-3 transition-all ${
                        esAdentro
                          ? 'border-emerald-500/50 bg-emerald-950/10 shadow-[0_0_15px_rgba(52,211,153,0.1)]'
                          : esSalio
                          ? 'border-[#262629] opacity-70'
                          : 'border-cyan-500/30'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                              {codStr}
                            </span>
                            <span className="text-white font-bold text-sm font-sans">{nombre}</span>
                          </div>
                          <p className="text-gray-400">
                            CC: {vis.cedula || 'Registrada'} • Tipo: <span className="text-gray-200">{vis.tipo}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Fecha: {vis.fechaVisita || 'Hoy'} • Destino: {vis.unidad}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] border flex items-center gap-1 ${
                            esAdentro
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse'
                              : esSalio
                              ? 'bg-gray-800 text-gray-400 border-gray-700'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {esAdentro ? '🟢 ADENTRO EN COPROPIEDAD' : esSalio ? '⚪ SALIÓ' : '🟡 AUTORIZADO (ESPERANDO)'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#262629] flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">
                          {vis.horaIngreso ? `Ingreso: ${vis.horaIngreso}` : 'Pendiente de escaneo en portería'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const msg = encodeURIComponent(`Hola ${nombre}, tu Pase QR para Urbix PH es: *${codStr}*. Muéstralo en portería.`);
                            window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
                          }}
                          className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 cursor-pointer font-bold"
                        >
                          📲 Reenviar WhatsApp
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: PAQUETES */}
        {activeTabResidente === 'mispaquetes' && (
          <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
            <h3 className="text-md font-semibold text-white mb-4">Paquetes en Custodia</h3>
            <div className="space-y-4">
              {misPaquetes.map(pq => (
                <div key={pq.id} className="bg-[#141416] p-4 rounded-xl border border-[#262629] flex items-center gap-4 font-mono text-xs">
                  <img src={pq.fotoLlegada} alt="Paquete" className="w-16 h-16 rounded-lg object-cover border border-[#262629]" />
                  <div>
                    <p className="font-bold text-white text-sm">{pq.empresa} - {pq.descripcion}</p>
                    <p className="text-gray-400 mt-1">Llegada: {pq.fechaLlegada} | Estado: <span className="text-amber-400">{pq.estado}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA: FINANCIERO */}
        {activeTabResidente === 'financiero' && (
          <ResidenteModuloFinancieroApp onShowToast={onShowToast} />
        )}

        {/* PESTAÑA: EMPRENDIMIENTOS */}
        {activeTabResidente === 'emprendimientos' && (
          <ResidenteEmprendimientosApp />
        )}

        {/* PESTAÑA: RED VECINAL */}
        {activeTabResidente === 'red' && (
          <RedMarketplaceOfertasApp />
        )}

      </main>
    </div>
  );
}
