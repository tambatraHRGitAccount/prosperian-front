import { EntrepriseApiResult } from '../entities/Business';
import { ProntoCompany } from '../services/prontoService';

/**
 * Extrait le domaine d'une URL complète
 * @param url URL complète (ex: "https://www.example.com/path")
 * @returns Domaine (ex: "example.com")
 */
export const extractDomain = (url?: string): string | undefined => {
  if (!url) return undefined;
  
  try {
    // Ajouter https:// si pas de protocole
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const domain = new URL(urlWithProtocol).hostname;
    
    // Supprimer le "www." si présent
    return domain.startsWith('www.') ? domain.substring(4) : domain;
  } catch {
    // Si l'URL est invalide, essayer de nettoyer manuellement
    const cleaned = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    return cleaned || undefined;
  }
};

/**
 * Extrait le code pays à partir de l'adresse ou d'autres informations
 * @param entreprise Données de l'entreprise
 * @returns Code pays (ex: "FR")
 */
export const extractCountryCode = (entreprise: EntrepriseApiResult): string => {
  // Pour l'instant, on assume que toutes les entreprises sont françaises
  // car elles viennent de l'API française data.gouv.fr
  return 'FR';
};

/**
 * Génère une URL LinkedIn potentielle basée sur le nom de l'entreprise
 * @param companyName Nom de l'entreprise
 * @returns URL LinkedIn potentielle ou undefined
 */
export const generateLinkedInUrl = (companyName: string): string | undefined => {
  if (!companyName) return undefined;
  
  // Nettoyer le nom pour créer un slug LinkedIn potentiel
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Supprimer tirets multiples
    .replace(/^-|-$/g, ''); // Supprimer tirets en début/fin
  
  if (slug.length < 2) return undefined;
  
  return `https://www.linkedin.com/company/${slug}`;
};

/**
 * Extrait le site web à partir des données d'entreprise
 * @param entreprise Données de l'entreprise
 * @returns Site web ou undefined
 */
export const extractWebsite = (entreprise: EntrepriseApiResult): string | undefined => {
  // Vérifier s'il y a des données web dans les compléments
  if (entreprise.complements?.web_info?.website) {
    return entreprise.complements.web_info.website;
  }
  
  // Vérifier d'autres sources potentielles
  if (entreprise.complements?.website) {
    return entreprise.complements.website;
  }
  
  return undefined;
};

/**
 * Mappe une EntrepriseApiResult vers le format ProntoCompany
 * @param entreprise Données de l'entreprise depuis l'API
 * @returns Objet ProntoCompany avec les données mappées
 */
export const mapEntrepriseToProtoCompany = (entreprise: EntrepriseApiResult): ProntoCompany => {
  const website = extractWebsite(entreprise);
  const domain = extractDomain(website);
  const countryCode = extractCountryCode(entreprise);
  const linkedinUrl = generateLinkedInUrl(entreprise.nom_complet);

  return {
    name: entreprise.nom_complet || entreprise.nom_raison_sociale || '',
    country_code: countryCode,
    domain: domain || null,
    linkedin_url: linkedinUrl || null,
  };
};

/**
 * Mappe un tableau d'EntrepriseApiResult vers un tableau de ProntoCompany
 * @param entreprises Tableau d'entreprises depuis l'API
 * @returns Tableau de ProntoCompany
 */
export const mapEntreprisesToProntoCompanies = (entreprises: EntrepriseApiResult[]): ProntoCompany[] => {
  return entreprises.map(mapEntrepriseToProtoCompany);
};

/**
 * Filtre et valide les entreprises pour s'assurer qu'elles ont au minimum un nom
 * @param companies Tableau de ProntoCompany
 * @returns Tableau filtré de ProntoCompany valides
 */
export const validateProntoCompanies = (companies: ProntoCompany[]): ProntoCompany[] => {
  return companies.filter(company => company.name && company.name.trim().length > 0);
};

/**
 * Fonction principale pour convertir les entreprises sélectionnées en format Pronto
 * @param selectedBusinesses Entreprises sélectionnées
 * @returns Tableau de ProntoCompany valides et prêtes pour l'API
 */
export const convertSelectedBusinessesToProntoFormat = (selectedBusinesses: EntrepriseApiResult[]): ProntoCompany[] => {
  console.log('🔄 Conversion des entreprises sélectionnées vers le format Pronto:', selectedBusinesses.length);
  
  const mapped = mapEntreprisesToProntoCompanies(selectedBusinesses);
  const validated = validateProntoCompanies(mapped);
  
  console.log('✅ Entreprises converties:', validated.length);
  console.log('📊 Détails des entreprises converties:', validated);
  
  return validated;
};

/**
 * Fonction pour enrichir les données Pronto avec des informations supplémentaires
 * si elles sont disponibles (par exemple depuis le cache d'enrichissement)
 * @param company ProntoCompany de base
 * @param enrichmentData Données d'enrichissement optionnelles
 * @returns ProntoCompany enrichie
 */
export const enrichProntoCompany = (
  company: ProntoCompany, 
  enrichmentData?: {
    website?: string;
    linkedin_url?: string;
    description?: string;
    industry?: string;
  }
): ProntoCompany => {
  return {
    ...company,
    domain: enrichmentData?.website ? extractDomain(enrichmentData.website) : company.domain,
    linkedin_url: enrichmentData?.linkedin_url || company.linkedin_url,
  };
};
