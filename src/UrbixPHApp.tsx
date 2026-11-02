import React, { useState } from 'react';
import { 
  Building2, Users, FileText, DollarSign, Wrench, 
  AlertTriangle, CheckCircle, Clock, Search, Plus, Trash2, 
  Edit, ArrowRight, Activity, Database, Lock, Unlock, LogOut,
  Bell, Eye, Check, X, Phone, Truck, Package, MapPin, Radio,
  Camera, AlertOctagon, RefreshCw, BarChart2, Key, ShieldCheck, QrCode, Share2
} from 'lucide-react';

// =========================================================================
// URBIX PH - VERSIÓN 3.0 MAESTRA COMPLETA (ADMIN, SUPV, VIGILANTE, RESIDENTE)
// =========================================================================

interface UrbixPHAppProps {
  initialRole?: 'admin' | 'supervisor' | 'vigilante' | 'residente';
  onBackToLanding?: () => void;
}

export interface CheckpointVigilanciaPH {
  id: string;
  codigoNfcQr: string;
  nombreZona: string;
  ubicacionExacta: string;
  estado: 'Pendiente' | 'Verificado Normal' | 'Novedad Operativa' | 'Alerta Crítica';
  horaVerificacion?: string;
  guardaResponsable?: string;
  observaciones?: string;
}

