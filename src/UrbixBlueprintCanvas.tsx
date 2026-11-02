import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, MapPin, Wrench, ShieldAlert, Plus, 
  ZoomIn, ZoomOut, RotateCcw, CheckCircle2, Layers, Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface BlueprintPin {
  id: string;
  x: number;
  y: number;
  title: string;
  category: 'Mantenimiento' | 'Seguridad' | 'Zona Común' | 'Parqueadero';
  status: 'Pendiente' | 'En Proceso' | 'Solucionado';
  tower: string;
}

export default function UrbixBlueprintCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [pins, setPins] = useState<BlueprintPin[]>([
    { id: 'p1', x: 220, y: 150, title: 'Fuga de agua en Lobby', category: 'Mantenimiento', status: 'En Proceso', tower: 'Torre 1' },
    { id: 'p2', x: 450, y: 280, title: 'Cámara C-4 sin señal', category: 'Seguridad', status: 'Pendiente', tower: 'Torre 2' },
    { id: 'p3', x: 320, y: 410, title: 'Mantenimiento piscina principal', category: 'Zona Común', status: 'Solucionado', tower: 'Zonas Comunes' },
    { id: 'p4', x: 150, y: 350, title: 'Vehículo mal parqueado Sótano 1', category: 'Parqueadero', status: 'Pendiente', tower: 'Parqueaderos' }
  ]);

  const [activeTower, setActiveTower] = useState<string>('Todas');
  const [isAddingPin, setIsAddingPin] = useState<boolean>(false);
  const [newPinTitle, setNewPinTitle] = useState<string>('');
  const [newPinCategory, setNewPinCategory] = useState<BlueprintPin['category']>('Mantenimiento');
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);

  // Renderizar plano arquitectónico en HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo técnico estilo blueprint CAD
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cuadrícula arquitectónica (Grid)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40 * zoom;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Dibujar Zonas del Conjunto (Torres y Edificios)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';

    // Torre 1
    ctx.fillRect(100, 80, 180, 180);
    ctx.strokeRect(100, 80, 180, 180);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('TORRE 1 (64 Apto)', 115, 110);

    // Torre 2
    ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
    ctx.fillRect(350, 80, 180, 180);
    ctx.strokeRect(350, 80, 180, 180);
    ctx.fillStyle = '#10b981';
    ctx.fillText('TORRE 2 (64 Apto)', 365, 110);

    // Zonas Comunes / Piscina / Club House
    ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.fillRect(220, 320, 160, 150);
    ctx.strokeRect(220, 320, 160, 150);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('CLUB HOUSE & PISCINA', 235, 350);

    // Parqueaderos Sótano
    ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.fillRect(80, 320, 120, 150);
    ctx.strokeRect(80, 320, 120, 150);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('SÓTANO PARQUEOS', 90, 350);

    // Dibujar pines filtrados
    pins
      .filter(p => selectedCategory === 'Todos' || p.category === selectedCategory)
      .forEach(pin => {
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = pin.category === 'Mantenimiento' ? '#f59e0b' :
                        pin.category === 'Seguridad' ? '#f43f5e' :
                        pin.category === 'Zona Común' ? '#3b82f6' : '#10b981';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Etiqueta del pin
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.fillText(pin.title.substring(0, 22) + '...', pin.x + 12, pin.y + 4);
      });

    // Dibujar punto pendiente si está agregando pin
    if (pendingCoords) {
      ctx.beginPath();
      ctx.arc(pendingCoords.x, pendingCoords.y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }, [pins, zoom, selectedCategory, pendingCoords]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isAddingPin) {
      setPendingCoords({ x, y });
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCoords || !newPinTitle) return;

    const newPin: BlueprintPin = {
      id: `pin-${Date.now()}`,
      x: pendingCoords.x,
      y: pendingCoords.y,
      title: newPinTitle,
      category: newPinCategory,
      status: 'Pendiente',
      tower: 'Torre 1'
    };

    setPins([newPin, ...pins]);
    setPendingCoords(null);
    setNewPinTitle('');
    setIsAddingPin(false);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-10 font-sans flex flex-col gap-6">
      
      {/* 1. HEADER DE CONTROL DE BLUEPRINT */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-3xl gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
              [ SPATIAL BLUEPRINT & CANVAS CAD ]
            </span>
            <span className="text-[10px] font-mono text-slate-400">Reserva del Tesoro P.H.</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Layers className="w-7 h-7 text-emerald-400" />
            Servicio de Canvas Arquitectónico y Zonas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mapa interactivo de copropiedad con posicionamiento geoespacial de incidentes, torres y áreas comunes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddingPin(!isAddingPin)}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer shadow-lg ${
              isAddingPin 
                ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/20' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            {isAddingPin ? 'Cancelar Marcador' : 'Agregar Incidente en Plano'}
          </button>
        </div>
      </div>

      {/* 2. CONTROLES Y FILTROS */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['Todos', 'Mantenimiento', 'Seguridad', 'Zona Común', 'Parqueadero'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.min(zoom + 0.2, 1.8))}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition cursor-pointer"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 0.2, 0.6))}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition cursor-pointer"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition cursor-pointer"
            title="Reiniciar Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. CANVAS INTERACTIVO Y MODAL DE NUEVO PIN */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            width={650}
            height={500}
            onClick={handleCanvasClick}
            className="rounded-2xl border border-slate-800 cursor-crosshair shadow-inner"
          />

          {isAddingPin && !pendingCoords && (
            <div className="absolute top-6 left-6 bg-emerald-500/90 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-lg backdrop-blur animate-bounce">
              📍 Haz clic en cualquier lugar del plano para ubicar el incidente
            </div>
          )}
        </div>

        {/* Panel lateral de gestión de pines */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Marcadores Activos ({pins.length})
          </h3>

          <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
            {pins.map((pin) => (
              <div key={pin.id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                    pin.category === 'Mantenimiento' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    pin.category === 'Seguridad' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    pin.category === 'Zona Común' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {pin.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{pin.status}</span>
                </div>
                <h4 className="text-xs font-bold text-white">{pin.title}</h4>
                <p className="text-[10px] text-slate-400 font-mono">Ubicación: Coor ({pin.x}, {pin.y})</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL PARA CREAR NUEVO PIN SI HAY COORDENADAS PENDIENTES */}
      {pendingCoords && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">Nuevo Marcador en Plano</h3>
              <button onClick={() => setPendingCoords(null)} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Título del Incidente / Tarea</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Luminaria fundida pasillo Torre 1 P3"
                  value={newPinTitle}
                  onChange={(e) => setNewPinTitle(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Categoría</label>
                <select
                  value={newPinCategory}
                  onChange={(e) => setNewPinCategory(e.target.value as any)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Seguridad">Seguridad</option>
                  <option value="Zona Común">Zona Común</option>
                  <option value="Parqueadero">Parqueadero</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingCoords(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Guardar en el Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
