# Plan de Implementación: Módulo de Activos y Mantenimiento Predictivo (ALM)

## Objetivo
Desarrollar un sistema de gestión de activos críticos (Ley 675, Art. 15) que garantice el cumplimiento del mantenimiento preventivo, reduce riesgos legales y optimiza el presupuesto anual de las copropiedades.

## Hitos Técnicos

1. **Definición de Esquema (Supabase)**:
   - Tabla `activos_criticos`: `id`, `tenant_id`, `nombre`, `tipo` (ascensor, rci, etc.), `frecuencia_mantenimiento`, `proximo_vencimiento`, `estado` (operativo, en mantenimiento, fuera de servicio), `proveedor_id`.

2. **Componentes React (Tailwind)**:
   - `AssetManagementDashboard.tsx`: Vista principal con tarjetas de estado (Semáforo).
   - `MaintenanceCalendar.tsx`: Calendario de próximas visitas técnicas.
   - `AssetForm.tsx`: Formulario de alta para nuevos equipos con validación de obligatoriedad de pólizas de seguros.

3. **Lógica de Negocio (Backend/App)**:
   - Job/Hook para verificar fechas de vencimiento: Disparar alerta automática al 'Broadcast Global' si un mantenimiento vence en < 7 días.
   - Integración con Módulo Financiero: Botón de "Registrar Gasto de Mantenimiento" que impacta directamente la caja menor del administrador.

4. **Blindaje**:
   - Todo registro de mantenimiento debe incluir una firma de auditoría en `SHA-256` inmutable.

## Feedback Solicitado
¿Consideras prioritaria la integración de la documentación de los contratistas (cargas de certificados de inspección) en esta primera fase del módulo de activos, o prefieres enfocarnos primero en la trazabilidad del calendario de visitas?
