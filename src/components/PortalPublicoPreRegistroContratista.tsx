import React, { useState } from 'react';
import {
  ShieldCheck, Upload, FileText, CheckCircle2, AlertTriangle,
  QrCode, User, Phone, Building, Calendar, HardHat, FileCheck,
  Check, ArrowRight, RefreshCw, Copy, ExternalLink, Lock
} from 'lucide-react';

export function PortalPublicoPreRegistroContratista() {
  const [step, setStep] = useState<'form' | 'pdf' | 'success'>('form');
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    documentoIdentidad: '',
    telefono: '',
    empresaContratista: '',
    nitEmpresa: '',
    especialidad: 'Plomería y Tuberías',
    copropiedadDestino: 'Reserva del Tesoro - Torre 2',
    apartamentoZona: 'Apto 1402',
    residenteAnfitrion: 'María Fernanda Gómez',
    fechaTrabajo: new Date().toISOString().split('T')[0],
    arlNombre: 'ARL SURA',
    epsNombre: 'SURA EPS',
    tipoRiesgoARL: 'Riesgo IV (Trabajo en Alturas / Eléctrico)',
  });

  const [uploadedFiles, setUploadedFiles] = useState<{
    planillaArl: File | null;
    cedulaPdf: File | null;
    certAlturas: File | null;
  }>({
    planillaArl: null,
    cedulaPdf: null,
    certAlturas: null,
  });

  const [simulatedPdfNames, setSimulatedPdfNames] = useState<{
    planillaArl?: string;
    cedulaPdf?: string;
    certAlturas?: string;
  }>({});

  const [generatedCode, setGeneratedCode] = useState<{
    pin: string;
    qrToken: string;
    expirationDate: string;
  } | null>(null);

  const [copiedPin, setCopiedPin] = useState(false);

  const handleSimulatedFileUpload = (field: 'planillaArl' | 'cedulaPdf' | 'certAlturas', filename: string) => {
    setSimulatedPdfNames(prev => ({ ...prev, [field]: filename }));
  };

  const handleRealFileUpload = (field: 'planillaArl' | 'cedulaPdf' | 'certAlturas', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFiles(prev => ({ ...prev, [field]: file }));
      setSimulatedPdfNames(prev => ({ ...prev, [field]: file.name }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'form') {
      setStep('pdf');
      return;
    }

    // Generate completion PIN code & QR
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    const randomQr = `URBIX-CTR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    setGeneratedCode({
      pin: randomPin,
      qrToken: randomQr,
      expirationDate: new Date(Date.now() + 86400000 * 3).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric'
      }),
    });

    setStep('success');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      
      {/* BARRA SUPERIOR DE MARCA URBIX CYBER / SG-SST */}
      <header className="border-b border-cyan-900/40 bg-[#0a0f1d]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <HardHat className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-white text-base">URBIX PH</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
                  Pase Público de Contratistas
                </span>
              </div>
              <p className="text-xs text-cyan-400/80 font-mono">Pre-Registro Ley 675 / SG-SST Decreto 1072</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Validación Segura de ARL</span>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        
        {/* BANNER INFORMATIVO */}
        <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl p-6 mb-8 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                Portal Oficial de Registro Técnico
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Pre-Registro de Contratistas & Técnicos
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Sube tu planilla de ARL y documentos obligatorios para agilizar tu ingreso directo en la portería del conjunto residencial.
              </p>
            </div>

            {/* BREADCRUMB PROGRESO */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 shrink-0">
              <div className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                step === 'form' ? 'bg-cyan-500 text-slate-950' : 'text-cyan-400'
              }`}>
                <span>1. Datos</span>
              </div>
              <span className="text-slate-600">→</span>
              <div className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                step === 'pdf' ? 'bg-cyan-500 text-slate-950' : step === 'success' ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                <span>2. Adjuntar PDF</span>
              </div>
              <span className="text-slate-600">→</span>
              <div className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                step === 'success' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'
              }`}>
                <span>3. Código QR</span>
              </div>
            </div>
          </div>
        </div>

        {/* PASO 1: FORMULARIO DATOS TÉCNICOS */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" /> Información del Técnico o Trabajador
                </h2>
                <p className="text-xs text-slate-400">Datos personales de la persona que ingresará a la unidad</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-800/40">
                Paso 1 de 2
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Eduardo Ruiz Soto"
                  value={formData.nombreCompleto}
                  onChange={e => setFormData({ ...formData, nombreCompleto: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Cédula de Ciudadanía / Pasaporte *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1.037.888.999"
                  value={formData.documentoIdentidad}
                  onChange={e => setFormData({ ...formData, documentoIdentidad: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Teléfono Celular / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 300 456 7890"
                  value={formData.telefono}
                  onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Especialidad de la Obra / Trabajo *</label>
                <select
                  value={formData.especialidad}
                  onChange={e => setFormData({ ...formData, especialidad: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 transition"
                >
                  <option>Plomería y Tuberías</option>
                  <option>Obra Civil y Pisos</option>
                  <option>Redes Eléctricas y Cableado</option>
                  <option>Mantenimiento de Ascensores</option>
                  <option>Impermeabilización / Fachadas</option>
                  <option>Jardinería y Zonas Verdes</option>
                  <option>Telecomunicaciones / Internet</option>
                  <option>Pintura y Carpintería</option>
                </select>
              </div>
            </div>

            {/* EMPRESA Y SG-SST */}
            <div className="flex items-center justify-between border-b border-slate-800 pt-4 pb-4">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-cyan-400" /> Empresa y Cobertura de ARL
                </h2>
                <p className="text-xs text-slate-400">Afiliación a riesgos laborales requerida por ley</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Nombre Empresa o Razón Social</label>
                <input
                  type="text"
                  placeholder="Ej: Hidráulicas y Redes Antioquia S.A.S."
                  value={formData.empresaContratista}
                  onChange={e => setFormData({ ...formData, empresaContratista: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Aseguradora de Riesgos Laborales (ARL) *</label>
                <select
                  value={formData.arlNombre}
                  onChange={e => setFormData({ ...formData, arlNombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 transition"
                >
                  <option>ARL SURA</option>
                  <option>ARL Positiva</option>
                  <option>ARL AXA Colpatria</option>
                  <option>ARL Bolívar</option>
                  <option>ARL Liberty</option>
                  <option>ARL Alfa</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Clase de Riesgo SG-SST</label>
                <select
                  value={formData.tipoRiesgoARL}
                  onChange={e => setFormData({ ...formData, tipoRiesgoARL: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 transition"
                >
                  <option>Riesgo I - II (Locativo Menor / Inspección)</option>
                  <option>Riesgo III (Mantenimiento General)</option>
                  <option>Riesgo IV (Trabajo en Alturas / Eléctrico)</option>
                  <option>Riesgo V (Alto Riesgo / Obra Pesada)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Fecha Programada del Trabajo</label>
                <input
                  type="date"
                  required
                  value={formData.fechaTrabajo}
                  onChange={e => setFormData({ ...formData, fechaTrabajo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            {/* UBICACIÓN Y ANFITRIÓN */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white">Copropiedad Destino: {formData.copropiedadDestino}</p>
                  <p className="text-slate-400">Ubicación: {formData.apartamentoZona} • Anfitrión: {formData.residenteAnfitrion}</p>
                </div>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <span>Continuar a Cargar PDF</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PASO 2: ADJUNTAR ARCHIVOS PDF (ARL Y DOCUMENTOS DE SEGURIDAD SOCIAL) */}
        {step === 'pdf' && (
          <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-cyan-400" /> Cargar Documentos SG-SST (PDF)
                </h2>
                <p className="text-xs text-slate-400">Adjunta la Planilla Única de Pago ARL/EPS vigente para aprobaciones automáticas</p>
              </div>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-xs font-bold text-slate-400 hover:text-white underline cursor-pointer"
              >
                ← Volver al paso 1
              </button>
            </div>

            {/* SECCIÓN PLANILLA ARL */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">1. Planilla de Aportes Seguridad Social (ARL + EPS) *</h3>
                    <p className="text-xs text-slate-400">Archivo PDF oficial de PILA (Miplanilla, SOI, Aportes en Línea, etc.)</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full">
                  Requerido por Portería
                </span>
              </div>

              {simulatedPdfNames.planillaArl ? (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono font-bold">{simulatedPdfNames.planillaArl}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded">PDF CORTADO & LISTO</span>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-6 text-center space-y-3 transition bg-slate-900/50">
                  <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
                  <p className="text-xs text-slate-300">
                    Arrastra y suelta aquí tu archivo PDF de Planilla ARL o haz clic para explorar
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                    <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer border border-slate-700 transition">
                      Seleccionar archivo PDF local
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={e => handleRealFileUpload('planillaArl', e)}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleSimulatedFileUpload('planillaArl', `Planilla_PILA_${formData.arlNombre.replace(/\s+/g, '_')}_2026.pdf`)}
                      className="px-4 py-2 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      ⚡ Usar PDF Demo Autogenerado
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN DOCUMENTO DE IDENTIDAD */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">2. Copia Cédula de Ciudadanía (Opcional)</h3>
                    <p className="text-xs text-slate-400">PDF o Imagen legible del documento para verificación de huella/cédula</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500">Recomendado</span>
              </div>

              {simulatedPdfNames.cedulaPdf ? (
                <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl text-xs text-cyan-300">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono font-bold">{simulatedPdfNames.cedulaPdf}</span>
                  </div>
                  <span className="text-[10px] bg-cyan-400 text-slate-950 font-black px-2 py-0.5 rounded">DOCUMENTO ADJUNTADO</span>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400">Adjunta la fotocopia de tu cédula para acelerar el escaneo en recepción</span>
                  <button
                    type="button"
                    onClick={() => handleSimulatedFileUpload('cedulaPdf', `Cedula_${formData.documentoIdentidad.replace(/\./g, '')}.pdf`)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    + Simular PDF Cédula
                  </button>
                </div>
              )}
            </div>

            {/* CERTIFICADO DE TRABAJO EN ALTURAS */}
            {formData.tipoRiesgoARL.includes('Alturas') && (
              <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-amber-300">3. Certificado de Trabajo Seguro en Alturas (Obligatorio por Riesgo IV/V)</h3>
                      <p className="text-xs text-slate-400">Vigencia requerida de entrenamiento según norma laboral</p>
                    </div>
                  </div>
                </div>

                {simulatedPdfNames.certAlturas ? (
                  <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span className="font-mono font-bold">{simulatedPdfNames.certAlturas}</span>
                    </div>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded">ALTURAS VALIDADO</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSimulatedFileUpload('certAlturas', `Certificado_Alturas_Avanzado_${formData.documentoIdentidad}.pdf`)}
                    className="w-full p-3 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/40 text-amber-200 rounded-xl font-bold text-xs transition text-center cursor-pointer"
                  >
                    + Adjuntar Certificado de Alturas (PDF Demo)
                  </button>
                )}
              </div>
            )}

            {/* BOTÓN SUBMIT FINAL */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Finalizar Pre-Registro & Generar Pase Digital</span>
              </button>
            </div>
          </form>
        )}

        {/* PASO 3: CONFIRMACIÓN Y CÓDIGO QR / PIN PARA PORTERÍA */}
        {step === 'success' && generatedCode && (
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-10 space-y-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] text-center backdrop-blur-xl">
            
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-3xl shadow-[0_0_30px_rgba(16,185,129,0.3)] mx-auto">
              ✓
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                Pre-Registro Autorizado Exitosamente
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                ¡Pase Digital de Ingreso Generado!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                Muestra este código QR o PIN de 6 dígitos en la portería de <strong>{formData.copropiedadDestino}</strong> para obtener acceso inmediato.
              </p>
            </div>

            {/* TARJETA PASE DIGITAL QR & PIN */}
            <div className="max-w-md mx-auto bg-slate-950 border-2 border-cyan-500/40 rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* ENCABEZADO PASE */}
              <div className="flex items-center justify-between text-xs text-left border-b border-slate-800 pb-3">
                <div>
                  <p className="font-bold text-white text-sm">{formData.nombreCompleto}</p>
                  <p className="text-slate-400 font-mono">CC: {formData.documentoIdentidad}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                  ARL SURA APROBADO
                </span>
              </div>

              {/* SIMULADOR QR */}
              <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex flex-col items-center justify-center shadow-inner relative group">
                <QrCode className="w-36 h-36 text-slate-950" />
                <span className="font-mono font-black text-[10px] text-slate-800 tracking-tighter mt-1">
                  {generatedCode.qrToken}
                </span>
              </div>

              {/* PIN DE ACCESO DIRECTO */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">PIN Rápido para Vigilante</p>
                  <p className="text-2xl font-black font-mono text-cyan-300 tracking-widest">{generatedCode.pin}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedCode.pin)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-xl text-xs font-bold hover:bg-cyan-900 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedPin ? '¡Copiado!' : 'Copiar PIN'}</span>
                </button>
              </div>

              {/* FECHA VIGENCIA */}
              <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>Válido hasta: {generatedCode.expirationDate}</span>
                <span className="text-emerald-400 font-bold">Estado: Pre-Autorizado</span>
              </div>
            </div>

            {/* ACCIONES FINALES */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setGeneratedCode(null);
                  setSimulatedPdfNames({});
                }}
                className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Registrar Otro Trabajador</span>
              </button>

              <a
                href="/"
                className="w-full sm:w-auto px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ir al Sistema Urbix PH</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER PÚBLICO */}
      <footer className="border-t border-slate-800/80 bg-[#080c16] px-4 py-4 text-center text-xs text-slate-500">
        <p>© 2026 Urbix PH • Plataforma Digital de Gestión de Propiedad Horizontal & SG-SST</p>
      </footer>
    </div>
  );
}

export default PortalPublicoPreRegistroContratista;
