import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Building2, Users, RefreshCw, FileText } from 'lucide-react';
import { supabase } from '../supabaseClient';

const DEFAULT_SOLICITUDES = [
  {
    id: 'prereg-01',
    company_name: 'Reformas & Acabados S.A.S.',
    nit: '900.123.456-7',
    contact_name: 'Ing. Carlos Ruiz',
    contact_phone: '300 456 7890',
    target_unit: 'Torre 1 - 302',
    arl_provider: 'ARL SURA',
    pila_coverage_expires: '2026-11-25',
    status: 'pendiente',
    workers_data: [
      { full_name: 'Andrés Morales', document_id: '1.037.492.102', eps_name: 'SURA EPS', blood_type: 'O+', requires_heights_cert: true },
      { full_name: 'Mario Soto', document_id: '1.037.888.999', eps_name: 'Nueva EPS', blood_type: 'A+', requires_heights_cert: false }
    ]
  },
  {
    id: 'prereg-02',
    company_name: 'Impermeabilizaciones El Poblado',
    nit: '800.554.112-9',
    contact_name: 'Hernán Gómez',
    contact_phone: '311 890 1234',
    target_unit: 'Cubierta Torre 2',
    arl_provider: 'ARL Positiva',
    pila_coverage_expires: '2026-11-30',
    status: 'pendiente',
    workers_data: [
      { full_name: 'Jhon Jairo Arango', document_id: '71.594.203', eps_name: 'Compensar EPS', blood_type: 'O+', requires_heights_cert: true }
    ]
  }
];

export const BandejaPreRegistrosAdmin: React.FC<{ onShowToast?: (msg: string) => void }> = ({ onShowToast }) => {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('contractor_preregistrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setSolicitudes(DEFAULT_SOLICITUDES);
      } else {
        setSolicitudes(data);
      }
    } catch (err: any) {
      console.warn('Usando solicitudes de pre-registro de prueba:', err.message);
      setSolicitudes(DEFAULT_SOLICITUDES);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  // Al pulsar Aprobar: la empresa se crea en contractor_companies y los operarios en contractor_workers
  const handleAprobarSolicitud = async (solicitud: any) => {
    try {
      // 1. Insertar empresa en Supabase
      const { data: compData, error: compErr } = await supabase
        .from('contractor_companies')
        .insert([{
          tenant_id: solicitud.tenant_id,
          company_name: solicitud.company_name,
          nit: solicitud.nit,
          arl_provider: solicitud.arl_provider,
          contact_person: solicitud.contact_name,
          phone: solicitud.contact_phone
        }])
        .select('id')
        .single();

      const companyId = compData?.id || `comp-${Date.now()}`;

      // 2. Insertar operarios asociados
      const workers = (solicitud.workers_data || []).map((w: any) => ({
        company_id: companyId,
        tenant_id: solicitud.tenant_id,
        full_name: w.full_name,
        document_id: w.document_id,
        eps_name: w.eps_name || 'EPS Sura',
        arl_name: solicitud.arl_provider,
        arl_coverage_expires: solicitud.pila_coverage_expires,
        requires_heights_cert: Boolean(w.requires_heights_cert),
        blood_type: w.blood_type || 'O+'
      }));

      if (workers.length > 0) {
        await supabase.from('contractor_workers').insert(workers);
      }

      // 3. Marcar solicitud como aprobada
      await supabase
        .from('contractor_preregistrations')
        .update({ status: 'aprobado', reviewed_at: new Date().toISOString() })
        .eq('id', solicitud.id);

      setSolicitudes(prev => prev.map(s => s.id === solicitud.id ? { ...s, status: 'aprobado' } : s));
      onShowToast?.(`Empresa ${solicitud.company_name} y ${workers.length} técnicos habilitados en Garita.`);
    } catch (err: any) {
      console.warn('Aprobado localmente:', err.message);
      setSolicitudes(prev => prev.map(s => s.id === solicitud.id ? { ...s, status: 'aprobado' } : s));
      onShowToast?.(`Empresa ${solicitud.company_name} habilitada en Garita.`);
    }
  };

  const handleRechazarSolicitud = async (id: string) => {
    const motivo = window.prompt('Indica el motivo del rechazo (ej. Planilla no legible o ARL vencida):');
    if (!motivo) return;

    try {
      await supabase
        .from('contractor_preregistrations')
        .update({ status: 'rechazado', rejection_reason: motivo, reviewed_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err: any) {
      console.warn('Rechazado localmente:', err.message);
    }

    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, status: 'rechazado', rejection_reason: motivo } : s));
    onShowToast?.('Solicitud rechazada.');
  };

  return (
    <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-slate-100 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Bandeja de Pre-registros Radicados por Contratistas
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Revisa las solicitudes radicadas desde el enlace público antes de habilitar el ingreso en portería.
          </p>
        </div>
        <button 
          onClick={cargarSolicitudes} 
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 cursor-pointer transition"
          title="Refrescar solicitudes"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {solicitudes.length === 0 ? (
        <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
          No hay solicitudes pendientes de pre-registro. Comparte el enlace público para que los contratistas radiquen sus datos.
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudes.map((sol) => (
            <div key={sol.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm font-mono">{sol.company_name}</span>
                  <span className="text-xs font-mono text-slate-400">(NIT: {sol.nit})</span>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                    sol.status === 'aprobado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    sol.status === 'rechazado' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {sol.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  Destino: <strong className="text-cyan-400">{sol.target_unit}</strong> • ARL: {sol.arl_provider} • Vence Cobertura: <strong className="text-white">{sol.pila_coverage_expires}</strong>
                </p>
                <div className="text-[11px] text-slate-400 font-mono">
                  Operarios declarados ({sol.workers_data?.length || 0}): {(sol.workers_data || []).map((w: any) => `${w.full_name} (${w.document_id})`).join(', ')}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {sol.pila_document_url && (
                  <a
                    href={sol.pila_document_url.startsWith('http') ? sol.pila_document_url : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!sol.pila_document_url.startsWith('http')) {
                        e.preventDefault();
                        alert(`Soporte PDF de Planilla PILA: ${sol.pila_document_url.replace('local://', '')}`);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono font-bold transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ver Planilla (PDF)</span>
                  </a>
                )}

                {sol.status === 'pendiente' && (
                  <>
                    <button
                      onClick={() => handleRechazarSolicitud(sol.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rechazar
                    </button>

                    <button
                      onClick={() => handleAprobarSolicitud(sol)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs font-mono transition cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar y Habilitar Garita
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BandejaPreRegistrosAdmin;
