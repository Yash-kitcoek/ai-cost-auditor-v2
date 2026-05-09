'use client';
import { useState, useEffect, useCallback } from 'react';
import { AuditInput, ToolEntry, UseCase, ToolId } from '@/lib/audit/types';
import { PRICING } from '@/lib/audit/pricing';

const STORAGE_KEY = 'ai-audit-form-v1';
const DEFAULT: AuditInput = { tools: [], teamSize: 1, useCase: 'mixed' };

export function useFormState() {
  const [input, setInput] = useState<AuditInput>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setInput(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(input)); } catch {}
  }, [input, hydrated]);

  const addTool = useCallback((toolId: ToolId) => {
    setInput((prev) => {
      if (prev.tools.some((t) => t.toolId === toolId)) return prev;
      const plans = PRICING[toolId];
      const defaultPlan = plans?.[1] || plans?.[0];
      const newEntry: ToolEntry = {
        toolId, plan: defaultPlan?.planId || '',
        seats: prev.teamSize || 1,
        monthlySpend: (defaultPlan?.pricePerSeat || 0) * (prev.teamSize || 1),
      };
      return { ...prev, tools: [...prev.tools, newEntry] };
    });
  }, []);

  const removeTool = useCallback((toolId: ToolId) => {
    setInput((prev) => ({ ...prev, tools: prev.tools.filter((t) => t.toolId !== toolId) }));
  }, []);

  const updateTool = useCallback((toolId: ToolId, updates: Partial<ToolEntry>) => {
    setInput((prev) => ({ ...prev, tools: prev.tools.map((t) => t.toolId === toolId ? { ...t, ...updates } : t) }));
  }, []);

  const setTeamSize = useCallback((size: number) => {
    setInput((prev) => ({ ...prev, teamSize: size }));
  }, []);

  const setUseCase = useCallback((useCase: UseCase) => {
    setInput((prev) => ({ ...prev, useCase }));
  }, []);

  return { input, hydrated, addTool, removeTool, updateTool, setTeamSize, setUseCase };
}