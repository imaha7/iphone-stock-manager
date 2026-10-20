export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatCostCategory(category: string): string {
  const labels: Record<string, string> = {
    ongkir: 'Shipping',
    shipping: 'Shipping',
    servis: 'Service',
    service: 'Service',
    operasional: 'Operations',
    operational: 'Operations',
    operations: 'Operations',
  };
  return labels[category.toLowerCase()] || category;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
