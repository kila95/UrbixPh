import React, { useState, useEffect } from 'react';
import {
  Users, Truck, ShieldCheck, AlertTriangle, PawPrint, Car,
  Plus, CheckCircle2, FileText, Search, Building2, Printer
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Props {
  tenantId: string;
  tenantName: string;
  onShowToast?: (msg: string) => void;
}

export default function ModuloCensoYMudanzasReal({ tenantId, tenantName, onShowToast }: Props) {
  const [subTab, setSubTab] = useState<'mudanzas' | 'censo'>('mudanzas');
  const [unidades, setUnidades] = useState<any[]>([]);
  const [mudanzas, setMudanzas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  // Modal nueva solicitud de mudanza
  const [modalMudanza, setModalMudanza] = useState(false);
  const [unitIdSel, setUnitIdSel] = useState('');
  const [tipoMudanza, setTipoMudanza] = useState<'INGRESO' | 'SALIDA'>('SALIDA');
  const [fechaMudanza, setFechaMudanza] = useState(() => new Date().toISOString().split('T')[0]);
  const [placaCamion, setPlacaCamion] = useState('');
  const [conductorNombre, setConductorNombre] = useState('');
  const [depositoPagado, setDepositoPagado] = useState(true);

  // Modal editar censo de unidad
  const [unidadEditando, setUnidadEditando] = useState<any | null>(null);
  const [tipoOcupacion, setTipoOcupacion] = useState('PROPIETARIO');
  const [nombreInquilino, setNombreInquilino] = useState('');
  const [telInquilino, setTelInquilino] = useState('');
  const [inmobiliaria, setInmobiliaria] = useState('');
  const [vehiculosTexto, setVehiculosTexto] = useState('');
  const [mascotasTexto, setMascotasTexto] = useState('');

  const cargarDatos = async () => {
    if (!tenantId) return;
    setCargando(true);
    try {
      const { data: uData } = await supabase
        .from('units')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('unit_code', { ascending: true });

      if (uData) {
        setUnidades(uData);
        if (uData.length > 0 && !unitIdSel) setUnitIdSel(uData[0].id);
      }

      const { data: mData } = await supabase
        .from('moving_permits')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (mData) setMudanzas(mData);
    } catch (err: any) {
      console.warn('Error cargando censo y mudanzas:', err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const canal = supabase
      .channel(`realtime_mudanzas_${tenantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moving_permits' }, () => cargarDatos())
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [tenantId]);

  // Crear permiso de mudanza con validación automática de Paz y Salvo (Art. 29 Ley 675)
  const handleCrearMudanza = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = unidades.find((item) => item.id === unitIdSel);
    if (!u) return;

    const saldoPendiente = Number(u.pending_balance || 0);
    const estaPazYSalvo = saldoPendiente <= 0;
    const codigo = `MUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const labelUnidad = `${u.tower || 'Torre 1'} - ${u.apartment || u.unit_code}`;
    const solicitante = u.occupancy_type === 'ARRENDADO' && u.tenant_resident_name
      ? u.tenant_resident_name
      : (u.owner_name || 'Propietario Titular');

    const estadoInicial = !estaPazYSalvo
      ? 'BLOQUEADO_MORA'
      : depositoPagado
      ? 'AUTORIZADO_ADMIN'
      : 'PENDIENTE';

    const { error } = await supabase.from('moving_permits').insert([
      {
        tenant_id: tenantId,
        unit_id: u.id,
        permit_code: codigo,
        unit_label: labelUnidad,
        applicant_name: solicitante,
        applicant_role: u.occupancy_type || 'PROPIETARIO',
        move_type: tipoMudanza,
        scheduled_date: fechaMudanza,
        truck_plate: placaCamion.toUpperCase().trim() || 'POR DEFINIR',
        driver_name: conductorNombre.trim() || 'Transportador Autorizado',
        deposit_amount: 200000,
        deposit_paid: depositoPagado,
        is_paz_y_salvo: estaPazYSalvo,
        status: estadoInicial,
        authorized_by: estaPazYSalvo && depositoPagado ? 'Administración PH' : null,
        authorized_at: estaPazYSalvo && depositoPagado ? new Date().toISOString() : null
      }
    ]);

    if (error) {
      onShowToast?.(`Error radicando mudanza: ${error.message}`);
      return;
    }

    setModalMudanza(false);
    setPlacaCamion('');
    setConductorNombre('');
    cargarDatos();

    if (!estaPazYSalvo) {
      onShowToast?.(`⚠ Mudanza ${codigo} BLOQUEADA automáticamente: ${labelUnidad} presenta mora de $${saldoPendiente.toLocaleString('es-CO')} COP.`);
    } else {
      onShowToast?.(`✓ Salvoconducto de mudanza ${codigo} emitido y notificado en vivo a Portería.`);
    }
  };

  // Imprimir Salvoconducto Oficial para Portería y Ascensores
  const imprimirSalvoconductoMudanza = (m: any) => {
    const win = window.open('', '_blank', 'width=760,height=620');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Salvoconducto de Mudanza ${m.permit_code}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 30px; color: #0f172a; }
          .card { border: 2px solid #0f172a; border-radius: 12px; padding: 24px; }
          .badge { background: #10b981; color: #022c22; padding: 4px 10px; font-weight: 800; border-radius: 6px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:12px;">
            <div>
              <h2 style="margin:0;">${tenantName}</h2>
              <p style="margin:2px 0 0;font-size:12px;">SALVOCONDUCTO OFICIAL DE MUDANZA / TRASTEO (LEY 675)</p>
            </div>
            <div style="text-align:right;">
              <strong style="font-size:18px;">${m.permit_code}</strong><br/>
              <span class="badge">${m.status}</span>
            </div>
          </div>
          <p><strong>Inmueble:</strong> ${m.unit_label} &nbsp;|&nbsp; <strong>Tipo:</strong> ${m.move_type}</p>
          <p><strong>Solicitante:</strong> ${m.applicant_name} (${m.applicant_role})</p>
          <p><strong>Fecha Autorizada:</strong> ${m.scheduled_date} (${m.time_window || 'Jornada Ordinaria'})</p>
          <p><strong>Vehículo / Camión:</strong> Placa ${m.truck_plate} - Conductor: ${m.driver_name}</p>
          <p><strong>Estado Cartera:</strong> ${m.is_paz_y_salvo ? 'PAZ Y SALVO VERIFICADO ✓' : 'EN MORA'} | <strong>Depósito Garantía ($200.000):</strong> ${m.deposit_paid ? 'CONSTITUIDO ✓' : 'PENDIENTE'}</p>
          <p style="font-size:11px;color:#475569;margin-top:24px;border-top:1px dashed #94a3b8;padding-top:10px;">
            Instrucción para Portería: Verificar este código en la Consola de Garita antes de abrir puerta vehicular y proteger cabina de ascensor.
          </p>
        </div>
        <script>window.onload = function(){ window.print(); };</script>
      </body>
      </html>`);
    win.document.close();
  };

  // Guardar actualización de Censo (Arrendatario, Mascotas y Vehículos)
  const handleGuardarCensoUnidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidadEditando) return;

    const listaVehiculos = vehiculosTexto
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((placa) => ({ placa: placa.toUpperCase() }));

    const listaMascotas = mascotasTexto
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((nombre) => ({ nombre, vacunasAlDia: true }));

    const { error } = await supabase
      .from('units')
      .update({
        occupancy_type: tipoOcupacion,
        tenant_resident_name: nombreInquilino.trim() || null,
        tenant_resident_phone: telInquilino.trim() || null,
        real_estate_agency: inmobiliaria.trim() || null,
        registered_vehicles: listaVehiculos,
        registered_pets: listaMascotas,
        updated_at: new Date().toISOString()
      })
      .eq('id', unidadEditando.id);

    if (error) {
      onShowToast?.(`Error actualizando censo: ${error.message}`);
      return;
    }

    onShowToast?.(`✓ Censo de ${unidadEditando.unit_code} actualizado (Propietario/Arrendatario, Mascotas y Vehículos).`);
    setUnidadEditando(null);
    cargarDatos();
  };

  const unidadesFiltradas = unidades.filter((u) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    const codigo = (u.unit_code || '').toLowerCase();
    const apto = (u.apartment || '').toLowerCase();
    const torre = (u.tower || '').toLowerCase();
    const prop = (u.owner_name || '').toLowerCase();
    const inq = (u.tenant_resident_name || '').toLowerCase();
    return codigo.includes(q) || apto.includes(q) || torre.includes(q) || prop.includes(q) || inq.includes(q);
  });

  return (
    <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
            <Truck className="w-5 h-5 text-cyan-400" /> Censo Integral Residente &amp; Salvoconductos de Mudanza
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Separación Propietario vs. Inquilino/Inmobiliaria, registro de mascotas/vehículos y autorización de trasteos conectada con Portería.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('mudanzas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              subTab === 'mudanzas' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Permisos de Mudanza ({mudanzas.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('censo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              subTab === 'censo' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Censo Inquilinos, Vehículos &amp; Mascotas ({unidades.length})
          </button>
        </div>
      </div>

      {subTab === 'mudanzas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-mono">
              El sistema bloquea automáticamente trasteos de unidades en mora (Art. 29 Ley 675).
            </span>
            <button
              type="button"
              onClick={() => setModalMudanza(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Autorizar / Radicar Mudanza
            </button>
          </div>

          {mudanzas.length === 0 ? (
            <div className="p-8 text-center bg-[#07090e] border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500 font-mono">
              No hay mudanzas programadas en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mudanzas.map((m) => (
                <div key={m.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex flex-col justify-between gap-3 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-cyan-400">{m.permit_code}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'AUTORIZADO_ADMIN' || m.status === 'COMPLETADO_SIN_DANOS'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : m.status === 'BLOQUEADO_MORA'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{m.unit_label} · {m.move_type}</h4>
                    <p className="text-slate-300">Solicita: <strong>{m.applicant_name}</strong> ({m.applicant_role})</p>
                    <p className="text-slate-400 font-mono">Fecha: {m.scheduled_date} | Camión: {m.truck_plate}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className={m.is_paz_y_salvo ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {m.is_paz_y_salvo ? '✓ Paz y Salvo Verificado' : '✗ Bloqueado por Cartera'}
                    </span>
                    <button
                      type="button"
                      onClick={() => imprimirSalvoconductoMudanza(m)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-cyan-400" /> Salvoconducto PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'censo' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por unidad, propietario o inquilino..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-transparent text-white outline-none w-full"
            />
          </div>

          <div className="overflow-x-auto bg-[#07090e] border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Unidad</th>
                  <th className="p-3.5">Ocupación</th>
                  <th className="p-3.5">Propietario (Asamblea/Cobro)</th>
                  <th className="p-3.5">Residente / Inquilino (Citófono/Encomiendas)</th>
                  <th className="p-3.5">Vehículos &amp; Mascotas</th>
                  <th className="p-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {unidadesFiltradas.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50">
                    <td className="p-3.5 font-bold text-white">{u.tower || 'Torre 1'} - {u.apartment || u.unit_code}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.occupancy_type === 'ARRENDADO' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'
                      }`}>
                        {u.occupancy_type || 'PROPIETARIO'}
                      </span>
                    </td>
                    <td className="p-3.5">{u.owner_name || 'Sin registrar'}</td>
                    <td className="p-3.5">
                      {u.occupancy_type === 'ARRENDADO'
                        ? `${u.tenant_resident_name || 'Inquilino'} (${u.real_estate_agency || 'Directo'})`
                        : (u.owner_name || 'Habita Propietario')}
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      🚗 {(u.registered_vehicles || []).length} | 🐾 {(u.registered_pets || []).length}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setUnidadEditando(u);
                          setTipoOcupacion(u.occupancy_type || 'PROPIETARIO');
                          setNombreInquilino(u.tenant_resident_name || '');
                          setTelInquilino(u.tenant_resident_phone || '');
                          setInmobiliaria(u.real_estate_agency || '');
                          setVehiculosTexto((u.registered_vehicles || []).map((v: any) => v.placa).join(', '));
                          setMascotasTexto((u.registered_pets || []).map((p: any) => p.nombre).join(', '));
                        }}
                        className="text-cyan-400 hover:underline font-bold cursor-pointer"
                      >
                        Editar Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NUEVA MUDANZA */}
      {modalMudanza && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleCrearMudanza} className="bg-[#0b0f17] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-xs">
            <h4 className="text-sm font-bold text-white">Emitir Salvoconducto Digital de Mudanza</h4>
            <div>
              <label className="block text-slate-400 mb-1">Seleccionar Inmueble</label>
              <select
                value={unitIdSel}
                onChange={(e) => setUnitIdSel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
              >
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.tower || 'Torre 1'} - {u.apartment || u.unit_code} ({Number(u.pending_balance || 0) > 0 ? `MORA $${Number(u.pending_balance).toLocaleString('es-CO')}` : 'PAZ Y SALVO'})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Movimiento</label>
                <select
                  value={tipoMudanza}
                  onChange={(e) => setTipoMudanza(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="SALIDA">Salida de Mudanza</option>
                  <option value="INGRESO">Ingreso de Mudanza</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Fecha Programada</label>
                <input
                  type="date"
                  value={fechaMudanza}
                  onChange={(e) => setFechaMudanza(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Placa Camión (Ej. WXY-123)"
                value={placaCamion}
                onChange={(e) => setPlacaCamion(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
              />
              <input
                type="text"
                placeholder="Nombre Conductor"
                value={conductorNombre}
                onChange={(e) => setConductorNombre(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={depositoPagado}
                onChange={(e) => setDepositoPagado(e.target.checked)}
              />
              <span>Depósito de garantía ($200.000 COP) consignado</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalMudanza(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl">
                Validar Cartera y Emitir
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EDITAR CENSO DE UNIDAD */}
      {unidadEditando && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleGuardarCensoUnidad} className="bg-[#0b0f17] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-3.5 text-xs">
            <h4 className="text-sm font-bold text-white">
              Ficha Censo: {unidadEditando.tower || 'Torre 1'} - {unidadEditando.apartment || unidadEditando.unit_code}
            </h4>
            <div>
              <label className="block text-slate-400 mb-1">Calidad de Ocupación</label>
              <select
                value={tipoOcupacion}
                onChange={(e) => setTipoOcupacion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
              >
                <option value="PROPIETARIO">Habitado por Propietario</option>
                <option value="ARRENDADO">Arrendado (Inquilino / Inmobiliaria)</option>
                <option value="DESOCUPADO">Inmueble Desocupado</option>
              </select>
            </div>
            {tipoOcupacion === 'ARRENDADO' && (
              <>
                <input
                  type="text"
                  placeholder="Nombre completo del Arrendatario (Recibe encomiendas/citófono)"
                  value={nombreInquilino}
                  onChange={(e) => setNombreInquilino(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="WhatsApp Arrendatario"
                    value={telInquilino}
                    onChange={(e) => setTelInquilino(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Inmobiliaria (Opcional)"
                    value={inmobiliaria}
                    onChange={(e) => setInmobiliaria(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-slate-400 mb-1">Placas Vehículos Fijos (separadas por coma)</label>
              <input
                type="text"
                placeholder="Ej: KLS-982, MNO-45D"
                value={vehiculosTexto}
                onChange={(e) => setVehiculosTexto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Mascotas Registradas (separadas por coma)</label>
              <input
                type="text"
                placeholder="Ej: Max (Golden), Luna (Gato)"
                value={mascotasTexto}
                onChange={(e) => setMascotasTexto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setUnidadEditando(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-cyan-500 text-slate-950 font-black rounded-xl">
                Guardar Censo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
