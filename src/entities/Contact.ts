export interface Contact {
  id: string;
  role: string;
  subrole?: string;
  entreprise: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  google?: string;
  facebook?: string;
  contactsCount?: number;
  employeesCount?: number;
  revenue?: number;
  postalCode?: string;
  city?: string;
  logo?: string;
  civilite?: string;
  prenom?: string;
  nom?: string;
  niveau?: string;
  domaine?: string;
  webmail?: string;
  statut?: string;
}
  
  export interface Poste {
    label: string;
    value: number;
  }
  
  export interface Niveau {
    label: string;
    value: number;
  }
  
  export interface HeaderStats {
    totalContacts: string;
    totalEntreprises: string;
    contactsDirects: {
      avecEmail: string;
      avecLinkedIn: string;
    };
    contactsGeneriques: {
      avecTelephone: string;
    };
  }
  
  export interface MockContacts {
    contacts: Contact[];
    postes: Poste[];
    niveaux: Niveau[];
    headerStats: HeaderStats;
  }