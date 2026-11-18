const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return `http://${host}:5000/api`;
    }
  }
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw && typeof raw === 'string' && raw.startsWith('http')) {
    return raw.replace(/\/+$/, '');
  }
  return 'http://localhost:5000/api';
};

const resolvedUrl = getApiBaseUrl();

export const env = {
  API_BASE_URL: resolvedUrl,
  VITE_API_BASE_URL: resolvedUrl,
  AZURE_CLIENT_ID: import.meta.env.VITE_AZURE_CLIENT_ID || 'demo-client-id',
  AZURE_TENANT_ID: import.meta.env.VITE_AZURE_TENANT_ID || 'demo-tenant-id',
};
