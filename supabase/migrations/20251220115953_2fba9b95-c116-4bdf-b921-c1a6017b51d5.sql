-- ==============================================
-- PARTE 1: Criar tabela de Tenants (Empresas)
-- ==============================================

-- Tabela de empresas/tenants
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- identificador único da empresa (ex: minha-empresa)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- dono da empresa
  active BOOLEAN DEFAULT true,
  plan TEXT DEFAULT 'trial', -- trial, basic, premium, etc.
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '15 days')
);

-- Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Adicionar tenant_id na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- ==============================================
-- PARTE 2: Função para obter tenant_id do usuário atual
-- ==============================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Função para verificar se usuário pertence a um tenant específico
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND tenant_id = _tenant_id
  )
$$;

-- Função para verificar se usuário é owner do tenant
CREATE OR REPLACE FUNCTION public.is_tenant_owner(_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants 
    WHERE id = _tenant_id 
    AND owner_id = auth.uid()
  )
$$;

-- ==============================================
-- PARTE 3: Políticas RLS para tenants
-- ==============================================

-- Qualquer autenticado pode ver seu próprio tenant
CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT
USING (
  id = get_user_tenant_id() OR owner_id = auth.uid()
);

-- Apenas owners podem atualizar seu tenant
CREATE POLICY "Owners can update their tenant"
ON public.tenants FOR UPDATE
USING (owner_id = auth.uid());

-- Autenticados podem criar tenant (para signup de novas empresas)
CREATE POLICY "Authenticated users can create tenants"
ON public.tenants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ==============================================
-- PARTE 4: Atualizar função handle_new_user para criar tenant
-- ==============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
DECLARE
  new_tenant_id UUID;
  existing_tenant_id UUID;
  invite_tenant_id UUID;
BEGIN
  -- Verificar se foi convidado para um tenant existente (via metadata)
  invite_tenant_id := (NEW.raw_user_meta_data ->> 'tenant_id')::UUID;
  
  IF invite_tenant_id IS NOT NULL THEN
    -- Usuário foi convidado para um tenant existente
    INSERT INTO public.profiles (id, name, email, tenant_id)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
      NEW.email,
      invite_tenant_id
    );
    
    -- Usuários convidados começam como sellers
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seller');
  ELSE
    -- Novo usuário criando nova empresa
    -- Criar tenant para o novo usuário
    INSERT INTO public.tenants (name, slug, owner_id)
    VALUES (
      COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Minha Empresa'),
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'empresa-' || LEFT(NEW.id::text, 8)), ' ', '-')),
      NEW.id
    )
    RETURNING id INTO new_tenant_id;
    
    -- Criar perfil vinculado ao tenant
    INSERT INTO public.profiles (id, name, email, tenant_id)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
      NEW.email,
      new_tenant_id
    );
    
    -- Owner do tenant é admin
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;

-- ==============================================
-- PARTE 5: Corrigir política de profiles (issue de segurança)
-- ==============================================

-- Remover política antiga que expõe emails
DROP POLICY IF EXISTS "Authenticated users can view profiles with role check" ON public.profiles;

-- Criar política mais restritiva
CREATE POLICY "Users can view profiles in their tenant"
ON public.profiles FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    id = auth.uid() OR -- próprio perfil
    (
      tenant_id = get_user_tenant_id() AND -- mesmo tenant
      (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
    )
  )
);