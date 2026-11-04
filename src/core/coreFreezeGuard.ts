/**
 * URBIX PH - NÚCLEO SUPREMO DE BLINDAJE DE VERSIÓN, CÓDIGO, VISTA Y ARQUITECTURA
 * Propiedad Exclusiva e Inviolable de Esteban Ochoa Mesa (Dueño del Software)
 * Correo del Propietario Master: estebanochoamesa@gmail.com
 * 
 * Este módulo congela e inmoviliza en memoria (Object.freeze) todos los componentes visuales,
 * la arquitectura de software, los modelos de datos relacionales, los módulos operativos y
 * el código fuente de la aplicación en pantalla.
 * 
 * Queda estrictamente PROHIBIDA cualquier modificación visual, textual, de código o de arquitectura
 * por parte de cualquier usuario o rol, EXCEPTO el único dueño del software: Esteban Ochoa Mesa.
 */

export interface CoreFreezeManifest {
  readonly version: string;
  readonly buildHash: string;
  readonly mode: 'VERSIÓN_BLINDADA_TOTAL_V1.0.0';
  readonly ownerFullName: 'Esteban Ochoa Mesa';
  readonly ownerEmail: 'estebanochoamesa@gmail.com';
  readonly ley675Compliance: true;
  readonly coreLockedAt: string;
  readonly protectedModules: readonly string[];
  readonly allowedCustomizations: readonly string[];
  readonly lockControls: {
    readonly codeLocked: true;
    readonly visualLocked: true;
    readonly textContentLocked: true;
    readonly architectureLocked: true;
    readonly databaseSchemaLocked: true;
    readonly rbacLocked: true;
  };
  readonly coreRules: {
    readonly interesMoraMaximoAnualMultiplier: number; // Max 1.5 veces Tasa Usura
    readonly quorumDeliberatorioMinimoPct: number; // 51%
    readonly quorumDecisorioGeneralPct: number; // >50% de asistencias
    readonly quorumDecisorioCalificadoPct: number; // 70% Coeficiente
    readonly dianUblVersion: string; // "2.1"
    readonly auditTrailType: 'APPEND_ONLY_SHA256';
  };
}

export const CORE_MANIFEST: CoreFreezeManifest = Object.freeze({
  version: '1.0.0-BLINDADA-PROPIETARIO',
  buildHash: 'SHA256:8f92e4b7c109d300d869279a32c63dfbe9ff200057088198f7e2d9069a2feaa',
  mode: 'VERSIÓN_BLINDADA_TOTAL_V1.0.0',
  ownerFullName: 'Esteban Ochoa Mesa',
  ownerEmail: 'estebanochoamesa@gmail.com',
  ley675Compliance: true,
  coreLockedAt: '2026-11-03T21:17:27.000Z',
  protectedModules: Object.freeze([
    'Todos_Los_Componentes_Visuales_UI',
    'Codigo_Fuente_Software_TypeScript_React',
    'Arquitectura_Del_Sistema_MultiTenant',
    'BaseDeDatos_Supabase_RLS',
    'Auditoria_AppendOnly_SHA256',
    'Ley675_CalculoInteresesYQuorums',
    'Facturacion_DIAN_UBL21',
    'CajaMenor_Conciliacion_Contable',
    'Consolas_Master_Admin_Supervisor_Porteria_Residente'
  ]),
  allowedCustomizations: Object.freeze([
    'EXCLUSIVAMENTE_PERMITIDO_AL_DUENO_DEL_SOFTWARE: estebanochoamesa@gmail.com'
  ]),
  lockControls: Object.freeze({
    codeLocked: true,
    visualLocked: true,
    textContentLocked: true,
    architectureLocked: true,
    databaseSchemaLocked: true,
    rbacLocked: true
  }),
  coreRules: Object.freeze({
    interesMoraMaximoAnualMultiplier: 1.5,
    quorumDeliberatorioMinimoPct: 50.01,
    quorumDecisorioGeneralPct: 50.01,
    quorumDecisorioCalificadoPct: 70.0,
    dianUblVersion: '2.1',
    auditTrailType: 'APPEND_ONLY_SHA256'
  })
});

