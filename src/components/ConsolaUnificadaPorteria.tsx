import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  QrCode, ShieldCheck, ShieldAlert, Compass, UserCheck, HardHat, Package,
  PlusCircle, CheckCircle2, Clock, AlertTriangle, Paintbrush, Box, Calendar,
  Droplet, FileText, LogOut, Search, Phone, PhoneCall, Building2, RefreshCw, BookOpen
} from 'lucide-react';
import ConsolaVigilanteEnterpriseCompleta from './ConsolaVigilanteEnterpriseCompleta';
import ModuloMinutaDigitalEnterprise from './ModuloMinutaDigitalEnterprise';
import ModuloContratistasYVisitasTecnicas from './ModuloContratistasYVisitasTecnicas';
import FormularioIngresoTecnicoPorteria from './FormularioIngresoTecnicoPorteria';
import ConsolaPorteriaExecutive from './ConsolaPorteriaExecutive';
import CitofonoVirtualEnterprise from './CitofonoVirtualEnterprise';
import ModuloParqueaderosVisitantesEnterprise from './ModuloParqueaderosVisitantesEnterprise';
import GaritaParqueaderosYSosHub, { CeldaParqueadero, INITIAL_CELDAS_GARITA } from './GaritaParqueaderosYSosHub';
import LectorQrConAsignacionParqueadero from './LectorQrConAsignacionParqueadero';
import { useCitofonoEngine } from '../useCitofonoEngine';
import VentanaFlotanteCitofono from './VentanaFlotanteCitofono';
import CitofoniaWebRTCPorteria from './CitofoniaWebRTCPorteria';
import LogoUrbix from './LogoUrbix';
import { UrbixLogoMark, UrbixFullLogo } from '../UrbixLogo';

