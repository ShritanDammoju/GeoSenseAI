/**
 * GeoSense AI — Centralized Backend API Configuration
 *
 * Reads the backend base URL from Vite environment variable VITE_API_BASE_URL.
 * Falls back to http://127.0.0.1:8000 for local development.
 * Automatically strips trailing slashes to guarantee clean endpoint URLs.
 */
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const cleanedBaseUrl = typeof rawBaseUrl === 'string' ? rawBaseUrl.trim().replace(/\/+$/, '') : '';

export const API_BASE_URL: string = cleanedBaseUrl || 'http://127.0.0.1:8000';

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  timeSeriesSummary: `${API_BASE_URL}/api/time-series/summary`,
  timeSeriesGlobal: `${API_BASE_URL}/api/time-series/global`,
  forecastNextDay: `${API_BASE_URL}/api/forecast/next-day`,
  firmsLive: (dayRange = 1, forceRefresh = false): string =>
    `${API_BASE_URL}/api/firms/live?day_range=${dayRange}${forceRefresh ? '&force_refresh=true' : ''}`,
  dataQuality: `${API_BASE_URL}/api/data-quality`,
  countries: (limit = 12): string => `${API_BASE_URL}/api/countries?limit=${limit}`,
  modelEvaluation: `${API_BASE_URL}/api/models/evaluation`,
} as const;
