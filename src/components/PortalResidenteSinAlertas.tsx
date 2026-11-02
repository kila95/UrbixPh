import React, { useState } from 'react';
import { Calendar, QrCode } from 'lucide-react';

export interface PortalResidenteSinAlertasProps {
  onCreateReservation?: (amenity: string, date: string) => void;
  onCreateQr?: (visitorName: string, visitorPlate: string) => void;
  onShowToast?: (msg: string) => void;
}

export default function PortalResidenteSinAlertas({
  onCreateReservation,
  onCreateQr,
  onShowToast
}: PortalResidenteSinAlertasProps) {
  const [selectedAmenity, setSelectedAmenity] = useState('Salón Social');
  const [reservationDate, setReservationDate] = useState('');
  
  const [visitorName, setVisitorName] = useState('');
  const [visitorPlate, setVisitorPlate] = useState('');

  const handleReservaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationDate.trim()) return;
    onCreateReservation?.(selectedAmenity, reservationDate);
    setReservationDate('');
    onShowToast?.('📅 Solicitud de reserva enviada al administrador.');
  };

  const handleQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return;
    onCreateQr?.(visitorName, visitorPlate);
    setVisitorName('');
    setVisitorPlate('');
    onShowToast?.('📱 Pase QR generado y enviado a portería.');
  };

  return (
    <div className="max-w-md mx-auto bg-[#07090e] border border-slate-800/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden font-sans text-slate-100 p-6 space-y-6">
      
      {/* SE ELIMINÓ EL BLOQUE ESTÁTICO DE "ALERTAS EN VIVO". AHORA INICIA DIRECTAMENTE CON LOS MÓDULOS */}

      {/* SECCIÓN 1: RESERVAR ZONAS COMUNES */}
      <div className="bg-[#0b0f17] p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
        <h3 className="font-bold text-xs text-white flex items-center gap-2 font-mono uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-cyan-400" /> Reservar Zonas Comunes
        </h3>
        
        <form onSubmit={handleReservaSubmit} className="space-y-3">
          <select
            value={selectedAmenity}
            onChange={(e) => setSelectedAmenity(e.target.value)}
            className="w-full p-3 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400 font-bold"
          >
            <option>Salón Social</option>
            <option>Cancha Sintética</option>
            <option>Zona BBQ</option>
          </select>

          <input
            type="text"
            placeholder="Fecha (Ej. Sábado 7 Nov - 6 PM)"
            value={reservationDate}
            onChange={(e) => setReservationDate(e.target.value)}
            className="w-full p-3 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400"
            required
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black py-3 rounded-xl text-xs transition cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)]"
          >
            Solicitar al Administrador
          </button>
        </form>
      </div>

      {/* SECCIÓN 2: GENERADOR DE PASE QR */}
      <div className="bg-[#0b0f17] p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
        <h3 className="font-bold text-xs text-white flex items-center gap-2 font-mono uppercase tracking-wider">
          <QrCode className="w-4 h-4 text-teal-400" /> Autorizar Visita o Domicilio
        </h3>

        <form onSubmit={handleQrSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre visitante / Domiciliario"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            className="w-full p-3 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none focus:border-teal-400"
            required
          />

          <input
            type="text"
            placeholder="Placa vehículo (Opcional)"
            value={visitorPlate}
            onChange={(e) => setVisitorPlate(e.target.value)}
            className="w-full p-3 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl outline-none focus:border-teal-400"
          />

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer border border-slate-700 shadow-md"
          >
            Generar Pase QR
          </button>
        </form>
      </div>

    </div>
  );
}
