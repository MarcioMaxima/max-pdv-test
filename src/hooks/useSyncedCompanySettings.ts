import { useMemo } from "react";
import { useCompanySettings } from "./useCompanySettings";
import { useStore } from "@/lib/store";
import { CompanySettings } from "@/lib/types";

/**
 * Hook that provides company settings synchronized across all devices.
 * Prioritizes Supabase (cloud) data, falls back to local storage.
 * Use this hook for any display or print functionality that needs consistent data.
 */
export function useSyncedCompanySettings() {
  const { settings: cloudSettings, isLoading, error, updateSettings, isUpdating } = useCompanySettings();
  const { companySettings: localSettings } = useStore();

  // Merge cloud and local settings, prioritizing cloud data
  const syncedSettings = useMemo((): CompanySettings => {
    // If cloud settings are available, use them as the source of truth
    if (cloudSettings) {
      return {
        id: cloudSettings.id,
        name: cloudSettings.name || localSettings.name || 'Minha Empresa',
        cnpj: cloudSettings.cnpj || localSettings.cnpj || '',
        address: cloudSettings.address || localSettings.address || '',
        phone: cloudSettings.phone || localSettings.phone || '',
        phone2: cloudSettings.phone2 || localSettings.phone2 || '',
        email: cloudSettings.email || localSettings.email || '',
        logoUrl: cloudSettings.logoUrl || localSettings.logoUrl,
        usesStock: cloudSettings.usesStock ?? localSettings.usesStock ?? true,
        lowStockThreshold: cloudSettings.lowStockThreshold ?? localSettings.lowStockThreshold ?? 10,
        printLogoOnReceipts: cloudSettings.printLogoOnReceipts ?? localSettings.printLogoOnReceipts ?? true,
        autoPrintOnSale: cloudSettings.autoPrintOnSale ?? localSettings.autoPrintOnSale ?? false,
        notifyLowStock: cloudSettings.notifyLowStock ?? localSettings.notifyLowStock ?? true,
        notifyNewSales: cloudSettings.notifyNewSales ?? localSettings.notifyNewSales ?? true,
        notifyPendingPayments: cloudSettings.notifyPendingPayments ?? localSettings.notifyPendingPayments ?? true,
        notifyOrderStatus: cloudSettings.notifyOrderStatus ?? localSettings.notifyOrderStatus ?? true,
        loginHeaderColor: cloudSettings.loginHeaderColor || localSettings.loginHeaderColor || '#ffffff',
        theme: localSettings.theme, // Theme is still local-only for now
      };
    }

    // Fallback to local settings
    return localSettings;
  }, [cloudSettings, localSettings]);

  return {
    settings: syncedSettings,
    isLoading,
    error,
    updateSettings,
    isUpdating,
    isCloudConnected: !!cloudSettings,
  };
}
