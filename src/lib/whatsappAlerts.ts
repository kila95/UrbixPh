// Función auxiliar para disparar la alerta de WhatsApp desde el cliente o servidor
export const dispararAlertaWhatsApp = async (
  tipoEvento: 'NEW_PACKAGE' | 'RESERVATION_APPROVED',
  datosRegistro: any,
  nombreConjunto: string
) => {
  try {
    await fetch('/api/webhook/whatsapp-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: tipoEvento,
        record: datosRegistro,
        tenantName: nombreConjunto
      })
    });
  } catch (e) {
    console.warn("No se pudo despachar la notificación por WhatsApp:", e);
  }
};
