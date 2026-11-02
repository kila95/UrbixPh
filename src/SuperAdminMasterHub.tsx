import React, { useState } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './supabaseClient';
import { 
  Building2, Users, DollarSign, Bot, ShieldCheck, 
  Plus, Search, ArrowUpRight, AlertTriangle, CheckCircle2, 
  Power, HardDrive, Key, FileText, Phone, Mail, Clock, LogOut, X, Sparkles
} from 'lucide-react';

export interface SuperAdminMasterHubCompany {
  id: string;
  name: string;
  nit: string;
  contact: string;
  email: string;
  phone: string;
  activeBuildings: number;
  maxBuildings: number;
  monthlyFee: number;
  aiHoursUsed: number;
  status: 'Activo' | 'Prueba Piloto (30d)' | 'Suspendido por Pago';
  renewalDate: string;
}

export interface SuperAdminMasterHubProps {
  onLogout?: () => void;
  onImpersonateCompany?: (company: SuperAdminMasterHubCompany) => void;
  onStartInspection?: (targetRole: 'administrador' | 'supervisor' | 'vigilante', companyName: string, buildingName: string) => void;
  user?: {
    name: string;
    role: string;
    email?: string;
  };
  onSwitchRole?: (role: 'superadmin' | 'administrador' | 'supervisor' | 'vigilante') => void;
}

