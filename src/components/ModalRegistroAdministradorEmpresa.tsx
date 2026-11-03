import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { registrarAdministradorPermanente } from '../authService';
import { 
  Building2, 
  UserPlus, 
  Lock, 
  Mail, 
  User, 
  FileText, 
  Phone, 
  ShieldCheck, 
  Sparkles,
  Briefcase
} from 'lucide-react';

export default function ModalRegistroAdministradorEmpresa({
  tenantsDisponibles = [],
  copropiedadesDisponibles: copropiedadesDisponiblesProp,
  tenantPreseleccionadoId,
  onCerrar,
  onShowToast,
  onRegistroExitoso
}: {
  tenantsDisponibles?: { id: string; name: string }[];
  copropiedadesDisponibles?: { id: string; name: string }[];
  tenantPreseleccionadoId?: string;
  onCerrar: () => void;
  onShowToast?: (msg: string) => void;
  onRegistroExitoso?: (registro: {
    tipoPersona: 'juridica' | 'natural';
    nombreEmpresa: string;
    nitCompleto: string;
    telefono: string;
    nombreRepresentante: string;
    cedulaRepresentante: string;
    email: string;
    tenantId: string;
  }) => void;
}) {
  const copropiedadesDisponibles = copropiedadesDisponiblesProp || tenantsDisponibles;

  // Datos de la Empresa Administradora
  const [tipoPersona, setTipoPersona] = useState<'juridica' | 'natural'>('juridica');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [nitEmpresa, setNitEmpresa] = useState('');
  const [dv, setDv] = useState('1');
  const [telefonoCorporativo, setTelefonoCorporativo] = useState('');

  // Datos del Usuario Administrador / Representante Legal
  const [nombreRepresentante, setNombreRepresentante] = useState('');
  const [cedulaRepresentante, setCedulaRepresentante] = useState('');
  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [copropiedadAsignada, setCopropiedadAsignada] = useState(
    tenantPreseleccionadoId || ''
  );
  
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const companyNameResolved =
        tipoPersona === 'juridica' ? nombreEmpresa.trim() : nombreRepresentante.trim();
      const nitCompleto = `${nitEmpresa.trim()}-${dv}`;

      if (isSupabaseConfigured) {
        // Registro permanente sin desloguear la sesión Master Owner
        const perfilGuardado = await registrarAdministradorPermanente({
          nombre: nombreRepresentante.trim(),
          email: emailLogin.trim(),
          telefono: telefonoCorporativo.trim(),
          cedula: cedulaRepresentante.trim(),
          empresa: companyNameResolved,
          nitEmpresa: nitCompleto,
          tenantId: copropiedadAsignada || null
        });

        const adminId = perfilGuardado?.id;

        // Si se asignó una copropiedad, crear la asignación formal
        if (copropiedadAsignada) {
          if (adminId) {
            try {
              await supabase.from('admin_tenant_assignments').insert({
                admin_id: adminId,
                tenant_id: copropiedadAsignada,
                created_at: new Date().toISOString()
              });
            } catch (assignErr) {
              console.warn('Aviso en admin_tenant_assignments:', assignErr);
            }
          }

          try {
            await supabase.from('tenants').update({
              assigned_admin_id: adminId || null,
              admin_name: `${nombreRepresentante.trim()} (${companyNameResolved})`,
              admin_email: emailLogin.trim()
            }).eq('id', copropiedadAsignada);
          } catch (tenantErr) {
            console.warn('Aviso actualizando tenant con admin:', tenantErr);
          }
        }
      } else {
        await new Promise((res) => setTimeout(res, 450));
      }

      onRegistroExitoso?.({
        tipoPersona,
        nombreEmpresa: companyNameResolved,
        nitCompleto,
        telefono: telefonoCorporativo.trim(),
        nombreRepresentante: nombreRepresentante.trim(),
        cedulaRepresentante: cedulaRepresentante.trim(),
        email: emailLogin.trim(),
        tenantId: copropiedadAsignada
      });

      onShowToast?.(`Administrador y Empresa "${nombreEmpresa || nombreRepresentante}" creados con éxito.`);
      onCerrar();
    } catch (err: any) {
      onShowToast?.(`Error al registrar administrador: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 uppercase tracking-widest">
                Credencial de Acceso & Facturación
              </span>
              <h3 className="text-sm font-black text-white mt-0.5">Registrar Administrador & Empresa Operadora</h3>
            </div>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Tipo de Administrador */}
          <div className="flex items-center gap-2 p-1 bg-[#07090e] rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTipoPersona('juridica')}
              className={`flex-1 py-1.5 rounded-lg font-mono font-bold transition text-xs cursor-pointer ${
                tipoPersona === 'juridica'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Persona Jurídica (Empresa de Administración)
            </button>
            <button
              type="button"
              onClick={() => setTipoPersona('natural')}
              className={`flex-1 py-1.5 rounded-lg font-mono font-bold transition text-xs cursor-pointer ${
                tipoPersona === 'natural'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Persona Natural (Admin Independiente)
            </button>
          </div>

          {/* Bloque: Datos Corporativos / Tributarios */}
          <div className="bg-[#07090e] border border-slate-800 p-4 rounded-2xl space-y-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> Información Corporativa & Fiscal
            </span>

            {tipoPersona === 'juridica' && (
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Nombre o Razón Social de la Empresa</label>
                <input
                  type="text"
                  placeholder="Ej. Inmobiliaria & Gestión de Copropiedades S.A.S."
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400"
                  required={tipoPersona === 'juridica'}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  {tipoPersona === 'juridica' ? 'NIT de la Empresa' : 'Cédula / NIT'}
                </label>
                <input
                  type="text"
                  placeholder="Ej. 901452890"
                  value={nitEmpresa}
                  onChange={(e) => setNitEmpresa(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-cyan-300 font-mono rounded-xl outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">DV</label>
                <input
                  type="text"
                  maxLength={1}
                  value={dv}
                  onChange={(e) => setDv(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-center text-white font-mono rounded-xl outline-none focus:border-cyan-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Teléfono Corporativo / WhatsApp</label>
              <input
                type="text"
                placeholder="Ej. 310 450 8899"
                value={telefonoCorporativo}
                onChange={(e) => setTelefonoCorporativo(e.target.value)}
                className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-white font-mono rounded-xl outline-none focus:border-cyan-400"
                required
              />
            </div>
          </div>

          {/* Bloque: Datos de la Persona y Credenciales de Acceso */}
          <div className="bg-[#07090e] border border-slate-800 p-4 rounded-2xl space-y-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Credenciales de Inicio de Sesión
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Nombre del Administrador / Delegado</label>
                <input
                  type="text"
                  placeholder="Ej. Carlos Mario Pineda"
                  value={nombreRepresentante}
                  onChange={(e) => setNombreRepresentante(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Cédula de Ciudadanía</label>
                <input
                  type="text"
                  placeholder="Ej. 71.390.412"
                  value={cedulaRepresentante}
                  onChange={(e) => setCedulaRepresentante(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-white font-mono rounded-xl outline-none focus:border-cyan-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Correo Electrónico (Será su Usuario)</label>
              <input
                type="email"
                placeholder="carlos@administracionespineda.com"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-cyan-300 font-mono rounded-xl outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Contraseña de Acceso</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={passwordLogin}
                onChange={(e) => setPasswordLogin(e.target.value)}
                className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-white font-mono rounded-xl outline-none focus:border-cyan-400"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Asignar a Copropiedad Inicial</label>
              <select
                value={copropiedadAsignada}
                onChange={(e) => setCopropiedadAsignada(e.target.value)}
                className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-cyan-300 font-mono rounded-xl outline-none cursor-pointer"
              >
                <option value="">-- Sin copropiedad asignada (Asignar luego) --</option>
                {copropiedadesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold font-mono transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 py-3 rounded-xl font-black font-mono transition cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              {guardando ? 'Guardando en Base de Datos...' : 'Registrar Administrador'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
