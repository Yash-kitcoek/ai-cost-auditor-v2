export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyPrecise(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function actionLabel(action: string): string {
  switch (action) {
    case 'downgrade': return 'Downgrade';
    case 'switch': return 'Switch Tool';
    case 'cancel': return 'Cancel / Consolidate';
    case 'keep': return 'Keep — Optimal';
    default: return action;
  }
}

export function actionColor(action: string): string {
  switch (action) {
    case 'downgrade': return 'text-amber-400';
    case 'switch': return 'text-blue-400';
    case 'cancel': return 'text-red-400';
    case 'keep': return 'text-emerald-400';
    default: return 'text-gray-400';
  }
}

export function savingsBadgeColor(savings: number): string {
  if (savings > 200) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (savings > 50) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  if (savings > 0) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}