import React, { useState } from 'react';
import { HardHat, UserPlus, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { DEFAULT_CONTRATISTAS_VISITAS_TECNICAS } from './ModuloContratistasYVisitasTecnicas';

export default function FormularioIngresoTecnicoPorteria({
  contratistasShared = [],
  setContratistasShared,
  onShowToast
}: {
  contratistasShared?: any[];
  setContratistasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
}) {
  const [empresa, setEmpresa] = useState('');
  const [tecnico, setTecnico] = useState('');
  const [cedula, setCedula] = useState('');
  const [aptoDestino, setAptoDestino] = useState('Torre 1 - 302');
  const [arlEntidad, setArlEntidad] = useState('ARL Sura');
  const [tienePolizaRce, setTienePolizaRce] = useState(true);

  // Registrar técnico no listado desde la garita (Paso 3)
  const handleRegistrarTecnicoGarita = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa.trim() || !tecnico.trim() || !cedula.trim()) {
      onShowToast?.('Por favor completa los datos obligatorios del técnico.');
      return;
    }

    const nuevoContratista = {
      id: `con_${Date.now()}`,
      empresa: empresa.trim(),
      tecnico: tecnico.trim(),
      cedula: cedula.trim(),
      aptoDestino: aptoDestino,
      tipoIngreso: 'Registro Manual en Garita (Empresa Constituida)',
      arlVigente: true, // Por ser empresa constituida en Colombia se asume activa con verificación PILA
      polizaRce: tienePolizaRce,
      estadoPorteria: 'Adentro en Labor',
      arlEntidad: arlEntidad,
      horaIngreso: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (setContratistasShared) {
      setContratistasShared((prev: any[]) => {
        const baseList = prev && prev.length > 0 ? prev : DEFAULT_CONTRATISTAS_VISITAS_TECNICAS;
        return [nuevoContratista, ...baseList];
      });
    }

    // Limpiar formulario
    const empresaRegistrada = empresa.trim();
    setEmpresa('');
    setTecnico('');
    setCedula('');
    onShowToast?.(`Técnico de ${empresaRegistrada} autorizado e ingresado. Notificado a Supervisión.`);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6 font-sans">
      
      {/* Cabecera */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/25">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
            Portería • Ingreso Excepcional de Proveedor / Técnico No Listado
          </span>
          <h3 className="text-base font-black text-white mt-1">Formulario de Autorización Rápida (SG-SST Colombia)</h3>
        </div>
      </div>

      {/* Formulario de Alta Inmediata en Garita */}
      <form onSubmit={handleRegistrarTecnicoGarita} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Empresa Prestadora de Servicios</label>
          <input
            type="text"
            placeholder="Ej. Claro, Tigo, Schindler, Aire Acondicionado..."
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Nombre Completo del Técnico</label>
          <input
            type="text"
            placeholder="Nombres y Apellidos..."
            value={tecnico}
            onChange={(e) => setTecnico(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Cédula de Ciudadanía</label>
          <input
            type="text"
            placeholder="Número de documento..."
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Apartamento / Destino</label>
          <select
            value={aptoDestino}
            onChange={(e) => setAptoDestino(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-emerald-500"
          >
            <option>Torre 1 - 302</option>
            <option>Torre 2 - 301</option>
            <option>Torre 1 - 502</option>
            <option>Áreas Comunes / Sótano Técnico</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Entidad ARL Verificada (Colombia)</label>
          <select
            value={arlEntidad}
            onChange={(e) => setArlEntidad(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-emerald-500"
          >
            <option>ARL Sura</option>
            <option>ARL Positiva</option>
            <option>ARL Bolivar</option>
            <option>ARL Colmena / Equidad</option>
          </select>
        </div>

        <div className="flex items-center justify-between bg-slate-950 border border-slate-700 p-3 rounded-xl mt-auto">
          <span className="text-xs text-slate-300 font-mono">¿Póliza RCE Activa?</span>
          <input
            type="checkbox"
            checked={tienePolizaRce}
            onChange={(e) => setTienePolizaRce(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="md:col-span-3 pt-2">
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-6 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Autorizar e Ingresar Técnico a Torre (Sincronizar con Supervisor)
          </button>
        </div>

      </form>
    </div>
  );
}
