export interface PaseQrVisitante {
  id: string;
  nombreVisitante: string;
  documento: string;
  aptoDestino: string;
  fechaVigencia: string;
  placaPrevia?: string;
}

export { default } from './PuestoControlGaritaUnificado';
