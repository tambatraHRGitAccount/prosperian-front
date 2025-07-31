import { API_CONFIG } from '@config/api';

export interface SemanticSuggestion {
  term: string;
  originalTerm?: string;
  nafCodes: string[];
  type: 'concept' | 'synonym';
}

export interface SemanticAnalysis {
  originalTerm: string;
  nafCodes: string[];
  codesCount: number;
  suggestions: SemanticSuggestion[];
  confidence: 'high' | 'medium' | 'low';
  relatedConcepts: string[];
}

export interface PopularConcept {
  term: string;
  description: string;
}

export interface SemanticSearchQuery {
  term: string;
  location?: string;
  page?: number;
  limit?: number;
  additionalFilters?: Record<string, any>;
}

export interface SemanticSearchResult {
  // Copier la structure de Business depuis entities/Business.ts
  siren: string;
  nom_complet: string;
  raison_sociale: string;
  activite_principale: string;
  // Enrichissement sémantique
  semantic_analysis?: {
    search_term: string;
    matched_concepts: string[];
    confidence: string;
  };
}

export interface SemanticSearchResponse {
  success: boolean;
  query: {
    term: string;
    location: string;
    page: number;
    limit: number;
  };
  total_results: number;
  results: SemanticSearchResult[];
  analysis: SemanticAnalysis;
  pagination: {
    page: number;
    per_page: number;
    total_pages: number;
  };
  metadata: {
    source: string;
    timestamp: string;
    naf_codes_used: string[];
  };
}

export class SemanticService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/api/semantic`;
  }

  /**
   * Analyser un terme de recherche sémantique
   */
  async analyzeTerm(term: string): Promise<SemanticAnalysis> {
    try {
      console.log('🔍 Analyse sémantique pour:', term);

      const response = await fetch(
        `${this.baseUrl}/analyze?term=${encodeURIComponent(term)}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de l\'analyse sémantique');
      }

      console.log(`✅ ${data.analysis.codesCount} codes NAF trouvés (confiance: ${data.analysis.confidence})`);
      
      return data.analysis;

    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse sémantique:', error);
      throw error;
    }
  }

  /**
   * Obtenir des suggestions d'auto-complétion
   */
  async getSuggestions(partialTerm: string, limit: number = 10): Promise<SemanticSuggestion[]> {
    try {
      if (!partialTerm || partialTerm.length < 2) {
        return [];
      }

      console.log('💡 Suggestions sémantiques pour:', partialTerm);

      const response = await fetch(
        `${this.baseUrl}/suggestions?term=${encodeURIComponent(partialTerm)}&limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la récupération des suggestions');
      }

      console.log(`✅ ${data.suggestions.length} suggestions trouvées`);
      
      return data.suggestions;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des suggestions:', error);
      return [];
    }
  }

  /**
   * Obtenir les concepts populaires
   */
  async getPopularConcepts(): Promise<PopularConcept[]> {
    try {
      console.log('📋 Récupération des concepts populaires');

      const response = await fetch(`${this.baseUrl}/popular`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la récupération des concepts populaires');
      }

      console.log(`✅ ${data.concepts.length} concepts populaires récupérés`);
      
      return data.concepts;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des concepts populaires:', error);
      return [];
    }
  }

  /**
   * Rechercher des entreprises via recherche sémantique
   */
  async search(query: SemanticSearchQuery): Promise<SemanticSearchResponse> {
    try {
      console.log('🔍 Recherche sémantique pour:', query);

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          term: query.term,
          location: query.location || 'France',
          page: query.page || 1,
          limit: query.limit || 50,
          additionalFilters: query.additionalFilters || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la recherche sémantique');
      }

      console.log(`✅ ${data.results.length} entreprises trouvées via recherche sémantique`);
      
      return data;

    } catch (error) {
      console.error('❌ Erreur lors de la recherche sémantique:', error);
      throw error;
    }
  }

  /**
   * Obtenir des exemples de recherche par catégorie
   */
  async getExamples(): Promise<{category: string, examples: string[]}[]> {
    try {
      console.log('📚 Récupération des exemples de recherche');

      const response = await fetch(`${this.baseUrl}/examples`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la récupération des exemples');
      }

      console.log(`✅ ${data.examples.length} catégories d'exemples récupérées`);
      
      return data.examples;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des exemples:', error);
      return [];
    }
  }

  /**
   * Tester la connectivité du service
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/popular`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Instance singleton
export const semanticService = new SemanticService(); 