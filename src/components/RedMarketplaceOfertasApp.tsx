import React, { useState } from 'react';
import { Store, MessageCircle, MapPin, Globe, Tag, Clock, Flame } from 'lucide-react';

export default function RedMarketplaceOfertasApp() {
  const [activeTabRed, setActiveTabRed] = useState('vitrina');
  const [radioKm, setRadioKm] = useState('5');

  // Emprendimientos en la red
  const [emprendimientosRed] = useState([
    {
      id: '1',
      copropiedadOrigen: 'Edificio Altos del Poblado (a 1.2 km)',
      propietario: 'Camila Rojas',
      nombreNegocio: 'Café Orgánico de Origen',
      categoria: 'Alimentos y Bebidas',
      descripcion: 'Café tostado artesanalmente en grano o molido.',
      whatsapp: '573001112233',
      imagen: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80',
      distanciaKm: 1.2
    },
    {
      id: '2',
      copropiedadOrigen: 'Urbix PH - Torre 2 (Tu copropiedad)',
      propietario: 'Ana María Gómez',
      nombreNegocio: 'Repostería Artesanal Dulce Encanto',
      categoria: 'Alimentos y Bebidas',
      descripcion: 'Tortas personalizadas y postres fríos.',
      whatsapp: '573001234567',
      imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
      distanciaKm: 0.1
    }
  ]);

  // Ofertas flash de los vecinos
  const [ofertasFlash] = useState([
    {
      id: '1',
      negocio: 'Repostería Artesanal Dulce Encanto',
      oferta: '20% de descuento en cajas de brownies surtidos por compras este fin de semana.',
      codigo: 'FINDE-DULCE-20',
      validez: 'Válido hasta el domingo a las 6:00 PM',
      whatsapp: '573001234567',
      copropiedad: 'Urbix PH - Torre 2'
    },
    {
      id: '2',
      negocio: 'Café Orgánico de Origen',
      oferta: 'Envío gratis a domicilio en un radio menor a 2 km por la compra de 2 libras de café.',
      codigo: 'CAFE-ENVIOGRATIS',
      validez: 'Válido por tiempo limitado',
      whatsapp: '573001112233',
      copropiedad: 'Edificio Altos del Poblado'
    }
  ]);

  const emprendimientosFiltrados = emprendimientosRed.filter(emp => emp.distanciaKm <= parseFloat(radioKm));

  return (
    <div className="min-h-full bg-[#141416] text-gray-200 font-sans flex flex-col p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* CABECERA CON SELECTOR DE RADIO */}
        <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" /> Red de Emprendimientos & Ofertas Vecinales
            </h1>
            <p className="text-xs text-gray-400 mt-1">Comercio hiperlocal colaborativo entre copropiedades cercanas.</p>
          </div>

          <div className="flex items-center gap-3 bg-[#141416] px-4 py-2 rounded-xl border border-[#262629]">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-gray-400">Radio:</span>
            <select 
              value={radioKm} 
              onChange={(e) => setRadioKm(e.target.value)}
              className="bg-transparent text-xs font-mono text-cyan-400 font-bold outline-none cursor-pointer"
            >
              <option value="1">Menos de 1 km</option>
              <option value="5">Menos de 5 km</option>
              <option value="20">Hasta 20 km</option>
            </select>
          </div>
        </div>

        {/* NAVEGACIÓN INTERNA RED */}
        <div className="flex gap-2 border-b border-[#262629] pb-3">
          <button 
            onClick={() => setActiveTabRed('vitrina')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTabRed === 'vitrina' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}
          >
            🛍️ Vitrina de Emprendimientos
          </button>
          <button 
            onClick={() => setActiveTabRed('ofertas')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTabRed === 'ofertas' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}
          >
            🔥 Ofertas Flash Vecinales
          </button>
        </div>

        {/* PESTAÑA 1: VITRINA */}
        {activeTabRed === 'vitrina' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emprendimientosFiltrados.map(emp => (
              <div key={emp.id} className="bg-[#1c1c1f] border border-[#262629] rounded-2xl overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative">
                    <img src={emp.imagen} alt={emp.nombreNegocio} className="w-full h-48 object-cover border-b border-[#262629]" />
                    <span className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-cyan-400 border border-cyan-500/30">
                      📍 {emp.copropiedadOrigen}
                    </span>
                  </div>
                  
                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{emp.categoria}</span>
                    <h3 className="text-md font-bold text-white">{emp.nombreNegocio}</h3>
                    <p className="text-xs text-gray-400">{emp.descripcion}</p>
                    <p className="text-[11px] font-mono text-gray-500 pt-2 border-t border-[#262629]">Emprendedor: {emp.propietario}</p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <a 
                    href={`https://api.whatsapp.com/send?phone=${emp.whatsapp}&text=Hola,%20vi%20tu%20emprendimiento%20en%20la%20Red%20Vecinal%20Urbix%20y%20quiero%20más%20información.`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Contactar Vecino por WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PESTAÑA 2: OFERTAS FLASH */}
        {activeTabRed === 'ofertas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ofertasFlash.map(of => (
              <div key={of.id} className="bg-[#1c1c1f] border border-[#262629] p-6 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> PROMOCIÓN ESPECIAL
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">{of.copropiedad}</span>
                  </div>
                  <h3 className="text-md font-bold text-white">{of.negocio}</h3>
                  <p className="text-xs text-gray-300 bg-[#141416] p-3 rounded-xl border border-[#262629]">{of.oferta}</p>
                  
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 pt-1">
                    <Tag className="w-4 h-4" /> Código de Vecino: <strong className="text-white bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">{of.codigo}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono">
                    <Clock className="w-3.5 h-3.5" /> {of.validez}
                  </div>
                </div>

                <a 
                  href={`https://api.whatsapp.com/send?phone=${of.whatsapp}&text=Hola,%20vi%20tu%20oferta%20"${of.codigo}"%20en%20la%20Red%20Vecinal%20Urbix%20y%20quiero%20aprovecharla.`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-cyan-500 text-black font-bold py-2.5 rounded-xl text-xs hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Usar Cupón por WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
