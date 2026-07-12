const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3003';
const API_GRAPHQL = import.meta.env.VITE_API_GRAPHQL || `${API_BASE}/graphql`;

export {
    API_BASE,
    API_GRAPHQL
};
