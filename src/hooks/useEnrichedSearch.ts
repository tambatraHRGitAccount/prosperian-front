import { useState, useCallback } from 'react';
import enrichedSearchService, { 
  EnrichedCompany, 
  EnrichedSearchResponse, 
  SearchParams,
  EnrichmentStats
} from '../services/enrichedSearchService';

interface UseEnrichedSearchState {
  companies: EnrichedCompany[];
  loading: boolean;
  error: string | null;
  stats: EnrichmentStats | null;
  currentSearch: SearchParams | null;
  pagination: {
    page: number;
    per_page: number;
    total_results: number;
    total_pages: number;
  } | null;
  performance: {
    processing_time_ms: number;
    enrichment_enabled: boolean;
    max_enrichments_limit: number;
  } | null;
}

interface UseEnrichedSearchActions {
  searchCompanies: (params: SearchParams) => Promise<void>;
  enrichSingleCompany: (company: Partial<EnrichedCompany>) => Promise<EnrichedCompany | null>;
  searchBasic: (params: SearchParams) => Promise<void>;
  clearResults: () => void;
  retrySearch: () => Promise<void>;
}

export function useEnrichedSearch(): UseEnrichedSearchState & UseEnrichedSearchActions {
  const [state, setState] = useState<UseEnrichedSearchState>({
    companies: [],
    loading: false,
    error: null,
    stats: null,
    currentSearch: null,
    pagination: null,
    performance: null
  });

  const updateState = useCallback((updates: Partial<UseEnrichedSearchState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const searchCompanies = useCallback(async (params: SearchParams) => {
    try {
      updateState({ loading: true, error: null, currentSearch: params });
      
      console.log('🔍 Démarrage recherche enrichie:', params);
      
      const response: EnrichedSearchResponse = await enrichedSearchService.searchCompanies(params);
      
      updateState({
        companies: response.results,
        stats: response.enrichment_stats,
        pagination: {
          page: response.page,
          per_page: response.per_page,
          total_results: response.total_results,
          total_pages: response.total_pages
        },
        performance: response.performance,
        loading: false,
        error: null
      });

      console.log('✅ Recherche enrichie terminée:', {
        total: response.total_results,
        enriched: response.enrichment_stats.enriched_companies,
        logos: response.enrichment_stats.companies_with_logo,
        linkedin: response.enrichment_stats.companies_with_linkedin
      });

    } catch (error) {
      console.error('❌ Erreur recherche enrichie:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la recherche'
      });
    }
  }, [updateState]);

  const enrichSingleCompany = useCallback(async (company: Partial<EnrichedCompany>): Promise<EnrichedCompany | null> => {
    try {
      console.log('🔍 Enrichissement unique:', company.nom_complet || company.denomination);
      
      const enrichedCompany = await enrichedSearchService.enrichSingleCompany(company);
      
      // Mettre à jour la company dans la liste si elle existe
      updateState({
        companies: state.companies.map(c => 
          c.siren === enrichedCompany.siren ? enrichedCompany : c
        )
      });

      return enrichedCompany;
    } catch (error) {
      console.error('❌ Erreur enrichissement unique:', error);
      return null;
    }
  }, [state.companies, updateState]);

  const searchBasic = useCallback(async (params: SearchParams) => {
    try {
      updateState({ loading: true, error: null, currentSearch: params });
      
      console.log('🔍 Recherche basique (sans enrichissement):', params);
      
      const response = await enrichedSearchService.searchBasic(params);
      
      updateState({
        companies: response.results,
        stats: response.enrichment_stats,
        pagination: {
          page: response.page,
          per_page: response.per_page,
          total_results: response.total_results,
          total_pages: response.total_pages
        },
        performance: response.performance,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Erreur recherche basique:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la recherche'
      });
    }
  }, [updateState]);

  const clearResults = useCallback(() => {
    updateState({
      companies: [],
      stats: null,
      currentSearch: null,
      pagination: null,
      performance: null,
      error: null
    });
  }, [updateState]);

  const retrySearch = useCallback(async () => {
    if (state.currentSearch) {
      await searchCompanies(state.currentSearch);
    }
  }, [state.currentSearch, searchCompanies]);

  return {
    ...state,
    searchCompanies,
    enrichSingleCompany,
    searchBasic,
    clearResults,
    retrySearch
  };
}

// Hook utilitaire pour les statistiques d'enrichissement
export function useEnrichmentStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await enrichedSearchService.getEnrichmentStats();
      setStats(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de la récupération des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, fetchStats };
}

// Hook utilitaire pour formater les données d'entreprise
export function useCompanyFormatter() {
  const formatForDisplay = useCallback((company: EnrichedCompany) => {
    return enrichedSearchService.formatCompanyForDisplay(company);
  }, []);

  const getLinkedInUrl = useCallback((linkedinId?: string) => {
    return enrichedSearchService.getLinkedInProfileUrl(linkedinId);
  }, []);

  const formatSearchParams = useCallback((params: SearchParams) => {
    return enrichedSearchService.formatSearchParams(params);
  }, []);

  return {
    formatForDisplay,
    getLinkedInUrl,
    formatSearchParams
  };
}