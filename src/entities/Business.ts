export interface Business {
    id: string;
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    employees: string;
    activity: string;
    description: string;
    website?: string;
    rating?: number;
    logo?: string;
    foundedYear?: number;
    employeeCount?: number;
    revenue?: number;
    legalForm?: string;
  }
  
  export interface FilterState {
    searchTerm: string;
    activities: string[];
    employeeRange: [number, number];
    revenueRange: [number, number];
    ageRange: [number, number];
    cities: string[];
    legalForms: string[];
    ratingRange: [number, number];
    roles: string[];
    sortBy: string;
    id_convention_collective?: string;
    // Filtres spécifiques Google GMB
    googleActivities?: string[];
    // Filtres sémantiques
    semanticTerms?: string[];
    // Filtres enseignes/franchises
    enseignes?: string[];
    // Filtres secteurs (remplace enseignes)
    sectors?: string[];
    sectorNafCodes?: string[];
    // Filtres localisation
    departments?: string[];
    departmentCodes?: string[];
    regions?: string[];
    regionCodes?: string[];
    activitySearchType?: 'naf' | 'google' | 'semantic' | 'enseigne' | 'secteur';
    // Filtre de recherche d'entreprise pour la page contact
    selectedCompany?: string;
    // Filtre de recherche de contact pour la page entreprises
    selectedContact?: string;
    // Filtre de liste d'entreprises sélectionnée
    selectedList?: {
      listId: string;
      listName: string;
      companyCount: number;
    } | null;
    onRemoveListFilter?: () => void;
  }

  export interface FiltersPanelProps extends FilterState {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    availableActivities: string[];
    availableCities: string[];
    availableLegalForms: string[];
    availableRoles: string[];
    employeeRange: [number, number];
    revenueRange: [number, number];
    ageRange: [number, number];
  }

// Interfaces pour les données Pronto API
export interface ProntoLead {
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  most_probable_email: string;
  phones: string[];
  title: string;
  title_description: string;
  summary: string;
  linkedin_profile_url: string;
  profile_image_url: string;
  is_premium_linkedin: boolean;
  connection_degree: number;
  status: string;
  rejection_reason: string[];
  lk_headline: string;
  sales_navigator_profile_url: string;
  current_positions_count: number;
  years_in_position: number;
  months_in_position: number;
  years_in_company: number;
  months_in_company: number;
  lk_connections_count: number;
  is_open_profile_linkedin: boolean;
  is_open_to_work_linkedin: boolean;
  most_probable_email_status: string;
}

export interface ProntoCompany {
  name: string;
  cleaned_name: string;
  website: string;
  location: string;
  industry: string;
  headquarters: string;
  description: string;
  linkedin_url: string;
  employee_range: string;
  company_profile_picture: string;
  profile_image_url?: string; // Champ alternatif pour l'image de profil
}

export interface ProntoLeadWithCompany {
  lead: ProntoLead;
  company: ProntoCompany;
}

export interface ProntoSearch {
  id: string;
  name: string;
  created_at: string;
}

export interface ProntoSearchResponse {
  search: ProntoSearch;
  leads: ProntoLeadWithCompany[];
}

// Type combiné pour BusinessCard avec données Pronto
export interface BusinessWithProntoData extends Business {
  contactsCount?: number;
  email?: string;
  linkedin?: string;
  google?: string;
  facebook?: string;
  prontoData?: {
    lead?: ProntoLead;
    company?: ProntoCompany;
  };
}

// Interfaces pour la nouvelle API recherche-entreprises
export interface EntrepriseApiSiege {
  activite_principale: string;
  activite_principale_registre_metier: string | null;
  annee_tranche_effectif_salarie: string;
  adresse: string;
  caractere_employeur: string;
  cedex: string | null;
  code_pays_etranger: string | null;
  code_postal: string;
  commune: string;
  complement_adresse: string | null;
  coordonnees: string;
  date_creation: string;
  date_debut_activite: string;
  date_fermeture: string | null;
  date_mise_a_jour: string | null;
  date_mise_a_jour_insee: string;
  departement: string;
  distribution_speciale: string | null;
  epci: string;
  est_siege: boolean;
  etat_administratif: string;
  geo_adresse: string;
  geo_id: string;
  indice_repetition: string | null;
  latitude: string;
  libelle_cedex: string | null;
  libelle_commune: string;
  libelle_commune_etranger: string | null;
  libelle_pays_etranger: string | null;
  libelle_voie: string;
  liste_enseignes: string[] | null;
  liste_finess: string[] | null;
  liste_id_bio: string[] | null;
  liste_idcc: string[] | null;
  liste_id_organisme_formation: string[] | null;
  liste_rge: string[] | null;
  liste_uai: string[] | null;
  longitude: string;
  nom_commercial: string | null;
  numero_voie: string;
  region: string;
  siret: string;
  statut_diffusion_etablissement: string;
  tranche_effectif_salarie: string;
  type_voie: string;
}

export interface EntrepriseApiDirigeant {
  nom?: string;
  prenoms?: string;
  annee_de_naissance?: string;
  date_de_naissance?: string;
  qualite?: string;
  nationalite?: string;
  type_dirigeant: string;
  siren?: string;
  denomination?: string;
}

export interface EntrepriseApiResult {
  siren: string;
  nom_complet: string;
  nom_raison_sociale: string;
  sigle: string | null;
  nombre_etablissements: number;
  nombre_etablissements_ouverts: number;
  siege: EntrepriseApiSiege;
  activite_principale: string;
  categorie_entreprise: string;
  caractere_employeur: string | null;
  annee_categorie_entreprise: string;
  date_creation: string;
  date_fermeture: string | null;
  date_mise_a_jour: string;
  date_mise_a_jour_insee: string;
  date_mise_a_jour_rne: string;
  dirigeants: EntrepriseApiDirigeant[];
  etat_administratif: string;
  nature_juridique: string;
  section_activite_principale: string;
  tranche_effectif_salarie: string;
  annee_tranche_effectif_salarie: string;
  statut_diffusion: string;
  matching_etablissements: any[];
  finances: Record<string, { ca: number; resultat_net: number }>;
  complements: Record<string, any>;
}

export interface EntrepriseApiResponse {
  results: EntrepriseApiResult[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}