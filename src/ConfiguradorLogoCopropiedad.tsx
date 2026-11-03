import React, { useState } from 'react';
import { UploadCloud, Image, CheckCircle2 } from 'lucide-react';

export function ConfiguradorLogoCopropiedad({
  logoActual,
  onGuardarLogo,
  onShowToast
}: {
  logoActual?: string;
  onGuardarLogo: (logoUrl: string) => void;
  onShowToast?: (msg: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(logoActual || null);

  const handleSeleccionarLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast?.('Por favor selecciona una imagen válida (PNG, JPG o SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      onGuardarLogo(base64);
      onShowToast?.('¡Logotipo del conjunto actualizado para todas las actas!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 font-sans text-slate-100">
      <div className="flex items-center gap-3.5">
        <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
          {preview ? (
            <img src={preview} alt="Logo Conjunto" className="w-full h-full object-contain p-1" />
          ) : (
            <Image className="w-6 h-6 text-slate-500" />
          )}
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            Logotipo Oficial del Conjunto
            {preview && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </h4>
          <p className="text-[11px] text-slate-400">Aparecerá en el encabezado de todas las actas legales y comunicados oficiales en PDF.</p>
        </div>
      </div>

      <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-mono font-bold rounded-xl cursor-pointer transition shrink-0 flex items-center gap-2">
        <UploadCloud className="w-4 h-4" />
        <span>{preview ? 'Cambiar Logo' : 'Subir Logo'}</span>
        <input type="file" accept="image/*" onChange={handleSeleccionarLogo} className="hidden" />
      </label>
    </div>
  );
}

export default ConfiguradorLogoCopropiedad;
