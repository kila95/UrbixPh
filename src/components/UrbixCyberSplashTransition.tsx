import React, { useEffect, useState } from 'react';

export interface UrbixCyberSplashProps {
  mode: 'login' | 'logout';
  rolNombre?: string;
  onComplete: () => void;
}

export type UrbixCyberSplashTransitionProps = UrbixCyberSplashProps;

export default function UrbixCyberSplashTransition({
  mode,
  rolNombre = 'USUARIO AUTENTICADO',
  onComplete
}: UrbixCyberSplashProps) {
  // Estados para modo LOGIN
  const [faseZoomIn, setFaseZoomIn] = useState(false);
  const [faseU1, setFaseU1] = useState(false);
  const [faseU2, setFaseU2] = useState(false);
  const [faseNucleo, setFaseNucleo] = useState(false);
  const [porcentaje, setPorcentaje] = useState(0);

  // Estados para modo LOGOUT
  const [faseApagado, setFaseApagado] = useState(false);
  const [colapsoLogo, setColapsoLogo] = useState(false);

  // 1. LÓGICA DE INICIO (ENCENDIDO + PORCENTAJE 0% -> 100%) Y LOGOUT (APAGADO GRADUAL)
  useEffect(() => {
    if (mode === 'login') {
      const tZoom = setTimeout(() => setFaseZoomIn(true), 40);
      const tU1 = setTimeout(() => setFaseU1(true), 450);
      const tU2 = setTimeout(() => setFaseU2(true), 900);
      const tNucleo = setTimeout(() => setFaseNucleo(true), 1350);

      // Incremento rápido y dinámico de porcentaje
      const intervalo = setInterval(() => {
        setPorcentaje((prev) => {
          if (prev >= 100) {
            clearInterval(intervalo);
            return 100;
          }
          const salto = Math.floor(Math.random() * 8) + 4;
          return Math.min(prev + salto, 100);
        });
      }, 50);

      const tFin = setTimeout(() => {
        onComplete();
      }, 2300);

      return () => {
        clearTimeout(tZoom);
        clearTimeout(tU1);
        clearTimeout(tU2);
        clearTimeout(tNucleo);
        clearInterval(intervalo);
        clearTimeout(tFin);
      };
    } else {
      // 2. LÓGICA DE CIERRE DE SESIÓN (APAGADO GRADUAL + DESVANECIMIENTO)
      const tApagado = setTimeout(() => setFaseApagado(true), 200);
      const tColapso = setTimeout(() => setColapsoLogo(true), 1100);
      const tFin = setTimeout(() => {
        onComplete();
      }, 1800);

      return () => {
        clearTimeout(tApagado);
        clearTimeout(tColapso);
        clearTimeout(tFin);
      };
    }
  }, [mode, onComplete]);

  // Mensaje de estado cibernético para modo LOGIN
  const estadoTextoLogin =
    porcentaje >= 100
      ? '¡ACCESO CONCEDIDO • BIENVENIDO!'
      : faseNucleo
      ? 'NÚCLEO ENERGIZADO • DESPLEGANDO CONSOLA...'
      : faseU2
      ? 'SINCRONIZANDO CANALES DE SEGURIDAD...'
      : faseU1
      ? 'VALIDANDO MATRIZ DE ACCESO BIOMÉTRICO...'
      : 'INICIALIZANDO PROTOCOLO URBIX PH...';

  // Mensaje de estado para modo LOGOUT
  const estadoTextoLogout = faseApagado
    ? 'SESIÓN FINALIZADA • APAGANDO SISTEMA...'
    : 'GUARDANDO ESTADO LOCAL • CERRANDO PROTOCOLOS...';

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#050811] flex flex-col items-center justify-center p-6 overflow-hidden font-sans select-none transition-opacity duration-700 ${
        mode === 'logout' && colapsoLogo ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* ========================================================
          RESPLANDORES CIBERNÉTICOS Y EFECTOS AMBIENTALES
         ======================================================== */}
      {/* Resplandor radial de fondo */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          mode === 'logout' && faseApagado
            ? 'opacity-10 bg-[radial-gradient(circle_at_50%_45%,rgba(239,68,68,0.15)_0%,rgba(6,182,212,0.02)_40%,rgba(5,8,17,1)_70%)]'
            : 'opacity-100 bg-[radial-gradient(circle_at_50%_45%,rgba(0,242,254,0.18)_0%,rgba(6,182,212,0.08)_35%,rgba(5,8,17,0.98)_70%)]'
        }`}
      />

      {/* Halo de destello */}
      <div
        className={`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-700 ${
          mode === 'login'
            ? porcentaje >= 100
              ? 'w-[750px] h-[750px] bg-cyan-400/25 blur-[120px] scale-125'
              : faseNucleo
              ? 'w-[500px] h-[500px] bg-cyan-500/20 blur-[100px] scale-100'
              : 'w-[320px] h-[320px] bg-cyan-500/10 blur-[80px] scale-90'
            : faseApagado
            ? 'w-[200px] h-[200px] bg-cyan-900/10 blur-[60px] scale-75 opacity-20'
            : 'w-[450px] h-[450px] bg-cyan-500/15 blur-[90px] scale-100'
        }`}
      />

      {/* Ondas concéntricas animadas */}
      {mode === 'login' && (
        <>
          <div className="pointer-events-none absolute w-[420px] h-[420px] rounded-full border border-cyan-500/10 animate-ping opacity-20" />
          <div className="pointer-events-none absolute w-[600px] h-[600px] rounded-full border border-cyan-400/5 animate-pulse" />
        </>
      )}

      {/* ========================================================
          CONTENEDOR CENTRAL: EMBLEMA REACTOR URBIX
         ======================================================== */}
      <div
        className={`relative z-10 flex flex-col items-center text-center transition-all duration-700 ease-out transform ${
          mode === 'login'
            ? faseZoomIn
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-75 opacity-0 translate-y-6'
            : colapsoLogo
            ? 'scale-90 opacity-0 translate-y-4'
            : 'scale-100 opacity-100 translate-y-0'
        }`}
      >
        {/* CAJA REACTOR SQUIRCLE CON LUZ NEÓN */}
        <div className="relative group">
          {/* Resplandor exterior directo */}
          <div
            className={`absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-cyan-500 via-[#00f2fe] to-teal-400 blur-xl transition-all duration-700 ${
              mode === 'login'
                ? porcentaje >= 100
                  ? 'opacity-90 blur-2xl scale-105'
                  : faseNucleo
                  ? 'opacity-70 blur-xl'
                  : 'opacity-30 blur-lg'
                : faseApagado
                ? 'opacity-0 blur-sm scale-95'
                : 'opacity-50 blur-lg'
            }`}
          />

          {/* Cuadro contenedor metálico cibernético */}
          <div
            className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-[2.2rem] bg-[#070e18] border-2 transition-all duration-700 flex items-center justify-center p-6 backdrop-blur-xl ${
              mode === 'login'
                ? 'border-[#00f2fe]/60 shadow-[0_0_40px_rgba(0,242,254,0.35),inset_0_0_20px_rgba(0,242,254,0.15)]'
                : faseApagado
                ? 'border-slate-800 shadow-[0_0_10px_rgba(0,0,0,0.5)]'
                : 'border-[#00f2fe]/40 shadow-[0_0_30px_rgba(0,242,254,0.25)]'
            }`}
          >
            {/* Esquinas con acentos de micro-circuitos */}
            <div
              className={`absolute top-2.5 left-2.5 w-2 h-2 border-t-2 border-l-2 transition-colors duration-500 rounded-tl-sm ${
                mode === 'logout' && faseApagado ? 'border-slate-700' : 'border-cyan-400/80'
              }`}
            />
            <div
              className={`absolute top-2.5 right-2.5 w-2 h-2 border-t-2 border-r-2 transition-colors duration-500 rounded-tr-sm ${
                mode === 'logout' && faseApagado ? 'border-slate-700' : 'border-cyan-400/80'
              }`}
            />
            <div
              className={`absolute bottom-2.5 left-2.5 w-2 h-2 border-b-2 border-l-2 transition-colors duration-500 rounded-bl-sm ${
                mode === 'logout' && faseApagado ? 'border-slate-700' : 'border-cyan-400/80'
              }`}
            />
            <div
              className={`absolute bottom-2.5 right-2.5 w-2 h-2 border-b-2 border-r-2 transition-colors duration-500 rounded-br-sm ${
                mode === 'logout' && faseApagado ? 'border-slate-700' : 'border-cyan-400/80'
              }`}
            />

            {/* SVG REACTOR EN FASES DE CARGA O APAGADO */}
            <svg
              viewBox="0 0 48 48"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="splashNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>

              {/* FASE 1: Silueta exterior en U */}
              <path
                d="M14 15V26C14 31.5228 18.4772 36 24 36C29.5228 36 34 31.5228 34 26V15"
                stroke={
                  mode === 'login'
                    ? faseU1
                      ? '#00f2fe'
                      : '#112233'
                    : faseApagado
                    ? '#16222f'
                    : '#00f2fe'
                }
                strokeWidth="3.4"
                strokeLinecap="round"
                filter={
                  (mode === 'login' && faseU1) || (mode === 'logout' && !faseApagado)
                    ? 'url(#splashNeonGlow)'
                    : undefined
                }
                className="transition-colors duration-500"
                style={{
                  filter:
                    (mode === 'login' && faseU1) || (mode === 'logout' && !faseApagado)
                      ? 'drop-shadow(0 0 8px #00f2fe)'
                      : 'none'
                }}
              />

              {/* FASE 2: Contorno interior de la U */}
              <path
                d="M20 18V26C20 28.2091 21.7909 30 24 30C26.2091 30 28 28.2091 28 26V18"
                stroke={
                  mode === 'login'
                    ? faseU2
                      ? '#38bdf8'
                      : '#0c1a27'
                    : faseApagado
                    ? '#0e1722'
                    : '#38bdf8'
                }
                strokeWidth="2.6"
                strokeLinecap="round"
                filter={
                  (mode === 'login' && faseU2) || (mode === 'logout' && !faseApagado)
                    ? 'url(#splashNeonGlow)'
                    : undefined
                }
                className="transition-colors duration-500"
                style={{
                  filter:
                    (mode === 'login' && faseU2) || (mode === 'logout' && !faseApagado)
                      ? 'drop-shadow(0 0 6px #38bdf8)'
                      : 'none'
                }}
              />

              {/* FASE 3: Núcleo vertical central de energía */}
              <line
                x1="24"
                y1="12"
                x2="24"
                y2="22"
                stroke={
                  mode === 'login'
                    ? faseNucleo
                      ? '#FFFFFF'
                      : '#0a1520'
                    : faseApagado
                    ? '#0a1520'
                    : '#FFFFFF'
                }
                strokeWidth="3"
                strokeLinecap="round"
                className="transition-colors duration-400"
                style={{
                  filter:
                    (mode === 'login' && faseNucleo) || (mode === 'logout' && !faseApagado)
                      ? 'drop-shadow(0 0 10px #00f2fe) drop-shadow(0 0 4px #ffffff)'
                      : 'none'
                }}
              />
            </svg>
          </div>
        </div>

        {/* LOGO TIPOGRÁFICO URBIX PH */}
        <h2 className="text-3xl sm:text-4xl font-black tracking-wider uppercase font-sans select-none flex items-center justify-center gap-2 mt-6">
          <span
            className="bg-clip-text text-transparent bg-gradient-to-b from-white via-cyan-100 to-cyan-400 font-extrabold tracking-tight"
            style={{
              textShadow:
                mode === 'logout' && faseApagado
                  ? 'none'
                  : `
                0 1px 0 #cffafe,
                0 2px 0 #a5f3fc,
                0 3px 0 #67e8f9,
                0 4px 0 #22d3ee,
                0 5px 0 #0891b2,
                0 7px 12px rgba(6, 182, 212, 0.45),
                0 12px 24px rgba(0, 0, 0, 0.6)
              `,
              filter:
                mode === 'logout' && faseApagado
                  ? 'none'
                  : 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.35))'
            }}
          >
            URBIX
          </span>

          <span
            className="bg-clip-text text-transparent bg-gradient-to-b from-cyan-200 via-cyan-400 to-teal-400 font-black"
            style={{
              textShadow:
                mode === 'logout' && faseApagado
                  ? 'none'
                  : `
                0 1px 0 #67e8f9,
                0 2px 0 #22d3ee,
                0 3px 0 #06b6d4,
                0 4px 0 #0e7490,
                0 6px 10px rgba(6, 182, 212, 0.5),
                0 10px 20px rgba(0, 0, 0, 0.7)
              `,
              filter:
                mode === 'logout' && faseApagado
                  ? 'none'
                  : 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.55))'
            }}
          >
            PH
          </span>
        </h2>

        {/* CÁPSULA DE ROL IDENTIFICADO O ESTADO DE SESIÓN */}
        <div className="mt-3.5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#05131e]/90 border border-[#00f2fe]/50 shadow-[0_0_15px_rgba(0,242,254,0.25)]">
          <span
            className={`w-2 h-2 rounded-full ${
              mode === 'login'
                ? 'bg-[#00f2fe] shadow-[0_0_8px_#00f2fe] animate-pulse'
                : faseApagado
                ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                : 'bg-[#00f2fe] shadow-[0_0_8px_#00f2fe]'
            }`}
          />
          <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
            {mode === 'login' ? rolNombre : 'DESCONEXIÓN SEGURA'}
          </span>
        </div>

        {/* BARRA DE PROGRESO DE CARGA O CIERRE CIBERNÉTICO */}
        <div className="w-64 sm:w-72 mt-5 flex flex-col items-center gap-2">
          <div className="w-full h-1.5 bg-[#091522] rounded-full overflow-hidden border border-cyan-900/60 p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_#00f2fe] ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500 via-[#00f2fe] to-teal-300'
                  : faseApagado
                  ? 'bg-gradient-to-r from-cyan-900 to-slate-700 w-0'
                  : 'bg-gradient-to-r from-cyan-500 via-[#00f2fe] to-teal-300 w-full'
              }`}
              style={mode === 'login' ? { width: `${porcentaje}%` } : undefined}
            />
          </div>

          <div className="flex items-center justify-between w-full text-[10px] font-mono">
            <span className="text-cyan-400/90 font-medium tracking-wide">
              {mode === 'login' ? estadoTextoLogin : estadoTextoLogout}
            </span>
            <span className="text-[#00f2fe] font-bold">
              {mode === 'login' ? `${porcentaje}%` : faseApagado ? '0%' : '100%'}
            </span>
          </div>
        </div>

        {/* NOTA DE PROTOCOLO DE SEGURIDAD */}
        <p className="mt-4 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
          {mode === 'login'
            ? 'SISTEMA PROTEGIDO POR PROTOCOLO SHA-256 • MEDELLÍN PH'
            : 'SESIÓN FINALIZADA DE FORMA SEGURA • REGISTRO DE AUDITORÍA PROTEGIDO'}
        </p>
      </div>
    </div>
  );
}
