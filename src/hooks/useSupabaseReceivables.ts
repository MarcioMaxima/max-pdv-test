import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";

export interface Receivable {
  id: string;
  tenant_id: string | null;
  order_id: string;
  customer_id: string | null;
  customer_name: string;
  description: string;
  total_amount: number;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateReceivableInput {
  order_id: string;
  customer_id?: string | null;
  customer_name: string;
  description: string;
  total_amount: number;
  installment_number?: number;
  total_installments?: number;
  amount: number;
  due_date: string;
  notes?: string;
}

export function useSupabaseReceivables() {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  const { data: receivables = [], isLoading, error } = useQuery({
    queryKey: ["receivables", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("receivables")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("due_date", { ascending: true });
      
      if (error) throw error;
      return data as Receivable[];
    },
    enabled: !!tenantId,
  });

  const addReceivableMutation = useMutation({
    mutationFn: async (input: CreateReceivableInput) => {
      if (!tenantId) throw new Error("Tenant not found");

      const { data, error } = await supabase
        .from("receivables")
        .insert({
          tenant_id: tenantId,
          order_id: input.order_id,
          customer_id: input.customer_id || null,
          customer_name: input.customer_name,
          description: input.description,
          total_amount: input.total_amount,
          installment_number: input.installment_number || 1,
          total_installments: input.total_installments || 1,
          amount: input.amount,
          due_date: input.due_date,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables", tenantId] });
    },
  });

  const addMultipleReceivablesMutation = useMutation({
    mutationFn: async (inputs: CreateReceivableInput[]) => {
      if (!tenantId) throw new Error("Tenant not found");
      if (inputs.length === 0) return [];

      const records = inputs.map(input => ({
        tenant_id: tenantId,
        order_id: input.order_id,
        customer_id: input.customer_id || null,
        customer_name: input.customer_name,
        description: input.description,
        total_amount: input.total_amount,
        installment_number: input.installment_number || 1,
        total_installments: input.total_installments || 1,
        amount: input.amount,
        due_date: input.due_date,
        notes: input.notes || null,
      }));

      const { data, error } = await supabase
        .from("receivables")
        .insert(records)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables", tenantId] });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: string; paymentMethod?: string }) => {
      const { data, error } = await supabase
        .from("receivables")
        .update({
          paid: true,
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables", tenantId] });
    },
  });

  const deleteReceivableMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("receivables")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables", tenantId] });
    },
  });

  return {
    receivables,
    isLoading,
    error,
    addReceivable: addReceivableMutation.mutateAsync,
    addMultipleReceivables: addMultipleReceivablesMutation.mutateAsync,
    markAsPaid: markAsPaidMutation.mutateAsync,
    deleteReceivable: deleteReceivableMutation.mutateAsync,
    isAdding: addReceivableMutation.isPending || addMultipleReceivablesMutation.isPending,
  };
}
