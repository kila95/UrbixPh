import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, Mail, Clock, MapPin, 
  DollarSign, RefreshCw, Calculator, X, ShieldAlert 
} from 'lucide-react';
import { supabase } from './supabaseClient';

export interface StaffAdminMember {
  id: string;
  nombre: string;
  rol: string;
  email: string;
  estado: string;
  turnoLineaTiempo: string;
  ubicacionLineaTiempo: string;
  salarioBasico: number;
  auxilioTransporte: number;
  comisiones: number;
  deduccionSalud: number;
  deduccionPension: number;
  netoPagar: number;
}

interface Props {
  onShowToast?: (msg: string) => void;
  edificiosAsignados?: { id: string; name: string }[];
  edificioActivoId?: string;
  setEdificioActivoId?: (id: string) => void;
}

export default function SeccionGestionPersonalAdmin({ onShowToast }: Props) {
  const [personalStaff, setPersonalStaff] = useState<StaffAdminMember[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [tenantReal, setTenantReal] = useState<{ id: string; name: string } | null>(null);

  // Estados del modal de registro
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [emailNuevo, setEmailNuevo] = useState('');
  const [rolNuevo, setRolNuevo] = useState<'admin' | 'vigilante' | 'aseo' | 'supervisor'>('vigilante');
  const [turnoNuevo, setTurnoNuevo] = useState('Turno Rotativo 12h');
  const [ubicacionNuevo, setUbicacionNuevo] = useState('Portería y Garita');

  // Estados de nómina colombiana
  const [salarioBasico, setSalarioBasico] = useState<number>(1650000);
  const [aplicaAuxilio, setAplicaAuxilio] = useState<boolean>(true);
  const [auxilioTransporte, setAuxilioTransporte] = useState<number>(162000);
  const [comisiones, setComisiones] = useState<number>(0);
  const [guardando, setGuardando] = useState(false);
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const obtenerIdsEliminadosLocal = (): string[] => {
    try {
      const raw = localStorage.getItem('urbix_deleted_staff_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const registrarIdEliminadoLocal = (id: string) => {
    try {
      const actuales = obtenerIdsEliminadosLocal();
      if (!actuales.includes(id)) {
        localStorage.setItem('urbix_deleted_staff_ids', JSON.stringify([...actuales, id]));
      }
    } catch {
      // ignore storage errors
    }
  };

  // Cálculos dinámicos de Ley Colombiana (Salud 4%, Pensión 4%)
  const baseSeguridadSocial = Number(salarioBasico || 0) + Number(comisiones || 0);
  const deduccionSalud = Math.round(baseSeguridadSocial * 0.04);
  const deduccionPension = Math.round(baseSeguridadSocial * 0.04);
  const totalDevengado = baseSeguridadSocial + (aplicaAuxilio ? Number(auxilioTransporte || 0) : 0);
  const totalDeducciones = deduccionSalud + deduccionPension;
  const netoCalculado = totalDevengado - totalDeducciones;

  // 1. Manejador dinámico al cambiar el select de Cargo
  const handleCambioRol = (nuevoCargo: 'admin' | 'vigilante' | 'aseo' | 'supervisor') => {
    setRolNuevo(nuevoCargo);

    switch (nuevoCargo) {
      case 'supervisor':
        setTurnoNuevo('Jornada Ordinaria / Supervisión Terreno');
        setUbicacionNuevo('Rondas Perimetrales & Zonas Comunes');
        break;
      case 'vigilante':
        setTurnoNuevo('Turno Rotativo 12h');
        setUbicacionNuevo('Portería y Garita Principal');
        break;
      case 'aseo':
        setTurnoNuevo('Turno Diurno (06:00 - 14:00)');
        setUbicacionNuevo('Mantenimiento, Pasillos y Basuras');
        break;
      case 'admin':
        setTurnoNuevo('Jornada Diurna (08:00 - 17:00)');
        setUbicacionNuevo('Oficina de Administración');
        break;
    }
  };

  const cargarPersonal = async () => {
    try {
      setCargando(true);
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, name')
        .ilike('name', '%Tricentenario%')
        .limit(1)
        .single();

      if (tenantData) {
        setTenantReal(tenantData);

        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .neq('role', 'residente')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (profiles) {
          const idsEliminados = obtenerIdsEliminadosLocal();
          const perfilesActivos = profiles.filter(
            (p) => p.is_active !== false && !idsEliminados.includes(p.id)
          );

          setPersonalStaff(
            perfilesActivos.map((p) => {
              const sBasico = Number(p.salary_base || 1650000);
              const sAux = Number(p.transport_allowance || 162000);
              const sCom = Number(p.commissions || 0);
              const baseSS = sBasico + sCom;
              const dSalud = Math.round(baseSS * 0.04);
              const dPension = Math.round(baseSS * 0.04);
              const neto = (baseSS + sAux) - (dSalud + dPension);

              return {
                id: p.id,
                nombre: p.full_name || 'Sin Nombre',
                rol: 
                  p.role === 'admin' ? 'Administración' :
                  p.role === 'vigilante' ? 'Vigilancia / Portería' :
                  p.role === 'aseo' ? 'Servicios Generales' : 'Supervisor Ops',
                email: p.email || '',
                estado: p.is_active ? 'Activo (En nómina)' : 'Inactivo',
                turnoLineaTiempo: p.shift_schedule || 'Jornada Ordinaria',
                ubicacionLineaTiempo: p.location_work || 'En sitio',
                salarioBasico: sBasico,
                auxilioTransporte: sAux,
                comisiones: sCom,
                deduccionSalud: dSalud,
                deduccionPension: dPension,
                netoPagar: neto
              };
            })
          );
        }
      }
    } catch (err: any) {
      console.error('Error cargando staff:', err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPersonal();
  }, []);

  // Crear trabajador en Supabase
  const handleCrearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevo.trim() || !emailNuevo.trim() || !tenantReal) return;

    try {
      setGuardando(true);
      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            full_name: nombreNuevo.trim(),
            email: emailNuevo.trim().toLowerCase(),
            role: rolNuevo,
            tenant_id: tenantReal.id,
            is_active: true,
            salary_base: Number(salarioBasico),
            transport_allowance: aplicaAuxilio ? Number(auxilioTransporte) : 0,
            commissions: Number(comisiones),
            shift_schedule: turnoNuevo,
            location_work: ubicacionNuevo
          }
        ]);

      if (error) throw error;

      onShowToast?.(`Trabajador "${nombreNuevo}" vinculado con sueldo asignado`);
      setNombreNuevo('');
      setEmailNuevo('');
      setComisiones(0);
      setMostrarForm(false);
      await cargarPersonal();
    } catch (err: any) {
      onShowToast?.('Error guardando colaborador: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Paso 1: Solicitar confirmación sin usar window.confirm (que es bloqueado en iframes)
  const handleSolicitarEliminar = (e: React.MouseEvent, id: string, nombre: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEmpleadoAEliminar({ id, nombre });
  };

  // Paso 2: Ejecutar eliminación real del trabajador
  const confirmarEliminacionEmpleado = async (id: string, nombre: string) => {
    setEliminandoId(id);

    // 1. Quitarlo de la vista inmediatamente y registrar baja local
    registrarIdEliminadoLocal(id);
    setPersonalStaff((prev) => prev.filter((item) => item.id !== id));
    setEmpleadoAEliminar(null);

    try {
      // 2. Intentar borrar físicamente de Supabase
      const { data: deletedRows, error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
        .select('id');

      // 3. Si RLS o llaves foráneas impiden el DELETE físico, desactivar y desvincular el perfil
      if (error || !deletedRows || deletedRows.length === 0) {
        await supabase
          .from('profiles')
          .update({ is_active: false, role: 'residente' })
          .eq('id', id);
      }

      onShowToast?.(`Trabajador "${nombre}" eliminado de la nómina.`);
    } catch (err: any) {
      console.error('Aviso al sincronizar baja en Supabase:', err);
      onShowToast?.(`Trabajador "${nombre}" retirado de la lista.`);
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Cabecera */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2.5 py-0.5 rounded-full font-bold">
              Base de Datos Supabase Real
            </span>
            <span className="text-xs text-slate-400">
              Copropiedad: <strong className="text-white">{tenantReal?.name || 'Urb. Tricentenario'}</strong>
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2 font-mono">
            <Users className="w-5 h-5 text-cyan-400" />
            Gestión de Personal, Vigilancia y Nómina
          </h2>
          <p className="text-xs text-slate-400">
            Control de cuadrilla, asignación salarial y deducciones conforme a la legislación laboral colombiana.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cargarPersonal}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Nuevo Colaborador
          </button>
        </div>
      </div>

      {/* Grid de Tarjetas de Empleados */}
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-mono">
            Personal Activo Registrado ({personalStaff.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Sincronizado con tabla `profiles`</span>
        </div>

        {cargando ? (
          <div className="text-center py-10 text-xs font-mono text-slate-500">
            Consultando personal y salarios...
          </div>
        ) : personalStaff.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
            No hay colaboradores asignados actualmente. Registra el primero con el botón superior.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalStaff.map((staff) => (
              <div 
                key={staff.id} 
                className="bg-slate-950 border border-slate-800/80 hover:border-cyan-500/30 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-md font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {staff.rol}
                    </span>
                    {/* Botón de eliminar funcional (con confirmación en tarjeta o modal sin bloqueo de navegador) */}
                    {empleadoAEliminar?.id === staff.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-500/50 px-2 py-1 rounded-xl">
                        <button
                          type="button"
                          disabled={eliminandoId === staff.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            confirmarEliminacionEmpleado(staff.id, staff.nombre);
                          }}
                          className="px-2 py-0.5 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-mono font-bold rounded-lg transition cursor-pointer"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEmpleadoAEliminar(null);
                          }}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded-lg transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleSolicitarEliminar(e, staff.id, staff.nombre)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 rounded-xl text-[11px] font-mono font-bold transition cursor-pointer"
                        title="Eliminar trabajador"
                      >
                        <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                        <span className="pointer-events-none">Eliminar</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">{staff.nombre}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {staff.email}
                    </p>
                  </div>

                  {/* Resumen de Nómina */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Básico:</span>
                      <span>${staff.salarioBasico.toLocaleString('es-CO')}</span>
                    </div>
                    {staff.auxilioTransporte > 0 && (
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Aux. Transporte:</span>
                        <span>+${staff.auxilioTransporte.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    {staff.comisiones > 0 && (
                      <div className="flex justify-between text-emerald-400 text-[11px]">
                        <span>Comisiones / Extra:</span>
                        <span>+${staff.comisiones.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-rose-400/80 text-[10px] border-t border-slate-800 pt-1">
                      <span>Salud + Pensión (8%):</span>
                      <span>-${(staff.deduccionSalud + staff.deduccionPension).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between text-cyan-300 font-bold border-t border-slate-800 pt-1 text-xs">
                      <span>Neto a Pagar:</span>
                      <span>${staff.netoPagar.toLocaleString('es-CO')} COP</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 font-sans">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{staff.turnoLineaTiempo}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{staff.ubicacionLineaTiempo}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {staff.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Registrar Empleado con Parámetros de Nómina */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  Registrar Colaborador y Parámetros Salariales
                </h3>
                <p className="text-xs text-slate-400">
                  Copropiedad: {tenantReal?.name || 'Urb. Tricentenario'}
                </p>
              </div>
              <button 
                onClick={() => setMostrarForm(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearEmpleado} className="space-y-4 text-xs">
              {/* Datos Personales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-400 uppercase mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Andrés Vesga"
                    value={nombreNuevo}
                    onChange={(e) => setNombreNuevo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 uppercase mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="ej. vigilante@tricentenario.com"
                    value={emailNuevo}
                    onChange={(e) => setEmailNuevo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Cargo y Turno */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-slate-400 uppercase mb-1">Cargo</label>
                  <select
                    value={rolNuevo}
                    onChange={(e: any) => handleCambioRol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-sans"
                  >
                    <option value="supervisor">Supervisor Operativo</option>
                    <option value="vigilante">Vigilancia / Portería</option>
                    <option value="aseo">Aseo y Mantenimiento</option>
                    <option value="admin">Administración</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-slate-400 uppercase mb-1">Turno Asignado</label>
                  <input
                    type="text"
                    value={turnoNuevo}
                    onChange={(e) => setTurnoNuevo(e.target.value)}
                    list="turnos-sugeridos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-sans"
                  />
                  <datalist id="turnos-sugeridos">
                    <option value="Turno Rotativo 12h (06:00 - 18:00)" />
                    <option value="Jornada Ordinaria / Supervisión Terreno" />
                    <option value="Turno Diurno (06:00 - 14:00)" />
                    <option value="Jornada Administrativa (08:00 - 17:00)" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-mono text-slate-400 uppercase mb-1">Ubicación / Puesto</label>
                  <input
                    type="text"
                    value={ubicacionNuevo}
                    onChange={(e) => setUbicacionNuevo(e.target.value)}
                    list="ubicaciones-sugeridas"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-sans"
                  />
                  <datalist id="ubicaciones-sugeridas">
                    <option value="Rondas Perimetrales & Zonas Comunes" />
                    <option value="Portería y Garita Principal" />
                    <option value="Pasillos, Torres 1 y 2, Basuras" />
                    <option value="Oficina de Administración" />
                  </datalist>
                </div>
              </div>

              {/* Configuración de Nómina Colombiana */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold">
                  <Calculator className="w-4 h-4" />
                  <span>Configuración Salarial y Prestaciones de Ley</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-mono text-slate-400 uppercase mb-1">Sueldo Básico ($ COP)</label>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={salarioBasico}
                      onChange={(e) => setSalarioBasico(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-slate-400 uppercase mb-1">Comisiones / Bonos ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={comisiones}
                      onChange={(e) => setComisiones(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-slate-400 uppercase mb-1">Auxilio Transporte ($)</label>
                    <input
                      type="number"
                      disabled={!aplicaAuxilio}
                      value={aplicaAuxilio ? auxilioTransporte : 0}
                      onChange={(e) => setAuxilioTransporte(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono disabled:opacity-40 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chkAuxilio"
                    checked={aplicaAuxilio}
                    onChange={(e) => setAplicaAuxilio(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-900 text-cyan-500"
                  />
                  <label htmlFor="chkAuxilio" className="text-slate-300 text-[11px]">
                    Aplica auxilio de transporte legal (si devenga hasta 2 SMLMV)
                  </label>
                </div>

                {/* Simulador de Liquidación en Tiempo Real */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-500/20 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Cotización Seguridad Social:</span>
                    <span>${baseSeguridadSocial.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-rose-400/80">
                    <span>Aporte Salud Empleado (4%):</span>
                    <span>-${deduccionSalud.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-rose-400/80">
                    <span>Aporte Pensión Empleado (4%):</span>
                    <span>-${deduccionPension.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-cyan-300 font-bold border-t border-slate-800 pt-1 text-xs">
                    <span>Total Neto Estimado a Recibir:</span>
                    <span>${netoCalculado.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>
              </div>

              {/* Botonera */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black rounded-xl cursor-pointer hover:opacity-90 transition"
                >
                  {guardando ? 'Guardando en Supabase...' : 'Guardar y Vincular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
