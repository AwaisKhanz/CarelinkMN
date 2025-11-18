"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PageMetadataContextType {
  title: string;
  description: string;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
}

const PageMetadataContext = createContext<PageMetadataContextType | undefined>(
  undefined
);

export function PageMetadataProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("Hospital Social Work Dashboard");
  const [description, setDescription] = useState("Manage hospital discharge cases");

  return (
    <PageMetadataContext.Provider
      value={{
        title,
        description,
        setTitle,
        setDescription,
      }}
    >
      {children}
    </PageMetadataContext.Provider>
  );
}

export function usePageMetadata() {
  const context = useContext(PageMetadataContext);
  if (context === undefined) {
    throw new Error("usePageMetadata must be used within a PageMetadataProvider");
  }
  return context;
}

