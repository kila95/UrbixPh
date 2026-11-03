import React, { useState } from 'react';
import { 
  Building2, Home, User, DollarSign, ShieldCheck, FileText, 
  Car, Dog, Phone, PhoneCall, Key, QrCode, Package, Calendar, AlertCircle, 
  CheckCircle2, Download, Plus, ArrowRight, Share2, Sparkles, MapPin 
} from 'lucide-react';

export interface ResidenteMiApartamentoGeneralProps {
  unidad?: any;
  onShowToast?: (msg: string) => void;
  onNavigateTab?: (tabId: string) => void;
}

export default function ResidenteMiApartamentoGeneral({
  unidad,
  onShowToast,
  onNavigateTab
}: ResidenteMiApartamentoGeneralProps) {
  // Datos del inmueble y titularidad
  const aptoData = {
    torreApto: unidad?.unidad || 'Torre 2 - Apto 301',
    propietario: unidad?.propietario || 'Esteban Ochoa Mesa',
    documento: 'C.C. 1.037.640.112 de Medellín',
    matricula: '001-948102',
    coeficiente: unidad?.coeficiente || 18.5,
    areaPrivada: '96.50 m²',
    parqueadero: 'Parqueadero Privado #14 (Sótano 1)',
    cuartoUtil: 'Cuarto Útil / Bodega #08',
    estrato: 'Estrato 6 • Residencial',
    cuotaAdmin: 420000,
    saldoActual: 0,
    estadoCartera: 'Al Día • Paz y Salvo Vigente'
  };

  // Censo de residentes / habitantes autorizados (3 Residentes Demo)
  const [habitantes, setHabitantes] = useState([
    { id: '1', nombre: 'Martha Lucía Gómez (Demo 1)', parentesco: 'Propietaria Principal • T2-301', celular: '+57 300 481 9021', citofonia: 'Línea 1 Directa' },
    { id: '2', nombre: 'Dr. Mauricio Restrepo (Demo 2)', parentesco: 'Consejero Principal • T1-302', celular: '+57 312 774 8190', citofonia: 'Línea 2 Secundario' },
    { id: '3', nombre: 'Andrés Gómez (Demo 3)', parentesco: 'Consejero Suplente • T1-201', celular: '+57 315 882 3410', citofonia: 'Línea 3 Directa' }
  ]);
  const [showModalHabitante, setShowModalHabitante] = useState(false);
  const [nuevoNombreHab, setNuevoNombreHab] = useState('');
  const [nuevoParentescoHab, setNuevoParentescoHab] = useState('Familiar Residente');
  const [nuevoCelularHab, setNuevoCelularHab] = useState('');

  // Vehículos registrados
  const [vehiculos, setVehiculos] = useState([
    { id: 'v1', tipo: 'Automóvil', placa: 'KLV-924', marca: 'Mazda CX-30', celda: 'Celda Privada #14', tagRfid: 'RFID-VEH-301-A' }
  ]);

  // Mascotas registradas
  const [mascotas, setMascotas] = useState([
    { id: 'm1', nombre: 'Rocky', especie: 'Canino (Golden Retriever)', chip: 'CHIP-94100021-CO', vacunas: 'Vigentes 2026' }
  ]);

  const handleDescargarPazYSalvo = () => {
    onShowToast?.('📄 Generando y descargando Certificado de Paz y Salvo Digital Ley 675 con firma criptográfica.');
  };

  const handleAgregarHabitante = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreHab.trim()) return;

    setHabitantes(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        nombre: nuevoNombreHab.trim(),
        parentesco: nuevoParentescoHab,
        celular: nuevoCelularHab.trim() || 'No registrado',
        citofonia: 'Enlace en Garita'
      }
    ]);

    setNuevoNombreHab('');
    setNuevoCelularHab('');
    setShowModalHabitante(false);
    onShowToast?.('✅ Habitante registrado y sincronizado con el censo de portería.');
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* 1. TARJETA HERO DE IDENTIFICACIÓN DEL APARTAMENTO */}
      <div className="bg-[#0b0f17] border border-cyan-500/30 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-[0_0_35px_rgba(34,211,238,0.12)] relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-start gap-3 sm:gap-4 z-10">
          <div className="p-3 sm:p-4 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.25)] shrink-0">
            <Home className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
                Ficha Técnica Residencial
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                ● Inmueble Habitado
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">{aptoData.torreApto}</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Titular: <strong className="text-slate-200">{aptoData.propietario}</strong> • {aptoData.documento}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 w-full lg:w-auto">
          <button
            type="button"
            onClick={handleDescargarPazYSalvo}
            className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 text-slate-950 font-black px-4 py-3 rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0 min-h-[44px]"
          >
            <Download className="w-4 h-4" /> Certificado Paz y Salvo Digital
          </button>
        </div>
      </div>

      {/* 2. MATRIZ DE DETALLES TÉCNICOS & ESTADO FINANCIERO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="p-4 sm:p-5 bg-[#0b0f17] border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Área Privada & Coeficiente</span>
          <p className="text-xl font-black text-white font-mono mt-1">{aptoData.areaPrivada}</p>
          <p className="text-xs text-cyan-400 font-mono">Coeficiente: {aptoData.coeficiente}% Ley 675</p>
        </div>

        <div className="p-4 sm:p-5 bg-[#0b0f17] border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Parqueadero Asignado</span>
          <p className="text-base font-bold text-white mt-1">{aptoData.parqueadero}</p>
          <p className="text-xs text-slate-400 font-mono">{aptoData.cuartoUtil}</p>
        </div>

        <div className="p-4 sm:p-5 bg-[#0b0f17] border border-emerald-500/30 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-emerald-400">Estado de Cartera PH</span>
          <p className="text-xl font-black text-emerald-400 font-mono mt-1">$0 COP</p>
          <p className="text-xs text-emerald-300 font-medium">Al día • Cuota: ${aptoData.cuotaAdmin.toLocaleString()} COP</p>
        </div>

        <div className="p-4 sm:p-5 bg-[#0b0f17] border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Matrícula Inmobiliaria</span>
          <p className="text-base font-bold text-white font-mono mt-1">{aptoData.matricula}</p>
          <p className="text-xs text-slate-400 font-mono">{aptoData.estrato}</p>
        </div>

      </div>

      {/* 3. DOS COLUMNAS: CENSO DE HABITANTES & VEHÍCULOS / MASCOTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* COLUMNA IZQUIERDA: CENSO DE HABITANTES Y CITOFONÍA */}
        <div className="bg-[#0b0f17] border border-slate-800/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                <User className="w-4 h-4 text-cyan-400" /> Habitantes Registrados & Citofonía
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Personas autorizadas y enlazadas a la garita de portería</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab?.('citofono')}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Conectar con Garita de Portería"
              >
                <PhoneCall className="w-3.5 h-3.5 text-cyan-400" /> Abrir Citófono
              </button>
              <button
                type="button"
                onClick={() => setShowModalHabitante(true)}
                className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {habitantes.map((hab) => (
              <div key={hab.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white text-sm block">{hab.nombre}</span>
                  <div className="flex items-center gap-2 text-slate-400 mt-1 text-[11px]">
                    <span className="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-mono">{hab.parentesco}</span>
                    <span>📞 {hab.celular}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30 block">
                    {hab.citofonia}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* FORMULARIO EXPANDIBLE PARA AGREGAR HABITANTE */}
          {showModalHabitante && (
            <form onSubmit={handleAgregarHabitante} className="p-4 bg-slate-900/80 border border-cyan-500/30 rounded-2xl space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-white font-mono">Nuevo Habitante / Residente Autorizado</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Nombre completo..."
                  value={nuevoNombreHab}
                  onChange={(e) => setNuevoNombreHab(e.target.value)}
                  className="p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400"
                  required
                />
                <select
                  value={nuevoParentescoHab}
                  onChange={(e) => setNuevoParentescoHab(e.target.value)}
                  className="p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400"
                >
                  <option>Familiar Residente</option>
                  <option>Hijo/a</option>
                  <option>Arrendatario / Inquilino</option>
                  <option>Empleado Doméstico</option>
                </select>
                <input
                  type="text"
                  placeholder="Número de celular (+57)..."
                  value={nuevoCelularHab}
                  onChange={(e) => setNuevoCelularHab(e.target.value)}
                  className="p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400 sm:col-span-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModalHabitante(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-cyan-400 transition cursor-pointer"
                >
                  Guardar en Censo
                </button>
              </div>
            </form>
          )}
        </div>

        {/* COLUMNA DERECHA: VEHÍCULOS AUTORIZADOS & MASCOTAS */}
        <div className="space-y-6">
          
          {/* VEHÍCULOS */}
          <div className="bg-[#0b0f17] border border-slate-800/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                <Car className="w-4 h-4 text-teal-400" /> Vehículo Registrado (Celda #14)
              </h3>
              <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/30">
                Lector RFID Activo
              </span>
            </div>

            {vehiculos.map((v) => (
              <div key={v.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-base font-mono">{v.placa}</span>
                    <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-800">{v.tipo}</span>
                  </div>
                  <p className="text-slate-400 mt-1">{v.marca} • Asignado a: <strong className="text-slate-200">{v.celda}</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                    {v.tagRfid}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* MASCOTAS */}
          <div className="bg-[#0b0f17] border border-slate-800/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                <Dog className="w-4 h-4 text-amber-400" /> Mascota Censada
              </h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                Vacunación al Día ✓
              </span>
            </div>

            {mascotas.map((m) => (
              <div key={m.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white text-sm block">{m.nombre}</span>
                  <p className="text-slate-400 mt-0.5">{m.especie} • Microchip: <strong className="text-slate-300 font-mono">{m.chip}</strong></p>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                  {m.vacunas}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* 4. ACCESOS DIRECTOS OPERATIVOS A OTROS SUBMÓDULOS */}
      <div className="bg-[#0b0f17] border border-slate-800/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase text-slate-400 font-mono tracking-wider">
          ⚡ Accesos Rápidos para tu Apartamento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <button
            type="button"
            onClick={() => onNavigateTab?.('qr')}
            className="p-4 bg-[#07090e] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-left transition cursor-pointer flex flex-col justify-between gap-3 group"
          >
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl w-fit group-hover:scale-110 transition">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">Autorizar Visita</span>
              <span className="text-[11px] text-slate-400">Generar pase QR express</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('reservas_deposito')}
            className="p-4 bg-[#07090e] hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl text-left transition cursor-pointer flex flex-col justify-between gap-3 group"
          >
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl w-fit group-hover:scale-110 transition">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">Salón Social / BBQ</span>
              <span className="text-[11px] text-slate-400">Apartar fecha con depósito</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('pqrsd')}
            className="p-4 bg-[#07090e] hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl text-left transition cursor-pointer flex flex-col justify-between gap-3 group"
          >
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl w-fit group-hover:scale-110 transition">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">Radicar PQRSD</span>
              <span className="text-[11px] text-slate-400">Reloj legal Ley 1755</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('financiero')}
            className="p-4 bg-[#07090e] hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-left transition cursor-pointer flex flex-col justify-between gap-3 group"
          >
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit group-hover:scale-110 transition">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">Extracto Financiero</span>
              <span className="text-[11px] text-slate-400">Ver pagos y comprobantes</span>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}
