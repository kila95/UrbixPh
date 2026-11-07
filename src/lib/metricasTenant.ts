import { supabase, normalizeTenantUuid } from '../supabaseClient';

export interface MetricasTenant {
  recaudo: string;
  unidadesMora: string;
  totalUnidades: number;
  alDia: number;
  enMora: number;
  unidadesPagadas: number;
  unidadesEnMora: number;
  porcentajeRecaudo: string;
  totalRecaudadoCalculado?: number;
}

// Consulta para métricas reales del tenant activo directamente de la tabla units
export const cargarMetricasTenant = async (rawTenantId: string): Promise<MetricasTenant | null> => {
  if (!rawTenantId) return null;
  const tenantId = normalizeTenantUuid(rawTenantId);

  try {
    // Consultar unidades reales de Copropiedad_PH
    const { data: units, error } = await supabase
      .from('units')
      .select('id, debt_status, pending_balance, coefficient, unit_code, apartment, tower, owner_name, monthly_fee')
      .eq('tenant_id', tenantId);

    if (error) {
      console.warn('Detalle al cargar unidades del tenant:', error.message);
      return null;
    }

    if (units) {
      // Cálculo real derivado de la tabla units (soportando 'al_dia' y 'Al día')
      const totalUnidades = units.length; // 100
      const unidadesAlDia = units.filter(
        u => (u.debt_status === 'al_dia' || u.debt_status === 'Al día') && Number(u.pending_balance || 0) === 0
      );
      const unidadesPagadas = unidadesAlDia.length;
      const unidadesEnMora = totalUnidades - unidadesPagadas;

      // Cálculo sincronizado en el estado
      const totalRecaudadoCalculado = unidadesAlDia.reduce(
        (acc, unidad: any) => acc + (Number(unidad.cuota_mensual || unidad.monthly_fee) || 300000), 
        0
      );

      // Si nadie ha pagado el mes que recién inicia, dará 0.0%
      const porcentajeRecaudo = totalUnidades > 0 
        ? ((unidadesPagadas / totalUnidades) * 100).toFixed(1) 
        : '0.0';

      return {
        recaudo: `${porcentajeRecaudo}%`,
        unidadesMora: `${unidadesEnMora} Aptos`,
        totalUnidades,
        alDia: unidadesPagadas,
        enMora: unidadesEnMora,
        unidadesPagadas,
        unidadesEnMora,
        porcentajeRecaudo: `${porcentajeRecaudo}%`,
        totalRecaudadoCalculado
      };
    }
  } catch (err: any) {
    console.error('Error en cargarMetricasTenant:', err?.message);
  }

  return null;
};

