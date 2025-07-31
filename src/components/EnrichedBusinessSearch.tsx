import React, { useState } from 'react';
import { useEnrichedSearch, useCompanyFormatter } from '../hooks/useEnrichedSearch';
import { EnrichedCompany } from '../services/enrichedSearchService';

interface SearchFilters {
  q: string;
  activite_principale: string;
  code_postal: string;
  departement: string;
  auto_enrich: boolean;
  max_enrichments: number;
}

const EnrichedBusinessSearch: React.FC = () => {
  const {
    companies,
    loading,
    error,
    stats,
    performance,
    searchCompanies,
    clearResults,
    retrySearch
  } = useEnrichedSearch();

  const { formatForDisplay } = useCompanyFormatter();

  const [filters, setFilters] = useState<SearchFilters>({
    q: '',
    activite_principale: '',
    code_postal: '',
    departement: '',
    auto_enrich: true,
    max_enrichments: 20
  });

  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());

  const handleInputChange = (field: keyof SearchFilters, value: string | boolean | number) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    const searchParams = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '' && value !== null)
    );
    await searchCompanies(searchParams);
  };

  const handleCompanySelect = (siren: string, selected: boolean) => {
    const newSelection = new Set(selectedCompanies);
    if (selected) {
      newSelection.add(siren);
    } else {
      newSelection.delete(siren);
    }
    setSelectedCompanies(newSelection);
  };

  const exportSelectedCompanies = () => {
    const selectedData = companies
      .filter(company => selectedCompanies.has(company.siren))
      .map(company => ({
        siren: company.siren,
        nom: company.nom_complet || company.denomination,
        linkedin_url: company.linkedin_url,
        linkedin_id: company.linkedin_id,
        logo_url: company.logo_url,
        description: company.description,
        website: company.website_url,
        enriched: company.enriched
      }));

    const blob = new Blob([JSON.stringify(selectedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entreprises_enrichies_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CompanyCard: React.FC<{ company: EnrichedCompany }> = ({ company }) => {
    const formatted = formatForDisplay(company);
    
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedCompanies.has(company.siren)}
              onChange={(e) => handleCompanySelect(company.siren, e.target.checked)}
              className="h-4 w-4 text-blue-600"
            />
            
            {/* Logo */}
            <div className="w-12 h-12 flex-shrink-0">
              {formatted.logo ? (
                <img
                  src={formatted.logo}
                  alt={`Logo ${formatted.name}`}
                  className="w-full h-full object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                  {formatted.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{formatted.name}</h3>
              <p className="text-sm text-gray-600">{formatted.industry}</p>
              {formatted.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {formatted.description}
                </p>
              )}
            </div>
          </div>

          {/* Badges d'enrichissement */}
          <div className="flex flex-col items-end space-y-1">
            {formatted.enriched && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                formatted.fromCache ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {formatted.fromCache ? '💾 Cache' : '✨ Enrichi'}
              </span>
            )}
            {formatted.enrichmentError && (
              <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                ⚠️ Erreur
              </span>
            )}
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-500">SIREN: {company.siren}</span>
            {formatted.employees && (
              <span className="text-gray-500">👥 {formatted.employees}</span>
            )}
            {formatted.city && (
              <span className="text-gray-500">📍 {formatted.city}</span>
            )}
          </div>

          {/* Actions et liens */}
          <div className="flex items-center space-x-3">
            {formatted.website && (
              <a
                href={formatted.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                🌐 Site web
              </a>
            )}
            {formatted.linkedin && (
              <a
                href={formatted.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                💼 LinkedIn
              </a>
            )}
            {formatted.linkedinId && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                ID: {formatted.linkedinId}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        🚀 Recherche Enrichie d'Entreprises
      </h1>

      {/* Formulaire de recherche */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <input
              type="text"
              value={filters.q}
              onChange={(e) => handleInputChange('q', e.target.value)}
              placeholder="Ex: boulangerie, restaurant..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code NAF (optionnel)
            </label>
            <input
              type="text"
              value={filters.activite_principale}
              onChange={(e) => handleInputChange('activite_principale', e.target.value)}
              placeholder="Ex: 56.10A,56.30Z"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code Postal
            </label>
            <input
              type="text"
              value={filters.code_postal}
              onChange={(e) => handleInputChange('code_postal', e.target.value)}
              placeholder="Ex: 75001,75002"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Département
            </label>
            <input
              type="text"
              value={filters.departement}
              onChange={(e) => handleInputChange('departement', e.target.value)}
              placeholder="Ex: 75,92"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max enrichissements
            </label>
            <input
              type="number"
              value={filters.max_enrichments}
              onChange={(e) => handleInputChange('max_enrichments', parseInt(e.target.value) || 20)}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.auto_enrich}
                onChange={(e) => handleInputChange('auto_enrich', e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Enrichissement automatique
              </span>
            </label>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔍 Recherche en cours...' : '🚀 Rechercher'}
          </button>

          <button
            onClick={clearResults}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Effacer
          </button>

          {error && (
            <button
              onClick={retrySearch}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_companies}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.enriched_companies}</div>
              <div className="text-sm text-gray-600">Enrichies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.companies_with_logo}</div>
              <div className="text-sm text-gray-600">Avec logo</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.companies_with_description}</div>
              <div className="text-sm text-gray-600">Avec description</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">{stats.companies_with_linkedin}</div>
              <div className="text-sm text-gray-600">Avec LinkedIn</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{stats.from_cache}</div>
              <div className="text-sm text-gray-600">Du cache</div>
            </div>
          </div>
          
          {performance && (
            <div className="mt-4 text-center text-sm text-gray-600">
              ⚡ Traité en {performance.processing_time_ms}ms
              {performance.enrichment_enabled && ` • Max ${performance.max_enrichments_limit} enrichissements`}
            </div>
          )}
        </div>
      )}

      {/* Erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">❌</span>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Actions sur la sélection */}
      {selectedCompanies.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">
              {selectedCompanies.size} entreprise(s) sélectionnée(s)
            </span>
            <button
              onClick={exportSelectedCompanies}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              📥 Exporter la sélection
            </button>
          </div>
        </div>
      )}

      {/* Liste des entreprises */}
      {companies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Résultats ({companies.length})
            </h2>
            <button
              onClick={() => {
                const allSelected = companies.every(c => selectedCompanies.has(c.siren));
                if (allSelected) {
                  setSelectedCompanies(new Set());
                } else {
                  setSelectedCompanies(new Set(companies.map(c => c.siren)));
                }
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              {companies.every(c => selectedCompanies.has(c.siren)) ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>

          {companies.map(company => (
            <CompanyCard key={company.siren} company={company} />
          ))}
        </div>
      )}

      {/* Message vide */}
      {!loading && companies.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune entreprise trouvée
          </h3>
          <p className="text-gray-500">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      )}
    </div>
  );
};

export default EnrichedBusinessSearch;