import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Building2, 
  Sparkles,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';

export interface StaffMember {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  role: 'supervisor' | 'vigilante' | 'porteria' | 'aseo' | 'mantenimiento' | string;
  turno: string;
  is_active: boolean;
}

export default function GestionCuadrillaAdminModal({
  tenantId,
  nombreConjunto,
  onCerrar,
  onShowToast,
  onColaboradorAsignado
}: {
  tenantId: string;
  nombreConjunto: string;
  onCerrar: () => void;
  onShowToast?: (msg: string) => void;
  onColaboradorAsignado?: (miembro: StaffMember) => void;
}) {
  // ✅ AHORA (Base Real):
  const [personalAsignado, setPersonalAsignado] = useState<StaffMember[]>([]);
  const [cargandoStaff, setCargandoStaff] = useState<boolean>(true);

  // Cargar personal real asignado a este tenant desde la base de datos
  useEffect(() => {
    const cargarPersonalReal = async () => {
      try {
        setCargandoStaff(true);
        if (!tenantId) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, is_active')
          .eq('tenant_id', tenantId)
          .in('role', ['supervisor', 'vigilante', 'porteria', 'aseo', 'mantenimiento']);

        if (error) throw error;

        if (data) {
          setPersonalAsignado(
            data.map(p => ({
              id: p.id,
              user_id: p.id,
              nombre: p.full_name || 'Sin nombre',
              email: p.email || '',
              role: p.role,
              turno: p.role === 'vigilante' ? 'Turno Rotativo 12h' : 'Jornada Diurna',
              is_active: p.is_active ?? true
            }))
          );
        }
      } catch (err: any) {
        console.error('Error cargando personal real:', err.message);
      } finally {
        setCargandoStaff(false);
      }
    };

    cargarPersonalReal();
  }, [tenantId]);

  // Formulario para dar de alta y asignar a un nuevo miembro
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoRol, setNuevoRol] = useState<'supervisor' | 'porteria' | 'aseo'>('porteria');
  const [nuevoTurno, setNuevoTurno] = useState('Día (6:00 - 18:00)');
  const [guardando, setGuardando] = useState(false);

  const handleAsignarNuevoCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      let userIdGenerado = `usr-${Date.now()}`;

      if (isSupabaseConfigured) {
        // 1. Crear el usuario en Auth si es nuevo (o vincular su ID)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: nuevoEmail.trim(),
          password: nuevoPassword,
          options: {
            data: {
              full_name: nuevoNombre.trim(),
              role: nuevoRol,
              tenant_id: tenantId
            }
          }
        });

        if (authError) throw authError;

        userIdGenerado = authData.user?.id || userIdGenerado;

        // 2. Registrar la asignación oficial en tenant_staff
        const { error: staffError } = await supabase
          .from('tenant_staff')
          .insert([
            {
              tenant_id: tenantId,
              user_id: userIdGenerado,
              role: nuevoRol,
              turno: nuevoTurno,
              is_active: true
            }
          ]);

        if (staffError) throw staffError;
      } else {
        await new Promise((res) => setTimeout(res, 400));
      }

      const nuevoMiembro: StaffMember = {
        id: `st-${Date.now()}`,
        user_id: userIdGenerado,
        nombre: nuevoNombre.trim(),
        email: nuevoEmail.trim(),
        role: nuevoRol,
        turno: nuevoTurno,
        is_active: true
      };

      // 3. Actualizar estado local
      setPersonalAsignado(prev => [...prev, nuevoMiembro]);
      onColaboradorAsignado?.(nuevoMiembro);

      onShowToast?.(`✅ ${nuevoNombre} asignado como ${nuevoRol.toUpperCase()} a ${nombreConjunto}.`);
      setNuevoNombre('');
      setNuevoEmail('');
      setNuevoPassword('');
    } catch (err: any) {
      onShowToast?.(`Error al asignar cargo: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleRemoverCargo = async (staffId: string, nombre: string) => {
    try {
      if (isSupabaseConfigured) {
        await supabase.from('tenant_staff').delete().eq('id', staffId);
      }
      setPersonalAsignado(prev => prev.filter(s => s.id !== staffId));
      onShowToast?.(`Acceso revocado para ${nombre} en esta copropiedad.`);
    } catch (err: any) {
      onShowToast?.(`Error al revocar: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-4xl max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest flex items-center gap-1.5 w-fit">
                <ShieldCheck className="w-3 h-3 text-cyan-300" /> Mandato de Administración • Ley 675
              </span>
              <h3 className="text-base font-black text-white mt-1">
                Asignación de Cuadrilla &amp; Operación: {nombreConjunto}
              </h3>
            </div>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-white text-xs font-mono p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
            ✕ Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LADO IZQUIERDO: FORMULARIO PARA DESIGNAR CARGO */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
              Designar Nuevo Colaborador
            </span>

            <form onSubmit={handleAsignarNuevoCargo} className="bg-[#07090e] border border-slate-800 p-4 rounded-2xl space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej. Andrés Felipe Ortiz"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Correo de Acceso (Usuario)</label>
                <input
                  type="email"
                  placeholder="andres@porteria.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-cyan-300 font-mono rounded-xl outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Contraseña de Inicio</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-white font-mono rounded-xl outline-none focus:border-cyan-400"
                  required
                  minLength={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Cargo a Asignar</label>
                  <select
                    value={nuevoRol}
                    onChange={(e) => setNuevoRol(e.target.value as any)}
                    className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-cyan-400 font-mono rounded-xl outline-none cursor-pointer"
                  >
                    <option value="supervisor">Supervisor Operativo</option>
                    <option value="porteria">Vigilante / Garita</option>
                    <option value="aseo">Aseo / Mantenimiento</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Turno Habitual</label>
                  <select
                    value={nuevoTurno}
                    onChange={(e) => setNuevoTurno(e.target.value)}
                    className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-slate-300 font-mono rounded-xl outline-none cursor-pointer"
                  >
                    <option value="Día (6:00 - 18:00)">Día (6am - 6pm)</option>
                    <option value="Noche (18:00 - 6:00)">Noche (6pm - 6am)</option>
                    <option value="Mañana (7:00 - 15:00)">Mañana (7am - 3pm)</option>
                    <option value="Rotativo">Rotativo</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:opacity-50 mt-1"
              >
                <UserPlus className="w-4 h-4" /> {guardando ? 'Asignando Cargo...' : 'Asignar al Conjunto'}
              </button>
            </form>
          </div>

          {/* LADO DERECHO: CUADRILLA ACTIVA EN ESTE CONJUNTO */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Personal Asignado ({personalAsignado.length})
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Aislamiento RLS Activo
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {cargandoStaff ? (
                <div className="text-center py-6 text-slate-500 font-mono text-xs">Cargando personal de la copropiedad...</div>
              ) : personalAsignado.length === 0 ? (
                <div className="text-center py-6 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 font-mono text-xs">
                  No hay personal asignado a este conjunto. Utiliza el formulario de la izquierda para registrar a los vigilantes o personal de aseo reales.
                </div>
              ) : (
                personalAsignado.map((persona) => {
                  const badgeColor = 
                    persona.role === 'supervisor' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                    persona.role === 'porteria' || persona.role === 'vigilante' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                    'bg-teal-500/10 text-teal-400 border-teal-500/30';

                  return (
                    <div
                      key={persona.id}
                      className="p-3.5 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-xs">{persona.nombre}</strong>
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${badgeColor}`}>
                            {persona.role.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                          <span>{persona.email}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <Clock className="w-3 h-3 text-slate-500" /> {persona.turno}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoverCargo(persona.id, persona.nombre)}
                        className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition cursor-pointer border border-rose-500/20"
                        title="Revocar asignación de este conjunto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800">
              * El supervisor asignado podrá monitorear las rondas, bitácora y tareas de aseo únicamente de este conjunto residencial.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
