"use client";

import { ReactNode, createContext, useContext, useState, useCallback } from "react";

interface PageMetadataContextValue {
  title: string;
  description: string;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
}

const PageMetadataContext = createContext<PageMetadataContextValue | undefined>(
  undefined
);

export function usePageMetadata() {
  const context = useContext(PageMetadataContext);
  if (!context) {
    throw new Error("usePageMetadata must be used within VendorDashboardLayout");
  }
  return context;
}

export function PageMetadataProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("Vendor Dashboard");
  const [description, setDescription] = useState(
    "Manage your vendor profile, leads, and bookings"
  );

  const handleSetTitle = useCallback((value: string) => {
    setTitle(value);
  }, []);

  const handleSetDescription = useCallback((value: string) => {
    setDescription(value);
  }, []);

  return (
    <PageMetadataContext.Provider
      value={{
        title,
        description,
        setTitle: handleSetTitle,
        setDescription: handleSetDescription,
      }}
    >
      {children}
    </PageMetadataContext.Provider>
  );
}

