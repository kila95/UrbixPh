import React from 'react';
import { FileText, Printer } from 'lucide-react';

interface CotizacionProps {
  isOpen: boolean;
  onClose: () => void;
  unidades: number;
  esAnual: boolean;
  costoUnitario: number;
  subtotal: number;
  modulosSeleccionados: {
    citofonia: boolean;
    contabilidad: boolean;
    asambleas: boolean;
    appResidentes: boolean;
    rondasNfc: boolean;
  };
}

export default function CotizacionPDFModal({
  isOpen,
  onClose,
  unidades,
  esAnual,
  costoUnitario,
  subtotal,
  modulosSeleccionados,
}: CotizacionProps) {
  if (!isOpen) return null;

  const totalFinal = esAnual ? subtotal * 12 * 0.88 : subtotal; // 12% descuento anual

  const handlePrint = () => {
    const contenido = document.getElementById('print-cotizacion-area')?.innerHTML;
    const ventana = window.open('', '_blank', 'width=850,height=950');
    if (ventana && contenido) {
      ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Cotización Oficial - Urbix PH</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; padding: 30px; line-height: 1.4; background: #fff; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; }
            .logo { font-size: 26px; font-weight: 900; color: #0284c7; letter-spacing: 1px; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
            th { background: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            .total-box { background: #f0fdf4; border: 2px solid #16a34a; padding: 16px; border-radius: 8px; margin-top: 20px; text-align: right; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; page-break-inside: avoid; }
            .sig-line { border-top: 1px solid #475569; margin-top: 50px; padding-top: 5px; text-align: center; font-size: 12px; font-weight: bold; color: #334155; }
            .footer { margin-top: 35px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
          </style>
        </head>
        <body>
          ${contenido}
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
        </html>
      `);
      ventana.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 text-xs text-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <FileText className="w-4 h-4 text-cyan-400" /> Vista Previa de Cotización Comercial Urbix PH
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">
            ✕
          </button>
        </div>

        {/* Contenido Imprimible */}
        <div id="print-cotizacion-area" className="bg-white text-slate-900 p-8 rounded-2xl space-y-6 overflow-y-auto font-sans">
          
          <div className="header flex justify-between items-start border-b-2 border-sky-600 pb-4">
            <div>
              <div className="logo text-2xl font-black text-sky-600 font-mono">URBIX PH</div>
              <p className="text-xs text-slate-600 font-medium">Software Operativo & Gobernanza para Propiedad Horizontal</p>
              <p className="text-xs text-slate-500">NIT: 901.882.341-0 · Medellín, Colombia</p>
              <p className="text-xs text-sky-700 mt-1 font-mono">WhatsApp: +57 310 305 6071 | estebanochoamesa@gmail.com</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold font-mono">
                COTIZACIÓN OFICIAL
              </span>
              <p className="text-xs text-slate-500 mt-1">Fecha: {new Date().toLocaleDateString('es-CO')}</p>
              <p className="text-xs text-slate-500 font-mono">Ref: PROP-{Math.floor(100000 + Math.random() * 900000)}</p>
            </div>
          </div>

          <div className="meta-box bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Elaborado Para:</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">Administración / Consejo de Administración</p>
              <p className="text-xs text-slate-600">Gestión Inmobiliaria & Copropiedad</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Esquema Comercial:</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {esAnual ? 'Licenciamiento Anual (12 Meses con 12% Desc.)' : 'Licenciamiento Mensual Recurrente'}
              </p>
              <p className="text-xs text-slate-600">Volumen: {unidades} Inmuebles habilitados</p>
            </div>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-2.5 text-left">Módulo / Componente Tecnológico</th>
                <th className="p-2.5 text-center">Inmuebles</th>
                <th className="p-2.5 text-right">Valor Unitario</th>
                <th className="p-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2.5 font-bold">Licenciamiento Core Urbix PH (Citofonía & Portería QR)</td>
                <td className="p-2.5 text-center">{unidades}</td>
                <td className="p-2.5 text-right">${costoUnitario.toLocaleString('es-CO')}</td>
                <td className="p-2.5 text-right font-bold">${subtotal.toLocaleString('es-CO')}</td>
              </tr>
              {modulosSeleccionados.contabilidad && (
                <tr>
                  <td className="p-2.5">Módulo Contable NIIF & Exógena DIAN</td>
                  <td className="p-2.5 text-center">{unidades}</td>
                  <td className="p-2.5 text-right font-medium text-emerald-600" colSpan={2}>✓ Incluido sin costo adicional en Suite Core</td>
                </tr>
              )}
              {modulosSeleccionados.asambleas && (
                <tr>
                  <td className="p-2.5">Módulo de Asambleas Virtuales con IA (Ley 675)</td>
                  <td className="p-2.5 text-center">{unidades}</td>
                  <td className="p-2.5 text-right font-medium text-emerald-600" colSpan={2}>✓ Incluido sin costo adicional en Suite Core</td>
                </tr>
              )}
              {modulosSeleccionados.appResidentes && (
                <tr>
                  <td className="p-2.5">App de Residentes & PQRSD (Ley 1755)</td>
                  <td className="p-2.5 text-center">{unidades}</td>
                  <td className="p-2.5 text-right font-medium text-emerald-600" colSpan={2}>✓ Incluido sin costo adicional en Suite Core</td>
                </tr>
              )}
              {modulosSeleccionados.rondasNfc && (
                <tr>
                  <td className="p-2.5">Rondas de Vigilancia NFC, Toderos & ARL SG-SST</td>
                  <td className="p-2.5 text-center">{unidades}</td>
                  <td className="p-2.5 text-right font-medium text-emerald-600" colSpan={2}>✓ Incluido sin costo adicional en Suite Core</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="total-box bg-emerald-50 border-2 border-emerald-600 p-4 rounded-xl text-right space-y-1">
            <p className="text-xs text-emerald-800 font-semibold">
              {esAnual ? 'Valor Total Anual (Incluye 12% Descuento Comercial):' : 'Inversión Total Mensual Recurrente:'}
            </p>
            <div className="text-2xl font-black text-emerald-900 font-mono">
              ${Math.round(totalFinal).toLocaleString('es-CO')} <span className="text-xs font-normal text-emerald-700">COP</span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5">Impuestos incluidos (Régimen simplificado / Facturación electrónica)</p>
          </div>

          <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-200">
            <p><strong>Condiciones de Servicio:</strong> Activación inmediata en la nube sobre infraestructura segura en Supabase / Vercel. Soporte técnico prioritario incluido vía WhatsApp y tickets.</p>
            <p><strong>Validez de la Propuesta:</strong> 30 días calendario a partir de la fecha de emisión.</p>
          </div>

          {/* Bloque de Firmas para Aprobación */}
          <div className="signatures grid grid-cols-2 gap-12 mt-8 pt-4">
            <div className="sig-line border-t border-slate-400 pt-2 text-center text-xs font-bold text-slate-700">
              Aprobado por:<br/><span className="font-normal text-slate-500">Administración / Representante Legal</span>
            </div>
            <div className="sig-line border-t border-slate-400 pt-2 text-center text-xs font-bold text-slate-700">
              Aprobado por:<br/><span className="font-normal text-slate-500">Presidente Consejo de Administración</span>
            </div>
          </div>

          <div className="footer text-center text-[10px] text-slate-400 pt-4 border-t border-dashed border-slate-300">
            Urbix PH · Plataforma Certificada para la Administración Moderna de Copropiedades en Colombia · WhatsApp: +57 310 305 6071
          </div>
        </div>

        {/* Botones de Acción inferior */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700 cursor-pointer">
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <Printer className="w-4 h-4" /> Imprimir / Guardar como PDF Oficial
          </button>
        </div>

      </div>
    </div>
  );
}
