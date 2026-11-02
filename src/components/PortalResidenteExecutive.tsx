import React, { useState } from 'react';
import { Home, Bell, Calendar, QrCode, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface PortalResidenteExecutiveProps {
  notifications?: any[];
  onMarkNotificationsRead?: () => void;
  onCreateReservation?: (amenity: string, date: string) => void;
  onCreateQr?: (visitorName: string, visitorPlate: string) => void;
  onShowToast?: (msg: string) => void;
}

export default function PortalResidenteExecutive({
  notifications = [],
  onMarkNotificationsRead,
  onCreateReservation,
  onCreateQr,
  onShowToast
}: PortalResidenteExecutiveProps) {
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
    <div className="max-w-md mx-auto bg-[#07090e] border border-slate-800/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden font-sans text-slate-100">
      
      {/* Cabecera del Residente */}
      <div className="bg-gradient-to-tr from-cyan-600 to-teal-500 text-slate-950 p-6 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[10px] uppercase font-black bg-slate-950/20 px-2.5 py-1 rounded-full text-slate-950 tracking-wider">
            Mi Apartamento: Torre 2 - 301
          </span>
          <h2 className="text-xl font-black mt-2 text-slate-950 tracking-tight">Esteban Ochoa Mesa</h2>
          <p className="text-xs font-bold text-slate-900 mt-0.5">Urbix Activo • Paz y Salvo al día</p>
        </div>
        <button
          type="button"
          onClick={() => onMarkNotificationsRead?.()}
          className="relative bg-slate-950/20 hover:bg-slate-950/30 p-3 rounded-2xl transition cursor-pointer"
          title="Notificaciones"
        >
          <Bell className="w-6 h-6 text-slate-950" />
        </button>
      </div>

      <div className="p-6 space-y-6 bg-[#0b0f17]">
        
        {/* SECCIÓN 1: RESERVAR ZONAS COMUNES */}
        <div className="bg-[#07090e] p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
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

        {/* SECCIÓN 3: GENERADOR DE PASE QR */}
        <div className="bg-[#07090e] p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
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
    </div>
  );
}
