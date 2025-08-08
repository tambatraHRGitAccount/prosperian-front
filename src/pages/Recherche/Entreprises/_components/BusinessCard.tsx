import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Users, Star, ExternalLink, Building, Globe, Mail, Linkedin, Facebook, User } from 'lucide-react';
import { BusinessWithProntoData, ProntoLeadWithCompany } from '@entities/Business';

interface BusinessCardProps {
  company: BusinessWithProntoData | ProntoLeadWithCompany;
  id?: number;
  showCheckbox?: boolean;
  checked?: boolean;
  onCheckboxChange?: (id: number) => void;
  isProntoData?: boolean;
  loading?: boolean;
}

// Interface pour la réponse de l'endpoint d'enrichissement Pronto (nouvelle structure)
interface ProntoEnrichmentResponse {
  success: boolean;
  company?: {
    name: string;
    description?: string;
    industry?: string;
    website?: string;
    employeeCount?: number;
    employeeDisplayCount?: string;
    employeeCountRange?: string;
    type?: string;
    yearFounded?: number;
    location?: string;
    headquarters?: {
      city?: string;
      country?: string;
      line1?: string;
      postalCode?: string;
      geographicArea?: string;
    };
    companyPictureDisplayImage?: {
      artifacts: Array<{
        width: number;
        height: number;
        fileIdentifyingUrlPathSegment: string;
      }>;
      rootUrl: string;
    };
    revenueRange?: {
      estimatedMinRevenue?: {
        currencyCode: string;
        amount: number;
        unit: string;
      };
      estimatedMaxRevenue?: {
        currencyCode: string;
        amount: number;
        unit: string;
      };
    };
    specialties?: string[];
    flagshipCompanyUrl?: string;
    entityUrn?: string;
  };
  message?: string;
}

// Interface pour le stockage localStorage
interface ProntoEnrichmentCache {
  [companyName: string]: {
    data: ProntoEnrichmentResponse;
    timestamp: number;
  };
}

// Clé pour le localStorage
const PRONTO_ENRICHMENT_CACHE_KEY = 'pronto_enrichment_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

