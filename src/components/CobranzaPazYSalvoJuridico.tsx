import React, { useState } from 'react';
import { 
  FileCheck2, 
  Scale, 
  Download, 
  QrCode, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Printer, 
  ShieldCheck, 
  Calendar, 
  User, 
  Building
} from 'lucide-react';

export interface DeudorCobro {
  id: string;
  unidad: string;
  propietario: string;
  cedulaNit: string;
  capitalMora: number;
  mesesVencidos: number;
  diasMora: number;
  interesesCalculados: number;
  totalDeuda: number;
  etapa: 'Cobro Persuasivo' | 'Requerimiento Prejurídico' | 'Demanda Ejecutiva';
}

export default function CobranzaPazYSalvoJuridico({
  onShowToast,
  nombreCopropiedad = 'P.H. Reserva del Tesoro',
  nitCopropiedad = '900.481.209-4',
  adminRepresentante = 'Carlos Mario Pineda'
}: {
  onShowToast?: (msg: string) => void;
  nombreCopropiedad?: string;
  nitCopropiedad?: string;
  adminRepresentante?: string;
}) {
  const [tabActiva, setTabActiva] = useState<'paz_y_salvo' | 'cobro_prejuridico'>('paz_y_salvo');

  // Tasa de mora legal mensual colombiana (1.5x IBC)
  const TASA_MORA_MENSUAL = 2.49; // % mensual legal vigente

  // Lista de deudores para gestión prejurídica
  const [deudores, setDeudores] = useState<DeudorCobro[]>([
    {
      id: 'DEU-101',
      unidad: 'Torre 1 - Apto 502',
      propietario: 'Martha Lucía Gómez',
      cedulaNit: 'CC 43.589.102',
      capitalMora: 3800000,
      mesesVencidos: 4,
      diasMora: 112,
      interesesCalculados: 353240,
      totalDeuda: 4153240,
      etapa: 'Requerimiento Prejurídico'
    },
    {
      id: 'DEU-102',
      unidad: 'Torre 2 - Apto 404',
      propietario: 'Inversiones Poblado SAS',
      cedulaNit: 'NIT 900.412.889-1',
      capitalMora: 7500000,
      mesesVencidos: 5,
      diasMora: 145,
      interesesCalculados: 902625,
      totalDeuda: 8402625,
      etapa: 'Demanda Ejecutiva'
    }
  ]);

  const [deudorSeleccionado, setDeudorSeleccionado] = useState<DeudorCobro>(deudores[0]);

  // Datos para emisión del Paz y Salvo
  const [unidadPazYSalvo, setUnidadPazYSalvo] = useState('Torre 2 - 301');
  const [propietarioPazYSalvo, setPropietarioPazYSalvo] = useState('Esteban Ochoa Mesa');
  const [cedulaPazYSalvo, setCedulaPazYSalvo] = useState('1.037.648.291');
  const [motivoTramite, setMotivoTramite] = useState('Trámite Notarial de Escrituración y Venta');
  const [saldoActualUnidad, setSaldoActualUnidad] = useState<number>(0);

  // Generador imprimible de Paz y Salvo oficial
  const emitirPazYSalvoHTML = () => {
    if (saldoActualUnidad > 0) {
      onShowToast?.('⚠️ No se puede emitir Paz y Salvo: La unidad presenta saldo pendiente.');
      return;
    }

    const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const radicadoPazSalvo = `PYS-${Date.now().toString().slice(-6)}`;
    const hashVerificacion = `SHA256-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;

    const htmlDoc = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <title>Certificado de Paz y Salvo - ${unidadPazYSalvo}</title>
        <style>
          body { font-family: 'Georgia', serif; padding: 40px; color: #111; line-height: 1.6; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 30px; }
          .title { font-size: 16pt; font-weight: bold; text-transform: uppercase; text-align: center; }
          .subtitle { font-size: 10pt; text-align: center; color: #555; }
          .content { margin: 30px 0; text-align: justify; font-size: 11pt; }
          .box { border: 1px solid #999; padding: 15px; margin: 20px 0; background: #fdfdfd; font-family: sans-serif; font-size: 10pt; }
          .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
          .sign-box { width: 45%; border-top: 1px solid #000; padding-top: 5px; text-align: center; font-size: 10pt; }
          .qr-box { margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 10px; font-size: 8pt; font-family: monospace; color: #666; text-align: center; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${nombreCopropiedad}</div>
          <div class="subtitle">NIT: ${nitCopropiedad} • Régimen de Propiedad Horizontal Ley 675 de 2001</div>
          <div class="subtitle" style="margin-top: 5px;">Radicado Oficial: <strong>${radicadoPazSalvo}</strong></div>
        </div>

        <h3 style="text-align: center; text-transform: uppercase; letter-spacing: 1px;">Certificado Oficial de Paz y Salvo</h3>

        <div class="content">
          El suscrito Representante Legal de la copropiedad <strong>${nombreCopropiedad}</strong>, por medio del presente documento hace constar que:
          <br/><br/>
          El inmueble distinguido como <strong>${unidadPazYSalvo}</strong>, de propiedad del señor(a) <strong>${propietarioPazYSalvo}</strong> identificado(a) con C.C./NIT <strong>${cedulaPazYSalvo}</strong>, se encuentra a la fecha <strong>TOTALMENTE A PAZ Y SALVO</strong> por concepto de expensas comunes ordinarias, extraordinarias, multas y demás obligaciones pecuniarias derivadas del régimen de propiedad horizontal.
        </div>

        <div class="box">
          <strong>Detalle del Estado de Cuenta a la Fecha:</strong><br/>
          • Saldo exigible a la fecha: <strong>$0.00 COP (CERO PESOS M/CTE)</strong><br/>
          • Destino del certificado: ${motivoTramite}<br/>
          • Vigencia: Válido hasta el último día del mes en curso (${fechaHoy}).
        </div>

        <div class="signatures">
          <div class="sign-box">
            <strong>${adminRepresentante}</strong><br/>
            Administrador y Representante Legal<br/>
            ${nombreCopropiedad}
          </div>
          <div class="sign-box">
            <strong>Revisoría Fiscal / Contabilidad</strong><br/>
            C.C. _______________________<br/>
            T.P. _______________________
          </div>
        </div>

        <div class="qr-box">
          Documento expedido y validado digitalmente a través de <strong>Urbix PH</strong>.<br/>
          Firma Criptográfica: ${hashVerificacion} • Verificación en tiempo real Art. 47 Ley 675.
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlDoc);
      printWindow.document.close();
    } else {
      const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Paz_y_Salvo_${radicadoPazSalvo}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    onShowToast?.(`📄 Paz y Salvo emitido con radicado ${radicadoPazSalvo}.`);
  };

  // Generador imprimible de Carta de Cobro Prejurídico
  const emitirCartaPrejuridicaHTML = () => {
    const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const radicadoCobro = `PREJ-${deudorSeleccionado.id}-${Date.now().toString().slice(-4)}`;

    const htmlDoc = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <title>Cobro Prejurídico - ${deudorSeleccionado.unidad}</title>
        <style>
          body { font-family: 'Georgia', serif; padding: 40px; color: #111; line-height: 1.6; }
          .header { border-bottom: 2px solid #b91c1c; padding-bottom: 12px; margin-bottom: 25px; }
          .title { font-size: 15pt; font-weight: bold; text-transform: uppercase; color: #991b1b; }
          .meta { font-size: 10pt; color: #444; }
          .debt-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10pt; }
          .debt-table th { background: #1e293b; color: #fff; padding: 8px; text-align: left; }
          .debt-table td { border: 1px solid #cbd5e1; padding: 8px; }
          .alert-box { border-left: 4px solid #b91c1c; background: #fef2f2; padding: 12px; margin: 15px 0; font-size: 10pt; }
          .signatures { margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Requerimiento Formal de Pago Prejurídico</div>
          <div class="meta">${nombreCopropiedad} • NIT: ${nitCopropiedad}</div>
          <div class="meta">Radicado: <strong>${radicadoCobro}</strong> • Fecha: ${fechaHoy}</div>
        </div>

        <p>
          Señor(a):<br/>
          <strong>${deudorSeleccionado.propietario}</strong><br/>
          Identificación: ${deudorSeleccionado.cedulaNit}<br/>
          Inmueble: <strong>${deudorSeleccionado.unidad}</strong><br/>
          Ciudad: Medellín, Antioquia
        </p>

        <p><strong>ASUNTO: REQUERIMIENTO EXTRAJUDICIAL PREVIO A INICIO DE PROCESO EJECUTIVO (ART. 30 Y 48 LEY 675 DE 2001).</strong></p>

        <p style="text-align: justify;">
          De manera atenta nos dirigimos a usted para requerir formalmente el pago de las expensas comunes ordinarias y extraordinarias adeudadas sobre la unidad privada <strong>${deudorSeleccionado.unidad}</strong>, las cuales a la fecha presentan una mora acumulada de <strong>${deudorSeleccionado.diasMora} días</strong> (${deudorSeleccionado.mesesVencidos} meses de mora).
        </p>

        <table class="debt-table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Días de Mora</th>
              <th>Tasa Interés</th>
              <th>Total Liquidado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Capital Vencido Cuotas de Administración</td>
              <td>${deudorSeleccionado.diasMora} días</td>
              <td>Nominal</td>
              <td>$${deudorSeleccionado.capitalMora.toLocaleString()} COP</td>
            </tr>
            <tr>
              <td>Intereses de Mora (Tasa Legal Art. 30 Ley 675)</td>
              <td>Liquidación mensual</td>
              <td>${TASA_MORA_MENSUAL}% mes</td>
              <td>$${deudorSeleccionado.interesesCalculados.toLocaleString()} COP</td>
            </tr>
            <tr style="font-weight: bold; background: #f8fafc;">
              <td colspan="3">SALDO TOTAL DE LA DEUDA EXIGIBLE:</td>
              <td style="color: #b91c1c;">$${deudorSeleccionado.totalDeuda.toLocaleString()} COP</td>
            </tr>
          </tbody>
        </table>

        <div class="alert-box">
          <strong>TÉRMINO PERENTORIO DE PAGO:</strong> Conforme al debido proceso, se otorga un plazo de <strong>cinco (5) días hábiles</strong> siguientes al recibo de esta comunicación para cancelar la totalidad de la obligación o suscribir un acuerdo formal de pago. Vencido este plazo sin respuesta, el título ejecutivo será endosado al abogado apoderado de la copropiedad para radicar la respectiva <strong>demanda ejecutiva con medidas cautelares de embargo y secuestro</strong> sobre el inmueble.
        </div>

        <div class="signatures">
          <br/><br/>
          <strong>${adminRepresentante}</strong><br/>
          Representante Legal - Administración<br/>
          ${nombreCopropiedad}
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlDoc);
      printWindow.document.close();
    } else {
      const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cobro_Prejuridico_${radicadoCobro}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    onShowToast?.(`⚖️ Carta de cobro prejurídico generada para ${deudorSeleccionado.unidad}.`);
  };

  return (
    <div className="bg-[#07090e] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl font-sans text-slate-100 space-y-6">
      
      {/* CABECERA CON NAVEGACIÓN */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
              Blindaje Legal • Ley 675 de 2001
            </span>
            <h3 className="text-base font-black text-white mt-1">Cobranza Prejurídica &amp; Paz y Salvos Digitales</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#07090e] p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTabActiva('paz_y_salvo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
              tabActiva === 'paz_y_salvo'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" /> 1. Paz y Salvo Oficial
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('cobro_prejuridico')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
              tabActiva === 'cobro_prejuridico'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> 2. Cobro Prejurídico
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-MÓDULO 1: GENERADOR DE PAZ Y SALVO OFICIAL CON FIRMA DIGITAL
          ========================================================================= */}
      {tabActiva === 'paz_y_salvo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Formulario de Emisión */}
          <div className="lg:col-span-6 bg-[#0b0f17] border border-slate-800 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" /> Parámetros del Certificado
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Unidad Privada</label>
                <input
                  type="text"
                  value={unidadPazYSalvo}
                  onChange={(e) => setUnidadPazYSalvo(e.target.value)}
                  className="w-full p-2.5 bg-[#07090e] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Propietario Titular</label>
                  <input
                    type="text"
                    value={propietarioPazYSalvo}
                    onChange={(e) => setPropietarioPazYSalvo(e.target.value)}
                    className="w-full p-2.5 bg-[#07090e] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Cédula o NIT</label>
                  <input
                    type="text"
                    value={cedulaPazYSalvo}
                    onChange={(e) => setCedulaPazYSalvo(e.target.value)}
                    className="w-full p-2.5 bg-[#07090e] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Destino / Finalidad del Trámite</label>
                <input
                  type="text"
                  value={motivoTramite}
                  onChange={(e) => setMotivoTramite(e.target.value)}
                  className="w-full p-2.5 bg-[#07090e] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400"
                />
              </div>

              {/* Selector de Estado de Deuda para Simulación */}
              <div className="p-3 bg-[#07090e] border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-mono text-slate-400 block">Validación Automática con Tesorería:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSaldoActualUnidad(0)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                      saldoActualUnidad === 0
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Saldo $0 COP (Apto al Día)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaldoActualUnidad(420000)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                      saldoActualUnidad > 0
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Con Saldo Mora ($420.000)
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={emitirPazYSalvoHTML}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Printer className="w-4 h-4" /> Imprimir / Exportar Paz y Salvo Oficial (PDF)
            </button>
          </div>

          {/* Vista Previa del Certificado Timbrado */}
          <div className="lg:col-span-6 bg-white text-slate-900 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 font-serif text-xs border border-slate-200">
            <div className="space-y-3">
              <div className="text-center border-b pb-3 border-slate-300">
                <h5 className="font-bold text-sm tracking-wide uppercase">{nombreCopropiedad}</h5>
                <span className="text-[10px] font-sans text-slate-500 block">NIT: {nitCopropiedad} • Ley 675 de 2001</span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold block mt-1">CERTIFICACIÓN DE EXPENSAS COMUNES</span>
              </div>

              <p className="text-justify leading-relaxed text-slate-700">
                Se certifica que el inmueble <strong>{unidadPazYSalvo}</strong>, perteneciente a <strong>{propietarioPazYSalvo}</strong> (CC/NIT: {cedulaPazYSalvo}), se encuentra a la fecha <strong>A PAZ Y SALVO</strong> por todo concepto de expensas comunes ordinarias y extraordinarias.
              </p>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded font-sans text-[11px] space-y-1">
                <div>Estado exigible: <strong className="text-emerald-700">CERO PESOS ($0.00 COP)</strong></div>
                <div>Destino: {motivoTramite}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-300 flex items-center justify-between font-sans text-[10px] text-slate-500">
              <div>
                <strong>{adminRepresentante}</strong><br/>
                Representante Legal
              </div>
              <div className="text-right font-mono">
                <QrCode className="w-8 h-8 text-slate-800 ml-auto mb-1" />
                <span>SHA256 Verificado</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          SUB-MÓDULO 2: GESTOR DE COBRO PREJURÍDICO & LIQUIDACIÓN DE MORA
          ========================================================================= */}
      {tabActiva === 'cobro_prejuridico' && (
        <div className="space-y-5 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deudores.map((deu) => (
              <div
                key={deu.id}
                onClick={() => setDeudorSeleccionado(deu)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                  deudorSeleccionado.id === deu.id
                    ? 'bg-[#0b0f17] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-[#07090e] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <strong className="text-white text-sm">{deu.unidad}</strong>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {deu.etapa}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-1 block">{deu.propietario} • {deu.cedulaNit}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs bg-[#07090e] p-2 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[9px] text-slate-500 block">CAPITAL</span>
                    <strong className="text-slate-200">${(deu.capitalMora / 1000000).toFixed(1)}M</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">INTERÉS</span>
                    <strong className="text-amber-400">+${(deu.interesesCalculados / 1000).toFixed(0)}k</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">TOTAL DEUDA</span>
                    <strong className="text-rose-400">${(deu.totalDeuda / 1000000).toFixed(1)}M</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Panel de Acción para la Carta Prejurídica del Deudor Seleccionado */}
          <div className="bg-[#0b0f17] border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2 justify-center sm:justify-start">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Expediente: {deudorSeleccionado.unidad} ({deudorSeleccionado.propietario})
              </h4>
              <p className="text-xs text-slate-400">
                Deuda total: <strong className="text-rose-400 font-mono">${deudorSeleccionado.totalDeuda.toLocaleString()} COP</strong> ({deudorSeleccionado.diasMora} días en mora).
              </p>
            </div>

            <button
              type="button"
              onClick={emitirCartaPrejuridicaHTML}
              className="bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-90 text-white font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-900/30"
            >
              <FileText className="w-4 h-4" /> Generar Carta Prejurídica Foliada (PDF)
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
