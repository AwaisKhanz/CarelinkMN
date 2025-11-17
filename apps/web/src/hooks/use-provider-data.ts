/**
 * Provider data hooks
 * Hooks for accessing provider data from context
 */

import { useMemo } from "react";
import { useProvider } from "@/contexts/provider-context";
import { Provider } from "@/lib/api";
import { isValidProvider } from "@/lib/utils/provider";

/**
 * Hook to get provider data from context
 * Throws error if used outside ProviderProvider
 */
export function useProviderData() {
  const { provider, isLoading, error, refetch, organizationName } = useProvider();
  return { provider, isLoading, error, refetch, organizationName };
}

/**
 * Hook to get provider ID from context
 * Returns null if provider is not loaded or invalid
 */
export function useProviderId(): string | null {
  const { provider, isLoading } = useProvider();
  
  return useMemo(() => {
    if (isLoading || !provider) {
      return null;
    }
    
    if (!isValidProvider(provider)) {
      return null;
    }
    
    return provider.id;
  }, [provider, isLoading]);
}

/**
 * Hook to get provider data with guard
 * Ensures provider exists before returning data
 * Useful for pages that require provider to be loaded
 */
export function useProviderWithGuard(): {
  provider: Provider;
  providerId: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { provider, isLoading, error, refetch } = useProvider();
  
  const providerId = useProviderId();
  
  if (isLoading) {
    return {
      provider: provider as Provider,
      providerId: providerId || "",
      isLoading: true,
      error: null,
      refetch,
    };
  }
  
  if (error || !provider || !providerId) {
    return {
      provider: provider as Provider,
      providerId: providerId || "",
      isLoading: false,
      error: error || "Provider not found",
      refetch,
    };
  }
  
  return {
    provider,
    providerId,
    isLoading: false,
    error: null,
    refetch,
  };
}

