export type UseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed';

export type ToolId =
  | 'cursor'
  | 'github-copilot'
  | 'claude'
  | 'chatgpt'
  | 'anthropic-api'
  | 'openai-api'
  | 'gemini'
  | 'windsurf';

export interface ToolEntry {
  toolId: ToolId;
  plan: string;
  monthlySpend: number;
  seats: number;
}

export interface AuditInput {
  tools: ToolEntry[];
  teamSize: number;
  useCase: UseCase;
}

export interface ToolRecommendation {
  toolId: ToolId;
  toolName: string;
  currentPlan: string;
  currentSpend: number;
  action: 'downgrade' | 'switch' | 'keep' | 'cancel';
  recommendedPlan?: string;
  recommendedTool?: string;
  recommendedSpend: number;
  savings: number;
  reason: string;
}

export interface AuditResult {
  recommendations: ToolRecommendation[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  totalCurrentSpend: number;
  totalOptimizedSpend: number;
  isAlreadyOptimal: boolean;
  highSavings: boolean;
  score: number;          
  summary?: string;
  useCase: UseCase;
  teamSize: number;
}

export interface SavedAudit {
  id: string;
  input: AuditInput;
  result: AuditResult;
  createdAt: string;
  email?: string;
  company?: string;
  role?: string;
}