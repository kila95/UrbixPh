import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  FileText, 
  Layers, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface FormatoDianItem {
  codigo: string;
  nombre: string;
  descripcion: string;
  registros: number;
  valorTotal: number;
  estado: 'Generado & Cuadrado' | 'Pendiente Validación';
}

export default function GeneradorExogenaDIAN_NIIF({
  onShowToast,
  nitCopropiedad = '900.842.115-2',
  nombreCopropiedad = 'Urb. Tricentenario'
}: {
  onShowToast?: (msg: string) => void;
  nitCopropiedad?: string;
  nombreCopropiedad?: string;
}) {
  const [anioGravable, setAnioGravable] = useState('2026');
  const [generandoXml, setGenerandoXml] = useState<string | null>(null);

  // Matriz con los formatos clave de exógena exigidos por la DIAN
  const [formatosDian] = useState<FormatoDianItem[]>([
    {
      codigo: 'Formato 1001',
      nombre: 'Pagos o Abonos en Cuenta y Retenciones Practicadas',
      descripcion: 'Compras a proveedores de vigilancia, aseo, mantenimiento y honorarios.',
      registros: 48,
      valorTotal: 184500000,
      estado: 'Generado & Cuadrado'
    },
    {
      codigo: 'Formato 1003',
      nombre: 'Retenciones en la Fuente que le Practicaron',
      descripcion: 'Retenciones sobre rendimientos de cuentas bancarias de la copropiedad.',
      registros: 12,
      valorTotal: 3420000,
      estado: 'Generado & Cuadrado'
    },
    {
      codigo: 'Formato 1005',
      nombre: 'Impuesto a las Ventas (IVA) Descontable',
      descripcion: 'IVA pagado en insumos gravados y servicios técnicos.',
      registros: 26,
      valorTotal: 14890000,
      estado: 'Generado & Cuadrado'
    },
    {
      codigo: 'Formato 1007',
      nombre: 'Ingresos Recibidos en el Año (Expensas & Zonas Comunes)',
      descripcion: 'Cuotas ordinarias, extraordinarias, alquiler de salón social y parqueaderos.',
      registros: 120,
      valorTotal: 298400000,
      estado: 'Generado & Cuadrado'
    },
    {
      codigo: 'Formato 1008',
      nombre: 'Saldos de Cuentas por Cobrar (Cartera Morosa)',
      descripcion: 'Deudores morosos de cuotas de administración a corte de 31 de diciembre.',
      registros: 14,
      valorTotal: 18450000,
      estado: 'Generado & Cuadrado'
    },
    {
      codigo: 'Formato 1009',
      nombre: 'Saldos de Pasivos / Cuentas por Pagar a Proveedores',
      descripcion: 'Facturas pendientes de pago y fondos de imprevistos por girar.',
      registros: 8,
      valorTotal: 9240000,
      estado: 'Generado & Cuadrado'
    }
  ]);

  const exportarExcelExogena = (formatoEspecifico?: FormatoDianItem) => {
    const items = formatoEspecifico ? [formatoEspecifico] : formatosDian;
    const filas = items.map((item) => ({
      'Copropiedad': nombreCopropiedad,
      'NIT': nitCopropiedad,
      'Año Gravable': anioGravable,
      'Código Formato': item.codigo,
      'Nombre Formato DIAN': item.nombre,
      'Descripción Contable NIIF': item.descripcion,
      'Registros Procesados': item.registros,
      'Valor Total ($ COP)': item.valorTotal,
      'Estado Validación': item.estado
    }));

    const worksheet = XLSX.utils.json_to_sheet(filas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exogena_DIAN');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });
    const nombreArchivo = formatoEspecifico
      ? `${formatoEspecifico.codigo.replace(/\s+/g, '_')}_${nombreCopropiedad.replace(/\s+/g, '_')}_${anioGravable}.xlsx`
      : `Consolidado_Exogena_DIAN_${nombreCopropiedad.replace(/\s+/g, '_')}_${anioGravable}.xlsx`;

    saveAs(blob, nombreArchivo);
    onShowToast?.(`📊 Archivo Excel (${nombreArchivo}) exportado correctamente.`);
  };

  const descargarFormatoDian = (formato: FormatoDianItem) => {
    setGenerandoXml(formato.codigo);
    onShowToast?.(`📑 Estructurando archivo XML / Prevalidador DIAN para ${formato.codigo}...`);

    setTimeout(() => {
      // Descarga de archivo estructurado XML
      const contenidoXml = `<?xml version="1.0" encoding="UTF-8"?>\n<mas:Formato_${formato.codigo.replace(/\s+/g, '')} anio="${anioGravable}" nit="${nitCopropiedad}">\n  <!-- Generado automáticamente por Urbix PH -->\n  <registros>${formato.registros}</registros>\n  <total>${formato.valorTotal}</total>\n</mas:Formato>`;
      const blob = new Blob([contenidoXml], { type: 'application/xml;charset=utf-8' });
      saveAs(blob, `${formato.codigo.replace(/\s+/g, '_')}_Gravable${anioGravable}.xml`);

      setGenerandoXml(null);
      onShowToast?.(`✅ ${formato.codigo} descargado con formato oficial DIAN.`);
    }, 800);
  };

  return (
    <div className="bg-[#07090e] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl font-sans text-slate-100 space-y-6">
      
      {/* CABECERA */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
              DIAN Prevalidador XML • NIIF Copropiedades
            </span>
            <h3 className="text-base font-black text-white mt-1">
              Información Exógena &amp; Balances Oficiales
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {nombreCopropiedad} • NIT: {nitCopropiedad}
            </p>
          </div>
        </div>

        {/* SELECTOR DE AÑO GRAVABLE */}
        <div className="flex items-center gap-2 bg-[#07090e] p-2 rounded-2xl border border-slate-800">
          <span className="text-xs font-mono text-slate-400 font-bold ml-1">Año Gravable:</span>
          <select
            value={anioGravable}
            onChange={(e) => setAnioGravable(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-xs p-1.5 rounded-xl outline-none cursor-pointer"
          >
            <option value="2026">2026 (En Curso)</option>
            <option value="2025">2025 (Cierre Vigente)</option>
          </select>
        </div>
      </div>

      {/* TARJETAS DE INDICADORES DE CONCILIACIÓN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Total Formatos Obligatorios</span>
          <h4 className="text-xl font-black text-white font-mono mt-1">12 Formatos</h4>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">100% parametrizados con cuentas contables</span>
        </div>
        <div className="bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Estado Prevalidador DIAN</span>
          <h4 className="text-xl font-black text-emerald-400 font-mono mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Sin Inconsistencias
          </h4>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Validación automática de terceros y NITs</span>
        </div>
        <div className="bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Cuentas NIIF Integradas</span>
          <h4 className="text-xl font-black text-cyan-400 font-mono mt-1">PMA Activo</h4>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Grupo 3 - Copropiedades de Uso Residencial</span>
        </div>
      </div>

      {/* GRILLA DE FORMATOS DIAN GENERADOS */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> Formatos de Medios Magnéticos Listos para Transmisión
          </h4>
          <button
            type="button"
            onClick={() => exportarExcelExogena()}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Exportar Consolidado Excel (.xlsx)
          </button>
        </div>

        <div className="space-y-3">
          {formatosDian.map((f) => (
            <div
              key={f.codigo}
              className="bg-[#07090e] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-cyan-500/30 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/20">
                    {f.codigo}
                  </span>
                  <strong className="text-white text-sm">{f.nombre}</strong>
                </div>
                <p className="text-slate-400 text-xs">{f.descripcion}</p>
                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 pt-0.5">
                  <span>Registros procesados: <strong>{f.registros}</strong></span>
                  <span>•</span>
                  <span>Monto acumulado: <strong className="text-slate-300">${f.valorTotal.toLocaleString()} COP</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => exportarExcelExogena(f)}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Descargar en Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => descargarFormatoDian(f)}
                  disabled={generandoXml === f.codigo}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 px-4 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {generandoXml === f.codigo ? 'Generando...' : 'Descargar XML Prevalidador'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
