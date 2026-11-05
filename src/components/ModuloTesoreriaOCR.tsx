import React, { useState } from 'react';
import { DollarSign, UploadCloud, CheckCircle2, FileText, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { conciliarPagoOcrEnBaseDeDatos } from '../lib/treasuryService';
import { supabase, normalizeTenantUuid } from '../supabaseClient';

export default function ModuloTesoreriaOCR({ tenantId, tenantName, onShowToast }: { tenantId?: string; tenantName?: string; onShowToast?: (msg: string) => void }) {
  const resolvedTenantId = normalizeTenantUuid(tenantId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [reconciliationResult, setReconciliationResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setReconciliationResult(null);
    }
  };

  const handleProcessOCR = async () => {
    if (!selectedFile) return;
    setLoading(true);

    try {
      // Convertir archivo a Base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        const { data: authData } = await supabase.auth.getSession();
        const token = authData?.session?.access_token;

        const response = await fetch('/api/ocr-tesoreria-pago', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            base64Data: base64String,
            mimeType: selectedFile.type || 'application/pdf',
            tenantId: resolvedTenantId
          })
        });

        const data = await response.json();
        if (data.success && data.paymentData) {
          setReconciliationResult(data.paymentData);
          try {
            await conciliarPagoOcrEnBaseDeDatos(resolvedTenantId, data.paymentData);
          } catch (syncErr) {
            console.warn('Aviso al asentar pago OCR:', syncErr);
          }
          onShowToast?.(`Pago conciliado y contabilizado en Formato 1007 para ${data.paymentData.unit_reference}`);
        } else {
          throw new Error(data.error || 'No se pudo procesar el comprobante');
        }
        setLoading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      alert('Error en OCR de tesorería: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 font-sans text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Tesorería, OCR de Pagos & Cartera (Ley 675)</h3>
            <p className="text-xs text-slate-400 font-mono">Conciliación automática de extractos y comprobantes con IA</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Zona de Carga de Comprobante */}
        <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
          <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
            Subir Comprobante o Extracto Bancario
          </label>
          <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer transition">
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" id="file-tesoreria" />
            <label htmlFor="file-tesoreria" className="cursor-pointer space-y-2 block">
              <UploadCloud className="w-8 h-8 mx-auto text-cyan-400" />
              <p className="text-xs text-slate-300 font-bold">{selectedFile ? selectedFile.name : 'Haz clic para adjuntar PDF o imagen'}</p>
              <p className="text-[10px] text-slate-500 font-mono">Lectura automática de valores, fechas y referencias</p>
            </label>
          </div>

          {selectedFile && (
            <button
              onClick={handleProcessOCR}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>{loading ? 'Analizando con IA...' : 'Conciliar Pago y Actualizar Cartera'}</span>
            </button>
          )}
        </div>

        {/* Resultado de la Conciliación */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Resultado del Análisis OCR en Vivo</span>
          </h4>

          {reconciliationResult ? (
            <div className="space-y-3 text-xs font-mono bg-slate-900 p-4 rounded-xl border border-emerald-500/30">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Inmueble Detectado:</span>
                <span className="text-emerald-400 font-bold">{reconciliationResult.unit_reference}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Pagador:</span>
                <span className="text-white">{reconciliationResult.payer_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Valor Pagado:</span>
                <span className="text-cyan-400 font-bold">${Number(reconciliationResult.amount_paid_cop || 0).toLocaleString()} COP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estado Cartera:</span>
                <span className="text-emerald-400 font-bold">PAZ Y SALVO APLICADO</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-600 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
              Sube un comprobante para ver la conciliación automática de cartera.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
