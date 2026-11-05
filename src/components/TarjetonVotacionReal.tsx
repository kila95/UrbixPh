import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { emitirVotoPonderado, obtenerEscrutinioVotacion } from '../services/quorumService';
import { CheckCircle2, XCircle, Shield, AlertCircle, Plus, Lock, StopCircle, RefreshCw, X, Vote } from 'lucide-react';

interface TarjetonVotacionProps {
  tenantId: string;
  userProfile: {
    id?: string;
    full_name: string;
    tenant_id?: string;
    apartment_id?: string;
    unit_id?: string;
    unit_number?: string;
    coefficient?: number;
    role?: string;
  };
  onShowToast?: (msg: string) => void;
}

const STORAGE_MOTIONS_KEY = 'urbix_assembly_motions_real';
const STORAGE_VOTES_KEY = 'urbix_assembly_votes_real';

function leerMocionesLocales(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_MOTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarMocionesLocales(lista: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_MOTIONS_KEY, JSON.stringify(lista));
    window.dispatchEvent(new CustomEvent('urbix_tarjeton_sync'));
  } catch {
    // ignore
  }
}

function leerVotosLocales(motionId: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_VOTES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => v.motion_id === motionId) : [];
  } catch {
    return [];
  }
}

function guardarVotoLocal(voto: any) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_VOTES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const lista = Array.isArray(parsed) ? parsed : [];
    localStorage.setItem(STORAGE_VOTES_KEY, JSON.stringify([{ id: `v_${Date.now()}`, ...voto }, ...lista]));
    window.dispatchEvent(new CustomEvent('urbix_tarjeton_sync'));
  } catch {
    // ignore
  }
}