// Fonctions utilitaires pour le cache localStorage
const getEnrichmentCache = (): ProntoEnrichmentCache => {
  try {
    const cached = localStorage.getItem(PRONTO_ENRICHMENT_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du cache localStorage:', error);
    return {};
  }
};

const setEnrichmentCache = (cache: ProntoEnrichmentCache): void => {
  try {
    localStorage.setItem(PRONTO_ENRICHMENT_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('❌ Erreur lors de l\'écriture du cache localStorage:', error);
  }
};

const getCachedEnrichment = (companyName: string): ProntoEnrichmentResponse | null => {
  const cache = getEnrichmentCache();
  const cached = cache[companyName];
  
  if (cached) {
    const now = Date.now();
    const isExpired = (now - cached.timestamp) > CACHE_DURATION;
    
    if (!isExpired) {
      console.log(`📦 Données Pronto récupérées du cache pour: ${companyName}`);
      return cached.data;
    } else {
      console.log(`⏰ Cache expiré pour: ${companyName}`);
      // Supprimer l'entrée expirée
      delete cache[companyName];
      setEnrichmentCache(cache);
    }
  }
  
  return null;
};

const setCachedEnrichment = (companyName: string, data: ProntoEnrichmentResponse): void => {
  const cache = getEnrichmentCache();
  cache[companyName] = {
    data,
    timestamp: Date.now()
  };
  setEnrichmentCache(cache);
  console.log(`💾 Données Pronto mises en cache pour: ${companyName}`);
};

// Fonction pour construire l'URL du logo Pronto
const buildProntoLogoUrl = (companyPictureDisplayImage: any): string | null => {
  if (!companyPictureDisplayImage || !companyPictureDisplayImage.artifacts || !companyPictureDisplayImage.rootUrl) {
    return null;
  }

  try {
    // Prendre l'artifact de 200x200 (taille optimale pour l'affichage)
    const artifact = companyPictureDisplayImage.artifacts.find(a => a.width === 200) || 
                    companyPictureDisplayImage.artifacts[0]; // Fallback sur le premier

    if (!artifact) {
      return null;
    }

    // Construire l'URL complète
    const logoUrl = `${companyPictureDisplayImage.rootUrl}${artifact.fileIdentifyingUrlPathSegment}`;
    return logoUrl;
  } catch (error) {
    console.error('❌ Erreur lors de la construction de l\'URL du logo:', error);
    return null;
  }
};

// Nouvelle version pour EntrepriseApiResult (API recherche-entreprises)
function mapEntrepriseApiResultToCardData(company: any): any {
  // Trouver l'année la plus récente dans finances
  let ca = undefined;
  if (company.finances && typeof company.finances === 'object') {
    const years = Object.keys(company.finances).filter(y => company.finances[y] && company.finances[y].ca != null);
    if (years.length > 0) {
      const latestYear = years.sort((a, b) => Number(b) - Number(a))[0];
      ca = company.finances[latestYear]?.ca;
    }
  }
  return {
    id: company.siren,
    name: company.nom_complet,
    address: company.siege?.geo_adresse || '',
    city: company.siege?.libelle_commune || '',
    postalCode: company.siege?.code_postal || '',
    phone: '',
    employees: company.tranche_effectif_salarie || '',
    activity: company.activite_principale || '',
    description: '',
    website: '',
    logo: '',
    employeeCount: undefined,
    revenue: ca,
    legalForm: '',
    contactsCount: undefined,
    email: '',
    linkedin: '',
    foundedYear: undefined
  };
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ 
  company, 
  id, 
  showCheckbox, 
  checked, 
  onCheckboxChange,
  isProntoData = false,
  loading = false
}) => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  // États pour l'enrichissement Pronto
  const [prontoEnrichment, setProntoEnrichment] = useState<ProntoEnrichmentResponse | null>(null);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);

  // Fonction pour enrichir l'entreprise avec Pronto
  const enrichWithPronto = async (companyName: string) => {
    if (!companyName || isProntoData) return; // Pas d'enrichissement pour les données Pronto déjà enrichies
    
    // Vérifier d'abord le cache localStorage
    const cachedData = getCachedEnrichment(companyName);
    if (cachedData) {
      setProntoEnrichment(cachedData);
      return;
    }
    
    setEnrichmentLoading(true);
    try {
      const response = await fetch(`/api/pronto/companies/enrich?name=${encodeURIComponent(companyName)}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data: ProntoEnrichmentResponse = await response.json();

        // Mettre en cache même si success: false (pour éviter de refaire l'appel)
        setCachedEnrichment(companyName, data);

        if (data.success && data.company) {
          setProntoEnrichment(data);
          console.log(`✅ Enrichissement Pronto réussi pour: ${companyName}`, {
            name: data.company.name,
            industry: data.company.industry,
            employeeCount: data.company.employeeCount,
            website: data.company.website
          });
        } else {
          console.log(`⚠️ Aucune donnée Pronto trouvée pour: ${companyName}`, data);
        }
      } else {
        console.error(`❌ Erreur lors de l'enrichissement Pronto pour: ${companyName}`);
      }
    } catch (error) {
      console.error(`❌ Erreur réseau lors de l'enrichissement Pronto:`, error);
    } finally {
      setEnrichmentLoading(false);
    }
  };

  // Fonction pour extraire les données selon le type
  const getCompanyData = () => {
    if (!isProntoData && company && 'nom_complet' in company) {
      // Mapping pour EntrepriseApiResult enrichi
      const mapped = mapEntrepriseApiResultToCardData(company);
      
      // Enrichir avec les données Pronto si disponibles (nouvelle structure)
      const companyData = prontoEnrichment?.company;
      const enrichedDescription = companyData?.description || mapped.description;
      const enrichedIndustry = companyData?.industry || mapped.activity;
      const enrichedWebsite = companyData?.website || mapped.website;
      const enrichedEmployeeCount = companyData?.employeeCount || mapped.employeeCount;

      // Construire l'URL du logo Pronto avec la nouvelle structure
      let prontoLogoUrl = null;
      if (companyData?.companyPictureDisplayImage) {
        const artifacts = companyData.companyPictureDisplayImage.artifacts;
        const rootUrl = companyData.companyPictureDisplayImage.rootUrl;
        // Prendre l'image de taille moyenne (200x200 ou la première disponible)
        const artifact = artifacts?.find((a: any) => a.width === 200) || artifacts?.[0];
        if (artifact && rootUrl) {
          prontoLogoUrl = `${rootUrl}${artifact.fileIdentifyingUrlPathSegment}`;
        }
      }

      // Calculer le CA à partir du range de revenus
      let estimatedRevenue = mapped.revenue;
      if (companyData?.revenueRange) {
        const minRevenue = companyData.revenueRange.estimatedMinRevenue;
        const maxRevenue = companyData.revenueRange.estimatedMaxRevenue;
        if (minRevenue && maxRevenue) {
          // Prendre la moyenne et convertir en euros (approximation)
          const avgRevenueUSD = (minRevenue.amount + maxRevenue.amount) / 2;
          const multiplier = minRevenue.unit === 'MILLION' ? 1000000 : 1;
          estimatedRevenue = avgRevenueUSD * multiplier * 0.85; // Conversion USD -> EUR approximative
        }
      }

      return {
        ...mapped,
        description: enrichedDescription,
        activity: enrichedIndustry,
        website: enrichedWebsite,
        employeeCount: enrichedEmployeeCount,
        revenue: estimatedRevenue,
        foundedYear: companyData?.yearFounded || mapped.foundedYear,
        // Utiliser le logo Pronto s'il est disponible, sinon le logo existant
        logo: prontoLogoUrl || mapped.logo,
        // Indicateur que l'entreprise a été enrichie
        isEnriched: !!(prontoEnrichment?.success && companyData)
      };
    }
    if (isProntoData && 'company' in company) {
      // Données Pronto
      const prontoCompany = company.company;
      const prontoLead = company.lead;
      

      
      // Types pour les objets d'adresse et de localisation
      interface AddressObject {
        line1?: string;
        line2?: string;
        city?: string;
        postalCode?: string;
        country?: string;
      }

      interface LocationObject {
        city?: string;
        geographicArea?: string;
      }

      // Fonction pour extraire l'adresse de manière sécurisée
      const extractAddress = (addressObj: string | AddressObject | null | undefined): string => {
        if (typeof addressObj === 'string') return addressObj;
        if (typeof addressObj === 'object' && addressObj !== null) {
          // Si c'est un objet d'adresse, extraire les parties pertinentes
          const parts = [];
          if (addressObj.line1) parts.push(addressObj.line1);
          if (addressObj.line2) parts.push(addressObj.line2);
          if (addressObj.city) parts.push(addressObj.city);
          if (addressObj.postalCode) parts.push(addressObj.postalCode);
          if (addressObj.country) parts.push(addressObj.country);
          return parts.join(', ');
        }
        return '';
      };

      // Fonction pour extraire la ville de manière sécurisée
      const extractCity = (locationObj: string | LocationObject | null | undefined): string => {
        if (typeof locationObj === 'string') return locationObj;
        if (typeof locationObj === 'object' && locationObj !== null) {
          return locationObj.city || locationObj.geographicArea || '';
        }
        return '';
      };

      // Fonction pour extraire le code postal de manière sécurisée
      const extractPostalCode = (addressObj: string | AddressObject | null | undefined): string => {
        if (typeof addressObj === 'string') return '';
        if (typeof addressObj === 'object' && addressObj !== null) {
          return addressObj.postalCode || '';
        }
        return '';
      };
      
      // Construire l'URL du logo pour les données Pronto directes
      const prontoLogoUrl = prontoCompany.companyPictureDisplayImage ? 
        buildProntoLogoUrl(prontoCompany.companyPictureDisplayImage) : null;
      
              return {
          id: prontoCompany.name, // Utiliser le nom comme ID temporaire
          name: prontoCompany.name,
          address: extractAddress(prontoCompany.headquarters),
          city: extractCity(prontoCompany.headquarters), // Utiliser headquarters.city au lieu de location
          postalCode: extractPostalCode(prontoCompany.headquarters),
          phone: prontoLead?.phones?.[0] || '',
          employees: prontoCompany.employee_range || '',
          activity: prontoCompany.industry || '',
          description: prontoCompany.description || '',
          website: prontoCompany.website || '',
          logo: prontoLogoUrl || prontoCompany.company_profile_picture || '',
          employeeCount: parseInt(prontoCompany.employee_range?.split('-')[1] || '0'),
          revenue: undefined,
          legalForm: undefined,
          contactsCount: 1, // Chaque lead représente un contact
          email: prontoLead?.most_probable_email || '',
          linkedin: prontoLead?.linkedin_profile_url || '',
          foundedYear: undefined
        };
    } else {
      // Données Business classiques
      return company as BusinessWithProntoData;
    }
  };

  // Effectuer l'enrichissement quand le composant se monte
  useEffect(() => {
    if (!isProntoData && company && 'nom_complet' in company) {
      const companyName = company.nom_complet;
      if (companyName) {
        enrichWithPronto(companyName);
      }
    }
  }, [company, isProntoData]);

  const companyData = getCompanyData();
  const companyAge = companyData.foundedYear ? currentYear - companyData.foundedYear : null;

  const handleCompanyClick = () => {
    navigate(`/recherche/societes/${companyData.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] w-full mx-auto">
        <style>{`
          @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
          .animate-spin-reverse { animation: spin-reverse 1s linear infinite; }
        `}</style>
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-orange-400 border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-[#E95C41] border-b-transparent animate-spin-reverse"></div>
        </div>
      </div>
    );
  }

  if (showCheckbox) {
    // Mode liste avec checkbox (lignes)
    return (
      <tr className="hover:bg-gray-50 border-b">
        <td className="px-2 py-2">
          <input
            type="checkbox"
            checked={!!checked}
            onChange={e => {
              if (onCheckboxChange && typeof id === 'number') {
                onCheckboxChange(id);
              }
            }}
            aria-label={`Sélectionner l'entreprise ${companyData.name}`}
          />
        </td>
        <td className="px-2 py-2">
          {companyData.logo ? (
            <img
              src={companyData.logo}
              alt={`${companyData.name} logo`}
              className="w-8 h-8 rounded-lg object-cover border border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Building className="w-4 h-4 text-white" />
            </div>
          )}
        </td>
        <td className="px-2 py-2 font-semibold text-blue-800 text-sm hover:underline cursor-pointer truncate" onClick={handleCompanyClick}>
          {companyData.name}
        </td>
        <td className="px-2 py-2 text-center text-sm text-gray-800 font-medium">
          {companyData.contactsCount ?? '-'}
        </td>
        <td className="px-2 py-2 text-center text-sm text-gray-800 font-medium">
          {companyData.employeeCount || String(companyData.employees || '') || '-'}
        </td>
        <td className="px-2 py-2 text-center text-sm text-gray-800 font-medium">
          {companyData.revenue ? `${(companyData.revenue / 1_000_000).toLocaleString()} M €` : '-'}
        </td>
        <td className="px-2 py-2 text-right text-sm text-gray-700 truncate">
          {companyData.postalCode} {String(companyData.city || '')}
        </td>
      </tr>
    );
  }

  // Mode carte classique
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header with Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            {companyData.logo ? (
              <img 
                src={companyData.logo} 
                alt={`${companyData.name} logo`}
                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                onError={(e) => {
                  // En cas d'erreur de chargement, remplacer par l'icône par défaut
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center ${companyData.logo ? 'hidden' : ''}`}>
              <Building className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {/* Company Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 
                className="text-lg font-bold text-gray-900 leading-tight truncate cursor-pointer hover:text-blue-600"
                onClick={handleCompanyClick}
              >
                {companyData.name}
              </h3>
              {companyData.rating && (
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">{companyData.rating}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-blue-600 mt-1">{companyData.activity}</p>
            {companyAge && (
              <p className="text-xs text-gray-500 mt-1">Fondée en {companyData.foundedYear} • {companyAge} ans</p>
            )}
            {/* Indicateur d'enrichissement Pronto */}
            {(companyData as any).isEnriched && (
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-medium">Enrichi Pronto</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Address */}
          {companyData.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <div>{companyData.address}</div>
                {(companyData.postalCode || companyData.city) && (
                  <div>{companyData.postalCode} {companyData.city}</div>
                )}
              </div>
            </div>
          )}

          {/* Phone */}
          {companyData.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700">{String(companyData.phone)}</span>
            </div>
          )}

          {/* Employees */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              {String(companyData.employees || '')}
              {companyData.employeeCount && (
                <span className="text-gray-500"> ({companyData.employeeCount} employés)</span>
              )}
            </span>
          </div>

          {/* Revenue */}
          {companyData.revenue && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <span className="text-gray-400 text-xs">€</span>
              </div>
              <span className="text-sm text-gray-700">
                CA: {(companyData.revenue / 1000).toLocaleString()}k€
              </span>
            </div>
          )}

          {/* Legal Form */}
          {companyData.legalForm && (
            <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
              {companyData.legalForm}
            </div>
          )}

          {/* Description enrichie Pronto */}
          {companyData.description && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {companyData.description}
              </p>
              {/* Indicateur de chargement de l'enrichissement */}
              {enrichmentLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span>Enrichissement en cours...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            <button className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
              PRODUITS 2024 - 2025
            </button>
          </div>
          <button className="text-blue-600 hover:text-blue-800 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};