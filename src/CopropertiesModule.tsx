import React, { useState } from 'react';

export default function CopropertiesModule() {
  // Estado de Copropiedades & Salud Operativa (Módulo 1)
  const [coproperties] = useState([
    { id: 1, name: 'P.H. Reserva del Tesoro', city: 'El Poblado, Medellín', units: 120, collectionRate: 94.5, health: 'Óptimo', coords: '6.2088° N, 75.5678° W' },
    { id: 2, name: 'Edificio Torre El Poblado', city: 'El Poblado, Medellín', units: 45, collectionRate: 88.2, health: 'Estable', coords: '6.2150° N, 75.5700° W' },
    { id: 3, name: 'C.C. San Diego (Localidades)', city: 'Centro, Medellín', units: 80, collectionRate: 79.0, health: 'Crítico / Alerta', coords: '6.2442° N, 75.5650° W' }
  ]);

  // Simulador de Presupuesto e IPC
  const [presupuestoBase, setPresupuestoBase] = useState(45000000);
  const [ipcProyectado, setIpcProyectado] = useState(5.5);
  const [salarioMinimoInc, setSalarioMinimoInc] = useState(7.0);

  // Buscador para el Repositorio Legal
  const [searchTerm, setSearchTerm] = useState('');

  const nuevoPresupuesto = Math.round(presupuestoBase * (1 + (ipcProyectado + salarioMinimoInc) / 200));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f8fafc', padding: '24px', fontFamily: 'sans-serif' }}>
      
      {/* HEADER DEL MÓDULO 1 */}
      <div style={{ backgroundColor: '#141416', border: '1px solid #262629', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '10px', fontFamily: 'monospace', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>
            [ URBIX PH - MÓDULO 1 ]
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', margin: '8px 0 4px 0' }}>
            Copropiedades & Salud Operativa Multi-Tenant
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Medellín & Valle de Aburrá • Control de Recaudo, Georreferenciación y Ley 675
          </p>
        </div>
        <div style={{ backgroundColor: '#1c1c1f', padding: '10px 16px', borderRadius: '8px', border: '1px solid #262629', fontSize: '12px', fontFamily: 'monospace' }}>
          <p style={{ color: '#34d399', fontWeight: 'bold', margin: 0 }}>● Supabase RLS: Activo</p>
          <p style={{ color: '#64748b', margin: '2px 0 0 0' }}>Multi-Tenant Conectado</p>
        </div>
      </div>

      {/* GRILLA PRINCIPAL DE LAS 4 CARACTERÍSTICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* 1. MOTOR DE SEMÁFORO DE SALUD OPERATIVA */}
        <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '24px', gridColumn: '1 / -1' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#ffffff' }}>1. Matriz de Salud Operativa y Recaudo</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>Evaluación automática basada en recaudo mensual, PQRS y contratos de mantenimiento.</p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                <th style={{ padding: '12px' }}>Copropiedad</th>
                <th style={{ padding: '12px' }}>Ubicación</th>
                <th style={{ padding: '12px' }}>Unidades</th>
                <th style={{ padding: '12px' }}>Eficacia Recaudo</th>
                <th style={{ padding: '12px' }}>Estado de Salud</th>
              </tr>
            </thead>
            <tbody>
              {coproperties.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #262629' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#fff' }}>{c.name}</td>
                  <td style={{ padding: '12px', color: '#94a3b8', fontSize: '12px' }}>{c.city}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#cbd5e1' }}>{c.units}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#34d399' }}>{c.collectionRate}%</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', backgroundColor: c.health.includes('Óptimo') ? 'rgba(52, 211, 153, 0.1)' : c.health.includes('Estable') ? 'rgba(59, 130, 246, 0.1)' : 'rgba(248, 113, 113, 0.1)', color: c.health.includes('Óptimo') ? '#34d399' : c.health.includes('Estable') ? '#60a5fa' : '#f87171' }}>
                      {c.health.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. MAPA GEORREFERENCIADO (VALLE DE ABURRÁ) */}
        <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#ffffff' }}>2. Mapa Georreferenciado (Valle de Aburrá)</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>Distribución espacial de copropiedades administradas.</p>
          
          <div style={{ backgroundColor: '#1c1c1f', borderRadius: '8px', border: '1px solid #262629', padding: '16px', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', fontFamily: 'monospace', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #262629', paddingBottom: '8px' }}>
              <span style={{ color: '#34d399' }}>📍 P.H. Reserva del Tesoro</span>
              <span style={{ color: '#94a3b8' }}>El Poblado (6.2088° N)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #262629', paddingBottom: '8px' }}>
              <span style={{ color: '#60a5fa' }}>📍 Edificio Torre El Poblado</span>
              <span style={{ color: '#94a3b8' }}>El Poblado (6.2150° N)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#f87171' }}>📍 C.C. San Diego</span>
              <span style={{ color: '#94a3b8' }}>Centro (6.2442° N)</span>
            </div>
          </div>
        </div>

        {/* 3. REPOSITORIO DOCUMENTAL LEGAL (LEY 675) */}
        <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#ffffff' }}>3. Repositorio Documental & Ley 675</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>Gestión segura de escrituras, NITs y reglamentos (RLS).</p>
          
          <input 
            type="text" 
            placeholder="Buscar documento o reglamento..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: '#1c1c1f', border: '1px solid #262629', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px', fontFamily: 'monospace' }}
          />

          <div style={{ backgroundColor: '#1c1c1f', borderRadius: '8px', border: '1px solid #262629', padding: '12px', fontSize: '12px', fontFamily: 'monospace', color: '#cbd5e1' }}>
            <p style={{ margin: '0 0 6px 0', color: '#34d399' }}>📁 Reglamento_PH_ReservaTesoro.pdf</p>
            <p style={{ margin: '0 0 6px 0', color: '#34d399' }}>📁 EscrituraPublica_CC_SanDiego.pdf</p>
            <p style={{ margin: '0', color: '#60a5fa' }}>📄 NIT_Y_RUT_TorrePoblado.pdf</p>
          </div>
        </div>

        {/* 4. SIMULADOR FINANCIERO DE INCREMENTO ANUAL */}
        <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '24px', gridColumn: '1 / -1' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#ffffff' }}>4. Simulador Financiero de Incremento Anual (IPC & Salario Mínimo)</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>Proyección automática del impacto en la cuota de administración para la asamblea ordinaria.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>PRESUPUESTO BASE ACTUAL (COP)</label>
              <input 
                type="number" 
                value={presupuestoBase} 
                onChange={(e) => setPresupuestoBase(Number(e.target.value))}
                style={{ width: '100%', backgroundColor: '#1c1c1f', border: '1px solid #262629', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>IPC PROYECTADO (%)</label>
              <input 
                type="number" 
                value={ipcProyectado} 
                onChange={(e) => setIpcProyectado(Number(e.target.value))}
                style={{ width: '100%', backgroundColor: '#1c1c1f', border: '1px solid #262629', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>INCREMENTO SALARIO MÍNIMO (%)</label>
              <input 
                type="number" 
                value={salarioMinimoInc} 
                onChange={(e) => setSalarioMinimoInc(Number(e.target.value))}
                style={{ width: '100%', backgroundColor: '#1c1c1f', border: '1px solid #262629', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1f', padding: '16px', borderRadius: '8px', border: '1px solid #262629', fontFamily: 'monospace' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>NUEVO PRESUPUESTO PROYECTADO:</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#34d399' }}>${nuevoPresupuesto.toLocaleString()} COP</span>
            </div>
            <button 
              type="button"
              onClick={() => alert("📊 Borrador de presupuesto para asamblea exportado con éxito.")}
              style={{ backgroundColor: '#10b981', color: '#09090b', fontWeight: 'bold', fontSize: '11px', padding: '10px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'monospace' }}
            >
              EXPORTAR BORRADOR ASAMBLEA
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
