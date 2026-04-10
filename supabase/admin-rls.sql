-- ============================================================
-- RLS para admin_users
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Asegurarse de que la tabla existe
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "check_own_admin_status" ON admin_users;
DROP POLICY IF EXISTS "admins_read_all" ON admin_users;
DROP POLICY IF EXISTS "no_direct_writes" ON admin_users;

-- 4. Los usuarios autenticados solo pueden leer su propia fila
--    (necesario para que el header sepa si es admin)
CREATE POLICY "check_own_admin_status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 5. Los admins pueden leer TODOS los registros
--    (necesario para la página de admin → gestión de usuarios)
--    Usamos SECURITY DEFINER para evitar recursión en RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid());
$$;

CREATE POLICY "admins_read_all"
  ON admin_users FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 6. Bloquear escrituras directas desde el cliente anon/authenticated
--    (INSERT/UPDATE/DELETE solo desde service role via API route)
CREATE POLICY "no_client_writes"
  ON admin_users FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- AGREGAR TU PRIMER ADMIN (reemplaza con tu UUID de auth.users)
-- Obtén tu UUID en: Supabase → Authentication → Users
-- ============================================================
-- INSERT INTO admin_users (id) VALUES ('tu-uuid-aqui');
