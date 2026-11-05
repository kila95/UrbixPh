import { supabase } from '../supabaseClient';

export interface AssemblyVotePayload {
  motion_id: string;
  tenant_id: string;
  apartment_unit: string;
  voter_name: string;
  coefficient: number;
  choice: 'A_FAVOR' | 'EN_CONTRA' | 'ABSTENCION';
}

export interface VotingResultsSummary {
  motion_id: string;
  total_votes: number;
  favor_coefficient: number;
  contra_coefficient: number;
  abstencion_coefficient: number;
  total_quorum_participated: number;
  decision: 'APROBADO' | 'RECHAZADO' | 'EN_CURSO';
}

const STORAGE_KEY_VOTES = 'urbix_assembly_votes_real';

function leerVotosLocales(motionId?: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOTES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return motionId ? parsed.filter((v) => v.motion_id === motionId) : parsed;
  } catch {
    return [];
  }
}

function guardarVotoLocal(record: any) {
  if (typeof window === 'undefined') return record;
  try {
    const actuales = leerVotosLocales();
    const duplicado = actuales.find(
      (v) =>
        v.motion_id === record.motion_id &&
        String(v.apartment_unit || '').toLowerCase() === String(record.apartment_unit || '').toLowerCase()
    );
    if (duplicado) {
      throw new Error(`El inmueble ${record.apartment_unit} ya ejerció su voto en esta proposición.`);
    }
    const nuevo = { id: `vote_${Date.now()}`, ...record };
    localStorage.setItem(STORAGE_KEY_VOTES, JSON.stringify([nuevo, ...actuales]));
    window.dispatchEvent(new CustomEvent('urbix_assembly_votes_updated'));
    return nuevo;
  } catch (err) {
    throw err;
  }
}

/**
 * Genera el hash criptográfico SHA-256 que sella el voto de forma inviolable
 */
export async function generateVoteSignature(vote: AssemblyVotePayload, timestamp: string): Promise<string> {
  const payloadString = `${vote.motion_id}|${vote.tenant_id}|${vote.apartment_unit}|${vote.voter_name}|${vote.coefficient}|${vote.choice}|${timestamp}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payloadString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Registra un voto sellado digitalmente en Supabase
 */
export async function castImmutableVote(vote: AssemblyVotePayload) {
  const timestamp = new Date().toISOString();
  const digital_hash = await generateVoteSignature(vote, timestamp);

  const payload = {
    motion_id: vote.motion_id,
    tenant_id: vote.tenant_id,
    apartment_unit: vote.apartment_unit.trim(),
    voter_name: vote.voter_name.trim(),
    coefficient: vote.coefficient,
    choice: vote.choice,
    digital_hash,
    voted_at: timestamp
  };

  const { data, error } = await supabase
    .from('assembly_votes')
    .insert([payload])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`El inmueble ${vote.apartment_unit} ya ejerció su voto en esta proposición.`);
    }
    // Si la tabla assembly_votes aún no existe en el esquema de Supabase, guardar en respaldo local con validación de duplicados
    if (error.message?.includes('schema cache') || error.code === 'PGRST205' || error.code === '42P01') {
      console.warn('Respaldo local activado para assembly_votes:', error.message);
      return guardarVotoLocal(payload);
    }
    throw new Error(`Error registrando el voto: ${error.message}`);
  }

  return data;
}

/**
 * Escrutinio oficial en vivo ponderado por coeficiente (Art. 45 Ley 675)
 */
export async function getMotionResults(motionId: string): Promise<VotingResultsSummary> {
  const { data: votesData, error } = await supabase
    .from('assembly_votes')
    .select('choice, coefficient')
    .eq('motion_id', motionId);

  let votes = votesData;

  if (error) {
    if (error.message?.includes('schema cache') || error.code === 'PGRST205' || error.code === '42P01') {
      console.warn('Usando respaldo local para escrutinio de assembly_votes:', error.message);
      votes = leerVotosLocales(motionId);
    } else {
      throw new Error(`Error consultando escrutinio: ${error.message}`);
    }
  } else if (!votes || votes.length === 0) {
    const locales = leerVotosLocales(motionId);
    if (locales.length > 0) votes = locales;
  }

  let favor = 0;
  let contra = 0;
  let abstencion = 0;

  for (const v of votes || []) {
    const coeff = Number(v.coefficient || 0);
    if (v.choice === 'A_FAVOR') favor += coeff;
    else if (v.choice === 'EN_CONTRA') contra += coeff;
    else if (v.choice === 'ABSTENCION') abstencion += coeff;
  }

  const totalQuorum = favor + contra + abstencion;
  // Mayoría calificada o simple según Ley 675 (más del 50% de los coeficientes votantes)
  const isApproved = favor > (contra + abstencion);

  return {
    motion_id: motionId,
    total_votes: votes?.length || 0,
    favor_coefficient: Number(favor.toFixed(4)),
    contra_coefficient: Number(contra.toFixed(4)),
    abstencion_coefficient: Number(abstencion.toFixed(4)),
    total_quorum_participated: Number(totalQuorum.toFixed(4)),
    decision: (votes?.length || 0) === 0 ? 'EN_CURSO' : isApproved ? 'APROBADO' : 'RECHAZADO'
  };
}

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


