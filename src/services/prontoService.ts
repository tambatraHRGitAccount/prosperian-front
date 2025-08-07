import { ProntoSearchResponse, ProntoSearch } from '@entities/Business';
import { API_CONFIG, buildApiUrl } from '@config/api';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://prosperian.onrender.com';

export interface ProntoEnrichmentContact {
  firstname: string;
  lastname: string;
  company_name?: string;
  linkedin_url?: string;
  domain?: string;
}

export interface ProntoEnrichmentRequest {
  contacts: ProntoEnrichmentContact[];
  enrichment_type: string[];
}

export const sendEnrichmentToPronto = async (data: ProntoEnrichmentRequest) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/pronto/enrichments/contacts/bulk`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi vers Pronto:', error);
    throw error;
  }
};

export interface ProntoCompany {
  name: string;
  country_code?: string | null;
  domain?: string | null;
  linkedin_url?: string | null;
}

export interface ProntoListRequest {
  name: string;
  webhook_url?: string;
  companies: ProntoCompany[];
}

export interface ProntoListResponse {
  success: boolean;
  list: {
    id: string;
    name: string;
    webhook_url?: string;
    companies_count: number;
    companies: ProntoCompany[];
    created_at: string;
    pronto_response: any;
  };
  message: string;
}

export interface ProntoListItem {
  id: string;
  name: string;
  type: string;
  companies_count: number;
  linkedin_id?: string;
  created_at: string;
  updated_at: string;
  webhook_url?: string;
  status?: string;
}

export interface ProntoListsResponse {
  success: boolean;
  lists: ProntoListItem[];
  total: number;
  message: string;
  pronto_response?: any;
}

// Interfaces pour la recherche globale
export interface ProntoFilters {
  company_filter?: string;
  title_filter?: string;
  lead_location_filter?: string;
  employee_range_filter?: string;
  company_location_filter?: string;
  industry_filter?: string;
  limit?: number;
}

export interface ProntoLead {
  search_id: string;
  search_name: string;
  lead: {
    status: string;
    rejection_reasons?: string[];
    first_name: string;
    last_name: string;
    gender?: string;
    email?: string | null;
    email_status?: string | null;
    phone?: string[];
    linkedin_url?: string;
    profile_image_url?: string;
    location?: string;
    title: string;
    years_in_position?: number;
    months_in_position?: number;
    years_in_company?: number;
    months_in_company?: number;
  };
  company?: {
    name: string;
    cleaned_name?: string;
    website?: string;
    location?: string;
    industry?: string;
    headquarters?: {
      city: string;
      line1: string;
      country: string;
      postalCode: string;
      geographicArea: string;
    };
    description?: string;
    linkedin_url?: string;
    linkedin_id?: string;
    employee_range?: string;
    company_profile_picture?: string;
  };
}

export interface ProntoGlobalResponse {
  success: boolean;
  total_searches: number;
  total_leads: number;
  filtered_leads: number;
  unique_companies: number;
  applied_filters: {
    company_names: string[];
    titles: string[];
    lead_locations: string[];
    employee_ranges: string[];
    company_locations: string[];
    industries: string[];
  };
  leads: ProntoLead[];
  processing_time: number;
  message: string;
}

export class ProntoService {
  // Récupérer toutes les recherches
  static async getAllSearches(): Promise<ProntoSearch[]> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.PRONTO.SEARCHES));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.searches || [];
    } catch (error) {
      console.error('Error fetching searches:', error);
      throw error;
    }
  }

  // Créer une liste d'entreprises dans Pronto
  static async createCompanyList(data: ProntoListRequest): Promise<ProntoListResponse> {
    try {
      // Nettoyer les données avant l'envoi - supprimer les valeurs null/undefined
      const cleanedData = {
        ...data,
        companies: data.companies.map(company => {
          const cleaned: any = { name: company.name };

          if (company.country_code) cleaned.country_code = company.country_code;
          if (company.domain) cleaned.domain = company.domain;
          if (company.linkedin_url) cleaned.linkedin_url = company.linkedin_url;

          return cleaned;
        })
      };

      console.log('🚀 Envoi des données nettoyées vers l\'API Pronto:', cleanedData);

      const response = await fetch(buildApiUrl(API_CONFIG.PRONTO.LISTS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating company list:', error);
      throw error;
    }
  }

  // Récupérer toutes les listes Pronto
  static async getAllLists(): Promise<ProntoListsResponse> {
    try {
      console.log('📋 Récupération des listes Pronto...');

      const response = await fetch(buildApiUrl(API_CONFIG.PRONTO.LISTS), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Listes récupérées:', result.total, 'liste(s)');

      return result;
    } catch (error) {
      console.error('Error fetching Pronto lists:', error);
      throw error;
    }
  }

  // Récupérer le statut des services Pronto
  static async getServiceStatus(): Promise<any> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.PRONTO.STATUS));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching service status:', error);
      throw error;
    }
  }

  // Récupérer les détails d'une recherche spécifique avec ses leads
  static async getSearchWithLeads(searchId: string): Promise<ProntoSearchResponse> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.PRONTO.SEARCH_DETAILS(searchId)));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching search with leads:', error);
      throw error;
    }
  }

  // Récupérer les leads d'une recherche avec pagination
  static async getSearchLeads(searchId: string, page: number = 1, limit: number = 100): Promise<ProntoSearchResponse> {
    try {
      const url = buildApiUrl(API_CONFIG.PRONTO.SEARCH_LEADS(searchId));
      console.log(`🔍 Tentative de chargement: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`❌ Erreur ${response.status} pour ${url}`);
        console.error(`📄 Réponse:`, await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Succès pour ${searchId}: ${data.leads?.length || 0} entreprises chargées`);
      
      // Debug: Afficher la structure des données pour la première entreprise
      if (data.leads && data.leads.length > 0) {
        const firstLead = data.leads[0];
        console.log('🔍 Structure des données de la première entreprise:', {
          company: firstLead.company,
          lead: firstLead.lead,
          companyProfilePicture: firstLead.company?.company_profile_picture,
          leadProfileImage: firstLead.lead?.profile_image_url
        });
      }
      
      return data;
    } catch (error) {
      console.error(`❌ Error fetching search leads for ${searchId}:`, error);
      throw error;
    }
  }

  // Workflow complet pour récupérer toutes les recherches avec leurs leads
  static async getAllSearchesComplete(includeLeads: boolean = true, leadsPerSearch: number = 50): Promise<any> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.PRONTO.ALL_SEARCHES_COMPLETE(includeLeads, leadsPerSearch)));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching complete searches:', error);
      throw error;
    }
  }

  // Recherche globale avec filtres
  static async searchLeads(filters: ProntoFilters): Promise<ProntoGlobalResponse> {
    try {
      console.log('🔍 Recherche Pronto avec filtres:', filters);

      const params = new URLSearchParams();

      if (filters.company_filter) {
        params.append('company_filter', filters.company_filter);
      }
      if (filters.title_filter) {
        params.append('title_filter', filters.title_filter);
      }
      if (filters.lead_location_filter) {
        params.append('lead_location_filter', filters.lead_location_filter);
      }
      if (filters.employee_range_filter) {
        params.append('employee_range_filter', filters.employee_range_filter);
      }
      if (filters.company_location_filter) {
        params.append('company_location_filter', filters.company_location_filter);
      }
      if (filters.industry_filter) {
        params.append('industry_filter', filters.industry_filter);
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/pronto/workflow/global-results?${params.toString()}`
      );

      console.log('✅ Réponse Pronto reçue:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la recherche Pronto:', error);
      throw error;
    }
  }

  // Méthode utilitaire pour formater les filtres depuis le formulaire
  static formatFiltersFromForm(formData: {
    jobTitles: string;
    companySize: string[];
    leadLocation: string;
    companyLocation: string;
    industries: string;
    limit?: number;
  }): ProntoFilters {
    const filters: ProntoFilters = {};

    if (formData.jobTitles.trim()) {
      filters.title_filter = formData.jobTitles.trim();
    }

    if (formData.companySize.length > 0) {
      filters.employee_range_filter = formData.companySize.join(',');
    }

    if (formData.leadLocation.trim()) {
      filters.lead_location_filter = formData.leadLocation.trim();
    }

    if (formData.companyLocation.trim()) {
      filters.company_location_filter = formData.companyLocation.trim();
    }

    if (formData.industries.trim()) {
      filters.industry_filter = formData.industries.trim();
    }

    if (formData.limit) {
      filters.limit = formData.limit;
    }

    return filters;
  }

  // Méthode pour obtenir les options de taille d'entreprise
  static getCompanySizeOptions(): { value: string; label: string }[] {
    return [
      { value: '1-10', label: '1-10 employés' },
      { value: '11-50', label: '11-50 employés' },
      { value: '51-200', label: '51-200 employés' },
      { value: '201-500', label: '201-500 employés' },
      { value: '501-1000', label: '501-1000 employés' },
      { value: '1001-5000', label: '1001-5000 employés' },
      { value: '5001-10000', label: '5001-10000 employés' },
      { value: '10000+', label: '10000+ employés' }
    ];
  }
}