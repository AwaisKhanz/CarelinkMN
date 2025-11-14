"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface PageMetadataContextType {
  title: string;
  description: string;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
}

const PageMetadataContext = createContext<PageMetadataContextType | undefined>(
  undefined
);

export function usePageMetadata() {
  const context = useContext(PageMetadataContext);
  if (!context) {
    throw new Error("usePageMetadata must be used within CaseManagerLayout");
  }
  return context;
}

export function PageMetadataProvider({ children }: { children: ReactNode }) {
  const [title, setTitleState] = useState("Case Manager Dashboard");
  const [description, setDescriptionState] = useState(
    "Manage your referrals and placements"
  );

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
  }, []);

  const setDescription = useCallback((newDescription: string) => {
    setDescriptionState(newDescription);
  }, []);

  return (
    <PageMetadataContext.Provider
      value={{ title, description, setTitle, setDescription }}
    >
      {children}
    </PageMetadataContext.Provider>
  );
}

