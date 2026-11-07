import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';

export interface ResultadoPrelacion {
  receiptNumber: string;
  totalPaid: number;
  appliedToInterest: number;
  appliedToSanctions: number;
  appliedToCapital: number;
  newInterestBalance: number;
  newSanctionsBalance: number;
  newCapitalBalance: number;
  newTotalBalance: number;
  status: 'Al día' | 'En mora';
}

export type interfaceResultadoPrelacion = ResultadoPrelacion;

// 1. LIQUIDADOR DE ABONOS CON PRELACIÓN LEGAL (ART. 1653 CÓDIGO CIVIL)
export async function registrarAbonoConPrelacion({
  tenantId,
  unitId,
  unitLabel,
  payerName,
  amountPaid,
  paymentMethod = 'Transferencia / PSE',
  referenceCode = ''
}: {
  tenantId: string;
  unitId: string;
  unitLabel: string;
  payerName: string;
  amountPaid: number;
  paymentMethod?: string;
  referenceCode?: string;
}): Promise<interfaceResultadoPrelacion> {
  // Consultar saldos actuales de la unidad
  const { data: unit, error: unitErr } = await supabase
    .from('units')
    .select('pending_balance, capital_balance, interest_balance, sanctions_balance')
    .eq('id', unitId)
    .single();

  if (unitErr || !unit) throw new Error('No se encontró el estado de cuenta de la unidad.');

  const totalActual = Number(unit.pending_balance || 0);
  let moraActual = Number(unit.interest_balance || 0);
  let sancionesActual = Number(unit.sanctions_balance || 0);
  let capitalActual = Number(unit.capital_balance || 0);

  // Si solo existía pending_balance sin desglose, asignarlo a capital
  if (moraActual + sancionesActual + capitalActual === 0 && totalActual > 0) {
    capitalActual = totalActual;
  }

  let disponible = Number(amountPaid);

  // Orden 1: Cubrir Intereses de Mora (Art. 1653 C.C.)
  const appliedToInterest = Math.min(disponible, moraActual);
  moraActual -= appliedToInterest;
  disponible -= appliedToInterest;

  // Orden 2: Cubrir Sanciones / Cuotas Extraordinarias
  const appliedToSanctions = Math.min(disponible, sancionesActual);
  sancionesActual -= appliedToSanctions;
  disponible -= appliedToSanctions;

  // Orden 3: Cubrir Capital de Expensas Comunes Ordinarias (o saldo a favor si paga de más)
  const appliedToCapital = disponible;
  capitalActual = Math.max(0, capitalActual - appliedToCapital);

  const newTotalBalance = moraActual + sancionesActual + capitalActual;
  const newStatus = newTotalBalance <= 0 ? 'Al día' : 'En mora';

  // Generar consecutivo oficial de Recibo de Caja
  const receiptNumber = `RC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

  // Actualizar la unidad en Supabase
  const { error: updErr } = await supabase
    .from('units')
    .update({
      interest_balance: moraActual,
      sanctions_balance: sancionesActual,
      capital_balance: capitalActual,
      pending_balance: newTotalBalance,
      debt_status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', unitId);

  if (updErr) throw updErr;

  // Guardar el Recibo de Caja en el libro contable
  const { error: recErr } = await supabase.from('payment_receipts').insert([
    {
      tenant_id: tenantId,
      unit_id: unitId,
      receipt_number: receiptNumber,
      unit_label: unitLabel,
      payer_name: payerName,
      payment_method: paymentMethod,
      reference_code: referenceCode || `REF-${Date.now().toString().slice(-4)}`,
      total_paid: amountPaid,
      applied_to_interest: appliedToInterest,
      applied_to_sanctions: appliedToSanctions,
      applied_to_capital: appliedToCapital,
      remaining_balance: newTotalBalance
    }
  ]);

  if (recErr) throw recErr;

  return {
    receiptNumber,
    totalPaid: amountPaid,
    appliedToInterest,
    appliedToSanctions,
    appliedToCapital,
    newInterestBalance: moraActual,
    newSanctionsBalance: sancionesActual,
    newCapitalBalance: capitalActual,
    newTotalBalance,
    status: newStatus
  };
}

// 2. MOTOR DE CAUSACIÓN MENSUAL MASIVA (ART. 29, 30 Y 35 LEY 675)
export async function ejecutarCausacionMensualCopropiedad(tenantId: string, tasaInteresMensualPct: number = 2.1) {
  const { data: units, error } = await supabase
    .from('units')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error || !units) throw new Error('Error consultando unidades para causación mensual.');

  let unidadesCausadas = 0;

  for (const u of units) {
    const cuotaMes = Number(u.monthly_fee || 300000);
    const capitalPrevio = Number(u.capital_balance ?? u.pending_balance ?? 0);
    const moraPrevia = Number(u.interest_balance || 0);
    const sancionesPrevias = Number(u.sanctions_balance || 0);

    // Si tenía capital vencido del mes anterior, liquida interés moratorio (Art. 30 Ley 675)
    const nuevoInteresMes = capitalPrevio > 0 ? Math.round(capitalPrevio * (tasaInteresMensualPct / 100)) : 0;
    const aporteFondoImprevistos = Math.round(cuotaMes * 0.01); // 1% mínimo legal Art. 35

    const nuevoCapital = capitalPrevio + cuotaMes;
    const nuevaMora = moraPrevia + nuevoInteresMes;
    const nuevoTotal = nuevoCapital + nuevaMora + sancionesPrevias;

    await supabase
      .from('units')
      .update({
        capital_balance: nuevoCapital,
        interest_balance: nuevaMora,
        pending_balance: nuevoTotal,
        reserve_fund_contribution: Number(u.reserve_fund_contribution || 0) + aporteFondoImprevistos,
        debt_status: 'En mora',
        updated_at: new Date().toISOString()
      })
      .eq('id', u.id);

    unidadesCausadas++;
  }

  return unidadesCausadas;
}

// 3. IMPRESIÓN DE RECIBO OFICIAL DE CAJA EN PDF (CON DESGLOSE DE PRELACIÓN)
export function imprimirReciboDeCajaPDF(
  tenantName: string,
  unitLabel: string,
  payerName: string,
  res: interfaceResultadoPrelacion
) {
  const escapeHtml = (str: string = '') =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const fecha = escapeHtml(new Date().toLocaleString('es-CO'));
  const html = `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Recibo de Caja ${escapeHtml(res.receiptNumber)}</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #0f172a; padding: 30px; max-width: 720px; margin: auto; }
      .box { border: 2px solid #0f172a; border-radius: 12px; padding: 24px; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
      .table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
      .table th, .table td { border: 1px solid #cbd5e1; padding: 9px 12px; text-align: left; }
      .table th { background: #0f172a; color: #fff; text-transform: uppercase; font-size: 11px; }
      .total-row { background: #ecfdf5; font-weight: bold; font-size: 15px; }
      .footer { margin-top: 24px; font-size: 11px; color: #475569; text-align: center; border-top: 1px dashed #94a3b8; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="header">
        <div>
          <h2 style="margin:0;">${escapeHtml(tenantName)}</h2>
          <p style="margin:4px 0 0; font-size:12px;">Comprobante Oficial de Ingreso - Régimen Ley 675 de 2001</p>
        </div>
        <div style="text-align:right;">
          <strong style="font-size:16px; color:#059669;">${escapeHtml(res.receiptNumber)}</strong><br/>
          <span style="font-size:11px;">Fecha: ${fecha}</span>
        </div>
      </div>
      <p style="font-size:13px; margin:6px 0;"><strong>Inmueble:</strong> ${escapeHtml(unitLabel)} &nbsp;|&nbsp; <strong>Recibido de:</strong> ${escapeHtml(payerName)}</p>
      <table class="table">
        <thead>
          <tr>
            <th>Concepto de Imputación Legal (Art. 1653 C.C.)</th>
            <th>Cuenta PUC PH</th>
            <th>Valor Aplicado ($ COP)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1. Abono a Intereses Moratorios</td>
            <td>421005</td>
            <td>$${res.appliedToInterest.toLocaleString('es-CO')}</td>
          </tr>
          <tr>
            <td>2. Abono a Sanciones / Extraordinarias</td>
            <td>429505</td>
            <td>$${res.appliedToSanctions.toLocaleString('es-CO')}</td>
          </tr>
          <tr>
            <td>3. Abono a Capital Cuota de Administración</td>
            <td>130505</td>
            <td>$${res.appliedToCapital.toLocaleString('es-CO')}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">TOTAL RECIBIDO EN CAJA / BANCOS (PUC 111005)</td>
            <td>$${res.totalPaid.toLocaleString('es-CO')} COP</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top:16px; font-size:13px;">
        <strong>Nuevo Saldo Pendiente de la Unidad:</strong> $${res.newTotalBalance.toLocaleString('es-CO')} COP (${escapeHtml(res.status.toUpperCase())})
      </p>
      <div class="footer">
        Certificado digitalmente por Urbix PH · Imputación contable conforme al Art. 1653 del Código Civil y Art. 29-30 Ley 675 de 2001.
      </div>
    </div>
    <script>window.onload = function() { window.print(); };</script>
  </body>
  </html>`;

  const win = window.open('', '_blank', 'width=800,height=650');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// 4. EXPORTADOR DE ASIENTOS CONTABLES PARA SIIGO / WORLD OFFICE (.XLSX CON PUC PH)
export async function exportarContabilidadSiigoWorldOffice(tenantId: string, tenantName: string) {
  const { data: recibos, error } = await supabase
    .from('payment_receipts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const asientos: any[] = [];

  (recibos || []).forEach((r: any) => {
    const fecha = new Date(r.created_at).toISOString().split('T')[0];

    // Asiento Débito: Entrada a Bancos (111005)
    asientos.push({
      Fecha: fecha,
      Comprobante: r.receipt_number,
      Inmueble_Tercero: r.unit_label,
      Titular: r.payer_name,
      Cuenta_PUC: '111005',
      Nombre_Cuenta: 'Bancos Nacionales - Recaudo PH',
      Naturaleza: 'DEBITO',
      Debito: Number(r.total_paid),
      Credito: 0,
      Detalle: `Recaudo ${r.payment_method} Ref: ${r.reference_code}`
    });

    // Asiento Crédito 1: Intereses de Mora (421005)
    if (Number(r.applied_to_interest) > 0) {
      asientos.push({
        Fecha: fecha,
        Comprobante: r.receipt_number,
        Inmueble_Tercero: r.unit_label,
        Titular: r.payer_name,
        Cuenta_PUC: '421005',
        Nombre_Cuenta: 'Ingresos Financieros - Intereses de Mora',
        Naturaleza: 'CREDITO',
        Debito: 0,
        Credito: Number(r.applied_to_interest),
        Detalle: `Imputación Intereses Art. 1653 C.C.`
      });
    }

    // Asiento Crédito 2: Capital Expensas Comunes (130505)
    if (Number(r.applied_to_capital) > 0) {
      asientos.push({
        Fecha: fecha,
        Comprobante: r.receipt_number,
        Inmueble_Tercero: r.unit_label,
        Titular: r.payer_name,
        Cuenta_PUC: '130505',
        Nombre_Cuenta: 'Deudores Copropietarios - Expensas Ordinarias',
        Naturaleza: 'CREDITO',
        Debito: 0,
        Credito: Number(r.applied_to_capital),
        Detalle: `Abono a Capital Administración`
      });
    }
  });

  const ws = XLSX.utils.json_to_sheet(
    asientos.length > 0
      ? asientos
      : [{ Aviso: 'Aún no hay recibos de caja registrados en este periodo.' }]
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Interfaz_Siigo_WorldOffice');
  XLSX.writeFile(wb, `Interfaz_Contable_PUC_${tenantName.replace(/\s+/g, '_')}.xlsx`);
}
