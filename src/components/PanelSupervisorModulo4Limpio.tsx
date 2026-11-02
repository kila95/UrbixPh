import React, { useState } from 'react';
import { ShieldCheck, Radio, Wrench, Wallet, ClipboardCheck, Sparkles, PlusCircle, CheckCircle2, AlertTriangle, FileText, ArrowRight, DollarSign, Tag, Clock, UserCheck } from 'lucide-react';

export interface PanelSupervisorModulo4LimpioProps {
  cajaMenorShared?: any[];
  setCajaMenorShared?: React.Dispatch<React.SetStateAction<any[]>>;
  rondasShared?: any[];
  setRondasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  novedadesShared?: any[];
  setNovedadesShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
}

export default function PanelSupervisorModulo4Limpio({
  cajaMenorShared = [],
  setCajaMenorShared,
  rondasShared = [],
  setRondasShared,
  novedadesShared = [],
  setNovedadesShared,
  onShowToast
}: PanelSupervisorModulo4LimpioProps) {
  // Pestañas internas limpias y exclusivas del Supervisor de Terreno
  const [activeSubTab, setActiveSubTab] = useState<'rondas' | 'caja_menor' | 'novedades'>('rondas');

  // Datos de fallback para Rondas NFC
  const defaultRondas = [
    {
      id: 'RND-2026-901',
      punto: 'Perímetro y Cerramiento Eléctrico Oriental',
      tagNfc: 'NFC-PERIM-NORTE-01',
      ubicacion: 'Límite Oriental • Cerca Concertina',
      estado: '🟢 Sin Novedad',
      hora: '06:05 AM',
      responsable: 'Wilmar Andrés Tapias (Rondero)',
      presion: 'Voltaje Pulso 7.8 kV (Óptimo)',
      hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
    },
    {
      id: 'RND-2026-902',
      punto: 'Sótanos y Bahía Parqueaderos Nivel -2',
      tagNfc: 'NFC-SOTANO2-BAHIA-04',
      ubicacion: 'Sótano Técnico Nivel -2',
      estado: '🟡 Hallazgo Menor / Mantenimiento',
      hora: '06:40 AM',
      responsable: 'Wilmar Andrés Tapias (Rondero)',
      presion: 'Luminaria T8 rampa parpadeando',
      hash: 'sha256:4a382e7834575fbef546f3d9d300d869279a32c63dfbe9ff200057088198f7e2'
    },
    {
      id: 'RND-2026-903',
      punto: 'Cuarto Hidroneumático y Tanques de Reserva',
      tagNfc: 'NFC-BOMBAS-SOTANO1',
      ubicacion: 'Subestación Hidráulica Sótano 1',
      estado: '🟢 Sin Novedad',
      hora: '07:15 AM',
      responsable: 'Hernán Darío Mejía (Supervisor)',
      presion: 'Presión Hidroflo 65 PSI • Tanques 94%',
      hash: 'sha256:88e0b230f81d11394bc216c87e5b22b62d3a39e8027a08b5f36e4f5a43b271d4'
    },
    {
      id: 'RND-2026-904',
      punto: 'Garita Principal y Central CCTV',
      tagNfc: 'NFC-CCTV-PORTERIA-00',
      ubicacion: 'Acceso Vehicular / Peatonal',
      estado: '🟢 Sin Novedad',
      hora: '08:02 AM',
      responsable: 'Luis Fernando Pérez (Portería)',
      presion: '32 Cámaras IP Operativas',
      hash: 'sha256:2f1837a4e612cb723a105bb99182aaef34101cc28f73a24c52086b97621f37e1'
    }
  ];

  const activeRondas = rondasShared && rondasShared.length > 0 ? rondasShared : defaultRondas;

  // Datos de fallback para Caja Menor
  const defaultCajaMenor = [
    {
      id: 'CM-2026-101',
      recibo_num: 'FAC-ELEC-8812',
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

  const activeCajaMenor = cajaMenorShared && cajaMenorShared.length > 0 ? cajaMenorShared : defaultCajaMenor;

  // Novedades de terreno fallback
  const defaultNovedades = [
    {
      id: 'NOV-01',
      area: 'Lobby Principal Torre 2',
      asunto: 'Descalibración en brazo hidráulico de puerta principal',
      prioridad: 'Alta',
      estado: 'En Verificación Terreno',
      fecha: 'Hoy 09:15 AM',
      reporta: 'Guarda Portería'
    },
    {
      id: 'NOV-02',
      area: 'Plataforma Parqueaderos Sótano 1',
      asunto: 'Sensor fotoeléctrico de talanquera con acumulación de polvo',
      prioridad: 'Normal',
      estado: 'Solucionado ✅',
      fecha: 'Hoy 08:30 AM',
      reporta: 'Rondero Perimetral'
    },
    {
      id: 'NOV-03',
      area: 'Deck Zona Húmeda / Piscina',
      asunto: 'Reposición de reactivos DPD para prueba sanitaria Ley 1209',
      prioridad: 'Urgente',
      estado: 'Abierta Hoy',
      fecha: 'Hoy 07:00 AM',
      reporta: 'Piscinero Jhon Gaviria'
    }
  ];

  const [novedadesLocales, setNovedadesLocales] = useState(defaultNovedades);

  // Estados formulario Caja Menor
  const [nuevoConcepto, setNuevoConcepto] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [nuevoProveedor, setNuevoProveedor] = useState('');
  const [nuevoRecibo, setNuevoRecibo] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('Ferretería / Locativo');

  // Estados formulario Novedades
  const [nuevaAreaNov, setNuevaAreaNov] = useState('');
  const [nuevoAsuntoNov, setNuevoAsuntoNov] = useState('');
  const [nuevaPrioridadNov, setNuevaPrioridadNov] = useState('Normal');

  // Cálculos fondo fijo caja menor
  const fondoFijoTotal = 1500000;
  const totalEjecutado = activeCajaMenor.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  const saldoDisponible = Math.max(0, fondoFijoTotal - totalEjecutado);

  const handleRegistrarGasto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoConcepto.trim() || !nuevoMonto || !nuevoProveedor.trim()) {
      onShowToast?.('Completa todos los campos obligatorios del recibo.');
      return;
    }

    const nuevoItem = {
      id: `CM-2026-${Date.now().toString().slice(-4)}`,
      recibo_num: nuevoRecibo.trim() || `REC-${Math.floor(100 + Math.random() * 900)}`,
      fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
      concepto: nuevoConcepto.trim(),
      proveedor_ferreteria: nuevoProveedor.trim(),
      nit_proveedor: '900.' + Math.floor(100000 + Math.random() * 900000) + '-1',
      monto: Number(nuevoMonto),
      responsable: 'Supervisor en Terreno',
      categoria_operativa: nuevaCategoria,
      estado_reembolso: 'Ejecutado de Fondo Fijo'
    };

    if (setCajaMenorShared) {
      setCajaMenorShared(prev => [nuevoItem, ...prev]);
    }

    setNuevoConcepto('');
    setNuevoMonto('');
    setNuevoProveedor('');
    setNuevoRecibo('');
    onShowToast?.(`💰 Recibo de Caja Menor por $${Number(nuevoMonto).toLocaleString()} COP registrado.`);
  };

  const handleRegistrarNovedad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaAreaNov.trim() || !nuevoAsuntoNov.trim()) {
      onShowToast?.('Por favor ingresa el área y asunto de la novedad.');
      return;
    }

    const nuevaNov = {
      id: `NOV-${Date.now().toString().slice(-3)}`,
      area: nuevaAreaNov.trim(),
      asunto: nuevoAsuntoNov.trim(),
      prioridad: nuevaPrioridadNov,
      estado: 'Abierta Hoy',
      fecha: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reporta: 'Supervisor en Terreno'
    };

    setNovedadesLocales(prev => [nuevaNov, ...prev]);
    if (setNovedadesShared) {
      setNovedadesShared(prev => [nuevaNov, ...prev]);
    }

    setNuevaAreaNov('');
    setNuevoAsuntoNov('');
    onShowToast?.('⚡ Novedad operativa registrada y enviada a la bitácora.');
  };

  const handleToggleEstadoNovedad = (id: string) => {
    setNovedadesLocales(prev =>
      prev.map(n => {
        if (n.id === id) {
          const prox = n.estado === 'Abierta Hoy' ? 'En Verificación Terreno' : n.estado === 'En Verificación Terreno' ? 'Solucionado ✅' : 'Abierta Hoy';
          return { ...n, estado: prox };
        }
        return n;
      })
    );
    onShowToast?.('Estado de la novedad actualizado.');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 flex flex-col">
      
      {/* 1. CABECERA SIEMPRE ARRIBA */}
      <header className="w-full shrink-0">
        <div className="bg-[#0b0f17] border border-cyan-500/30 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
                Supervisor Operativo • Gestión Detallada de Terreno
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">Auditoría de Campo, Rondas NFC y Control de Caja Menor</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              ● Fondo Garita: ${saldoDisponible.toLocaleString()} COP
            </span>
          </div>
        </div>
      </header>

      {/* SELECTOR MÓVIL DIRECTO (PANTALLAS PEQUEÑAS) */}
      <div className="md:hidden w-full bg-[#0b0f17] border border-cyan-500/20 p-2.5 rounded-2xl flex items-center gap-2 shadow-md">
        <span className="text-xs font-mono text-cyan-400 font-bold shrink-0">Submódulo:</span>
        <select
          value={activeSubTab}
          onChange={(e) => setActiveSubTab(e.target.value as any)}
          className="bg-slate-900 text-cyan-300 font-bold text-xs p-2 rounded-xl border border-slate-700 w-full outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option value="rondas">📡 1. Rondas y Patrullajes NFC</option>
          <option value="caja_menor">💰 2. Auditoría de Caja Menor</option>
          <option value="novedades">🔧 3. Novedades y Órdenes de Terreno</option>
        </select>
      </div>

      {/* 2. BARRA DE NAVEGACIÓN EN UNA SOLA LÍNEA HORIZONTAL SIN SALTOS (EXECUTIVE GLASS) */}
      <nav className="w-full flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-2 px-3 bg-[#0b0f17] border border-cyan-500/20 rounded-2xl shrink-0 shadow-lg touch-pan-x">
        <span className="text-xs font-bold text-cyan-400 font-mono px-3 py-1.5 bg-cyan-500/10 rounded-xl border border-cyan-500/30 shrink-0">
          ⚡ Terreno Limpio (Executive Glass)
        </span>
        {[
          { id: 'rondas', label: '1. Rondas y Patrullajes NFC', icon: Radio },
          { id: 'caja_menor', label: '2. Auditoría de Caja Menor', icon: Wallet },
          { id: 'novedades', label: '3. Novedades y Órdenes de Terreno', icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 min-h-[40px] ${
                isActive 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 text-cyan-400" /> {tab.label}
            </button>
          );
        })}
      </nav>

      {/* 3. CONTENIDO PRINCIPAL ABAJO */}
      <main className="w-full flex-1 space-y-6">
        
        {/* SUBTAB 1: RONDAS Y PATRULLAJES NFC */}
        {activeSubTab === 'rondas' && (
          <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
                  <Radio className="w-4 h-4" /> 1. Registro y Trazabilidad de Rondas (NFC / QR)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Supervisión de cumplimiento de rutas de vigilancia en sótanos, cuartos técnicos y perímetros.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/30">
                {activeRondas.length} Puntos en Ruta
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRondas.map((ronda: any) => {
                const puntoNombre = ronda.punto || ronda.punto_control || 'Punto de Ronda';
                const tagCode = ronda.tagNfc || ronda.tag_nfc_verificado || 'NFC-TAG-PH';
                const obs = ronda.observacion_detallada || ronda.presion || ronda.ubicacion || 'Inspección conforme';
                const resp = ronda.responsable || ronda.responsable_ronda || ronda.guarda || 'Personal Operativo';
                const horaStr = ronda.hora || ronda.hora_exacta || '08:00 AM';
                const statusStr = ronda.estado || '🟢 Sin Novedad';

                return (
                  <div key={ronda.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex flex-col justify-between gap-3 text-xs hover:border-cyan-500/40 transition">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-sm">{puntoNombre}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {tagCode}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1 text-[11px]">{obs}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-2">
                        <span>🕒 {horaStr}</span>
                        <span>👤 {resp}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        statusStr.includes('🟢') || statusStr.includes('Normal')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {statusStr}
                      </span>
                      <span className="text-slate-500 font-mono text-[9px] truncate max-w-[150px]">
                        {ronda.hash ? ronda.hash.slice(0, 20) + '...' : 'Sello NFC validado ✓'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 2: AUDITORÍA DE CAJA MENOR */}
        {activeSubTab === 'caja_menor' && (
          <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> 2. Control y Movimientos de Caja Menor en Garita
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Auditoría de gastos menores autorizados para imprevistos operativos en la copropiedad.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/30">
                  {activeCajaMenor.length} Recibos Legalizados
                </span>
              </div>
            </div>

            {/* TARJETAS RESUMEN FINANCIERO CAJA MENOR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-slate-400">Fondo Fijo Asignado</span>
                <p className="text-lg font-black text-white font-mono mt-1">${fondoFijoTotal.toLocaleString()} COP</p>
              </div>
              <div className="p-4 bg-[#07090e] border border-amber-500/30 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-amber-400">Total Gastado / Ejecutado</span>
                <p className="text-lg font-black text-amber-400 font-mono mt-1">${totalEjecutado.toLocaleString()} COP</p>
              </div>
              <div className="p-4 bg-[#07090e] border border-emerald-500/30 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-emerald-400">Saldo Disponible en Garita</span>
                <p className="text-lg font-black text-emerald-400 font-mono mt-1">${saldoDisponible.toLocaleString()} COP</p>
              </div>
            </div>

            {/* FORMULARIO PARA REGISTRAR NUEVO RECIBO DE CAJA MENOR */}
            <form onSubmit={handleRegistrarGasto} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#07090e] p-5 rounded-2xl border border-slate-800">
              <input
                type="text"
                placeholder="N° Recibo / Factura (Ej: FAC-109)..."
                value={nuevoRecibo}
                onChange={(e) => setNuevoRecibo(e.target.value)}
                className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400 font-mono"
              />

              <input
                type="number"
                placeholder="Monto COP (Ej: 180000)..."
                value={nuevoMonto}
                onChange={(e) => setNuevoMonto(e.target.value)}
                className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400 font-mono"
                required
              />

              <input
                type="text"
                placeholder="Proveedor / Ferretería..."
                value={nuevoProveedor}
                onChange={(e) => setNuevoProveedor(e.target.value)}
                className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
                required
              />

              <select
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-teal-400"
              >
                <option>Ferretería / Locativo</option>
                <option>Eléctrico / Iluminación</option>
                <option>Cerrajería / Seguridad</option>
                <option>Mensajería / Papelería</option>
              </select>

              <input
                type="text"
                placeholder="Concepto detallado del gasto operativo..."
                value={nuevoConcepto}
                onChange={(e) => setNuevoConcepto(e.target.value)}
                className="md:col-span-3 p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
                required
              />

              <button
                type="submit"
                className="bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:opacity-90"
              >
                <PlusCircle className="w-4 h-4" /> Legalizar Recibo
              </button>
            </form>

            {/* BANDEJA DE RECIBOS */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Movimientos Legalizados de Caja Menor
              </h5>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {activeCajaMenor.map((rec: any) => (
                  <div key={rec.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-teal-400 font-mono text-sm">{rec.recibo_num}</span>
                        <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-800">
                          {rec.categoria_operativa}
                        </span>
                      </div>
                      <p className="text-slate-200 mt-1">{rec.concepto}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Proveedor: {rec.proveedor_ferreteria} • {rec.fecha}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-emerald-400 font-mono font-black text-sm">
                        ${(Number(rec.monto) || 0).toLocaleString()} COP
                      </span>
                      <span className="px-2.5 py-1 rounded-lg font-bold text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30">
                        {rec.estado_reembolso || 'Ejecutado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: NOVEDADES Y ÓRDENES DE TERRENO */}
        {activeSubTab === 'novedades' && (
          <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> 3. Novedades y Solicitudes de Terreno
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Gestión de imprevistos detectados por el personal de vigilancia y asignación de correctivos.
                </p>
              </div>

              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                {novedadesLocales.length} Novedades Registradas
              </span>
            </div>

            {/* FORMULARIO PARA REGISTRAR NUEVA NOVEDAD */}
            <form onSubmit={handleRegistrarNovedad} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#07090e] p-5 rounded-2xl border border-slate-800">
              <input
                type="text"
                placeholder="Área o Zona de la Novedad..."
                value={nuevaAreaNov}
                onChange={(e) => setNuevaAreaNov(e.target.value)}
                className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-amber-400"
                required
              />

              <select
                value={nuevaPrioridadNov}
                onChange={(e) => setNuevaPrioridadNov(e.target.value)}
                className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-amber-400"
              >
                <option>Normal</option>
                <option>Alta</option>
                <option>Urgente</option>
              </select>

              <input
                type="text"
                placeholder="Descripción detallada de la novedad..."
                value={nuevoAsuntoNov}
                onChange={(e) => setNuevoAsuntoNov(e.target.value)}
                className="md:col-span-2 p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-amber-400"
                required
              />

              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-black py-3 px-5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:opacity-90"
                >
                  <PlusCircle className="w-4 h-4" /> Radicar Novedad de Terreno
                </button>
              </div>
            </form>

            {/* LISTADO DE NOVEDADES */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Bitácora de Novedades de Campo
              </h5>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {novedadesLocales.map((nov: any) => (
                  <div key={nov.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{nov.area}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          nov.prioridad === 'Urgente'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : nov.prioridad === 'Alta'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}>
                          {nov.prioridad}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1">{nov.asunto}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Reporta: {nov.reporta} • {nov.fecha}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border ${
                        nov.estado.includes('Solucionado')
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : nov.estado.includes('Verificación')
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {nov.estado}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleEstadoNovedad(nov.id)}
                        className="bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 px-3 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer"
                      >
                        Avanzar Estado →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
