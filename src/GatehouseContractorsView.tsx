import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Wrench, Clock, CheckCircle2, 
  AlertTriangle, UserCheck, LogIn, LogOut, Search, HardHat, FileText 
} from 'lucide-react';

export interface GatehouseTechnician {
  name: string;
  doc: string;
  checkedIn: boolean;
}

export interface GatehouseAuthorizedEntry {
  id: string;
  contractor: string;
  specialty: string;
  area: string;
  technicians: GatehouseTechnician[];
  toolsDeclared: string;
  arlStatus: string;
  arlValid: boolean;
  entryTime: string | null;
  exitTime: string | null;
  status: 'Esperando Llegada' | 'En Sitio' | 'Salida Registrada' | 'Bloqueado por SG-SST';
}

export interface GatehouseContractorsViewProps {
  tenantName?: string;
  onShowToast?: (msg: string) => void;
  onLogout?: () => void;
}

export default function GatehouseContractorsView({
  tenantName = "Reserva del Tesoro",
  onShowToast,
  onLogout
}: GatehouseContractorsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Cuadrillas autorizadas por administración para la jornada
  const [authorizedEntries, setAuthorizedEntries] = useState<GatehouseAuthorizedEntry[]>([
    {
      id: 'OT-2026-041',
      contractor: 'Hidráulicas y Redes Antioquia S.A.S.',
      specialty: 'Plomería y Tuberías',
      area: 'Sótano 1 - Buitrón Torre 2',
      technicians: [
        { name: 'Carlos Ruiz', doc: 'CC 71.234.555', checkedIn: false },
        { name: 'Mario Soto', doc: 'CC 1.037.888.999', checkedIn: false }
      ],
      toolsDeclared: '1 Rotomartillo DeWalt, 1 Termofusora, 2 Cajas de dados',
      arlStatus: 'Vigente (SURA Riesgo V)',
      arlValid: true,
      entryTime: null,
      exitTime: null,
      status: 'Esperando Llegada' // 'Esperando Llegada' | 'En Sitio' | 'Salida Registrada'
    },
    {
      id: 'OT-2026-042',
      contractor: 'Acabados & Pisos El Poblado',
      specialty: 'Obra Civil y Pisos',
      area: 'Lobby Principal',
      technicians: [
        { name: 'Hernán Darío Gómez', doc: 'CC 70.111.222', checkedIn: true }
      ],
      toolsDeclared: '1 Pulidora Bosch, 1 Cortadora de baldosa Rubi, 1 Nivel láser',
      arlStatus: 'Vigente (Positiva Riesgo IV)',
      arlValid: true,
      entryTime: '08:15 AM',
      exitTime: null,
      status: 'En Sitio'
    },
    {
      id: 'OT-2026-043',
      contractor: 'Impermeabilizaciones Verticales',
      specialty: 'Cubiertas',
      area: 'Terraza Torre 1',
      technicians: [
        { name: 'Julián Montoya', doc: 'CC 98.765.432', checkedIn: false }
      ],
      toolsDeclared: 'Soplete de gas, 2 Arneses certificados, Cuerda estática',
      arlStatus: 'VENCIDA (Rechazar Ingreso)',
      arlValid: false,
      entryTime: null,
      exitTime: null,
      status: 'Bloqueado por SG-SST'
    }
  ]);

  const handleRegisterEntry = (id: string) => {
    const timeNow = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    setAuthorizedEntries(authorizedEntries.map(entry => 
      entry.id === id ? { ...entry, entryTime: timeNow, status: 'En Sitio' } : entry
    ));
    onShowToast?.(`✅ Entrada de cuadrilla e inventario de herramientas registrados (${id} • ${timeNow})`);
  };

  const handleRegisterExit = (id: string) => {
    const timeNow = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    setAuthorizedEntries(authorizedEntries.map(entry => 
      entry.id === id ? { ...entry, exitTime: timeNow, status: 'Salida Registrada' } : entry
    ));
    onShowToast?.(`📋 Salida de contratista e inspección de equipos completada (${id} • ${timeNow})`);
  };

  const filtered = authorizedEntries.filter(e => 
    e.contractor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.technicians.some(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.doc.includes(searchTerm))
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* CABECERA DE PORTERÍA */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full">
              Control de Accesos • Vigilancia
            </span>
            <span className="text-xs text-slate-400">Minuta Técnica Digital</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Ingreso de Contratistas y Reparaciones</h2>
          <p className="text-xs text-slate-400">
            Copropiedad: <strong className="text-slate-200">{tenantName}</strong> • Solo ingresa personal con ARL vigente y cédula verificada.
          </p>
        </div>

        {/* Buscador de Cédula o Empresa + Botón Salir */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar cédula, técnico o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
            />
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
          )}
        </div>
      </div>

      {/* LISTADO DE AUTORIZACIONES */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((item) => (
          <div 
            key={item.id} 
            className={`border rounded-3xl p-5 space-y-4 transition ${
              !item.arlValid 
                ? 'bg-rose-950/20 border-rose-500/30' 
                : item.status === 'En Sitio'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {item.id}
                  </span>
                  <span className="text-xs font-bold text-amber-400">{item.specialty}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'En Sitio' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : item.status === 'Bloqueado por SG-SST'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">{item.contractor}</h3>
                <p className="text-xs text-slate-400">Destino de trabajo: <strong className="text-slate-200">{item.area}</strong></p>
              </div>

              {/* Estado ARL */}
              <div className={`px-3 py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold ${
                item.arlValid 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              }`}>
                {item.arlValid ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                <span>{item.arlStatus}</span>
              </div>
            </div>

            {/* Cuadrilla y Herramientas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Personal Autorizado por Cédula:
                </p>
                <div className="space-y-1">
                  {item.technicians.map((tech, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300">
                      <span>• {tech.name}</span>
                      <span className="font-mono text-slate-400">{tech.doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" /> Herramientas y Equipos Declarados:
                </p>
                <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                  {item.toolsDeclared}
                </p>
              </div>
            </div>

            {/* Botonera de Marcación Entrada / Salida */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                {item.entryTime && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Clock className="w-3.5 h-3.5" /> Entrada: <strong>{item.entryTime}</strong>
                  </span>
                )}
                {item.exitTime && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> Salida: <strong>{item.exitTime}</strong>
                  </span>
                )}
              </div>

              <div>
                {!item.arlValid ? (
                  <span className="text-xs text-rose-400 font-bold bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                    ⛔ Ingreso Prohibido por Ley (Sin ARL)
                  </span>
                ) : item.status === 'Esperando Llegada' ? (
                  <button
                    onClick={() => handleRegisterEntry(item.id)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" /> Registrar Entrada y Revisar Equipos
                  </button>
                ) : item.status === 'En Sitio' ? (
                  <button
                    onClick={() => handleRegisterExit(item.id)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Registrar Salida e Inspección
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Jornada Completada y Retirada
                  </span>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
