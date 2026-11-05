import { supabase } from '../supabaseClient';

export interface ResumenQuorum {
  quorumActual: number;        // Porcentaje total presente (0 a 100%)
  unidadesPresentes: number;
  totalUnidades: number;
  tieneQuorumOrdinario: boolean;  // Más del 50% según Art. 45 Ley 675
  tieneQuorumCalificado: boolean; // 70% o más según Art. 46 Ley 675
}

export async function calcularQuorumAsamblea(assemblyId: string, tenantId: string): Promise<ResumenQuorum> {
  // 1. Obtener la suma total de coeficientes de los presentes
  const { data: presentes, error: errPresentes } = await supabase
    .from('assembly_attendance')
    .select('coefficient_present')
    .eq('assembly_id', assemblyId)
    .eq('is_present', true);

  if (errPresentes) throw errPresentes;

  // 2. Contar el universo total de unidades registradas
  const { count: totalAptos, error: errAptos } = await supabase
    .from('apartments')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (errAptos) throw errAptos;

  // 3. Sumar coeficientes (Ley 675 maneja la suma del 100%)
  const sumaCoeficientes = (presentes || []).reduce((acc, row) => {
    return acc + Number(row.coefficient_present || 0);
  }, 0);

  const quorumRedondeado = Number(sumaCoeficientes.toFixed(3));

  return {
    quorumActual: quorumRedondeado,
    unidadesPresentes: presentes?.length || 0,
    totalUnidades: totalAptos || 0,
    tieneQuorumOrdinario: quorumRedondeado > 50.000,
    tieneQuorumCalificado: quorumRedondeado >= 70.000
  };
}

export async function emitirVotoPonderado({
  votingId,
  apartmentId,
  tenantId,
  opcion // 'SI' | 'NO' | 'BLANCO'
}: {
  votingId: string;
  apartmentId: string;
  tenantId: string;
  opcion: string;
}) {
  // 1. Obtener el coeficiente oficial registrado en la base de datos
  const { data: apto, error: errApto } = await supabase
    .from('apartments')
    .select('coefficient')
    .eq('id', apartmentId)
    .single();

  if (errApto || !apto) {
    throw new Error('No se encontró el coeficiente del inmueble en el sistema.');
  }

  // 2. Registrar el voto con el peso legal exacto
  const { data, error } = await supabase
    .from('assembly_votes')
    .insert([
      {
        voting_id: votingId,
        apartment_id: apartmentId,
        tenant_id: tenantId,
        option_selected: opcion,
        vote_weight: apto.coefficient
      }
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este apartamento ya emitió su voto para este punto.');
    }
    throw error;
  }

  return data;
}

// 3. Obtener el escrutinio oficial en porcentaje ponderado
export async function obtenerEscrutinioVotacion(votingId: string) {
  const { data: votos, error } = await supabase
    .from('assembly_votes')
    .select('option_selected, vote_weight')
    .eq('voting_id', votingId);

  if (error) throw error;

  let pesoTotal = 0;
  const acumulado: Record<string, number> = { SI: 0, NO: 0, BLANCO: 0 };

  (votos || []).forEach((v) => {
    const peso = Number(v.vote_weight || 0);
    pesoTotal += peso;
    if (acumulado[v.option_selected] !== undefined) {
      acumulado[v.option_selected] += peso;
    }
  });

  return {
    pesoTotalEmitido: Number(pesoTotal.toFixed(3)),
    porcentajes: {
      SI: pesoTotal > 0 ? Number(((acumulado.SI / pesoTotal) * 100).toFixed(2)) : 0,
      NO: pesoTotal > 0 ? Number(((acumulado.NO / pesoTotal) * 100).toFixed(2)) : 0,
      BLANCO: pesoTotal > 0 ? Number(((acumulado.BLANCO / pesoTotal) * 100).toFixed(2)) : 0
    },
    votosContabilizados: votos?.length || 0
  };
}

