// Configuration des URLs API selon l'environnement
export const API_CONFIG = {
  // URL de base pour les API
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://prosperian.onrender.com',
  
  // Endpoints Pronto
  PRONTO: {
    SEARCHES: '/api/pronto/searches',
    LISTS: '/api/pronto/lists',
    STATUS: '/api/pronto/status',
    SEARCH_DETAILS: (id: string) => `/api/pronto/searches/${id}`,
    SEARCH_LEADS: (id: string, page: number = 1, limit: number = 100) =>
      `/api/pronto/searches/${id}`,
    ALL_SEARCHES_COMPLETE: (includeLeads: boolean = true, leadsPerSearch: number = 50) =>
      `/api/pronto-workflows/all-searches-complete?include_leads=${includeLeads}&leads_per_search=${leadsPerSearch}`,
  },
  
  // Endpoints autres
  GRAPHQL: '/graphql',
  SWAGGER: '/api-docs',
};

// Fonction utilitaire pour construire les URLs complètes
export const buildApiUrl = (endpoint: string): string => {
  // En développement, utilise le proxy Vite si disponible
  if (import.meta.env.DEV) {
    return endpoint;
  }
  
  // En production, utilise l'URL complète
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 