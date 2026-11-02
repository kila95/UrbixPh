import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { UserPlus, Lock, Mail, User, Building, CheckCircle2 } from 'lucide-react';

export default function CrearAdministradorModal({
  tenantIdActual,
  onCerrar,
  onShowToast,
  onUsuarioCreado
}: {
  tenantIdActual: string;
  onCerrar: () => void;
  onShowToast?: (msg: string) => void;
  onUsuarioCreado?: (usuario: { nombre: string; email: string; rol: string; tenantId: string }) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('admin_ph');
  const [guardando, setGuardando] = useState(false);

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (isSupabaseConfigured) {
        // Registro de usuario en Supabase con sus metadatos
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: nombre.trim(),
              role: rol,
              tenant_id: tenantIdActual
            }
          }
        });

        if (error) throw error;
      } else {
        await new Promise((res) => setTimeout(res, 450));
      }

      onUsuarioCreado?.({
        nombre: nombre.trim(),
        email: email.trim(),
        rol,
        tenantId: tenantIdActual
      });
      onShowToast?.(`Administrador ${nombre} registrado con éxito. Ya puede iniciar sesión.`);
      onCerrar();
    } catch (err: any) {
      onShowToast?.(`Error al crear usuario: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">Registrar Nuevo Administrador</h4>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-white text-xs font-mono">✕</button>
        </div>

        <form onSubmit={handleCrearUsuario} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Nombre Completo</label>
            <input
              type="text"
              placeholder="Ej. Andrés Restrepo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2.5 bg-[#07090e] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Correo Electrónico (Usuario)</label>
            <input
              type="email"
              placeholder="andres@administracion.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-[#07090e] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400 font-mono"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Contraseña Inicial</label>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-[#07090e] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400 font-mono"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Rol de Acceso</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full p-2.5 bg-[#07090e] border border-slate-700 text-cyan-300 font-mono rounded-xl outline-none"
            >
              <option value="admin_ph">Administrador Principal (PH)</option>
              <option value="supervisor">Supervisor Operativo</option>
              <option value="porteria">Operador de Portería</option>
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-bold font-mono transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2.5 rounded-xl font-black font-mono transition disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Crear Acceso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
