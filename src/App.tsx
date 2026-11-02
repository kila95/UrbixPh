import React, { useState } from 'react';
import AuthLoginExecutive from './components/AuthLoginExecutive';
import UrbixCyberSplashTransition from './components/UrbixCyberSplashTransition';
import SaaS_MasterOwnerConsole from './components/SaaS_MasterOwnerConsole';
import AdminConsoleView from './components/AdminConsoleView';
import ConsolaSupervisorAnalisisCompleto from './components/ConsolaSupervisorAnalisisCompleto';
import ConsolaUnificadaPorteria from './components/ConsolaUnificadaPorteria';
import ResidentPortalConsole from './components/ResidentPortalConsole';

// Tipos exportados para compatibilidad del ecosistema Urbix PH
export interface GuardIncidentReport {
  id: string;
  title: string;
  description?: string;
  desc?: string;
  severity: string;
  status: string;
  reportedAt: string;
  unit: string;
  assignedTo?: string;
  location?: string;
  category?: string;
  photoUrl?: string;
  tenantId?: string;
}

export interface CommonAreaReservation {
  id: string;
  area: string;
  unit: string;
  resident: string;
  date: string;
  status: 'Pendiente' | 'Aprobada' | 'Rechazada';
  pazYSalvo: boolean;
}

export interface ResidentialTenant {
  id: string;
  name: string;
  nit: string;
  zone: string;
  units: number;
}

export interface VisitaQrPH {
  id: string;
  codigo?: string;
  codigoQr: string;
  pin?: string;
  visitante?: string;
  nombreVisitante: string;
  cedula?: string;
  tipo: 'Visitante Familiar' | 'Domiciliario / Delivery' | 'Técnico de Servicio' | 'Familiar' | string;
  unidad: string;
  residenteAnfitrion?: string;
  tipoVehiculo?: 'Peatonal' | 'Carro' | 'Moto' | string;
  placa?: string;
  placaVehiculo?: string;
  celdaParqueadero?: string;
  estado: 'Autorizado' | 'Adentro' | 'Salió' | 'Rechazado';
  fechaVisita?: string;
  horaIngreso?: string;
  horaSalida?: string;
  observaciones?: string;
}

export interface EncomiendaPH {
  id: string;
  guia: string;
  empresa: string;
  unidad: string;
  destinatario: string;
  casillero: string;
  pinRetiro: string;
  fechaLlegada: string;
  horasCustodia: number;
  estado: 'En Custodia' | 'Entregado';
  fechaEntrega?: string;
  guardaReceptor: string;
}

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [splashMode, setSplashMode] = useState<'login' | 'logout' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLoginSuccess = (perfil: any) => {
    // 1. Guardar perfil
    setCurrentUserProfile(perfil);
    // 2. Activar la animación cibernética de bienvenida en pantalla completa
    setSplashMode('login');
  };

  const handleCerrarSesion = () => {
    // Activar animación cibernética de salida segura antes de limpiar la sesión
    setSplashMode('logout');
  };

  // Si se está ejecutando la animación del logo (Login o Logout)
  if (splashMode) {
    const rolNombre =
      currentUserProfile?.role === 'master_owner' || currentUserProfile?.role === 'saas_master_owner'
        ? 'MASTER OWNER ROOT'
        : currentUserProfile?.role === 'admin_ph'
        ? 'ADMINISTRADOR PH'
        : currentUserProfile?.role === 'supervisor'
        ? 'SUPERVISOR OPERATIVO'
        : currentUserProfile?.role === 'porteria' || currentUserProfile?.role === 'vigilante'
        ? 'PORTERÍA & SEGURIDAD'
        : currentUserProfile?.role === 'residente'
        ? 'RESIDENTE COPROPIETARIO'
        : currentUserProfile?.role
        ? String(currentUserProfile.role).toUpperCase()
        : 'USUARIO AUTENTICADO';

    return (
      <ErrorBoundary>
        <UrbixCyberSplashTransition
          mode={splashMode}
          rolNombre={rolNombre}
          onComplete={() => {
            if (splashMode === 'logout') {
              setCurrentUserProfile(null);
            }
            setSplashMode(null);
          }}
        />
      </ErrorBoundary>
    );
  }

  // Toast flotante global
  const renderToast = () => {
    if (!toastMessage) return null;
    return (
      <div className="fixed bottom-6 right-6 z-[999] max-w-md bg-[#090d14]/95 border-2 border-cyan-500/50 text-cyan-200 px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(0,242,254,0.35)] backdrop-blur-md text-xs font-mono flex items-center justify-between gap-3 animate-fadeIn">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
        <button
          type="button"
          onClick={() => setToastMessage(null)}
          className="text-slate-400 hover:text-white font-bold px-1"
        >
          ✕
        </button>
      </div>
    );
  };

  // Si no está autenticado -> Pantalla de Login
  if (!currentUserProfile) {
    return (
      <ErrorBoundary>
        <AuthLoginExecutive onLoginSuccess={handleLoginSuccess} onShowToast={showToast} />
        {renderToast()}
      </ErrorBoundary>
    );
  }

  // 1. VISTA DE MASTER OWNER (TÚ - ESTEBAN OCHOA)
  if (currentUserProfile.role === 'master_owner' || currentUserProfile.role === 'saas_master_owner') {
    return (
      <ErrorBoundary>
        <SaaS_MasterOwnerConsole onCerrarSesion={handleCerrarSesion} onShowToast={showToast} />
        {renderToast()}
      </ErrorBoundary>
    );
  }

  // 2. VISTA DE SUPERVISOR OPERATIVO
  if (currentUserProfile.role === 'supervisor') {
    return (
      <ErrorBoundary>
        <ConsolaSupervisorAnalisisCompleto
          userProfile={currentUserProfile}
          onCerrarSesion={handleCerrarSesion}
          onShowToast={showToast}
        />
        {renderToast()}
      </ErrorBoundary>
    );
  }

  // 3. VISTA DE PORTERÍA / VIGILANTE
  if (currentUserProfile.role === 'porteria' || currentUserProfile.role === 'vigilante') {
    return (
      <ErrorBoundary>
        <ConsolaUnificadaPorteria
          userProfile={currentUserProfile}
          onCerrarSesion={handleCerrarSesion}
          onShowToast={showToast}
        />
        {renderToast()}
      </ErrorBoundary>
    );
  }

  // 4. VISTA DE RESIDENTE
  if (currentUserProfile.role === 'residente') {
    return (
      <ErrorBoundary>
        <ResidentPortalConsole
          userProfile={currentUserProfile}
          onCerrarSesion={handleCerrarSesion}
          onShowToast={showToast}
        />
        {renderToast()}
      </ErrorBoundary>
    );
  }

  // 5. VISTA DE ADMINISTRADOR PH (POR DEFECTO Y GENERAL)
  return (
    <ErrorBoundary>
      <AdminConsoleView
        userProfile={currentUserProfile}
        onCerrarSesion={handleCerrarSesion}
        onShowToast={showToast}
      />
      {renderToast()}
    </ErrorBoundary>
  );
}

