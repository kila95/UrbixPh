import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CORE_MANIFEST, verifyCoreIntegrity, OWNER_EMAIL_CANONICAL } from '../core/coreFreezeGuard';
import { DEFAULT_THEME_CONFIG, UIThemeConfig, ThemePalette, FontFamilyOption } from '../config/themeConfig';
import SaaSCotizadorYSuspensionMaster from './SaaSCotizadorYSuspensionMaster';
import CrearAdministradorModal from './CrearAdministradorModal';
import ModalRegistroAdministradorEmpresa from './ModalRegistroAdministradorEmpresa';
import ModalInscribirCopropiedadConIA from './ModalInscribirCopropiedadConIA';
import { MatrizGlobalTenantsSoporte } from './MatrizGlobalTenantsSoporte';
import SoporteTecnicoImpersonacion from './SoporteTecnicoImpersonacion';
import TarjetasKpiInteractivas from './TarjetasKpiInteractivas';
import VersionShieldGuardBanner from './VersionShieldGuardBanner';
import SoftwareArchitectureShieldSuite from './SoftwareArchitectureShieldSuite';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { desactivarUsuarioSeguro } from '../authService';
import { UrbixLogoMark, UrbixFullLogo } from '../UrbixLogo';
import LogoUrbix from './LogoUrbix';

interface SaaS_MasterOwnerConsoleProps {
  onImpersonateAdmin?: (copropiedadName: string) => void;
  onShowToast?: (msg: string) => void;
  themeConfig?: UIThemeConfig;
  onUpdateTheme?: (newConfig: UIThemeConfig) => void;
  tenants?: ClientTenantNode[];
  onUpdateTenants?: React.Dispatch<React.SetStateAction<ClientTenantNode[]>>;
  selectedTenantId?: string;
  onSelectTenantId?: (id: string) => void;
  onAddGlobalAlert?: (alert: { id: string; title: string; category: string; body: string; date: string }) => void;
  onAppendAuditLog?: (action: string, details: string, executor?: string) => void;
  onCerrarSesion?: () => void;
}

export interface ClientTenantNode {
  id: string;
  name: string;
  nit: string;
  city: string;
  adminName: string;
  adminEmail: string;
  plan: 'Plan Esencial' | 'Plan Profesional' | 'Plan Enterprise';
  monthlyFee: number;
  mrr?: number;
  unitsCount?: number;
  status: 'Activa 🟢' | 'En Gracia 🟡' | 'Suspendida por Mora 🔴' | 'active' | 'suspended';
  financialStatus: 'Al Día' | 'Próximo a Vencer' | 'En Mora';
  cutOffDate: string;
  lastBillingDate: string;
  cufeDian: string;
  featureFlags: {
    contable: boolean;
    nomina: boolean;
    porteria: boolean;
    aseo: boolean;
    reservas: boolean;
    residente: boolean;
    boveda: boolean;
  };
  assignedAdminId?: string | null;
}

export interface AdministradorGestor {
  id: string;
  full_name?: string;
  nombreRepresentante?: string;
  company_name?: string;
  nombreEmpresa?: string;
  email: string;
  phone?: string;
  nit?: string;
}

export interface ImpersonationAuditLog {
  id: string;
  timestamp: string;
  tenantName: string;
  nit: string;
  masterUser: string;
  action: string;
}

export const INITIAL_TENANTS: ClientTenantNode[] = [
  {
    id: 'ten_01',
    name: 'Copropiedad PH',
    nit: '900.842.115-2',
    city: 'El Poblado, Medellín',
    adminName: 'Carlos Mario Pineda',
    adminEmail: 'carlos.admin@reservatesoro.com',
    plan: 'Plan Enterprise',
    monthlyFee: 1200000,
    unitsCount: 145,
    status: 'Activa 🟢',
    financialStatus: 'Al Día',
    cutOffDate: '2026-11-01',
    lastBillingDate: '2026-10-01',
    cufeDian: 'CUFE: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2bnd',
    featureFlags: { contable: true, nomina: true, porteria: true, aseo: true, reservas: true, residente: true, boveda: true }
  },
  {
    id: 'ten_02',
    name: 'Edificio Torre El Poblado',
    nit: '811.025.993-8',
    city: 'El Poblado, Medellín',
    adminName: 'Julián Arango',
    adminEmail: 'julian.admin@torrepoblado.com',
    plan: 'Plan Profesional',
    monthlyFee: 650000,
    unitsCount: 85,
    status: 'Activa 🟢',
    financialStatus: 'Al Día',
    cutOffDate: '2026-11-05',
    lastBillingDate: '2026-10-03',
    cufeDian: 'CUFE: 4b227777d4dd7d659a2feaa0c55ad015a3bf4f1b2bnd',
    featureFlags: { contable: true, nomina: false, porteria: true, aseo: false, reservas: true, residente: true, boveda: false }
  },
  {
    id: 'ten_03',
    name: 'C.C. San Diego (Localidades)',
    nit: '890.300.122-1',
    city: 'Centro, Medellín',
    adminName: 'Luz Elena Ríos',
    adminEmail: 'luz.rios@sandiego.com',
    plan: 'Plan Esencial',
    monthlyFee: 250000,
    unitsCount: 30,
    status: 'En Gracia 🟡',
    financialStatus: 'Próximo a Vencer',
    cutOffDate: '2026-10-31',
    lastBillingDate: '2026-09-15',
    cufeDian: 'CUFE: 7c659a2feaa0c55ad015a3bf4f1b2b2bnd',
    featureFlags: { contable: true, nomina: false, porteria: true, aseo: false, reservas: false, residente: false, boveda: false }
  },
  {
    id: 'ten_04',
    name: 'Urbanización Senderos de Laureles',
    nit: '901.223.441-9',
    city: 'Laureles, Medellín',
    adminName: 'Andrés Felipe Rueda',
    adminEmail: 'andres@senderoslaureles.ph',
    plan: 'Plan Profesional',
    monthlyFee: 650000,
    unitsCount: 95,
    status: 'Suspendida por Mora 🔴',
    financialStatus: 'En Mora',
    cutOffDate: '2026-10-15',
    lastBillingDate: '2026-08-30',
    cufeDian: 'CUFE: SUSPENDED-PENDING-PAYMENT',
    featureFlags: { contable: false, nomina: false, porteria: false, aseo: false, reservas: false, residente: false, boveda: false }
  }
];

