import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Scan, 
  ArrowRight, 
  Building, 
  DollarSign, 
  Calendar, 
  Hash, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export interface FacturaCausada {
  id: string;
  nitProveedor: string;
  razonSocial: string;
  numeroFactura: string;
  fechaEmision: string;
  concepto: string;
  subtotal: number;
  iva: number;
  retefuente: number;
  totalPagar: number;
  estado: 'Validada DIAN' | 'Pendiente Pago' | 'Pagada';
}

export default function LectorFacturasProveedoresOCR({
  onShowToast,
  onFacturaCausada
}: {
  onShowToast?: (msg: string) => void;
  onFacturaCausada?: (factura: FacturaCausada) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [facturaDetectada, setFacturaDetectada] = useState<FacturaCausada | null>(null);

  // Historial de facturas procesadas recientemente
  const [historialCuentas, setHistorialCuentas] = useState<FacturaCausada[]>([
    {
      id: 'FAC-001',
      nitProveedor: '890.900.608-9',
      razonSocial: 'Empresas Públicas de Medellín E.S.P.',
      numeroFactura: 'EPM-9941028',
      fechaEmision: '2026-10-25',
      concepto: 'Energía y Alumbrado Zonas Comunes',
      subtotal: 3820000,
      iva: 0,
      retefuente: 0,
      totalPagar: 3820000,
      estado: 'Validada DIAN'
    },
    {
      id: 'FAC-002',
      nitProveedor: '900.245.188-4',
      razonSocial: 'Schindler Andino Mantenimiento S.A.S.',
      numeroFactura: 'SCH-88412',
      fechaEmision: '2026-10-28',
      concepto: 'Mantenimiento Preventivo Ascensores Torres 1 y 2',
      subtotal: 1850000,
      iva: 351500,
      retefuente: 74000,
      totalPagar: 2127500,
      estado: 'Pendiente Pago'
    }
  ]);

  // Simulación de escaneo OCR con IA
  const procesarArchivoFactura = (nombreArchivo: string) => {
    setProcesando(true);
    setFacturaDetectada(null);
    onShowToast?.(`🔍 Leyendo metadatos y CUFE de "${nombreArchivo}" con IA...`);

    setTimeout(() => {
      // Simulación de extracción inteligente de campos colombianos
      const nuevaFactura: FacturaCausada = {
        id: `FAC-${Date.now().toString().slice(-4)}`,
        nitProveedor: '901.334.821-1',
        razonSocial: 'Seguridad & Vigilancia El Poblado Ltda.',
        numeroFactura: `FE-${Math.floor(1000 + Math.random() * 9000)}`,
        fechaEmision: new Date().toISOString().split('T')[0],
        concepto: 'Servicio de Vigilancia 24/7 y Rondas Electrónicas',
        subtotal: 12400000,
        iva: 2356000,
        retefuente: 496000,
        totalPagar: 14260000,
        estado: 'Validada DIAN'
      };

      setFacturaDetectada(nuevaFactura);
      setProcesando(false);
      onShowToast?.('✨ ¡Factura procesada y validada contra RUT/DIAN!');
    }, 1800);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivoFactura(e.dataTransfer.files[0].name);
    }
  };

  const handleConfirmarCausacion = () => {
    if (!facturaDetectada) return;
    setHistorialCuentas(prev => [facturaDetectada, ...prev]);
    onFacturaCausada?.(facturaDetectada);
    onShowToast?.(`✅ Factura ${facturaDetectada.numeroFactura} de ${facturaDetectada.razonSocial} causada a Cuentas por Pagar.`);
    setFacturaDetectada(null);
  };

  return (
    <div className="bg-[#07090e] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl font-sans text-slate-100 space-y-6">
      
      {/* CABECERA */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3 h-3 text-cyan-300" /> OCR Inteligente • Contabilidad NIIF &amp; DIAN
            </span>
            <h3 className="text-base font-black text-white mt-1">Recepción &amp; Causación Automática de Proveedores</h3>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          Cero digitación manual • Validación de NIT &amp; Retenciones
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ZONA DE ARRASTRE DE FACTURA */}
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition flex flex-col items-center justify-center min-h-[260px] cursor-pointer ${
              dragOver 
                ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_25px_rgba(34,211,238,0.2)]' 
                : 'border-slate-800 bg-[#0b0f17] hover:border-slate-700'
            }`}
            onClick={() => procesarArchivoFactura('Factura_Electronica_Vigilancia_Oct2026.pdf')}
          >
            {procesando ? (
              <div className="space-y-3">
                <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs font-mono text-cyan-300">Extrayendo NIT, CUFE, IVA y retenciones...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Arrastra aquí la Factura Electrónica (PDF o XML)</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    O haz clic para simular la lectura automática de una factura real de proveedor.
                  </p>
                </div>
                <span className="inline-block text-[10px] font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                  Formatos admitidos: PDF, XML DIAN UBL 2.1, JPG
                </span>
              </div>
            )}
          </div>

          {/* DETECCIÓN Y CONFIRMACIÓN */}
          {facturaDetectada && (
            <div className="bg-[#0b0f17] border border-cyan-500/40 p-5 rounded-2xl space-y-4 shadow-lg animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Factura Extraída con Éxito
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  {facturaDetectada.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">PROVEEDOR / NIT</span>
                  <strong className="text-white block">{facturaDetectada.razonSocial}</strong>
                  <span className="text-slate-400 font-mono text-[11px]">{facturaDetectada.nitProveedor}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Nº FACTURA &amp; FECHA</span>
                  <strong className="text-cyan-400 block font-mono">{facturaDetectada.numeroFactura}</strong>
                  <span className="text-slate-400 font-mono text-[11px]">{facturaDetectada.fechaEmision}</span>
                </div>
              </div>

              <div className="bg-[#07090e] p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>${facturaDetectada.subtotal.toLocaleString()} COP</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>IVA (19%):</span>
                  <span>+${facturaDetectada.iva.toLocaleString()} COP</span>
                </div>
                {facturaDetectada.retefuente > 0 && (
                  <div className="flex justify-between text-amber-400/90">
                    <span>Retefuente deducida (4%):</span>
                    <span>-${facturaDetectada.retefuente.toLocaleString()} COP</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800 text-sm">
                  <span>Total Cuentas por Pagar:</span>
                  <span>${facturaDetectada.totalPagar.toLocaleString()} COP</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmarCausacion}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                Causar Factura a Contabilidad NIIF <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* TABLA DE CUENTAS POR PAGAR CAUSADAS */}
        <div className="bg-[#0b0f17] border border-slate-800 p-5 rounded-3xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Cuentas por Pagar Causadas
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                {historialCuentas.length} registros
              </span>
            </div>

            <div className="space-y-3">
              {historialCuentas.map((fac) => (
                <div 
                  key={fac.id} 
                  className="bg-[#07090e] border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold bg-slate-800 text-cyan-400 px-2 py-0.5 rounded">
                        {fac.numeroFactura}
                      </span>
                      <strong className="text-white text-xs">{fac.razonSocial}</strong>
                    </div>
                    <p className="text-[11px] text-slate-400">{fac.concepto}</p>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      NIT: {fac.nitProveedor} • Emisión: {fac.fechaEmision}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-sm text-white">
                      ${fac.totalPagar.toLocaleString()}
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border inline-block mt-1 ${
                      fac.estado === 'Validada DIAN'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {fac.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#07090e] p-3.5 rounded-2xl border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Generación de Formatos Exógena 1001:</span>
            <span className="text-cyan-400 font-bold">Autocausado</span>
          </div>
        </div>

      </div>

    </div>
  );
}
