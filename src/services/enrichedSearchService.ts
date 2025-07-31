import axios from 'axios';

const API_BASE_URL = '/api/search-enriched';

// Types pour les données enrichies
export interface EnrichedCompany {
  // Données data.gouv.fr
  siren: string;
  siret?: string;
  nom_complet?: string;
  denomination?: string;
  activite_principale?: string;
  nature_juridique?: string;
  adresse?: string;
  code_postal?: string;
  commune?: string;
  
  // Données enrichies Pronto
  enriched: boolean;
  logo_url?: string;
  description?: string;
  linkedin_url?: string;
  linkedin_id?: string;
  website_url?: string;
  employee_count_range?: string;
  pronto_industry?: string;
  from_cache?: boolean;
  enrichment_error?: string;
}

export interface EnrichmentStats {
  total_companies: number;
  enriched_companies: number;
  companies_with_logo: number;
  companies_with_description: number;
  companies_with_linkedin: number;
  from_cache: number;
}

export interface EnrichedSearchResponse {
  results: EnrichedCompany[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
  enrichment_stats: EnrichmentStats;
  performance: {
    processing_time_ms: number;
    enrichment_enabled: boolean;
    max_enrichments_limit: number;
  };
}

export interface SearchParams {
  q?: string;
  auto_enrich?: boolean;
  max_enrichments?: number;
  activite_principale?: string;
  code_postal?: string;
  departement?: string;
  tranche_effectif_salarie?: string;
  page?: number;
  per_page?: number;
  [key: string]: any;
}

class EnrichedSearchService {
  /**
   * Recherche d'entreprises avec enrichissement automatique
   */
  async searchCompanies(params: SearchParams): Promise<EnrichedSearchResponse> {
    try {
      console.log('🔍 Recherche enrichie avec paramètres:', params);
      
      const response = await axios.get<EnrichedSearchResponse>(API_BASE_URL, {
        params,
        timeout: 60000 // 60s timeout pour l'enrichissement
      });

      console.log('✅ Recherche enrichie terminée:', {
        total: response.data.total_results,
        enriched: response.data.enrichment_stats.enriched_companies,
        processing_time: response.data.performance.processing_time_ms
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la recherche enrichie:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Limite de taux dépassée. Veuillez patienter 1 minute avant de réessayer.');
        }
        if (error.response?.status === 500) {
          throw new Error('Erreur serveur lors de l\'enrichissement. Veuillez réessayer.');
        }
      }
      
      throw new Error('Erreur lors de la recherche enrichie');
    }
  }

  /**
   * Enrichit une seule entreprise
   */
  async enrichSingleCompany(company: Partial<EnrichedCompany>): Promise<EnrichedCompany> {
    try {
      console.log('🔍 Enrichissement unique pour:', company.nom_complet || company.denomination);
      
      const response = await axios.post(`${API_BASE_URL}/enrich-single`, {
        company
      });

      return response.data.company;
    } catch (error) {
      console.error('❌ Erreur enrichissement unique:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Limite de taux dépassée pour l\'enrichissement.');
        }
      }
      
      throw new Error('Erreur lors de l\'enrichissement unique');
    }
  }

  /**
   * Statistiques du système d'enrichissement
   */
  async getEnrichmentStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération stats:', error);
      throw new Error('Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * Recherche rapide sans enrichissement (fallback)
   */
  async searchBasic(params: SearchParams): Promise<EnrichedSearchResponse> {
    const basicParams = {
      ...params,
      auto_enrich: false
    };
    
    return this.searchCompanies(basicParams);
  }

  /**
   * Formate les paramètres de recherche pour l'affichage
   */
  formatSearchParams(params: SearchParams): string {
    const parts: string[] = [];
    
    if (params.q) parts.push(`Recherche: "${params.q}"`);
    if (params.activite_principale) parts.push(`NAF: ${params.activite_principale}`);
    if (params.code_postal) parts.push(`CP: ${params.code_postal}`);
    if (params.departement) parts.push(`Dép: ${params.departement}`);
    if (params.tranche_effectif_salarie) parts.push(`Effectif: ${params.tranche_effectif_salarie}`);
    
    return parts.join(' | ') || 'Recherche libre';
  }

  /**
   * Génère l'URL LinkedIn à partir de l'ID
   */
  getLinkedInProfileUrl(linkedinId?: string): string | null {
    if (!linkedinId) return null;
    return `https://linkedin.com/company/${linkedinId}`;
  }

  /**
   * Formate les données d'entreprise pour l'affichage
   */
  formatCompanyForDisplay(company: EnrichedCompany) {
    return {
      id: company.siren,
      name: company.nom_complet || company.denomination || 'Nom non disponible',
      logo: company.logo_url,
      description: company.description,
      website: company.website_url,
      linkedin: company.linkedin_url,
      linkedinId: company.linkedin_id,
      industry: company.pronto_industry || company.activite_principale,
      employees: company.employee_count_range,
      address: company.adresse,
      postalCode: company.code_postal,
      city: company.commune,
      enriched: company.enriched,
      fromCache: company.from_cache,
      enrichmentError: company.enrichment_error
    };
  }
}

export default new EnrichedSearchService();