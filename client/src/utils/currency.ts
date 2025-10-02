// Currency symbols and utilities
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RUB: '₽',
  INR: '₹',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  MXN: '$',
  BRL: 'R$',
  ZAR: 'R',
  TRY: '₺',
  THB: '฿',
  MYR: 'RM',
  IDR: 'Rp',
  PHP: '₱',
  VND: '₫',
  ILS: '₪',
  AED: 'د.إ',
  SAR: 'ر.س',
  EGP: 'ج.م',
  QAR: 'ر.ق',
  KWD: 'د.ك',
  BHD: 'د.ب',
  OMR: 'ر.ع.',
  JOD: 'د.ا',
  LBP: 'ل.ل',
  CLP: '$',
  COP: '$',
  PEN: 'S/',
  UYU: '$U',
  ARS: '$',
  BOB: 'Bs.',
  PYG: '₲',
  // Add more as needed
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode.toUpperCase();
};

export const formatCurrency = (amount: number, currencyCode: string, showSign: boolean = true): string => {
  const symbol = getCurrencySymbol(currencyCode);
  const absAmount = Math.abs(amount);
  const formattedAmount = absAmount.toFixed(2);
  
  if (showSign) {
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}${symbol}${formattedAmount}`;
  }
  
  return `${symbol}${formattedAmount}`;
};

export const formatAmountWithCurrency = (amount: number, currencyCode: string, type?: 'income' | 'expense' | 'capex'): string => {
  const symbol = getCurrencySymbol(currencyCode);
  const absAmount = Math.abs(amount);
  const formattedAmount = absAmount.toFixed(2);
  
  if (type === 'income') {
    return `+${symbol}${formattedAmount}`;
  } else if (type === 'expense' || type === 'capex') {
    return `-${symbol}${formattedAmount}`;
  }
  
  return `${symbol}${formattedAmount}`;
};

// Common currency codes for dropdowns
export const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NOK', 
  'DKK', 'PLN', 'CZK', 'HUF', 'INR', 'KRW', 'SGD', 'HKD', 'NZD', 'MXN',
  'BRL', 'ZAR', 'TRY', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'ILS', 'AED'
];