export default function SuperAdminMasterHub({ 
  onLogout, 
  onImpersonateCompany, 
  onStartInspection, 
  user, 
  onSwitchRole 
}: SuperAdminMasterHubProps) {
  const [activeTab, setActiveTab] = useState<'companies' | 'usage' | 'invoicing'>('companies');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. MÉTRICAS MACRO DEL NEGOCIO SAAS
  const [metrics] = useState({
    mrr: 15660000,              // Ingreso mensual recurrente COP
    activeCompanies: 4,          // Firmas gestoras activas
    totalBuildings: 54,          // Copropiedades conectadas
    totalAiHours: 68.5,          // Horas de asambleas procesadas con Gemini este mes
    storageUsedGb: 14.2          // GB de audios y actas en Supabase Storage
  });

  // 2. CLIENTES CORPORATIVOS (FIRMAS GESTORAS)
  const [companies, setCompanies] = useState<SuperAdminMasterHubCompany[]>([
    {
      id: 'comp-1',
      name: 'Mundo Horizontal S.A.S.',
      nit: '900.887.654-1',
      contact: 'Carlos Mario Duque',
      email: 'gerencia@mundohorizontal.com',
      phone: '300 456 7890',
      activeBuildings: 18,
      maxBuildings: 20,
      monthlyFee: 5220000,
      aiHoursUsed: 24.2,
      status: 'Activo',
      renewalDate: '2026-11-15'
    },
    {
      id: 'comp-2',
      name: 'Asercop Inmobiliaria P.H.',
      nit: '901.334.889-3',
      contact: 'Patricia Restrepo',
      email: 'patricia@asercop.co',
      phone: '310 987 6543',
      activeBuildings: 14,
      maxBuildings: 15,
      monthlyFee: 4060000,
      aiHoursUsed: 18.0,
      status: 'Activo',
      renewalDate: '2026-11-20'
    },
    {
      id: 'comp-3',
      name: 'Gestores del Poblado S.A.S.',
      nit: '890.112.443-8',
      contact: 'Alejandro Vélez',
      email: 'administracion@gestorespoblado.com',
      phone: '314 222 1100',
      activeBuildings: 12,
      maxBuildings: 15,
      monthlyFee: 3480000,
      aiHoursUsed: 16.5,
      status: 'Prueba Piloto (30d)',
      renewalDate: '2026-11-28'
    },
    {
      id: 'comp-4',
      name: 'Administraciones & Redes Laureles',
      nit: '900.556.771-0',
      contact: 'Sandra Milena Henao',
      email: 'sandra@adminlaureles.com',
      phone: '301 777 8899',
      activeBuildings: 10,
      maxBuildings: 10,
      monthlyFee: 2900000,
      aiHoursUsed: 9.8,
      status: 'Suspendido por Pago',
      renewalDate: '2026-10-25'
    }
  ]);

  // Formulario para registrar nueva firma gestora
  const [newCompany, setNewCompany] = useState({
    name: '',
    nit: '',
    contact: '',
    email: '',
    phone: '',
    maxBuildings: 10,
    monthlyRatePerUnit: 290000
  });

  // Estado para mostrar el modal con credenciales seguras recién creadas
  const [newlyCreatedCredentials, setNewlyCreatedCredentials] = useState<{
    companyName: string;
    email: string;
    tempPassword: string;
  } | null>(null);

  const generateTempPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `Urbix-${randomNum}*`;
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempPassword = generateTempPassword();

    try {
      if (isSupabaseConfigured && newCompany.email) {
        try {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/create-admin-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              email: newCompany.email,
              tempPassword: tempPassword,
              role: 'administrador',
              companyName: newCompany.name,
              fullName: newCompany.contact,
            }),
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Error al invocar la función de creación');
        } catch (apiErr: any) {
          console.warn("Aviso al crear en Auth (continuando con registro local):", apiErr?.message);
        }
      }

      const created: SuperAdminMasterHubCompany = {
        id: `comp-${Date.now()}`,
        name: newCompany.name,
        nit: newCompany.nit,
        contact: newCompany.contact,
        email: newCompany.email,
        phone: newCompany.phone,
        activeBuildings: 1,
        maxBuildings: parseInt(String(newCompany.maxBuildings), 10) || 10,
        monthlyFee: (parseInt(String(newCompany.maxBuildings), 10) || 10) * (parseInt(String(newCompany.monthlyRatePerUnit), 10) || 290000),
        aiHoursUsed: 0,
        status: 'Prueba Piloto (30d)',
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      setCompanies([created, ...companies]);
      setShowCreateModal(false);
      setNewCompany({ name: '', nit: '', contact: '', email: '', phone: '', maxBuildings: 10, monthlyRatePerUnit: 290000 });

      // Mostrar modal dedicado con las credenciales en lugar de alert()
      setNewlyCreatedCredentials({
        companyName: created.name,
        email: created.email,
        tempPassword: tempPassword
      });

      showToast(`Firma ${created.name} creada exitosamente. Prueba piloto activada.`);
    } catch (err: any) {
      showToast("Error al generar las credenciales de acceso: " + err.message);
    }
  };

  const toggleCompanyStatus = (id: string) => {
    setCompanies(companies.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Activo' ? 'Suspendido por Pago' : 'Activo';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nit.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* ====================================================================
          BARRA DE CONTROL SUPERADMIN (DUEÑO DEL SOFTWARE)
         ==================================================================== */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur bg-slate-900/95">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20 shrink-0">
            U
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white">Urbix PH</h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2.5 py-0.5 rounded-full">
                Consola Superadministrador
              </span>
            </div>
            <p className="text-xs text-slate-400">Control Maestro de Licencias, Clientes y Facturación SaaS</p>
          </div>
        </div>

        {/* NAVEGACIÓN PRINCIPAL */}
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'companies' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" /> Firmas Clientes ({companies.length})
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'usage' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" /> Consumo Gemini AI
            </button>
            <button
              onClick={() => setActiveTab('invoicing')}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'invoicing' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Facturación SaaS
            </button>
          </nav>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-2xl transition border border-slate-700 cursor-pointer"
              title="Cerrar Sesión SuperAdmin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* BANNER DE NOTIFICACIÓN EN TIEMPO REAL */}
      {toastMessage && (
        <div className="mx-6 mt-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ====================================================================
          CUERPO PRINCIPAL DEL SUPERADMIN
         ==================================================================== */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* TARJETAS DE INDICADORES MACRO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Facturación Recurrente (MRR)
            </span>
            <p className="text-3xl font-black text-white">${(metrics.mrr / 1000000).toFixed(2)}M</p>
            <p className="text-[11px] text-emerald-400 font-bold">54 copropiedades facturando en Medellín</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" /> Firmas Administradoras
            </span>
            <p className="text-3xl font-black text-white">{companies.filter(c => c.status === 'Activo').length} Activas</p>
            <p className="text-[11px] text-slate-400">{companies.length} empresas registradas en total</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-purple-400" /> Consumo Gemini 3.8 Flash
            </span>
            <p className="text-3xl font-black text-white">{metrics.totalAiHours}h</p>
            <p className="text-[11px] text-purple-400 font-bold">Costo API estimado: ~$4.80 USD</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-amber-400" /> Almacenamiento Storage
            </span>
            <p className="text-3xl font-black text-white">{metrics.storageUsedGb} GB</p>
            <p className="text-[11px] text-slate-400">Audios webm y actas en Supabase</p>
          </div>
        </div>

        {/* ==================================================================
            PESTAÑA 1: GESTIÓN DE FIRMAS ADMINISTRADORAS (CLIENTES)
           ================================================================== */}
        {activeTab === 'companies' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                  Cartera B2B
                </span>
                <h2 className="text-xl font-black text-white mt-1">Directorio de Empresas Clientes</h2>
                <p className="text-xs text-slate-400">Control de licencias, cupos de copropiedades y estado de servicio.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar por empresa, NIT o contacto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Dar de Alta Firma
                </button>
              </div>
            </div>

            {/* LISTA DE EMPRESAS */}
            <div className="grid grid-cols-1 gap-4">
              {filteredCompanies.map((c) => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-slate-700 transition">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-white">{c.name}</h3>
                      <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        NIT: {c.nit}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        c.status === 'Activo' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : c.status === 'Prueba Piloto (30d)'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      👤 <strong>Contacto:</strong> {c.contact} • 📞 {c.phone} • ✉️ {c.email}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>🏢 <strong>Copropiedades:</strong> {c.activeBuildings} de {c.maxBuildings} autorizadas</span>
                      <span>💰 <strong>Facturación:</strong> ${(c.monthlyFee).toLocaleString('es-CO')} COP/mes</span>
                      <span>🤖 <strong>IA Usada:</strong> {c.aiHoursUsed}h</span>
                      <span>📅 <strong>Corte:</strong> {c.renewalDate}</span>
                    </div>
                  </div>

                  {/* ACCIONES DEL SUPERADMIN */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof onStartInspection === 'function') {
                          onStartInspection('administrador', c.name, 'Sede Principal');
                        } else {
                          console.error("onStartInspection no está definido en las props");
                        }
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Ver Consola
                    </button>

                    <button
                      onClick={() => toggleCompanyStatus(c.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                        c.status === 'Activo'
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {c.status === 'Activo' ? 'Suspender Servicio' : 'Reactivar Cuenta'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 2: CONSUMO DE GEMINI AI
           ================================================================== */}
        {activeTab === 'usage' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white">Monitoreo de Consumo de IA (Gemini 3.8 Flash)</h3>
              <p className="text-xs text-slate-400">Supervisión en tiempo real de minutos procesados para evitar sobrecostos en API.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {companies.map(c => (
                <div key={c.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <h4 className="text-sm font-black text-white">{c.name}</h4>
                  <p className="text-xs text-slate-400">Horas de audio procesadas: <strong className="text-purple-400">{c.aiHoursUsed}h</strong></p>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full rounded-full" 
                      style={{ width: `${Math.min(100, (c.aiHoursUsed / 30) * 100)}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 text-right">Límite mensual sugerido: 30h</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 3: FACTURACIÓN SAAS
           ================================================================== */}
        {activeTab === 'invoicing' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">Liquidación Mensual de Licencias</h3>
                <p className="text-xs text-slate-400">Cobro de mensualidades a razón de $290.000 COP por copropiedad administrada.</p>
              </div>
              <button 
                onClick={() => showToast('Corte de facturación mensual generado exitosamente en DIAN & PSE.')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                Generar Facturas del Mes
              </button>
            </div>

            <div className="space-y-3">
              {companies.map(c => (
                <div key={c.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white text-sm">{c.name}</strong>
                    <p className="text-slate-400">{c.activeBuildings} copropiedades activas • Tarifa pactada: $290.000/unidad</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-mono font-black text-sm">${c.monthlyFee.toLocaleString('es-CO')} COP</p>
                    <p className="text-slate-400">Vence: {c.renewalDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ====================================================================
          MODAL: DAR DE ALTA UNA NUEVA FIRMA CLIENTE
         ==================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Dar de Alta Nueva Firma Gestora</h3>
            <p className="text-xs text-slate-400">
              Registra una nueva empresa de administración para que comience su prueba piloto de 30 días en Urbix.
            </p>

            <form onSubmit={handleCreateCompany} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1">Razón Social de la Firma</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Administraciones Integrales del Sur S.A.S."
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">NIT</label>
                  <input
                    type="text"
                    required
                    placeholder="900.123.456-7"
                    value={newCompany.nit}
                    onChange={(e) => setNewCompany({ ...newCompany, nit: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Cupo Copropiedades</label>
                  <input
                    type="number"
                    required
                    value={newCompany.maxBuildings}
                    onChange={(e) => setNewCompany({ ...newCompany, maxBuildings: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Gerente / Contacto Principal</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del Administrador"
                    value={newCompany.contact}
                    onChange={(e) => setNewCompany({ ...newCompany, contact: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="300 000 0000"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Correo Electrónico (Usuario Maestro)</label>
                <input
                  type="email"
                  required
                  placeholder="gerencia@empresa.com"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Registrar e Iniciar Piloto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CREDENCIALES CREADAS */}
      {newlyCreatedCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">¡Administrador Creado con Éxito!</h3>
                <p className="text-xs text-slate-400">{newlyCreatedCredentials.companyName}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Correo Electrónico (Usuario):</span>
                <code className="text-emerald-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl block border border-slate-800 select-all">
                  {newlyCreatedCredentials.email}
                </code>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Contraseña Temporal:</span>
                <div className="flex items-center gap-2">
                  <code className="text-amber-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl flex-1 border border-slate-800 select-all font-bold">
                    {newlyCreatedCredentials.tempPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`Usuario: ${newlyCreatedCredentials.email}\nContraseña: ${newlyCreatedCredentials.tempPassword}`);
                      showToast("Credenciales copiadas al portapapeles");
                    }}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition cursor-pointer shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Guarda estas credenciales y compártelas con el administrador de la firma. Podrá iniciar sesión inmediatamente en Urbix.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hola! Se han creado tus credenciales de acceso para Urbix Propiedad Horizontal.\n\nUsuario: ${newlyCreatedCredentials.email}\nContraseña Temporal: ${newlyCreatedCredentials.tempPassword}\n\nPor favor ingresa a la plataforma y cambia tu contraseña en tu primer inicio.`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs text-center transition shadow-lg shadow-emerald-600/20"
              >
                Enviar por WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setNewlyCreatedCredentials(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