export default function ConsolaUnificadaPorteria({
  visitasQrShared = [],
  setVisitasQrShared,
  contratistasSgsst = [],
  onValidarQrContratistaPorteria,
  encomiendasShared = [],
  setEncomiendasShared,
  rondasShared,
  setRondasShared,
  minutaShared,
  setMinutaShared,
  celdasParqueaderoShared = [],
  setCeldasParqueaderoShared,
  contratistasShared = [],
  setContratistasShared,
  onShowToast,
  appendAuditLog,
  onDerivarMantenimientoTodero,
  onActivarAlertaCriticaSupervisor,
  onCerrarSesion,
  userProfile
}: {
  visitasQrShared?: any[];
  setVisitasQrShared?: React.Dispatch<React.SetStateAction<any[]>>;
  contratistasSgsst?: any[];
  onValidarQrContratistaPorteria?: (id: string) => void;
  encomiendasShared?: any[];
  setEncomiendasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  rondasShared?: any[];
  setRondasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  minutaShared?: any[];
  setMinutaShared?: React.Dispatch<React.SetStateAction<any[]>>;
  celdasParqueaderoShared?: any[];
  setCeldasParqueaderoShared?: React.Dispatch<React.SetStateAction<any[]>>;
  contratistasShared?: any[];
  setContratistasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
  appendAuditLog?: (action: string, details: string, customUser?: string) => void;
  onDerivarMantenimientoTodero?: (tarea: any) => void;
  onActivarAlertaCriticaSupervisor?: (alerta: any) => void;
  onCerrarSesion?: () => void;
  userProfile?: any;
}) {
  const [submoduloPorteriaActivo, setSubmoduloPorteriaActivo] = useState<number>(1);
  const [alertaPanicoCabecera, setAlertaPanicoCabecera] = useState(false);
  const [celdasGarita, setCeldasGarita] = useState<CeldaParqueadero[]>(INITIAL_CELDAS_GARITA);

  // Motor global de Citofonía WebRTC + Timbre de Celular siempre activo en todos los submódulos del Vigilante (1 al 7)
  const citofonoGuardEngine = useCitofonoEngine({
    miRol: 'vigilante',
    miUnidad: 'Garita',
    miNombre: userProfile?.full_name || 'Guarda en Turno (Portería Principal)',
    miCargo: 'Seguridad & Control de Accesos'
  });

  const handleActivarPanicoCabecera = () => {
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fechaActual = new Date().toLocaleDateString('es-CO');
    setAlertaPanicoCabecera(true);
    onActivarAlertaCriticaSupervisor?.({
      id: `PANICO-GARITA-${Date.now()}`,
      tipo: 'BOTON_PANICO_RUTA',
      punto: 'GARITA PRINCIPAL — CONSOLA DE PORTERÍA',
      ubicacion: 'Garita Principal / Puesto de Control',
      codigoNfcQr: 'SOS-PANICO-GARITA',
      detalle:
        '🚨 BOTÓN DE PÁNICO TÁCTICO ACCIONADO EN GARITA: El guarda solicita apoyo inmediato y activación de protocolo de reacción en tiempo real.',
      timestamp: horaActual,
      fecha: fechaActual,
      guarda: 'Guarda en Turno (Garita Principal)',
      atendidaPorSupervisor: false
    });
    appendAuditLog?.(
      'PANICO_TACTICO_GARITA_ACTIVADO',
      `🚨 Botón de Pánico Táctico activado en Garita Principal a las ${horaActual}. Señal prioritaria recibida en el Monitor de Alertas Críticas del Supervisor.`,
      'Guarda en Turno (Garita Principal)'
    );
    onShowToast?.('🚨 ¡ALERTA DE PÁNICO TÁCTICO ACTIVADA EN GARITA! Señal prioritaria enviada al Administrador y Supervisor.');
    setTimeout(() => setAlertaPanicoCabecera(false), 7000);
  };

  // Estados locales
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [resultadoValidacion, setResultadoValidacion] = useState<any>(null);
  const [paseSeleccionado, setPaseSeleccionado] = useState<any>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [bahias, setBahias] = useState<any[]>([]);
  const [bahiaAsignada, setBahiaAsignada] = useState<string>('');
  const [pasesList, setPasesList] = useState<any[]>([]);
  const codigoInput = codigoBusqueda;
  const slotsParqueadero = bahias;
  const setSlotsParqueadero = setBahias;
  const setCeldaAsignada = setBahiaAsignada;
  const tenantId = userProfile?.tenant_id || 't1';

  // 1. Cargar bahías directo de Supabase
  const cargarCeldasParqueadero = async () => {
    try {
      let query = supabase
        .from('visitor_parking_slots')
        .select('*')
        .order('slot_number', { ascending: true });

      // Si hay un tenantId válido, filtramos; si no, trae todas las del edificio
      if (tenantId && tenantId !== 't1') {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error cargando bahías:", error);
        return;
      }

      if (data && data.length > 0) {
        setSlotsParqueadero(data);
      }
    } catch (err) {
      console.error("Error al consultar parqueaderos:", err);
    }
  };

  useEffect(() => {
    cargarCeldasParqueadero();

    // Suscripción en tiempo real a cambios de parqueadero (cuando se ocupa o libera una celda)
    const canalCeldas = supabase
      .channel('realtime_bahias_garita_porteria')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_parking_slots' },
        () => {
          cargarCeldasParqueadero();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalCeldas);
    };
  }, [tenantId]);

  const cargarPasesActivos = async () => {
    const { data } = await supabase
      .from('visitor_passes')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setPasesList(data);
    }
  };

  useEffect(() => {
    cargarPasesActivos();
  }, []);

  // 1. Estados para el directorio y comunicados activos de administración
  const [unidades, setUnidades] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [comunicados, setComunicados] = useState<any[]>([]);

  const cargarComunicadosActivos = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (!error && data) {
        setComunicados(data);
      }
    } catch (err) {
      console.error('Error cargando comunicados en portería:', err);
    }
  };

  // 2. Cargar las 100 unidades reales vinculadas a Copropiedad_PH
  const cargarDirectorio = async () => {
    try {
      setCargando(true);

      // Traer el usuario logueado (Andrés Vesga)
      let tenantId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Obtener el tenant_id asignado en profiles
          const { data: perfil } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();
          if (perfil?.tenant_id) {
            tenantId = perfil.tenant_id;
          }
        }
      } catch (authErr) {
        console.warn('Auth check fallback:', authErr);
      }

      // Si no hay sesión directa en auth, usar el perfil activo o el ID de Copropiedad_PH
      if (!tenantId) {
        tenantId = userProfile?.tenant_id || '';
      }

      // Consultar el censo real de unidades
      const { data, error } = await supabase
        .from('units')
        .select('id, tower, apartment, owner_name, owner_phone')
        .eq('tenant_id', tenantId)
        .order('tower', { ascending: true })
        .order('apartment', { ascending: true });

      if (error) throw error;
      setUnidades(data || []);
    } catch (err: any) {
      console.error('Error al cargar unidades de portería:', err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDirectorio();
    cargarComunicadosActivos();

    const channel = supabase
      .channel('announcements-porteria-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          cargarComunicadosActivos();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_passes' },
        () => {
          cargarPasesActivos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.tenant_id]);

  const unidadesFiltradas = unidades.filter(u =>
    `${u.tower} ${u.apartment} ${u.owner_name} ${u.owner_phone || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Encomiendas form states
  const [torreApto, setTorreApto] = useState('');
  const [transportadora, setTransportadora] = useState('Mercado Libre');
  const [destinatario, setDestinatario] = useState('');
  const [filtroApartamentoEncomienda, setFiltroApartamentoEncomienda] = useState('');

  // Ronda shared fallback state
  const [internalRondas, setInternalRondas] = useState<any[]>([
    {
      id: 'ronda_1',
      punto: 'Cuarto de Bombas e Hidroneumáticos (Sótano técnico)',
      estado: 'Verificado Normal',
      timestamp: '08:00 AM',
      observacion: 'Zona segura, equipos en orden. Presión de manómetros en 65 PSI.'
    },
    {
      id: 'ronda_2',
      punto: 'Subestación Eléctrica y Planta de Emergencia (Nivel de combustible y tableros)',
      estado: 'Verificado Normal',
      timestamp: '08:20 AM',
      observacion: 'Nivel de combustible ACPM al 90% y tableros en automático.'
    }
  ]);
  const activeRondas = rondasShared ?? internalRondas;
  const activeSetRondas = setRondasShared ?? setInternalRondas;

  // Minuta Digital shared fallback state
  const [internalMinuta, setInternalMinuta] = useState<any[]>([
    {
      id: 'min_1',
      timestamp: '06:00 AM',
      fecha: new Date().toLocaleDateString('es-CO'),
      guarda: 'Guarda Carlos Restrepo (Turno Mañana)',
      categoria: 'Relevo de Turno',
      detalle: 'Se recibe puesto de portería principal sin novedades. Radios, llaves técnicas y CCTV operativos al 100%.'
    },
    {
      id: 'min_2',
      timestamp: '09:15 AM',
      fecha: new Date().toLocaleDateString('es-CO'),
      guarda: 'Guarda Carlos Restrepo (Turno Mañana)',
      categoria: 'Instrucción de Administración',
      detalle: 'Verificación de planillas ARL vigentes para contratistas de mantenimiento de ascensores Torre 1.'
    }
  ]);
  const activeMinuta = minutaShared ?? internalMinuta;
  const activeSetMinuta = setMinutaShared ?? setInternalMinuta;

  // Oficios Varios y Bodega states
  const [locativos, setLocativos] = useState([
    {
      id: '1',
      titulo: 'Pintura y retoque de muros',
      area: 'Torre 1 - Piso 1',
      prioridad: 'Media',
      estado: 'En Proceso',
      foto: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=300&q=80'
    }
  ]);

  const [bodega, setBodega] = useState([
    { id: '1', item: 'Galón de Viniltex Blanco', categoria: 'Pintura', stock: 4, unidad: 'Galones' },
    { id: '2', item: 'Bombillo LED Tubular 18W', categoria: 'Eléctrico', stock: 12, unidad: 'Unidades' },
    { id: '3', item: 'Cloro Granulado x 45kg', categoria: 'Químicos', stock: 2, unidad: 'Potes' }
  ]);

  // Manejadores
  const handleBuscarOClicPase = async (textoIngresado: string) => {
    if (!textoIngresado) return;

    // 1. Limpieza: quitar espacios y pasar a mayúsculas
    let clean = textoIngresado.trim().toUpperCase();

    // 2. Si el usuario solo escribió números (ej: "8821"), le creamos el código "QR-8821"
    const soloNumeros = clean.replace(/\D/g, '');
    const codigoConPrefijo = clean.startsWith('QR-') ? clean : `QR-${clean}`;

    try {
      // 3. Busca por el código con o sin QR-, o directamente por el PIN numérico
      const { data, error } = await supabase
        .from('visitor_passes')
        .select('*')
        .or(`code.eq.${codigoConPrefijo},code.eq.${clean},pin.eq.${soloNumeros}`)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const pase = data[0];
        setPaseSeleccionado(pase);
        setErrorBusqueda(null);

        // Busca si está disponible admitiendo 'DISPONIBLE' o 'LIBRE'
        const celdaLibre = slotsParqueadero.find(
          (s: any) => 
            (s.status === 'DISPONIBLE' || s.status === 'LIBRE') && 
            (s.vehicle_type === 'CARRO' || !s.vehicle_type)
        );

        if (celdaLibre) {
          setCeldaAsignada(celdaLibre.slot_number);
        }

        setResultadoValidacion({
          tipo: 'VISITA',
          data: {
            ...pase,
            codigo: pase.code || pase.pin || clean,
            codigoQr: pase.code || pase.pin || clean,
            visitante: pase.visitor_name,
            nombreVisitante: pase.visitor_name,
            unidad: pase.unit_reference || pase.unit_number || 'Apto',
            placa: pase.vehicle_plate || 'Peatonal / Sin Vehículo',
            placaVehiculo: pase.vehicle_plate
          }
        });
        onShowToast?.(`Pase de residente ${pase.code || pase.pin} verificado con éxito.`);
        return;
      }

      const visitaEncontrada = visitasQrShared.find(
        (v: any) =>
          (v.codigo || v.codigoQr || '').toUpperCase().includes(clean) ||
          (v.pin || '').toUpperCase() === clean
      );
      if (visitaEncontrada) {
        setPaseSeleccionado(visitaEncontrada);
        setErrorBusqueda(null);
        setResultadoValidacion({ tipo: 'VISITA', data: visitaEncontrada });
        onShowToast?.(`Pase de residente ${visitaEncontrada.codigo || visitaEncontrada.codigoQr} verificado con éxito.`);
        return;
      }

      const contratistaEncontrado = contratistasSgsst.find((c: any) => (c.codigoQr || '').toUpperCase().includes(clean));
      if (contratistaEncontrado) {
        setErrorBusqueda(null);
        setResultadoValidacion({ tipo: 'CONTRATISTA', data: contratistaEncontrado });
        onShowToast?.(`Contratista institucional ${contratistaEncontrado.empresa} localizado.`);
        return;
      }

      setPaseSeleccionado(null);
      setResultadoValidacion(null);
      setErrorBusqueda(`Código "${textoIngresado}" no encontrado.`);
    } catch (err: any) {
      console.error('Error buscando pase:', err);
      setErrorBusqueda(`Error de consulta: ${err.message}`);
    }
  };

  const handleValidarAccesoEnVivo = async () => {
    await handleBuscarOClicPase(codigoInput);
  };

  const handleValidarAccesoGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleBuscarOClicPase(codigoInput);
  };

  const handleToggleEstadoVisita = async (id: string) => {
    const paseEnSupabase = pasesList.find((p: any) => p.id === id);
    if (paseEnSupabase) {
      const estadoActual = (paseEnSupabase.status || paseEnSupabase.estado || 'ACTIVO').toUpperCase();
      let nuevoStatus = 'ACTIVO';
      if (estadoActual === 'ACTIVO' || estadoActual === 'AUTORIZADO' || estadoActual === 'PENDIENTE') {
        nuevoStatus = 'ADENTRO';
      } else if (estadoActual === 'ADENTRO') {
        nuevoStatus = 'SALIO';
      } else {
        nuevoStatus = 'ACTIVO';
      }

      const ahoraIso = new Date().toISOString();
      await supabase
        .from('visitor_passes')
        .update({
          status: nuevoStatus,
          ...(nuevoStatus === 'ADENTRO' ? { entry_time: ahoraIso } : {}),
          ...(nuevoStatus === 'SALIO' ? { exit_time: ahoraIso } : {})
        })
        .eq('id', id);

      await cargarPasesActivos();
    }

    if (setVisitasQrShared) {
      setVisitasQrShared((prev: any[]) =>
        prev.map(v => {
          if (v.id === id) {
            let nuevoEstado = 'Autorizado';
            if (v.estado === 'Autorizado') nuevoEstado = 'Adentro';
            else if (v.estado === 'Adentro') nuevoEstado = 'Salió';
            else nuevoEstado = 'Autorizado';

            return { 
              ...v, 
              estado: nuevoEstado, 
              horaIngreso: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
          }
          return v;
        })
      );
    }
    onShowToast?.('Estado de acceso actualizado en tiempo real.');
  };

  // Función auxiliar para disparar la alerta de WhatsApp desde el cliente o servidor
  const dispararAlertaWhatsApp = async (tipoEvento: 'NEW_PACKAGE' | 'RESERVATION_APPROVED', datosRegistro: any, nombreConjunto: string) => {
    try {
      await fetch('/api/webhook/whatsapp-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: tipoEvento,
          record: datosRegistro,
          tenantName: nombreConjunto
        })
      });
    } catch (e) {
      console.warn("No se pudo despachar la notificación por WhatsApp:", e);
    }
  };

  const handleRegistrarPaquete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!torreApto.trim() || !destinatario.trim()) return;

    const pinRetiro = Math.floor(1000 + Math.random() * 9000);
    const nuevoPaquete = {
      id: `pkg_${Date.now()}`,
      guia: `GUIA-${pinRetiro}`,
      codigoPin: `PKG-${pinRetiro}`,
      pinRetiro: `PKG-${pinRetiro}`,
      unidad: torreApto.trim(),
      destinatario: destinatario.trim(),
      empresa: transportadora,
      estado: 'En Custodia',
      fechaIngreso: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (setEncomiendasShared) {
      setEncomiendasShared((prev: any[]) => [nuevoPaquete, ...prev]);
    }

    dispararAlertaWhatsApp('NEW_PACKAGE', nuevoPaquete, 'Copropiedad PH');

    setTorreApto('');
    setDestinatario('');
    onShowToast?.(`Paquete registrado. PIN generado: PKG-${pinRetiro}`);
  };

  const handleEntregarPaquete = (id: string) => {
    if (!setEncomiendasShared) return;
    setEncomiendasShared((prev: any[]) =>
      prev.map(p => p.id === id ? { ...p, estado: 'Entregado', fechaIngreso: `Retirado: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` } : p)
    );
    onShowToast?.('Custodia cerrada. Paquete entregado al residente.');
  };

  const agregarLocativo = (e: any) => {
    e.preventDefault();
    const nuevo = {
      id: Date.now().toString(),
      titulo: e.target.titulo.value,
      area: e.target.area.value,
      prioridad: e.target.prioridad.value,
      estado: 'Pendiente',
      foto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80'
    };
    setLocativos([nuevo, ...locativos]);
    e.target.reset();
    onShowToast?.('¡Labor locativa registrada con éxito!');
  };

  const agregarBodega = (e: any) => {
    e.preventDefault();
    const nuevoItem = {
      id: Date.now().toString(),
      item: e.target.nombreItem.value,
      categoria: e.target.categoria.value,
      stock: parseInt(e.target.stock.value, 10),
      unidad: e.target.unidad.value
    };
    setBodega([nuevoItem, ...bodega]);
    e.target.reset();
    onShowToast?.('¡Ítem agregado al inventario de Bodega PH!');
  };

  const porteriaModules = [
    { id: 1, label: '🔍 1. Control de Accesos & Lector' },
    { id: 2, label: '🛡️ 2. Matriz SG-SST' },
    { id: 3, label: '📦 3. Encomiendas & Correo' },
    { id: 4, label: '🚶 4. Ronda de Vigilancia' },
    { id: 5, label: '💻 5. Minuta Digital' },
    { id: 6, label: '📞 6. Citófono Virtual' }
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 flex flex-col">

      {/* NOTIFICACIÓN FLOTANTE GLOBAL DESDE LA PARTE SUPERIOR PARA LLAMADAS ENTRANTES DE CITÓFONO */}
      <VentanaFlotanteCitofono
        engine={citofonoGuardEngine}
        rolVista="vigilante"
        submoduloActualLabel={porteriaModules.find((m) => m.id === submoduloPorteriaActivo)?.label}
        onIrAlModuloCitofono={() => setSubmoduloPorteriaActivo(6)}
        onShowToast={onShowToast}
      />

      {/* 1. CABECERA SIEMPRE ARRIBA */}
      <header className="w-full shrink-0">
        <div className="bg-[#141416] border border-[#262629] p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoUrbix size="sm" rolBadge="PORTERO" />
            <div className="hidden sm:block h-7 w-px bg-slate-800 mx-1" />
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 uppercase tracking-widest">
                Consola Central de Portería &amp; Escáner QR
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">Control de Accesos Unificado (Residentes &amp; Contratistas)</h2>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Escudo SG-SST</span>
            </div>
            <button
              type="button"
              onClick={handleActivarPanicoCabecera}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-xl min-h-[44px] ${
                alertaPanicoCabecera
                  ? 'bg-rose-600 text-white animate-bounce shadow-rose-600/60 border-2 border-rose-300'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40 shadow-rose-500/10'
              }`}
            >
              <ShieldAlert className="w-4 h-4 animate-pulse shrink-0" />
              {alertaPanicoCabecera ? '🚨 ¡PÁNICO EN CURSO!' : 'Botón de Pánico (Garita)'}
            </button>
            {onCerrarSesion && (
              <button
                type="button"
                onClick={onCerrarSesion}
                className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[44px] shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:shadow-[0_0_20px_rgba(244,63,94,0.35)]"
                title="Cerrar turno y salir de Portería"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 mt-4">
          <div className="text-[11px] font-mono text-cyan-400 uppercase font-semibold mb-2">
            📌 Circulares Activas de Administración
          </div>
          <div className="space-y-2">
            {comunicados.slice(0, 2).map((c) => (
              <div key={c.id} className="text-xs text-slate-300 border-l-2 border-cyan-500 pl-2">
                <p className="font-bold text-white">{c.title}</p>
                <p className="text-[11px] text-slate-400 line-clamp-1">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* SELECTOR MÓVIL DIRECTO (PANTALLAS PEQUEÑAS) */}
      <div className="lg:hidden w-full bg-[#0b0f17] border border-cyan-500/20 p-2.5 rounded-2xl flex items-center gap-2 shadow-md">
        <span className="text-xs font-mono text-cyan-400 font-bold shrink-0">Módulo Garita:</span>
        <select
          value={submoduloPorteriaActivo}
          onChange={(e) => setSubmoduloPorteriaActivo(Number(e.target.value))}
          className="bg-slate-900 text-cyan-300 font-bold text-xs p-2 rounded-xl border border-slate-700 w-full outline-none focus:border-cyan-400 cursor-pointer"
        >
          {porteriaModules.map(mod => (
            <option key={mod.id} value={mod.id}>
              {mod.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2. BARRA HORIZONTAL DE PESTAÑAS DE PORTERÍA (1 A 6) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        <button
          onClick={() => setSubmoduloPorteriaActivo(1)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer shrink-0 ${
            submoduloPorteriaActivo === 1
              ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.35)]'
              : 'bg-[#0b0f17] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          🔍 1. Control de Accesos &amp; Lector
        </button>

        <button
          onClick={() => setSubmoduloPorteriaActivo(2)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer shrink-0 ${
            submoduloPorteriaActivo === 2
              ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.35)]'
              : 'bg-[#0b0f17] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          🛡️ 2. Matriz SG-SST
        </button>

        <button
          onClick={() => setSubmoduloPorteriaActivo(3)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer shrink-0 ${
            submoduloPorteriaActivo === 3
              ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.35)]'
              : 'bg-[#0b0f17] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          📦 3. Encomiendas &amp; Correo
        </button>

        <button
          onClick={() => setSubmoduloPorteriaActivo(4)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer shrink-0 ${
            submoduloPorteriaActivo === 4
              ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.35)]'
              : 'bg-[#0b0f17] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          🚶 4. Ronda de Vigilancia
        </button>

        <button
          onClick={() => setSubmoduloPorteriaActivo(5)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer shrink-0 ${
            submoduloPorteriaActivo === 5
              ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.35)]'
              : 'bg-[#0b0f17] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          💻 5. Minuta Digital
        </button>

        <button
          onClick={() => setSubmoduloPorteriaActivo(6)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer shrink-0 flex items-center gap-2 ${
            submoduloPorteriaActivo === 6
              ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.35)]'
              : citofonoGuardEngine.estado === 'entrante'
              ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-400 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : citofonoGuardEngine.estado === 'conectado'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400'
              : 'bg-[#0b0f17] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>📞 6. Citófono Virtual</span>
          {citofonoGuardEngine.estado === 'entrante' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-bounce">
              🔔 {citofonoGuardEngine.llamadaActiva?.unidad || 'LLAMANDO'}
            </span>
          )}
          {citofonoGuardEngine.estado === 'conectado' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950">
              🟢 {citofonoGuardEngine.tiempoFormateado}
            </span>
          )}
        </button>
      </div>

      {/* 3. CONTENIDO PRINCIPAL ABAJO (CADA SUBMÓDULO AISLADO PARA QUE NO SE AMONTONEN) */}
      <main className="w-full flex-1 space-y-6">

        {/* 1. CONTROL DE ACCESOS & LECTOR (UNIFICACIÓN DE LECTOR CRIPTOGRÁFICO Y PASES QR RESIDENTES) */}
        {submoduloPorteriaActivo === 1 && (
          <div className="space-y-6 animate-fadeIn">
            {/* INTEGRACIÓN TOTAL DE TODAS LAS CARACTERÍSTICAS DEL MÓDULO 7 (PARQUEADEROS DE VISITANTES & BOTÓN SOS) */}
            <GaritaParqueaderosYSosHub
              onShowToast={onShowToast}
              nombreCopropiedad="Copropiedad PH"
              celdasExternal={celdasGarita}
              onActualizarCeldasExternal={setCeldasGarita}
            />

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-8">
              {/* Lector Criptográfico */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-cyan-400" /> Lector Criptográfico de Accesos (Validación QR &amp; Visitantes)
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Escáner de puerta en tiempo real</span>
                </div>

                <form onSubmit={handleValidarAccesoGeneral} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Ej: QR-8492 o QR-SST-9014-ASCENSORES..."
                    value={codigoBusqueda}
                    onChange={(e) => setCodigoBusqueda(e.target.value)}
                    className="flex-1 p-3.5 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-cyan-400 shadow-inner"
                  />
                  <button
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      handleValidarAccesoEnVivo();
                    }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20 shrink-0"
                  >
                    Validar Acceso en Vivo
                  </button>
                </form>

                {errorBusqueda && (
                  <div className="p-4 bg-slate-950 border border-rose-500/40 rounded-xl text-rose-400 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {errorBusqueda}
                  </div>
                )}

                {resultadoValidacion && (
                  <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl flex items-center justify-between gap-4">
                    {resultadoValidacion.tipo === 'VISITA' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-cyan-500/30">
                            {resultadoValidacion.data.codigo || resultadoValidacion.data.codigoQr}
                          </span>
                          <span className="font-bold text-white text-sm">{resultadoValidacion.data.visitante || resultadoValidacion.data.nombreVisitante}</span>
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">Visita Autorizada</span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Destino: {resultadoValidacion.data.unidad} | Placa: {resultadoValidacion.data.placa || resultadoValidacion.data.placaVehiculo || 'Peatonal / Sin Vehículo'}
                          {bahiaAsignada ? ` | Bahía Asignada: ${bahiaAsignada}` : ''}
                        </p>
                      </div>
                    )}
                    {resultadoValidacion.tipo === 'CONTRATISTA' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-cyan-500/30">
                            {resultadoValidacion.data.codigoQr}
                          </span>
                          <span className="font-bold text-white text-sm">{resultadoValidacion.data.empresa}</span>
                        </div>
                        <p className="text-xs text-slate-300">Técnico: {resultadoValidacion.data.tecnicoNombre} | Estado: {resultadoValidacion.data.estadoPorteria}</p>
                      </div>
                    )}
                    {resultadoValidacion.tipo === 'NO_ENCONTRADO' && (
                      <div className="text-rose-400 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Código "{resultadoValidacion.query}" no encontrado en el sistema.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pases QR de Residentes */}
              {(() => {
                const listaPasesRender = pasesList.length > 0 ? pasesList : visitasQrShared;
                const cantidadAdentro = listaPasesRender.filter((v: any) => {
                  const st = String(v.status || v.estado || '').toUpperCase();
                  return st === 'ADENTRO';
                }).length;

                return (
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-cyan-400" /> Pases QR Autorizados por Residentes (Control de Acceso en Vivo)
                      </h3>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                        ⚡ {cantidadAdentro} Visitantes Adentro
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {listaPasesRender && listaPasesRender.length > 0 ? (
                        listaPasesRender.map((p: any) => {
                          const codigoMostrar = p.code || p.pin || p.codigo || p.codigoQr || 'QR-PASE';
                          const nombreVisitante = p.visitor_name || p.visitante || p.nombreVisitante || 'Visitante';
                          const unidadDestino = p.unit_reference || p.unit_number || p.unidad || 'Apto';
                          const placaMostrar = p.vehicle_plate || p.placa || p.placaVehiculo || 'Peatonal / Sin Vehículo';
                          const rawStatus = String(p.status || p.estado || 'ACTIVO').toUpperCase();
                          const estadoNorm =
                            rawStatus === 'ADENTRO'
                              ? 'Adentro'
                              : rawStatus === 'SALIO' || rawStatus === 'SALIÓ'
                              ? 'Salió'
                              : 'Autorizado';
                          const horaMostrar = p.entry_time
                            ? new Date(p.entry_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                            : p.horaIngreso;

                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setCodigoBusqueda(codigoMostrar);
                                handleBuscarOClicPase(codigoMostrar);
                              }}
                              className="p-4 bg-slate-950 border border-slate-800 hover:border-cyan-500/40 rounded-2xl flex items-center justify-between text-xs gap-3 cursor-pointer transition"
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono font-black text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-cyan-500/30">{codigoMostrar}</span>
                                  <span className="font-bold text-white text-sm">{nombreVisitante}</span>
                                </div>
                                <p className="text-slate-400">Destino: {unidadDestino} | Placa: {placaMostrar}</p>
                                {horaMostrar && <p className="text-[10px] font-mono text-cyan-400 mt-1">{horaMostrar}</p>}
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className={`px-2 py-1 rounded font-bold text-[10px] ${estadoNorm === 'Adentro' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : estadoNorm === 'Salió' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                                  {estadoNorm}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleEstadoVisita(p.id);
                                  }}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition cursor-pointer text-xs shadow"
                                >
                                  {estadoNorm === 'Autorizado' ? 'Dar Ingreso' : estadoNorm === 'Adentro' ? 'Registrar Salida' : 'Reiniciar'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-500 italic p-4">No hay pases de residentes activos en este momento.</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* 2. MATRIZ SG-SST CONTRATISTAS (SOLAMENTE CONTRATISTAS Y PÓLIZAS) */}
        {submoduloPorteriaActivo === 2 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardHat className="w-5 h-5 text-emerald-400" /> Matriz en Vivo de Contratistas y Condicionamiento SG-SST
              </h3>
              <span className="text-xs font-mono text-cyan-400">
                Bloqueados por Póliza/ARL Vencida: <strong>{contratistasSgsst.filter(c => !(c.polizaRce?.vigente && c.arlPlanilla?.vigente)).length}</strong>
              </span>
            </div>

            <div className="space-y-4">
              {contratistasSgsst && contratistasSgsst.length > 0 ? (
                contratistasSgsst.map((c: any) => {
                  const aptoParaIngreso = Boolean(c.polizaRce?.vigente && c.arlPlanilla?.vigente);
                  return (
                    <div key={c.id} className={`p-4 bg-slate-950 rounded-2xl border transition-all text-xs space-y-3 ${aptoParaIngreso ? 'border-slate-800' : 'border-rose-500/50 bg-rose-950/10'}`}>
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-black text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/30">{c.codigoQr}</span>
                            <span className="font-bold text-white text-sm">{c.empresa}</span>
                          </div>
                          <p className="text-slate-300">Técnico: <strong className="text-white">{c.tecnicoNombre}</strong> (CC: {c.cedula}) | Especialidad: {c.especialidad}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${aptoParaIngreso ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                            {aptoParaIngreso ? '✓ SG-SST OK' : '⛔ BLOQUEADO'}
                          </span>
                          {aptoParaIngreso && onValidarQrContratistaPorteria && (
                            <button
                              type="button"
                              onClick={() => onValidarQrContratistaPorteria(c.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition cursor-pointer text-xs"
                            >
                              Autorizar Ingreso
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        <div className={`p-2.5 rounded-xl border ${c.polizaRce?.vigente ? 'bg-slate-900 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/40'}`}>
                          <p className="text-[10px] text-slate-400 uppercase font-mono">Póliza RCE</p>
                          <p className="text-white font-bold">{c.polizaRce?.aseguradora || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400">Vence: {c.polizaRce?.vencimiento}</p>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${c.arlPlanilla?.vigente ? 'bg-slate-900 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/40'}`}>
                          <p className="text-[10px] text-slate-400 uppercase font-mono">Planilla ARL</p>
                          <p className="text-white font-bold">{c.arlPlanilla?.entidad || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400">Vigencia: {c.arlPlanilla?.vencimiento}</p>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${c.epsSalud?.vigente ? 'bg-slate-900 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/40'}`}>
                          <p className="text-[10px] text-slate-400 uppercase font-mono">Afiliación EPS</p>
                          <p className="text-white font-bold">{c.epsSalud?.entidad || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400">Estado Activo</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 italic p-4">No hay contratistas institucionales registrados.</p>
              )}
            </div>

            {/* FORMULARIO DE AUTORIZACIÓN RÁPIDA EN GARITA (PASO 3 • SINCRONIZADO CON SUPERVISOR) */}
            <FormularioIngresoTecnicoPorteria
              contratistasShared={contratistasShared}
              setContratistasShared={setContratistasShared}
              onShowToast={onShowToast}
            />

            {/* MONITOREO EN TIEMPO REAL DE TÉCNICOS EXTERNOS Y VISITAS TÉCNICAS (SINCRONIZADO CON SUPERVISIÓN) */}
            <ModuloContratistasYVisitasTecnicas
              contratistasShared={contratistasShared}
              setContratistasShared={setContratistasShared}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* 3. ENCOMIENDAS & CORREO (SOLAMENTE GESTIÓN DE PAQUETES) */}
        {submoduloPorteriaActivo === 3 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl animate-fadeIn space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/25">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
                    Control de Portería • Logística y Encomiendas
                  </span>
                  <h3 className="text-base font-black text-white mt-1">Gestión de Casilleros y Encomiendas</h3>
                </div>
              </div>
              <input
                type="text"
                placeholder="Filtrar por unidad o PIN..."
                value={filtroApartamentoEncomienda}
                onChange={(e) => setFiltroApartamentoEncomienda(e.target.value)}
                className="px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono outline-none focus:border-amber-500"
              />
            </div>

            <form onSubmit={handleRegistrarPaquete} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <input
                type="text"
                placeholder="Unidad (Ej: Torre 1 - 302)"
                value={torreApto}
                onChange={(e) => setTorreApto(e.target.value)}
                className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-amber-500"
                required
              />
              <input
                type="text"
                placeholder="Destinatario..."
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-amber-500"
                required
              />
              <select
                value={transportadora}
                onChange={(e) => setTransportadora(e.target.value)}
                className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-amber-500"
              >
                <option>Mercado Libre</option>
                <option>Amazon Prime</option>
                <option>Servientrega</option>
                <option>Coordinadora</option>
                <option>Interrapidísimo</option>
              </select>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Registrar Paquete
              </button>
            </form>

            <div className="space-y-3">
              {(encomiendasShared || [])
                .filter((p: any) =>
                  `${p.unidad || ''} ${p.destinatario || ''} ${p.codigoPin || p.pinRetiro || ''}`
                    .toLowerCase()
                    .includes(filtroApartamentoEncomienda.toLowerCase())
                )
                .map((p: any) => (
                  <div key={p.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-white text-sm">{p.destinatario} ({p.unidad})</p>
                      <p className="text-slate-400 font-mono mt-0.5">
                        {p.empresa} • PIN: <span className="text-amber-400 font-bold">{p.codigoPin || p.pinRetiro}</span> • {p.fechaIngreso || p.fechaLlegada}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border ${p.estado === 'En Custodia' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                        {p.estado}
                      </span>
                      {p.estado === 'En Custodia' && (
                        <button
                          type="button"
                          onClick={() => handleEntregarPaquete(p.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition cursor-pointer"
                        >
                          Entregar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 4. RONDA DE VIGILANCIA Y CHECKPOINTS GEORREFERENCIADOS */}
        {submoduloPorteriaActivo === 4 && (
          <div className="animate-fadeIn">
            <ConsolaVigilanteEnterpriseCompleta
              rondasShared={activeRondas}
              setRondasShared={activeSetRondas}
              minutaShared={activeMinuta}
              setMinutaShared={activeSetMinuta}
              celdasParqueaderoShared={celdasParqueaderoShared}
              setCeldasParqueaderoShared={setCeldasParqueaderoShared}
              onShowToast={onShowToast}
              appendAuditLog={appendAuditLog}
              onDerivarMantenimientoTodero={onDerivarMantenimientoTodero}
              onActivarAlertaCriticaSupervisor={onActivarAlertaCriticaSupervisor}
              ocultarMinuta={true}
            />
          </div>
        )}

        {/* 5. LIBRO DE MINUTA DIGITAL INMUTABLE */}
        {submoduloPorteriaActivo === 5 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl animate-fadeIn">
            <ModuloMinutaDigitalEnterprise
              minutaShared={activeMinuta}
              setMinutaShared={activeSetMinuta}
              onShowToast={onShowToast}
              appendAuditLog={appendAuditLog}
            />
          </div>
        )}

        {/* 6. CITÓFONO VIRTUAL DIRECTO & DIRECTORIO DE UNIDADES */}
        {submoduloPorteriaActivo === 6 && (
          <div className="space-y-6 animate-fadeIn">
            <CitofoniaWebRTCPorteria
              modo="porteria"
              guardaNombre={userProfile?.full_name || 'Guarda en Turno'}
              onShowToast={onShowToast}
            />

            {/* DIRECTORIO Y CENSO DE UNIDADES (100 APTOS REALES TRICENTENARIO) */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6">
            {/* Header del Directorio */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 uppercase tracking-widest">
                    Censo Oficial &amp; Directorio Telefónico
                  </span>
                  <span className="text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono font-bold">
                    urb Copropiedad_PH
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-cyan-400" /> Directorio de Copropietarios (100 Unidades)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Base de datos oficial de unidades para citofonía WebRTC, avisos de correspondencia y contacto de seguridad.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cargarDirectorio()}
                  disabled={cargando}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                  title="Sincronizar unidades con Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${cargando ? 'animate-spin' : ''}`} />
                  <span>Sincronizar</span>
                </button>
                <div className="px-3 py-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-xl text-xs font-mono font-bold">
                  {unidades.length} Aptos Registrados
                </div>
              </div>
            </div>

            {/* Barra de Búsqueda y Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por apartamento (ej: 101, 302), torre, nombre o teléfono..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-cyan-400 shadow-inner"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono">
                <span className="text-slate-400">Resultados:</span>
                <span className="font-bold text-cyan-400">
                  {unidadesFiltradas.length} de {unidades.length} unidades
                </span>
              </div>
            </div>

            {/* Estado de carga */}
            {cargando && (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-mono">Cargando censo de 100 unidades desde Supabase...</p>
              </div>
            )}

            {/* Grid de unidades */}
            {!cargando && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {unidades
                  .filter(u => 
                    `${u.tower} ${u.apartment} ${u.owner_name}`.toLowerCase().includes(busqueda.toLowerCase())
                  )
                  .map((u) => (
                    <div 
                      key={u.id}
                      className="p-3 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-100 text-xs font-mono">
                          Torre {u.tower} - {u.apartment}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[120px] sm:max-w-[160px]">
                          {u.owner_name || 'Sin asignar'}
                        </div>
                        {u.owner_phone && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {u.owner_phone}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button"
                          onClick={async () => {
                            // Acción de llamada WebRTC o enlace
                            const destino = `Torre ${u.tower} - ${u.apartment}`;
                            citofonoGuardEngine.iniciarLlamada(destino);
                            setSubmoduloPorteriaActivo(6);
                            onShowToast?.(`📞 Llamando a Torre ${u.tower} - Apto ${u.apartment} (${u.owner_name || 'Copropietario'})`);
                            try {
                              await supabase.from('intercom_logs').insert([
                                {
                                  tenant_id: userProfile?.tenant_id || '',
                                  event_type: 'Llamada de Voz WebRTC',
                                  tower: String(u.tower || '1'),
                                  apartment: String(u.apartment || ''),
                                  resident_name: u.owner_name || 'Copropietario',
                                  attendant_name: userProfile?.full_name || 'Andres Vesga',
                                  status: 'Atendido'
                                }
                              ]);
                            } catch (err) {
                              console.error('Error registrando llamada en intercom_logs:', err);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          <span>📞</span>
                          <span>Llamar</span>
                        </button>

                        {u.owner_phone && (
                          <a
                            href={`tel:${u.owner_phone}`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs flex items-center justify-center transition"
                            title={`Llamar al celular ${u.owner_phone}`}
                          >
                            📱
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                {unidades.filter(u => 
                  `${u.tower} ${u.apartment} ${u.owner_name}`.toLowerCase().includes(busqueda.toLowerCase())
                ).length === 0 && (
                  <div className="col-span-full py-12 text-center space-y-2">
                    <p className="text-sm font-bold text-slate-400">No se encontraron unidades con la búsqueda "{busqueda}"</p>
                    <button
                      type="button"
                      onClick={() => setBusqueda('')}
                      className="text-xs text-cyan-400 underline font-mono cursor-pointer"
                    >
                      Limpiar búsqueda
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

