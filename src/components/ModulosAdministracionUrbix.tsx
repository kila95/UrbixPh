import React, { useState } from 'react';
import { MessageSquare, FileText, HardHat, DollarSign, Wrench, Shield, Users, Building2 } from 'lucide-react';
import WhatsAppConfigCard from './WhatsAppConfigCard';
import ModuloTesoreriaOCR from './ModuloTesoreriaOCR';
import ModuloTesoreriaExogenaReal from './ModuloTesoreriaExogenaReal';
import ModuloMantenimientoReal from './ModuloMantenimientoReal'; // El componente real que acabamos de estructurar

export default function ModulosAdministracionUrbix({ tenantName, onShowToast }: { tenantName?: string; onShowToast?: (msg: string) => void }) {
  const [subModuloActivo, setSubModuloActivo] = useState<string>('general');

  // Lista oficial de submódulos en la barra horizontal
  const submódulosLista = [
    { id: 'general', label: 'General (Portafolio & Macro-Salud)', icon: Building2 },
    { id: 'asambleas', label: 'Asambleas & Actas Legales (Ley 675)', icon: FileText },
    { id: 'contratistas', label: 'Contratistas & Obras (SG-SST)', icon: HardHat },
    { id: 'tesoreria', label: 'Tesorería, OCR & Exógena DIAN', icon: DollarSign },
    { id: 'mantenimiento', label: 'Mantenimiento & Órdenes', icon: Wrench }, // Submódulo Mantenimiento Real
    { id: 'porteria', label: 'Portería & Minuta (Tiempo Real)', icon: Shield },
    { id: 'personal', label: 'Personal & Staff', icon: Users },
    { id: 'whatsapp', label: 'Notificaciones WhatsApp', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* BARRA DE NAVEGACIÓN HORIZONTAL DINÁMICA (SCROLL FLUIDO) */}
      <div className="bg-[#0F172A] border border-slate-800 p-2.5 rounded-2xl shadow-xl">
        <div className="urbix-tabs-scrollbar flex items-center gap-2 overflow-x-auto py-1 px-1">
          {submódulosLista.map((mod) => {
            const IconComponent = mod.icon;
            const isActive = subModuloActivo === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setSubModuloActivo(mod.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-950/40 border border-cyan-400/40'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDERIZADO DEL SUBMÓDULO SELECCIONADO */}
      <div className="transition-all duration-300">
        {subModuloActivo === 'mantenimiento' ? (
          <ModuloMantenimientoReal tenantId="t1" onShowToast={onShowToast} />
        ) : subModuloActivo === 'tesoreria' ? (
          <div className="space-y-6">
            <ModuloTesoreriaExogenaReal tenantId="t1" onShowToast={onShowToast} />
            <ModuloTesoreriaOCR tenantId="t1" onShowToast={onShowToast} />
          </div>
        ) : subModuloActivo === 'whatsapp' ? (
          <WhatsAppConfigCard tenantName={tenantName} onShowToast={onShowToast} />
        ) : (
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-mono text-xs shadow-xl">
            Panel operativo del submódulo: <strong className="text-cyan-300 uppercase">{subModuloActivo}</strong> activo y sincronizado.
          </div>
        )}
      </div>

    </div>
  );
}
