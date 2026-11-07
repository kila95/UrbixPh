import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Building2, Users, FileText, HardHat, DollarSign, 
  MessageSquare, ShieldCheck, AlertTriangle, Plus, 
  Search, Download, CheckCircle2, Clock, Calendar, 
  Printer, ArrowUpRight, Scale, Check, X, RefreshCw, Crown, UserCheck, ClipboardCheck
} from 'lucide-react';
import ContractorsModule from './ContractorsModule';
import MeetingMinutesModule from './MeetingMinutesModule';
import AdminHeaderWithHierarchy, { HierarchyRole } from './AdminHeaderWithHierarchy';
import SupervisorOpsHub, { PaymentVoucherItem } from './SupervisorOpsHub';
import PanelAdministradorModulo3, {
  INITIAL_UNIDADES_MEDELLIN,
  INITIAL_RECAUDOS_MES,
  INITIAL_EGRESOS_MEDELLIN,
  INITIAL_PERSONAL_OPERATIVO,
  INITIAL_ORDENES_CONTRATISTAS,
  INITIAL_SANCIONES_CONVIVENCIA,
  INITIAL_EQUIPOS_CRITICOS,
  INITIAL_REFORMAS_MUDANZAS,
  INITIAL_INVENTARIO_BODEGA,
  UnidadCarteraPH,
  RegistroRecaudoPH,
  RegistroEgresoProveedorPH,
  PersonalOperativoPH,
  OrdenTrabajoContratista,
  SancionConvivenciaPH,
  EquipoCriticoPH,
  ReformaMudanzaPH,
  InsumoBodegaPH
} from './PanelAdministradorModulo3';

export interface MasterTenantItem {
  id: string;
  name: string;
  nit: string;
  zone: string;
  city: string;
  units: number;
}

export interface BalanceItem {
  id: string;
  unit: string;
  owner: string;
  doc: string;
  phone: string;
  fee: number;
  debt: number;
  days: number;
  status: string;
}

export interface PqrsdTicketItem {
  id: string;
  number: string;
  unit: string;
  applicant: string;
  category: string;
  desc: string;
  deadline: string;
  daysLeft: number;
  status: string;
  officialResponse?: string;
}

export interface ContractorSummaryItem {
  id: string;
  name: string;
  specialty: string;
  arl: string;
  validUntil: string;
  active: boolean;
  phone: string;
}

export interface ActaLegalItem {
  id: string;
  number: string;
  type: string;
  date: string;
  quorum: string;
  president: string;
  secretary: string;
  status: string;
  summary: string;
}

export interface AdminMasterConsoleProps {
  selectedTenantId?: string;
  onSelectTenant?: (tenantId: string) => void;
  onShowToast?: (msg: string) => void;
  initialHierarchyRole?: HierarchyRole;
  user?: { name: string; role: string; email?: string };
  onSwitchRole?: (role: 'superadmin' | 'administrador' | 'supervisor' | 'vigilante') => void;
  onLogout?: () => void;
  isReadOnly?: boolean;
}

