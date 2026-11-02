import React, { useState } from 'react';

export interface ActivoCritico {
  id: string;
  tenantId: string;
  nombre: string;
  tipo: 'Ascensor' | 'Motobomba' | 'Planta Eléctrica' | 'RCI' | 'Otro';
  frecuencia: number; // días
  proximoVencimiento: string; // YYYY-MM-DD
  estado: 'Operativo' | 'En Mantenimiento' | 'Fuera de Servicio';
  proveedor: string;
}

const MOCK_ASSETS: ActivoCritico[] = [
  { id: 'a1', tenantId: 'ten_01', nombre: 'Ascensor Torre 1', tipo: 'Ascensor', frecuencia: 30, proximoVencimiento: '2026-11-15', estado: 'Operativo', proveedor: 'Otis Colombia' },
  { id: 'a2', tenantId: 'ten_01', nombre: 'Planta Eléctrica', tipo: 'Planta Eléctrica', frecuencia: 90, proximoVencimiento: '2026-11-01', estado: 'En Mantenimiento', proveedor: 'Caterpillar' },
];

export default function AssetManagementDashboard({ appendAuditLog }: { appendAuditLog: (action: string, details: string) => void }) {
  const [assets, setAssets] = useState<ActivoCritico[]>(MOCK_ASSETS);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl font-mono text-xs">
      <h2 className="text-lg font-bold text-white mb-4">Gestión de Activos Críticos (Ley 675)</h2>
      <table className="w-full text-left text-xs">
        <thead className="text-slate-400 border-b border-slate-800">
          <tr>
            <th className="p-3">Activo</th>
            <th className="p-3">Tipo</th>
            <th className="p-3">Próximo Mantenimiento</th>
            <th className="p-3">Estado</th>
            <th className="p-3">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {assets.map(asset => (
            <tr key={asset.id} className="text-slate-200">
              <td className="p-3 font-bold">{asset.nombre}</td>
              <td className="p-3">{asset.tipo}</td>
              <td className={`p-3 ${new Date(asset.proximoVencimiento) < new Date() ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                {asset.proximoVencimiento}
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded ${asset.estado === 'Operativo' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                  {asset.estado}
                </span>
              </td>
              <td className="p-3">
                <button 
                  onClick={() => appendAuditLog('ASSET_MAINTENANCE_UPDATE', `Actualizó mantenimiento para ${asset.nombre}`)}
                  className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded"
                >
                  Registrar Mantenimiento
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
