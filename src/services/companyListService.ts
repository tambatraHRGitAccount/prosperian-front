// Service pour récupérer la liste des entreprises
export interface CompanyListItem {
  nom_complet: string;
  nom_raison_sociale: string;
  siren: string;
}

export interface CompanyListResponse {
  results: CompanyListItem[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}

class CompanyListService {
  private baseUrl = 'http://localhost:4000';

  async getCompanies(
    page: number = 1,
    perPage: number = 10,
    searchTerm?: string
  ): Promise<CompanyListResponse> {
    try {
      let url = `${this.baseUrl}/api/search?page=${page}&per_page=${perPage}&section_activite_principale=A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U`;
      
      if (searchTerm && searchTerm.trim()) {
        url += `&q=${encodeURIComponent(searchTerm.trim())}`;
      }

      const response = await fetch(url, {
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Extraire uniquement les informations nécessaires pour la liste
      const companies: CompanyListItem[] = data.results.map((company: any) => ({
        nom_complet: company.nom_complet,
        nom_raison_sociale: company.nom_raison_sociale,
        siren: company.siren
      }));

      return {
        results: companies,
        total_results: data.total_results,
        page: data.page,
        per_page: data.per_page,
        total_pages: data.total_pages
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des entreprises:', error);
      throw error;
    }
  }

  async searchCompanies(searchTerm: string, page: number = 1, perPage: number = 10): Promise<CompanyListResponse> {
    return this.getCompanies(page, perPage, searchTerm);
  }
}

export const companyListService = new CompanyListService(); 