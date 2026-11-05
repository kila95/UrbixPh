import { supabase } from '../supabaseClient';

export interface TreasuryTransaction {
  id?: string;
  tenant_id: string;
  apartment_id?: string | null;
  type: 'Ingreso' | 'Egreso';
  dian_format: '1001' | '1003' | '1005' | '1007';
  concept: string;
  third_party: string;
  nit_third_party: string;
  amount: number;
  withholding_tax: number;
  vat_tax: number;
  payment_method?: string;
  reference_number?: string | null;
  created_at?: string;
}

const STORAGE_KEY_TREASURY = 'urbix_treasury_transactions_real';

function leerRespaldoLocal(tenantId?: string): TreasuryTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TREASURY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return tenantId ? parsed.filter((t: TreasuryTransaction) => !t.tenant_id || t.tenant_id === tenantId) : parsed;
  } catch {
    return [];
  }
}

function guardarEnRespaldoLocal(trx: TreasuryTransaction): TreasuryTransaction {
  const nuevo: TreasuryTransaction = {
    ...trx,
    id: trx.id || `trx_${Date.now()}`,
    created_at: trx.created_at || new Date().toISOString()
  };
  if (typeof window !== 'undefined') {
    try {
      const actuales = leerRespaldoLocal();
      const actualizadas = [nuevo, ...actuales];
      localStorage.setItem(STORAGE_KEY_TREASURY, JSON.stringify(actualizadas));
      window.dispatchEvent(new CustomEvent('urbix_treasury_updated'));
    } catch {
      // ignore storage errors
    }
  }
  return nuevo;
}

/**
 * Consulta todas las transacciones reales de una copropiedad
 */
export async function getTransactionsByTenant(tenantId: string): Promise<TreasuryTransaction[]> {
  const { data, error } = await supabase
    .from('treasury_transactions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn(`Aviso al consultar tesorería en Supabase: ${error.message}`);
    return leerRespaldoLocal(tenantId);
  }

  return data && data.length > 0 ? data : leerRespaldoLocal(tenantId);
}

/**
 * Registra una transacción y, si es un ingreso de cuota, actualiza el saldo del apartamento
 */
export async function createTreasuryTransaction(trx: TreasuryTransaction): Promise<TreasuryTransaction> {
  const payload = {
    tenant_id: trx.tenant_id,
    apartment_id: trx.apartment_id || null,
    type: trx.type,
    dian_format: trx.dian_format,
    concept: trx.concept.trim(),
    third_party: trx.third_party.trim(),
    nit_third_party: trx.nit_third_party.trim(),
    amount: trx.amount,
    withholding_tax: trx.withholding_tax || 0,
    vat_tax: trx.vat_tax || 0,
    payment_method: trx.payment_method || 'Transferencia Bancaria',
    reference_number: trx.reference_number || null,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('treasury_transactions')
    .insert([payload])
    .select()
    .single();

  // Si está vinculado a un apartamento y es un pago, actualizar saldo en cartera
  if (trx.apartment_id && trx.type === 'Ingreso') {
    const { data: apt } = await supabase
      .from('apartments')
      .select('debt')
      .eq('id', trx.apartment_id)
      .single();

    if (apt) {
      const nuevoSaldo = Math.max(0, Number(apt.debt || 0) - trx.amount);
      await supabase
        .from('apartments')
        .update({
          debt: nuevoSaldo,
          status: nuevoSaldo === 0 ? 'al_dia' : 'en_mora'
        })
        .eq('id', trx.apartment_id);
    }
  }

  if (error) {
    console.warn(`Respaldo local activado al registrar movimiento contable: ${error.message}`);
    return guardarEnRespaldoLocal(payload);
  }

  return data;
}

/**
 * Cruza un pago detectado por OCR y lo asienta en la base de datos
 */
export async function conciliarPagoOcrEnBaseDeDatos(
  tenantId: string,
  ocrResult: {
    payer_name: string;
    document_id: string;
    unit_reference: string;
    amount_paid_cop: number;
    reference_number?: string;
  }
): Promise<TreasuryTransaction> {
  // 1. Buscar el apartamento por su nomenclatura (ej: "Torre 1 - 302")
  const { data: apt } = await supabase
    .from('apartments')
    .select('id')
    .eq('tenant_id', tenantId)
    .ilike('tower_apt', `%${ocrResult.unit_reference.trim()}%`)
    .maybeSingle();

  // 2. Insertar el pago real
  return await createTreasuryTransaction({
    tenant_id: tenantId,
    apartment_id: apt ? apt.id : null,
    type: 'Ingreso',
    dian_format: '1007',
    concept: `Recaudo Cuota Adm - Inmueble ${ocrResult.unit_reference}`,
    third_party: ocrResult.payer_name,
    nit_third_party: ocrResult.document_id || '222222222222',
    amount: ocrResult.amount_paid_cop,
    withholding_tax: 0,
    vat_tax: 0,
    reference_number: ocrResult.reference_number || undefined
  });
}
