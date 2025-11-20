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
    throw new Error("usePageMetadata must be used within VRSDashboardLayout");
  }
  return context;
}

export function PageMetadataProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("VRS Specialist Dashboard");
  const [description, setDescription] = useState(
    "Manage clients, employers, and placements"
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

