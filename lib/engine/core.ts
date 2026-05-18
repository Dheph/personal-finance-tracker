import { FinanceDatabase } from '../finance-types';
import { EngineDatabase, NetWorthSnapshot, Subscription, BehaviorInsight, DynamicExpense } from './types';
import { calculateNetWorth, generateNetWorthHistory } from './networth';
import { detectSubscriptions } from './subscriptions';
import { detectDynamicExpenses } from './analytics';
import { analyzeExpenseBehavior } from './behavior';
import { calculateObligations, ObligationsReport } from './obligations';
import { calculatePersonalInflation, InflationReport } from './inflation';
import { calculateDynamicBudgets, DynamicBudgetReport } from './budgets';
import { calculateFinancialRisk, RiskReport } from './risk';

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
  dynamicExpenses: {
    items: DynamicExpense[];
    insights: BehaviorInsight[];
  };
  behavior: {
    insights: BehaviorInsight[];
  };
  obligations: ObligationsReport;
  inflation: InflationReport;
  budgets: DynamicBudgetReport;
  risk: RiskReport;
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
    engineDb.assets || [],
    engineDb.liabilities || [],
    financeDb.loans || [],
    financeDb.transactions || []
  );
  
  const netWorthHistory = generateNetWorthHistory(
    engineDb.assets || [],
    engineDb.liabilities || [],
    financeDb.loans || [],
    financeDb.transactions || []
  );

  // 2. Subscription Manager
  const subDetection = detectSubscriptions(financeDb.transactions || []);

  // 3. Dynamic Expenses
  const dynamicDetection = detectDynamicExpenses(financeDb.transactions || []);

  // 4. Behavior Analysis
  const behaviorInsights = analyzeExpenseBehavior(financeDb.transactions || [], financeDb.cards || []);

  // 5. Obligations Engine (Sinking Funds & Annual Taxes)
  const obligationsCalc = calculateObligations(
    engineDb.sinkingFunds || [],
    engineDb.annualExpenses || []
  );

  // 6. Personal Inflation Tracking
  const inflationCalc = calculatePersonalInflation(financeDb.transactions || []);

  // 7. Dynamic Budgets calculation
  const budgetsCalc = calculateDynamicBudgets(financeDb.transactions || []);

  // 8. Financial Risk calculation
  const riskCalc = calculateFinancialRisk(
    engineDb.assets || [],
    engineDb.liabilities || [],
    financeDb.loans || [],
    financeDb.transactions || []
  );

  // Combine all insights into a prioritized list
  const globalInsights: BehaviorInsight[] = [
    ...subDetection.insights,
    ...dynamicDetection.insights,
    ...behaviorInsights,
  ];

  // Add high inflation spike to global insights if positive
  if (inflationCalc.personalInflationRate > 10) {
    globalInsights.push({
      type: 'inflation_spike',
      severity: 'high',
      message: `Inflação Pessoal: Seu custo de vida essencial escalou ${inflationCalc.personalInflationRate.toFixed(1)}% nos últimos 30 dias. Revise os gastos de categorias básicas.`,
    });
  }

  // Add budget overflow warning to global insights
  const overflowBudgets = budgetsCalc.recommendations.filter(r => r.status === 'critical');
  if (overflowBudgets.length > 0) {
    globalInsights.push({
      type: 'budget_overflow',
      severity: 'high',
      message: `Orçamento Estourado: Você ultrapassou os limites sugeridos em ${overflowBudgets.length} categorias. Recomendamos congelar gastos supérfluos destas áreas.`,
    });
  }

  // Add risk warning to global insights
  if (riskCalc.level === 'high') {
    globalInsights.push({
      type: 'high_risk',
      severity: 'high',
      message: `Alerta Vermelho de Risco: Seu comprometimento de renda ou falta de reserva líquida elevaram seu índice de risco para ${riskCalc.score}%. Evite novas despesas parceladas.`,
    });
  }

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
    dynamicExpenses: {
      items: dynamicDetection.dynamicExpenses,
      insights: dynamicDetection.insights,
    },
    behavior: {
      insights: behaviorInsights,
    },
    obligations: obligationsCalc,
    inflation: inflationCalc,
    budgets: budgetsCalc,
    risk: riskCalc,
    globalInsights,
  };
}
