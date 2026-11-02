import React, { useState } from 'react';
import {
  Users, UserPlus, Shield, Trash2, CheckCircle2, AlertCircle, Building2, Check, Plus, Edit3,
  DollarSign, Clock, Filter, Coins, ShieldCheck, Sparkles, Briefcase, MapPin
} from 'lucide-react';
import CrearAdministradorModal from './components/CrearAdministradorModal';
import ModalRegistroAdministradorEmpresa from './components/ModalRegistroAdministradorEmpresa';
import GestionCuadrillaAdminModal from './components/GestionCuadrillaAdminModal';

export interface StaffAdminMember {
  id: string;
  nombre: string;
  rol: string;
  email: string;
  estado: string;
  edificios?: string[];
  salarioBasico: number;
  auxilioTransporte?: number;
  turnoLineaTiempo?: string;
  ubicacionLineaTiempo?: string;
}

export default function SeccionGestionPersonalAdmin({
  onShowToast
}: {
  onShowToast?: (msg: string) => void;
}) {
  // Catálogo de copropiedades / edificios para supervisores
  const catalogCopropiedades = [
    'P.H. Reserva del Tesoro (Torre 1 & 2)',
    'Conjunto Altavista PH',
    'Edificio Portal del Campestre',
    'Torres de Vizcaya PH',
    'Mirador del Poblado PH'
  ];

  // Estado local para filtrar trabajadores por edificio / copropiedad
  const [edificioFiltro, setEdificioFiltro] = useState<string>('TODOS');
  const [mostrarModalCrearAdmin, setMostrarModalCrearAdmin] = useState(false);
  const [mostrarModalAdminEmpresa, setMostrarModalAdminEmpresa] = useState(false);
  const [mostrarModalCuadrilla, setMostrarModalCuadrilla] = useState(false);

  // Estado local de prueba para el personal de la copropiedad con salarios y turnos de línea de tiempo
  const [personalStaff, setPersonalStaff] = useState<StaffAdminMember[]>([
    {
      id: 'st_1',
      nombre: 'Carlos Mario Pineda',
      rol: 'Administrador',
      email: 'carlos.admin@urbix.ph',
      estado: 'Activo (En sitio)',
      edificios: ['P.H. Reserva del Tesoro (Torre 1 & 2)', 'Conjunto Altavista PH'],
      salarioBasico: 3500000,
      auxilioTransporte: 0,
      turnoLineaTiempo: '08:00 AM - 05:00 PM (Jornada Diurna)',
      ubicacionLineaTiempo: 'Oficina de Administración Central'
    },
    {
      id: 'st_2',
      nombre: 'Julián Arango',
      rol: 'Supervisor Operativo',
      email: 'supervisor@urbix.ph',
      estado: 'En Recorrido',
      edificios: ['P.H. Reserva del Tesoro (Torre 1 & 2)', 'Edificio Portal del Campestre', 'Mirador del Poblado PH'],
      salarioBasico: 2300000,
      auxilioTransporte: 162000,
      turnoLineaTiempo: '07:00 AM - 04:00 PM (Supervisión Terreno)',
      ubicacionLineaTiempo: 'Ronda Perimetral & Inspección Garitas'
    },
    {
      id: 'st_3',
      nombre: 'Don José (Todero)',
      rol: 'Aseo & Mantenimiento',
      email: 'jose.operativo@urbix.ph',
      estado: 'Activo (En sitio)',
      edificios: ['P.H. Reserva del Tesoro (Torre 1 & 2)', 'Conjunto Altavista PH'],
      salarioBasico: 1423500,
      auxilioTransporte: 162000,
      turnoLineaTiempo: '06:00 AM - 02:00 PM (Turno Mañana)',
      ubicacionLineaTiempo: 'Mantenimiento General & Zonas Verdes'
    },
    {
      id: 'st_4',
      nombre: 'Luis Fernando Pérez',
      rol: 'Vigilante / Portería',
      email: 'porteria.tesoro@urbix.ph',
      estado: 'Activo (En sitio)',
      edificios: ['P.H. Reserva del Tesoro (Torre 1 & 2)'],
      salarioBasico: 1650000,
      auxilioTransporte: 162000,
      turnoLineaTiempo: '06:00 AM - 06:00 PM (Turno 12h Garita)',
      ubicacionLineaTiempo: 'Garita Principal & Control Peatonal'
    },
    {
      id: 'st_5',
      nombre: 'Sandra Milena Ospina',
      rol: 'Vigilante / Portería',
      email: 'sandra.vigilancia@urbix.ph',
      estado: 'Activo (En sitio)',
      edificios: ['Torres de Vizcaya PH', 'Mirador del Poblado PH'],
      salarioBasico: 1650000,
      auxilioTransporte: 162000,
      turnoLineaTiempo: '06:00 AM - 06:00 PM (Turno 12h)',
      ubicacionLineaTiempo: 'Recepción y Control Talanquera'
    }
  ]);

  // Formulario para nuevo empleado
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [emailNuevo, setEmailNuevo] = useState('');
  const [rolNuevo, setRolNuevo] = useState('Vigilante / Portería');
  const [salarioNuevo, setSalarioNuevo] = useState<number>(1423500);
  const [auxilioNuevo, setAuxilioNuevo] = useState<number>(162000);
  const [turnoNuevo, setTurnoNuevo] = useState('06:00 AM - 02:00 PM (Turno Mañana)');
  const [ubicacionNuevo, setUbicacionNuevo] = useState('Garita Principal de Accesos');
  const [edificiosSeleccionados, setEdificiosSeleccionados] = useState<string[]>([
    'P.H. Reserva del Tesoro (Torre 1 & 2)'
  ]);
  const [nuevoEdificioInput, setNuevoEdificioInput] = useState('');

  // Estado para modal de edición
  const [staffEnEdicion, setStaffEnEdicion] = useState<StaffAdminMember | null>(null);
  const [edificiosEdicionTemp, setEdificiosEdicionTemp] = useState<string[]>([]);
  const [salarioEdicionTemp, setSalarioEdicionTemp] = useState<number>(1423500);
  const [auxilioEdicionTemp, setAuxilioEdicionTemp] = useState<number>(162000);
  const [turnoEdicionTemp, setTurnoEdicionTemp] = useState<string>('');
  const [inputCustomEdicion, setInputCustomEdicion] = useState('');

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  const toggleEdificioForm = (ed: string) => {
    setEdificiosSeleccionados(prev =>
      prev.includes(ed) ? prev.filter(e => e !== ed) : [...prev, ed]
    );
  };

  const handleAgregarCustomForm = () => {
    if (!nuevoEdificioInput.trim()) return;
    const item = nuevoEdificioInput.trim();
    if (!edificiosSeleccionados.includes(item)) {
      setEdificiosSeleccionados(prev => [...prev, item]);
    }
    setNuevoEdificioInput('');
  };

  const handleCrearEmpleado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevo.trim() || !emailNuevo.trim()) {
      onShowToast?.('Por favor ingresa el nombre y el correo electrónico del trabajador.');
      return;
    }

    const edificiosFinales = edificiosSeleccionados.length > 0 ? edificiosSeleccionados : ['P.H. Reserva del Tesoro (Torre 1 & 2)'];

    const nuevoTrabajador: StaffAdminMember = {
      id: `st_${Date.now()}`,
      nombre: nombreNuevo.trim(),
      rol: rolNuevo,
      email: emailNuevo.trim(),
      estado: 'Activo (En sitio)',
      edificios: edificiosFinales,
      salarioBasico: Number(salarioNuevo) || 1423500,
      auxilioTransporte: Number(auxilioNuevo) || 0,
      turnoLineaTiempo: turnoNuevo,
      ubicacionLineaTiempo: ubicacionNuevo || 'Garita Principal'
    };

    setPersonalStaff([nuevoTrabajador, ...personalStaff]);
    setNombreNuevo('');
    setEmailNuevo('');
    setSalarioNuevo(1423500);
    setAuxilioNuevo(162000);
    setEdificiosSeleccionados(['P.H. Reserva del Tesoro (Torre 1 & 2)']);
    onShowToast?.(`✅ ${rolNuevo} "${nuevoTrabajador.nombre}" registrado con salario de ${formatCOP(nuevoTrabajador.salarioBasico)} y ${edificiosFinales.length} edificio(s) asignados.`);
  };

  const handleAbrirEdicion = (staff: StaffAdminMember) => {
    setStaffEnEdicion(staff);
    setEdificiosEdicionTemp(staff.edificios || ['P.H. Reserva del Tesoro (Torre 1 & 2)']);
    setSalarioEdicionTemp(staff.salarioBasico || 1423500);
    setAuxilioEdicionTemp(staff.auxilioTransporte || 0);
    setTurnoEdicionTemp(staff.turnoLineaTiempo || '06:00 AM - 02:00 PM (Turno Mañana)');
  };

  const toggleEdificioModal = (ed: string) => {
    setEdificiosEdicionTemp(prev =>
      prev.includes(ed) ? prev.filter(e => e !== ed) : [...prev, ed]
    );
  };

  const handleAgregarCustomModal = () => {
    if (!inputCustomEdicion.trim()) return;
    const item = inputCustomEdicion.trim();
    if (!edificiosEdicionTemp.includes(item)) {
      setEdificiosEdicionTemp(prev => [...prev, item]);
    }
    setInputCustomEdicion('');
  };

  const handleGuardarEdicionStaff = () => {
    if (!staffEnEdicion) return;
    const finalList = edificiosEdicionTemp.length > 0 ? edificiosEdicionTemp : ['P.H. Reserva del Tesoro (Torre 1 & 2)'];

    setPersonalStaff(prev =>
      prev.map(s => (s.id === staffEnEdicion.id ? {
        ...s,
        edificios: finalList,
        salarioBasico: salarioEdicionTemp,
        auxilioTransporte: auxilioEdicionTemp,
        turnoLineaTiempo: turnoEdicionTemp
      } : s))
    );

    onShowToast?.(`🏢 Perfil, nómina y asignación de edificios actualizados para ${staffEnEdicion.nombre}.`);
    setStaffEnEdicion(null);
  };

  const handleDespedirEmpleado = (id: string, nombre: string) => {
    setPersonalStaff(personalStaff.filter(s => s.id !== id));
    onShowToast?.(`🚫 Acceso revocado y empleado "${nombre}" dado de baja del sistema.`);
  };

  // Filtrado de personal según el edificio seleccionado
  const personalFiltrado = personalStaff.filter(staff => {
    if (edificioFiltro === 'TODOS') return true;
    return staff.edificios?.some(ed => ed.toLowerCase().includes(edificioFiltro.toLowerCase()));
  });

  // Cálculo de totales financieros y nómina
  const totalNominaBasica = personalFiltrado.reduce((acc, s) => acc + (s.salarioBasico || 0), 0);
  const totalAuxilioTransp = personalFiltrado.reduce((acc, s) => acc + (s.auxilioTransporte || 0), 0);
  const totalDevengadoEmpresa = totalNominaBasica + totalAuxilioTransp;

  // Icono y color según rol
  const getRolDetails = (rol: string) => {
    if (rol.includes('Vigilante') || rol.includes('Portería')) {
      return { icon: '🛡️', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
    if (rol.includes('Aseo') || rol.includes('Mantenimiento')) {
      return { icon: '🧹', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
    }
    if (rol.includes('Supervisor')) {
      return { icon: '📋', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    }
    return { icon: '📊', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 font-sans">
      
      {/* Cabecera de la Sección */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20 uppercase tracking-widest">
            Administración de Recurso Humano y Control de Nómina
          </span>
          <h3 className="text-base font-black text-white mt-1">Gestión de Empleados, Supervisores, Aseo y Vigilancia por Edificio</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setMostrarModalCuadrilla(true)}
            className="bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-black px-3.5 py-1.5 rounded-xl font-mono text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Asignar Cuadrilla &amp; Operación
          </button>
          <button
            type="button"
            onClick={() => setMostrarModalAdminEmpresa(true)}
            className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black px-3.5 py-1.5 rounded-xl font-mono text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Briefcase className="w-3.5 h-3.5" /> Registrar Administrador &amp; Empresa
          </button>
          <button
            type="button"
            onClick={() => setMostrarModalCrearAdmin(true)}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold px-3.5 py-1.5 rounded-xl font-mono text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> Acceso Rápido Rol
          </button>
          <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/20">
            {personalFiltrado.length} Trabajadores Activos
          </span>
        </div>
      </div>

      {mostrarModalCuadrilla && (
        <GestionCuadrillaAdminModal
          tenantId="ten_01"
          nombreConjunto={edificioFiltro === 'TODOS' ? 'P.H. Reserva del Tesoro (Torre 1 & 2)' : edificioFiltro}
          onCerrar={() => setMostrarModalCuadrilla(false)}
          onShowToast={onShowToast}
          onColaboradorAsignado={(miembro) => {
            const rolLabel =
              miembro.role === 'supervisor'
                ? 'Supervisor Operativo'
                : miembro.role === 'porteria'
                ? 'Vigilante / Portería'
                : 'Aseo & Mantenimiento';
            const edTarget = edificioFiltro === 'TODOS' ? 'P.H. Reserva del Tesoro (Torre 1 & 2)' : edificioFiltro;
            setPersonalStaff(prev => [
              {
                id: miembro.id,
                nombre: miembro.nombre,
                rol: rolLabel,
                email: miembro.email,
                estado: 'Activo (En sitio)',
                edificios: [edTarget],
                salarioBasico: miembro.role === 'supervisor' ? 2300000 : miembro.role === 'porteria' ? 1650000 : 1423500,
                auxilioTransporte: 162000,
                turnoLineaTiempo: miembro.turno,
                ubicacionLineaTiempo: 'Asignado en Conjunto Residencial'
              },
              ...prev
            ]);
          }}
        />
      )}

      {mostrarModalAdminEmpresa && (
        <ModalRegistroAdministradorEmpresa
          tenantsDisponibles={catalogCopropiedades.map((name, idx) => ({ id: `ten_0${idx + 1}`, name }))}
          onCerrar={() => setMostrarModalAdminEmpresa(false)}
          onShowToast={onShowToast}
          onRegistroExitoso={({ nombreEmpresa, nombreRepresentante, email, tenantId }) => {
            const edMatch = catalogCopropiedades[Number(tenantId.replace('ten_0', '')) - 1] || catalogCopropiedades[0];
            setPersonalStaff(prev => [
              {
                id: `st_${Date.now()}`,
                nombre: `${nombreRepresentante} (${nombreEmpresa})`,
                rol: 'Administrador',
                email,
                estado: 'Activo (En sitio)',
                edificios: [edMatch],
                salarioBasico: 3800000,
                auxilioTransporte: 0,
                turnoLineaTiempo: '08:00 AM - 05:00 PM (Representación Legal)',
                ubicacionLineaTiempo: 'Oficina de Administración Central'
              },
              ...prev
            ]);
          }}
        />
      )}

      {mostrarModalCrearAdmin && (
        <CrearAdministradorModal
          tenantIdActual="ten_01"
          onCerrar={() => setMostrarModalCrearAdmin(false)}
          onShowToast={onShowToast}
          onUsuarioCreado={({ nombre, email, rol }) => {
            const rolLabel = rol === 'admin_ph' ? 'Administrador' : rol === 'supervisor' ? 'Supervisor Operativo' : 'Vigilante / Portería';
            setPersonalStaff(prev => [
              {
                id: `st_${Date.now()}`,
                nombre,
                rol: rolLabel,
                email,
                estado: 'Activo (En sitio)',
                edificios: ['P.H. Reserva del Tesoro (Torre 1 & 2)'],
                salarioBasico: rol === 'admin_ph' ? 3500000 : rol === 'supervisor' ? 2300000 : 1650000,
                auxilioTransporte: rol === 'admin_ph' ? 0 : 162000,
                turnoLineaTiempo: '08:00 AM - 05:00 PM (Jornada Diurna)',
                ubicacionLineaTiempo: 'Administración / Control Copropiedad'
              },
              ...prev
            ]);
          }}
        />
      )}

      {/* SELECTOR DE EDIFICIO / CONJUNTO Y BARRA DE RESUMEN FINANCIERO */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-mono font-bold text-slate-200">Filtrar Trabajadores por Copropiedad / Edificio:</span>
          </div>

          {/* Botones de filtro por edificio */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setEdificioFiltro('TODOS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer shrink-0 border ${
                edificioFiltro === 'TODOS'
                  ? 'bg-teal-500 text-slate-950 font-black border-teal-400 shadow-md shadow-teal-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              🏢 Todos los Edificios ({personalStaff.length})
            </button>
            {catalogCopropiedades.map((ed) => {
              const count = personalStaff.filter(s => s.edificios?.includes(ed)).length;
              const isSelected = edificioFiltro === ed;
              return (
                <button
                  key={ed}
                  type="button"
                  onClick={() => setEdificioFiltro(ed)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-teal-500 text-slate-950 font-black border-teal-400 shadow-md shadow-teal-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  🏢 {ed}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-slate-950 text-teal-300' : 'bg-slate-800 text-slate-300'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* METRICAS DE NOMINA Y SALARIO MENSUAL DEL EDIFICIO SELECCIONADO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-teal-400" /> Salario Básico Mensual (Total)
            </span>
            <div className="text-lg font-black font-mono text-white">
              {formatCOP(totalNominaBasica)}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Suma de sueldos base contractuales</p>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" /> Aux. Transporte / Recargos
            </span>
            <div className="text-lg font-black font-mono text-amber-300">
              {formatCOP(totalAuxilioTransp)}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Auxilio de transporte ley COP</p>
          </div>

          <div className="bg-gradient-to-r from-teal-950/60 to-slate-900 p-3.5 rounded-xl border border-teal-500/30 space-y-1">
            <span className="text-[10px] font-mono uppercase text-teal-300 flex items-center gap-1 font-bold">
              <DollarSign className="w-3.5 h-3.5 text-teal-400" /> Total Devengado Nómina
            </span>
            <div className="text-lg font-black font-mono text-teal-300">
              {formatCOP(totalDevengadoEmpresa)}
            </div>
            <p className="text-[10px] text-teal-400/80 font-mono">Costo total nómina mensual empresa</p>
          </div>
        </div>
      </div>

      {/* Formulario para Agregar Nuevo Trabajador con Salario y Edificios */}
      <form onSubmit={handleCrearEmpleado} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h4 className="text-xs font-mono font-bold text-teal-400 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Registrar Empleado, Asignar Salario Básico y Copropiedades
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">Nómina Ley 675</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-mono text-slate-400 mb-1 block">Nombre completo:</label>
            <input
              type="text"
              placeholder="Ej. Juan Carlos Ramírez"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 mb-1 block">Correo de contacto:</label>
            <input
              type="email"
              placeholder="Ej. guardia@urbix.ph"
              value={emailNuevo}
              onChange={(e) => setEmailNuevo(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 mb-1 block">Cargo / Área:</label>
            <select
              value={rolNuevo}
              onChange={(e) => setRolNuevo(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-mono font-bold outline-none focus:border-teal-400"
            >
              <option value="Vigilante / Portería">🛡️ Vigilante / Portería</option>
              <option value="Aseo & Mantenimiento">🧹 Aseo &amp; Mantenimiento (Todero)</option>
              <option value="Supervisor Operativo">📋 Supervisor Operativo</option>
              <option value="Administrador">📊 Administrador Adjunto</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 mb-1 block">Salario Básico Mensual ($ COP):</label>
            <input
              type="number"
              placeholder="1423500"
              value={salarioNuevo}
              onChange={(e) => setSalarioNuevo(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 text-teal-300 font-mono font-bold rounded-xl text-xs outline-none focus:border-teal-400"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-mono text-slate-400 mb-1 block">Auxilio de Transporte ($ COP):</label>
            <input
              type="number"
              placeholder="162000"
              value={auxilioNuevo}
              onChange={(e) => setAuxilioNuevo(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold rounded-xl text-xs outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 mb-1 block">Turno en Línea de Tiempo:</label>
            <input
              type="text"
              placeholder="Ej. 06:00 AM - 02:00 PM (Turno Mañana)"
              value={turnoNuevo}
              onChange={(e) => setTurnoNuevo(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white font-mono rounded-xl text-xs outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 mb-1 block">Ubicación / Puesto de trabajo:</label>
            <input
              type="text"
              placeholder="Ej. Garita Principal Torre 1"
              value={ubicacionNuevo}
              onChange={(e) => setUbicacionNuevo(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white font-mono rounded-xl text-xs outline-none focus:border-teal-400"
            />
          </div>
        </div>

        {/* Selección de Edificios en Formulario */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
          <label className="text-[11px] font-mono font-bold text-teal-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Edificios y Copropiedades Asignadas a Cargo:
          </label>
          <div className="flex flex-wrap gap-2">
            {catalogCopropiedades.map((ed) => {
              const isSelected = edificiosSeleccionados.includes(ed);
              return (
                <button
                  key={ed}
                  type="button"
                  onClick={() => toggleEdificioForm(ed)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Building2 className="w-3.5 h-3.5 text-slate-500" />}
                  {ed}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Añadir otra copropiedad..."
              value={nuevoEdificioInput}
              onChange={(e) => setNuevoEdificioInput(e.target.value)}
              className="p-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400 flex-1"
            />
            <button
              type="button"
              onClick={handleAgregarCustomForm}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 px-6 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
          >
            <UserPlus className="w-4 h-4" /> Registrar Empleado con Salario y Edificios
          </button>
        </div>
      </form>

      {/* Listado de Personal Activo con Detalles de Salario y Línea de Tiempo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400" />
            {edificioFiltro === 'TODOS'
              ? 'Personal Registrado y Cobertura Multicopropiedad'
              : `Trabajadores Asignados a: ${edificioFiltro}`}
          </h4>
          <span className="text-[11px] font-mono text-slate-400">
            {personalFiltrado.length} / {personalStaff.length} en este filtro
          </span>
        </div>

        {personalFiltrado.length === 0 ? (
          <div className="p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-mono">No hay trabajadores asignados a esta copropiedad actualmente.</p>
            <button
              type="button"
              onClick={() => setEdificioFiltro('TODOS')}
              className="text-xs font-mono font-bold text-teal-400 hover:underline cursor-pointer"
            >
              Ver todos los trabajadores del portafolio
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {personalFiltrado.map((staff) => {
              const details = getRolDetails(staff.rol);
              const totalDevengado = (staff.salarioBasico || 0) + (staff.auxilioTransporte || 0);

              return (
                <div key={staff.id} className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl transition space-y-3 text-xs">
                  {/* Fila 1: Nombre, Rol, Estado y Botones */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-base">
                        {details.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{staff.nombre}</span>
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${details.color}`}>
                            {staff.rol}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-bold text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {staff.estado}
                          </span>
                        </div>
                        <p className="text-slate-400 font-mono text-[11px] mt-0.5">📧 {staff.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAbrirEdicion(staff)}
                        className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5"
                        title="Editar salario, turno o edificios a cargo"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Asignar / Editar Nómina
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDespedirEmpleado(staff.id, staff.nombre)}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5"
                        title="Dar de baja o revocar acceso"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Revocar
                      </button>
                    </div>
                  </div>

                  {/* Fila 2: Control de Salario Básico y Devengado Mensual */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Coins className="w-3 h-3 text-teal-400" /> Salario Básico Mensual:
                      </span>
                      <span className="font-mono font-bold text-white text-xs block">
                        {formatCOP(staff.salarioBasico || 0)}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-400" /> Aux. Transporte / Recargos:
                      </span>
                      <span className="font-mono font-bold text-amber-300 text-xs block">
                        {formatCOP(staff.auxilioTransporte || 0)}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-teal-300 flex items-center gap-1 font-bold">
                        <DollarSign className="w-3 h-3 text-teal-400" /> Total Devengado Pagado:
                      </span>
                      <span className="font-mono font-black text-teal-300 text-xs block">
                        {formatCOP(totalDevengado)}
                      </span>
                    </div>
                  </div>

                  {/* Fila 3: Turno en Línea de Tiempo y Copropiedades Asignadas */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Línea de Tiempo: <strong className="text-white">{staff.turnoLineaTiempo || '06:00 AM - 02:00 PM'}</strong></span>
                      {staff.ubicacionLineaTiempo && (
                        <span className="text-slate-400 flex items-center gap-1 text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          <MapPin className="w-3 h-3 text-cyan-400" /> {staff.ubicacionLineaTiempo}
                        </span>
                      )}
                    </div>

                    {/* Edificios asignados */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-teal-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> Copropiedades:
                      </span>
                      {staff.edificios && staff.edificios.length > 0 ? (
                        staff.edificios.map((ed, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                              edificioFiltro !== 'TODOS' && ed.includes(edificioFiltro)
                                ? 'bg-teal-500/20 text-teal-300 border-teal-400 shadow-sm'
                                : 'bg-slate-900 text-slate-300 border-slate-800'
                            }`}
                          >
                            🏢 {ed}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Sin copropiedad asignada</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de edición de edificios y salario */}
      {staffEnEdicion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-teal-500/30 p-6 rounded-3xl max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/30 uppercase tracking-widest">
                  Gestión de Nómina y Cobertura
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  Editar Trabajador: {staffEnEdicion.nombre}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{staffEnEdicion.rol} • {staffEnEdicion.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setStaffEnEdicion(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Ajuste de Salario y Auxilio */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-3">
                <label className="text-xs font-mono font-bold text-teal-400 flex items-center gap-1.5">
                  <Coins className="w-4 h-4" /> Ajuste de Salario Básico y Ley ($ COP):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Salario Básico Mensual:</label>
                    <input
                      type="number"
                      value={salarioEdicionTemp}
                      onChange={(e) => setSalarioEdicionTemp(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 text-teal-300 font-mono font-bold rounded-xl text-xs outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Auxilio Transporte:</label>
                    <input
                      type="number"
                      value={auxilioEdicionTemp}
                      onChange={(e) => setAuxilioEdicionTemp(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold rounded-xl text-xs outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Turno en Línea de Tiempo:</label>
                  <input
                    type="text"
                    value={turnoEdicionTemp}
                    onChange={(e) => setTurnoEdicionTemp(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white font-mono rounded-xl text-xs outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {/* Asignación de Edificios */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-200">
                  Selecciona las copropiedades asignadas a cargo:
                </label>

                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {catalogCopropiedades.map((ed) => {
                    const isChecked = edificiosEdicionTemp.includes(ed);
                    return (
                      <button
                        key={ed}
                        type="button"
                        onClick={() => toggleEdificioModal(ed)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                          isChecked
                            ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-teal-400" /> {ed}
                        </span>
                        {isChecked && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <label className="text-[11px] font-mono text-slate-400">Agregar otro edificio manualmente:</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Nombre de la nueva copropiedad..."
                      value={inputCustomEdicion}
                      onChange={(e) => setInputCustomEdicion(e.target.value)}
                      className="p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAgregarCustomModal}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStaffEnEdicion(null)}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarEdicionStaff}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-teal-500/20"
              >
                Guardar Nómina y Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
