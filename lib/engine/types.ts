// Types for V3 Financial Intelligence Engine
import { 
  Asset, 
  Liability, 
  SinkingFund, 
  AnnualExpense, 
  Budget 
} from '../finance-types';

export interface NetWorthSnapshot {
  month: string; // YYYY-MM
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
}

export interface Subscription {
  id: string;
  name: string;
  amountHistory: number[];
  billingCycle: 'monthly' | 'yearly';
  nextChargeDate: string;
  category: string;
  isActive: boolean;
}

export interface MonthlySnapshot {
  month: string; // YYYY-MM
  amount: number;
  variables?: {
    consumption?: number;
    rate?: number;
    taxes?: number;
  };
}

export interface DynamicExpense {
  id: string;
  name: string;
  category: string;
  recurrence: {
    frequency: 'monthly';
    type: 'dynamic';
  };
  expectedAmount: number;
  variationThreshold: number; // e.g. 0.15 (15%)
  variablesTracked?: string[];
  history: MonthlySnapshot[];
}

export interface BehaviorInsight {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface FinancialRisk {
  score: number; // 0 - 100
  level: 'low' | 'medium' | 'high';
  factors: string[];
}

// Global structure for engine database extensions
export interface EngineDatabase {
  assets: Asset[];
  liabilities: Liability[];
  sinkingFunds: SinkingFund[];
  annualExpenses: AnnualExpense[];
  customBudgets: Budget[];
}

export const DEFAULT_ENGINE_DATABASE: EngineDatabase = {
  assets: [],
  liabilities: [],
  sinkingFunds: [],
  annualExpenses: [],
  customBudgets: [],
};
