import React, { useState } from 'react';
import { 
  HardHat, Plus, ShieldCheck, ShieldAlert, Wrench, 
  Calendar, Phone, FileCheck, CheckCircle2, AlertTriangle, 
  Building2, UserCheck, DollarSign, Search 
} from 'lucide-react';

export interface ContractorItem {
  id: string;
  businessName: string;
  nit: string;
  specialty: string;
  contactName: string;
  phone: string;
  arl: string;
  arlValidUntil: string;
  arlActive: boolean;
  heightsCert: boolean;
  sharedCorporate: boolean;
}

export interface ExternalWorkOrder {
  id: string;
  title: string;
  contractorName: string;
  specialty: string;
  area: string;
  date: string;
  workers: string;
  cost: number;
  arlVerified: boolean;
  gatehouseAuthorized: boolean;
  status: string;
}

export interface ContractorsModuleProps {
  tenantName?: string;
  onShowToast?: (msg: string) => void;
}

export default function ContractorsModule({
  tenantName = "Reserva del Tesoro",
  onShowToast
}: ContractorsModuleProps) {
  const [subTab, setSubTab] = useState<'orders' | 'directory'>('orders'); // 'orders' | 'directory'
  const [showNewModal, setShowNewModal] = useState(false);

  // Directorio de contratistas externos con validación SG-SST (ARL)
  const [contractors, setContractors] = useState<ContractorItem[]>([
    {
      id: 'con-1',
      businessName: 'Hidráulicas y Redes Antioquia S.A.S.',
      nit: '901.234.567-8',
      specialty: 'Plomería y Tuberías de Presión',
      contactName: 'Ingeniero Carlos Ruiz',
      phone: '300 456 7890',
      arl: 'ARL SURA (Riesgo V)',
      arlValidUntil: '2026-11-15',
      arlActive: true,
      heightsCert: true,
      sharedCorporate: true
    },
    {
      id: 'con-2',
      businessName: 'Acabados & Pisos El Poblado',
      nit: '71.345.678-9',
      specialty: 'Obra Civil, Pisos y Enchapes',
      contactName: 'Maestro Hernán Darío Gómez',
      phone: '311 890 1234',
      arl: 'ARL Positiva (Riesgo IV)',
      arlValidUntil: '2026-11-05',
      arlActive: true,
      heightsCert: false,
      sharedCorporate: false
    },
    {
      id: 'con-3',
      businessName: 'Impermeabilizaciones Verticales',
      nit: '900.998.112-3',
      specialty: 'Fachadas y Cubiertas',
      contactName: 'Julián Montoya',
      phone: '314 222 3344',
      arl: 'ARL SURA (Riesgo V)',
      arlValidUntil: '2026-10-10', // Vencida
      arlActive: false,
      heightsCert: true,
      sharedCorporate: true
    }
  ]);

  // Órdenes de trabajo externas conectadas con portería
  const [workOrders, setWorkOrders] = useState<ExternalWorkOrder[]>([
    {
      id: 'OT-2026-041',
      title: 'Sustitución de tubería PVC 4" colector aguas lluvias',
      contractorName: 'Hidráulicas y Redes Antioquia S.A.S.',
      specialty: 'Plomería y Tuberías',
      area: 'Sótano 1 - Buitrón Torre 2',
      date: '29 Octubre 2026 • 8:00 AM',
      workers: 'Carlos Ruiz (CC 71.234.555), Mario Soto (CC 1.037.888.999)',
      cost: 2450000,
      arlVerified: true,
      gatehouseAuthorized: true,
      status: 'Programada'
    },
    {
      id: 'OT-2026-042',
      title: 'Nivelación y cambio de porcelanato fracturado en acceso peatonal',
      contractorName: 'Acabados & Pisos El Poblado',
      specialty: 'Obra Civil y Pisos',
      area: 'Lobby Principal',
      date: '30 Octubre 2026 • 9:00 AM',
      workers: 'Hernán Darío Gómez (CC 70.111.222)',
      cost: 890000,
      arlVerified: true,
      gatehouseAuthorized: true,
      status: 'En Ejecución'
    }
  ]);

  // Formulario rápido para nuevo contratista
  const [newContractor, setNewContractor] = useState({
    businessName: '',
    nit: '',
    specialty: 'Plomería y Tuberías',
    contactName: '',
    phone: '',
    arl: 'ARL SURA',
    arlValidUntil: ''
  });

  const handleAddContractor = (e: React.FormEvent) => {
    e.preventDefault();
    const isArlValid = new Date(newContractor.arlValidUntil) >= new Date();
    const created: ContractorItem = {
      id: `con-${Date.now()}`,
      ...newContractor,
      arlActive: isArlValid,
      heightsCert: false,
      sharedCorporate: false
    };
    setContractors([created, ...contractors]);
    setShowNewModal(false);
    setNewContractor({
      businessName: '', nit: '', specialty: 'Plomería y Tuberías',
      contactName: '', phone: '', arl: 'ARL SURA', arlValidUntil: ''
    });
    onShowToast?.(`Contratista "${created.businessName}" registrado en ${tenantName}`);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* ENCABEZADO Y CUMPLIMIENTO SG-SST */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full">
              Decreto 1072 (SG-SST) • Ley 675
            </span>
            <span className="text-xs text-slate-400">Proveedores Externos • {tenantName}</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Contratistas, Obras y Seguridad Social</h2>
          <p className="text-xs text-slate-400">
            Control de reparaciones locativas (tuberías, pisos, ascensores), validación de ARL y pase directo a portería.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Contratista
          </button>
        </div>
      </div>

      {/* SUB-NAVEGACIÓN */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setSubTab('orders')}
            className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
              subTab === 'orders' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            🛠️ Órdenes de Trabajo Activas ({workOrders.length})
          </button>
          <button
            onClick={() => setSubTab('directory')}
            className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
              subTab === 'directory' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            👷 Directorio y Control ARL ({contractors.length})
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Sincronizado en tiempo real con la Consola del Vigilante</span>
        </div>
      </div>

      {/* ====================================================================
          VISTA 1: ÓRDENES DE TRABAJO Y AUTORIZACIÓN A PORTERÍA
         ==================================================================== */}
      {subTab === 'orders' && (
        <div className="grid grid-cols-1 gap-4">
          {workOrders.map((order) => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-slate-700 transition">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {order.id}
                  </span>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                    {order.specialty}
                  </span>
                  {order.arlVerified && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Planilla ARL Verificada
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-black text-white">{order.title}</h3>
                <p className="text-xs text-slate-300">
                  <strong>Contratista:</strong> {order.contractorName} • <strong>Zona:</strong> {order.area}
                </p>
                <p className="text-[11px] text-slate-400">
                  👷 <strong>Personal autorizado en portería:</strong> {order.workers}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>📅 {order.date}</span>
                  <span className="font-bold text-white">💰 Presupuesto: ${order.cost.toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-2 shrink-0">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                  order.gatehouseAuthorized 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {order.gatehouseAuthorized ? '✓ Ingreso Autorizado en Portería' : '✕ Bloqueado en Portería'}
                </span>

                <button
                  onClick={() => {
                    setWorkOrders(workOrders.map(w => 
                      w.id === order.id ? { ...w, gatehouseAuthorized: !w.gatehouseAuthorized } : w
                    ));
                    onShowToast?.(
                      !order.gatehouseAuthorized
                        ? `✓ Ingreso autorizado en Portería para ${order.id}`
                        : `✕ Permiso revocado en Portería para ${order.id}`
                    );
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition border border-slate-700 cursor-pointer"
                >
                  {order.gatehouseAuthorized ? 'Revocar Permiso Portería' : 'Autorizar en Portería'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================================
          VISTA 2: DIRECTORIO DE CONTRATISTAS Y SEMÁFORO DE SEGURIDAD SOCIAL
         ==================================================================== */}
      {subTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractors.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-950 text-emerald-400 border border-slate-800">
                    {c.specialty}
                  </span>
                  {c.sharedCorporate && (
                    <span className="text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded">
                      Homologado Firma
                    </span>
                  )}
                </div>

                <h4 className="text-base font-black text-white pt-1">{c.businessName}</h4>
                <p className="text-xs text-slate-400">NIT/CC: {c.nit}</p>

                <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800/80">
                  <p>👤 <strong>Contacto:</strong> {c.contactName}</p>
                  <p>📞 <strong>Teléfono:</strong> {c.phone}</p>
                  <p>🛡️ <strong>Aseguradora:</strong> {c.arl}</p>
                </div>
              </div>

              {/* Semáforo Legal de ARL */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                c.arlActive 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div>
                  <p className="font-bold">
                    {c.arlActive ? '✓ Seguridad Social Vigente' : '⚠️ Planilla ARL Vencida'}
                  </p>
                  <p className="text-[10px] opacity-80">Vence: {c.arlValidUntil}</p>
                </div>
                {!c.arlActive && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================================
          MODAL PARA AGREGAR NUEVO CONTRATISTA EXTERNO
         ==================================================================== */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Registrar Contratista Externo</h3>
            <p className="text-xs text-slate-400">
              Verifica la fecha de vencimiento de su planilla de aportes (EPS y ARL) antes de autorizar trabajos en la unidad.
            </p>

            <form onSubmit={handleAddContractor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1">Empresa o Nombre del Contratista</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Soluciones Hidráulicas del Sur"
                  value={newContractor.businessName}
                  onChange={(e) => setNewContractor({ ...newContractor, businessName: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">NIT o Cédula</label>
                  <input
                    type="text"
                    required
                    placeholder="900.123.456-1"
                    value={newContractor.nit}
                    onChange={(e) => setNewContractor({ ...newContractor, nit: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Especialidad</label>
                  <select
                    value={newContractor.specialty}
                    onChange={(e) => setNewContractor({ ...newContractor, specialty: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  >
                    <option>Plomería y Tuberías</option>
                    <option>Obra Civil y Pisos</option>
                    <option>Redes Eléctricas</option>
                    <option>Mantenimiento Ascensores</option>
                    <option>Impermeabilización / Fachadas</option>
                    <option>Jardinería y Podas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Persona Encargada</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del técnico"
                    value={newContractor.contactName}
                    onChange={(e) => setNewContractor({ ...newContractor, contactName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="300 000 0000"
                    value={newContractor.phone}
                    onChange={(e) => setNewContractor({ ...newContractor, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Aseguradora ARL</label>
                  <input
                    type="text"
                    required
                    placeholder="ARL SURA / Positiva"
                    value={newContractor.arl}
                    onChange={(e) => setNewContractor({ ...newContractor, arl: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Vigencia Planilla ARL</label>
                  <input
                    type="date"
                    required
                    value={newContractor.arlValidUntil}
                    onChange={(e) => setNewContractor({ ...newContractor, arlValidUntil: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl cursor-pointer"
                >
                  Guardar Contratista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
