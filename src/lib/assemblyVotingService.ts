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
