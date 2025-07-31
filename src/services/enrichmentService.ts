const API_BASE_URL = 'http://localhost:4000/api';

export interface Enrichment {
  id: string;
  name: string;
  status: string;
  type: string;
  date_created: string;
  description?: string;
  created_by: string;
}

export interface LeadEnrich {
  id: string;
  enrichment_id: string;
  firstname: string;
  lastname: string;
  company_name?: string;
  domain?: string;
  linkedin_url?: string;
  date_creation: string;
}

export interface CreateEnrichmentData {
  name: string;
  type: string;
  description?: string;
}

export interface CreateLeadEnrichData {
  firstname: string;
  lastname: string;
  company_name?: string;
  domain?: string;
  linkedin_url?: string;
}

export interface EnrichmentResponse {
  success: boolean;
  message: string;
  enrichment?: Enrichment;
  enrichments?: Enrichment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeadEnrichResponse {
  success: boolean;
  message: string;
  leadEnrich?: LeadEnrich;
  leads?: LeadEnrich[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class EnrichmentService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Créer un nouvel enrichment
  async createEnrichment(data: CreateEnrichmentData): Promise<EnrichmentResponse> {
    const response = await fetch(`${API_BASE_URL}/enrichment`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de la création de l\'enrichment');
    }

    return result;
  }

  // Récupérer tous les enrichments de l'utilisateur
  async getEnrichments(page: number = 1, limit: number = 10, status?: string): Promise<EnrichmentResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (status) {
      params.append('status', status);
    }

    const response = await fetch(`${API_BASE_URL}/enrichment?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de la récupération des enrichments');
    }

    return result;
  }

  // Récupérer un enrichment par ID
  async getEnrichment(id: string): Promise<EnrichmentResponse> {
    const response = await fetch(`${API_BASE_URL}/enrichment/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de la récupération de l\'enrichment');
    }

    return result;
  }

  // Mettre à jour un enrichment
  async updateEnrichment(id: string, data: Partial<CreateEnrichmentData>): Promise<EnrichmentResponse> {
    const response = await fetch(`${API_BASE_URL}/enrichment/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de la mise à jour de l\'enrichment');
    }

    return result;
  }

  // Supprimer un enrichment
  async deleteEnrichment(id: string): Promise<EnrichmentResponse> {
    const response = await fetch(`${API_BASE_URL}/enrichment/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de la suppression de l\'enrichment');
    }

    return result;
  }

  // Ajouter un lead enrichi à un enrichment
  async addLeadEnrich(enrichmentId: string, data: CreateLeadEnrichData): Promise<LeadEnrichResponse> {
    const response = await fetch(`${API_BASE_URL}/enrichment/${enrichmentId}/leads`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de l\'ajout du lead enrichi');
    }

    return result;
  }

  // Récupérer tous les leads d'un enrichment
  async getLeadsEnrich(enrichmentId: string, page: number = 1, limit: number = 10): Promise<LeadEnrichResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(`${API_BASE_URL}/enrichment/${enrichmentId}/leads?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de la récupération des leads enrichis');
    }

    return result;
  }

  // Ajouter des leads en lot
  async addLeadsEnrichBulk(enrichmentId: string, leads: CreateLeadEnrichData[]): Promise<LeadEnrichResponse> {
    const response = await fetch(`${API_BASE_URL}/enrichment/${enrichmentId}/leads/bulk`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ leads })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de l\'ajout des leads enrichis en lot');
    }

    return result;
  }
}

const enrichmentService = new EnrichmentService();
export default enrichmentService; 