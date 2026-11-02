import React, { useState } from 'react';
import { ShieldCheck, Database, MessageSquare, Server, X } from 'lucide-react';

export default function FooterLoginInteractivo() {
  const [modalData, setModalData] = useState<{
    titulo: string;
    subtitulo: string;
    contenido: string[];
    articulo?: string;
  } | null>(null);

  const abrirInfo = (tipo: 'sha' | 'habeas' | 'cloud') => {
    if (tipo === 'sha') {
      setModalData({
        titulo: 'Criptografía y Sesión Segura (SHA-256)',
        subtitulo: 'Protocolo de Seguridad Militar TLS 1.3 / End-to-End',
        contenido: [
          'Todas las contraseñas, tokens de autenticación y credenciales de acceso se procesan mediante funciones hash unidireccionales SHA-256 con sal criptográfica individual.',
          'El canal de citofonía WebRTC y la base de datos cuentan con cifrado en tránsito, impidiendo la interceptación de audio o credenciales por terceros en redes públicas o Wi-Fi.',
          'Mecanismo de protección activo contra ataques de fuerza bruta y suplantación de identidad en la garita.'
        ]
      });
    } else if (tipo === 'habeas') {
      setModalData({
        titulo: 'Tratamiento de Datos Personales (Ley 1581 de 2012)',
        subtitulo: 'Cumplimiento Normativo en Propiedad Horizontal de Colombia',
        articulo: 'Ley Estatutaria 1581 de 2012 y Decreto 1377 de 2013',
        contenido: [
          'Urbix PH actúa bajo los principios de legalidad, finalidad, veracidad y acceso restringido en el censo de copropietarios, residentes y visitantes.',
          'Los números telefónicos, cédulas de visitantes y registros de citófono son de uso exclusivo para la seguridad de la copropiedad y no se comparten ni comercializan con terceros.',
          'Cualquier titular puede solicitar la rectificación, actualización o supresión de sus datos de contacto ante la Administración de la copropiedad.'
        ]
      });
    } else if (tipo === 'cloud') {
      setModalData({
        titulo: 'Urbix PH Enterprise Cloud Architecture',
        subtitulo: 'Infraestructura de Alta Disponibilidad v2.4',
        contenido: [
          'Despliegue distribuido en centros de datos con tiempo de actividad garantizado del 99.98% para portería y residentes.',
          'Sincronización en tiempo real basada en WebSockets con Supabase PostgreSQL y políticas de seguridad a nivel de fila (Row-Level Security - RLS).',
          'Aislamiento de datos multi-tenant: la información de cada edificio o unidad residencial permanece completamente separada y encriptada.'
        ]
      });
    }
  };

  return (
    <>
      {/* CONTENEDOR EN DOS COLUMNAS: 2 A LA IZQUIERDA Y 2 A LA DERECHA */}
      <div className="pt-4 mt-3 border-t border-cyan-500/20 font-mono select-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
          {/* COLUMNA IZQUIERDA */}
          <div className="flex flex-col gap-2 items-center sm:items-start">
            {/* Píldora 1: SHA-256 */}
            <button
              type="button"
              onClick={() => abrirInfo('sha')}
              className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1 rounded-full border border-cyan-500/40 bg-[#06141d]/70 text-[#00f2fe] font-bold shadow-[0_0_10px_rgba(0,242,254,0.12)] hover:border-cyan-300 hover:shadow-[0_0_15px_rgba(0,242,254,0.25)] transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Sesión Cifrada SHA-256</span>
            </button>

            {/* Píldora 2: Soporte WhatsApp */}
            <a
              href="https://wa.me/573103056071?text=Hola,%20requiero%20soporte%20t%C3%A9cnico%20o%20asistencia%20para%20ingresar%20a%20la%20plataforma%20Urbix%20PH."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1 rounded-full border border-cyan-500/40 bg-[#06141d]/70 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,242,254,0.12)] hover:border-cyan-300 hover:text-[#00f2fe] hover:shadow-[0_0_15px_rgba(0,242,254,0.25)] transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Soporte Técnico WhatsApp</span>
            </a>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="flex flex-col gap-2 items-center sm:items-end">
            {/* Píldora 3: Habeas Data */}
            <button
              type="button"
              onClick={() => abrirInfo('habeas')}
              className="w-full sm:w-auto flex items-center justify-center sm:justify-end gap-1.5 px-3 py-1 rounded-full border border-cyan-500/40 bg-[#06141d]/70 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,242,254,0.12)] hover:border-cyan-300 hover:text-[#00f2fe] hover:shadow-[0_0_15px_rgba(0,242,254,0.25)] transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Habeas Data (Ley 1581)</span>
            </button>

            {/* Píldora 4: Versión Enterprise Cloud */}
            <button
              type="button"
              onClick={() => abrirInfo('cloud')}
              className="w-full sm:w-auto flex items-center justify-center sm:justify-end gap-1.5 px-3 py-1 rounded-full border border-cyan-500/40 bg-[#06141d]/70 text-cyan-400/80 font-bold shadow-[0_0_10px_rgba(0,242,254,0.12)] hover:border-cyan-300 hover:text-[#00f2fe] hover:shadow-[0_0_15px_rgba(0,242,254,0.25)] transition-all cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Urbix PH v2.4 • Enterprise</span>
            </button>
          </div>
        </div>
      </div>

      {/* VENTANA MODAL FLOTANTE DE INFORMACIÓN */}
      {modalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono animate-fadeIn">
          <div className="bg-[#05080e] border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-[0_0_35px_rgba(0,242,254,0.2)]">
            <div className="flex items-start justify-between border-b border-cyan-500/20 pb-3">
              <div>
                <h4 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse" />
                  {modalData.titulo}
                </h4>
                <p className="text-[11px] text-cyan-400/80 mt-0.5">
                  {modalData.subtitulo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalData(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalData.articulo && (
              <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl px-3 py-1.5 text-[10px] text-cyan-300 font-bold">
                📜 Marco Legal: {modalData.articulo}
              </div>
            )}

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              {modalData.contenido.map((parrafo, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#00f2fe] font-bold text-xs mt-0.5">›</span>
                  <p className="text-[11px] text-slate-300">{parrafo}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-cyan-500/10 flex justify-end">
              <button
                type="button"
                onClick={() => setModalData(null)}
                className="bg-[#00f2fe] hover:bg-cyan-300 text-slate-950 font-black px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-[0_0_12px_rgba(0,242,254,0.25)] cursor-pointer"
              >
                Cerrar Información
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
