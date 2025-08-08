import { buildApiUrl } from '../config/api';

// Types pour les listes
export interface List {
  id: string;
  type: string;
  nom: string;
  elements: number;
  path: string;
  created_at: string;
  updated_at: string;
}

export interface CreateListRequest {
  type: string;
  nom: string;
  file: File;
}

export class ListService {
  // Récupérer toutes les listes
  static async getAllLists(): Promise<List[]> {
    try {
      const response = await fetch(buildApiUrl('/api/list'));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching lists:', error);
      throw error;
    }
  }

  // Récupérer une liste par ID
  static async getListById(id: string): Promise<List> {
    try {
      const response = await fetch(buildApiUrl(`/api/list/${id}`));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching list:', error);
      throw error;
    }
  }

  // Créer une nouvelle liste avec upload de fichier
  static async createList(request: CreateListRequest): Promise<List> {
    try {
      const formData = new FormData();
      formData.append('type', request.type);
      formData.append('nom', request.nom);
      formData.append('file', request.file);

      const response = await fetch(buildApiUrl('/api/list'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  }

  // Créer une liste à partir des entreprises sélectionnées
  static async createListFromSelection(nom: string, selectedBusinesses: any[]): Promise<List> {
    try {
      const response = await fetch(buildApiUrl('/api/list/create-from-selection'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom,
          selectedBusinesses
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating list from selection:', error);
      throw error;
    }
  }

  // Créer une liste de leads à partir des résultats Pronto
  static async createLeadsListFromPronto(nom: string, leads: any[]): Promise<List> {
    try {
      const response = await fetch(buildApiUrl('/api/list/create-leads-from-pronto'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom,
          leads
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating leads list from Pronto:', error);
      throw error;
    }
  }

  // Mettre à jour une liste
  static async updateList(id: string, updates: Partial<List>): Promise<List> {
    try {
      const response = await fetch(buildApiUrl(`/api/list/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating list:', error);
      throw error;
    }
  }

  // Supprimer une liste
  static async deleteList(id: string): Promise<void> {
    try {
      const response = await fetch(buildApiUrl(`/api/list/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      throw error;
    }
  }

  // Télécharger le fichier d'une liste
  static async downloadListFile(id: string, filename?: string): Promise<void> {
    try {
      const response = await fetch(buildApiUrl(`/api/list/${id}/download`));
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'liste.csv';
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading list file:', error);
      throw error;
    }
  }

  // Valider un fichier CSV
  static validateCSVFile(file: File): { isValid: boolean; error?: string } {
    // Vérifier le type MIME
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      return {
        isValid: false,
        error: 'Le fichier doit être au format CSV'
      };
    }

    // Vérifier la taille (limite à 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Le fichier est trop volumineux (maximum 10MB)'
      };
    }

    return { isValid: true };
  }

  // Lire et prévisualiser le contenu d'un fichier CSV
  static async previewCSVFile(file: File): Promise<{ headers: string[]; preview: string[][] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length === 0) {
            reject(new Error('Le fichier est vide'));
            return;
          }

          // Extraire les en-têtes
          const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
          
          // Extraire les premières lignes pour la prévisualisation (max 5)
          const previewLines = lines.slice(1, 6);
          const preview = previewLines.map(line => 
            line.split(',').map(cell => cell.trim().replace(/"/g, ''))
          );

          resolve({ headers, preview });
        } catch (error) {
          reject(new Error('Erreur lors de la lecture du fichier CSV'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };

      reader.readAsText(file);
    });
  }

  // Récupérer toutes les listes importées
  static async getAllImportedLists(): Promise<List[]> {
    try {
      const response = await fetch(buildApiUrl('/api/list/import'));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching imported lists:', error);
      throw error;
    }
  }
} 