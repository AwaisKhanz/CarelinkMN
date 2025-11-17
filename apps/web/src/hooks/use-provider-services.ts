/**
 * Provider services hook
 * Manages services configuration and selection
 */

import { useState, useEffect, useCallback } from "react";
import { useProviderId } from "@/hooks/use-provider-data";
import { providerService, type Service } from "@/lib/api";
import type { ProviderServiceType } from "@/lib/api";

interface UseProviderServicesResult {
  // Current provider services
  currentServices: ProviderServiceType[];
  selectedServiceIds: string[];
  
  // Available services
  availableServices: Service[];
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  toggleService: (serviceId: string) => void;
  selectService: (serviceId: string) => void;
  deselectService: (serviceId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  saveServices: () => Promise<void>;
  
  // Helper methods
  isSelected: (serviceId: string) => boolean;
  hasChanges: () => boolean;
}

/**
 * Hook to manage provider services configuration
 */
export function useProviderServices(): UseProviderServicesResult {
  const providerId = useProviderId();
  const [currentServices, setCurrentServices] = useState<ProviderServiceType[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!providerId) {
      setCurrentServices([]);
      setSelectedServiceIds([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch both current and available services in parallel
      const [currentResponse, availableResponse] = await Promise.all([
        providerService.getProviderServices(providerId),
        providerService.getAvailableServices(providerId),
      ]);

      if (currentResponse.success && currentResponse.data) {
        const services = currentResponse.data;
        setCurrentServices(services);
        setSelectedServiceIds(services.map((ps: ProviderServiceType) => ps.serviceId));
      }

      if (availableResponse.success && availableResponse.data) {
        setAvailableServices(availableResponse.data);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch services";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const toggleService = useCallback((serviceId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  }, []);

  const selectService = useCallback((serviceId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) return prev;
      return [...prev, serviceId];
    });
  }, []);

  const deselectService = useCallback((serviceId: string) => {
    setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedServiceIds(availableServices.map((s) => s.id));
  }, [availableServices]);

  const deselectAll = useCallback(() => {
    setSelectedServiceIds([]);
  }, []);

  const isSelected = useCallback(
    (serviceId: string) => {
      return selectedServiceIds.includes(serviceId);
    },
    [selectedServiceIds]
  );

  const hasChanges = useCallback(() => {
    const currentIds = currentServices.map((ps) => ps.serviceId).sort();
    const selectedIds = [...selectedServiceIds].sort();
    return JSON.stringify(currentIds) !== JSON.stringify(selectedIds);
  }, [currentServices, selectedServiceIds]);

  const saveServices = useCallback(async () => {
    if (!providerId || !hasChanges()) return;

    try {
      setIsSaving(true);
      setError(null);

      await providerService.updateProviderServices(providerId, selectedServiceIds);
      
      // Refresh services after save
      await fetchServices();
    } catch (err) {
      console.error("Error saving services:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save services";
      setError(errorMessage);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [providerId, selectedServiceIds, hasChanges, fetchServices]);

  return {
    currentServices,
    selectedServiceIds,
    availableServices,
    isLoading,
    isSaving,
    error,
    refetch: fetchServices,
    toggleService,
    selectService,
    deselectService,
    selectAll,
    deselectAll,
    saveServices,
    isSelected,
    hasChanges,
  };
}
