-- Create table for pending installments (parcelas a pagar)
CREATE TABLE public.pending_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  description TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  installment_number INTEGER NOT NULL,
  total_installments INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMP WITH TIME ZONE,
  category TEXT,
  notes TEXT,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pending_installments ENABLE ROW LEVEL SECURITY;

-- Create policies for admins and managers
CREATE POLICY "Admins and managers can manage installments in their tenant" 
ON public.pending_installments 
FOR ALL
USING ((tenant_id = get_user_tenant_id()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

CREATE POLICY "Admins and managers can view installments in their tenant" 
ON public.pending_installments 
FOR SELECT 
USING ((tenant_id = get_user_tenant_id()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

-- Create index for faster queries
CREATE INDEX idx_pending_installments_tenant ON public.pending_installments(tenant_id);
CREATE INDEX idx_pending_installments_due_date ON public.pending_installments(due_date);
CREATE INDEX idx_pending_installments_paid ON public.pending_installments(paid);