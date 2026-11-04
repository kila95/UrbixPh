import React, { useState } from 'react';
import { 
  LayoutDashboard, Building, ShieldCheck, HardHat, FileText, 
  Video, Scale, DollarSign, Users, Bell, LogOut, ChevronRight, 
  Menu, X, Sparkles, FolderLock, Sliders, Wrench, Package, 
  Home, Calendar, QrCode, PhoneCall, Paintbrush, Box, Clock
} from 'lucide-react';

export type ModuloActivo = 
  // Admin Modules
  | 'tablero'
  | 'unidades'
  | 'garita'
  | 'contratistas'
  | 'remodelaciones'
  | 'polizas'
  | 'asamblea'
  | 'pqrs_actas'
  | 'cartera'
  | 'nomina'
  // Supervisor Modules
  | 'sup_dashboard'
  | 'sup_frecuencias'
  | 'sup_ordenes'
  | 'sup_contratistas'
  | 'sup_rondas'
  | 'sup_novedades'
  // Portería / Vigilante Modules
  | 'port_control'
  | 'port_qr'
  | 'port_encomiendas'
  | 'port_citofono'
  | 'port_rondas'
  // Aseo & Mantenimiento Modules
  | 'aseo_checklist'
  | 'aseo_mantenimiento'
  | 'aseo_bodega'
  | 'aseo_preventivo'
  // Residente Modules
  | 'res_portal'
  | 'res_qr'
  | 'res_reservas'
  | 'res_citofono'
  | 'res_asamblea';