export default function UrbixPHApp({ initialRole = 'admin', onBackToLanding }: UrbixPHAppProps) {
  const [currentRole, setCurrentRole] = useState<'admin' | 'supervisor' | 'vigilante' | 'residente'>(initialRole);
  
  // Sub-pestañas internas
  const [activeTabAdmin, setActiveTabAdmin] = useState('cartera'); 
  const [activeTabSupervisor, setActiveTabSupervisor] = useState('caja'); 
  const [activeTabVigilante, setActiveTabVigilante] = useState('paquetes'); 
  const [activeTabResidente, setActiveTabResidente] = useState('qr'); 

  // Estados Base
  const [unidades] = useState([
    { id: '1', numero: 'Torre 1 - 101', propietario: 'Carlos Pérez', coeficiente: 0.0125, cuota: 450000, saldo: 0, cartera: 'Al día' },
    { id: '2', numero: 'Torre 1 - 202', propietario: 'Ana María Gómez', coeficiente: 0.0150, cuota: 540000, saldo: 1080000, cartera: 'Mora 60' },
    { id: '3', numero: 'Torre 2 - 301', propietario: 'Esteban Ochoa', coeficiente: 0.0125, cuota: 450000, saldo: 450000, cartera: 'Mora 30' },
    { id: '4', numero: 'Torre 2 - 402', propietario: 'Sofía Restrepo', coeficiente: 0.0200, cuota: 720000, saldo: 0, cartera: 'Al día' },
  ]);

  const [recaudos, setRecaudos] = useState([
    { id: '1', unidad: 'Torre 1 - 101', monto: 450000, concepto: 'Cuota Ordinaria Octubre', ref: 'CUS-98312', estado: 'Aprobado', fecha: '2026-10-01' },
    { id: '2', unidad: 'Torre 2 - 402', monto: 720000, concepto: 'Cuota Ordinaria Octubre', ref: 'CUS-98455', estado: 'Aprobado', fecha: '2026-10-02' }
  ]);

  const [egresos] = useState([
    { id: '1', proveedor: 'Seguridad El Poblado LTDA', nit: '900.123.456-1', categoria: 'Vigilancia', monto: 12500000, estado: 'Pagado' },
    { id: '2', proveedor: 'EPM (Agua y Energía)', nit: '890.904.996-1', categoria: 'EPM', monto: 4800000, estado: 'Pendiente' }
  ]);

  const [cajaMenor] = useState([
    { id: '1', concepto: 'Compra de 4 bombillos LED pasillo Torre 1', ferreteria: 'Ferretería El Diamante', monto: 85000, estado: 'Registrado en Caja Menor' }
  ]);

  const [personal] = useState([
    { id: '1', nombre: 'Roberto Sánchez', rol: 'vigilante', turno: 'Diurno 6am-2pm', arl: 'Vigente' },
    { id: '2', nombre: 'Luz Dary Marín', rol: 'aseo', turno: 'Diurno 7am-3pm', arl: 'Vigente' },
    { id: '3', nombre: 'Ascensores Schindler S.A.', rol: 'contratista', turno: 'Orden de Trabajo', arl: 'Vigente' }
  ]);

  const [accesosPorteria] = useState([
    { id: '1', visitante: 'Juan Carlos Mesa', cedula: '10389234', destino: 'Torre 1 - 101', motivo: 'Visita', vehiculo: 'Carro (V-01)', estado: 'Adentro' }
  ]);

  interface PaqueteBlindado {
    id: string;
    destino: string;
    empresa: string;
    descripcion: string;
    fotoLlegada: string;
    estado: string;
    fechaLlegada: string;
    recibidoPorResidente: string | null;
    firmaResidente: string | null;
  }

  const SAMPLE_PACKAGE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%231c1c1f'/%3E%3Cpath d='M100 60 L150 35 L200 60 L150 85 Z' fill='%23262629' stroke='%2334d399' stroke-width='2'/%3E%3Cpath d='M100 60 L100 130 L150 155 L150 85 Z' fill='%23222226' stroke='%2334d399' stroke-width='2'/%3E%3Cpath d='M200 60 L200 130 L150 155 L150 85 Z' fill='%2318181b' stroke='%2334d399' stroke-width='2'/%3E%3Ctext x='150' y='180' fill='%23a1a1aa' font-family='monospace' font-size='11' text-anchor='middle'%3EPAQUETE SELLADO #URB-892%3C/text%3E%3C/svg%3E";

  const [paquetesBlindados, setPaquetesBlindados] = useState<PaqueteBlindado[]>([
    { 
      id: '1', 
      destino: 'Torre 2 - 301', 
      empresa: 'Servientrega', 
      descripcion: 'Caja mediana sellada (Amazon)', 
      fotoLlegada: SAMPLE_PACKAGE_SVG,
      estado: 'En Custodia', 
      fechaLlegada: '2026-10-24 08:30 AM',
      recibidoPorResidente: null,
      firmaResidente: null
    }
  ]);

  const [controlLlaves] = useState([
    { id: '1', llave: 'Llave Cuarto de Bombas Sótano 2', prestadoA: 'Carlos Técnico (Schindler)', estado: 'Prestada', horaSalida: '10:00 AM' }
  ]);

  const [pasesQRResidente, setPasesQRResidente] = useState([
    { id: '1', visitante: 'Maria Gomez', cedula: '43281920', fecha: '2026-10-25', codigoQR: 'URBIX-QR-8842', estado: 'Activo' }
  ]);

  const [rondas] = useState([
    { id: '1', checkpoint: 'Perímetro y Cerramiento Norte', estado: 'Sin Novedad', hora: '06:00 AM' }
  ]);



  const [checkpointsRondas, setCheckpointsRondas] = useState<CheckpointVigilanciaPH[]>([
    {
      id: 'CP-01',
      codigoNfcQr: 'NFC-BOMBAS-01',
      nombreZona: 'Cuarto de Bombas e Hidroneumáticos',
      ubicacionExacta: 'Sótano Técnico Principal',
      estado: 'Pendiente'
    },
    {
      id: 'CP-02',
      codigoNfcQr: 'NFC-ELEC-02',
      nombreZona: 'Subestación Eléctrica y Planta de Emergencia',
      ubicacionExacta: 'Nivel Técnico / Tableros y Combustible',
      estado: 'Pendiente'
    },
    {
      id: 'CP-03',
      codigoNfcQr: 'NFC-PERIM-03',
      nombreZona: 'Perímetro Externo y Rejas de Cerramiento',
      ubicacionExacta: 'Control de Puntos Ciegos e Intrusión',
      estado: 'Pendiente'
    },
    {
      id: 'CP-04',
      codigoNfcQr: 'NFC-SOCIAL-04',
      nombreZona: 'Plataforma Social, Piscina y Zona Húmeda',
      ubicacionExacta: 'Área Recreativa (Puertas y Calderas)',
      estado: 'Pendiente'
    },
    {
      id: 'CP-05',
      codigoNfcQr: 'NFC-TORRES-05',
      nombreZona: 'Cubiertas, Domos y Puertas Cortafuego',
      ubicacionExacta: 'Torres Residenciales (Escaleras Evacuación)',
      estado: 'Pendiente'
    }
  ]);

  const registrarCheckpointRonda = (id: string, nuevoEstado: CheckpointVigilanciaPH['estado'], obs: string) => {
    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const guarda = 'Guarda Roberto Sánchez (Turno Diurno)';
    setCheckpointsRondas(checkpointsRondas.map(cp => {
      if (cp.id === id) {
        return {
          ...cp,
          estado: nuevoEstado,
          horaVerificacion: hora,
          guardaResponsable: guarda,
          observaciones: obs || (nuevoEstado === 'Verificado Normal' ? 'Área segura sin alteraciones' : 'Novedad registrada')
        };
      }
      return cp;
    }));
    if (nuevoEstado === 'Alerta Crítica') {
      setAlertaPanico(true);
    }
  };

  const [alertaPanico, setAlertaPanico] = useState(false);

  // Funciones
  const aprobarPagoSupervisor = (id: string) => {
    setRecaudos(recaudos.map(r => r.id === id ? { ...r, estado: 'Aprobado' } : r));
  };

  const registrarNuevoPaquete = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const destino = (form.elements.namedItem('destinoPaq') as HTMLInputElement).value;
    const empresa = (form.elements.namedItem('empresaPaq') as HTMLInputElement).value;
    const desc = (form.elements.namedItem('descPaq') as HTMLInputElement).value;
    const nuevo: PaqueteBlindado = {
      id: Date.now().toString(),
      destino,
      empresa,
      descripcion: desc,
      fotoLlegada: SAMPLE_PACKAGE_SVG,
      estado: 'En Custodia',
      fechaLlegada: new Date().toLocaleString(),
      recibidoPorResidente: null,
      firmaResidente: null
    };
    setPaquetesBlindados([nuevo, ...paquetesBlindados]);
    form.reset();
  };

  const entregarPaqueteConFirma = (id: string, nombreReceptor: string) => {
    setPaquetesBlindados(paquetesBlindados.map(p => {
      if (p.id === id) {
        return { ...p, estado: 'Entregado', recibidoPorResidente: nombreReceptor || 'Residente Autorizado', firmaResidente: 'Firmado Digitalmente' };
      }
      return p;
    }));
  };

  const generarPaseQRResidente = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const visitante = (form.elements.namedItem('nomVisRes') as HTMLInputElement).value;
    const cedula = (form.elements.namedItem('cedVisRes') as HTMLInputElement).value;
    const fecha = (form.elements.namedItem('fechVisRes') as HTMLInputElement).value;
    const nuevoPase = {
      id: Date.now().toString(),
      visitante,
      cedula,
      fecha,
      codigoQR: `URBIX-QR-${Math.floor(1000 + Math.random() * 9000)}`,
      estado: 'Activo'
    };
    setPasesQRResidente([nuevoPase, ...pasesQRResidente]);
    form.reset();
    alert("¡Pase QR generado con éxito!");
  };

  return (
    <div className="min-h-screen bg-[#141416] text-gray-200 font-sans flex flex-col">
      
      {/* BARRA SUPERIOR UNIFICADA */}
      <header className="bg-[#1c1c1f] border-b border-[#262629] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/30">
            <Building2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              URBIX PH <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Versión 3.0 Completa</span>
            </h1>
            <p className="text-xs text-gray-400">Sistema Integral de Propiedad Horizontal • Ley 675</p>
          </div>
        </div>

        {/* SELECTOR DE ROLES */}
        <div className="flex items-center space-x-2 bg-[#141416] p-1.5 rounded-xl border border-[#262629]">
          <button type="button" onClick={() => setCurrentRole('admin')} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${currentRole === 'admin' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}>💼 Administrador</button>
          <button type="button" onClick={() => setCurrentRole('supervisor')} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${currentRole === 'supervisor' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}>⚡ Supervisor</button>
          <button type="button" onClick={() => setCurrentRole('vigilante')} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${currentRole === 'vigilante' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}>🚨 Consola Vigilante</button>
          <button type="button" onClick={() => setCurrentRole('residente')} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${currentRole === 'residente' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}>👤 Portal Residente</button>
        </div>

        {/* ESTADO & NAVEGACIÓN */}
        <div className="flex items-center space-x-3">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#141416] hover:bg-[#262629] text-zinc-300 hover:text-white border border-[#262629] transition-colors cursor-pointer"
            >
              ← Portada / Landing
            </button>
          )}
          {alertaPanico && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-3 py-1 rounded-lg text-xs font-bold animate-pulse flex items-center gap-1">
              <AlertOctagon className="w-4 h-4" /> ¡ALERTA SOS!
            </div>
          )}
          <div className="flex items-center gap-2 bg-[#141416] px-3 py-1.5 rounded-lg border border-[#262629]">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-mono text-emerald-400">Realtime Sincronizado</span>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {/* ========================================== */}
        {/* ROL 1: ADMINISTRADOR (TABS 3.1 A 3.4)      */}
        {/* ========================================== */}
        {currentRole === 'admin' && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-[#262629] pb-3">
              <button type="button" onClick={() => setActiveTabAdmin('cartera')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabAdmin === 'cartera' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>3.1 Cartera &amp; Recaudo</button>
              <button type="button" onClick={() => setActiveTabAdmin('egresos')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabAdmin === 'egresos' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>3.2 Egresos &amp; Proveedores</button>
              <button type="button" onClick={() => setActiveTabAdmin('personal')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabAdmin === 'personal' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>3.3 Personal &amp; ARL</button>
              <button type="button" onClick={() => setActiveTabAdmin('multas')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabAdmin === 'multas' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>3.4 Convivencia &amp; Consejo</button>
            </div>

            {activeTabAdmin === 'cartera' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#1c1c1f] p-5 rounded-xl border border-[#262629]">
                    <p className="text-xs text-gray-400 font-mono">Recaudo Total del Mes</p>
                    <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">$ 1.170.000 COP</p>
                  </div>
                  <div className="bg-[#1c1c1f] p-5 rounded-xl border border-[#262629]">
                    <p className="text-xs text-gray-400 font-mono">Cartera Morosa Total</p>
                    <p className="text-2xl font-bold font-mono text-red-400 mt-1">$ 1.530.000 COP</p>
                  </div>
                  <div className="bg-[#1c1c1f] p-5 rounded-xl border border-[#262629]">
                    <p className="text-xs text-gray-400 font-mono">Unidades al Día</p>
                    <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">50% (2/4)</p>
                  </div>
                </div>

                <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                  <h3 className="text-md font-semibold text-white mb-4">Tabla Maestra de Unidades (Kardex Financiero)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-[#262629] text-gray-400">
                          <th className="pb-3">Unidad</th>
                          <th className="pb-3">Propietario</th>
                          <th className="pb-3">Coeficiente</th>
                          <th className="pb-3">Cuota Mensual</th>
                          <th className="pb-3">Saldo Actual</th>
                          <th className="pb-3">Estado Cartera</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262629]">
                        {unidades.map(u => (
                          <tr key={u.id} className="hover:bg-[#262629]/50">
                            <td className="py-3 font-bold text-white">{u.numero}</td>
                            <td className="py-3 text-gray-300">{u.propietario}</td>
                            <td className="py-3">{u.coeficiente}</td>
                            <td className="py-3">$ {u.cuota.toLocaleString()}</td>
                            <td className="py-3 font-bold text-red-400">$ {u.saldo.toLocaleString()}</td>
                            <td className="py-3"><span className={`px-2 py-1 rounded text-[10px] font-bold ${u.cartera === 'Al día' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{u.cartera}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTabAdmin === 'egresos' && (
              <div className="space-y-6">
                <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                  <h3 className="text-md font-semibold text-white mb-4">Control de Egresos y Proveedores</h3>
                  <div className="space-y-3 font-mono text-xs">
                    {egresos.map(e => (
                      <div key={e.id} className="flex justify-between items-center bg-[#141416] p-4 rounded-xl border border-[#262629]">
                        <div>
                          <p className="font-bold text-white text-sm">{e.proveedor}</p>
                          <p className="text-gray-400">Categoría: {e.categoria} | NIT: {e.nit}</p>
                        </div>
                        <span className="font-bold text-cyan-400">$ {e.monto.toLocaleString()} COP ({e.estado})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTabAdmin === 'personal' && (
              <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                <h3 className="text-md font-semibold text-white mb-4">Gestión de Personal, Contratistas y ARL</h3>
                <div className="space-y-3 font-mono text-xs">
                  {personal.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-[#141416] p-4 rounded-xl border border-[#262629]">
                      <div>
                        <p className="font-bold text-white text-sm">{p.nombre}</p>
                        <p className="text-gray-400">Rol: {p.rol} | Turno: {p.turno}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">ARL: {p.arl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTabAdmin === 'multas' && (
              <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                <h3 className="text-md font-semibold text-white mb-2">Informe Ejecutivo para el Consejo de Administración</h3>
                <p className="text-xs text-gray-400 mb-4">Consolidado automático bajo Ley 675 listo para presentación.</p>
                <div className="bg-[#141416] p-4 rounded-xl border border-[#262629] space-y-2 text-xs font-mono">
                  <p className="text-cyan-400 font-bold">📊 Estado Financiero Consolidado:</p>
                  <p>• Recaudos del Mes: $ 1.170.000 COP</p>
                  <p>• Cartera en Mora: $ 1.530.000 COP</p>
                  <p>• Novedades de Convivencia y Rondas: Sin multas críticas pendientes.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* ROL 2: SUPERVISOR (TABS 4.1 A 4.3)         */}
        {/* ========================================== */}
        {currentRole === 'supervisor' && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-[#262629] pb-3">
              <button type="button" onClick={() => setActiveTabSupervisor('caja')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabSupervisor === 'caja' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>Tab 4.1: Caja Menor &amp; Pagos</button>
              <button type="button" onClick={() => setActiveTabSupervisor('cuadrillas')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabSupervisor === 'cuadrillas' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>Tab 4.2: Cuadrillas &amp; ARL</button>
              <button type="button" onClick={() => setActiveTabSupervisor('rondas')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabSupervisor === 'rondas' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>Tab 4.3: Bitácora &amp; Rondas</button>
            </div>

            {activeTabSupervisor === 'caja' && (
              <div className="space-y-6">
                <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                  <h3 className="text-md font-semibold text-white mb-4">Bandeja de Conciliación de Pagos en Sitio</h3>
                  <div className="space-y-3 font-mono text-xs">
                    {recaudos.map(r => (
                      <div key={r.id} className="flex justify-between items-center bg-[#141416] p-4 rounded-xl border border-[#262629]">
                        <div>
                          <p className="font-bold text-white">{r.unidad} - {r.concepto}</p>
                          <p className="text-gray-400">Ref: {r.ref}</p>
                        </div>
                        <button type="button" onClick={() => aprobarPagoSupervisor(r.id)} className="bg-emerald-500 text-black font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-emerald-400">
                          ✅ Conciliar Pago
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                  <h3 className="text-md font-semibold text-white mb-4">Registro Rápido de Caja Menor</h3>
                  <div className="space-y-2 font-mono text-xs">
                    {cajaMenor.map(cm => (
                      <div key={cm.id} className="flex justify-between items-center bg-[#141416] p-3 rounded-xl border border-[#262629]">
                        <span>{cm.concepto} ({cm.ferreteria})</span>
                        <span className="text-cyan-400 font-bold">$ {cm.monto.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTabSupervisor === 'cuadrillas' && (
              <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                <h3 className="text-md font-semibold text-white mb-4">Control de Asistencia y ARL en Terreno</h3>
                <div className="space-y-3 font-mono text-xs">
                  {personal.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-[#141416] p-4 rounded-xl border border-[#262629]">
                      <span className="font-bold text-white">{p.nombre} ({p.rol})</span>
                      <span className="text-emerald-400 font-bold">🟢 En Puesto (ARL: {p.arl})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTabSupervisor === 'rondas' && (
              <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                <h3 className="text-md font-semibold text-white mb-4">Bitácora de Rondas y Novedades</h3>
                <div className="space-y-2 font-mono text-xs">
                  {rondas.map(rd => (
                    <div key={rd.id} className="flex justify-between items-center bg-[#141416] p-3 rounded-xl border border-[#262629]">
                      <span className="text-cyan-400 font-bold">{rd.checkpoint}</span>
                      <span className="text-gray-300">{rd.estado}</span>
                      <span className="text-gray-500">{rd.hora}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* ROL 3: CONSOLA INTEGRAL DEL VIGILANTE      */}
        {/* ========================================== */}
        {currentRole === 'vigilante' && (
          <div className="space-y-6">
            <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Consola de Portería &amp; Vigilancia (Todo en Uno)</h2>
                <p className="text-xs text-gray-400">Paquetería con foto/firma, validación de Pases QR de residentes, control de llaves y rondas.</p>
              </div>
              <button type="button" onClick={() => setAlertaPanico(!alertaPanico)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${alertaPanico ? 'bg-red-600 text-white animate-bounce' : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white'}`}>
                🚨 {alertaPanico ? 'EMERGENCIA ACTIVA' : 'BOTÓN DE PÁNICO SOS'}
              </button>
            </div>

            <div className="flex gap-2 border-b border-[#262629] pb-3">
              <button type="button" onClick={() => setActiveTabVigilante('paquetes')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabVigilante === 'paquetes' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>📦 Paquetería Blindada (Fotos &amp; Firmas)</button>
              <button type="button" onClick={() => setActiveTabVigilante('qr')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabVigilante === 'qr' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>📱 Validador de Pases QR</button>
              <button type="button" onClick={() => setActiveTabVigilante('ronda')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabVigilante === 'ronda' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>🛡️ Módulo de Rondas &amp; Checkpoints</button>
            </div>

            {activeTabVigilante === 'paquetes' && (
              <div className="space-y-6">
                <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                  <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-cyan-400" /> Registrar Llegada de Paquete (Evidencia Fotográfica)
                  </h3>
                  <form onSubmit={registrarNuevoPaquete} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input name="destinoPaq" type="text" placeholder="Apartamento (Ej. Torre 2 - 301)" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2 text-xs font-mono text-white" />
                    <input name="empresaPaq" type="text" placeholder="Empresa (Servientrega, Amazon...)" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2 text-xs font-mono text-white" />
                    <input name="descPaq" type="text" placeholder="Descripción (Caja, Sobre...)" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2 text-xs font-mono text-white" />
                    <button type="submit" className="bg-cyan-500 text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-cyan-400 flex items-center justify-center gap-2 cursor-pointer">
                      <Camera className="w-4 h-4" /> Tomar Foto &amp; Recibir
                    </button>
                  </form>
                </div>

                <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                  <h3 className="text-md font-semibold text-white mb-4">Custodia y Entrega con Firma Digital</h3>
                  <div className="space-y-4">
                    {paquetesBlindados.map(pq => (
                      <div key={pq.id} className="bg-[#141416] p-4 rounded-xl border border-[#262629] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <img src={pq.fotoLlegada} alt="Evidencia Paquete" className="w-16 h-16 rounded-lg object-cover border border-[#262629]" />
                          <div>
                            <p className="font-bold text-white text-sm">Destino: {pq.destino}</p>
                            <p className="text-xs text-gray-400 font-mono">{pq.empresa} - {pq.descripcion}</p>
                            <p className="text-[10px] text-gray-500 font-mono mt-1">Llegada: {pq.fechaLlegada}</p>
                            {pq.estado === 'Entregado' && (
                              <p className="text-[10px] text-emerald-400 font-mono mt-1">Entregado a: {pq.recibidoPorResidente} | {pq.firmaResidente}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          {pq.estado === 'En Custodia' ? (
                            <button type="button" onClick={() => {
                              const receptor = prompt("Nombre de la persona que retira el paquete:");
                              if(receptor) entregarPaqueteConFirma(pq.id, receptor);
                            }} className="bg-emerald-500 text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-emerald-400 flex items-center gap-2 cursor-pointer">
                              <ShieldCheck className="w-4 h-4" /> Entregar con Firma Digital
                            </button>
                          ) : (
                            <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs font-mono">
                              🟢 Entregado Correctamente
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTabVigilante === 'qr' && (
              <div className="space-y-6">
                <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                  <h3 className="text-md font-semibold text-white mb-2 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-cyan-400" /> Escanear o Ingresar Código QR del Visitante
                  </h3>
                  <div className="flex gap-3 mt-4">
                    <input id="inputCodigoQR" type="text" placeholder="Ingrese Código QR (Ej. URBIX-QR-8842)" className="flex-1 bg-[#141416] border border-[#262629] rounded-xl px-4 py-2 text-xs font-mono text-white" />
                    <button type="button" onClick={() => {
                      const inputEl = document.getElementById('inputCodigoQR') as HTMLInputElement;
                      const val = inputEl?.value;
                      const encontrado = pasesQRResidente.find(p => p.codigoQR === val);
                      if(encontrado) {
                        alert(`🟢 ACCESO AUTORIZADO: Visitante ${encontrado.visitante} (Cédula: ${encontrado.cedula})`);
                      } else {
                        alert(`🔴 CÓDIGO QR INVÁLIDO O EXPIRADO`);
                      }
                    }} className="bg-cyan-500 text-black font-bold px-6 py-2 rounded-xl text-xs hover:bg-cyan-400 cursor-pointer">
                      Validar QR en Puerta
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTabVigilante === 'ronda' && (
              <div className="space-y-6">
                <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-md font-semibold text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-cyan-400" /> Panel de Puntos Críticos Georreferenciados (Checkpoints NFC/QR)
                      </h3>
                      <p className="text-xs text-gray-400">Ley 675 / Superintendencia de Vigilancia Privada - Trazabilidad Inmutable</p>
                    </div>
                    <span className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">
                      Completados: {checkpointsRondas.filter(c => c.estado !== 'Pendiente').length} / {checkpointsRondas.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {checkpointsRondas.map(cp => (
                      <div key={cp.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        cp.estado === 'Verificado Normal' ? 'bg-emerald-950/20 border-emerald-500/30' :
                        cp.estado === 'Novedad Operativa' ? 'bg-amber-950/20 border-amber-500/30' :
                        cp.estado === 'Alerta Crítica' ? 'bg-red-950/30 border-red-500/50 animate-pulse' :
                        'bg-[#141416] border-[#262629]'
                      }`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-400 bg-[#1c1c1f] px-2 py-0.5 rounded border border-[#262629]">{cp.codigoNfcQr}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              cp.estado === 'Verificado Normal' ? 'bg-emerald-500/20 text-emerald-400' :
                              cp.estado === 'Novedad Operativa' ? 'bg-amber-500/20 text-amber-400' :
                              cp.estado === 'Alerta Crítica' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>{cp.estado}</span>
                          </div>
                          <h4 className="font-bold text-white text-sm">{cp.nombreZona}</h4>
                          <p className="text-xs text-gray-400 font-mono">Ubicación: {cp.ubicacionExacta}</p>
                          {cp.horaVerificacion && (
                            <p className="text-[10px] text-gray-500 font-mono">Último Chequeo: {cp.horaVerificacion} | Guarda: {cp.guardaResponsable} | Obs: {cp.observaciones}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => {
                            const obs = prompt("Observación del punto (Normal):", "Área segura sin alteraciones");
                            if(obs !== null) registrarCheckpointRonda(cp.id, 'Verificado Normal', obs);
                          }} className="bg-emerald-500 text-black font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-400 cursor-pointer">
                            ✅ Verificado Normal
                          </button>
                          <button type="button" onClick={() => {
                            const novedad = prompt("Registrar Hallazgo / Mantenimiento para Toderos (Ej. Luminaria fundida, filtración):", "Luminaria fundida");
                            if(novedad) registrarCheckpointRonda(cp.id, 'Novedad Operativa', novedad);
                          }} className="bg-amber-500 text-black font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-amber-400 cursor-pointer">
                            🔧 Novedad / Toderos
                          </button>
                          <button type="button" onClick={() => {
                            const alerta = prompt("⚠️ ALERTA DE SEGURIDAD CRÍTICA (Ej. Puerta forzada, intrusión, conato):", "Puerta forzada");
                            if(alerta) registrarCheckpointRonda(cp.id, 'Alerta Crítica', alerta);
                          }} className="bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 cursor-pointer">
                            🚨 Alerta Crítica
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* ROL 4: PORTAL DEL RESIDENTE                */}
        {/* ========================================== */}
        {currentRole === 'residente' && (
          <div className="space-y-6">
            <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Portal del Propietario / Residente (Torre 2 - 301)</h2>
                <p className="text-xs text-gray-400">Generación de pases QR para visitantes y visualización de paquetes en custodia.</p>
              </div>
              <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">🟢 Paz y Salvo Vigente</span>
            </div>

            <div className="flex gap-2 border-b border-[#262629] pb-3">
              <button type="button" onClick={() => setActiveTabResidente('qr')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabResidente === 'qr' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>📱 Generar Pase QR para Visitante</button>
              <button type="button" onClick={() => setActiveTabResidente('mispaquetes')} className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTabResidente === 'mispaquetes' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400'}`}>📦 Mis Paquetes en Portería</button>
            </div>

            {activeTabResidente === 'qr' && (
              <div className="space-y-6">
                <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                  <h3 className="text-md font-semibold text-white mb-4">Crear Autorización y Pase QR Rápido</h3>
                  <form onSubmit={generarPaseQRResidente} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input name="nomVisRes" type="text" placeholder="Nombre del Visitante" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2 text-xs font-mono text-white" />
                    <input name="cedVisRes" type="text" placeholder="Cédula" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2 text-xs font-mono text-white" />
                    <input name="fechVisRes" type="date" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2 text-xs font-mono text-white" />
                    <button type="submit" className="bg-cyan-500 text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-cyan-400 cursor-pointer">
                      Generar Pase QR
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTabResidente === 'mispaquetes' && (
              <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
                <h3 className="text-md font-semibold text-white mb-4">Paquetes a nombre de Torre 2 - 301</h3>
                <div className="space-y-3">
                  {paquetesBlindados.filter(pq => pq.destino.includes('301')).map(pq => (
                    <div key={pq.id} className="bg-[#141416] p-4 rounded-xl border border-[#262629] flex items-center gap-4 font-mono text-xs">
                      <img src={pq.fotoLlegada} alt="Paquete" className="w-14 h-14 rounded-lg object-cover border border-[#262629]" />
                      <div>
                        <p className="font-bold text-white text-sm">{pq.empresa} - {pq.descripcion}</p>
                        <p className="text-gray-400">Llegada: {pq.fechaLlegada} | Estado: <span className="text-amber-400">{pq.estado}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