export default function SaaS_MasterOwnerConsole({
  onImpersonateAdmin = () => {},
  onShowToast = () => {},
  themeConfig = DEFAULT_THEME_CONFIG,
  onUpdateTheme = () => {},
  tenants: propTenants = INITIAL_TENANTS,
  onUpdateTenants = () => {},
  selectedTenantId = 'ten_01',
  onSelectTenantId = () => {},
  onAddGlobalAlert = () => {},
  onAppendAuditLog = () => {},
  onCerrarSesion
}: SaaS_MasterOwnerConsoleProps) {
  const [tenants, setTenantsState] = useState<any[]>(propTenants);
  const [cargandoTenants, setCargandoTenants] = useState(false);

  // Lista de Administradores & Firmas Gestoras B2B
  const [administradoresLista, setAdministradoresLista] = useState<AdministradorGestor[]>([
    {
      id: 'adm_01',
      full_name: 'Carlos Mario Pineda',
      nombreRepresentante: 'Carlos Mario Pineda',
      company_name: 'Pineda Gestión Inmobiliaria S.A.S.',
      nombreEmpresa: 'Pineda Gestión Inmobiliaria S.A.S.',
      email: 'carlos.admin@reservatesoro.com',
      phone: '310 450 8899',
      nit: '900.554.321-4'
    },
    {
      id: 'adm_02',
      full_name: 'Julián Arango',
      nombreRepresentante: 'Julián Arango',
      company_name: 'Arango PH Consultores',
      nombreEmpresa: 'Arango PH Consultores',
      email: 'julian.admin@torrepoblado.com',
      phone: '311 889 0012',
      nit: '901.223.445-1'
    },
    {
      id: 'adm_03',
      full_name: 'Dra. Patricia Restrepo',
      nombreRepresentante: 'Dra. Patricia Restrepo',
      company_name: 'Soluciones Integrales PH',
      nombreEmpresa: 'Soluciones Integrales PH',
      email: 'patricia.restrepo@solucionesph.com',
      phone: '314 776 5544',
      nit: '900.887.654-9'
    }
  ]);

  const setTenants = (updater: any) => {
    setTenantsState((prev: any[]) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (onUpdateTenants) {
        try {
          onUpdateTenants(next);
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const [tenantsReales, setTenantsReales] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [metricas, setMetricas] = useState({
    saludFinanciera: '100.0%',
    recaudoMes: '100.0%',
    totalUnidades: 100,
    mrrPlataforma: 200000,
    instanciasActivas: 1
  });

  const cargarFacturacionReal = async () => {
    try {
      setCargando(true);

      // 1. Consultar tenants reales existentes en la base de datos
      const { data: tenantsData, error: errTenants } = await supabase
        .from('tenants')
        .select('id, name, plan, total_monthly_budget, units_count, status')
        .order('created_at', { ascending: false });

      if (errTenants) throw errTenants;

      // 2. Consultar unidades reales de Copropiedad_PH
      const { data: unitsData, error: errUnits } = await supabase
        .from('units')
        .select('debt_status, pending_balance');

      if (errUnits) throw errUnits;

      const units = unitsData || [];
      // Cálculo real derivado de la tabla units
      const totalUnidades = units.length; // 100
      const unidadesEnMora = units.filter(u => Number(u.pending_balance) > 0 || u.debt_status === 'En mora').length;
      const unidadesPagadas = units.filter(u => u.debt_status === 'Al día' && Number(u.pending_balance) === 0).length;

      // Si nadie ha pagado el mes que recién inicia, dará 0.0%
      const porcentajeRecaudo = totalUnidades > 0 
        ? ((unidadesPagadas / totalUnidades) * 100).toFixed(1) 
        : '0.0';

      setTenantsReales(tenantsData || []);
      setMetricas({
        saludFinanciera: `${porcentajeRecaudo}%`,
        recaudoMes: `${porcentajeRecaudo}%`,
        totalUnidades: totalUnidades,
        // Si cobras por ejemplo $2.000 COP por unidad en tu SaaS:
        mrrPlataforma: totalUnidades * 2000, 
        instanciasActivas: tenantsData?.length || 1
      });

    } catch (error: any) {
      console.error('Error cargando facturación real:', error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarFacturacionReal();
  }, []);

  const cargarDirectorioCompleto = async () => {
    if (!isSupabaseConfigured) return;
    setCargandoTenants(true);

    try {
      // 1. Consultar Administradores activos
      let admins: any[] | null = null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['admin', 'admin_ph'])
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        admins = data;
      } catch (errAdmins: any) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['admin', 'admin_ph']);
          if (!error) admins = data;
        } catch {}
      }

      if (admins && admins.length > 0) {
        setAdministradoresLista(prev => {
          const map = new Map<string, AdministradorGestor>();
          admins!.forEach((p: any) => {
            map.set(p.email, {
              id: p.id,
              full_name: p.full_name || p.nombre || '',
              nombreRepresentante: p.full_name || p.nombre || '',
              company_name: p.company_name || p.empresa || '',
              nombreEmpresa: p.company_name || p.empresa || '',
              email: p.email,
              phone: p.phone,
              nit: p.company_nit || p.nit
            });
          });
          prev.forEach(a => {
            if (!map.has(a.email)) map.set(a.email, a);
          });
          return Array.from(map.values());
        });
      }

      // 2. Consultar Copropiedades activas
      let edificios: any[] | null = null;
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        edificios = data;
      } catch (errTenants: any) {
        try {
          const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error) edificios = data;
          else {
            const fallback = await supabase.from('tenants').select('*');
            if (!fallback.error) edificios = fallback.data;
          }
        } catch {}
      }

      if (edificios && edificios.length > 0) {
        const tenantsFormateados = edificios.map((t: any) => ({
          id: t.id,
          name: t.name,
          nit: t.nit || 'NIT en trámite',
          city: t.city || 'Medellín',
          address: t.address || '',
          adminName: t.admin_name || t.adminName || 'Pendiente por asignar',
          adminEmail: t.admin_email || t.adminEmail || 'Sin correo',
          plan: t.plan || 'Plan Pro',
          status: t.status === 'active' || t.status === 'Activo' ? 'Activa 🟢' : (t.status || 'Activa 🟢'),
          unitsCount: t.units_count || t.unitsCount || 0,
          monthlyFee: Number(t.mrr || t.monthlyFee || (t.plan === 'Enterprise' ? 1800000 : t.plan === 'Pro' ? 1200000 : 750000)),
          financialStatus: t.financialStatus || 'Al Día',
          cutOffDate: t.cutOffDate || '2026-12-01',
          lastBillingDate: t.lastBillingDate || new Date().toISOString().split('T')[0],
          cufeDian: t.cufeDian || `CUFE: ${String(t.id).slice(0, 8)}...`,
          featureFlags: t.featureFlags || {
            contable: true,
            nomina: true,
            porteria: true,
            aseo: true,
            reservas: true,
            residente: true,
            boveda: true
          },
          assignedAdminId: t.assigned_admin_id || t.assignedAdminId || null
        }));

        setTenants(tenantsFormateados);
      }
    } catch (error: any) {
      console.error('Error sincronizando directorio:', error.message);
    } finally {
      setCargandoTenants(false);
    }
  };

  const cargarTenantsDesdeDB = cargarDirectorioCompleto;

  // Cargar al iniciar el componente
  useEffect(() => {
    cargarDirectorioCompleto();
  }, []);

  // SUBMÓDULOS DEL DUEÑO DEL SOFTWARE E INTEGRIDAD DE ARQUITECTURA
  const [activeTab, setActiveTab] = useState<'tenants' | 'pricing_tiers' | 'feature_flags' | 'support_impersonate' | 'gateway' | 'billing_dunning' | 'infrastructure' | 'architecture_shield'>('tenants');
  const [gatewayProvider, setGatewayProvider] = useState<'Wompi Bancolombia' | 'Stripe Global' | 'PayU Latam' | 'PSE Corporativo'>('Wompi Bancolombia');
  const [autoBillingEnabled, setAutoBillingEnabled] = useState<boolean>(true);

  // Sliders interactivos del simulador ARR
  const [simEsencial, setSimEsencial] = useState<number>(5);
  const [simProfesional, setSimProfesional] = useState<number>(12);
  const [simEnterprise, setSimEnterprise] = useState<number>(4);

  // Bitácora de Auditoría de Impersonación
  const [impersonationLogs, setImpersonationLogs] = useState<ImpersonationAuditLog[]>([
    { id: 'imp_01', timestamp: '2026-10-29 08:14:22', tenantName: 'Copropiedad PH', nit: '900.842.115-2', masterUser: 'estebanochoamesa@gmail.com', action: 'IMPERSONATE_ADMIN_SESSION' },
    { id: 'imp_02', timestamp: '2026-10-29 09:30:10', tenantName: 'Edificio Torre El Poblado', nit: '811.025.993-8', masterUser: 'estebanochoamesa@gmail.com', action: 'IMPERSONATE_ADMIN_SESSION' }
  ]);

  const [activeModalCard, setActiveModalCard] = useState<'mrr_rec' | 'coprop_suscritas' | 'dian_facturacion' | null>(null);
  const [modalCrearAdminTenantId, setModalCrearAdminTenantId] = useState<string | null>(null);
  const [modalEmpresaAdminTenantId, setModalEmpresaAdminTenantId] = useState<string | null>(null);
  const [modalInscribirAbierto, setModalInscribirAbierto] = useState(false);
  const [modalVincularTenantId, setModalVincularTenantId] = useState<string | null>(null);

  const abrirModalVincular = (tenantId: string) => {
    setModalVincularTenantId(tenantId);
  };

  const handleVincularAdminATenant = async (tenantId: string, admin: AdministradorGestor) => {
    const adminFullName = admin.full_name || admin.nombreRepresentante || 'Administrador Asignado';
    const adminCompany = admin.company_name || admin.nombreEmpresa ? ` (${admin.company_name || admin.nombreEmpresa})` : '';
    const adminDisplay = `${adminFullName}${adminCompany}`;

    onUpdateTenants(prev =>
      prev.map(t =>
        t.id === tenantId
          ? {
              ...t,
              assignedAdminId: admin.id,
              adminName: adminDisplay,
              adminEmail: admin.email
            }
          : t
      )
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('admin_tenant_assignments').insert({
          admin_id: admin.id,
          tenant_id: tenantId,
          created_at: new Date().toISOString()
        });
        await supabase.from('tenants').update({
          assigned_admin_id: admin.id,
          admin_name: adminDisplay,
          admin_email: admin.email
        }).eq('id', tenantId);
      } catch (err) {
        console.warn('Error vinculando admin en Supabase:', err);
      }
    }

    onShowToast?.(`¡Administrador ${adminFullName} vinculado con éxito a la copropiedad!`);
    onAppendAuditLog?.(
      'ASSIGN_ADMIN_TO_TENANT',
      `Vinculó a ${adminFullName} (${admin.email}) como Administrador de la copropiedad ID ${tenantId}`
    );
    setModalVincularTenantId(null);
  };

  const handleDesactivarAdmin = async (admin: AdministradorGestor) => {
    const adminNombre = admin.full_name || admin.nombreRepresentante || admin.email;
    try {
      if (isSupabaseConfigured) {
        await desactivarUsuarioSeguro(admin.id);
      }
      setAdministradoresLista(prev => prev.filter(a => a.id !== admin.id));
      onShowToast?.(`✓ Administrador "${adminNombre}" desactivado de forma segura.`);
      onAppendAuditLog?.('DEACTIVATE_USER_SAFE', `Desactivó al administrador ${admin.email} (ID: ${admin.id})`);
    } catch (err: any) {
      onShowToast?.(`Error al desactivar administrador: ${err.message}`);
    }
  };

  const setActiveTenant = (nuevoTenant: ClientTenantNode) => onSelectTenantId(nuevoTenant.id);

  // Control de scroll horizontal de sub-pestañas
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);
  const [scrollPercentage, setScrollPercentage] = useState<number>(0);

  const checkScrollState = useCallback(() => {
    const el = tabsScrollRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = scrollWidth - clientWidth;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < maxScroll - 6);
      setScrollPercentage(maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0);
    }
  }, []);

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [checkScrollState]);

  const handleTabsScrollLeft = () => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
      setTimeout(checkScrollState, 350);
    }
  };

  const handleTabsScrollRight = () => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      setTimeout(checkScrollState, 350);
    }
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && tabsScrollRef.current) {
      tabsScrollRef.current.scrollLeft += e.deltaY * 0.9;
      checkScrollState();
    }
  };

  const handleToggleSuspendTenant = (id: string) => {
    onUpdateTenants(prev => prev.map(t => {
      if (t.id === id) {
        const newStatus = t.status.includes('Suspendida') ? 'Activa 🟢' : 'Suspendida por Mora 🔴';
        onShowToast(`⚡ Servicio de software para "${t.name}" actualizado a: ${newStatus}`);
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  const handleUpdatePlan = (id: string, newPlan: 'Plan Esencial' | 'Plan Profesional' | 'Plan Enterprise') => {
    const feeMap = {
      'Plan Esencial': 250000,
      'Plan Profesional': 650000,
      'Plan Enterprise': 1200000
    };
    onUpdateTenants(prev => prev.map(t => {
      if (t.id === id) {
        onShowToast(`✅ Plan de "${t.name}" actualizado a ${newPlan} ($${feeMap[newPlan].toLocaleString()} COP/mes)`);
        return { ...t, plan: newPlan, monthlyFee: feeMap[newPlan] };
      }
      return t;
    }));
  };

  const handleToggleFeatureFlag = (tenantId: string, flagKey: keyof ClientTenantNode['featureFlags']) => {
    onUpdateTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const nextVal = !t.featureFlags[flagKey];
        onShowToast(`🎛️ Licencia [${flagKey.toUpperCase()}] para "${t.name}" ${nextVal ? 'ACTIVADA' : 'DESACTIVADA'}.`);
        return {
          ...t,
          featureFlags: {
            ...t.featureFlags,
            [flagKey]: nextVal
          }
        };
      }
      return t;
    }));
  };

  const handleUpdateTenantFinancialStatus = (tenantId: string, newStatus: 'Al Día' | 'Próximo a Vencer' | 'En Mora') => {
    onUpdateTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const isMora = newStatus === 'En Mora';
        const newFlags = {
          contable: isMora ? false : t.featureFlags.contable,
          nomina: isMora ? false : t.featureFlags.nomina,
          porteria: isMora ? false : t.featureFlags.porteria,
          aseo: isMora ? false : t.featureFlags.aseo,
          reservas: isMora ? false : t.featureFlags.reservas,
          residente: isMora ? false : t.featureFlags.residente,
          boveda: isMora ? false : t.featureFlags.boveda
        };
        onShowToast(`💰 Estado financiero de "${t.name}" actualizado a: ${newStatus}. ${isMora ? '⚠️ Módulos bloqueados.' : '✅ Acceso restaurado.'}`);
        return { ...t, financialStatus: newStatus, status: isMora ? 'Suspendida por Mora 🔴' : 'Activa 🟢', featureFlags: newFlags };
      }
      return t;
    }));
  };

  const handleExecuteImpersonate = (tenant: ClientTenantNode) => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newLog: ImpersonationAuditLog = {
      id: `imp_${Date.now()}`,
      timestamp,
      tenantName: tenant.name,
      nit: tenant.nit,
      masterUser: 'estebanochoamesa@gmail.com',
      action: 'IMPERSONATE_ADMIN_SESSION'
    };

    setImpersonationLogs(prev => [newLog, ...prev]);
    onImpersonateAdmin(tenant.name);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans space-y-6">
      
      {/* BANNER FLOTANTE DE BLINDAJE DE VERSIÓN Y ARQUITECTURA DEL SOFTWARE */}
      <VersionShieldGuardBanner currentUserEmail={OWNER_EMAIL_CANONICAL} onShowToast={onShowToast} />

      {/* Cabecera Principal Master */}
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <LogoUrbix size="md" rolBadge="MASTER" />
          <div className="hidden sm:block h-9 w-px bg-slate-800" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-bold">
                SAAS MASTER OWNER (ROOT SUPREME)
              </span>
              <span className="text-xs text-slate-400 font-mono">Urbix Technologies S.A.S. • Medellín</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 tracking-tight">Consola Global del Dueño del Software</h1>
            <p className="text-xs text-slate-400">Control B2B Multi-Tenant • Pasarelas de Pago • Facturación DIAN UBL 2.1 • {CORE_MANIFEST.version}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 font-mono text-xs">
          <div className="flex items-center space-x-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">ESTADO DE LA PLATAFORMA:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                100% Operativo (Supabase Edge)
              </span>
            </div>
          </div>
          {onCerrarSesion && (
            <button
              type="button"
              onClick={onCerrarSesion}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-3 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              🚪 Cerrar Sesión
            </button>
          )}
        </div>
      </div>

      {/* 4 Métricas Clave en la Cabecera Interactivas */}
      <div className="mb-6">
        <TarjetasKpiInteractivas />
      </div>

      {/* 3 Tarjetas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          onClick={() => setActiveModalCard('mrr_rec')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/30">
              TARJETA 1
            </span>
            <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">🔍 Ver analítica</span>
          </div>
          <div className="text-xl font-black font-mono text-white mt-2">${metricas.mrrPlataforma.toLocaleString('es-CO')} COP/mes</div>
          <div className="text-xs font-mono text-purple-400 mt-1 font-bold">ARR Anual: ${(metricas.mrrPlataforma * 12).toLocaleString('es-CO')} COP</div>
          <span className="text-[11px] font-mono text-slate-400 mt-3 block">MRR Plataforma ($2.000 COP × {metricas.totalUnidades} unidades)</span>
        </div>

        <div
          onClick={() => setActiveModalCard('coprop_suscritas')}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-500/30">
              TARJETA 2
            </span>
            <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">🔍 Ver directorio</span>
          </div>
          <div className="text-xl font-black font-mono text-white mt-2">{metricas.instanciasActivas} Copropiedades SaaS</div>
          <div className="text-xs font-mono text-emerald-400 mt-1 font-bold">Salud Financiera: {metricas.saludFinanciera}</div>
          <span className="text-[11px] font-mono text-slate-400 mt-3 block">Copropiedades Activas en Supabase</span>
        </div>

        <div
          onClick={() => setActiveModalCard('dian_facturacion')}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono text-purple-400 font-bold bg-purple-950/80 px-2.5 py-1 rounded border border-purple-500/30">
              TARJETA 3
            </span>
            <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">🔍 Ver centro DIAN</span>
          </div>
          <div className="text-xl font-black font-mono text-white mt-2">{metricas.recaudoMes} Recaudo</div>
          <div className="text-xs font-mono text-cyan-400 mt-1 font-bold">Total: {metricas.totalUnidades} Unidades Registradas</div>
          <span className="text-[11px] font-mono text-slate-400 mt-3 block">Centro de Control y Transmisión DIAN</span>
        </div>
      </div>

      {/* Matriz Global de Tenants y Diagnóstico */}
      <div className="mb-8">
        <MatrizGlobalTenantsSoporte 
          onImpersonateTenant={(tName) => {
            const matched = tenants.find(t => t.name.toLowerCase().includes(tName.toLowerCase()));
            if (matched) {
              handleExecuteImpersonate(matched);
            } else {
              onImpersonateAdmin(tName);
            }
          }}
          onSelectTenantSupport={(tenantId) => {
            const matched = tenants.find(t => t.id === tenantId || t.name.toLowerCase().includes(tenantId.toLowerCase()));
            if (matched) {
              onSelectTenantId(matched.id);
            }
            setActiveTab('support_impersonate');
            onShowToast(`🛠️ Cambiando a pestaña de Soporte Técnico e Impersonación para el tenant.`);
          }}
        />
      </div>

      {/* BARRA DE LAS 7 SUB-PESTAÑAS OFICIALES */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between mb-2 px-1 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="uppercase tracking-wider font-semibold text-slate-300 text-[10px]">
              MÓDULOS DEL ECOSISTEMA SAAS
            </span>
            <span className="text-[10px] bg-slate-900 border border-slate-800 text-purple-300 px-2 py-0.5 rounded">
              7 Módulos Clave
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-lg p-0.5 shadow-sm">
              <button
                type="button"
                onClick={handleTabsScrollLeft}
                disabled={!canScrollLeft}
                className="p-1.5 rounded text-cyan-400 hover:text-white hover:bg-slate-800 cursor-pointer disabled:opacity-30"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={handleTabsScrollRight}
                disabled={!canScrollRight}
                className="p-1.5 rounded text-cyan-400 hover:text-white hover:bg-slate-800 cursor-pointer disabled:opacity-30"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div
            ref={tabsScrollRef}
            onScroll={checkScrollState}
            onWheel={handleTabsWheel}
            className="flex border-b border-slate-800 gap-2 font-mono text-xs overflow-x-auto pb-1.5 select-none"
          >
            {[
              { id: 'tenants', label: '🏢 Matriz Global de Copropiedades (Tenants)' },
              { id: 'architecture_shield', label: '🛡️ Blindaje de Versión y Arquitectura (Owner Lock)' },
              { id: 'pricing_tiers', label: '💎 Planes, Tarifas & Proyección MRR' },
              { id: 'feature_flags', label: '🎛️ Licenciamiento & Módulos (Feature Flags)' },
              { id: 'support_impersonate', label: '🛠️ Soporte Técnico & Impersonación' },
              { id: 'gateway', label: '💳 Pasarela de Pagos SaaS (Wompi / Stripe)' },
              { id: 'billing_dunning', label: '💰 Gestión de Cobros & Dunning' },
              { id: 'infrastructure', label: '⚡ Infraestructura & Servidores Cloud' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={(e) => {
                  setActiveTab(tab.id as any);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }}
                className={`px-5 py-3 rounded-t-xl whitespace-nowrap transition-colors font-bold shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-purple-950/60 text-purple-300 border-t border-x border-purple-500/40'
                    : 'text-slate-400 hover:text-white bg-slate-900/40 border-transparent hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full bg-slate-950/90 h-[2px] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400 transition-all duration-100 rounded-full"
              style={{
                width: '35%',
                transform: `translateX(${(scrollPercentage / 100) * 180}%)`,
                boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)'
              }}
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          MÓDULO DE BLINDAJE DE VERSIÓN Y ARQUITECTURA (OWNER LOCK)
         ========================================================================= */}
      {activeTab === 'architecture_shield' && (
        <SoftwareArchitectureShieldSuite
          currentUserEmail={OWNER_EMAIL_CANONICAL}
          onShowToast={onShowToast}
          onAppendAuditLog={onAppendAuditLog}
        />
      )}

      {/* =========================================================================
          DIRECTORIO DUAL: ADMINISTRADORES (IZQUIERDA) vs COPROPIEDADES (DERECHA)
         ========================================================================= */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          
          {/* Barra Superior de Control de Licencias */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded uppercase tracking-widest">
                [ B2B MULTI-TENANT &amp; ADMIN REGISTRY ]
              </span>
              <h2 className="text-xl font-black text-white mt-2">Gestión de Copropiedades y Empresas Administradoras</h2>
              <p className="text-xs text-slate-400">
                Crea administradores independientes o edificios sin ataduras, y vincúlalos libremente cuando lo requieras.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setModalInscribirAbierto(true)}
                className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 text-white font-black px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(217,70,239,0.3)]"
              >
                + Inscribir Nueva Copropiedad
              </button>
              <button
                type="button"
                onClick={() => setModalEmpresaAdminTenantId('libre')}
                className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center gap-2"
              >
                🏢 + Registrar Administrador &amp; Empresa
              </button>
            </div>
          </div>

          {/* GRID DUAL: DOS COLUMNAS */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* COLUMNA 1 (5 columnas): DIRECTORIO DE ADMINISTRADORES / FIRMAS */}
            <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Administradores &amp; Firmas Gestoras
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">Usuarios con credenciales de gestión B2B</p>
                </div>
                <span className="text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                  {administradoresLista.length} Registrados
                </span>
              </div>

              {/* Listado de Administradores */}
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {administradoresLista.map((admin) => {
                  const conjuntosAsociados = tenants.filter(t => t.assignedAdminId === admin.id || t.adminEmail === admin.email);
                  const tieneConjuntos = conjuntosAsociados.length > 0;

                  return (
                    <div 
                      key={admin.id} 
                      className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl hover:border-cyan-500/40 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-black text-white">{admin.full_name || admin.nombreRepresentante}</h4>
                          <p className="text-[11px] text-cyan-300 font-mono">{admin.company_name || admin.nombreEmpresa}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{admin.email}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            tieneConjuntos 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {tieneConjuntos ? `${conjuntosAsociados.length} Edificio(s)` : 'Sin Conjuntos'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDesactivarAdmin(admin)}
                            title="Desactivar administrador de forma segura"
                            className="px-1.5 py-0.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 rounded-lg transition text-[10px] font-mono cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Lista de edificios que administra actualmente */}
                      <div className="pt-2 border-t border-slate-900 text-[11px] flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-slate-500 font-mono">Inmuebles:</span>
                        {tieneConjuntos ? (
                          conjuntosAsociados.map(c => (
                            <span key={c.id} className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-800">
                              {c.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-amber-400/80 italic font-mono">
                            Listo para asignar a una copropiedad
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMNA 2 (7 columnas): TABLA DE COPROPIEDADES / EDIFICIOS */}
            <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    Copropiedades &amp; Urbanizaciones
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">Inmuebles con base de datos y censo activo</p>
                </div>
                <div className="flex items-center gap-2">
                  {cargandoTenants && (
                    <span className="text-[10px] font-mono text-cyan-400 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      Cargando DB...
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                    {tenants.length} Inmuebles
                  </span>
                </div>
              </div>

              {/* Tabla compacta de Copropiedades */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                      <th className="p-3">Inmueble / NIT</th>
                      <th className="p-3">Administrador Asignado</th>
                      <th className="p-3">Plan / Estado</th>
                      <th className="p-3 text-right">Vincular</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cargandoTenants && tenants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400 font-mono text-xs">
                          Cargando copropiedades desde la base de datos...
                        </td>
                      </tr>
                    ) : (
                      tenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-950/40 transition">
                        <td className="p-3">
                          <p className="font-bold text-white text-xs">{t.name}</p>
                          <p className="text-[10px] text-slate-500">{t.city} • NIT: {t.nit}</p>
                        </td>

                        <td className="p-3">
                          {t.adminName ? (
                            <div>
                              <span className="font-bold text-slate-200">{t.adminName}</span>
                              <p className="text-[10px] text-purple-400">{t.adminEmail}</p>
                            </div>
                          ) : (
                            <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                              ⚠️ Sin Administrador
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <span className="text-emerald-400 font-bold block">{t.plan}</span>
                          <span className="text-[10px] text-slate-400">{t.status || 'Activo'}</span>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => abrirModalVincular(t.id)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/30 rounded-xl text-[10px] font-black transition cursor-pointer"
                          >
                            Asignar Admin
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Modal para Vincular Administrador a Inmueble */}
          {modalVincularTenantId && (() => {
            const tenantEnVincular = tenants.find(t => t.id === modalVincularTenantId);
            return (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans text-slate-100">
                <div className="bg-[#0b0f17] border border-cyan-500/40 rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                        VINCULACIÓN B2B
                      </span>
                      <h4 className="text-base font-black text-white mt-1">
                        Asignar Administrador a {tenantEnVincular?.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => setModalVincularTenantId(null)}
                      className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 font-mono">
                    Selecciona la firma gestora o administrador registrado que tendrá acceso y control operativo de este inmueble:
                  </p>

                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {administradoresLista.map((admin) => {
                      const yaAsignado = tenantEnVincular?.assignedAdminId === admin.id || tenantEnVincular?.adminEmail === admin.email;
                      return (
                        <div
                          key={admin.id}
                          className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                            yaAsignado
                              ? 'bg-cyan-950/30 border-cyan-500/50'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <h5 className="text-xs font-bold text-white">{admin.full_name || admin.nombreRepresentante}</h5>
                            <p className="text-[11px] text-cyan-300 font-mono">{admin.company_name || admin.nombreEmpresa}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{admin.email}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleVincularAdminATenant(modalVincularTenantId, admin)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono transition cursor-pointer ${
                              yaAsignado
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 shadow-md'
                            }`}
                          >
                            {yaAsignado ? '✓ Asignado' : 'Seleccionar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setModalVincularTenantId(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {modalCrearAdminTenantId && (
            <CrearAdministradorModal
              tenantIdActual={modalCrearAdminTenantId}
              onCerrar={() => setModalCrearAdminTenantId(null)}
              onShowToast={onShowToast}
              onUsuarioCreado={({ nombre, email, rol, tenantId }) => {
                if (rol === 'admin_ph') {
                  onUpdateTenants(prev => prev.map(t => t.id === tenantId ? { ...t, adminName: nombre, adminEmail: email } : t));
                }
                onAppendAuditLog?.('CREATE_SUPABASE_ADMIN_USER', `Usuario ${nombre} (${email}) creado con rol ${rol} para tenant ${tenantId}`);
              }}
            />
          )}

          {modalEmpresaAdminTenantId && (
            <ModalRegistroAdministradorEmpresa
              tenantsDisponibles={tenants.map(t => ({ id: t.id, name: t.name }))}
              tenantPreseleccionadoId={modalEmpresaAdminTenantId === 'libre' ? undefined : modalEmpresaAdminTenantId}
              onCerrar={() => setModalEmpresaAdminTenantId(null)}
              onShowToast={onShowToast}
              onRegistroExitoso={({ nombreEmpresa, nitCompleto, nombreRepresentante, email, tenantId, telefono }) => {
                const nuevoAdminId = `adm_${Date.now()}`;
                setAdministradoresLista(prev => [
                  {
                    id: nuevoAdminId,
                    full_name: nombreRepresentante,
                    nombreRepresentante,
                    company_name: nombreEmpresa,
                    nombreEmpresa,
                    email,
                    nit: nitCompleto,
                    phone: telefono
                  },
                  ...prev
                ]);

                if (tenantId) {
                  onUpdateTenants(prev =>
                    prev.map(t =>
                      t.id === tenantId
                        ? {
                            ...t,
                            assignedAdminId: nuevoAdminId,
                            adminName: `${nombreRepresentante} (${nombreEmpresa})`,
                            adminEmail: email
                          }
                        : t
                    )
                  );
                }
                onAppendAuditLog?.(
                  'REGISTER_ADMIN_COMPANY_SUPABASE',
                  `Registró Administrador "${nombreRepresentante}" y Empresa "${nombreEmpresa}" (NIT: ${nitCompleto})${tenantId ? ` asignado a tenant ${tenantId}` : ' (Sin copropiedad asignada)'}`
                );
              }}
            />
          )}

          {modalInscribirAbierto && (
            <ModalInscribirCopropiedadConIA
              administradoresRegistrados={administradoresLista.map(a => ({
                id: a.id,
                nombre: a.full_name || a.nombreRepresentante || '',
                empresa: a.company_name || a.nombreEmpresa || '',
                email: a.email
              }))}
              onCerrar={() => setModalInscribirAbierto(false)}
              onTenantCreado={(nuevoTenant: any) => {
                // Opción A: Recargar directamente de Supabase
                cargarTenantsDesdeDB();
                cargarFacturacionReal();

                // Opción B: Inserción reactiva inmediata en la tabla local
                setTenants((prev: any[]) => [
                  {
                    id: nuevoTenant.id,
                    name: nuevoTenant.name,
                    nit: nuevoTenant.nit,
                    city: nuevoTenant.city,
                    adminName: nuevoTenant.adminName || 'Pendiente por asignar',
                    adminEmail: nuevoTenant.adminEmail || 'Sin correo',
                    plan: nuevoTenant.plan || 'Plan Pro',
                    status: 'Activa 🟢',
                    unitsCount: nuevoTenant.unitsCount || nuevoTenant.units_count || 100,
                    monthlyFee: nuevoTenant.monthlyFee || (nuevoTenant.plan === 'Plan Enterprise' ? 1800000 : 1200000),
                    financialStatus: 'Al Día',
                    cutOffDate: '2026-12-01',
                    lastBillingDate: new Date().toISOString().split('T')[0],
                    cufeDian: `CUFE: ${nuevoTenant.id?.slice(0, 8)}...`,
                    featureFlags: nuevoTenant.featureFlags || {
                      contable: true,
                      nomina: true,
                      porteria: true,
                      aseo: true,
                      reservas: true,
                      residente: true,
                      boveda: true
                    },
                    assignedAdminId: nuevoTenant.assignedAdminId || null
                  },
                  ...prev
                ]);

                setActiveTenant(nuevoTenant);
                setModalInscribirAbierto(false);
              }}
              onShowToast={onShowToast}
            />
          )}

          <SaaSCotizadorYSuspensionMaster
            tenants={tenants}
            onUpdateTenants={onUpdateTenants}
            onShowToast={onShowToast}
            onAppendAuditLog={onAppendAuditLog}
          />
        </div>
      )}

      {/* SUBMÓDULO 2: PRICING & TIERS */}
      {activeTab === 'pricing_tiers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl font-mono">
          <SaaSCotizadorYSuspensionMaster
            tenants={tenants}
            onUpdateTenants={onUpdateTenants}
            onShowToast={onShowToast}
            onAppendAuditLog={onAppendAuditLog}
          />

          <div className="border-b border-slate-800 pb-4">
            <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded">
              [ B2B PROPERTY TECH PRICING &amp; TIERS ]
            </span>
            <h2 className="text-lg font-bold text-white mt-2">Planes, Tarifas y Simulador Interactivo de Proyección MRR</h2>
            <p className="text-xs text-slate-400">Ajusta los controles deslizantes (*sliders*) para simular el impacto en el flujo de caja anual (ARR) según el volumen de copropiedades.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-cyan-500/10 text-cyan-400 text-[10px] px-3 py-1 rounded-bl-xl font-bold">
                Hasta 30 Unidades
              </div>
              <div>
                <span className="text-cyan-400 text-xs font-bold block mb-1">PLAN ESENCIAL</span>
                <div className="text-2xl font-black text-white mb-2">$250,000 <span className="text-xs text-slate-400 font-normal">COP / mes</span></div>
                <p className="text-xs text-slate-400 mb-4">Ideal para pequeños edificios residenciales que inician su digitalización.</p>
                
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 mb-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Simulador Clientes:</span>
                    <strong className="text-cyan-400">{simEsencial} Edificios</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={simEsencial}
                    onChange={(e) => setSimEsencial(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li>✓ Módulo de Portería &amp; QR</li>
                  <li>✓ Portal de Residentes</li>
                  <li>✕ Cartera &amp; Tesorería NIIF</li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-400">Subtotal Simulado:</span>
                <span className="text-cyan-400 font-bold">${(simEsencial * 250000).toLocaleString()} COP/mes</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-purple-500/40 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-purple-950/20">
              <div className="absolute top-0 right-0 bg-purple-500/20 text-purple-300 text-[10px] px-3 py-1 rounded-bl-xl font-bold">
                Hasta 100 Unidades (Más Popular)
              </div>
              <div>
                <span className="text-purple-400 text-xs font-bold block mb-1">PLAN PROFESIONAL</span>
                <div className="text-2xl font-black text-white mb-2">$650,000 <span className="text-xs text-slate-400 font-normal">COP / mes</span></div>
                <p className="text-xs text-slate-400 mb-4">Solución integral para conjuntos residenciales con administración exigente.</p>
                
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 mb-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Simulador Clientes:</span>
                    <strong className="text-purple-400">{simProfesional} Edificios</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={simProfesional}
                    onChange={(e) => setSimProfesional(Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>

                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li>✓ Todo lo del Plan Esencial</li>
                  <li>✓ Tesorería, Cartera &amp; Caja Menor</li>
                  <li>✕ Bóveda Forense SHA-256</li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-400">Subtotal Simulado:</span>
                <span className="text-purple-400 font-bold">${(simProfesional * 650000).toLocaleString()} COP/mes</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-300 text-[10px] px-3 py-1 rounded-bl-xl font-bold">
                100+ Unidades / Mixtos
              </div>
              <div>
                <span className="text-emerald-400 text-xs font-bold block mb-1">PLAN ENTERPRISE / CORPORATIVO</span>
                <div className="text-2xl font-black text-white mb-2">$1,200,000 <span className="text-xs text-slate-400 font-normal">COP / mes</span></div>
                <p className="text-xs text-slate-400 mb-4">Para grandes copropiedades, centros comerciales y torres corporativas.</p>
                
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 mb-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Simulador Clientes:</span>
                    <strong className="text-emerald-400">{simEnterprise} Edificios</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={simEnterprise}
                    onChange={(e) => setSimEnterprise(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li>✓ Acceso Ilimitado a Todos los Módulos</li>
                  <li>✓ Bóveda SHA-256 &amp; Facturación DIAN UBL 2.1</li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-400">Subtotal Simulado:</span>
                <span className="text-emerald-400 font-bold">${(simEnterprise * 1200000).toLocaleString()} COP/mes</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-3 shadow-xl">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded">
                  [ RESULTADO DEL SIMULADOR DINÁMMICO ]
                </span>
                <h3 className="text-base font-bold text-white mt-1">MRR y ARR Simulado en Tiempo Real</h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-400">
                  ${(simEsencial * 250000 + simProfesional * 650000 + simEnterprise * 1200000).toLocaleString()} <span className="text-xs text-slate-400 font-normal">COP/mes</span>
                </div>
                <div className="text-xs text-purple-400 font-mono">
                  ARR Proyectado: ${((simEsencial * 250000 + simProfesional * 650000 + simEnterprise * 1200000) * 12).toLocaleString()} COP/año
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMÓDULO 3: FEATURE FLAGS */}
      {activeTab === 'feature_flags' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4 flex justify-between items-center flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded">
                [ GRANULAR FEATURE FLAGS &amp; OPERATIONAL MODULES ]
              </span>
              <h2 className="text-lg font-bold text-white mt-2">Control de Licenciamiento por Módulos y Operaciones de Campo</h2>
              <p className="text-xs text-slate-400">Controla en tiempo real qué edificios tienen habilitado el acceso a Portería, Aseo, Reservas, Residentes y Contabilidad.</p>
            </div>
            
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Edificio Activo de Prueba:</span>
              <select
                value={selectedTenantId}
                onChange={(e) => onSelectTenantId(e.target.value)}
                className="bg-slate-900 text-cyan-400 font-bold text-xs p-1.5 rounded border border-slate-700"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3.5">Copropiedad / NIT</th>
                  <th className="p-3.5 text-center">📊 Contable</th>
                  <th className="p-3.5 text-center">👥 Nómina</th>
                  <th className="p-3.5 text-center">🚨 Portería</th>
                  <th className="p-3.5 text-center">🧹 Aseo</th>
                  <th className="p-3.5 text-center">📅 Reservas</th>
                  <th className="p-3.5 text-center">🏠 Residentes</th>
                  <th className="p-3.5 text-center">🔒 Bóveda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tenants.map(t => {
                  const isCurrentActive = t.id === selectedTenantId;
                  return (
                    <tr key={t.id} className={`hover:bg-slate-950/40 transition-colors ${isCurrentActive ? 'bg-purple-950/20 border-l-2 border-purple-500' : ''}`}>
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          {t.name} {isCurrentActive && <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded">Activo Vista</span>}
                        </div>
                        <div className="text-[10px] text-slate-500">NIT: {t.nit}</div>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleFeatureFlag(t.id, 'contable')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            t.featureFlags.contable ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {t.featureFlags.contable ? '✓ On' : '✕ Off'}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleFeatureFlag(t.id, 'nomina')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            t.featureFlags.nomina ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {t.featureFlags.nomina ? '✓ On' : '✕ Off'}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleFeatureFlag(t.id, 'porteria')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            t.featureFlags.porteria ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {t.featureFlags.porteria ? '✓ On' : '✕ Off'}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleFeatureFlag(t.id, 'aseo')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            t.featureFlags.aseo ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {t.featureFlags.aseo ? '✓ On' : '✕ Off'}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleFeatureFlag(t.id, 'reservas')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            t.featureFlags.reservas ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {t.featureFlags.reservas ? '✓ On' : '✕ Off'}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleFeatureFlag(t.id, 'residente')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            t.featureFlags.residente ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {t.featureFlags.residente ? '✓ On' : '✕ Off'}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleFeatureFlag(t.id, 'boveda')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            t.featureFlags.boveda ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {t.featureFlags.boveda ? '✓ On' : '✕ Off'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBMÓDULO 4: SOPORTE & IMPERSONACIÓN */}
      {activeTab === 'support_impersonate' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl font-mono">
          <SoporteTecnicoImpersonacion onImpersonar={(tId, rol, unidad) => {
            const matched = tenants.find(t => t.id === tId || t.name.toLowerCase().includes(tId.toLowerCase()));
            if (matched) {
              handleExecuteImpersonate(matched);
            } else {
              onImpersonateAdmin(`Tenant ${tId} (${rol.toUpperCase()} - ${unidad || 'General'})`);
            }
          }} />

          <div className="border-b border-slate-800 pb-4 pt-4">
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded">
              [ TECHNICAL SUPPORT &amp; VIEW AS TENANT ]
            </span>
            <h2 className="text-lg font-bold text-white mt-2">Directorio de Soporte Técnico e Impersonación Segura</h2>
            <p className="text-xs text-slate-400">Accede como administrador a cualquier copropiedad cliente para soporte en vivo con registro de auditoría SHA-256.</p>
          </div>

          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3.5">Copropiedad / NIT</th>
                  <th className="p-3.5">Administrador A Cargo</th>
                  <th className="p-3.5">Plan / Estado</th>
                  <th className="p-3.5 text-right">Acción de Asistencia en Vivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-white text-sm">{t.name}</div>
                      <div className="text-[10px] text-slate-500">NIT: {t.nit} • {t.city}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-200">{t.adminName}</div>
                      <div className="text-[10px] text-cyan-400">{t.adminEmail}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-purple-400 font-bold">{t.plan}</div>
                      <div className="text-[10px] text-emerald-400">{t.status}</div>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleExecuteImpersonate(t)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-lg cursor-pointer"
                      >
                        🔍 Impersonar / Acceder como Admin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs text-amber-400 font-bold block">🔒 Bitácora Forense de Sesiones de Impersonación (Audit Trail):</span>
            <div className="space-y-2 max-h-60 overflow-y-auto text-[11px]">
              {impersonationLogs.map(log => (
                <div key={log.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <span className="text-cyan-400 font-bold">[{log.action}]</span> Visualizó a <strong className="text-white">{log.tenantName}</strong> (NIT: {log.nit})
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Root: {log.masterUser} • {log.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBMÓDULO 5: PASARELA DE PAGOS */}
      {activeTab === 'gateway' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl max-w-3xl mx-auto font-mono">
          <div>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded">
              [ AUTOMATED SUBSCRIPTION BILLING ]
            </span>
            <h2 className="text-lg font-bold text-white mt-2">Configuración de Pasarela de Pagos Global (SaaS B2B)</h2>
            <p className="text-xs text-slate-400">Cobro automático mensual recurrente de licencias a los administradores de los edificios.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <label className="text-xs text-slate-400 block">PASARELA ACTIVA:</label>
              <select
                value={gatewayProvider}
                onChange={(e) => {
                  setGatewayProvider(e.target.value as any);
                  onShowToast(`💳 Pasarela cambiada a ${e.target.value}`);
                }}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg text-xs"
              >
                <option value="Wompi Bancolombia">Wompi (Bancolombia - Colombia)</option>
                <option value="Stripe Global">Stripe (Global USD / COP)</option>
                <option value="PayU Latam">PayU Latam (PSE / Tarjetas)</option>
                <option value="PSE Corporativo">PSE Cuenta Maestra Corporativa</option>
              </select>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 block mb-1">DÉBITO AUTOMÁTICO RECURRENTE (CRON):</span>
                <span className="text-xs text-emerald-400 font-bold">Activo • Ejecución el día 1 de cada mes</span>
              </div>
              <button
                onClick={() => setAutoBillingEnabled(!autoBillingEnabled)}
                className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer ${
                  autoBillingEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {autoBillingEnabled ? '✓ Cobro Automático Habilitado' : '✕ Cobro Automático Deshabilitado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMÓDULO 6: GESTIÓN DE COBROS & DUNNING */}
      {activeTab === 'billing_dunning' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl font-mono">
          <SaaSCotizadorYSuspensionMaster
            tenants={tenants}
            onUpdateTenants={onUpdateTenants}
            onShowToast={onShowToast}
            onAppendAuditLog={onAppendAuditLog}
          />

          <div className="border-b border-slate-800 pb-4">
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded">
              [ 3. BILLING & DUNNING - SUSPENSIÓN AUTOMÁTICA ]
            </span>
            <h2 className="text-lg font-bold text-white mt-2">Control de Cobros, Facturación y Suspensión por Mora</h2>
            <p className="text-xs text-slate-400">Gestión de suscripciones B2B, automatización de avisos de cobro y bloqueo reactivo de módulos operativos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
               <span className="text-[10px] text-slate-400">MRR PLATAFORMA SAAS</span>
               <div className="text-xl font-black text-emerald-400">${metricas.mrrPlataforma.toLocaleString('es-CO')} COP</div>
               <span className="text-[10px] text-slate-500 font-mono">$2.000 × {metricas.totalUnidades} Unidades</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
               <span className="text-[10px] text-slate-400">SALUD FINANCIERA RECAUDO</span>
               <div className="text-xl font-black text-cyan-400">{metricas.saludFinanciera}</div>
               <span className="text-[10px] text-slate-500 font-mono">Recaudo Mes: {metricas.recaudoMes}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
               <span className="text-[10px] text-slate-400">UNIDADES REGISTRADAS</span>
               <div className="text-xl font-black text-purple-400">{metricas.totalUnidades} Aptos</div>
               <span className="text-[10px] text-slate-500 font-mono">Copropiedad_PH &amp; Red PH</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
               <span className="text-[10px] text-slate-400">INSTANCIAS / TENANTS ACTIVOS</span>
               <div className="text-xl font-black text-white">{metricas.instanciasActivas} Copropiedades</div>
               <span className="text-[10px] text-slate-500 font-mono">{tenantsReales.length > 0 ? `${tenantsReales.length} en Supabase` : 'Cargando...'}</span>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono uppercase text-slate-400">
                Copropiedades Conectadas & Facturación DIAN
              </span>
              <span className="text-xs px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full font-mono">
                {tenantsReales.length} Instancia(s) Activa(s)
              </span>
            </div>

            {tenantsReales.map((tenant) => (
              <div 
                key={tenant.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">{tenant.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">
                      Plan {tenant.plan || 'Pro'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {tenant.units_count || 100} Unidades
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold font-mono text-slate-100 text-sm">
                    ${(Number(tenant.total_monthly_budget) || 30000000).toLocaleString('es-CO')} / mes
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">Al día ✓</span>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-3">Copropiedad</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Fecha Corte</th>
                  <th className="p-3">Estado Financiero</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tenants.map(t => (
                  <tr key={t.id}>
                    <td className="p-3 text-white font-bold">{t.name}<div className="text-[10px] text-slate-500 font-normal">NIT: {t.nit}</div></td>
                    <td className="p-3 text-slate-300">{t.plan}</td>
                    <td className="p-3 text-slate-300">{t.cutOffDate}</td>
                    <td className="p-3">
                      <select
                        value={t.financialStatus}
                        onChange={(e) => handleUpdateTenantFinancialStatus(t.id, e.target.value as any)}
                        className={`font-bold p-1 rounded cursor-pointer ${t.financialStatus === 'En Mora' ? 'bg-red-950 text-red-400' : t.financialStatus === 'Próximo a Vencer' ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400'}`}
                      >
                        <option value="Al Día">Al Día</option>
                        <option value="Próximo a Vencer">Próximo a Vencer</option>
                        <option value="En Mora">En Mora</option>
                      </select>
                    </td>
                    <td className="p-3 text-right space-x-2">
                       <button onClick={() => onShowToast(`💳 Simulando pago para ${t.name}...`)} className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded cursor-pointer">Simular Pago</button>
                       <button onClick={() => onShowToast(`📢 Aviso de cobro enviado a ${t.adminEmail}`)} className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded cursor-pointer">Forzar Aviso</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBMÓDULO 7: INFRAESTRUCTURA & SERVIDORES CLOUD */}
      {activeTab === 'infrastructure' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl max-w-3xl mx-auto font-mono">
          <div>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded">
              [ CLOUD INFRASTRUCTURE &amp; SECURITY ]
            </span>
            <h2 className="text-lg font-bold text-white mt-2">Monitoreo de Servidores en la Nube (Supabase &amp; Vercel)</h2>
            <p className="text-xs text-slate-400">Estado de clústeres PostgreSQL, políticas RLS y latencia global.</p>
          </div>

          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400">Endpoint Supabase Primario:</span>
              <span className="text-cyan-400 font-bold font-mono">https://bhowrovxddvaykffwbbz.supabase.co</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400">Cluster PostgreSQL (Supabase Us-West2):</span>
              <span className="text-emerald-400 font-bold">🟢 Conectado y Blindado</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400">Políticas RLS (Row Level Security):</span>
              <span className="text-emerald-400 font-bold">🔒 Activas para {tenants.length} Copropiedades</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400">Replicación en Tiempo Real (WebSocket):</span>
              <span className="text-emerald-400 font-bold">⚡ Canal postgres_changes Habilitado</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Backups Automáticos &amp; Auditoría:</span>
              <span className="text-cyan-400 font-bold">✓ Cifrados AES-256 + SHA-256</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXPLORACIÓN DE MÉTRICAS */}
      {activeModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl font-mono text-xs">
            {activeModalCard === 'mrr_rec' && (
              <>
                <div className="p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded font-bold">
                      [ TARJETA 1: INGRESOS RECURRENTES Y ARR ANUALIZADO ]
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">MRR: $1.380.000 COP/mes — ARR: $16.560.000 COP</h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">Desglose por planes Enterprise vs. Estándar y proyección trimestral.</p>
                  </div>
                  <button onClick={() => setActiveModalCard(null)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 font-bold cursor-pointer">✕ Cerrar</button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] text-slate-200">
                  <div className="space-y-2">
                    <span className="text-[11px] text-emerald-400 font-bold block">🏢 DESGLOSE DE CANON MENSUAL POR COPROPIEDAD:</span>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">Copropiedad Principal PH (Plan Enterprise)</div>
                        <div className="text-[10px] text-slate-400">120 Unidades • NIT: 900.842.115-2</div>
                      </div>
                      <span className="text-emerald-400 font-bold">$1.200.000 COP/mes</span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">Edificio Torre El Poblado (Plan Estándar)</div>
                        <div className="text-[10px] text-slate-400">45 Unidades • NIT: 811.025.993-8</div>
                      </div>
                      <span className="text-cyan-400 font-bold">$180.000 COP/mes</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeModalCard === 'coprop_suscritas' && (
              <>
                <div className="p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded font-bold">
                      [ TARJETA 2: DIRECTORIO DE CLIENTES ACTIVO ]
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">Copropiedades Suscritas (3 Clientes SaaS)</h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">Fichas técnicas, membresía y acceso a soporte técnico.</p>
                  </div>
                  <button onClick={() => setActiveModalCard(null)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 font-bold cursor-pointer">✕ Cerrar</button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] text-slate-200">
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-white">1. Copropiedad Registrada PH</div>
                          <div className="text-[11px] text-slate-400">NIT: 900.842.115-2 • 120 Unidades • Admin: Carlos Mario Pineda</div>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded font-bold text-[10px]">Al Día 🟢</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                        <span className="text-[10px] text-slate-400">Membresía SaaS Activa • Paz y Salvo Verificado</span>
                        <button onClick={() => { setActiveModalCard(null); onImpersonateAdmin('Copropiedad PH'); }} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-[10px] cursor-pointer">🛠️ Soporte</button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeModalCard === 'dian_facturacion' && (
              <>
                <div className="p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded font-bold">
                      [ TARJETA 3: FACTURACIÓN SAAS ]
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">Facturación SaaS y Recaudo</h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">Control de emisión y estado de pago de las cuotas del software.</p>
                  </div>
                  <button onClick={() => setActiveModalCard(null)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 font-bold cursor-pointer">✕ Cerrar</button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] text-slate-200">
                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono uppercase text-slate-400">
                        Copropiedades Conectadas & Facturación DIAN
                      </span>
                      <span className="text-xs px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full font-mono">
                        {tenantsReales.length} Instancia(s) Activa(s)
                      </span>
                    </div>

                    {tenantsReales.map((tenant) => (
                      <div 
                        key={tenant.id}
                        className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm">{tenant.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">
                              Plan {tenant.plan || 'Pro'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {tenant.units_count || 100} Unidades
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold font-mono text-slate-100 text-sm">
                            ${(Number(tenant.total_monthly_budget) || 30000000).toLocaleString('es-CO')} / mes
                          </div>
                          <span className="text-[11px] text-emerald-400 font-medium">Al día ✓</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setActiveModalCard(null)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
