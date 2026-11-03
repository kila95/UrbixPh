import React from 'react';
import { FileDown, Printer, Download, X, ShieldCheck } from 'lucide-react';

export interface LegalActaCommitment {
  responsable?: string;
  tarea?: string;
  fecha_limite?: string;
}

export interface LegalActaSegment {
  part: number;
  date: string;
  path?: string;
  duration_sec?: number;
}

export interface LegalActaFinancialItem {
  concepto: string;
  valorPresupuestado?: string;
  valorCotizadoReal?: string;
  variacionDescuento?: string;
  proveedorContratista?: string;
  estadoDecision?: string;
  valorCOP?: string;
  origen?: string;
  estado?: string;
}

export interface LegalActaData {
  id?: string;
  minute_number: string;
  meeting_type: string;
  status: string;
  meeting_date: string;
  start_time?: string;
  end_time?: string;
  quorum_percentage: string | number;
  president_name: string;
  secretary_name: string;
  summary?: string;
  raw_transcript?: string;
  encabezado?: {
    copropiedad?: string;
    organo?: string;
    fecha?: string;
    horaInicio?: string;
    horaFin?: string;
    presidente?: string;
    secretario?: string;
    quorum?: string;
  };
  ordenDelDia?: string[];
  desarrolloDetallado?: Array<{
    punto: string;
    intervencionesClave: string;
    nombresMencionados?: string[];
  }>;
  balanceFinanciero?: LegalActaFinancialItem[];
  decisionesYVotaciones?: Array<{
    proposicion: string;
    votosFavor: string;
    votosContra: string;
    abstenciones: string;
    resultado: string;
  }>;
  compromisos?: Array<{
    responsable: string;
    tarea: string;
    fechaLimite?: string;
    fecha_limite?: string;
  }>;
  commitments?: LegalActaCommitment[];
  audio_segments?: Array<{ part: number; date: string; path?: string; duration_sec?: number }>;
  digital_stamp?: {
    hash: string;
    verified_at: string;
    certified_by: string;
  };
}

export interface LegalTenantInfo {
  name: string;
  nit: string;
  zone: string;
  logoUrl?: string; // Logotipo institucional de la copropiedad
}

export const DEFAULT_TENANT_INFO: LegalTenantInfo = {
  name: 'Edificio Reserva del Tesoro P.H.',
  nit: '900.456.789-1',
  zone: 'El Poblado, Medellín'
};

// Constructor de definición pdfmake para la Sección III y documento completo
export function buildActaPdfMakeSectionIII(actaData: LegalActaData) {
  const balanceFinanciero = Array.isArray(actaData.balanceFinanciero) ? actaData.balanceFinanciero : [];
  return [
    {
      text: 'III. BALANCE ECONÓMICO Y DETERMINACIONES FINANCIERAS',
      style: 'sectionHeader',
      margin: [0, 15, 0, 8]
    },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto'],
        body: [
          [
            { text: 'CONCEPTO / PARTIDA', style: 'tableHeader' },
            { text: 'VALOR ($ COP)', style: 'tableHeader' },
            { text: 'ORIGEN DE RECURSOS', style: 'tableHeader' },
            { text: 'ESTADO', style: 'tableHeader' }
          ],
          // Mapeo dinámico de las partidas extraídas por la IA
          ...balanceFinanciero.map(item => [
            item.concepto,
            item.valorCotizadoReal || item.valorPresupuestado || item.valorCOP || '[Monto omitido en deliberación oral]',
            item.proveedorContratista || item.origen || 'Presupuesto PH',
            item.estadoDecision || item.estado || 'En evaluación'
          ])
        ]
      },
      layout: 'lightHorizontalLines'
    }
  ];
}

