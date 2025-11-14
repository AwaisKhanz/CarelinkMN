"use client";

import { useState, useEffect, useCallback } from "react";
import { OpeningFormFields } from "@/components/forms/opening-form";

export interface OpeningTemplate {
  id: string;
  name: string;
  createdAt: string;
  data: Omit<OpeningFormFields, "homeId" | "availableFrom" | "availableUntil">;
}

const STORAGE_KEY = "carelink_opening_templates";

export function useOpeningTemplates() {
  const [templates, setTemplates] = useState<OpeningTemplate[]>([]);

  // Load templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTemplates(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading opening templates:", error);
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((newTemplates: OpeningTemplate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error("Error saving opening templates:", error);
      throw new Error("Failed to save template");
    }
  }, []);

  // Save a new template
  const saveTemplate = useCallback(
    (name: string, data: Omit<OpeningFormFields, "homeId" | "availableFrom" | "availableUntil">) => {
      const newTemplate: OpeningTemplate = {
        id: Math.random().toString(36).substring(7),
        name,
        createdAt: new Date().toISOString(),
        data,
      };
      const updated = [...templates, newTemplate];
      saveTemplates(updated);
      return newTemplate;
    },
    [templates, saveTemplates]
  );

  // Delete a template
  const deleteTemplate = useCallback(
    (id: string) => {
      const updated = templates.filter((t) => t.id !== id);
      saveTemplates(updated);
    },
    [templates, saveTemplates]
  );

  // Get a template by ID
  const getTemplate = useCallback(
    (id: string) => {
      return templates.find((t) => t.id === id);
    },
    [templates]
  );

  return {
    templates,
    saveTemplate,
    deleteTemplate,
    getTemplate,
  };
}

