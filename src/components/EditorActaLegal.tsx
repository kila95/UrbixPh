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

const DEFAULT_TRICENTENARIO_TENANT_ID = '22079bb5-6ac7-4a15-be89-c53d14e4221b';

export const EditorActaLegal: React.FC<Props> = ({
  tenantId,
  audioBlobOrUrl,
  contextNotes = '',
  onShowToast
}) => {
  // 1. Estados dinámicos (sin texto quemado de Reserva del Tesoro)
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
    balanceFinanciero?: any[];
    decisionesYVotaciones?: any[];
    compromisos?: any[];
    quorum?: string;
    horaInicio?: string;
    tipoOrgano?: string;
  }>({});

  // 2. Cargar datos reales de la copropiedad (Urb. Tricentenario) y lista de propietarios
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
            // Fallback al UUID de Tricentenario
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
            name: tenant.name || 'Urb. Tricentenario',
            nit: (tenant as any).nit || '900.814.320-1'
          });
        } else {
          setCopropiedadInfo({
            name: 'Urb. Tricentenario',
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
          // Preseleccionar los 2 primeros o dejarlos listos para elegir
          setComision1(`${units[0].owner_name} (Torre ${units[0].tower} - ${units[0].apartment})`);
          if (units[1]) {
            setComision2(`${units[1].owner_name} (Torre ${units[1].tower} - ${units[1].apartment})`);
          }
        }
      } catch (err) {
        console.error('Error cargando datos de copropiedad en EditorActaLegal:', err);
        setCopropiedadInfo({ name: 'Urb. Tricentenario', nit: '900.814.320-1' });
      }
    };

    cargarDatosCopropiedad();
  }, [tenantId]);

  // 3. Procesar archivos pesados de audio sin pasar por la base de datos (Subida Resumable a Gemini Files API)
  const procesarAudioSinBaseDeDatos = async (file: File) => {
    setProcesandoIA(true);
    setContenidoActa('⏳ Iniciando sesión de subida directa a Google Gemini y transcribiendo audio completo ($ COP, votaciones y compromisos)...');
    onShowToast?.(`🎙️ Subiendo "${file.name}" directamente al motor de IA y redactando acta oficial...`);

    try {
      const mimeType = file.type || 'audio/mp3';

      // 1. Obtener la sesión de subida de Google desde tu backend (petición de 1 KB)
      const initRes = await fetch('/api/obtener-url-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mimeType, fileSize: file.size, displayName: file.name })
      });
      if (!initRes.ok) {
        const errInit = await initRes.json().catch(() => ({}));
        throw new Error(errInit.error || 'No se pudo obtener la sesión de subida de Gemini.');
      }
      const { uploadUrl } = await initRes.json();

      // 2. Subir el archivo PESADO directamente desde el navegador a Google
      // No toca tu base de datos ni satura Vercel (con respaldo automático si el navegador restringe CORS)
      let uploadData: any = null;
      try {
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': mimeType,
            'X-Goog-Upload-Command': 'upload, finalize',
            'X-Goog-Upload-Offset': '0',
          },
          body: file,
        });
        if (!uploadRes.ok) throw new Error(`HTTP ${uploadRes.status}`);
        uploadData = await uploadRes.json();
      } catch {
        const fallbackRes = await fetch(
          `/api/upload-stream-gemini?uploadUrl=${encodeURIComponent(uploadUrl)}&mimeType=${encodeURIComponent(mimeType)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': mimeType },
            body: file,
          }
        );
        if (!fallbackRes.ok) {
          const errUp = await fallbackRes.json().catch(() => ({}));
          throw new Error(errUp.error || 'Error al transferir el archivo de audio a Gemini Files API.');
        }
        uploadData = await fallbackRes.json();
      }

      const fileUri = uploadData?.file?.uri;
      if (!fileUri) {
        throw new Error('Google Gemini no devolvió un URI válido para el archivo de audio.');
      }

      // 3. Solicitar la redacción del acta usando el URI temporal
      const respuesta = await fetch('/api/generar-acta-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUri: fileUri,
          mimeType,
          tenantNombre: copropiedadInfo.name && copropiedadInfo.name !== 'Cargando...' ? copropiedadInfo.name : 'Urb. Tricentenario',
          comision1,
          comision2,
          contextNotes
        })
      });

      if (!respuesta.ok) {
        const errGen = await respuesta.json().catch(() => ({}));
        throw new Error(errGen.error || 'Error redactando el acta con Gemini.');
      }

      const data = await respuesta.json();
      setUltimoResultadoIA(data);
      setContenidoActa(data.actaFinal || '');
      onShowToast?.('✨ ¡Acta oficial redactada con IA exitosamente!');
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
    // Si hay un archivo local seleccionado, usar el flujo directo sin base de datos
    if (archivoAudioLocal) {
      await procesarAudioSinBaseDeDatos(archivoAudioLocal);
      return;
    }

    // Si viene un Blob desde la grabadora en vivo, convertirlo a File y usar el mismo flujo sin base de datos
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

    const fuenteAudio = archivoAudioLocal || audioBlobOrUrl;

    if (!fuenteAudio && !contextNotes) {
      if (onShowToast) {
        onShowToast('⚠️ No hay una grabación de audio activa o cargada para procesar. Graba en la sala o adjunta un archivo de audio.');
      }
      setContenidoActa(
        '⚠️ No hay una grabación de audio activa o cargada para procesar. Por favor grabe la sesión en la sala o seleccione un archivo de audio (.mp3, .webm, .wav, .m4a) arriba.'
      );
      return;
    }

    try {
      setProcesandoIA(true);
      setContenidoActa('⏳ Transcribiendo grabación y extrayendo cifras exactas ($ COP), votaciones y compromisos...');
      onShowToast?.('🎙️ Procesando audio y generando acta exhaustiva bajo Ley 675...');

      const formData = new FormData();
      if (typeof fuenteAudio === 'string' && fuenteAudio) {
        formData.append('audioUrl', fuenteAudio);
      }

      const effectiveTenantId =
        tenantId && tenantId !== 't1' ? tenantId : DEFAULT_TRICENTENARIO_TENANT_ID;
      formData.append('tenantId', effectiveTenantId);
      formData.append('copropiedadNombre', copropiedadInfo.name);
      if (contextNotes) {
        formData.append('contextNotes', contextNotes);
      }

      const respuesta = await fetch('/api/transcribir-acta', {
        method: 'POST',
        body: formData
      });

      if (!respuesta.ok) throw new Error('Error al procesar el audio con IA');

      const data = await respuesta.json();
      setUltimoResultadoIA(data);

      const actaRedactada = `ACTA OFICIAL • ${data.tipoOrgano || 'CONSEJO DE ADMINISTRACIÓN / ASAMBLEA GENERAL'}
${copropiedadInfo.name.toUpperCase()} • LEY 675 DE 2001

I. VERIFICACIÓN DEL QUÓRUM Y ASISTENCIA:
Siendo las ${data.horaInicio || new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} del ${new Date().toLocaleDateString('es-CO')}, se reunieron los integrantes de ${copropiedadInfo.name}. Quórum verificado: ${data.quorum || '100% de asistentes en sala'}.

II. DESARROLLO DEL ORDEN DEL DÍA Y DELIBERACIONES:
${data.desarrolloDetallado}

III. BALANCE ECONÓMICO Y CUADRO DE VALORES ($ COP):
${data.tablaPresupuestoTexto}

IV. DECISIONES Y VOTACIONES:
${data.decisionesTexto}

V. COMPROMISOS Y TAREAS ASIGNADAS:
${data.compromisosTexto}

VI. COMISIÓN VERIFICADORA DEL ACTA:
En constancia firman los designados para la verificación de la presente acta:
- ${comision1 || 'Pendiente de asignar'}
- ${comision2 || 'Pendiente de asignar'}`;

      setContenidoActa(actaRedactada);
      onShowToast?.('✨ ¡Acta oficial redactada con IA exitosamente!');
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

        {/* Lista desplegable autocompletable con los 100 propietarios de Tricentenario */}
        <datalist id="lista-propietarios">
          {unidadesCenso.map((u, i) => (
            <option key={i} value={`${u.owner_name} (Torre ${u.tower} - ${u.apartment})`} />
          ))}
        </datalist>
      </div>

      {/* Cuerpo del Acta 100% Editable (Sin texto estático de Reserva del Tesoro) */}
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
                    contenidoActa ||
                    `Acta oficial de ${copropiedadInfo.name} verificada por ${comision1} y ${comision2}.`,
                  balanceFinanciero: ultimoResultadoIA.balanceFinanciero || [],
                  decisionesYVotaciones: ultimoResultadoIA.decisionesYVotaciones || [],
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
