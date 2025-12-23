-- Add commission fields to company_settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS uses_commission boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_percentage numeric DEFAULT 0;