# Plan de Implementación: Módulo de Activos y Mantenimiento Predictivo (ALM) & Directorio Oficial de Portería

## Objetivo
Desarrollar un sistema de gestión operativa y de activos críticos (Ley 675, Art. 15) que garantice el cumplimiento del mantenimiento preventivo, reduce riesgos legales y optimiza la operación de las copropiedades.

## Hito Completado: Directorio Oficial de Copropietarios (100 Unidades Tricentenario)
- **Consulta Real en Supabase**:
  - Obtención del usuario logueado (`Andrés Vesga`) y su `tenant_id` en `profiles`.
  - Carga completa de la tabla `units` vinculada a `urb Tricentenario` (`id`, `tower`, `apartment`, `owner_name`, `owner_phone`).
- **Módulo 8 en Consola Unificada de Portería**:
  - Directorio visual con buscador reactivo por apartamento, torre, nombre y teléfono.
  - Llamadas directas con un toque al Citófono WebRTC y enlace telefónico `tel:`.
- **Integración con Citófono Virtual**:
  - Inyección de las 100 unidades en el discador rápido con buscador integrado.

## Próximos Hitos Técnicos (ALM)
1. **Definición de Esquema (Supabase)**:
   - Tabla `activos_criticos`: `id`, `tenant_id`, `nombre`, `tipo`, `frecuencia_mantenimiento`, `proximo_vencimiento`, `estado`, `proveedor_id`.
2. **Componentes React (Tailwind)**:
   - `AssetManagementDashboard.tsx`, `MaintenanceCalendar.tsx`, `AssetForm.tsx`.
3. **Lógica de Negocio y Auditoría SHA-256**:
   - Alertas preventivas y sincronización financiera.
