import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Store, 
  PlusCircle, 
  Search, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  Tag, 
  Star
} from 'lucide-react';

interface Emprendimiento {
  id: string;
  unit_number: string;
  resident_name: string;
  business_name: string;
  category: string;
  description: string;
  price_range: string;
  delivery_mode: string;
  whatsapp_number: string;
  nequi_daviplata?: string;
  schedule: string;
  image_url?: string;
  verified_resident: boolean;
  paz_y_salvo: boolean;
  rating: number;
}

const CATEGORIAS = [
  { id: 'todas', label: 'Todas las Categorías' },
  { id: 'gastronomia', label: '🍱 Gastronomía & Antojos' },
  { id: 'servicios', label: '💼 Servicios Profesionales' },
  { id: 'mantenimiento', label: '🛠️ Mantenimiento & Hogar' },
  { id: 'mascotas', label: '🐾 Cuidado de Mascotas' },
  { id: 'garaje', label: '🏷️ Venta de Garaje / Usados' }
];

export default function ResidenteEmprendimientosApp({
  unidadResidente = 'Torre 2 - 301',
  nombreResidente = 'Esteban Ochoa',
  tenantId = 't1',
  onShowToast
}: {
  unidadResidente?: string;
  nombreResidente?: string;
  tenantId?: string;
  onShowToast?: (msg: string) => void;
}) {
  const [vistaActiva, setVistaActiva] = useState<'vitrina' | 'formulario'>('vitrina');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [items, setItems] = useState<Emprendimiento[]>([]);
  const [cargando, setCargando] = useState(false);

  // Formulario State
  const [form, setForm] = useState({
    business_name: '',
    category: 'gastronomia',
    description: '',
    price_range: '',
    delivery_mode: 'porteria',
    whatsapp_number: '',
    nequi_daviplata: '',
    schedule: 'Lunes a Domingo 8:00 AM - 8:00 PM',
    image_url: ''
  });

  useEffect(() => {
    cargarEmprendimientos();
  }, [tenantId]);

  const cargarEmprendimientos = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('mercadillo_emprendimientos')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'activo')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setItems(data as Emprendimiento[]);
    } else {
      // Datos demo de alta fidelidad si la tabla recién se inicializa
      setItems([
        {
          id: 'demo-1',
          unit_number: 'Torre 1 - 502',
          resident_name: 'Martha Lucía Gómez',
          business_name: 'Repostería Artesanal Delicias PH',
          category: 'gastronomia',
          description: 'Tortas caseras de zanahoria, brownies melcochudos y postres 100% frescos sin conservantes para tus reuniones o antojos de tarde.',
          price_range: '$8.000 - $35.000 COP',
          delivery_mode: 'porteria',
          whatsapp_number: '573001234567',
          nequi_daviplata: '3001234567',
          schedule: 'Martes a Domingo de 2:00 PM a 8:00 PM',
          image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
          verified_resident: true,
          paz_y_salvo: true,
          rating: 4.9
        },
        {
          id: 'demo-2',
          unit_number: 'Torre 2 - 404',
          resident_name: 'Mauricio Restrepo',
          business_name: 'Soporte Técnico PC & Redes Wifi',
          category: 'servicios',
          description: 'Mantenimiento de computadores, instalación de repetidores de señal WiFi para mejorar la cobertura en el apartamento y software contable.',
          price_range: 'Tarifa base desde $40.000 COP',
          delivery_mode: 'retiro_apto',
          whatsapp_number: '573109876543',
          nequi_daviplata: '3109876543',
          schedule: 'Lunes a Viernes 5:00 PM - 9:00 PM',
          image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
          verified_resident: true,
          paz_y_salvo: true,
          rating: 5.0
        }
      ]);
    }
    setCargando(false);
  };

  const handleCrearEmprendimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name || !form.whatsapp_number) {
      alert('Por favor diligencia el nombre del emprendimiento y tu número de WhatsApp.');
      return;
    }

    setCargando(true);
    const { error } = await supabase.from('mercadillo_emprendimientos').insert([
      {
        tenant_id: tenantId,
        unit_number: unidadResidente,
        resident_name: nombreResidente,
        business_name: form.business_name,
        category: form.category,
        description: form.description,
        price_range: form.price_range || 'A convenir',
        delivery_mode: form.delivery_mode,
        whatsapp_number: form.whatsapp_number.replace(/\D/g, ''),
        nequi_daviplata: form.nequi_daviplata,
        schedule: form.schedule,
        image_url: form.image_url || 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&auto=format&fit=crop&q=80',
        verified_resident: true,
        paz_y_salvo: true,
        status: 'activo'
      }
    ]);

    setCargando(false);

    if (error) {
      alert('Error guardando en Supabase: ' + error.message);
    } else {
      if (onShowToast) onShowToast('¡Emprendimiento publicado con éxito en la vitrina!');
      setVistaActiva('vitrina');
      cargarEmprendimientos();
    }
  };

  const itemsFiltrados = items.filter(item => {
    const coincideCat = categoriaFiltro === 'todas' || item.category === categoriaFiltro;
    const coincideTexto = 
      item.business_name.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.description.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.unit_number.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCat && coincideTexto;
  });

  return (
    <div className="space-y-6 select-none font-sans">
      {/* HEADER DE SECCIÓN */}
      <div className="bg-[#090d14] border border-cyan-500/20 rounded-3xl p-6 shadow-[0_0_25px_rgba(0,242,254,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white font-mono tracking-wider">URBIX PH</h2>
                <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  Mercadillo Comunitario
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Apoya el comercio hiperlocal y los talentos de tus vecinos con garantía de copropiedad verificada.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVistaActiva('vitrina')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition flex items-center gap-2 ${
                vistaActiva === 'vitrina'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-inner'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛍️ Ver Vitrina
            </button>
            <button
              onClick={() => setVistaActiva('formulario')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition flex items-center gap-2 ${
                vistaActiva === 'formulario'
                  ? 'bg-[#00f2fe] text-slate-950 font-black shadow-[0_0_15px_rgba(0,242,254,0.35)]'
                  : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Postular Mi Emprendimiento
            </button>
          </div>
        </div>
      </div>

      {/* VISTA 1: VITRINA COMUNITARIA */}
      {vistaActiva === 'vitrina' && (
        <div className="space-y-6">
          {/* BUSCADOR Y SELECTOR DE CATEGORÍAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por producto, servicio o número de torre/apto..."
                className="w-full bg-[#05080e] border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 outline-none transition"
              />
            </div>

            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="bg-[#05080e] border border-slate-800 rounded-2xl px-4 py-3 text-xs font-mono text-cyan-300 focus:border-cyan-400 outline-none transition cursor-pointer"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#090d14] text-white">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* GRID DE CARDS DEL MERCADILLO */}
          {itemsFiltrados.length === 0 ? (
            <div className="bg-[#05080e] border border-slate-800/80 rounded-3xl p-12 text-center space-y-3">
              <Store className="w-10 h-10 mx-auto text-slate-600 opacity-40" />
              <h3 className="text-sm font-mono font-bold text-slate-300">No hay publicaciones en esta categoría</h3>
              <p className="text-xs text-slate-500 font-mono">Sé el primero en ofrecer tus productos o servicios a la copropiedad.</p>
              <button
                onClick={() => setVistaActiva('formulario')}
                className="mt-2 inline-block text-xs font-mono text-cyan-400 underline hover:text-cyan-300"
              >
                + Publicar mi negocio ahora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {itemsFiltrados.map((item) => {
                const mensajeWhatsapp = encodeURIComponent(
                  `Hola ${item.resident_name}, te contacto desde Urbix PH por tu anuncio de "${item.business_name}" en ${item.unit_number}. Me gustaría hacerte una consulta.`
                );
                const enlaceWhatsapp = `https://wa.me/${item.whatsapp_number}?text=${mensajeWhatsapp}`;

                return (
                  <div
                    key={item.id}
                    className="bg-[#05080e] border border-slate-800 hover:border-cyan-500/40 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 group shadow-lg hover:shadow-[0_0_25px_rgba(0,242,254,0.1)]"
                  >
                    {/* IMAGEN DE PORTAFOLIO */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                      <img
                        src={item.image_url}
                        alt={item.business_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#05080e] via-transparent to-black/40" />
                      
                      {/* BADGES SUPERIORES */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="bg-emerald-500/90 text-slate-950 font-mono text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <ShieldCheck className="w-3 h-3" /> Vecino Verificado
                        </span>
                        {item.paz_y_salvo && (
                          <span className="bg-cyan-500/90 text-slate-950 font-mono text-[9px] font-black px-2 py-0.5 rounded-full shadow">
                            Paz y Salvo PH
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2 right-3">
                        <span className="text-[11px] font-mono font-black text-amber-300 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {item.rating}
                        </span>
                      </div>
                    </div>

                    {/* CONTENIDO DEL ANUNCIO */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase">
                            {item.unit_number}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.resident_name}
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-white font-mono leading-snug group-hover:text-cyan-300 transition">
                          {item.business_name}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* DATOS DE OPERACIÓN & PRECIO */}
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-cyan-400" /> Tarifa:
                          </span>
                          <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {item.price_range}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-slate-500" /> Entrega:
                          </span>
                          <span className="text-slate-300">
                            {item.delivery_mode === 'porteria' && '📦 Dejar en Portería'}
                            {item.delivery_mode === 'puerta_a_puerta' && '🚪 Puerta a Puerta'}
                            {item.delivery_mode === 'retiro_apto' && '🏠 Retiro en Apartamento'}
                          </span>
                        </div>

                        {item.nequi_daviplata && (
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span className="text-slate-500">Nequi / Daviplata:</span>
                            <span className="text-purple-300 font-bold">{item.nequi_daviplata}</span>
                          </div>
                        )}
                      </div>

                      {/* BOTÓN DIRECTO A WHATSAPP */}
                      <a
                        href={enlaceWhatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-black py-2.5 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_15px_rgba(37,211,102,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 fill-slate-950" />
                        Contactar al Vecino por WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: FORMULARIO DE POSTULACIÓN */}
      {vistaActiva === 'formulario' && (
        <div className="bg-[#05080e] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-[0_0_30px_rgba(0,242,254,0.1)]">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h3 className="text-base font-black text-white font-mono uppercase tracking-wider">
              Registra tu Emprendimiento en la App
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Comparte lo que haces con todos los vecinos de la copropiedad de forma gratuita y segura.
            </p>
          </div>

          <form onSubmit={handleCrearEmprendimiento} className="space-y-4 font-mono text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Nombre del Negocio o Servicio *</label>
              <input
                type="text"
                required
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                placeholder="Ej. Postres Caseros La Abuela / Clases de Matemáticas"
                className="w-full bg-[#090d14] border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Categoría *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-[#090d14] border border-slate-800 rounded-xl p-3 text-cyan-300 focus:border-cyan-400 outline-none cursor-pointer"
                >
                  <option value="gastronomia">🍱 Gastronomía & Repostería</option>
                  <option value="servicios">💼 Servicios Profesionales / Asesorías</option>
                  <option value="mantenimiento">🛠️ Mantenimiento & Pintura</option>
                  <option value="mascotas">🐾 Mascotas & Paseos</option>
                  <option value="garaje">🏷️ Venta de Garaje / Segunda Mano</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">WhatsApp de Contacto *</label>
                <input
                  type="text"
                  required
                  value={form.whatsapp_number}
                  onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                  placeholder="Ej. 3001234567"
                  className="w-full bg-[#090d14] border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Descripción del Producto o Servicio *</label>
              <textarea
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalla qué ofreces, promociones especiales para vecinos y tiempos de entrega..."
                className="w-full bg-[#090d14] border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-400 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Rango de Precios / Tarifa Base</label>
                <input
                  type="text"
                  value={form.price_range}
                  onChange={(e) => setForm({ ...form, price_range: e.target.value })}
                  placeholder="Ej. Desde $15.000 COP"
                  className="w-full bg-[#090d14] border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Modalidad de Entrega</label>
                <select
                  value={form.delivery_mode}
                  onChange={(e) => setForm({ ...form, delivery_mode: e.target.value })}
                  className="w-full bg-[#090d14] border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-400 outline-none cursor-pointer"
                >
                  <option value="porteria">📦 Dejar en Portería (Recepción)</option>
                  <option value="puerta_a_puerta">🚪 Entrega en Puerta de Apartamento</option>
                  <option value="retiro_apto">🏠 Retiro Directo en mi Apartamento</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Cuenta Nequi o Daviplata (Opcional)</label>
                <input
                  type="text"
                  value={form.nequi_daviplata}
                  onChange={(e) => setForm({ ...form, nequi_daviplata: e.target.value })}
                  placeholder="Ej. 3001234567"
                  className="w-full bg-[#090d14] border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">URL de Foto o Portafolio</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#090d14] border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/20 rounded-2xl text-[10px] text-cyan-300 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <span>
                Tu publicación saldrá respaldada bajo <strong>{unidadResidente}</strong>. Se prohíben productos contrarios al manual de convivencia.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVistaActiva('vitrina')}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="w-2/3 bg-[#00f2fe] hover:bg-cyan-300 text-slate-950 font-black py-3 rounded-xl uppercase tracking-wider transition shadow-[0_0_15px_rgba(0,242,254,0.35)]"
              >
                {cargando ? 'Publicando...' : 'Publicar en la Vitrina'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
