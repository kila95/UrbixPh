import React, { useState, useEffect } from 'react';
import { Download, Upload } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { exportActaToLegalPDF } from '../ActaCardWithPDF';

interface Props {
  tenantId: string;
  audioBlobOrUrl?: Blob | string | null;
  contextNotes?: string;
  onShowToast?: (msg: string) => void;
}

const DEFAULT_TRICENTENARIO_TENANT_ID = '';

export const EditorActaLegal: React.FC<Props> = ({
  tenantId,
  audioBlobOrUrl,
  contextNotes = '',
  onShowToast
}) => {
  // 1. Estados dinámicos 100% conectados a Supabase
  const [copropiedadInfo, setCopropiedadInfo] = useState<{ name: string; nit?: string }>({
    name: 'Cargando...',
    nit: ''
  });
  const [comision1, setComision1] = useState('');
  const [comision2, setComision2] = useState('');
  const [contenidoActa, setContenidoActa] = useState<string>('');
  const [procesandoIA, setProcesandoIA] = useState<boolean>(false);
  const [unidadesCenso, setUnidadesCenso] = useState<any[]>([]);
  const [archivoAudioLocal, setArchivoAudioLocal] = useState<File | null>(null);
  const [ultimoResultadoIA, setUltimoResultadoIA] = useState<{
    ordenDelDia?: string[];
    desarrolloDetallado?: any[];
    balanceFinanciero?: any[];
    decisionesYVotaciones?: any[];
    compromisos?: any[];
    quorum?: string;
    horaInicio?: string;
    tipoOrgano?: string;
    summary?: string;
  }>({});

  // 2. Cargar datos reales de la copropiedad (Urb. Copropiedad_PH) y lista de propietarios
  useEffect(() => {
    const cargarDatosCopropiedad = async () => {
      try {
        let effectiveTenantId =
          tenantId && tenantId !== 't1' && tenantId.length > 10
            ? tenantId
            : '';

        if (!effectiveTenantId) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: perfil } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();
              if (perfil?.tenant_id) {
                effectiveTenantId = perfil.tenant_id;
              }
            }
          } catch {
            // Fallback al UUID de Copropiedad_PH
          }
        }

        if (!effectiveTenantId) {
          effectiveTenantId = DEFAULT_TRICENTENARIO_TENANT_ID;
        }

        // Datos del tenant (usamos select('*') para soportar esquemas con o sin columna nit)
        const { data: tenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', effectiveTenantId)
          .single();

        if (tenant) {
          setCopropiedadInfo({
            name: tenant.name || 'Copropiedad PH',
            nit: (tenant as any).nit || '900.814.320-1'
          });
        } else {
          setCopropiedadInfo({
            name: 'Copropiedad PH',
            nit: '900.814.320-1'
          });
        }

        // Cargar las 100 unidades para poder elegir quiénes conforman la comisión verificadora
        const { data: units } = await supabase
          .from('units')
          .select('tower, apartment, owner_name')
          .eq('tenant_id', effectiveTenantId)
          .order('tower', { ascending: true })
          .order('apartment', { ascending: true });

        if (units && units.length > 0) {
          setUnidadesCenso(units);
          setComision1(`${units[0].owner_name} (Torre ${units[0].tower} - ${units[0].apartment})`);
          if (units[1]) {
            setComision2(`${units[1].owner_name} (Torre ${units[1].tower} - ${units[1].apartment})`);
          }
        }
      } catch (err) {
        console.error('Error cargando datos de copropiedad en EditorActaLegal:', err);
        setCopropiedadInfo({ name: 'Copropiedad PH', nit: '900.814.320-1' });
      }
    };

    cargarDatosCopropiedad();
  }, [tenantId]);

  const formatearActaDetalladaTexto = (acta: any, nombreCopropiedad: string) => {
    const ordenTexto = Array.isArray(acta.ordenDelDia) && acta.ordenDelDia.length > 0
      ? acta.ordenDelDia.map((p: string, i: number) => `${i + 1}. ${String(p).replace(/^\d+[\.\)]\s*/, '')}`).join('\n')
      : '1. Verificación del quórum\n2. Lectura y aprobación del orden del día\n3. Informes de gestión y estados financieros\n4. Deliberaciones, proposiciones y varios';

    const desarrolloTexto = Array.isArray(acta.desarrolloDetallado) && acta.desarrolloDetallado.length > 0
      ? acta.desarrolloDetallado
          .map(
            (d: any, i: number) =>
              `▶ ${d.punto || `PUNTO ${i + 1}`}:\n${d.intervencionesClave || ''}${
                Array.isArray(d.nombresMencionados) && d.nombresMencionados.length > 0
                  ? `\n(Intervinientes: ${d.nombresMencionados.join(', ')})`
                  : ''
              }`
          )
          .join('\n\n')
      : acta.summary || '';

    const balanceTexto = Array.isArray(acta.balanceFinanciero) && acta.balanceFinanciero.length > 0
      ? acta.balanceFinanciero
          .map(
            (b: any) =>
              `• ${b.concepto}: Presupuestado ${b.valorPresupuestado || 'N/A'} | Cotizado/Real ${b.valorCotizadoReal || 'N/A'} | Proveedor: ${b.proveedorContratista || 'Presupuesto PH'} | Estado: ${b.estadoDecision || 'Aprobado'}`
          )
          .join('\n')
      : '• Sin partidas extraordinarias adicionales registradas en la sesión.';

    const decisionesTexto = Array.isArray(acta.decisionesYVotaciones) && acta.decisionesYVotaciones.length > 0
      ? acta.decisionesYVotaciones
          .map(
            (v: any) =>
              `• Proposición: ${v.proposicion} — A favor: ${v.votosFavor || '100%'} | En contra: ${v.votosContra || '0%'} | Abstenciones: ${v.abstenciones || '0%'} → RESULTADO: ${v.resultado || 'APROBADO'}`
          )
          .join('\n')
      : '• Moción de aprobación general verificada por el órgano colegiado.';

    const compromisosTexto = Array.isArray(acta.compromisos) && acta.compromisos.length > 0
      ? acta.compromisos
          .map(
            (c: any) =>
              `• [${c.responsable || 'Administración'}] ${c.tarea || ''} (Fecha límite: ${c.fechaLimite || c.fecha_limite || 'Inmediato'})`
          )
          .join('\n')
      : '• Seguimiento ordinario a cargo de la Administración.';

    return `ACTA OFICIAL DETALLADA • ${acta.meeting_type || 'ASAMBLEA / CONSEJO DE ADMINISTRACIÓN'}
${nombreCopropiedad.toUpperCase()} • LEY 675 DE 2001 (ART. 47)
Acta N°: ${acta.minute_number || 'ACT-OFICIAL'} | Fecha: ${acta.meeting_date || new Date().toLocaleDateString('es-CO')}

I. VERIFICACIÓN DEL QUÓRUM E INSTALACIÓN:
Siendo las ${acta.start_time || '18:00'} se dio inicio a la sesión de ${nombreCopropiedad}. Quórum verificado: ${acta.quorum_percentage || '100'}%.
${acta.summary || ''}

II. ORDEN DEL DÍA APROBADO:
${ordenTexto}

III. DESARROLLO DETALLADO PUNTO POR PUNTO:
${desarrolloTexto}

IV. BALANCE ECONÓMICO Y DETERMINACIONES FINANCIERAS ($ COP):
${balanceTexto}

V. DECISIONES FORMALES Y RELACIÓN DE VOTACIONES:
${decisionesTexto}

VI. CUADRO DE COMPROMISOS, TAREAS Y RESPONSABLES:
${compromisosTexto}

VII. COMISIÓN VERIFICADORA DEL ACTA:
- ${comision1 || 'Pendiente de asignar'}
- ${comision2 || 'Pendiente de asignar'}`;
  };

  // 3. Procesar archivos pesados de audio por fragmentos binarios de 5 MB hacia /api/upload-audio-chunk y /api/process-meeting
  const procesarAudioSinBaseDeDatos = async (file: File) => {
    setProcesandoIA(true);
    const fileSizeMB = file.size / (1024 * 1024);
    setContenidoActa(`⏳ Subiendo "${file.name}" (${fileSizeMB.toFixed(2)} MB) en fragmentos seguros y redactando acta oficial con todos los puntos...`);
    onShowToast?.(`🎙️ Procesando "${file.name}" (${fileSizeMB.toFixed(1)} MB) con Gemini IA...`);

    try {
      const uploadId = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const chunkSize = 5 * 1024 * 1024;
      const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
      const mimeType = file.type || 'audio/mp3';

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBuffer = await file.slice(start, end).arrayBuffer();

        const upRes = await fetch(
          `/api/upload-audio-chunk?uploadId=${encodeURIComponent(uploadId)}&chunkIndex=${i}&totalChunks=${totalChunks}&mimeType=${encodeURIComponent(mimeType)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: chunkBuffer
          }
        );

        if (!upRes.ok) {
          const errUp = await upRes.json().catch(() => ({}));
          throw new Error(errUp.error || `Error al enviar fragmento (${i + 1}/${totalChunks})`);
        }
      }

      const tenantNombre =
        copropiedadInfo.name && copropiedadInfo.name !== 'Cargando...'
          ? copropiedadInfo.name
          : 'Copropiedad PH';

      const respuesta = await fetch('/api/process-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          mimeType,
          audioPath: file.name,
          tenantName: tenantNombre,
          meetingType: 'Asamblea / Consejo de Administración',
          meetingDate: new Date().toISOString().split('T')[0],
          contextNotes: `${contextNotes ? contextNotes + ' | ' : ''}Archivo procesado: ${file.name} (${fileSizeMB.toFixed(2)} MB). Comisión verificadora: ${comision1}, ${comision2}.`
        })
      });

      const resData = await respuesta.json();
      if (!respuesta.ok || !resData?.acta) {
        throw new Error(resData?.error || 'Error redactando el acta detallada con Gemini.');
      }

      const acta = resData.acta;
      setUltimoResultadoIA({
        ordenDelDia: acta.ordenDelDia || [],
        desarrolloDetallado: acta.desarrolloDetallado || [],
        balanceFinanciero: acta.balanceFinanciero || [],
        decisionesYVotaciones: acta.decisionesYVotaciones || [],
        compromisos: acta.compromisos || acta.commitments || [],
        quorum: String(acta.quorum_percentage || '100'),
        horaInicio: acta.start_time || '18:00',
        tipoOrgano: acta.meeting_type || 'Asamblea / Consejo de Administración',
        summary: acta.summary
      });

      setContenidoActa(formatearActaDetalladaTexto(acta, tenantNombre));
      onShowToast?.('✨ ¡Acta oficial detallada con todos los puntos redactada exitosamente!');
    } catch (error: any) {
      console.error('Error procesando audio grande:', error);
      setContenidoActa(`❌ Fallo al procesar: ${error.message}`);
      onShowToast?.('Fallo al procesar: ' + error.message);
    } finally {
      setProcesandoIA(false);
    }
  };

  // 4. Función que conecta el botón con la IA y el audio real
  const generarActaDesdeGrabacion = async () => {
    if (archivoAudioLocal) {
      await procesarAudioSinBaseDeDatos(archivoAudioLocal);
      return;
    }

    if (audioBlobOrUrl instanceof Blob) {
      const recordedFile =
        audioBlobOrUrl instanceof File
          ? audioBlobOrUrl
          : new File([audioBlobOrUrl], `grabacion_sesion_${Date.now()}.webm`, {
              type: audioBlobOrUrl.type || 'audio/webm'
            });
      await procesarAudioSinBaseDeDatos(recordedFile);
      return;
    }

    if (typeof audioBlobOrUrl === 'string' && audioBlobOrUrl.startsWith('blob:')) {
      try {
        const blobRes = await fetch(audioBlobOrUrl);
        const resolvedBlob = await blobRes.blob();
        const recordedFile = new File([resolvedBlob], `grabacion_sesion_${Date.now()}.webm`, {
          type: resolvedBlob.type || 'audio/webm'
        });
        await procesarAudioSinBaseDeDatos(recordedFile);
        return;
      } catch (e) {
        console.warn('Error resolviendo blob URL:', e);
      }
    }

    try {
      setProcesandoIA(true);
      setContenidoActa('⏳ Generando acta exhaustiva punto por punto con Gemini IA ($ COP, orden del día, deliberaciones, votaciones y compromisos)...');
      onShowToast?.('🎙️ Generando acta exhaustiva con todos los puntos bajo Ley 675...');

      const tenantNombre =
        copropiedadInfo.name && copropiedadInfo.name !== 'Cargando...'
          ? copropiedadInfo.name
          : 'Copropiedad PH';

      const respuesta = await fetch('/api/process-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName: tenantNombre,
          meetingType: 'Asamblea / Consejo de Administración',
          meetingDate: new Date().toISOString().split('T')[0],
          contextNotes: contextNotes || `Sesión oficial de ${tenantNombre}. Comisión verificadora: ${comision1}, ${comision2}.`
        })
      });

      const resData = await respuesta.json();
      if (!respuesta.ok || !resData?.acta) {
        throw new Error(resData?.error || 'Error al procesar el acta con IA');
      }

      const acta = resData.acta;
      setUltimoResultadoIA({
        ordenDelDia: acta.ordenDelDia || [],
        desarrolloDetallado: acta.desarrolloDetallado || [],
        balanceFinanciero: acta.balanceFinanciero || [],
        decisionesYVotaciones: acta.decisionesYVotaciones || [],
        compromisos: acta.compromisos || acta.commitments || [],
        quorum: String(acta.quorum_percentage || '100'),
        horaInicio: acta.start_time || '18:00',
        tipoOrgano: acta.meeting_type || 'Asamblea / Consejo de Administración',
        summary: acta.summary
      });

      setContenidoActa(formatearActaDetalladaTexto(acta, tenantNombre));
      onShowToast?.('✨ ¡Acta oficial detallada redactada con IA exitosamente!');
    } catch (error: any) {
      console.error(error);
      setContenidoActa(`❌ Error al generar el acta: ${error.message}. Verifica la conexión con el servicio de IA.`);
      onShowToast?.(`❌ Error al generar el acta: ${error.message}`);
    } finally {
      setProcesandoIA(false);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Encabezado Superior y Botón de IA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-blue-400">
            TRANSCRIPCIÓN LEGAL CONFORME AL ART. 47 DE LA LEY 675
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            Generación y Foliado del Acta ({copropiedadInfo.name})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition-all">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>{archivoAudioLocal ? archivoAudioLocal.name : 'Adjuntar Audio (.mp3/.webm)'}</span>
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setArchivoAudioLocal(file);
                if (file) {
                  procesarAudioSinBaseDeDatos(file);
                }
              }}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={generarActaDesdeGrabacion}
            disabled={procesandoIA}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <span>✨</span>
            <span>{procesandoIA ? 'Procesando Audio con IA...' : 'Actualizar Acta con IA desde Grabación'}</span>
          </button>
        </div>
      </div>

      {/* Selectores Editables de Comisión Verificadora (Conectados al censo real de 100 unidades) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
        <div>
          <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
            Comisión Verificadora del Acta 1 ({unidadesCenso.length} Unidades en Censo)
          </label>
          <input
            type="text"
            list="lista-propietarios"
            value={comision1}
            onChange={(e) => setComision1(e.target.value)}
            placeholder="Escribe o selecciona un propietario..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
            Comisión Verificadora del Acta 2
          </label>
          <input
            type="text"
            list="lista-propietarios"
            value={comision2}
            onChange={(e) => setComision2(e.target.value)}
            placeholder="Escribe o selecciona un propietario..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Lista desplegable autocompletable con los 100 propietarios de Copropiedad_PH */}
        <datalist id="lista-propietarios">
          {unidadesCenso.map((u, i) => (
            <option key={i} value={`${u.owner_name} (Torre ${u.tower} - ${u.apartment})`} />
          ))}
        </datalist>
      </div>

      {/* Cuerpo del Acta 100% Editable y Dinámico */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <div className="text-center border-b border-slate-800 pb-4 mb-4">
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            ACTA OFICIAL • ASAMBLEA / CONSEJO DE COPROPIETARIOS {new Date().getFullYear()}
          </h3>
          <p className="text-xs font-mono text-cyan-400 mt-1">
            {copropiedadInfo.name.toUpperCase()} {copropiedadInfo.nit ? `• NIT ${copropiedadInfo.nit}` : ''} • LEY 675 DE 2001
          </p>
        </div>

        <textarea
          rows={14}
          value={contenidoActa}
          onChange={(e) => setContenidoActa(e.target.value)}
          placeholder="Haz clic en 'Actualizar Acta con IA desde Grabación' para transcribir el audio de la sesión, o redacta/edita manualmente el contenido aquí..."
          className="w-full bg-slate-950/90 border border-slate-800/90 rounded-xl p-4 text-sm font-mono text-slate-200 leading-relaxed focus:border-cyan-500 focus:outline-none resize-y"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-800">
          <span className="text-xs font-mono text-slate-400">
            Verificadores designados:{' '}
            <strong className="text-slate-200">{comision1 || 'Sin asignar'}</strong> y{' '}
            <strong className="text-slate-200">{comision2 || 'Sin asignar'}</strong>
          </span>

          <button
            type="button"
            onClick={() => {
              exportActaToLegalPDF(
                {
                  minute_number: `ACT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
                  meeting_type:
                    ultimoResultadoIA.tipoOrgano || 'Asamblea / Consejo de Administración',
                  status: 'Firmada / Aprobada',
                  meeting_date: new Date().toLocaleDateString('es-CO'),
                  start_time:
                    ultimoResultadoIA.horaInicio ||
                    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  quorum_percentage:
                    Number(String(ultimoResultadoIA.quorum || '100').replace(/[^0-9.]/g, '')) || 100,
                  president_name: comision1 || 'Comisión Verificadora 1',
                  secretary_name: comision2 || 'Comisión Verificadora 2',
                  summary:
                    ultimoResultadoIA.summary ||
                    contenidoActa ||
                    `Acta oficial de ${copropiedadInfo.name} verificada por ${comision1} y ${comision2}.`,
                  ordenDelDia: ultimoResultadoIA.ordenDelDia || [],
                  desarrolloDetallado: ultimoResultadoIA.desarrolloDetallado || [],
                  balanceFinanciero: ultimoResultadoIA.balanceFinanciero || [],
                  decisionesYVotaciones: ultimoResultadoIA.decisionesYVotaciones || [],
                  compromisos: ultimoResultadoIA.compromisos || [],
                  commitments: ultimoResultadoIA.compromisos || []
                },
                {
                  name: copropiedadInfo.name,
                  nit: copropiedadInfo.nit || '900.814.320-1',
                  zone: 'Medellín, Antioquia'
                },
                onShowToast
              );
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            <Download className="w-4 h-4" /> Descargar Acta Foliada (PDF Legal)
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorActaLegal;
