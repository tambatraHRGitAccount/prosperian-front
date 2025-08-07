// Service pour récupérer la liste des contacts/dirigeants
export interface ContactListItem {
  nom: string;
  prenoms: string;
  nom_complet: string;
  qualite: string;
  entreprise: string;
  siren?: string;
}

export interface ContactListResponse {
  results: ContactListItem[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}

class ContactListService {
  private baseUrl = 'https://prosperian.onrender.com';

  async getContacts(
    page: number = 1,
    perPage: number = 10,
    searchTerm?: string
  ): Promise<ContactListResponse> {
    try {
      let url = `${this.baseUrl}/api/search?page=${page}&per_page=${perPage}&section_activite_principale=A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U&limite_matching_etablissements=10`;
      
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
      
      // Extraire tous les dirigeants de toutes les entreprises
      const contacts: ContactListItem[] = [];
      
      data.results.forEach((entreprise: any) => {
        if (entreprise.dirigeants && Array.isArray(entreprise.dirigeants)) {
          entreprise.dirigeants.forEach((dirigeant: any) => {
            const nomComplet = `${dirigeant.prenoms || ''} ${dirigeant.nom || ''}`.trim();
            if (nomComplet) {
              contacts.push({
                nom: dirigeant.nom || '',
                prenoms: dirigeant.prenoms || '',
                nom_complet: nomComplet,
                qualite: dirigeant.qualite || '',
                entreprise: entreprise.nom_raison_sociale || entreprise.nom_complet,
                siren: entreprise.siren
              });
            }
          });
        }
      });

      // Dédupliquer les contacts (même nom + même entreprise)
      const uniqueContacts = contacts.filter((contact, index, self) => 
        index === self.findIndex(c => 
          c.nom_complet === contact.nom_complet && c.entreprise === contact.entreprise
        )
      );

      return {
        results: uniqueContacts,
        total_results: uniqueContacts.length,
        page: data.page,
        per_page: data.per_page,
        total_pages: Math.ceil(uniqueContacts.length / perPage)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts:', error);
      throw error;
    }
  }

  async searchContacts(searchTerm: string, page: number = 1, perPage: number = 10): Promise<ContactListResponse> {
    return this.getContacts(page, perPage, searchTerm);
  }
}

export const contactListService = new ContactListService(); 