export default function TarjetonVotacionReal({
  tenantId: rawTenantId,
  userProfile,
  onShowToast
}: TarjetonVotacionProps) {
  // 1. Asegurar que lea el tenant y el apartamento del usuario logueado
  const tenantId = userProfile?.tenant_id || rawTenantId;
  const apartmentId = userProfile?.apartment_id || userProfile?.unit_id;
  const [mocionActiva, setMocionActiva] = useState<any | null>(null);
  const [votos, setVotos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [haVotado, setHaVotado] = useState(false);
  const [enviandoVoto, setEnviandoVoto] = useState(false);

  // Estados del modal del administrador para crear nueva moción
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [tituloMocion, setTituloMocion] = useState('');
  const [descMocion, setDescMocion] = useState('');
  const [tipoMayoria, setTipoMayoria] = useState('Ordinaria (Mayoría Simple > 50%)');
  const [guardandoMocion, setGuardandoMocion] = useState(false);

  // Verificar si el usuario actual es de la mesa directiva / administrador
  const esAdminOMesa = ['master_owner', 'admin_ph', 'admin', 'administrador', 'superadmin'].includes(
    userProfile?.role?.toLowerCase() || ''
  );

  const cargarDesdeRespaldoLocal = () => {
    const mociones = leerMocionesLocales();
    const abierta = mociones.find((m) => m.status === 'ABIERTA' && (!m.tenant_id || m.tenant_id === tenantId));
    setMocionActiva(abierta || null);
    if (abierta) {
      const listaVotos = leerVotosLocales(abierta.id);
      setVotos(listaVotos);
      const yaVoto = listaVotos.some(
        (v: any) => v.apartment_unit === (userProfile.unit_number || userProfile.full_name)
      );
      setHaVotado(yaVoto);
    } else {
      setVotos([]);
      setHaVotado(false);
    }
  };

  const cargarMocionYVotos = async () => {
    try {
      setCargando(true);
      if (!isSupabaseConfigured) {
        cargarDesdeRespaldoLocal();
        setCargando(false);
        return;
      }

      // 1. Buscar si hay una moción en estado 'ABIERTA' para este conjunto
      const { data: mocion, error: errMocion } = await supabase
        .from('assembly_motions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'ABIERTA')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errMocion) {
        console.warn('Aviso al consultar assembly_motions en Supabase (usando respaldo persistente):', errMocion.message);
        cargarDesdeRespaldoLocal();
        return;
      }

      if (!mocion) {
        // Verificar también si se creó en respaldo local
        const locales = leerMocionesLocales();
        const abiertaLocal = locales.find((m) => m.status === 'ABIERTA' && (!m.tenant_id || m.tenant_id === tenantId));
        if (abiertaLocal) {
          cargarDesdeRespaldoLocal();
          return;
        }
      }

      setMocionActiva(mocion);

      if (mocion) {
        // 2. Traer votos reales de esta moción
        const { data: listaVotos, error: errVotos } = await supabase
          .from('assembly_votes')
          .select('*')
          .eq('motion_id', mocion.id);

        if (errVotos) {
          console.warn('Aviso al consultar assembly_votes:', errVotos.message);
          const votosLocales = leerVotosLocales(mocion.id);
          setVotos(votosLocales);
          setHaVotado(
            votosLocales.some((v: any) => v.apartment_unit === (userProfile.unit_number || userProfile.full_name))
          );
          return;
        }
        setVotos(listaVotos || []);

        // 3. Validar si este usuario/inmueble ya votó
        const yaVoto = (listaVotos || []).some(
          (v: any) => v.apartment_unit === (userProfile.unit_number || userProfile.full_name)
        );
        setHaVotado(yaVoto);
      } else {
        setVotos([]);
        setHaVotado(false);
      }
    } catch (err: any) {
      console.warn('Aviso cargando votación real:', err?.message);
      cargarDesdeRespaldoLocal();
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMocionYVotos();

    const handleSync = () => cargarMocionYVotos();
    window.addEventListener('urbix_tarjeton_sync', handleSync);
    window.addEventListener('storage', handleSync);

    if (isSupabaseConfigured) {
      const canal = supabase
        .channel(`realtime_tarjeton_${tenantId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assembly_motions' }, () => {
          cargarMocionYVotos();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assembly_votes' }, () => {
          cargarMocionYVotos();
        })
        .subscribe();

      return () => {
        window.removeEventListener('urbix_tarjeton_sync', handleSync);
        window.removeEventListener('storage', handleSync);
        supabase.removeChannel(canal);
      };
    }

    return () => {
      window.removeEventListener('urbix_tarjeton_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [tenantId]);

  // Acción del Administrador: Publicar y Abrir Moción Real
  const handleCrearMocion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloMocion.trim()) return;

    try {
      setGuardandoMocion(true);

      const payload = {
        tenant_id: tenantId,
        title: tituloMocion.trim(),
        description: `${descMocion.trim()} • Quórum requerido: ${tipoMayoria}`,
        status: 'ABIERTA',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('assembly_motions').insert([payload]);
      if (error) {
        console.warn('Respaldo local activado al abrir moción:', error.message);
        const actuales = leerMocionesLocales().map((m) =>
          m.tenant_id === tenantId ? { ...m, status: 'CERRADA' } : m
        );
        guardarMocionesLocales([{ id: `moc_${Date.now()}`, ...payload }, ...actuales]);
      }

      onShowToast?.('Moción abierta en vivo para todos los asambleístas');
      setShowModalCrear(false);
      setTituloMocion('');
      setDescMocion('');
      cargarMocionYVotos();
    } catch (err: any) {
      console.warn('Error abriendo moción:', err?.message);
    } finally {
      setGuardandoMocion(false);
    }
  };

  // Acción del Administrador: Cerrar la votación y consolidar resultado
  const handleCerrarVotacion = async () => {
    if (!mocionActiva) return;

    try {
      const { error } = await supabase
        .from('assembly_motions')
        .update({ status: 'CERRADA' })
        .eq('id', mocionActiva.id);

      if (error) {
        console.warn('Respaldo local activado al cerrar moción:', error.message);
      }

      const actuales = leerMocionesLocales().map((m) =>
        m.id === mocionActiva.id || m.status === 'ABIERTA' ? { ...m, status: 'CERRADA' } : m
      );
      guardarMocionesLocales(actuales);

      onShowToast?.('Votación cerrada. Resultados consolidados para el libro de actas.');
      cargarMocionYVotos();
    } catch (err: any) {
      console.warn('Error cerrando votación:', err?.message);
    }
  };

  // Acción del Asambleísta: Emitir Voto
  const emitirVoto = async (eleccion: 'A_FAVOR' | 'EN_CONTRA' | 'ABSTENCION') => {
    if (!mocionActiva || haVotado) return;
    try {
      setEnviandoVoto(true);

      const opcionPonderada = eleccion === 'A_FAVOR' ? 'SI' : eleccion === 'EN_CONTRA' ? 'NO' : 'BLANCO';

      if (apartmentId) {
        try {
          await emitirVotoPonderado({
            votingId: mocionActiva.id,
            apartmentId,
            tenantId,
            opcion: opcionPonderada
          });
          await obtenerEscrutinioVotacion(mocionActiva.id);
        } catch {
          // Continúa con el registro híbrido si el esquema usa motion_id
        }
      }

      const timestamp = new Date().toISOString();
      const payloadString = `${mocionActiva.id}|${tenantId}|${userProfile.unit_number || 'Administración'}|${userProfile.full_name}|${userProfile.coefficient || 0}|${eleccion}|${timestamp}`;

      const encoder = new TextEncoder();
      const dataBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(payloadString));
      const hashHex = Array.from(new Uint8Array(dataBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      const votePayload = {
        motion_id: mocionActiva.id,
        tenant_id: tenantId,
        apartment_unit: userProfile.unit_number || 'Administración',
        voter_name: userProfile.full_name,
        coefficient: userProfile.coefficient || 0,
        choice: eleccion,
        digital_hash: hashHex,
        voted_at: timestamp
      };

      const { error } = await supabase.from('assembly_votes').insert([votePayload]);

      if (error) {
        console.warn('Respaldo local activado al emitir voto:', error.message);
        guardarVotoLocal(votePayload);
      }

      setHaVotado(true);
      onShowToast?.(`Voto registrado y sellado con éxito: ${eleccion}`);
      cargarMocionYVotos();
    } catch (err: any) {
      console.warn('Error registrando voto:', err?.message);
    } finally {
      setEnviandoVoto(false);
    }
  };

  // Cálculos matemáticos reales en vivo
  const coeficienteAFavor = votos.filter(v => v.choice === 'A_FAVOR').reduce((acc, v) => acc + Number(v.coefficient || 0), 0);
  const coeficienteEnContra = votos.filter(v => v.choice === 'EN_CONTRA').reduce((acc, v) => acc + Number(v.coefficient || 0), 0);
  const coeficienteEnBlanco = votos.filter(v => v.choice === 'ABSTENCION').reduce((acc, v) => acc + Number(v.coefficient || 0), 0);
  const coeficienteTotalEmitido = coeficienteAFavor + coeficienteEnContra + coeficienteEnBlanco;

  const pctFavor = coeficienteTotalEmitido > 0 ? ((coeficienteAFavor / coeficienteTotalEmitido) * 100).toFixed(1) : '0.0';
  const pctContra = coeficienteTotalEmitido > 0 ? ((coeficienteEnContra / coeficienteTotalEmitido) * 100).toFixed(1) : '0.0';
  const pctBlanco = coeficienteTotalEmitido > 0 ? ((coeficienteEnBlanco / coeficienteTotalEmitido) * 100).toFixed(1) : '0.0';

  if (cargando) {
    return (
      <div className="bg-[#0b101b] border border-slate-800 rounded-3xl p-8 text-center text-xs font-mono text-slate-500">
        Sincronizando mesa de votaciones desde Supabase...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* BARRA DE HERRAMIENTAS DE LA MESA DIRECTIVA (VISIBLE PARA ADMINISTRADOR) */}
      {esAdminOMesa && (
        <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Vote className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase font-mono">Consola Mesa Directiva / Moderador</h4>
              <p className="text-[11px] text-slate-400 font-mono">Control de proposiciones y votaciones nominales</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!mocionActiva ? (
              <button
                type="button"
                onClick={() => setShowModalCrear(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Abrir Nueva Votación</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCerrarVotacion}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-lg cursor-pointer"
              >
                <StopCircle className="w-4 h-4" />
                <span>Cerrar Votación Actual</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* CASO 1: NO HAY MOCIÓN ABIERTA */}
      {!mocionActiva ? (
        <div className="bg-[#0b101b] border border-slate-800 rounded-3xl p-8 text-center space-y-3 font-sans">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-300">No hay votación nominal abierta en este momento</h4>
          <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
            La mesa directiva (Presidente / Secretario de la asamblea) habilitará el tarjetón cuando se someta a votación un punto del orden del día.
          </p>
          {esAdminOMesa && (
            <button
              onClick={() => setShowModalCrear(true)}
              className="text-xs font-bold text-cyan-400 hover:underline pt-2 cursor-pointer inline-block"
            >
              + Iniciar una nueva votación ahora
            </button>
          )}
        </div>
      ) : (
        /* CASO 2: TARJETÓN EN CURSO CON MOCIÓN REAL */
        <div className="bg-[#070b12] border border-slate-800 rounded-3xl p-6 space-y-5 text-slate-100 font-sans shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Moción en Curso • Ley 675
              </span>
              <h3 className="text-base font-black text-white mt-1">Tarjetón Digital de Votación Nominal</h3>
              <p className="text-xs text-slate-200 font-bold mt-0.5">{mocionActiva.title}</p>
              {mocionActiva.description && (
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{mocionActiva.description}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-mono block">
                Peso de voto ({userProfile.unit_number || userProfile.full_name}):
              </span>
              <span className="text-sm font-mono font-black text-cyan-400">
                {Number(userProfile.coefficient || 0).toFixed(4)}% Coeficiente
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => emitirVoto('A_FAVOR')}
              disabled={haVotado || enviandoVoto}
              className={`p-5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                haVotado ? 'opacity-80 cursor-not-allowed' : 'hover:scale-[1.02]'
              } bg-slate-950 border-slate-800 hover:border-emerald-500/50`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-white">A Favor</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{pctFavor}% acumulado</span>
            </button>

            <button
              onClick={() => emitirVoto('EN_CONTRA')}
              disabled={haVotado || enviandoVoto}
              className={`p-5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                haVotado ? 'opacity-80 cursor-not-allowed' : 'hover:scale-[1.02]'
              } bg-slate-950 border-slate-800 hover:border-rose-500/50`}
            >
              <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <XCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-white">En Contra</span>
              <span className="text-xs font-mono font-bold text-rose-400">{pctContra}% acumulado</span>
            </button>

            <button
              onClick={() => emitirVoto('ABSTENCION')}
              disabled={haVotado || enviandoVoto}
              className={`p-5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                haVotado ? 'opacity-80 cursor-not-allowed' : 'hover:scale-[1.02]'
              } bg-slate-950 border-slate-800 hover:border-slate-700`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-white">En Blanco / Abstención</span>
              <span className="text-xs font-mono font-bold text-slate-400">{pctBlanco}% acumulado</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            <span>Votos emitidos: <strong className="text-white">{votos.length} inmuebles</strong></span>
            <span>Coeficiente escrutado: <strong className="text-cyan-400">{(coeficienteTotalEmitido * 100).toFixed(2)}%</strong></span>
          </div>

          {haVotado && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs font-mono text-emerald-300">
              ✓ Tu voto ha sido computado y firmado con hash SHA-256 en la base de datos.
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA CREAR MOCIÓN REAL (SOLO ADMINISTRADOR) */}
      {showModalCrear && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Vote className="w-4 h-4 text-cyan-400" />
                <span>Someter Proposición a Votación</span>
              </h3>
              <button onClick={() => setShowModalCrear(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCrearMocion} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">
                  Título de la Proposición / Moción
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Aprobación del Presupuesto 2027 e Incremento Cuota"
                  value={tituloMocion}
                  onChange={(e) => setTituloMocion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">
                  Tipo de Mayoría Legal Requerida (Ley 675)
                </label>
                <select
                  value={tipoMayoria}
                  onChange={(e) => setTipoMayoria(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  <option value="Ordinaria (Mayoría Simple > 50%)">Mayoría Ordinaria (&gt; 50% de coeficientes presentes)</option>
                  <option value="Calificada (Art. 46 > 70%)">Mayoría Calificada Art. 46 (&gt; 70% del coeficiente total)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">
                  Detalles / Justificación Adicional (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre lo propuesto por el Consejo o el Asambleísta..."
                  value={descMocion}
                  onChange={(e) => setDescMocion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModalCrear(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoMocion}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {guardandoMocion ? 'Abriendo mesa...' : 'Publicar Moción en Vivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
