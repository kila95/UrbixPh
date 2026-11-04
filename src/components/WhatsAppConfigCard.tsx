import React, { useState } from 'react';
import { MessageSquare, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function WhatsAppConfigCard({ tenantName, onShowToast }: { tenantName?: string; onShowToast?: (msg: string) => void }) {
  const [whatsappEnabled, setWhatsappEnabled] = useState<boolean>(true);
  const [whatsappToken, setWhatsappToken] = useState<string>('');
  const [phoneSenderId, setPhoneSenderId] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulación de guardado en la base de datos o almacenamiento local por tenant
    setTimeout(() => {
      setSaving(false);
      onShowToast?.(`Configuración de WhatsApp actualizada para ${tenantName || 'la copropiedad'}`);
    }, 600);
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 font-sans text-slate-100">
      {/* Cabecera de la tarjeta */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Notificaciones Automáticas por WhatsApp</h3>
            <p className="text-xs text-slate-400 font-mono">Alertas instantáneas para residentes (Paquetes y Reservas)</p>
          </div>
        </div>
        
        {/* Interruptor Global de Activación */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={whatsappEnabled} 
            onChange={(e) => setWhatsappEnabled(e.target.checked)} 
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          <span className="ml-2 text-xs font-mono font-bold text-slate-300">
            {whatsappEnabled ? 'Activo' : 'Inactivo'}
          </span>
        </label>
      </div>

      {/* Formulario de Configuración */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono uppercase">
              Token de API de WhatsApp Business
            </label>
            <input 
              type="password"
              placeholder="EAAW... (Token de acceso de Meta o Proveedor)"
              value={whatsappToken}
              onChange={(e) => setWhatsappToken(e.target.value)}
              disabled={!whatsappEnabled}
              className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs font-mono outline-none focus:border-emerald-500 transition disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono uppercase">
              ID del Teléfono Remitente (Phone ID)
            </label>
            <input 
              type="text"
              placeholder="Ej. 106548922341..."
              value={phoneSenderId}
              onChange={(e) => setPhoneSenderId(e.target.value)}
              disabled={!whatsappEnabled}
              className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs font-mono outline-none focus:border-emerald-500 transition disabled:opacity-50"
            />
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-bold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Eventos automatizados que enviarán mensaje al residente:</span>
          </p>
          <p className="text-[11px] font-mono pl-5">
            • Llegada de encomienda / paquete a portería con código PIN de retiro.<br/>
            • Aprobación o rechazo de reservas de zonas comunes por parte de la administración.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>{saving ? 'Guardando ajustes...' : 'Guardar Configuración WhatsApp'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
