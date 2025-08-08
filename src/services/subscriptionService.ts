const API_BASE_URL = 'http://localhost:4000/api';

export interface Subscription {
  id: string;
  name: string;
  monthly_credits: number;
  price: number;
  stripe_price_id?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  stripe_price_id?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  cancelled_at?: string;
  updated_at: string;
  subscriptions?: Subscription;
  user?: {
    email: string;
    prenom?: string;
    nom?: string;
  };
}

export interface Transaction {
  id: string;
  user_id: string;
  pack_id?: string;
  stripe_payment_intent_id?: string;
  amount: number;
  credits: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  type: 'credit_pack' | 'subscription';
  created_at: string;
  completed_at?: string;
  failed_at?: string;
  error_message?: string;
  credit_packs?: CreditPack;
  user?: {
    email: string;
    prenom?: string;
    nom?: string;
  };
}

export interface SubscriptionsResponse {
  success: boolean;
  subscriptions: Subscription[];
}

export interface CreditPacksResponse {
  success: boolean;
  credit_packs: CreditPack[];
}

export interface UserSubscriptionsResponse {
  success: boolean;
  subscriptions: UserSubscription[];
}

export interface TransactionsResponse {
  success: boolean;
  transactions: Transaction[];
}

export interface CreateSubscriptionData {
  name: string;
  monthly_credits: number;
  price: number;
  description?: string;
  stripe_price_id?: string;
}

export interface CreateCreditPackData {
  name: string;
  credits: number;
  price: number;
  description?: string;
  stripe_price_id?: string;
}

class SubscriptionService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // ===== GESTION DES ABONNEMENTS =====

  // Récupérer tous les abonnements
  async getAllSubscriptions(): Promise<SubscriptionsResponse> {
    const response = await fetch(`${API_BASE_URL}/payment/subscriptions`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération des abonnements');
    }

    return data;
  }

  // Créer un nouvel abonnement
  async createSubscription(subscriptionData: CreateSubscriptionData): Promise<{ success: boolean; subscription: Subscription }> {
    const response = await fetch(`${API_BASE_URL}/subscription`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(subscriptionData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la création de l\'abonnement');
    }

    return { success: true, subscription: data };
  }

  // Mettre à jour un abonnement
  async updateSubscription(id: string, subscriptionData: Partial<CreateSubscriptionData>): Promise<{ success: boolean; subscription: Subscription }> {
    const response = await fetch(`${API_BASE_URL}/subscription/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(subscriptionData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la mise à jour de l\'abonnement');
    }

    return { success: true, subscription: data };
  }

  // Supprimer un abonnement
  async deleteSubscription(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/subscription/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Erreur lors de la suppression de l\'abonnement');
    }

    return { success: true, message: 'Abonnement supprimé avec succès' };
  }

  // ===== GESTION DES PACKS DE CRÉDITS =====

  // Récupérer tous les packs de crédits
  async getAllCreditPacks(): Promise<CreditPacksResponse> {
    const response = await fetch(`${API_BASE_URL}/payment/credit-packs`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération des packs de crédits');
    }

    return data;
  }

  // Créer un nouveau pack de crédits
  async createCreditPack(packData: CreateCreditPackData): Promise<{ success: boolean; credit_pack: CreditPack }> {
    const response = await fetch(`${API_BASE_URL}/credit-packs`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(packData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la création du pack de crédits');
    }

    return { success: true, credit_pack: data };
  }

  // Mettre à jour un pack de crédits
  async updateCreditPack(id: string, packData: Partial<CreateCreditPackData>): Promise<{ success: boolean; credit_pack: CreditPack }> {
    const response = await fetch(`${API_BASE_URL}/credit-packs/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(packData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la mise à jour du pack de crédits');
    }

    return { success: true, credit_pack: data };
  }

  // Supprimer un pack de crédits
  async deleteCreditPack(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/credit-packs/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Erreur lors de la suppression du pack de crédits');
    }

    return { success: true, message: 'Pack de crédits supprimé avec succès' };
  }

  // ===== GESTION DES ABONNEMENTS UTILISATEURS =====

  // Récupérer tous les abonnements utilisateurs
  async getAllUserSubscriptions(): Promise<UserSubscriptionsResponse> {
    const response = await fetch(`${API_BASE_URL}/user-subscriptions`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération des abonnements utilisateurs');
    }

    return data;
  }

  // ===== GESTION DES TRANSACTIONS =====

  // Récupérer toutes les transactions
  async getAllTransactions(): Promise<TransactionsResponse> {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération des transactions');
    }

    return data;
  }

  // ===== STATISTIQUES =====

  // Récupérer les statistiques des abonnements
  async getSubscriptionStats(): Promise<{
    success: boolean;
    stats: {
      total_subscriptions: number;
      active_subscriptions: number;
      total_revenue: number;
      monthly_revenue: number;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/subscription/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération des statistiques');
    }

    return data;
  }
}

export default new SubscriptionService(); 