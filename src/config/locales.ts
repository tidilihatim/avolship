// List of supported locales
export const locales = ['en', 'fr'] as const;

// Default locale
export const defaultLocale = 'en' as const;

// Type for locale
export type Locale = (typeof locales)[number];