import React, { useState } from 'react';
import { 
  ClipboardCheck, Send, DollarSign, Camera, 
  CheckCircle2, AlertTriangle, ShieldCheck, MessageCircle, 
  Search, Eye, UploadCloud, BellRing, Building2, X, Plus, LogOut
} from 'lucide-react';

export interface PaymentVoucherItem {
  id: string;
  unit: string;
  resident: string;
  amount: number;
  bank: string;
  ref: string;
  date: string;
  registeredBy: string;
  status: 'Pendiente Verificación' | 'Aprobado Conciliado';
}

export interface TechnicalInspectionItem {
  id: string;
  date: string;
  type: string;
  inspector: string;
  score: number;
  findingsCount: number;
  criticalNote: string;
  status: 'Atención Requerida' | 'Completada';
  photos?: string[];
}

export interface SupervisorOpsHubProps {
  tenantName?: string;
  onReconcilePayment?: (voucher: PaymentVoucherItem) => void;
  onNotify?: (message: string) => void;
  user?: { name: string; role: string; email?: string };
  onSwitchRole?: (role: 'superadmin' | 'administrador' | 'supervisor' | 'vigilante') => void;
  onLogout?: () => void;
  isReadOnly?: boolean;
}

export default function SupervisorOpsHub({
  tenantName = 'Copropiedad PH',
  onReconcilePayment,
  onNotify,
  user,
  onSwitchRole,
  onLogout,
  isReadOnly = false
}: SupervisorOpsHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<'payments' | 'inspections' | 'broadcast'>('payments');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const triggerNotice = (msg: string) => {
    setFeedbackBanner(msg);
    onNotify?.(msg);
    setTimeout(() => setFeedbackBanner(null), 4500);
  };

  // 1. ESTADO: BANDEJA DE COMPROBANTES DE PAGO
  const [vouchers, setVouchers] = useState<PaymentVoucherItem[]>([
    {
      id: 'VOUCH-101',
      unit: 'Apto 402',
      resident: 'Mauricio Restrepo',
      amount: 450000,
      bank: 'Bancolombia App',
      ref: 'TRANS-998823',
      date: 'Hoy, 09:15 AM',
      registeredBy: 'Supervisor en Terreno',
      status: 'Pendiente Verificación'
    },
    {
      id: 'VOUCH-102',
      unit: 'Apto 201',
      resident: 'Carolina Echeverri',
      amount: 1350000,
      bank: 'Transferencia PSE',
      ref: 'PSE-0044129',
      date: 'Ayer, 04:30 PM',
      registeredBy: 'Residente / Portería',
      status: 'Pendiente Verificación'
    }
  ]);

  // Modal de visualización de comprobante
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucherItem | null>(null);
  // Modal para registrar un nuevo comprobante en terreno
  const [showNewVoucherModal, setShowNewVoucherModal] = useState(false);
  const [newVoucherForm, setNewVoucherForm] = useState({
    unit: '',
    resident: '',
    amount: '',
    bank: 'Bancolombia App',
    ref: ''
  });

  // 2. ESTADO: RONDAS DE INSPECCIÓN TÉCNICA
  const [inspections, setInspections] = useState<TechnicalInspectionItem[]>([
    {
      id: 'INSP-084',
      date: '28 Octubre 2026',
      type: 'Ronda Semanal Zonas Comunes',
      inspector: 'Carlos Gómez (Supervisor)',
      score: 4.2,
      findingsCount: 2,
      criticalNote: 'Fisura en baldosa de lobby y bombillo fundido en torre 1 piso 4.',
      status: 'Atención Requerida',
      photos: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80'
      ]
    },
    {
      id: 'INSP-083',
      date: '24 Octubre 2026',
      type: 'Inspección de Bombas y Redes',
      inspector: 'Carlos Gómez (Supervisor)',
      score: 5.0,
      findingsCount: 0,
      criticalNote: 'Presión hidroneumática en 60 PSI estable. Tanques sin sedimentos.',
      status: 'Completada',
      photos: [
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80'
      ]
    }
  ]);

  const [selectedInspection, setSelectedInspection] = useState<TechnicalInspectionItem | null>(null);
  const [showNewInspectionModal, setShowNewInspectionModal] = useState(false);
  const [newInspectionForm, setNewInspectionForm] = useState({
    type: 'Ronda Técnica de Equipos y Zonas Comunes',
    inspector: 'Carlos Gómez (Supervisor)',
    score: '4.8',
    findingsCount: '1',
    criticalNote: ''
  });

  // 3. ESTADO: COMUNICADOS MASIVOS
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState('WhatsApp / SMS');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [sentBroadcasts, setSentBroadcasts] = useState<
    { id: string; title: string; channel: string; date: string; recipients: string }[]
  >([
    {
      id: 'CIR-901',
      title: 'Mantenimiento preventivo de motobombas Torre 1 y 2',
      channel: 'WhatsApp / SMS',
      date: '26 Oct 2026, 10:00 AM',
      recipients: '84 propietarios'
    }
  ]);

  // Acción: Conciliar y Aprobar Pago
  const handleApprovePayment = (id: string) => {
    if (isReadOnly) {
      alert("Acción denegada: Estás en Modo Supervisión Técnica (Solo Lectura). El dueño del software no puede modificar saldos contables.");
      return;
    }
    const target = vouchers.find(v => v.id === id);
    setVouchers(vouchers.map(v => v.id === id ? { ...v, status: 'Aprobado Conciliado' } : v));
    if (target) {
      onReconcilePayment?.({ ...target, status: 'Aprobado Conciliado' });
    }
    if (selectedVoucher?.id === id) {
      setSelectedVoucher(prev => prev ? { ...prev, status: 'Aprobado Conciliado' } : null);
    }
    triggerNotice('Comprobante verificado con éxito. El saldo de cartera se actualizó y se expidió el recibo de caja digital.');
  };

  // Acción: Registrar nuevo comprobante en terreno
  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherForm.unit.trim() || !newVoucherForm.resident.trim() || !newVoucherForm.amount) return;
    const created: PaymentVoucherItem = {
      id: `VOUCH-${Math.floor(103 + Math.random() * 890)}`,
      unit: newVoucherForm.unit.trim(),
      resident: newVoucherForm.resident.trim(),
      amount: Number(newVoucherForm.amount) || 450000,
      bank: newVoucherForm.bank,
      ref: newVoucherForm.ref.trim() || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      date: 'Hoy, Justo ahora',
      registeredBy: 'Supervisor en Terreno',
      status: 'Pendiente Verificación'
    };
    setVouchers([created, ...vouchers]);
    setNewVoucherForm({ unit: '', resident: '', amount: '', bank: 'Bancolombia App', ref: '' });
    setShowNewVoucherModal(false);
    triggerNotice(`Comprobante ${created.ref} de ${created.unit} radicado en bandeja de conciliación.`);
  };

  // Acción: Registrar nueva ronda de inspección con fotos
  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInspectionForm.criticalNote.trim()) return;
    const count = Number(newInspectionForm.findingsCount) || 0;
    const scoreNum = Math.min(5, Math.max(1, Number(newInspectionForm.score) || 4.5));
    const created: TechnicalInspectionItem = {
      id: `INSP-0${85 + inspections.length}`,
      date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }),
      type: newInspectionForm.type,
      inspector: newInspectionForm.inspector,
      score: scoreNum,
      findingsCount: count,
      criticalNote: newInspectionForm.criticalNote.trim(),
      status: count > 0 ? 'Atención Requerida' : 'Completada',
      photos: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
      ]
    };
    setInspections([created, ...inspections]);
    setNewInspectionForm({
      type: 'Ronda Técnica de Equipos y Zonas Comunes',
      inspector: 'Carlos Gómez (Supervisor)',
      score: '4.8',
      findingsCount: '1',
      criticalNote: ''
    });
    setShowNewInspectionModal(false);
    triggerNotice(`Ronda de inspección ${created.id} registrada con evidencia fotográfica.`);
  };

  // Acción: Enviar Comunicado Masivo
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setSendingBroadcast(true);
    setTimeout(() => {
      setSendingBroadcast(false);
      setSentBroadcasts(prev => [
        {
          id: `CIR-${Math.floor(902 + Math.random() * 90)}`,
          title: broadcastTitle.trim(),
          channel: broadcastChannel,
          date: 'Hoy, Justo ahora',
          recipients: '84 propietarios'
        },
        ...prev
      ]);
      triggerNotice(`Comunicado enviado a 84 residentes de ${tenantName} vía ${broadcastChannel}.`);
      setBroadcastTitle('');
      setBroadcastMessage('');
    }, 800);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* BANNER DE CONFIRMACIÓN EN TIEMPO REAL */}
      {feedbackBanner && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {feedbackBanner}
          </span>
          <button onClick={() => setFeedbackBanner(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CABECERA OPERATIVA */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full">
              Operaciones de Campo & Supervisión
            </span>
            <span className="text-xs text-slate-400">Auditoría en Tiempo Real • {tenantName}</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Centro de Mando Operativo y Conciliaciones</h2>
          <p className="text-xs text-slate-400">
            Control de rondas técnicas, validación rápida de transferencias bancarias y circulares oficiales a residentes.
          </p>
        </div>

        {/* NAVEGACIÓN ENTRE SUB-MÓDULOS */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('payments')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${
              activeSubTab === 'payments' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Pagos por Conciliar ({vouchers.filter(v => v.status === 'Pendiente Verificación').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('inspections')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${
              activeSubTab === 'inspections' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" /> Rondas de Inspección
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('broadcast')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${
              activeSubTab === 'broadcast' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Circulares WhatsApp
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 transition border border-slate-700 cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
          SUB-MÓDULO 1: VALIDACIÓN Y CONCILIACIÓN DE COMPROBANTES DE PAGO
         ==================================================================== */}
      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 px-1">
            <span>Comprobantes transferidos por residentes en pasillo o portería pendientes de cruce contable:</span>
            <button
              type="button"
              onClick={() => setShowNewVoucherModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs transition cursor-pointer self-start sm:self-auto"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Radicar Soporte en Terreno
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {vouchers.map((v) => (
              <div key={v.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      {v.unit}
                    </span>
                    <span className="text-xs font-bold text-white">{v.resident}</span>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                      {v.bank}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.status === 'Aprobado Conciliado' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    <strong>Referencia:</strong> <span className="font-mono text-slate-200">{v.ref}</span> • <strong>Registrado por:</strong> {v.registeredBy} ({v.date})
                  </p>
                  <p className="text-sm font-black text-emerald-400">
                    Monto reportado: ${v.amount.toLocaleString('es-CO')} COP
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedVoucher(v)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" /> Ver Comprobante
                  </button>

                  {v.status === 'Pendiente Verificación' && (
                    <button
                      type="button"
                      onClick={() => handleApprovePayment(v.id)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar y Liquidar Mora
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-MÓDULO 2: RONDAS DE INSPECCIÓN TÉCNICA (CAMPO)
         ==================================================================== */}
      {activeSubTab === 'inspections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Historial de recorridos físicos semanales en {tenantName}:</p>
            <button
              type="button"
              onClick={() => setShowNewInspectionModal(true)}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition shadow cursor-pointer"
            >
              <Camera className="w-4 h-4" /> Iniciar Nueva Ronda con Fotos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inspections.map((insp) => (
              <div key={insp.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {insp.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    insp.status === 'Completada' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-300'
                  }`}>
                    {insp.status}
                  </span>
                </div>

                <h4 className="text-sm font-black text-white">{insp.type}</h4>
                <p className="text-xs text-slate-400">
                  📅 {insp.date} • Realizado por: <strong>{insp.inspector}</strong>
                </p>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Novedades registradas:
                  </p>
                  <p className="text-[11px] text-slate-400">{insp.criticalNote}</p>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400">Calificación de estado: <strong className="text-emerald-400">{insp.score} / 5.0</strong></span>
                  <button
                    type="button"
                    onClick={() => setSelectedInspection(insp)}
                    className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
                  >
                    Ver Fotos y Hallazgos →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-MÓDULO 3: CIRCULARES OFICIALES Y WHATSAPP MASIVO
         ==================================================================== */}
      {activeSubTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Canal de Comunicación Oficial
              </span>
              <h3 className="text-lg font-black text-white mt-1">Enviar Circular Oficial a Residentes</h3>
              <p className="text-xs text-slate-400">
                Envía notificaciones directas a los números de los propietarios sin crear grupos caóticos de WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1">Asunto o Título de la Circular</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Suspensión programada de agua por lavado de tanques"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Canal de Envío</label>
                  <select
                    value={broadcastChannel}
                    onChange={(e) => setBroadcastChannel(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  >
                    <option>WhatsApp / SMS</option>
                    <option>Email Masivo Certificado</option>
                    <option>Tablero Digital de Portería</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Destinatarios</label>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-bold">
                    Todos los propietarios (84 Aptos)
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Mensaje Formal (Ley 675)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Estimados copropietarios: Se les informa que el próximo jueves se realizará la jornada de..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sendingBroadcast}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {sendingBroadcast ? 'Despachando mensajes...' : 'Despachar Circular Masiva'}
              </button>
            </form>
          </div>

          {/* Historial de despachos masivos */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-emerald-400" /> Historial de Circulares Despachadas
              </h4>
              <span className="text-[10px] font-mono text-slate-400">{sentBroadcasts.length} envíos</span>
            </div>
            <div className="space-y-3">
              {sentBroadcasts.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">{item.id}</span>
                    <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                      {item.channel}
                    </span>
                  </div>
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {item.date} • Entregado a {item.recipients}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: PREVISUALIZACIÓN DEL SOPORTE DE PAGO (VOUCHER)
         ==================================================================== */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-blue-400 font-bold">{selectedVoucher.id}</span>
                <h3 className="text-base font-black text-white">Soporte Digital de Transferencia</h3>
              </div>
              <button onClick={() => setSelectedVoucher(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Entidad Originadora:</span>
                <span className="font-bold text-blue-400">{selectedVoucher.bank}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Referencia / CUS:</span>
                <span className="font-mono font-bold text-white">{selectedVoucher.ref}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Inmueble / Propietario:</span>
                <span className="font-bold text-white">{selectedVoucher.unit} • {selectedVoucher.resident}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Fecha de Reporte:</span>
                <span className="text-slate-300">{selectedVoucher.date}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400 font-bold">Valor Transferido:</span>
                <span className="text-base font-black text-emerald-400">
                  ${selectedVoucher.amount.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
              {selectedVoucher.status === 'Pendiente Verificación' && (
                <button
                  type="button"
                  onClick={() => handleApprovePayment(selectedVoucher.id)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Conciliar y Expedir Recibo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: RADICAR NUEVO COMPROBANTE EN TERRENO
         ==================================================================== */}
      {showNewVoucherModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Radicar Comprobante en Terreno</h3>
              <button onClick={() => setShowNewVoucherModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateVoucher} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Unidad / Apto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Apto 703"
                    value={newVoucherForm.unit}
                    onChange={e => setNewVoucherForm({ ...newVoucherForm, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Residente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. David Londoño"
                    value={newVoucherForm.resident}
                    onChange={e => setNewVoucherForm({ ...newVoucherForm, resident: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monto (COP)</label>
                  <input
                    type="number"
                    required
                    placeholder="520000"
                    value={newVoucherForm.amount}
                    onChange={e => setNewVoucherForm({ ...newVoucherForm, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Medio / Banco</label>
                  <select
                    value={newVoucherForm.bank}
                    onChange={e => setNewVoucherForm({ ...newVoucherForm, bank: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option>Bancolombia App</option>
                    <option>Transferencia PSE</option>
                    <option>Nequi / Daviplata</option>
                    <option>Consignación Corresponsal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Referencia Bancaria</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. TRANS-884120"
                  value={newVoucherForm.ref}
                  onChange={e => setNewVoucherForm({ ...newVoucherForm, ref: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewVoucherModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl cursor-pointer"
                >
                  Guardar Soporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: EVIDENCIA FOTOGRÁFICA Y HALLAZGOS DE RONDA
         ==================================================================== */}
      {selectedInspection && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{selectedInspection.id} • {selectedInspection.date}</span>
                <h3 className="text-base font-black text-white">{selectedInspection.type}</h3>
              </div>
              <button onClick={() => setSelectedInspection(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                <strong>Inspector de Campo:</strong> {selectedInspection.inspector} • <strong>Calificación:</strong>{' '}
                <span className="text-emerald-400 font-bold">{selectedInspection.score} / 5.0</span>
              </p>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-300">
                <p className="font-bold text-amber-400 mb-1">Detalle Técnico de Hallazgos:</p>
                <p>{selectedInspection.criticalNote}</p>
              </div>

              {selectedInspection.photos && selectedInspection.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {selectedInspection.photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Evidencia ${selectedInspection.id}`}
                      className="w-full h-32 object-cover rounded-2xl border border-slate-800"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInspection(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerNotice(`Reporte fotográfico completo de ${selectedInspection.id} enviado al Administrador y al Consejo.`);
                  setSelectedInspection(null);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
              >
                Notificar al Administrador y Consejo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: INICIAR NUEVA RONDA DE INSPECCIÓN CON FOTOS
         ==================================================================== */}
      {showNewInspectionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Nueva Ronda de Inspección en Campo</h3>
              <button onClick={() => setShowNewInspectionModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInspection} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Tipo de Recorrido</label>
                <input
                  type="text"
                  required
                  value={newInspectionForm.type}
                  onChange={e => setNewInspectionForm({ ...newInspectionForm, type: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Calificación (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    required
                    value={newInspectionForm.score}
                    onChange={e => setNewInspectionForm({ ...newInspectionForm, score: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">N° de Hallazgos</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newInspectionForm.findingsCount}
                    onChange={e => setNewInspectionForm({ ...newInspectionForm, findingsCount: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Observaciones Técnicas y Evidencia</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describa el estado de bombas, iluminación, zonas húmedas o hallazgos locativos..."
                  value={newInspectionForm.criticalNote}
                  onChange={e => setNewInspectionForm({ ...newInspectionForm, criticalNote: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewInspectionModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl cursor-pointer"
                >
                  Guardar Ronda con Evidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
