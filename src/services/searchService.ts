import { API_CONFIG } from '@config/api';

export interface SearchResult {
  siren: string;
  nom_complet: string;
  raison_sociale?: string;
  activite_principale?: string;
  siege?: {
    libelle_commune?: string;
    code_postal?: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export class SearchService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Recherche d'entreprises par terme de recherche
   */
  async searchCompanies(
    query: string, 
    page: number = 1, 
    perPage: number = 10,
    limiteMatchingEtablissements: number = 10
  ): Promise<SearchResponse> {
    try {
      console.log('🚀 [searchService] Début de la recherche pour:', query);
      console.log('🚀 [searchService] Longueur de la requête:', query?.length || 0);

      if (!query || query.trim().length < 3) {
        console.log('⚠️ [searchService] Requête trop courte (< 3 caractères), retour vide');
        return {
          results: [],
          total_results: 0,
          page: 1,
          per_page: perPage,
          total_pages: 0
        };
      }

      const trimmedQuery = query.trim();
      console.log('🔍 [searchService] Recherche d\'entreprises pour:', trimmedQuery);

      const url = new URL(`${this.baseUrl}/api/search`);
      url.searchParams.set('q', trimmedQuery);
      url.searchParams.set('limite_matching_etablissements', limiteMatchingEtablissements.toString());
      url.searchParams.set('page', page.toString());
      url.searchParams.set('per_page', perPage.toString());

      console.log('🌐 [searchService] URL de requête:', url.toString());

      const response = await fetch(url.toString(), {
        headers: {
          'accept': 'application/json'
        }
      });

      console.log('📡 [searchService] Statut de la réponse:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [searchService] Erreur HTTP:', response.status, errorText);
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 [searchService] Données reçues:', data);
      console.log('📊 [searchService] Nombre de résultats:', data.results?.length || 0);
      
      const result = {
        results: data.results || [],
        total_results: data.total_results || 0,
        page: data.page || page,
        per_page: data.per_page || perPage,
        total_pages: data.total_pages || 0
      };

      console.log('✅ [searchService] Résultat final:', result);
      return result;

    } catch (error) {
      console.error('❌ [searchService] Erreur lors de la recherche d\'entreprises:', error);
      
      // Gestion spécifique de l'erreur de requête trop courte
      if (error instanceof Error && error.message.includes('400')) {
        try {
          const errorMatch = error.message.match(/\{.*\}/);
          if (errorMatch) {
            const errorData = JSON.parse(errorMatch[0]);
            if (errorData.error?.erreur?.includes('3 caractères minimum')) {
              throw new Error('TROP_COURTE');
            }
          }
        } catch (parseError) {
          // Si le parsing échoue, on garde l'erreur originale
        }
      }
      
      throw error;
    }
  }

  /**
   * Recherche avec debounce pour éviter trop d'appels API
   */
  debounceSearch(
    query: string,
    callback: (results: SearchResponse) => void,
    delay: number = 300
  ): () => void {
    let timeoutId: NodeJS.Timeout;

    const debouncedSearch = async () => {
      try {
        const results = await this.searchCompanies(query);
        callback(results);
      } catch (error) {
        console.error('Erreur dans la recherche debounced:', error);
        callback({
          results: [],
          total_results: 0,
          page: 1,
          per_page: 10,
          total_pages: 0
        });
      }
    };

    const execute = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(debouncedSearch, delay);
    };

    execute();
    return () => clearTimeout(timeoutId);
  }
}

// Instance singleton
export const searchService = new SearchService(); 