const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3003';
const API_GRAPHQL = import.meta.env.VITE_API_GRAPHQL || `${API_BASE}/graphql`;
const CXC_CUENTAS_BANCARIAS_URL = import.meta.env.VITE_CXC_CUENTAS_BANCARIAS_URL || '';
const CXC_AUTH_TOKEN = import.meta.env.VITE_CXC_AUTH_TOKEN || '';

export {
    API_BASE,
    API_GRAPHQL,
    CXC_CUENTAS_BANCARIAS_URL,
    CXC_AUTH_TOKEN
};
