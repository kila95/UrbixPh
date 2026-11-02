import React from 'react';

interface BotonSalidaSuperAdminProps {
  onCambiarVista?: () => void;
  onCerrarSesion?: () => void;
}

export default function BotonSalidaSuperAdmin({ onCambiarVista, onCerrarSesion }: BotonSalidaSuperAdminProps) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      {/* Botón para cambiar al panel operativo de Administrador */}
      <button 
        type="button"
        onClick={onCambiarVista}
        style={{ 
          backgroundColor: '#1c1c1f', 
          border: '1px solid #34d399', 
          color: '#34d399', 
          padding: '6px 12px', 
          borderRadius: '6px', 
          fontSize: '11px', 
          fontFamily: 'monospace', 
          fontWeight: 'bold', 
          cursor: 'pointer' 
        }}
      >
        🔄 Cambiar a Vista Administrador
      </button>

      {/* Botón de cierre de sesión seguro */}
      <button 
        type="button"
        onClick={onCerrarSesion}
        style={{ 
          backgroundColor: 'transparent', 
          border: '1px solid #ef4444', 
          color: '#ef4444', 
          padding: '6px 12px', 
          borderRadius: '6px', 
          fontSize: '11px', 
          fontFamily: 'monospace', 
          fontWeight: 'bold', 
          cursor: 'pointer' 
        }}
      >
        🚪 Cerrar Sesión (Root)
      </button>
    </div>
  );
}
