const API_BASE_URL = 'http://localhost:4000/api';

export interface Subscription {
  id: string;
  name: string;
  monthly_credits: number;
  price: number;
  description?: string;
  is_active: boolean;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  description?: string;
  is_active: boolean;
}

export interface PricingResponse {
  success: boolean;
  subscriptions: Subscription[];
  credit_packs: CreditPack[];
}

class PricingService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Récupérer tous les abonnements et packs de crédits
  async getPricing(): Promise<PricingResponse> {
    try {
      const [subscriptionsResponse, creditPacksResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/payment/subscriptions`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        }),
        fetch(`${API_BASE_URL}/payment/credit-packs`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        })
      ]);

      if (!subscriptionsResponse.ok || !creditPacksResponse.ok) {
        throw new Error('Erreur lors de la récupération des tarifs');
      }

      const [subscriptionsData, creditPacksData] = await Promise.all([
        subscriptionsResponse.json(),
        creditPacksResponse.json()
      ]);

      return {
        success: true,
        subscriptions: subscriptionsData.subscriptions || [],
        credit_packs: creditPacksData.credit_packs || []
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des tarifs:', error);
      throw error;
    }
  }

  // Récupérer seulement les abonnements
  async getSubscriptions(): Promise<Subscription[]> {
    const response = await fetch(`${API_BASE_URL}/payment/subscriptions`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des abonnements');
    }

    const data = await response.json();
    return data.subscriptions || [];
  }

  // Récupérer seulement les packs de crédits
  async getCreditPacks(): Promise<CreditPack[]> {
    const response = await fetch(`${API_BASE_URL}/payment/credit-packs`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des packs de crédits');
    }

    const data = await response.json();
    return data.credit_packs || [];
  }
}

export default new PricingService(); 