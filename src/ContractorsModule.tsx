import React, { useState, useEffect } from 'react';
import { 
  HardHat, ShieldCheck, ShieldAlert, Users, Plus, 
  Search, RefreshCw, X, Link, ExternalLink, FileText, 
  CheckCircle2, XCircle, AlertTriangle, Building2, Clock
} from 'lucide-react';
import { supabase } from './supabaseClient';

interface Props {
  tenantId?: string;
  tenantName?: string;
  onShowToast?: (msg: string) => void;
}

export default function ContractorsModule({ tenantId, onShowToast }: Props) {
  // Pestañas internas del módulo
  const [subTab, setSubTab] = useState<'preregistro' | 'operarios' | 'empresas'>('preregistro');
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // 1. Estados de Pre-registros radicados (con PDF)
  const [solicitudes, setSolicitudes] = useState<any[]>([]);

  // 2. Estados de Operarios y SG-SST
  const [operarios, setOperarios] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);

  // 3. Modales
  const [modalOperario, setModalOperario] = useState(false);
  const [modalEmpresa, setModalEmpresa] = useState(false);

  // Formulario nuevo operario manual
  const [empresaIdSel, setEmpresaIdSel] = useState('');
  const [nombreOp, setNombreOp] = useState('');
  const [cedulaOp, setCedulaOp] = useState('');
  const [epsOp, setEpsOp] = useState('SURA EPS');
  const [arlOp, setArlOp] = useState('ARL SURA');
  const [venceArlOp, setVenceArlOp] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [reqAlturas, setReqAlturas] = useState(false);
  const [venceAlturas, setVenceAlturas] = useState('');
  const [reqConfinados, setReqConfinados] = useState(false);
  const [reqElectrico, setReqElectrico] = useState(false);
  const [rhOp, setRhOp] = useState('O+');
  const [guardando, setGuardando] = useState(false);

  // Formulario nueva empresa manual
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [nitEmpresa, setNitEmpresa] = useState('');
  const [contactoEmpresa, setContactoEmpresa] = useState('');
  const [telEmpresa, setTelEmpresa] = useState('');

  // Carga consolidada de datos reales desde Supabase
  const cargarTodo = async () => {
    try {
      setCargando(true);

      // Cargar Pre-registros
      const { data: dataPre } = await supabase
        .from('contractor_preregistrations')
        .select('*')
        .order('created_at', { ascending: false });
      setSolicitudes(dataPre || []);

      // Cargar Empresas
      const { data: dataEmp } = await supabase
        .from('contractor_companies')
        .select('*')
        .order('company_name', { ascending: true });
      setEmpresas(dataEmp || []);
      if (dataEmp && dataEmp.length > 0 && !empresaIdSel) {
        setEmpresaIdSel(dataEmp[0].id);
      }

      // Cargar Operarios
      const { data: dataOp } = await supabase
        .from('contractor_workers')
        .select('*, contractor_companies(company_name)')
        .order('created_at', { ascending: false });
      setOperarios(dataOp || []);

    } catch (e: any) {
      console.error('Error cargando contratistas:', e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, [tenantId]);

  // Copiar link público al portapapeles
  const copiarEnlacePublico = () => {
    const url = `${window.location.origin}/registro-contratista`;
    navigator.clipboard.writeText(url);
    onShowToast?.('Enlace público copiado para compartir por WhatsApp al contratista');
  };

  // Semáforo legal de ARL
  const getSemaforoARL = (vence: string, reqAlt: boolean, venceAlt?: string) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVence = new Date(vence);
    const dias = Math.ceil((fechaVence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (dias < 0) {
      return { estado: 'VENCIDO', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', texto: 'Planilla ARL Vencida' };
    }
    if (reqAlt && venceAlt && new Date(venceAlt) < hoy) {
      return { estado: 'ALTURAS_VENCIDO', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', texto: 'Curso Alturas Vencido' };
    }
    if (dias <= 5) {
      return { estado: 'POR_VENCER', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', texto: `Vence en ${dias} días` };
    }
    return { estado: 'VIGENTE', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', texto: `Vigente (${dias} días)` };
  };

  // Acción: Aprobar Pre-registro
  const handleAprobarSolicitud = async (sol: any) => {
    try {
      // 1. Crear empresa si no existe
      const { data: compData, error: compErr } = await supabase
        .from('contractor_companies')
        .insert([{
          tenant_id: sol.tenant_id,
          company_name: sol.company_name,
          nit: sol.nit,
          arl_provider: sol.arl_provider,
          contact_person: sol.contact_name,
          phone: sol.contact_phone
        }])
        .select('id')
        .single();

      if (compErr) throw compErr;

      // 2. Crear operarios asociados
      const workers = (sol.workers_data || []).map((w: any) => ({
        company_id: compData.id,
        tenant_id: sol.tenant_id,
        full_name: w.full_name,
        document_id: w.document_id,
        eps_name: w.eps_name || 'EPS Sura',
        arl_name: sol.arl_provider,
        arl_coverage_expires: sol.pila_coverage_expires,
        requires_heights_cert: Boolean(w.requires_heights_cert),
        blood_type: w.blood_type || 'O+'
      }));

      if (workers.length > 0) {
        const { error: wErr } = await supabase.from('contractor_workers').insert(workers);
        if (wErr) throw wErr;
      }

      // 3. Marcar como aprobado
      await supabase
        .from('contractor_preregistrations')
        .update({ status: 'aprobado', reviewed_at: new Date().toISOString() })
        .eq('id', sol.id);

      onShowToast?.(`Empresa ${sol.company_name} y operarios habilitados en garita`);
      cargarTodo();
    } catch (err: any) {
      alert('Error aprobando pre-registro: ' + err.message);
    }
  };

  // Acción: Guardar técnico manual
  const handleGuardarOperario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreOp.trim() || !cedulaOp.trim() || !empresaIdSel) return;

    try {
      setGuardando(true);
      const { error } = await supabase.from('contractor_workers').insert([{
        company_id: empresaIdSel,
        full_name: nombreOp.trim(),
        document_id: cedulaOp.trim(),
        eps_name: epsOp,
        arl_name: arlOp,
        arl_coverage_expires: venceArlOp,
        requires_heights_cert: reqAlturas,
        heights_cert_expires: reqAlturas ? venceAlturas : null,
        requires_confined_spaces: reqConfinados,
        requires_electrical_risk: reqElectrico,
        blood_type: rhOp
      }]);

      if (error) throw error;
      onShowToast?.(`Técnico ${nombreOp} registrado con control SG-SST`);
      setModalOperario(false);
      setNombreOp('');
      setCedulaOp('');
      cargarTodo();
    } catch (err: any) {
      alert('Error guardando operario: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Acción: Guardar empresa manual
  const handleGuardarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreEmpresa.trim() || !nitEmpresa.trim()) return;

    try {
      setGuardando(true);
      let activeTenant = tenantId;
      if (!activeTenant) {
        const { data: t } = await supabase.from('tenants').select('id').limit(1).single();
        activeTenant = t?.id;
      }

      const { error } = await supabase.from('contractor_companies').insert([{
        tenant_id: activeTenant,
        company_name: nombreEmpresa.trim(),
        nit: nitEmpresa.trim(),
        arl_provider: 'ARL SURA',
        contact_person: contactoEmpresa.trim(),
        phone: telEmpresa.trim()
      }]);

      if (error) throw error;
      onShowToast?.(`Empresa contratista registrada`);
      setModalEmpresa(false);
      setNombreEmpresa('');
      setNitEmpresa('');
      cargarTodo();
    } catch (err: any) {
      alert('Error guardando empresa: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Filtros de búsqueda
  const operariosFiltrados = operarios.filter(o => 
    o.full_name?.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.document_id?.includes(busqueda) ||
    o.contractor_companies?.company_name?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* 1. CABECERA INSTITUCIONAL */}
      <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
              MÓDULO DE SEGURIDAD OPERATIVA • SG-SST
            </span>
            <span className="text-xs text-slate-400 font-mono">Resolución 0312 & Decreto 1072</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-cyan-400" />
            Contratistas, Planillas ARL & Personal Técnico
          </h2>
          <p className="text-xs text-slate-400">
            Supervisión legal de empresas prestadoras de servicio, verificación de pólizas y control de ingreso en portería.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={copiarEnlacePublico}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            <Link className="w-3.5 h-3.5" />
            <span>Copiar Link Pre-registro</span>
          </button>

          <button
            onClick={cargarTodo}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => setModalOperario(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-cyan-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Técnico</span>
          </button>
        </div>
      </div>

      {/* 2. SUBBARRA DE PESTAÑAS (Enterprise Tabs) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F172A] border border-slate-800 p-2 rounded-2xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSubTab('preregistro')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              subTab === 'preregistro'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pre-registros Radicados ({solicitudes.length})</span>
          </button>

          <button
            onClick={() => setSubTab('operarios')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              subTab === 'operarios'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Técnicos & ARL ({operarios.length})</span>
          </button>

          <button
            onClick={() => setSubTab('empresas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              subTab === 'empresas'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Empresas Contratistas ({empresas.length})</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="flex items-center gap-2 bg-[#1E293B] border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar técnico, cédula o empresa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent border-none text-white focus:outline-none placeholder-slate-500 w-48 font-sans"
          />
        </div>
      </div>

      {/* 3. VISTA 1: BANDEJA DE PRE-REGISTROS RADICADOS (CON PDF) */}
      {subTab === 'preregistro' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Solicitudes de Ingreso Radicadas por Contratistas
              </h3>
              <p className="text-xs text-slate-400">
                Audita el PDF de la planilla PILA antes de dar clic en habilitar acceso en portería.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {solicitudes.filter(s => s.status === 'pendiente').length} Pendientes
            </span>
          </div>

          {cargando ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              Consultando solicitudes radicadas...
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
              No hay solicitudes radicadas. Comparte el enlace para que los contratistas adjunten sus documentos.
            </div>
          ) : (
            <div className="space-y-3">
              {solicitudes.map((sol) => (
                <div 
                  key={sol.id} 
                  className="p-4 bg-[#1E293B]/70 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white text-sm">{sol.company_name}</span>
                      <span className="text-xs font-mono text-slate-400">NIT: {sol.nit}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        sol.status === 'aprobado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        sol.status === 'rechazado' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {sol.status?.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans">
                      Lugar: <strong className="text-cyan-400 font-mono">{sol.target_unit}</strong> • ARL: {sol.arl_provider} • Vigencia: <strong className="text-white font-mono">{sol.pila_coverage_expires}</strong>
                    </p>

                    <div className="text-[11px] font-mono text-slate-400">
                      Operarios ({sol.workers_data?.length || 0}): {(sol.workers_data || []).map((w: any) => `${w.full_name} (${w.document_id})`).join(' • ')}
                    </div>
                  </div>

                  {/* Acciones & Visualizador de PDF */}
                  <div className="flex items-center gap-2 shrink-0">
                    {sol.pila_document_url && (
                      <a
                        href={sol.pila_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ver PDF Planilla</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    )}

                    {sol.status === 'pendiente' && (
                      <button
                        onClick={() => handleAprobarSolicitud(sol)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprobar & Habilitar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. VISTA 2: LISTA DE OPERARIOS CON SEMÁFORO LEGAL ARL */}
      {subTab === 'operarios' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Personal Técnico Habilitado en Garita
              </h3>
              <p className="text-xs text-slate-400">
                Semáforo en tiempo real de cobertura ARL y cursos de alturas.
              </p>
            </div>
            <button
              onClick={() => setModalOperario(true)}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar técnico
            </button>
          </div>

          {cargando ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              Verificando vigencia de planillas...
            </div>
          ) : operariosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
              No hay operarios registrados. Agrega uno o aprueba una solicitud radicada.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operariosFiltrados.map((op) => {
                const semaforo = getSemaforoARL(op.arl_coverage_expires, op.requires_heights_cert, op.heights_cert_expires);
                return (
                  <div 
                    key={op.id}
                    className="bg-[#1E293B] border border-slate-700/80 hover:border-slate-600 p-5 rounded-2xl flex flex-col justify-between space-y-3.5 transition"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 truncate max-w-[200px]">
                          {op.contractor_companies?.company_name || 'Contratista Independiente'}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${semaforo.badge}`}>
                          {semaforo.texto}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-sm">{op.full_name}</h4>
                        <p className="text-xs font-mono text-cyan-400 mt-0.5">
                          C.C. {op.document_id} • RH: {op.blood_type || 'O+'}
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[11px] font-mono space-y-1 text-slate-400">
                        <div className="flex justify-between">
                          <span>ARL / EPS:</span>
                          <span className="text-slate-200">{op.arl_name} / {op.eps_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vence Planilla:</span>
                          <span className="text-white">{op.arl_coverage_expires}</span>
                        </div>
                      </div>

                      {/* Tags de alto riesgo */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {op.requires_heights_cert && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                            🧗 Alturas ({op.heights_cert_expires || 'N/A'})
                          </span>
                        )}
                        {op.requires_confined_spaces && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                            🕳️ Confinados
                          </span>
                        )}
                        {op.requires_electrical_risk && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 font-bold">
                            ⚡ Riesgo Eléctrico
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500">Acceso Garita:</span>
                      <span className={semaforo.estado === 'VIGENTE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {semaforo.estado === 'VIGENTE' ? 'HABILITADO' : 'RESTRINGIDO'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. VISTA 3: EMPRESAS CONTRATISTAS */}
      {subTab === 'empresas' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Directorio Oficial de Empresas Contratistas
              </h3>
              <p className="text-xs text-slate-400">
                Empresas prestadoras de servicios avaladas para ingresar a la copropiedad.
              </p>
            </div>
            <button
              onClick={() => setModalEmpresa(true)}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Empresa
            </button>
          </div>

          {empresas.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
              No hay empresas registradas aún.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {empresas.map((emp) => (
                <div key={emp.id} className="p-4 bg-[#1E293B] border border-slate-700/80 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">NIT: {emp.nit}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      ACTIVO
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{emp.company_name}</h4>
                  <p className="text-xs text-slate-400 font-sans">
                    Contacto: {emp.contact_person || 'No registrado'}
                  </p>
                  <p className="text-xs font-mono text-slate-300">
                    Tel: {emp.phone || 'Sin número'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL REGISTRAR OPERARIO MANUAL */}
      {modalOperario && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardHat className="w-4 h-4 text-cyan-400" />
                Registrar Operario con Validación SG-SST
              </h3>
              <button onClick={() => setModalOperario(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleGuardarOperario} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 mb-1">Empresa Contratista</label>
                <select
                  value={empresaIdSel}
                  onChange={(e) => setEmpresaIdSel(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono cursor-pointer"
                >
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.company_name} (NIT: {emp.nit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del operario"
                    value={nombreOp}
                    onChange={(e) => setNombreOp(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cédula</label>
                  <input
                    type="text"
                    required
                    placeholder="C.C."
                    value={cedulaOp}
                    onChange={(e) => setCedulaOp(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Vigencia Planilla ARL</label>
                  <input
                    type="date"
                    required
                    value={venceArlOp}
                    onChange={(e) => setVenceArlOp(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">RH</label>
                  <select
                    value={rhOp}
                    onChange={(e) => setRhOp(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono cursor-pointer"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes de alto riesgo */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reqAlturas}
                    onChange={(e) => setReqAlturas(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500"
                  />
                  <span>Trabajo en Alturas (&gt;2.0m)</span>
                </label>
                {reqAlturas && (
                  <input
                    type="date"
                    value={venceAlturas}
                    onChange={(e) => setVenceAlturas(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOperario(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Habilitar Técnico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR EMPRESA MANUAL */}
      {modalEmpresa && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Registrar Empresa Contratista
              </h3>
              <button onClick={() => setModalEmpresa(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleGuardarEmpresa} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 mb-1">Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ascensores & Mantenimientos S.A.S."
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">NIT</label>
                <input
                  type="text"
                  required
                  placeholder="900.123.456-7"
                  value={nitEmpresa}
                  onChange={(e) => setNitEmpresa(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Persona de Contacto</label>
                <input
                  type="text"
                  placeholder="Ing. Encargado"
                  value={contactoEmpresa}
                  onChange={(e) => setContactoEmpresa(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="300 000 0000"
                  value={telEmpresa}
                  onChange={(e) => setTelEmpresa(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalEmpresa(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Crear Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
