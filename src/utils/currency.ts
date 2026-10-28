import { SUPPORTED_CURRENCIES } from '../data/presets';

/**
 * Postel's Law: Liberal input parser that accepts commas, dots, spaces, and currency symbols.
 * Examples:
 *  - "12,50" -> 12.5
 *  - "1.250,50" -> 1250.5
 *  - "3,500" (when comma is thousands or decimal) -> handled gracefully
 */
export function parseFlexibleAmount(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d.,-]/g, '').trim();
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  let normalized = cleaned;
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      // Format like 1.234,56 -> remove dots, comma becomes dot
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Format like 1,234.56 -> remove commas
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (lastComma > -1) {
    // Single comma -> treat as decimal separator (standard Italian input)
    normalized = cleaned.replace(',', '.');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getCurrencyInfo(code: string) {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase()) ?? {
      code: code.toUpperCase() || 'EUR',
      symbol: code.toUpperCase() || '€',
      name: code.toUpperCase(),
      defaultRateFromEur: 1,
      decimals: 2
    }
  );
}

export function formatMoney(amount: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  try {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: info.code,
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals
    }).format(amount);
  } catch {
    return `${amount.toFixed(info.decimals)} ${info.symbol}`;
  }
}

export function convertToBase(
  amount: number,
  currency: string,
  baseCurrency: string,
  exchangeRate: number
): number {
  if (currency.toUpperCase() === baseCurrency.toUpperCase()) {
    return amount;
  }
  const safeRate = exchangeRate > 0 ? exchangeRate : 1;
  return amount / safeRate;
}

export function convertFromBase(
  amountInBase: number,
  targetCurrency: string,
  baseCurrency: string,
  exchangeRate: number
): number {
  if (targetCurrency.toUpperCase() === baseCurrency.toUpperCase()) {
    return amountInBase;
  }
  const safeRate = exchangeRate > 0 ? exchangeRate : 1;
  return amountInBase * safeRate;
}
