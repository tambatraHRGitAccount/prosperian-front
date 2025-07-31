interface ApifyCredentials {
  email: string;
  password: string;
}

interface ApifySearchParams {
  enseigne: string;
  location?: string;
  maxResults?: number;
  includeReviews?: boolean;
}

interface ApifyResult {
  title: string;
  address: string;
  phone?: string;
  website?: string;
  category: string;
  rating?: number;
  reviewsCount?: number;
  latitude?: number;
  longitude?: number;
  placeId: string;
  isAdvertisement?: boolean;
  description?: string;
  imageUrls?: string[];
}

interface ApifyResponse {
  results: ApifyResult[];
  totalResults: number;
  searchQuery: string;
}

class ApifyService {
  private credentials: ApifyCredentials = {
    email: 'corenthin@buffard.net',
    password: '5b#TUGy77T_*p#x'
  };

  private baseUrl = 'https://api.apify.com/v2';
  private actorId = 'compass/crawler-google-places'; // Format correct avec /

  /**
   * Recherche d'enseignes avec choix automatique entre API réelle et version simplifiée
   */
  async searchEnseigne(enseigne: string, location?: string): Promise<ApifyResponse> {
    try {
      // Essayer d'abord la vraie API Apify directement
      console.log(`🚀 Tentative de recherche via API Apify réelle pour: "${enseigne}"`);
      const realApiResult = await this.searchByEnseigne({ enseigne, location });
      
      // Marquer les résultats comme provenant de l'API réelle
      console.log(`✅ SUCCÈS API RÉELLE - ${realApiResult.results.length} résultats trouvés pour "${enseigne}"`);
      realApiResult.results = realApiResult.results.map(result => ({
        ...result,
        // Marqueur pour identifier les données réelles
        _dataSource: 'APIFY_REAL_API',
        description: `[DONNÉES RÉELLES] ${result.description}`
      }));
      
      return {
        ...realApiResult,
        _dataSource: 'APIFY_REAL_API'
      } as any;
      
    } catch (error) {
      console.warn(`⚠️ ÉCHEC API APIFY DIRECTE - Erreur:`, error);
      
      // Essayer via l'endpoint serveur si l'appel direct échoue (CORS/etc)
      try {
        console.log(`🔄 TENTATIVE VIA ENDPOINT SERVEUR pour "${enseigne}"`);
        const serverResult = await this.searchEnseigneViaServer(enseigne, location);
        
        console.log(`✅ SUCCÈS VIA SERVEUR - ${serverResult.results.length} résultats trouvés pour "${enseigne}"`);
        serverResult.results = serverResult.results.map(result => ({
          ...result,
          _dataSource: 'APIFY_VIA_SERVER',
          description: `[DONNÉES RÉELLES VIA SERVEUR] ${result.description}`
        }));
        
        return {
          ...serverResult,
          _dataSource: 'APIFY_VIA_SERVER'
        } as any;
        
      } catch (serverError) {
        console.warn(`⚠️ ÉCHEC ENDPOINT SERVEUR - Erreur:`, serverError);
        console.log(`🔄 PASSAGE EN MODE DONNÉES FICTIVES pour "${enseigne}"`);
        
        // En dernier recours, utiliser la version simplifiée
        const mockResult = await this.searchEnseigneSimplified(enseigne, location);
        
        // Marquer clairement les résultats comme étant des données de test
        mockResult.results = mockResult.results.map(result => ({
          ...result,
          // Marqueur pour identifier les données fictives
          _dataSource: 'MOCK_DATA',
          description: `[DONNÉES FICTIVES POUR TEST] ${result.description}`
        }));
        
        return {
          ...mockResult,
          _dataSource: 'MOCK_DATA'
        } as any;
      }
    }
  }

