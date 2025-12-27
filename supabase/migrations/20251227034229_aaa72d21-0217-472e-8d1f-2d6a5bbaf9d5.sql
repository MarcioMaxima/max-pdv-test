-- Create receivables table (Contas a Receber)
CREATE TABLE public.receivables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id),
  order_id text NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  customer_name text NOT NULL,
  description text NOT NULL,
  total_amount numeric NOT NULL,
  installment_number integer NOT NULL DEFAULT 1,
  total_installments integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamp with time zone,
  payment_method text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view receivables in their tenant"
ON public.receivables FOR SELECT
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create receivables in their tenant"
ON public.receivables FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins and managers can update receivables in their tenant"
ON public.receivables FOR UPDATE
USING (
  tenant_id = get_user_tenant_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Admins can delete receivables in their tenant"
ON public.receivables FOR DELETE
USING (
  tenant_id = get_user_tenant_id() AND 
  has_role(auth.uid(), 'admin'::app_role)
);