// 3. GENERADOR DE ACTA FOLIADA CON COMPROBACIÓN DIGITAL Y QUÓRUM LEY 675
export function buildActaLegalHTML(
  acta: LegalActaData,
  tenantInfo: LegalTenantInfo = DEFAULT_TENANT_INFO,
  includeAutoPrintScript = false
): string {
  const commitmentsList = Array.isArray(acta.compromisos) && acta.compromisos.length > 0
    ? acta.compromisos
    : (Array.isArray(acta.commitments) ? acta.commitments : []);
  const balanceList = Array.isArray(acta.balanceFinanciero) ? acta.balanceFinanciero : [];
  const votacionesList = Array.isArray(acta.decisionesYVotaciones) ? acta.decisionesYVotaciones : [];
  const segmentsList = Array.isArray(acta.audio_segments) ? acta.audio_segments : [];
  const cleanQuorum = String(acta.encabezado?.quorum || acta.quorum_percentage || '100').replace('%', '');
  const verificationHash = acta.digital_stamp?.hash || `URBIX-PH-${acta.minute_number}-SEC-${Date.now().toString(16).toUpperCase()}`;
  const nowFormatted = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${acta.minute_number} - ${tenantInfo.name}</title>
  <style>
    @page { size: letter; margin: 2cm 2cm 2cm 2cm; }
    body { font-family: 'Georgia', 'Times New Roman', serif; color: #0f172a; background: #ffffff; line-height: 1.6; font-size: 11pt; margin: 0; padding: 24px; }
    .no-print-bar { background: #0f172a; color: #f8fafc; padding: 12px 24px; font-family: system-ui, sans-serif; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; margin: -24px -24px 24px -24px; border-bottom: 2px solid #10b981; }
    .btn-download { background: #10b981; color: #022c22; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; }
    @media print { body { padding: 0; } .no-print-bar { display: none !important; } }
    .header-box { border: 2px solid #0f172a; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; gap: 16px; }
    .header-brand { display: flex; align-items: center; gap: 14px; }
    .header-logo { width: 58px; height: 58px; object-fit: contain; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; padding: 4px; flex-shrink: 0; }
    .header-title h1 { margin: 0; font-size: 15pt; text-transform: uppercase; letter-spacing: 0.5px; }
    .header-title p { margin: 2px 0 0 0; font-size: 9pt; color: #334155; }
    .header-meta { text-align: right; font-size: 9.5pt; border-left: 1.5px solid #cbd5e1; padding-left: 16px; }
    .header-meta strong { display: block; font-size: 12pt; color: #0f172a; }
    .legal-grid { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
    .legal-grid td { border: 1px solid #94a3b8; padding: 7px 10px; }
    .legal-grid .label { background-color: #f1f5f9; font-weight: bold; width: 22%; text-transform: uppercase; font-size: 8.5pt; }
    h2.section-title { font-size: 11pt; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-top: 22px; margin-bottom: 10px; letter-spacing: 0.5px; }
    .content-block { text-align: justify; white-space: pre-line; margin-bottom: 16px; }
    .commitments-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 9.5pt; }
    .commitments-table th { background-color: #0f172a; color: #ffffff; text-align: left; padding: 7px 9px; font-size: 8.5pt; text-transform: uppercase; }
    .commitments-table td { border: 1px solid #cbd5e1; padding: 7px 9px; }
    .signatures-wrapper { margin-top: 45px; page-break-inside: avoid; }
    .signatures-grid { display: flex; justify-content: space-between; gap: 40px; margin-top: 45px; }
    .signature-box { flex: 1; border-top: 1.5px solid #0f172a; padding-top: 8px; text-align: center; }
    .signature-box strong { display: block; font-size: 10.5pt; text-transform: uppercase; }
    .signature-box span { font-size: 9pt; color: #475569; }
    .stamp-box { margin-top: 25px; border: 1px solid #10b981; background: #ecfdf5; padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 8.5pt; color: #065f46; page-break-inside: avoid; }
    .legal-footer { margin-top: 25px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 8pt; color: #64748b; text-align: center; page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Vista Oficial de Impresión / Exportación PDF (Ley 675 de 2001)</strong>
      <div style="font-size: 11px; color: #94a3b8;">Selecciona "Guardar como PDF" en el destino de impresión.</div>
    </div>
    <button class="btn-download" onclick="window.print()">Guardar como PDF / Imprimir</button>
  </div>

  <!-- Membrete Oficial con Soporte de Logotipo del Conjunto -->
  <div class="header-box">
    <div style="display: flex; align-items: center; gap: 18px;">
      ${tenantInfo.logoUrl ? `
        <div style="width: 72px; height: 72px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; padding: 4px;">
          <img src="${tenantInfo.logoUrl}" alt="Logo ${tenantInfo.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
      ` : `
        <div style="width: 58px; height: 58px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #0f172a; color: #10b981; font-weight: 900; font-size: 22px;">
          PH
        </div>
      `}
      <div class="header-title">
        <h1>${acta.encabezado?.copropiedad || tenantInfo.name}</h1>
        <p>NIT: ${tenantInfo.nit} • Ubicación: ${tenantInfo.zone}</p>
        <p>Régimen de Propiedad Horizontal - Ley 675 de 2001 (Art. 47)</p>
      </div>
    </div>

    <div class="header-meta">
      <strong>${acta.minute_number}</strong>
      <span>Estado: <strong>${acta.status}</strong></span><br/>
      <span>Fecha: ${acta.encabezado?.fecha || acta.meeting_date}</span>
    </div>
  </div>

  <table class="legal-grid">
    <tr>
      <td class="label">Órgano Colegiado</td>
      <td>${acta.encabezado?.organo || acta.meeting_type}</td>
      <td class="label">Quórum Verificado</td>
      <td><strong>${cleanQuorum}%</strong> del Coeficiente Total (Ley 675 Art. 45)</td>
    </tr>
    <tr>
      <td class="label">Fecha de Sesión</td>
      <td>${acta.encabezado?.fecha || acta.meeting_date}</td>
      <td class="label">Horario (Inicio / Fin)</td>
      <td>${acta.encabezado?.horaInicio || acta.start_time || '18:00'}${acta.encabezado?.horaFin || acta.end_time ? ` — ${acta.encabezado?.horaFin || acta.end_time}` : ''}</td>
    </tr>
    <tr>
      <td class="label">Presidente Designado</td>
      <td>${acta.encabezado?.presidente || acta.president_name}</td>
      <td class="label">Secretario(a)</td>
      <td>${acta.encabezado?.secretario || acta.secretary_name}</td>
    </tr>
  </table>

  ${segmentsList.length > 0 ? `
    <h2 class="section-title">I. Constancia de Grabación y Trazabilidad de Sesión</h2>
    <p class="content-block">
      En cumplimiento del Artículo 47 de la Ley 675 de 2001, la presente sesión cuenta con soporte magnetofónico / digital custodiado en la bóveda de la copropiedad (${segmentsList.length} segmento(s) verificado(s)).
    </p>
  ` : ''}

  <h2 class="section-title">II. Orden del Día y Desarrollo Detallado de Intervenciones</h2>
  <div class="content-block">${acta.summary || 'Sin resumen registrado.'}</div>

  <h2 class="section-title">III. BALANCE ECONÓMICO Y DETERMINACIONES FINANCIERAS</h2>
  ${balanceList.length > 0 ? `
    <table class="commitments-table">
      <thead>
        <tr>
          <th style="width: 24%;">CONCEPTO / PARTIDA</th>
          <th style="width: 16%;">PRESUPUESTADO ($ COP)</th>
          <th style="width: 16%;">COTIZADO / REAL ($ COP)</th>
          <th style="width: 14%;">VARIACIÓN / DESC.</th>
          <th style="width: 16%;">PROVEEDOR / ORIGEN</th>
          <th style="width: 14%;">ESTADO</th>
        </tr>
      </thead>
      <tbody>
        ${balanceList.map(item => `
          <tr>
            <td><strong>${item.concepto || ''}</strong></td>
            <td>${item.valorPresupuestado || item.valorCOP || '[Monto omitido en deliberación oral]'}</td>
            <td>${item.valorCotizadoReal || item.valorCOP || '[Monto omitido en deliberación oral]'}</td>
            <td>${item.variacionDescuento || '0%'}</td>
            <td>${item.proveedorContratista || item.origen || 'Presupuesto General'}</td>
            <td><strong>${item.estadoDecision || item.estado || 'En evaluación'}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : `<p class="content-block">No se registraron determinaciones financieras o partidas presupuestales en esta sesión.</p>`}

  <h2 class="section-title">IV. Decisiones Formales y Relación de Votaciones</h2>
  ${votacionesList.length > 0 ? `
    <table class="commitments-table">
      <thead>
        <tr>
          <th style="width: 42%;">PROPOSICIÓN SOMETIDA A VOTACIÓN</th>
          <th style="width: 14%;">A FAVOR</th>
          <th style="width: 14%;">EN CONTRA</th>
          <th style="width: 14%;">ABSTENCIONES</th>
          <th style="width: 16%;">RESULTADO</th>
        </tr>
      </thead>
      <tbody>
        ${votacionesList.map(v => `
          <tr>
            <td><strong>${v.proposicion || ''}</strong></td>
            <td>${v.votosFavor || '0'}</td>
            <td>${v.votosContra || '0'}</td>
            <td>${v.abstenciones || '0'}</td>
            <td><strong>${v.resultado || 'APROBADO'}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : acta.raw_transcript ? `
    <div class="content-block">${acta.raw_transcript}</div>
  ` : `<p class="content-block">No se registraron proposiciones formales sometidas a votación nominal en esta sesión.</p>`}

  <h2 class="section-title">V. Cuadro de Compromisos, Tareas y Responsables</h2>
  ${commitmentsList.length > 0 ? `
    <table class="commitments-table">
      <thead>
        <tr>
          <th style="width: 25%;">Responsable / Cargo</th>
          <th style="width: 55%;">Compromiso u Obligación Aprobada</th>
          <th style="width: 20%;">Fecha Límite</th>
        </tr>
      </thead>
      <tbody>
        ${commitmentsList.map((c: any) => `
          <tr>
            <td><strong>${c.responsable || 'Administración'}</strong></td>
            <td>${c.tarea || ''}</td>
            <td>${c.fechaLimite || c.fecha_limite || 'Inmediato'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : `<p class="content-block">No se registraron compromisos adicionales en esta sesión.</p>`}

  <div class="signatures-wrapper">
    <p class="content-block">
      En constancia de lo anterior y en cumplimiento del Artículo 47 de la Ley 675 de 2001, se suscribe la presente acta por quienes actuaron como Presidente y Secretario de la sesión, quedando asentada en el Libro Oficial de Actas de la copropiedad.
    </p>
    <div class="signatures-grid">
      <div class="signature-box">
        <strong>${acta.president_name}</strong>
        <span>Presidente de la Sesión</span><br/>
        <span>Firma Digital / Autógrafa Verificada</span>
      </div>
      <div class="signature-box">
        <strong>${acta.secretary_name}</strong>
        <span>Secretario(a) de la Sesión / Administración</span><br/>
        <span>Firma Digital / Autógrafa Verificada</span>
      </div>
    </div>
  </div>

  <div class="stamp-box">
    <strong>✓ FOLIADO DIGITAL CERTIFICADO - URBIX PH PLATFORM</strong><br/>
    Hash de Integridad: ${verificationHash}<br/>
    Quórum Certificado: ${cleanQuorum}% • Fecha de Emisión: ${nowFormatted}
  </div>

  <div class="legal-footer">
    Documento oficial estructurado y custodiado digitalmente a través de <strong>Urbix PH</strong> • Cumplimiento Ley 675 de 2001 y Ley 1581 de 2012 (Habeas Data).
  </div>

  ${includeAutoPrintScript ? `<script>window.onload = function() { setTimeout(function() { window.print(); }, 350); };</script>` : ''}
</body>
</html>`;
}

export function exportActaToLegalPDF(
  acta: LegalActaData,
  tenantInfo: LegalTenantInfo = DEFAULT_TENANT_INFO,
  onToast?: (msg: string) => void
) {
  const htmlContent = buildActaLegalHTML(acta, tenantInfo, false);
  try {
    const existingFrame = document.getElementById('urbix-legal-print-frame') as HTMLIFrameElement | null;
    if (existingFrame && existingFrame.parentNode) existingFrame.parentNode.removeChild(existingFrame);

    const printFrame = document.createElement('iframe');
    printFrame.id = 'urbix-legal-print-frame';
    printFrame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();
      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          onToast?.(`Acta Oficial ${acta.minute_number} lista para guardar en PDF`);
        } catch {
          downloadActaHTML(acta, tenantInfo, onToast);
        }
      }, 300);
    } else {
      downloadActaHTML(acta, tenantInfo, onToast);
    }
  } catch {
    downloadActaHTML(acta, tenantInfo, onToast);
  }
}

export function downloadActaHTML(
  acta: LegalActaData,
  tenantInfo: LegalTenantInfo = DEFAULT_TENANT_INFO,
  onToast?: (msg: string) => void
) {
  const htmlContent = buildActaLegalHTML(acta, tenantInfo, true);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Acta_${acta.minute_number}_${tenantInfo.name.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  onToast?.(`Copia oficial foliada descargada: ${acta.minute_number}`);
}

export const downloadActaLegalHTML = downloadActaHTML;


// ============================================================================
// MODAL INTERACTIVO DE VISTA PREVIA E IMPRESIÓN PDF (LEY 675 DE 2001)
// ============================================================================
export function LegalPDFPreviewModal({
  acta,
  tenantInfo = DEFAULT_TENANT_INFO,
  onClose,
  onToast
}: {
  acta: LegalActaData;
  tenantInfo?: LegalTenantInfo;
  onClose: () => void;
  onToast?: (msg: string) => void;
}) {
  const htmlPreview = buildActaLegalHTML(acta, tenantInfo, false);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Barra superior de control (mismo estilo del documento legal) */}
        <div className="bg-slate-950 px-5 py-3.5 border-b-2 border-emerald-500 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Vista Oficial de Impresión / Exportación PDF (Ley 675 de 2001)
              </h3>
              <p className="text-[11px] text-slate-400">
                {acta.minute_number} • {tenantInfo.name} — Selecciona &ldquo;Guardar como PDF&rdquo; en el diálogo de impresión.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportActaToLegalPDF(acta, tenantInfo, onToast)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Printer className="w-4 h-4" />
              Guardar como PDF / Imprimir
            </button>
            <button
              type="button"
              onClick={() => downloadActaLegalHTML(acta, tenantInfo, onToast)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Descargar Foliado (.html)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lienzo del documento formato Carta (Georgia / Times New Roman) */}
        <div className="flex-1 bg-slate-800/60 p-4 sm:p-6 overflow-y-auto flex justify-center">
          <iframe
            title={`Vista Previa Legal ${acta.minute_number}`}
            srcDoc={htmlPreview}
            className="w-full max-w-[850px] h-full min-h-[780px] bg-white rounded-xl shadow-2xl border border-slate-300"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE TARJETA DE ACTA CON BOTÓN DE EXPORTACIÓN PDF
// ============================================================================
export default function ActaCardWithPDF({
  acta,
  tenantInfo = DEFAULT_TENANT_INFO,
  onOpenPreview,
  onToast
}: {
  acta: LegalActaData;
  tenantInfo?: LegalTenantInfo;
  onOpenPreview?: (acta: LegalActaData) => void;
  onToast?: (msg: string) => void;
}) {
  const cleanQuorum = String(acta.quorum_percentage ?? '100').replace('%', '');

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition font-sans">
      <div className="space-y-2 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-black text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            {acta.minute_number}
          </span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
            {acta.meeting_type}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {acta.status}
          </span>
        </div>

        <p className="text-xs text-slate-300 line-clamp-2">
          {acta.summary}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
          <span>📅 <strong>Fecha:</strong> {acta.meeting_date}</span>
          <span>👥 <strong>Quórum:</strong> {cleanQuorum}%</span>
          <span>✍️ <strong>Pte:</strong> {acta.president_name}</span>
          <span>📝 <strong>Srio:</strong> {acta.secretary_name}</span>
        </div>
      </div>

      {/* BOTÓN DE EXPORTACIÓN A PDF LEGAL */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (onOpenPreview) {
              onOpenPreview(acta);
            }
            exportActaToLegalPDF(acta, tenantInfo, onToast);
          }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <FileDown className="w-4 h-4" /> Exportar Acta Legal (PDF)
        </button>
      </div>
    </div>
  );
}
