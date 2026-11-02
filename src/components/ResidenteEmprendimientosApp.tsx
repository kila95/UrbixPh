import React, { useState } from 'react';
import { 
  Building2, ShoppingBag, Plus, Share2, MessageCircle, Store, Tag
} from 'lucide-react';

// =========================================================================
// URBIX PH - MÓDULO DE EMPRENDIMIENTOS Y MINI TIENDA DE RESIDENTES
// =========================================================================

export default function ResidenteEmprendimientosApp() {
  const [activeTab, setActiveTab] = useState('vitrina');

  // Estado inicial de emprendimientos postulados por los vecinos
  const [emprendimientos, setEmprendimientos] = useState([
    {
      id: '1',
      propietario: 'Ana María Gómez (Torre 1 - 202)',
      nombreNegocio: 'Repostería Artesanal Dulce Encanto',
      categoria: 'Alimentos y Bebidas',
      descripcion: 'Tortas personalizadas, postres fríos y brownies artesanales para toda ocasión con entrega a la puerta de tu torre.',
      whatsapp: '573001234567',
      imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
      estado: 'Aprobado'
    },
    {
      id: '2',
      propietario: 'Sofía Restrepo (Torre 2 - 402)',
      nombreNegocio: 'Soporte Técnico y Clases de Inglés',
      categoria: 'Servicios Profesionales',
      descripcion: 'Clases particulares de inglés conversacional para niños y adultos, y mantenimiento preventivo de computadores a domicilio.',
      whatsapp: '573109876543',
      imagen: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
      estado: 'Aprobado'
    }
  ]);

  // Función para postular un nuevo emprendimiento
  const postularEmprendimiento = (e: any) => {
    e.preventDefault();
    const nombreNegocio = e.target.nombreNegocio.value;
    const categoria = e.target.categoria.value;
    const descripcion = e.target.descripcion.value;
    const whatsapp = e.target.whatsapp.value;

    const nuevo = {
      id: Date.now().toString(),
      propietario: 'Esteban Ochoa (Torre 2 - 301)',
      nombreNegocio,
      categoria,
      descripcion,
      whatsapp,
      imagen: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80',
      estado: 'Pendiente de Aprobación'
    };

    setEmprendimientos([nuevo, ...emprendimientos]);
    e.target.reset();
    alert("¡Tu emprendimiento ha sido postulado con éxito! Estará visible para la comunidad una vez la administración lo apruebe.");
    setActiveTab('vitrina');
  };

  return (
    <div className="min-h-full bg-[#141416] text-gray-200 font-sans flex flex-col">
      
      {/* CABECERA */}
      <header className="bg-[#1c1c1f] border-b border-[#262629] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/30">
            <Store className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              URBIX PH <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Mercadillo Comunitario</span>
            </h1>
            <p className="text-xs text-gray-400">Apoya los emprendimientos de tus vecinos</p>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* NAVEGACIÓN */}
        <div className="flex gap-2 border-b border-[#262629] pb-3">
          <button 
            onClick={() => setActiveTab('vitrina')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'vitrina' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}
          >
            🛍️ Ver Vitrina de Emprendimientos
          </button>
          <button 
            onClick={() => setActiveTab('postular')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'postular' ? 'bg-[#1c1c1f] text-cyan-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}
          >
            + Postular Mi Emprendimiento
          </button>
        </div>

        {/* PESTAÑA 1: VITRINA DE EMPRENDIMIENTOS */}
        {activeTab === 'vitrina' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emprendimientos.map(emp => (
              <div key={emp.id} className="bg-[#1c1c1f] border border-[#262629] rounded-2xl overflow-hidden flex flex-col justify-between">
                <div>
                  <img src={emp.imagen} alt={emp.nombreNegocio} className="w-full h-48 object-cover border-b border-[#262629]" />
                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{emp.categoria}</span>
                    <h3 className="text-md font-bold text-white">{emp.nombreNegocio}</h3>
                    <p className="text-xs text-gray-400">{emp.descripcion}</p>
                    <p className="text-[11px] font-mono text-gray-500 pt-2 border-t border-[#262629]">Por: {emp.propietario}</p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <a 
                    href={`https://api.whatsapp.com/send?phone=${emp.whatsapp}&text=Hola,%20vi%20tu%20emprendimiento%20en%20el%20Mercadillo%20de%20Urbix%20PH%20y%20quiero%20más%20información.`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PESTAÑA 2: FORMULARIO DE POSTULACIÓN */}
        {activeTab === 'postular' && (
          <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] max-w-2xl mx-auto w-full">
            <h3 className="text-md font-bold text-white mb-2">Registra tu Emprendimiento en la App</h3>
            <p className="text-xs text-gray-400 mb-6">Comparte lo que haces con todos tus vecinos de la copropiedad de forma gratuita.</p>

            <form onSubmit={postularEmprendimiento} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Nombre del Negocio o Servicio</label>
                <input name="nombreNegocio" type="text" placeholder="Ej. Accesorios y Arte en Cuero" required className="w-full bg-[#141416] border border-[#262629] rounded-xl px-4 py-2.5 text-white focus:border-cyan-500 outline-none" />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Categoría</label>
                <select name="categoria" required className="w-full bg-[#141416] border border-[#262629] rounded-xl px-4 py-2.5 text-white focus:border-cyan-500 outline-none">
                  <option value="">Selecciona una categoría...</option>
                  <option value="Alimentos y Bebidas">Alimentos y Bebidas</option>
                  <option value="Servicios Profesionales">Servicios Profesionales</option>
                  <option value="Moda y Belleza">Moda y Belleza</option>
                  <option value="Hogar y Manualidades">Hogar y Manualidades</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Descripción de lo que ofreces</label>
                <textarea name="descripcion" rows={3} placeholder="Cuéntales a tus vecinos qué vendes y cómo pueden contactarte..." required className="w-full bg-[#141416] border border-[#262629] rounded-xl px-4 py-2.5 text-white focus:border-cyan-500 outline-none"></textarea>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Número de WhatsApp (con código de país, ej: 573...)</label>
                <input name="whatsapp" type="text" placeholder="573000000000" required className="w-full bg-[#141416] border border-[#262629] rounded-xl px-4 py-2.5 text-white focus:border-cyan-500 outline-none" />
              </div>

              <button type="submit" className="w-full bg-cyan-500 text-black font-bold py-3 rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Enviar Postulación a la Administración
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
