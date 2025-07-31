const API_BASE_URL = 'http://localhost:4000/api';

export interface User {
  id: string;
  email: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
  role: string;
  date_creation: string;
}

export interface UsersResponse {
  success: boolean;
  users: User[];
  total: number;
}

export interface UserResponse {
  success: boolean;
  user: User;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

class UserService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Récupérer tous les utilisateurs
  async getAllUsers(): Promise<UsersResponse> {
    const response = await fetch(`${API_BASE_URL}/utilisateur`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération des utilisateurs');
    }

    return data;
  }

  // Récupérer un utilisateur par ID
  async getUserById(id: string): Promise<UserResponse> {
    const response = await fetch(`${API_BASE_URL}/utilisateur/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération de l\'utilisateur');
    }

    return data;
  }

  // Supprimer un utilisateur
  async deleteUser(id: string): Promise<DeleteResponse> {
    const response = await fetch(`${API_BASE_URL}/utilisateur/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la suppression de l\'utilisateur');
    }

    return data;
  }

  // Mettre à jour un utilisateur
  async updateUser(id: string, userData: Partial<User>): Promise<UserResponse> {
    const response = await fetch(`${API_BASE_URL}/utilisateur/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la mise à jour de l\'utilisateur');
    }

    return data;
  }
}

export default new UserService(); 