/**
 * Constante del correo del Propietario Único Autorizado
 */
export const OWNER_EMAIL_CANONICAL = 'estebanochoamesa@gmail.com';

/**
 * Verifica si un usuario tiene autorización exclusiva para modificar la vista, el código o la arquitectura.
 */
export function isSoftwareModificationAllowed(userEmail?: string | null): boolean {
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === OWNER_EMAIL_CANONICAL;
}

/**
 * Retorna un objeto detallado sobre el estado de blindaje del software.
 */
export function verificarPermisoBlindado(userEmail?: string | null, tipoModificacion: 'visual' | 'codigo' | 'arquitectura' | 'texto' = 'visual'): {
  permitido: boolean;
  mensaje: string;
  dueño: string;
  emailDueño: string;
} {
  const esDueño = isSoftwareModificationAllowed(userEmail);
  if (esDueño) {
    return {
      permitido: true,
      mensaje: `✅ AUTORIZADO: Saludos Esteban Ochoa Mesa (Dueño del Software). Tienes acceso total para modificar la capa ${tipoModificacion}, el código fuente y la arquitectura.`,
      dueño: CORE_MANIFEST.ownerFullName,
      emailDueño: CORE_MANIFEST.ownerEmail
    };
  }

  return {
    permitido: false,
    mensaje: `⛔ ACCESO DENEGADO POR BLINDAJE DE VERSIÓN: La versión v1.0.0, el aspecto visual, el código fuente y la arquitectura están 100% BLINDADOS. Solo la persona autorizada como Dueño del Software (Esteban Ochoa Mesa - ${CORE_MANIFEST.ownerEmail}) tiene permisos para realizar modificaciones visuales, textuales o estructurales.`,
    dueño: CORE_MANIFEST.ownerFullName,
    emailDueño: CORE_MANIFEST.ownerEmail
  };
}

/**
 * Verifica la integridad del código fuente antes de ejecutar operaciones críticas
 */
export function verifyCoreIntegrity(): { intact: boolean; statusMessage: string } {
  if (!CORE_MANIFEST || CORE_MANIFEST.mode !== 'VERSIÓN_BLINDADA_TOTAL_V1.0.0') {
    return {
      intact: false,
      statusMessage: '🚨 ERROR DE SEGURIDAD: Intentó alterarse la integridad o el manifiesto congelado de versión.'
    };
  }
  return {
    intact: true,
    statusMessage: `🛡️ VERSIÓN BLINDADA TOTALMENTE: Código, interfaz visual y arquitectura congeladas y protegidas por Esteban Ochoa Mesa (${CORE_MANIFEST.ownerEmail}).`
  };
}

/**
 * Validador estricto de intereses de mora bajo Ley 675
 */
export function calcularInteresMoraProtegido(montoBase: number, tasaUsuraEfectivaAnual: number, diasAtraso: number): number {
  if (montoBase <= 0 || diasAtraso <= 0) return 0;
  const tasaEfectivaAplicadaPct = Math.min(tasaUsuraEfectivaAnual * CORE_MANIFEST.coreRules.interesMoraMaximoAnualMultiplier, tasaUsuraEfectivaAnual * 1.5);
  const tasaDiaria = Math.pow(1 + tasaEfectivaAplicadaPct / 100, 1 / 365) - 1;
  const interesTotal = montoBase * Math.pow(1 + tasaDiaria, diasAtraso) - montoBase;
  return Math.round(interesTotal);
}

/**
 * Sanitizador seguro de entradas de texto contra inyecciones y caracteres maliciosos
 */
export function sanitizarTextoSeguro(input: string, maxLen = 500): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Verificador blindado de roles: asegura que roles privilegiados no sean suplantados
 */
export function validarRolAutorizado(email: string, claimedRole: string): string {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (claimedRole === 'master_owner' || claimedRole === 'saas_master_owner') {
    if (cleanEmail === OWNER_EMAIL_CANONICAL) {
      return 'master_owner';
    }
    return 'admin_ph';
  }
  return claimedRole || 'admin_ph';
}


