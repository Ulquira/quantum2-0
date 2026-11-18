const getApiBaseUrl = (): string => {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw && typeof raw === 'string' && raw.startsWith('http') && !raw.includes('http://:')) {
    return raw;
  }
  const host =
    typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : 'localhost';
  return `http://${host}:5000/api`;
};

const resolvedUrl = getApiBaseUrl();

export const env = {
  API_BASE_URL: resolvedUrl,
  VITE_API_BASE_URL: resolvedUrl,
  AZURE_CLIENT_ID: import.meta.env.VITE_AZURE_CLIENT_ID || 'demo-client-id',
  AZURE_TENANT_ID: import.meta.env.VITE_AZURE_TENANT_ID || 'demo-tenant-id',
};
