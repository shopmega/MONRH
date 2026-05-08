'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface PersonalData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  region?: string;
}

export interface EmploymentStatus {
  contractType?: 'CDI' | 'CDD' | 'internship' | 'freelance';
  companySize?: 'small' | 'medium' | 'large';
  sector?: string;
  companyName?: string;
  position?: string;
  startDate?: string;
  monthlySalary?: number;
}

export interface LegalContext {
  currentScenario?: 'planning' | 'dispute' | 'information' | 'termination';
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  legalReferences?: string[];
  previousComplaints?: boolean;
  legalConsultation?: boolean;
}

export interface JourneyEvent {
  id: string;
  type: 'simulation' | 'document' | 'navigation';
  timestamp: string;
  data: Record<string, unknown>;
  context?: string;
}

export interface UserPreferences {
  language: 'fr' | 'ar';
  theme: 'light' | 'dark';
  notifications: boolean;
  autoSave: boolean;
}

export interface UserJourneyContext {
  personal: PersonalData;
  employment: EmploymentStatus;
  legal: LegalContext;
  journey: JourneyEvent[];
  preferences: UserPreferences;
  lastSimulation?: {
    type: string;
    result: Record<string, unknown>;
    timestamp: string;
  };
  documentDrafts: Record<string, unknown>;
}

interface UserJourneyStore {
  context: UserJourneyContext;
  updatePersonalData: (data: Partial<PersonalData>) => void;
  updateEmploymentStatus: (data: Partial<EmploymentStatus>) => void;
  updateLegalContext: (data: Partial<LegalContext>) => void;
  addJourneyEvent: (event: Omit<JourneyEvent, 'id' | 'timestamp'>) => void;
  updatePreferences: (data: Partial<UserPreferences>) => void;
  setLastSimulation: (simulation: { type: string; result: Record<string, unknown> }) => void;
  addDocumentDraft: (documentId: string, data: unknown) => void;
  clearJourney: () => void;
}

const STORAGE_KEY = 'simpaie-user-journey';

const defaultContext: UserJourneyContext = {
  personal: {},
  employment: {},
  legal: {},
  journey: [],
  preferences: {
    language: 'fr',
    theme: 'light',
    notifications: true,
    autoSave: true,
  },
  documentDrafts: {},
};

// Load from localStorage
const loadContext = (): UserJourneyContext => {
  if (typeof window === 'undefined') return defaultContext;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultContext, ...JSON.parse(stored) } : defaultContext;
  } catch {
    return defaultContext;
  }
};

// Save to localStorage
const saveContext = (context: UserJourneyContext) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch (error) {
    console.warn('Failed to save user journey context:', error);
  }
};

const UserJourneyStoreContext = createContext<UserJourneyStore | null>(null);

export function UserJourneyProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<UserJourneyContext>(loadContext);

  useEffect(() => {
    saveContext(context);
  }, [context]);

  const store: UserJourneyStore = {
    context,
    updatePersonalData: (data: Partial<PersonalData>) => {
      setContext((prev) => ({
        ...prev,
        personal: { ...prev.personal, ...data },
      }));
    },
    updateEmploymentStatus: (data: Partial<EmploymentStatus>) => {
      setContext((prev) => ({
        ...prev,
        employment: { ...prev.employment, ...data },
      }));
    },
    updateLegalContext: (data: Partial<LegalContext>) => {
      setContext((prev) => ({
        ...prev,
        legal: { ...prev.legal, ...data },
      }));
    },
    addJourneyEvent: (event: Omit<JourneyEvent, 'id' | 'timestamp'>) => {
      const newEvent: JourneyEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...event,
      };
      setContext((prev) => ({
        ...prev,
        journey: [...prev.journey, newEvent],
      }));
    },
    updatePreferences: (data: Partial<UserPreferences>) => {
      setContext((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, ...data },
      }));
    },
    setLastSimulation: (simulation: { type: string; result: Record<string, unknown> }) => {
      setContext((prev) => ({
        ...prev,
        lastSimulation: {
          type: simulation.type,
          result: simulation.result,
          timestamp: new Date().toISOString(),
        },
      }));
    },
    addDocumentDraft: (documentId: string, data: unknown) => {
      setContext((prev) => ({
        ...prev,
        documentDrafts: {
          ...prev.documentDrafts,
          [documentId]: data,
        },
      }));
    },
    clearJourney: () => {
      setContext(defaultContext);
    },
  };

  return React.createElement(
    UserJourneyStoreContext.Provider,
    { value: store },
    children
  );
}

export function useUserJourney(): UserJourneyStore {
  const store = useContext(UserJourneyStoreContext);
  if (!store) {
    throw new Error('useUserJourney must be used within UserJourneyProvider');
  }
  return store;
}

// Helper functions for context management
export const getCurrentScenario = (): string => {
  if (typeof window === 'undefined') return 'information';
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const context = stored ? JSON.parse(stored) : defaultContext;
    return context.legal?.currentScenario || 'information';
  } catch {
    return 'information';
  }
};

export const getEmploymentContext = (): EmploymentStatus => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const context = stored ? JSON.parse(stored) : defaultContext;
    return context.employment || {};
  } catch {
    return {};
  }
};

export const addSimulationToJourney = (
  calculatorType: string,
  result: Record<string, unknown>,
  input: Record<string, unknown>
) => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const context = stored ? JSON.parse(stored) : defaultContext;
    
    const newEvent: JourneyEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'simulation',
      data: {
        calculatorType,
        result,
        input,
      },
      context: 'simulation_completed',
    };

    const updatedContext = {
      ...context,
      journey: [...context.journey, newEvent],
      lastSimulation: {
        type: calculatorType,
        result,
        timestamp: new Date().toISOString(),
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedContext));
  } catch (error) {
    console.warn('Failed to add simulation to journey:', error);
  }
};

export const addDocumentToJourney = (
  documentId: string,
  documentData: unknown
) => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const context = stored ? JSON.parse(stored) : defaultContext;
    
    const newEvent: JourneyEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'document',
      data: {
        documentId,
        documentData,
      },
      context: 'document_generated',
    };

    const updatedContext = {
      ...context,
      journey: [...context.journey, newEvent],
      documentDrafts: {
        ...context.documentDrafts,
        [documentId]: documentData,
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedContext));
  } catch (error) {
    console.warn('Failed to add document to journey:', error);
  }
};