interface Props {
  userProfile?: {
    full_name?: string;
    role?: string;
    email?: string;
    unit_number?: string;
  };
  copropiedadNombre?: string;
  moduloActivo: ModuloActivo;
  onSelectModulo: (modulo: ModuloActivo) => void;
  onSwitchRole?: (role: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function MainAppLayout({
  userProfile = { full_name: 'Administrador General', role: 'admin', email: 'admin@copropiedad.com' },
  copropiedadNombre = 'Urb. Tricentenario',
  moduloActivo,
  onSelectModulo,
  onSwitchRole,
  onLogout,
  children
}: Props) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const rawRole = (userProfile.role || 'admin').toLowerCase();
  const isSupervisor = rawRole.includes('supervisor');
  const isPorteria = rawRole.includes('porteria') || rawRole.includes('vigilante');
  const isAseo = rawRole.includes('aseo') || rawRole.includes('servicios') || rawRole.includes('mantenimiento');
  const isResidente = rawRole.includes('residente');

  // Menús organizados dinámicamente por Rol
  const getGruposNavegacion = () => {
    if (isSupervisor) {
      return [
        {
          titulo: 'SUPERVISIÓN OPERATIVA',
          items: [
            { id: 'sup_dashboard', label: 'Consola Supervisor', icon: Sliders },
            { id: 'sup_frecuencias', label: 'Frecuencias de Aseo', icon: Sparkles },
            { id: 'sup_ordenes', label: 'Órdenes de Mantenimiento', icon: Wrench },
            { id: 'sup_contratistas', label: 'Verificación ARL & Obras', icon: HardHat },
          ]
        },
        {
          titulo: 'SEGURIDAD & CAMPO',
          items: [
            { id: 'sup_rondas', label: 'Minuta & Rondas Digitales', icon: ShieldCheck },
            { id: 'sup_novedades', label: 'Reportes & Novedades', icon: Building },
          ]
        }
      ];
    }

    if (isPorteria) {
      return [
        {
          titulo: 'GARITA & CONTROL DE ACCESOS',
          items: [
            { id: 'port_control', label: 'Control de Cédulas & Accesos', icon: ShieldCheck },
            { id: 'port_qr', label: 'Pases QR Visitantes', icon: QrCode },
            { id: 'port_encomiendas', label: 'Encomiendas en Custodia', icon: Package },
            { id: 'port_citofono', label: 'Citófono Virtual', icon: PhoneCall },
            { id: 'port_rondas', label: 'Minuta & Bitácora', icon: FileText },
          ]
        }
      ];
    }

    if (isAseo) {
      return [
        {
          titulo: 'ASEO, OFICIOS VARIOS & MANTENIMIENTO',
          items: [
            { id: 'aseo_checklist', label: 'Checklist Aseo & Desinfección', icon: Sparkles },
            { id: 'aseo_mantenimiento', label: 'Oficios Varios & Pintura', icon: Paintbrush },
            { id: 'aseo_bodega', label: 'Inventario Bodega PH', icon: Box },
            { id: 'aseo_preventivo', label: 'Cronograma Preventivo', icon: Clock },
          ]
        }
      ];
    }

    if (isResidente) {
      return [
        {
          titulo: 'PORTAL MI HOGAR',
          items: [
            { id: 'res_portal', label: 'Mi Apartamento', icon: Home },
            { id: 'res_qr', label: 'Generar Pase QR', icon: QrCode },
            { id: 'res_reservas', label: 'Reservar Zonas Comunes', icon: Calendar },
            { id: 'res_citofono', label: 'Citófono & Atención', icon: PhoneCall },
            { id: 'res_asamblea', label: 'Asamblea Virtual', icon: Video },
          ]
        }
      ];
    }

    // Default: Admin / Master Owner
    return [
      {
        titulo: 'GESTIÓN DIARIA & GARITA',
        items: [
          { id: 'tablero', label: 'Tablero General', icon: LayoutDashboard },
          { id: 'unidades', label: 'Censo & Inmuebles', icon: Building },
          { id: 'garita', label: 'Control de Portería', icon: ShieldCheck },
        ]
      },
      {
        titulo: 'OBRAS & SG-SST',
        items: [
          { id: 'contratistas', label: 'Contratistas & ARL', icon: HardHat },
          { id: 'remodelaciones', label: 'Reformas & Depósitos', icon: FolderLock },
          { id: 'polizas', label: 'Pólizas & Garantías', icon: FileText },
        ]
      },
      {
        titulo: 'LEGAL & REUNIONES',
        items: [
          { id: 'asamblea', label: 'Asamblea en Vivo', icon: Video },
          { id: 'pqrs_actas', label: 'PQRS & Actas IA', icon: Scale },
        ]
      },
      {
        titulo: 'FINANCIERO & NÓMINA',
        items: [
          { id: 'cartera', label: 'Cartera & Pagos', icon: DollarSign },
          { id: 'nomina', label: 'Liquidación Nómina', icon: Users },
        ]
      }
    ];
  };

  const gruposNavegacion = getGruposNavegacion();

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex font-sans antialiased overflow-hidden select-none">
      
      {/* 1. SIDEBAR LATERAL FIJO */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#0F172A] border-r border-slate-800/80 flex flex-col justify-between 
        transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
        ${sidebarAbierto ? 'translate-x-0' : '-translate-x-0 max-lg:-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          
          {/* Cabecera Sidebar: Marca Urbix PH */}
          <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-sm">
                U
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">Urbix</span>
                <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                  PH
                </span>
              </div>
            </div>

            <button 
              onClick={() => setSidebarAbierto(false)} 
              className="lg:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Rol Rápido en Sidebar */}
          {onSwitchRole && (
            <div className="px-3 py-2 bg-[#0b101d] border-b border-slate-800/80">
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
                VISTA OPERATIVA DEL ROL:
              </span>
              <select
                value={userProfile.role || 'admin'}
                onChange={(e) => onSwitchRole(e.target.value)}
                className="w-full bg-[#131b2e] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono font-bold outline-none cursor-pointer"
              >
                <option value="admin">🛡️ Administrador PH</option>
                <option value="supervisor">⚡ Supervisor Operativo</option>
                <option value="porteria">🚨 Vigilante / Portería</option>
                <option value="aseo">🧹 Aseo & Servicios</option>
                <option value="residente">🏡 Residente (Torre 2 - 301)</option>
              </select>
            </div>
          )}

          {/* Lista de Módulos con scroll */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {gruposNavegacion.map((grupo, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="px-3 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                  {grupo.titulo}
                </span>

                <div className="space-y-0.5 pt-1">
                  {grupo.items.map((item) => {
                    const Icono = item.icon;
                    const esActivo = moduloActivo === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectModulo(item.id as ModuloActivo);
                          setSidebarAbierto(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                          esActivo
                            ? 'bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icono className={`w-4 h-4 ${esActivo ? 'text-cyan-400' : 'text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                        {esActivo && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Tarjeta inferior del Usuario / Sesión */}
          <div className="p-3 border-t border-slate-800/80 bg-[#0c1322]">
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 transition">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-cyan-300 shrink-0">
                  {userProfile.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'AD'}
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {userProfile.full_name}
                  </p>
                  <p className="text-[10px] font-mono text-cyan-400 capitalize truncate">
                    {userProfile.role || 'Administrador'}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer shrink-0"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* 2. ÁREA DE TRABAJO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Cabecera Superior Fija */}
        <header className="h-16 bg-[#0F172A] border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarAbierto(true)}
              className="lg:hidden p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {copropiedadNombre}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SISTEMA EN LÍNEA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Consola Operativa • Rol: <strong className="text-cyan-400 uppercase font-mono">{userProfile.role}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notificaciones */}
            <button className="p-2 bg-[#1E293B] hover:bg-slate-700/60 border border-slate-700/80 text-slate-300 rounded-xl transition relative cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1.5 right-1.5" />
            </button>

            {/* Badge de Seguridad Legal */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>LEY 675 / HAB. DATA</span>
            </div>
          </div>

        </header>

        {/* 3. LIENZO DINÁMICO DE CONTENIDO (Scroll independiente) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#090D16]">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
}
