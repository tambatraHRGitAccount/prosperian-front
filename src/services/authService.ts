const API_BASE_URL = 'https://prosperiantest1.onrender.com/api';

export interface User {
  id: string;
  email: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
  role: string;
  date_creation: string;
}

export interface LoginCredentials {
  email: string;
  mot_de_passe: string;
}

export interface RegisterData {
  email: string;
  mot_de_passe: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
  expiresIn: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // Récupérer le token depuis localStorage au démarrage
    this.token = localStorage.getItem('token');
  }

  // Définir le token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Récupérer le token
  getToken(): string | null {
    return this.token;
  }

  // Supprimer le token
  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Récupérer l'utilisateur depuis localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Connexion
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la connexion');
    }

    // Stocker le token et les données utilisateur
    this.setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  }

  // Inscription
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'inscription');
    }

    // Stocker le token et les données utilisateur
    this.setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  }

  // Déconnexion
  logout() {
    this.removeToken();
  }

  // Récupérer le profil utilisateur
  async getProfile(): Promise<User> {
    if (!this.token) {
      throw new Error('Token d\'authentification manquant');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération du profil');
    }

    return data.user;
  }

  // Mettre à jour le profil
  async updateProfile(profileData: Partial<User>): Promise<User> {
    if (!this.token) {
      throw new Error('Token d\'authentification manquant');
    }

    const response = await fetch(`${API_BASE_URL}/utilisateur/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la mise à jour du profil');
    }

    // Mettre à jour les données utilisateur dans localStorage
    localStorage.setItem('user', JSON.stringify(data.user));

    return data.user;
  }

  // Changer le mot de passe
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.token) {
      throw new Error('Token d\'authentification manquant');
    }

    const response = await fetch(`${API_BASE_URL}/utilisateur/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors du changement de mot de passe');
    }
  }

  // Rafraîchir le token
  async refreshToken(): Promise<string> {
    if (!this.token) {
      throw new Error('Token d\'authentification manquant');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors du rafraîchissement du token');
    }

    // Mettre à jour le token
    this.setToken(data.token);

    return data.token;
  }

  // Vérifier si le token est expiré
  isTokenExpired(): boolean {
    if (!this.token) return true;

    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
}

// Créer une instance singleton
const authService = new AuthService();

export default authService; 