import { API_CONFIG } from '@config/api';

export interface GooglePlacesSearchQuery {
  activity: string;
  location?: string;
  limit?: number;
  format?: 'raw' | 'normalized';
}

export interface GooglePlacesAdvancedQuery {
  activities: string[];
  location?: string;
  limit?: number;
  filters?: {
    min_rating?: number;
    min_reviews?: number;
    city?: string;
  };
  combine_results?: boolean;
}

export interface GooglePlacesResult {
  // Identifiants
  google_place_id: string;
  siren: string | null;
  siret: string | null;
  
  // Informations générales
  nom_complet: string;
  raison_sociale: string;
  activite_principale: string;
  code_naf: string | null;
  
  // Adresse
  adresse_complete: string;
  code_postal: string | null;
  ville: string | null;
  departement: string | null;
  
  // Contact
  telephone: string | null;
  site_web: string | null;
  email: string | null;
  
  // Données Google spécifiques
  google_rating: number | null;
  google_reviews_count: number | null;
  google_categories: string[];
  google_hours: any | null;
  google_photos: string[];
  
  // Coordonnées géographiques
  latitude: number | null;
  longitude: number | null;
  
  // Métadonnées
  source: string;
  date_extraction: string;
  searched_activity?: string;
  
  // Champs manquants
  chiffre_affaires: number | null;
  effectif: number | null;
  date_creation: string | null;
  forme_juridique: string | null;
  dirigeants: any[];
}

export interface GooglePlacesResponse {
  success: boolean;
  query: any;
  total_results: number;
  results: GooglePlacesResult[];
  metadata: {
    source: string;
    timestamp: string;
    processing_time?: number | null;
    activities_searched?: number;
    format?: string;
  };
}

export interface GooglePlacesCategory {
  name: string;
  value: string;
}

export interface GooglePlacesCategoriesResponse {
  success: boolean;
  total_categories: number;
  categories: {
    [group: string]: GooglePlacesCategory[];
  };
  metadata: {
    source: string;
    timestamp: string;
  };
}

class GooglePlacesService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/api/google-places`;
  }

  /**
   * Rechercher des entreprises par activité via Google Places
   */
  async searchByActivity(query: GooglePlacesSearchQuery): Promise<GooglePlacesResponse> {
    try {
      console.log('🔍 Recherche Google Places:', query);

      const params = new URLSearchParams({
        activity: query.activity,
        location: query.location || 'France',
        limit: (query.limit || 50).toString(),
        format: query.format || 'normalized'
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la recherche Google Places');
      }

      const data = await response.json();
      console.log(`✅ ${data.total_results} entreprises trouvées via Google Places`);
      
      return data;
    } catch (error) {
      console.error('❌ Erreur GooglePlacesService.searchByActivity:', error);
      throw error;
    }
  }

  /**
   * Recherche avancée avec multiple activités et filtres
   */
  async searchAdvanced(query: GooglePlacesAdvancedQuery): Promise<GooglePlacesResponse> {
    try {
      console.log('🔍 Recherche avancée Google Places:', query);

      const response = await fetch(`${this.baseUrl}/search-advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la recherche avancée Google Places');
      }

      const data = await response.json();
      console.log(`✅ ${data.total_results} entreprises trouvées via recherche avancée`);
      
      return data;
    } catch (error) {
      console.error('❌ Erreur GooglePlacesService.searchAdvanced:', error);
      throw error;
    }
  }

  /**
   * Obtenir les catégories d'activités disponibles
   */
  async getCategories(): Promise<GooglePlacesCategoriesResponse> {
    try {
      console.log('📋 Récupération des catégories Google Places');

      const response = await fetch(`${this.baseUrl}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des catégories');
      }

      const data = await response.json();
      console.log(`✅ ${data.total_categories} catégories récupérées`);
      
      return data;
    } catch (error) {
      console.error('❌ Erreur GooglePlacesService.getCategories:', error);
      throw error;
    }
  }

  /**
   * Rechercher des activités par mot-clé dans les catégories
   */
  async searchCategories(keyword: string): Promise<GooglePlacesCategory[]> {
    try {
      const categoriesResponse = await this.getCategories();
      const allCategories: GooglePlacesCategory[] = [];

      // Aplatir toutes les catégories
      Object.values(categoriesResponse.categories).forEach(group => {
        allCategories.push(...group);
      });

      // Filtrer par mot-clé
      const filteredCategories = allCategories.filter(category =>
        category.name.toLowerCase().includes(keyword.toLowerCase()) ||
        category.value.toLowerCase().includes(keyword.toLowerCase())
      );

      console.log(`🔍 ${filteredCategories.length} catégories trouvées pour "${keyword}"`);
      return filteredCategories;
    } catch (error) {
      console.error('❌ Erreur GooglePlacesService.searchCategories:', error);
      throw error;
    }
  }

  /**
   * Convertir les résultats Google Places vers le format EntrepriseApiResult
   */
  convertToBusinessFormat(googleResult: GooglePlacesResult): any {
    return {
      // Mapping vers le format utilisé dans l'application
      siren: googleResult.siren || `google_${googleResult.google_place_id}`,
      nom_complet: googleResult.nom_complet,
      raison_sociale: googleResult.raison_sociale,
      activite_principale: googleResult.activite_principale,
      adresse_complete: googleResult.adresse_complete,
      code_postal: googleResult.code_postal,
      ville: googleResult.ville,
      telephone: googleResult.telephone,
      site_web: googleResult.site_web,
      
      // Données spécifiques Google
      google_place_id: googleResult.google_place_id,
      google_rating: googleResult.google_rating,
      google_reviews_count: googleResult.google_reviews_count,
      google_categories: googleResult.google_categories,
      google_photos: googleResult.google_photos,
      
      // Géolocalisation
      latitude: googleResult.latitude,
      longitude: googleResult.longitude,
      
      // Source
      source: 'google_places',
      date_extraction: googleResult.date_extraction,
      
      // Champs optionnels
      chiffre_affaires: googleResult.chiffre_affaires,
      effectif: googleResult.effectif,
      date_creation: googleResult.date_creation,
      forme_juridique: googleResult.forme_juridique
    };
  }

  /**
   * Rechercher et convertir directement au format business
   */
  async searchAndConvert(query: GooglePlacesSearchQuery): Promise<any[]> {
    try {
      const response = await this.searchByActivity(query);
      return response.results.map(result => this.convertToBusinessFormat(result));
    } catch (error) {
      console.error('❌ Erreur GooglePlacesService.searchAndConvert:', error);
      throw error;
    }
  }
}

export const googlePlacesService = new GooglePlacesService(); 