  /**
   * Recherche d'entreprises par enseigne/franchise via Apify Google Places Crawler
   */
  async searchByEnseigne(params: ApifySearchParams): Promise<ApifyResponse> {
    try {
      console.log(`🔍 Recherche Apify pour enseigne: "${params.enseigne}"`);
      
      // Vérifier le token avant tout
      const token = await this.getApiToken();
      console.log(`🔑 Token API disponible: ${token.substring(0, 20)}...`);
      
      // Configuration de la recherche Apify
      const searchInput = {
        searchStringsArray: [`${params.enseigne} ${params.location || 'France'}`],
        locationQuery: params.location || 'France',
        maxCrawledPlacesPerSearch: params.maxResults || 50,
        includeReviews: params.includeReviews || false,
        includeImages: true,
        includeOpeningHours: true,
        includePeopleAlsoSearch: false,
        maxReviews: params.includeReviews ? 10 : 0,
        reviewsSort: 'newest',
        language: 'fr',
        exportPlaceUrls: false,
        additionalInfo: true,
        onlyDataFromSearchPage: false
      };

      console.log(`📋 Configuration Apify:`, searchInput);
      console.log(`🌐 URL API: ${this.baseUrl}/acts/${this.actorId}/runs`);

      // Appel à l'API Apify pour démarrer le run
      const runResponse = await fetch(`${this.baseUrl}/acts/${encodeURIComponent(this.actorId)}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(searchInput)
      });

      console.log(`📡 Réponse API Status: ${runResponse.status} ${runResponse.statusText}`);
      
      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        console.error(`❌ Erreur détaillée API:`, errorText);
        throw new Error(`Erreur Apify: ${runResponse.status} ${runResponse.statusText} - ${errorText}`);
      }

      const runData = await runResponse.json();
      console.log(`🚀 Run créé avec ID:`, runData.data.id);
      const runId = runData.data.id;

      // Attendre que le run se termine
      const results = await this.waitForRunCompletion(runId);
      
      // Transformer les résultats au format attendu
      const transformedResults: ApifyResult[] = results.map((item: any) => ({
        title: item.title || item.name || '',
        address: item.address || '',
        phone: item.phoneNumber || item.phone || '',
        website: item.website || item.url || '',
        category: item.categoryName || item.category || '',
        rating: item.totalScore || item.rating || 0,
        reviewsCount: item.reviewsCount || 0,
        latitude: item.location?.lat || item.latitude,
        longitude: item.location?.lng || item.longitude,
        placeId: item.placeId || item.id || '',
        isAdvertisement: item.isAdvertisement || false,
        description: item.description || '',
        imageUrls: item.imageUrls || []
      }));

      return {
        results: transformedResults,
        totalResults: transformedResults.length,
        searchQuery: `${params.enseigne} ${params.location || 'France'}`
      };

    } catch (error) {
      console.error('❌ Erreur détaillée lors de la recherche Apify:', error);
      console.error('📊 Type d\'erreur:', typeof error);
      console.error('📄 Message d\'erreur:', error instanceof Error ? error.message : 'Erreur inconnue');
      throw new Error(`Erreur de recherche Apify: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Recherche de franchises populaires pour suggestions
   */
  async getPopularFranchises(): Promise<string[]> {
    // Liste des enseignes/franchises populaires en France
    return [
      "McDonald's",
      "Carrefour",
      "Auchan", 
      "Leclerc",
      "Intermarché",
      "Casino",
      "Monoprix",
      "Franprix",
      "Subway",
      "KFC",
      "Burger King",
      "Quick",
      "Pizza Hut",
      "Domino's Pizza",
      "Boulanger",
      "Darty",
      "Fnac",
      "BUT",
      "Conforama",
      "Ikea",
      "Leroy Merlin",
      "Castorama",
      "Bricomarché",
      "Mr. Bricolage",
      "Point P",
      "Renault",
      "Peugeot",
      "Citroën",
      "Ford",
      "Volkswagen",
      "BMW",
      "Mercedes",
      "Audi",
      "Toyota",
      "Nissan",
      "Hyundai",
      "Kia",
      "Fiat",
      "Opel",
      "Dacia",
      "Skoda",
      "Seat",
      "Volvo",
      "Mazda",
      "Honda",
      "Mitsubishi",
      "Suzuki",
      "Pharmacie",
      "Boulangerie",
      "Tabac",
      "Bureau de poste",
      "Banque Populaire",
      "Crédit Agricole",
      "BNP Paribas",
      "Société Générale",
      "LCL",
      "CIC",
      "Banque Postale",
      "Crédit Mutuel",
      "Caisse d'Épargne",
      "HSBC",
      "ING",
      "Boursorama",
      "Orange",
      "SFR",
      "Bouygues Telecom",
      "Free",
      "La Poste Mobile"
    ];
  }

  /**
   * Obtenir le token API Apify (simulation - dans un vrai cas, il faudrait gérer l'authentification)
   */
  private async getApiToken(): Promise<string> {
    // Dans un environnement de production, il faudrait gérer l'authentification Apify
    // Pour le moment, on utilise un token d'exemple ou on simule l'appel
    // Il faudra que le client configure son token API Apify
    
    // Vérifier si le token est en variable d'environnement (Vite utilise import.meta.env)
    const token = (import.meta.env?.VITE_APIFY_TOKEN as string) || 
                  (typeof process !== 'undefined' ? process.env?.REACT_APP_APIFY_TOKEN || process.env?.APIFY_TOKEN : undefined);
    
    if (token) {
      return token;
    }
    
    // Token mis à jour fourni par l'utilisateur
    const temporaryToken = 'apify_api_JzzNKSwZReD5T2PO3hNVcJas1ZcjVp01zVOo';
    
    if (!temporaryToken) {
      throw new Error('Token API Apify non configuré. Veuillez définir VITE_APIFY_TOKEN dans vos variables d\'environnement.');
    }
    
    return temporaryToken;
  }

  /**
   * Attendre que le run Apify se termine
   */
  private async waitForRunCompletion(runId: string, maxWaitTime: number = 60000): Promise<any[]> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 secondes

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const statusResponse = await fetch(`${this.baseUrl}/actor-runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${await this.getApiToken()}`
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`Erreur lors de la vérification du statut: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        const status = statusData.data.status;

        if (status === 'SUCCEEDED') {
          // Récupérer les résultats
          const resultsResponse = await fetch(`${this.baseUrl}/actor-runs/${runId}/dataset/items`, {
            headers: {
              'Authorization': `Bearer ${await this.getApiToken()}`
            }
          });

          if (!resultsResponse.ok) {
            throw new Error(`Erreur lors de la récupération des résultats: ${resultsResponse.status}`);
          }

          return await resultsResponse.json();
        } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
          throw new Error(`Le run Apify a échoué avec le statut: ${status}`);
        }

        // Attendre avant le prochain poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Erreur lors de l\'attente du run:', error);
        throw error;
      }
    }

    throw new Error('Timeout: Le run Apify a pris trop de temps à se terminer');
  }

  /**
   * Recherche simplifiée pour test/développement
   */
  async searchEnseigneSimplified(enseigne: string, location?: string): Promise<ApifyResponse> {
    // Version simplifiée pour test sans vraie API Apify
    console.log(`🔍 Recherche simplifiée pour enseigne: "${enseigne}" dans "${location || 'France'}"`);
    
    // Générer plusieurs résultats factices pour simuler une vraie recherche
    const baseLocations = location ? [location] : ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'];
    const mockResults: ApifyResult[] = [];
    
    // Créer 3-8 résultats par enseigne selon la popularité
    const numberOfResults = enseigne.toLowerCase().includes('carrefour') ? 8 :
                           enseigne.toLowerCase().includes('mcdonald') ? 6 :
                           enseigne.toLowerCase().includes('pharmacie') ? 12 :
                           enseigne.toLowerCase().includes('boulangerie') ? 15 :
                           Math.floor(Math.random() * 6) + 3; // 3-8 résultats aléatoires
    
    for (let i = 0; i < numberOfResults; i++) {
      const city = baseLocations[i % baseLocations.length];
      const quartiers = ['Centre-ville', 'Zone Commerciale', 'Quartier Nord', 'Quartier Sud', 'Centre Commercial'];
      const quartier = quartiers[i % quartiers.length];
      
      mockResults.push({
        title: `${enseigne} ${quartier}`,
        address: `${Math.floor(Math.random() * 200) + 1} ${['Rue', 'Avenue', 'Boulevard'][i % 3]} ${['de la République', 'Victor Hugo', 'Jean Jaurès', 'des Champs', 'du Commerce'][i % 5]}, ${city}, France`,
        phone: `+33 ${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`,
        website: i === 0 ? `https://www.${enseigne.toLowerCase().replace(/[^a-z]/g, '')}.fr` : undefined,
        category: this.getCategoryForEnseigne(enseigne),
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Rating entre 3.0 et 5.0
        reviewsCount: Math.floor(Math.random() * 500) + 50,
        latitude: 48.8566 + (Math.random() - 0.5) * 0.1,
        longitude: 2.3522 + (Math.random() - 0.5) * 0.1,
        placeId: `mock-place-id-${enseigne}-${i}`,
        isAdvertisement: Math.random() < 0.1, // 10% de chances d'être une pub
        description: `${enseigne} ${quartier} - ${this.getDescriptionForEnseigne(enseigne)}`,
        imageUrls: []
      });
    }

    return {
      results: mockResults,
      totalResults: mockResults.length,
      searchQuery: `${enseigne} ${location || 'France'}`
    };
  }

  /**
   * Recherche via l'endpoint serveur (fallback pour problèmes CORS)
   */
  async searchEnseigneViaServer(enseigne: string, location?: string): Promise<ApifyResponse> {
    const response = await fetch('/api/google-places/search-enseigne', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enseigne,
        location: location || 'France'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erreur serveur: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Erreur serveur: ${data.error}`);
    }

    return {
      results: data.results,
      totalResults: data.totalResults,
      searchQuery: data.searchQuery
    };
  }

  /**
   * Obtenir la catégorie appropriée selon l'enseigne
   */
  private getCategoryForEnseigne(enseigne: string): string {
    const enseigneLower = enseigne.toLowerCase();
    
    if (enseigneLower.includes('carrefour') || enseigneLower.includes('leclerc') || enseigneLower.includes('auchan')) {
      return 'Grande surface / Hypermarché';
    }
    if (enseigneLower.includes('mcdonald') || enseigneLower.includes('kfc') || enseigneLower.includes('burger')) {
      return 'Restauration rapide';
    }
    if (enseigneLower.includes('pharmacie')) {
      return 'Pharmacie';
    }
    if (enseigneLower.includes('boulangerie')) {
      return 'Boulangerie-Pâtisserie';
    }
    if (enseigneLower.includes('banque') || enseigneLower.includes('crédit')) {
      return 'Services bancaires';
    }
    if (enseigneLower.includes('orange') || enseigneLower.includes('sfr') || enseigneLower.includes('bouygues')) {
      return 'Télécommunications';
    }
    
    return 'Commerce de détail';
  }

  /**
   * Obtenir une description appropriée selon l'enseigne
   */
  private getDescriptionForEnseigne(enseigne: string): string {
    const enseigneLower = enseigne.toLowerCase();
    
    if (enseigneLower.includes('carrefour')) {
      return 'Hypermarché proposant alimentation, électroménager, vêtements et plus';
    }
    if (enseigneLower.includes('mcdonald')) {
      return 'Restaurant de restauration rapide spécialisé dans les burgers';
    }
    if (enseigneLower.includes('pharmacie')) {
      return 'Officine pharmaceutique avec conseils santé et médicaments';
    }
    if (enseigneLower.includes('boulangerie')) {
      return 'Boulangerie artisanale avec pain frais, viennoiseries et pâtisseries';
    }
    
    return 'Établissement commercial de la franchise';
  }
}

export const apifyService = new ApifyService();
export type { ApifySearchParams, ApifyResult, ApifyResponse }; 