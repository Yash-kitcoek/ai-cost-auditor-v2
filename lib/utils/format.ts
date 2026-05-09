export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
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
    case 'downgrade': return '#f59e0b';
    case 'switch': return '#3b82f6';
    case 'cancel': return '#ef4444';
    case 'keep': return '#10b981';
    default: return '#6b7280';
  }
}

export function savingsBadgeColor(savings: number): string {
  if (savings > 200) return '#10b981';
  if (savings > 50) return '#f59e0b';
  if (savings > 0) return '#3b82f6';
  return '#6b7280';
}