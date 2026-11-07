import React, { useState, useEffect } from 'react';
import {
  Scale, Users, ShieldCheck, FileCheck2, Award, Plus, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Props {
  tenantId: string;
  tenantName: string;
  onShowToast?: (msg: string) => void;
}

export default function ModuloGobiernoYConsejoReal({ tenantId, tenantName, onShowToast }: Props) {
  const [subTab, setSubTab] = useState<'licitaciones' | 'poderes'>('licitaciones');
  const [unidades, setUnidades] = useState<any[]>([]);
  const [poderes, setPoderes] = useState<any[]>([]);
  const [licitaciones, setLicitaciones] = useState<any[]>([]);
  const [votosConsejo, setVotosConsejo] = useState<Record<string, any[]>>({});
  const [maxPoderesPorPersona, setMaxPoderesPorPersona] = useState<number>(2);

  // Estado Modal Nuevo Poder
  const [modalPoder, setModalPoder] = useState(false);
  const [unitPoderdanteId, setUnitPoderdanteId] = useState('');
  const [nombreApoderado, setNombreApoderado] = useState('');
  const [cedulaApoderado, setCedulaApoderado] = useState('');
  const [unidadApoderado, setUnidadApoderado] = useState('');

  // Estado Modal Nueva Licitación (3 Cotizaciones)
  const [modalLicitacion, setModalLicitacion] = useState(false);
  const [tituloLic, setTituloLic] = useState('');
  const [presupuestoMax, setPresupuestoMax] = useState('15000000');
  const [provA, setProvA] = useState('');
  const [montoA, setMontoA] = useState('');
  const [provB, setProvB] = useState('');
  const [montoB, setMontoB] = useState('');
  const [provC, setProvC] = useState('');
  const [montoC, setMontoC] = useState('');

  const cargarTodo = async () => {
    if (!tenantId) return;
    try {
      const { data: uData } = await supabase
        .from('units')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('unit_code', { ascending: true });

      if (uData) {
        setUnidades(uData);
        if (uData.length > 0 && !unitPoderdanteId) setUnitPoderdanteId(uData[0].id);
      }

      const { data: pData } = await supabase
        .from('assembly_proxies')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (pData) setPoderes(pData);

      const { data: lData } = await supabase
        .from('council_tenders')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (lData) {
        setLicitaciones(lData);
        const { data: vData } = await supabase.from('council_tender_votes').select('*');
        if (vData) {
          const agrupados: Record<string, any[]> = {};
          vData.forEach((v) => {
            if (!agrupados[v.tender_id]) agrupados[v.tender_id] = [];
            agrupados[v.tender_id].push(v);
          });
          setVotosConsejo(agrupados);
        }
      }
    } catch (err: any) {
      console.warn('Error cargando gobierno corporativo:', err.message);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, [tenantId]);

  // 1. Registrar Poder Digital validando el Tope Reglamentario
  const handleRegistrarPoder = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = unidades.find((item) => item.id === unitPoderdanteId);
    if (!u || !nombreApoderado.trim() || !cedulaApoderado.trim()) return;

    // Contar cuántos poderes activos tiene ya esa misma cédula
    const poderesActualesApoderado = poderes.filter(
      (p) => p.proxy_holder_document === cedulaApoderado.trim() && p.status === 'VALIDADO'
    ).length;

    if (poderesActualesApoderado >= maxPoderesPorPersona) {
      onShowToast?.(
        `⚠ Rechazado por Reglamento PH: El apoderado C.C. ${cedulaApoderado} ya representa el tope máximo de ${maxPoderesPorPersona} unidades.`
      );
      return;
    }

    const coefUnidad = Number(u.coefficient || 0.01) * (Number(u.coefficient) <= 1 ? 100 : 1);
    const labelUnidad = `${u.tower || 'Torre 1'} - ${u.apartment || u.unit_code}`;

    const { error } = await supabase.from('assembly_proxies').insert([
      {
        tenant_id: tenantId,
        principal_unit_id: u.id,
        principal_unit_label: labelUnidad,
        principal_owner_name: u.owner_name || 'Propietario Titular',
        principal_coefficient: Number(coefUnidad.toFixed(4)),
        proxy_holder_name: nombreApoderado.trim(),
        proxy_holder_document: cedulaApoderado.trim(),
        proxy_holder_unit_label: unidadApoderado.trim() || 'Apoderado Externo',
        status: 'VALIDADO'
      }
    ]);

    if (error) {
      onShowToast?.(`Error registrando poder: ${error.message}`);
      return;
    }

    setModalPoder(false);
    setNombreApoderado('');
    setCedulaApoderado('');
    setUnidadApoderado('');
    cargarTodo();
    onShowToast?.(`✓ Poder validado: ${labelUnidad} suma su coeficiente (${coefUnidad.toFixed(2)}%) a ${nombreApoderado}.`);
  };

  // 2. Crear Comparativo de 3 Cotizaciones para el Consejo
  const handleCrearLicitacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloLic.trim() || !provA.trim() || !provB.trim() || !provC.trim()) return;

    const codigo = `LIC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const { error } = await supabase.from('council_tenders').insert([
      {
        tenant_id: tenantId,
        tender_code: codigo,
        title: tituloLic.trim(),
        budget_limit: Number(presupuestoMax.replace(/\D/g, '')) || 0,
        option_a_provider: provA.trim(),
        option_a_amount: Number(montoA.replace(/\D/g, '')) || 0,
        option_b_provider: provB.trim(),
        option_b_amount: Number(montoB.replace(/\D/g, '')) || 0,
        option_c_provider: provC.trim(),
        option_c_amount: Number(montoC.replace(/\D/g, '')) || 0
      }
    ]);

    if (error) {
      onShowToast?.(`Error creando comparativo: ${error.message}`);
      return;
    }

    setModalLicitacion(false);
    setTituloLic('');
    cargarTodo();
    onShowToast?.(`✓ Licitación ${codigo} publicada para votación del Consejo y Revisoría Fiscal.`);
  };

  // 3. Emitir Voto de Consejero y Adjudicar
  const handleVotarCotizacion = async (tenderId: string, opcion: 'A' | 'B' | 'C') => {
    const consejeroUnidad = window.prompt('Ingresa tu Unidad de Consejero (Ej. Apto 301):', 'Consejero Principal');
    if (!consejeroUnidad) return;

    const { error } = await supabase.from('council_tender_votes').upsert(
      {
        tender_id: tenderId,
        councilor_name: 'Miembro del Consejo',
        councilor_unit: consejeroUnidad.trim(),
        selected_option: opcion
      },
      { onConflict: 'tender_id,councilor_unit' }
    );

    if (error) {
      onShowToast?.(`Error registrando voto: ${error.message}`);
      return;
    }

    await supabase
      .from('council_tenders')
      .update({ winning_option: `Opción ${opcion}`, status: 'ADJUDICADA' })
      .eq('id', tenderId);

    cargarTodo();
    onShowToast?.(`✓ Voto del Consejo registrado por la Opción ${opcion}. Cotización adjudicada.`);
  };

  return (
    <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
            <Scale className="w-5 h-5 text-emerald-400" /> Gobierno Corporativo: Consejo, Revisor Fiscal &amp; Poderes Ley 675
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Comparativo transparente de 3 cotizaciones para el Consejo y acumulación de coeficientes por apoderado en Asamblea.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('licitaciones')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              subTab === 'licitaciones' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Consejo: 3 Cotizaciones ({licitaciones.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('poderes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              subTab === 'poderes' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Poderes Asamblea ({poderes.length})
          </button>
        </div>
      </div>

      {subTab === 'licitaciones' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-mono">
              Exigencia de transparencia PH: Comparativo mínimo de 3 ofertas con visto bueno de Revisoría Fiscal.
            </span>
            <button
              type="button"
              onClick={() => setModalLicitacion(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Subir 3 Cotizaciones al Consejo
            </button>
          </div>

          {licitaciones.length === 0 ? (
            <div className="p-8 text-center bg-[#07090e] border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500 font-mono">
              No hay procesos de contratación abiertos para votación del Consejo.
            </div>
          ) : (
            <div className="space-y-4">
              {licitaciones.map((lic) => {
                const votos = votosConsejo[lic.id] || [];
                return (
                  <div key={lic.id} className="p-5 bg-[#07090e] border border-slate-800 rounded-2xl space-y-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-emerald-400">{lic.tender_code}</span>
                        <h4 className="text-sm font-black text-white mt-0.5">{lic.title}</h4>
                        <p className="text-slate-400">
                          Techo Presupuestal: <strong>${Number(lic.budget_limit).toLocaleString('es-CO')} COP</strong> · Dictamen Revisor Fiscal: <span className="text-cyan-400">{lic.revisor_fiscal_concept || 'En revisión'}</span>
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                        {lic.status} {lic.winning_option ? `(${lic.winning_option})` : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { key: 'A', prov: lic.option_a_provider, monto: lic.option_a_amount },
                        { key: 'B', prov: lic.option_b_provider, monto: lic.option_b_amount },
                        { key: 'C', prov: lic.option_c_provider, monto: lic.option_c_amount }
                      ].map((opt) => (
                        <div key={opt.key} className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Oferta {opt.key}</span>
                            <p className="font-bold text-white text-sm mt-0.5">{opt.prov}</p>
                            <p className="text-base font-black text-emerald-400 mt-1">
                              ${Number(opt.monto).toLocaleString('es-CO')} COP
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleVotarCotizacion(lic.id, opt.key as 'A' | 'B' | 'C')}
                            className="w-full py-2 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold rounded-lg transition cursor-pointer"
                          >
                            Votar / Adjudicar Oferta {opt.key}
                          </button>
                        </div>
                      ))}
                    </div>

                    {votos.length > 0 && (
                      <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800">
                        Votos registrados del Consejo ({votos.length}): {votos.map((v) => `${v.councilor_unit} → Opción ${v.selected_option}`).join(' | ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {subTab === 'poderes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Tope reglamentario de poderes por apoderado:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={maxPoderesPorPersona}
                onChange={(e) => setMaxPoderesPorPersona(Number(e.target.value) || 2)}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-center"
              />
            </div>
            <button
              type="button"
              onClick={() => setModalPoder(true)}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar Poder Digital
            </button>
          </div>

          {poderes.length === 0 ? (
            <div className="p-8 text-center bg-[#07090e] border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500 font-mono">
              No hay poderes radicados para la sesión actual.
            </div>
          ) : (
            <div className="overflow-x-auto bg-[#07090e] border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Unidad Poderdante</th>
                    <th className="p-3.5">Propietario que Otorga</th>
                    <th className="p-3.5">Coeficiente Delegado</th>
                    <th className="p-3.5">Apoderado Representante</th>
                    <th className="p-3.5">Estado Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {poderes.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3.5 font-bold text-white">{p.principal_unit_label}</td>
                      <td className="p-3.5">{p.principal_owner_name}</td>
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">+{p.principal_coefficient}%</td>
                      <td className="p-3.5">
                        <strong>{p.proxy_holder_name}</strong> (C.C. {p.proxy_holder_document}) · {p.proxy_holder_unit_label}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL REGISTRAR PODER */}
      {modalPoder && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleRegistrarPoder} className="bg-[#0b0f17] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-3.5 text-xs">
            <h4 className="text-sm font-bold text-white">Radicar Poder de Representación (Ley 675)</h4>
            <div>
              <label className="block text-slate-400 mb-1">Inmueble que Otorga el Poder</label>
              <select
                value={unitPoderdanteId}
                onChange={(e) => setUnitPoderdanteId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
              >
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.tower || 'Torre 1'} - {u.apartment || u.unit_code} ({u.owner_name || 'Propietario'})
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              required
              placeholder="Nombre Completo del Apoderado"
              value={nombreApoderado}
              onChange={(e) => setNombreApoderado(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Cédula Apoderado"
                value={cedulaApoderado}
                onChange={(e) => setCedulaApoderado(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
              <input
                type="text"
                placeholder="Unidad Apoderado (Opcional)"
                value={unidadApoderado}
                onChange={(e) => setUnidadApoderado(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalPoder(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-cyan-500 text-slate-950 font-black rounded-xl">
                Validar Tope y Acreditar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL SUBIR 3 COTIZACIONES */}
      {modalLicitacion && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleCrearLicitacion} className="bg-[#0b0f17] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-3 text-xs">
            <h4 className="text-sm font-bold text-white">Nuevo Comparativo de 3 Cotizaciones para el Consejo</h4>
            <input
              type="text"
              required
              placeholder="Objeto del Contrato (Ej. Mantenimiento Motobombas / Pintura Fachada)"
              value={tituloLic}
              onChange={(e) => setTituloLic(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
            />
            <input
              type="text"
              required
              placeholder="Presupuesto Aprobado ($ COP)"
              value={presupuestoMax}
              onChange={(e) => setPresupuestoMax(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
            />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" required placeholder="Proveedor Oferta A" value={provA} onChange={(e) => setProvA(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white" />
              <input type="text" required placeholder="Valor Oferta A ($)" value={montoA} onChange={(e) => setMontoA(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono" />
              <input type="text" required placeholder="Proveedor Oferta B" value={provB} onChange={(e) => setProvB(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white" />
              <input type="text" required placeholder="Valor Oferta B ($)" value={montoB} onChange={(e) => setMontoB(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono" />
              <input type="text" required placeholder="Proveedor Oferta C" value={provC} onChange={(e) => setProvC(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white" />
              <input type="text" required placeholder="Valor Oferta C ($)" value={montoC} onChange={(e) => setMontoC(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalLicitacion(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl">
                Publicar al Consejo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
