import React from 'react';
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

  // Fonction pour extraire les données selon le type
  const getCompanyData = () => {
    if (!isProntoData && company && 'nom_complet' in company) {
      // Mapping pour EntrepriseApiResult enrichi
      const mapped = mapEntrepriseApiResultToCardData(company);
      // Prendre le logo/description Pronto si présents
      return {
        ...mapped,
        logo: (company as any).prontoLogo || mapped.logo,
        description: (company as any).prontoDescription || mapped.description,
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
          logo: prontoCompany.company_profile_picture || '',
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

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {companyData.description}
          </p>
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