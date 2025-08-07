import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://prosperian.onrender.com';

export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: string;
    interval_count: number;
  };
  active: boolean;
  metadata: Record<string, any>;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  active: boolean;
  metadata: Record<string, any>;
  prices: StripePrice[];
}

export interface ProductsResponse {
  success: boolean;
  products: StripeProduct[];
}

export interface CheckoutSessionResponse {
  success: boolean;
  sessionId: string;
}

export interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

class ProductsService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Récupère tous les produits actifs et leurs prix depuis Stripe
   */
  async getProducts(): Promise<ProductsResponse> {
    try {
      const response = await this.api.get<ProductsResponse>('/products');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw new Error('Impossible de récupérer les produits');
    }
  }

  /**
   * Crée une session de checkout Stripe pour un abonnement
   */
  async createCheckoutSession(data: CreateCheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    try {
      const response = await this.api.post<CheckoutSessionResponse>('/products/create-checkout-session', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la session de checkout:', error);
      throw new Error('Impossible de créer la session de checkout');
    }
  }

  /**
   * Formate le prix en euros
   */
  formatPrice(amount: number, currency: string = 'eur'): string {
    if (currency.toLowerCase() === 'eur') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount / 100); // Stripe stocke les montants en centimes
    }
    return `${amount / 100} ${currency.toUpperCase()}`;
  }

  /**
   * Formate l'intervalle de facturation
   */
  formatBillingInterval(recurring: { interval: string; interval_count: number }): string {
    const { interval, interval_count } = recurring;
    
    if (interval === 'month') {
      return interval_count === 1 ? '/mois' : `/${interval_count} mois`;
    } else if (interval === 'year') {
      return interval_count === 1 ? '/an' : `/${interval_count} ans`;
    } else if (interval === 'week') {
      return interval_count === 1 ? '/semaine' : `/${interval_count} semaines`;
    } else if (interval === 'day') {
      return interval_count === 1 ? '/jour' : `/${interval_count} jours`;
    }
    
    return `/${interval_count} ${interval}`;
  }
}

export const productsService = new ProductsService();
export default productsService; 