export default function AdminMasterConsole({
  selectedTenantId,
  onSelectTenant,
  onShowToast,
  initialHierarchyRole = 'administrador',
  user,
  onSwitchRole,
  onLogout,
  isReadOnly = false
}: AdminMasterConsoleProps) {
  // 1. ESTADO MULTI-TENANT (SWITCHER) Y JERARQUÍA CORPORATIVA (3 RANGOS)
  const [tenants, setTenants] = useState<MasterTenantItem[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string>(selectedTenantId || '');
  const activeTenant = tenants.find(t => t.id === currentTenantId) || {
    id: '',
    name: 'Sin Copropiedad Activa',
    nit: 'S/N',
    zone: '',
    city: '',
    units: 0
  };

  useEffect(() => {
    const cargarTenantsSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name')
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          const list: MasterTenantItem[] = data.map(t => ({
            id: t.id,
            name: t.name || 'Copropiedad',
            nit: 'S/N',
            zone: 'Antioquia',
            city: 'Medellín',
            units: 0
          }));
          setTenants(list);
          setCurrentTenantId(prev => prev || list[0].id);
        }
      } catch (err) {
        console.warn('Aviso cargando tenants en AdminMasterConsole:', err);
      }
    };
    cargarTenantsSupabase();
  }, []);

  // Estado de Jerarquía Operativa ('superadmin' | 'administrador' | 'supervisor') y Modo Relevo
  const [hierarchyRole, setHierarchyRole] = useState<HierarchyRole>(initialHierarchyRole);
  const [isReemplazoActivo, setIsReemplazoActivo] = useState<boolean>(false);

  // Bitácora de Auditoría en Sitio del Supervisor Operativo
  const [supervisorChecklist, setSupervisorChecklist] = useState<any[]>([]);

  // Determina si el usuario actual posee facultades plenas de Representante Legal (Superadmin, Admin Titular o Supervisor en Modo Relevo)
  const hasLegalAdminPowers =
    hierarchyRole === 'superadmin' ||
    hierarchyRole === 'administrador' ||
    (hierarchyRole === 'supervisor' && isReemplazoActivo);

  // Pestañas principales
  const [activeTab, setActiveTab] = useState<'ops' | 'cartera' | 'pqrsd' | 'contractors' | 'actas'>(
    initialHierarchyRole === 'supervisor' ? 'ops' : 'cartera'
  );

  // Notificación interna de respaldo si no se pasa onShowToast
  const [localBanner, setLocalBanner] = useState<string | null>(null);
  const notify = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    }
    setLocalBanner(msg);
    setTimeout(() => setLocalBanner(null), 4500);
  };

  // Vista previa de documento legal (Paz y Salvo o Acta Legal) para entornos iFrame y exportación PDF
  const [legalDocPreview, setLegalDocPreview] = useState<{
    title: string;
    subtitle: string;
    htmlContent: string;
  } | null>(null);

  // 2. ESTADO DE CARTERA Y PAZ Y SALVOS (MÓDULO 3.1 MIGRADO A 4. CARTERA LEY)
  const [unidadesShared, setUnidadesShared] = useState<UnidadCarteraPH[]>(INITIAL_UNIDADES_MEDELLIN);
  const [recaudosShared, setRecaudosShared] = useState<RegistroRecaudoPH[]>(INITIAL_RECAUDOS_MES);
  const [egresosShared, setEgresosShared] = useState<RegistroEgresoProveedorPH[]>(INITIAL_EGRESOS_MEDELLIN);
  const [personalShared, setPersonalShared] = useState<PersonalOperativoPH[]>(INITIAL_PERSONAL_OPERATIVO);
  const [ordenesShared, setOrdenesShared] = useState<OrdenTrabajoContratista[]>(INITIAL_ORDENES_CONTRATISTAS);
  const [sancionesShared, setSancionesShared] = useState<SancionConvivenciaPH[]>(INITIAL_SANCIONES_CONVIVENCIA);
  const [cajaMenorShared, setCajaMenorShared] = useState<any[]>([]);
  const [equiposCriticosShared, setEquiposCriticosShared] = useState<EquipoCriticoPH[]>(INITIAL_EQUIPOS_CRITICOS);
  const [reformasMudanzasShared, setReformasMudanzasShared] = useState<ReformaMudanzaPH[]>(INITIAL_REFORMAS_MUDANZAS);
  const [inventarioBodegaShared, setInventarioBodegaShared] = useState<InsumoBodegaPH[]>(INITIAL_INVENTARIO_BODEGA);
  const [auditLogsShared, setAuditLogsShared] = useState<any[]>([]);

  const appendAuditLogShared = (action: string, details: string) => {
    setAuditLogsShared(prev => [{ id: Date.now(), timestamp: new Date().toLocaleString(), user_executor: 'Carlos Mario Pineda (Admin)', action_type: action, details }, ...prev]);
  };

  // 3. ESTADO DE PQRSD Y CONVIVENCIA
  const [tickets, setTickets] = useState<PqrsdTicketItem[]>([]);
  const [showNewPqrModal, setShowNewPqrModal] = useState(false);
  const [newPqrForm, setNewPqrForm] = useState({
    unit: '',
    applicant: '',
    category: 'Convivencia / Ruidos',
    desc: ''
  });
  const [respondingTicket, setRespondingTicket] = useState<PqrsdTicketItem | null>(null);
  const [responseText, setResponseText] = useState('');

  // 4. ESTADO DE CONTRATISTAS Y SEGURIDAD SOCIAL
  const [contractors, setContractors] = useState<ContractorSummaryItem[]>([]);
  const [showNewContractorModal, setShowNewContractorModal] = useState(false);
  const [newContractorForm, setNewContractorForm] = useState({
    name: '',
    specialty: 'Plomería / Redes',
    arl: 'SURA Riesgo V',
    validUntil: '2026-12-31',
    phone: ''
  });

  // 5. ESTADO DE ACTAS CON LEY 675
  const [actas, setActas] = useState<ActaLegalItem[]>([]);

  const handleTenantChange = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    if (onSelectTenant) {
      onSelectTenant(tenantId);
    }
    const found = tenants.find(t => t.id === tenantId);
    if (found) {
      notify(`Copropiedad activa cambiada a: ${found.name}`);
    }
  };

  const handleHierarchyRoleChange = (newRole: HierarchyRole) => {
    setHierarchyRole(newRole);
    if (newRole !== 'supervisor') {
      setIsReemplazoActivo(false);
    } else {
      setActiveTab('ops');
    }
    const labels: Record<HierarchyRole, string> = {
      superadmin: 'Superadministrador (Gerencia de la Firma)',
      administrador: 'Administrador Titular (Representante Legal)',
      supervisor: 'Supervisor de Operaciones (Auditoría en Sitio)'
    };
    notify(`Jerarquía activa cambiada a: ${labels[newRole]}`);
  };

  const handleToggleReemplazo = (nextActive: boolean) => {
    setIsReemplazoActivo(nextActive);
    if (nextActive) {
      notify(`Modo Relevo ACTIVO: Ahora actúas con las facultades del Administrador Titular en ${activeTenant.name}.`);
    } else {
      notify('Modo Relevo desactivado: Retornando a vista de Supervisor de Operaciones.');
    }
  };

  const handleReconcileVoucher = (voucher: PaymentVoucherItem) => {
    setUnidadesShared(prev => {
      const exists = prev.some(u => u.numero_unidad.toLowerCase() === voucher.unit.toLowerCase());
      if (!exists) {
        return [
          {
            id: Date.now(),
            numero_unidad: voucher.unit,
            propietario: voucher.resident,
            documento_nit: 'CC Verificado',
            telefono_whatsapp: '300 000 0000',
            email: 'residente@ph.co',
            coeficiente: 1.0,
            cuota_base: voucher.amount,
            capital_vencido: 0,
            intereses_mora: 0,
            costos_prejuridicos: 0,
            saldo_actual: 0,
            estado_cartera: 'Al día'
          },
          ...prev
        ];
      }
      return prev.map(u => {
        if (u.numero_unidad.toLowerCase() === voucher.unit.toLowerCase()) {
          const nextSaldo = Math.max(0, u.saldo_actual - voucher.amount);
          return {
            ...u,
            saldo_actual: nextSaldo,
            estado_cartera: nextSaldo === 0 ? 'Al día' : 'Mora 30'
          };
        }
        return u;
      });
    });
    notify(`Comprobante de ${voucher.unit} (${voucher.resident}) conciliado correctamente en Cartera Ley 675.`);
  };

  const toggleChecklistItem = (id: string) => {
    const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    setSupervisorChecklist(prev =>
      prev.map(c =>
        c.id === id ? { ...c, done: !c.done, time: !c.done ? now : 'Pendiente' } : c
      )
    );
  };

  // ==========================================================================
  // GENERADOR OFICIAL DE PAZ Y SALVO EN PDF / IMPRESIÓN (ART. 29 LEY 675)
  // ==========================================================================
  const generatePazYSalvo = (item: BalanceItem) => {
    if (!hasLegalAdminPowers) {
      notify('Acción restringida: como Supervisor Operativo debes activar el botón "Activar Reemplazo del Administrador" para expedir Paz y Salvos Notariales.');
      return;
    }

    if (item.debt > 0) {
      notify(`No se puede expedir Paz y Salvo. El ${item.unit} presenta un saldo en mora de $${item.debt.toLocaleString('es-CO')} COP.`);
      return;
    }

    const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const codeVerif = `PYS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const signerTitle =
      hierarchyRole === 'supervisor' && isReemplazoActivo
        ? 'ADMINISTRADOR(A) EN ENCARGO (SUPLENCIA DELEGADA / RELEVO)'
        : hierarchyRole === 'superadmin'
        ? 'GERENCIA GENERAL • FIRMA ADMINISTRADORA URBIX PH'
        : 'ADMINISTRADOR(A) TITULAR Y REPRESENTANTE LEGAL';

    const docHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Certificado de Paz y Salvo - ${item.unit}</title>
        <style>
          @page { size: letter; margin: 3cm 2.5cm; }
          body { font-family: 'Georgia', serif; color: #0f172a; line-height: 1.8; font-size: 11pt; padding: 20px; background: #ffffff; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 16pt; text-transform: uppercase; }
          .header p { margin: 3px 0 0; font-size: 10pt; color: #475569; }
          .title { text-align: center; font-size: 14pt; font-weight: bold; margin: 40px 0 30px; letter-spacing: 1px; text-transform: uppercase; }
          .body-text { text-align: justify; margin-bottom: 30px; }
          .highlight { font-weight: bold; color: #0f172a; }
          .signatures { margin-top: 80px; display: flex; justify-content: space-between; }
          .sig-box { width: 45%; border-top: 1.5px solid #0f172a; text-align: center; padding-top: 8px; font-size: 10pt; }
          .footer { margin-top: 60px; font-size: 8pt; color: #64748b; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
          .btn-print { background: #10b981; color: #022c22; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 20px; }
          @media print { .btn-print { display: none; } }
        </style>
      </head>
      <body>
        <button class="btn-print" onclick="window.print()">Guardar como PDF / Imprimir</button>
        <div class="header">
          <h1>${activeTenant.name}</h1>
          <p>NIT: ${activeTenant.nit} • ${activeTenant.zone} (${activeTenant.city})</p>
          <p>Personería Jurídica Registrada - Régimen de Propiedad Horizontal Ley 675 de 2001</p>
        </div>

        <div class="title">Certificado Oficial de Paz y Salvo</div>

        <div class="body-text">
          La Administración de <span class="highlight">${activeTenant.name}</span>, legalmente constituida según las disposiciones de la Ley 675 de 2001,
          <br/><br/>
          <strong>HACE CONSTAR QUE:</strong>
          <br/><br/>
          El inmueble distinguido como <span class="highlight">${item.unit}</span>, de propiedad de <span class="highlight">${item.owner}</span>, 
          identificado(a) con cédula de ciudadanía No. <span class="highlight">${item.doc}</span>, se encuentra a la fecha 
          <strong>TOTALMENTE A PAZ Y SALVO</strong> por concepto de expensas comunes ordinarias, extraordinarias, intereses moratorios y sanciones de convivencia.
          <br/><br/>
          El presente certificado se expide a solicitud de la parte interesada en ${activeTenant.city}, a los <strong>${fechaHoy}</strong>, con una validez legal de treinta (30) días calendario contados a partir de su emisión, para los fines notariales, comerciales y de registro a que haya lugar.
        </div>

        <div class="signatures">
          <div class="sig-box">
            <strong>${signerTitle}</strong><br/>
            ${activeTenant.name}<br/>
            C.C. ________________________
          </div>
          <div class="sig-box">
            <strong>REVISORÍA FISCAL / CONTROL</strong><br/>
            Firma Gestora Urbix PH<br/>
            T.P. ________________________
          </div>
        </div>

        <div class="footer">
          Código de Verificación Notarial: <strong>${codeVerif}</strong> • Certificado auditado digitalmente bajo el Régimen de Propiedad Horizontal Ley 675 de 2001.
        </div>
      </body>
      </html>
    `;

    setLegalDocPreview({
      title: `Certificado Oficial de Paz y Salvo - ${item.unit}`,
      subtitle: `${activeTenant.name} • Código ${codeVerif}`,
      htmlContent: docHtml
    });
    notify(`Paz y Salvo Notarial (${codeVerif}) generado para ${item.unit} - ${item.owner}.`);
  };

  // ==========================================================================
  // EXPORTADOR FORMAL DE ACTAS A PDF (LEY 675)
  // ==========================================================================
  const exportActaPDF = (acta: ActaLegalItem) => {
    const docHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${acta.number} - ${activeTenant.name}</title>
        <style>
          @page { size: letter; margin: 2.5cm 2cm; }
          body { font-family: 'Georgia', serif; color: #0f172a; line-height: 1.7; font-size: 11pt; padding: 20px; background: #ffffff; }
          .header { border: 1.5px solid #0f172a; padding: 14px; text-align: center; margin-bottom: 25px; }
          .header h2 { margin: 0; font-size: 14pt; text-transform: uppercase; }
          .table-meta { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 10pt; }
          .table-meta td { border: 1px solid #cbd5e1; padding: 8px 12px; }
          .label { background: #f8fafc; font-weight: bold; width: 25%; }
          .btn-print { background: #10b981; color: #022c22; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 20px; }
          @media print { .btn-print { display: none; } }
        </style>
      </head>
      <body>
        <button class="btn-print" onclick="window.print()">Descargar como PDF</button>
        <div class="header">
          <h2>${activeTenant.name}</h2>
          <p style="margin:2px 0 0; font-size:10pt;">NIT: ${activeTenant.nit} • ${acta.number}</p>
          <p style="margin:0; font-size:9pt; color:#475569;">Libro Oficial de Actas - Ley 675 de 2001</p>
        </div>

        <table class="table-meta">
          <tr><td class="label">Reunión</td><td>${acta.type}</td><td class="label">Quórum</td><td>${acta.quorum}</td></tr>
          <tr><td class="label">Fecha</td><td>${acta.date}</td><td class="label">Estado</td><td>${acta.status}</td></tr>
          <tr><td class="label">Presidente</td><td>${acta.president}</td><td class="label">Secretario</td><td>${acta.secretary}</td></tr>
        </table>

        <h3 style="text-transform:uppercase; border-bottom:1px solid #0f172a; padding-bottom:4px;">I. Deliberaciones y Acuerdos Principales</h3>
        <p style="text-align:justify;">${acta.summary}</p>

        <div style="margin-top:80px; display:flex; justify-content:space-between;">
          <div style="width:45%; border-top:1.5px solid #0f172a; text-align:center; padding-top:8px;">
            <strong>${acta.president}</strong><br/>Presidente de Sesión
          </div>
          <div style="width:45%; border-top:1.5px solid #0f172a; text-align:center; padding-top:8px;">
            <strong>${acta.secretary}</strong><br/>Secretario(a) / Administrador
          </div>
        </div>
      </body>
      </html>
    `;

    setLegalDocPreview({
      title: `${acta.number} - ${acta.type}`,
      subtitle: `${activeTenant.name} • Libro Oficial de Actas Ley 675`,
      htmlContent: docHtml
    });
    notify(`Acta oficial ${acta.number} preparada para exportación PDF.`);
  };



  const handleCreatePqr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPqrForm.unit.trim() || !newPqrForm.applicant.trim() || !newPqrForm.desc.trim()) return;
    const nextNum = `PQR-2026-0${34 + tickets.length}`;
    const newItem: PqrsdTicketItem = {
      id: `t-${Date.now()}`,
      number: nextNum,
      unit: newPqrForm.unit.trim(),
      applicant: newPqrForm.applicant.trim(),
      category: newPqrForm.category,
      desc: newPqrForm.desc.trim(),
      deadline: '2026-11-18',
      daysLeft: 15,
      status: 'Radicado'
    };
    setTickets([newItem, ...tickets]);
    setNewPqrForm({ unit: '', applicant: '', category: 'Convivencia / Ruidos', desc: '' });
    setShowNewPqrModal(false);
    notify(`Solicitud ${nextNum} radicada exitosamente con término legal de 15 días hábiles.`);
  };

  const handleRemitirConvivencia = (ticket: PqrsdTicketItem) => {
    setTickets(prev =>
      prev.map(t => (t.id === ticket.id ? { ...t, status: 'Remitido a Comité' } : t))
    );
    notify(`El caso ${ticket.number} ha sido remitido formalmente con citación al Comité de Convivencia.`);
  };

  const handleConfirmResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingTicket || !responseText.trim()) return;
    setTickets(prev =>
      prev.map(t =>
        t.id === respondingTicket.id
          ? { ...t, status: 'Respondido Oficialmente', officialResponse: responseText.trim() }
          : t
      )
    );
    notify(`Respuesta oficial enviada a ${respondingTicket.applicant} (${respondingTicket.number}).`);
    setRespondingTicket(null);
    setResponseText('');
  };

  const handleCreateContractor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractorForm.name.trim()) return;
    const newItem: ContractorSummaryItem = {
      id: `c-${Date.now()}`,
      name: newContractorForm.name.trim(),
      specialty: newContractorForm.specialty,
      arl: newContractorForm.arl,
      validUntil: newContractorForm.validUntil,
      active: true,
      phone: newContractorForm.phone.trim() || '300 000 0000'
    };
    setContractors([newItem, ...contractors]);
    setNewContractorForm({
      name: '',
      specialty: 'Plomería / Redes',
      arl: 'SURA Riesgo V',
      validUntil: '2026-12-31',
      phone: ''
    });
    setShowNewContractorModal(false);
    notify(`Proveedor ${newItem.name} registrado con planilla ARL verificada.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col rounded-3xl border border-slate-800 overflow-hidden">
      
      {/* ====================================================================
          ENCABEZADO DE JERARQUÍA CORPORATIVA (3 RANGOS + MODO RELEVO)
         ==================================================================== */}
      <div className="sticky top-0 z-40">
        <AdminHeaderWithHierarchy
          currentTenant={activeTenant}
          tenants={tenants}
          onTenantChange={handleTenantChange}
          currentUserRole={hierarchyRole}
          onRoleChange={handleHierarchyRoleChange}
          isReemplazoActivo={isReemplazoActivo}
          onToggleReemplazo={handleToggleReemplazo}
          onLogout={onLogout}
        />

        {/* PESTAÑAS DE NAVEGACIÓN OPERATIVA */}
        <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('ops')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'ops' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" /> Supervisión & Conciliaciones
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cartera')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'cartera' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4" /> 4. Cartera Ley
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pqrsd')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'pqrsd' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> PQRSD & Convivencia
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contractors')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'contractors' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardHat className="w-4 h-4" /> Contratistas & ARL
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('actas')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'actas' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" /> Actas con IA (Ley 675)
            </button>
          </nav>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Facultad Legal Ley 675:</span>
            {hasLegalAdminPowers ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                {hierarchyRole === 'supervisor' && isReemplazoActivo
                  ? 'Habilitada por Modo Relevo'
                  : 'Representación Legal Plena'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                <UserCheck className="w-3.5 h-3.5" />
                Auditoría en Sitio (Sin Firma Notarial)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notificación flotante de acciones */}
      {localBanner && (
        <div className="mx-6 mt-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {localBanner}
          </span>
          <button onClick={() => setLocalBanner(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ====================================================================
          CUERPO PRINCIPAL DINÁMICO
         ==================================================================== */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* PANEL CONTEXTUAL SEGÚN EL RANGO EN LA JERARQUÍA */}
        {hierarchyRole === 'superadmin' && (
          <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 p-5 rounded-3xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  <Crown className="w-3.5 h-3.5 text-purple-400" /> Nivel 1 • Superadministrador (Gerencia de la Firma)
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  Gobierno Corporativo y Cadena de Mando Multi-Copropiedad
                </h3>
                <p className="text-xs text-slate-400">
                  Supervisión global de Administradores Titulares, Supervisores Operativos y relevos delegados en {tenants.length} copropiedades.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="bg-slate-950/90 border border-slate-800 px-3.5 py-2 rounded-2xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Unidades Bajo Gestión</span>
                  <span className="text-sm font-black text-white">224 Inmuebles</span>
                </div>
                <div className="bg-slate-950/90 border border-slate-800 px-3.5 py-2 rounded-2xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Cumplimiento SG-SST</span>
                  <span className="text-sm font-black text-emerald-400">100% Auditado</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {hierarchyRole === 'supervisor' && (
          <div className={`p-5 rounded-3xl border space-y-4 transition ${
            isReemplazoActivo
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-amber-950/15 border-amber-500/30'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isReemplazoActivo
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  <UserCheck className="w-3.5 h-3.5" />
                  {isReemplazoActivo
                    ? 'Nivel 3 en Suplencia • Supervisor Actuando como Administrador Titular'
                    : 'Nivel 3 • Supervisor de Operaciones (Auditoría en Sitio)'}
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  Bitácora de Supervisión en Sitio — {activeTenant.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {isReemplazoActivo
                    ? 'Modo Relevo ACTIVO: Tienes habilitada la firma de Paz y Salvos Notariales, respuesta oficial de PQRSD y autorización de contratistas.'
                    : 'Modo Auditoría Operativa: Verifica el checklist técnico de la copropiedad. Si el Administrador Titular está ausente, activa el Modo Relevo en la barra superior.'}
                </p>
              </div>

              {!isReemplazoActivo && (
                <button
                  type="button"
                  onClick={() => handleToggleReemplazo(true)}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" /> Activar Modo Relevo Ahora
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {supervisorChecklist.map((chk) => (
                <button
                  key={chk.id}
                  type="button"
                  onClick={() => toggleChecklistItem(chk.id)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                    chk.done
                      ? 'bg-slate-900/90 border-emerald-500/30 text-slate-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                      chk.done ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold leading-snug">{chk.item}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                    chk.done ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-amber-400'
                  }`}>
                    {chk.time}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 0: CENTRO DE MANDO OPERATIVO Y CONCILIACIONES (SUPERVISOR OPS HUB)
           ================================================================== */}
        {activeTab === 'ops' && (
          <SupervisorOpsHub
            tenantName={activeTenant.name}
            onReconcilePayment={handleReconcileVoucher}
            onNotify={notify}
          />
        )}

        {/* ==================================================================
            PESTAÑA 1: CARTERA, COBROS Y EMISIÓN DE PAZ Y SALVOS
           ================================================================== */}
        {activeTab === 'cartera' && (
          <PanelAdministradorModulo3
            appendAuditLog={appendAuditLogShared}
            auditLogs={auditLogsShared}
            unidadesExternal={unidadesShared}
            setUnidadesExternal={setUnidadesShared}
            recaudosExternal={recaudosShared}
            setRecaudosExternal={setRecaudosShared}
            egresosExternal={egresosShared}
            setEgresosExternal={setEgresosShared}
            personalExternal={personalShared}
            setPersonalExternal={setPersonalShared}
            ordenesExternal={ordenesShared}
            setOrdenesExternal={setOrdenesShared}
            sancionesExternal={sancionesShared}
            setSancionesExternal={setSancionesShared}
            cajaMenorExternal={cajaMenorShared}
            setCajaMenorExternal={setCajaMenorShared}
            equiposCriticosExternal={equiposCriticosShared}
            setEquiposCriticosExternal={setEquiposCriticosShared}
            reformasMudanzasExternal={reformasMudanzasShared}
            setReformasMudanzasExternal={setReformasMudanzasShared}
            inventarioBodegaExternal={inventarioBodegaShared}
            setInventarioBodegaExternal={setInventarioBodegaShared}
            initialSubTab="tab3_1"
          />
        )}

        {/* ==================================================================
            PESTAÑA 2: PQRSD Y COMITÉ DE CONVIVENCIA (ART. 58 LEY 675)
           ================================================================== */}
        {activeTab === 'pqrsd' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                  Ley 1755 • Art. 58 Ley 675
                </span>
                <h2 className="text-xl font-black text-white mt-1">Buzón de PQRSD y Conflictos de Convivencia</h2>
                <p className="text-xs text-slate-400">Control de términos legales de respuesta y escalamiento formal al Comité de Convivencia.</p>
              </div>

              <button 
                onClick={() => setShowNewPqrModal(true)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Radicar Nueva PQRSD
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {tickets.map((t) => (
                <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {t.number}
                      </span>
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {t.category}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {t.unit} • {t.applicant}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {t.desc}
                    </p>

                    {t.officialResponse && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-xs text-emerald-300">
                        <strong>Respuesta Administrativa Motivada:</strong> {t.officialResponse}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1 text-rose-400 font-bold">
                        <Clock className="w-3.5 h-3.5" /> Término legal: {t.daysLeft} días hábiles restantes ({t.deadline})
                      </span>
                      <span>Estado: <strong className="text-white">{t.status}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRemitirConvivencia(t)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5 text-amber-400" /> Remitir a Convivencia
                    </button>
                    <button
                      onClick={() => {
                        setRespondingTicket(t);
                        setResponseText(t.officialResponse || '');
                      }}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition shadow cursor-pointer"
                    >
                      Responder PQRSD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 3: CONTRATISTAS Y SEGURIDAD SOCIAL (SG-SST)
           ================================================================== */}
        {activeTab === 'contractors' && (
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    Decreto 1072 (SG-SST)
                  </span>
                  <h2 className="text-xl font-black text-white mt-1">Contratistas Externos y Semáforo de ARL</h2>
                  <p className="text-xs text-slate-400">Plomería, obra civil, ascensores y blindaje contra accidentes laborales.</p>
                </div>

                <button 
                  onClick={() => setShowNewContractorModal(true)}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Registrar Proveedor
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contractors.map((c) => (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950 text-emerald-400 border border-slate-800">
                        {c.specialty}
                      </span>
                      <h3 className="text-base font-black text-white mt-2">{c.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">📞 {c.phone} • {c.arl}</p>
                    </div>

                    <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                      c.active 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    }`}>
                      <div>
                        <p className="font-bold">{c.active ? '✓ ARL Vigente (Autorizado)' : '⚠️ Planilla ARL Vencida'}</p>
                        <p className="text-[10px] opacity-80">Vence: {c.validUntil}</p>
                      </div>
                      {c.active ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submódulo completo de Órdenes de Trabajo y Control SG-SST */}
            <div className="pt-4 border-t border-slate-800/80">
              <ContractorsModule tenantName={activeTenant.name} />
            </div>
          </div>
        )}

        {/* ==================================================================
            PESTAÑA 4: ACTAS Y REUNIONES CON IA (LEY 675)
           ================================================================== */}
        {activeTab === 'actas' && (
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Art. 47 y 51 • Ley 675
                  </span>
                  <h2 className="text-xl font-black text-white mt-1">Libro Oficial de Actas y Reuniones de Consejo</h2>
                  <p className="text-xs text-slate-400">Transcripción automática con Google Gemini, soporte multijornada y exportación legal.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {actas.map((acta) => (
                  <div key={acta.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {acta.number}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {acta.type}
                        </span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold">
                          {acta.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 pt-1">{acta.summary}</p>
                      <p className="text-[11px] text-slate-400">
                        📅 {acta.date} • Quórum: {acta.quorum} • Pte: {acta.president} • Srio: {acta.secretary}
                      </p>
                    </div>

                    <button
                      onClick={() => exportActaPDF(acta)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Exportar Acta Legal (PDF)
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Grabadora Multijornada y Generador de Actas con IA */}
            <div className="pt-4 border-t border-slate-800/80">
              <MeetingMinutesModule
                tenantId={activeTenant.id}
                tenantName={activeTenant.name}
              />
            </div>
          </div>
        )}

      </main>

      {/* ====================================================================
          MODAL: PREVISUALIZACIÓN E IMPRESIÓN DE DOCUMENTO LEGAL (PAZ Y SALVO / ACTA)
         ==================================================================== */}
      {legalDocPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="text-sm font-black text-white">{legalDocPreview.title}</h3>
                <p className="text-xs text-slate-400">{legalDocPreview.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const iframe = document.getElementById('legal-doc-iframe') as HTMLIFrameElement | null;
                    if (iframe?.contentWindow) {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                    }
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Guardar como PDF / Imprimir
                </button>
                <button
                  onClick={() => setLegalDocPreview(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-200 p-4 overflow-y-auto">
              <iframe
                id="legal-doc-iframe"
                title={legalDocPreview.title}
                srcDoc={legalDocPreview.htmlContent}
                className="w-full h-[650px] bg-white rounded-xl shadow-inner border border-slate-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: RADICAR NUEVA PQRSD
         ==================================================================== */}
      {showNewPqrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Radicar Nueva PQRSD (Ley 1755)</h3>
              <button onClick={() => setShowNewPqrModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePqr} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Inmueble / Unidad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Apto 602"
                    value={newPqrForm.unit}
                    onChange={e => setNewPqrForm({ ...newPqrForm, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Solicitante</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del residente"
                    value={newPqrForm.applicant}
                    onChange={e => setNewPqrForm({ ...newPqrForm, applicant: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Categoría</label>
                <select
                  value={newPqrForm.category}
                  onChange={e => setNewPqrForm({ ...newPqrForm, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Convivencia / Ruidos">Convivencia / Ruidos</option>
                  <option value="Mantenimiento / Locativo">Mantenimiento / Locativo</option>
                  <option value="Financiero / Recaudo">Financiero / Recaudo</option>
                  <option value="Seguridad / Portería">Seguridad / Portería</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Descripción de los Hechos</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalle de la petición, queja o reclamo..."
                  value={newPqrForm.desc}
                  onChange={e => setNewPqrForm({ ...newPqrForm, desc: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPqrModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl"
                >
                  Generar Radicado Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: RESPONDER PQRSD OFICIALMENTE
         ==================================================================== */}
      {respondingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Responder {respondingTicket.number}</h3>
                <p className="text-xs text-slate-400">{respondingTicket.unit} • {respondingTicket.applicant}</p>
              </div>
              <button onClick={() => setRespondingTicket(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmResponse} className="space-y-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-300">
                {respondingTicket.desc}
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Respuesta Administrativa Motivada (Ley 1755)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escriba la decisión o actuación oficial de la administración..."
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRespondingTicket(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl"
                >
                  Notificar Respuesta Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: REGISTRAR NUEVO PROVEEDOR CON PLANILLA ARL
         ==================================================================== */}
      {showNewContractorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Registrar Proveedor (SG-SST Decreto 1072)</h3>
              <button onClick={() => setShowNewContractorModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateContractor} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Razón Social o Contratista</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ascensores Andinos S.A.S."
                  value={newContractorForm.name}
                  onChange={e => setNewContractorForm({ ...newContractorForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Especialidad</label>
                  <input
                    type="text"
                    required
                    value={newContractorForm.specialty}
                    onChange={e => setNewContractorForm({ ...newContractorForm, specialty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Teléfono</label>
                  <input
                    type="text"
                    required
                    placeholder="300 000 0000"
                    value={newContractorForm.phone}
                    onChange={e => setNewContractorForm({ ...newContractorForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Entidad y Nivel ARL</label>
                  <input
                    type="text"
                    required
                    value={newContractorForm.arl}
                    onChange={e => setNewContractorForm({ ...newContractorForm, arl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Vencimiento Planilla PILA</label>
                  <input
                    type="date"
                    required
                    value={newContractorForm.validUntil}
                    onChange={e => setNewContractorForm({ ...newContractorForm, validUntil: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewContractorModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-black rounded-xl"
                >
                  Guardar y Habilitar ARL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
