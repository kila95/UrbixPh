-- 1. Vincular la copropiedad con el ID del administrador responsable
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES auth.users(id);

-- 2. Asegurar RLS en la tabla de copropiedades (tenants)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin solo ve su propia copropiedad"
  ON public.tenants
  FOR ALL
  USING (
    -- El Master Owner ve todo, el Admin solo ve la copropiedad asignada a su UID
    auth.uid() = assigned_admin_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'master_owner'
    )
  );

-- 3. Aislamiento de inmuebles por tenant del administrador
ALTER TABLE public.inmuebles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inmuebles aislados por copropiedad autorizada"
  ON public.inmuebles
  FOR ALL
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants 
      WHERE assigned_admin_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'master_owner'
    )
  );
