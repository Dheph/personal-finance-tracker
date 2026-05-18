import { FinanceDatabase } from '../finance-types';
import { EngineDatabase, NetWorthSnapshot, Subscription, BehaviorInsight } from './types';
import { calculateNetWorth, generateNetWorthHistory } from './networth';
import { detectSubscriptions } from './subscriptions';

export interface FinancialIntelligenceResult {
  netWorth: {
    assetsTotal: number;
    liabilitiesTotal: number;
    current: number;
    breakdown: {
      assets: { name: string; value: number }[];
      liabilities: { name: string; value: number }[];
    };
    history: NetWorthSnapshot[];
  };
  subscriptions: {
    items: Subscription[];
    insights: BehaviorInsight[];
  };
  globalInsights: BehaviorInsight[];
}

/**
 * The master engine execution call.
 * Takes the core database and engine database, evaluates everything, and returns ready-to-render state.
 */
export function runFinancialIntelligenceEngine(
  financeDb: FinanceDatabase,
  engineDb: EngineDatabase
): FinancialIntelligenceResult {
  // 1. Net Worth Tracking
  const netWorthCalc = calculateNetWorth(
    engineDb.assets,
    engineDb.liabilities,
    financeDb.loans,
    financeDb.transactions
  );
  
  const netWorthHistory = generateNetWorthHistory(
    engineDb.assets,
    engineDb.liabilities,
    financeDb.loans,
    financeDb.transactions
  );

  // 2. Subscription Manager
  const subDetection = detectSubscriptions(financeDb.transactions);

  // Combine insights
  const globalInsights: BehaviorInsight[] = [
    ...subDetection.insights,
  ];

  return {
    netWorth: {
      assetsTotal: netWorthCalc.assetsTotal,
      liabilitiesTotal: netWorthCalc.liabilitiesTotal,
      current: netWorthCalc.netWorth,
      breakdown: netWorthCalc.breakdown,
      history: netWorthHistory,
    },
    subscriptions: {
      items: subDetection.subscriptions,
      insights: subDetection.insights,
    },
    globalInsights,
  };
}
