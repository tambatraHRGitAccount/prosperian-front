import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle } from 'lucide-react';

interface FilterType {
  type: string;
  name: string;
  description: string;
}

interface FilterTypesResponse {
  success: boolean;
  people: FilterType[];
  company: FilterType[];
}

interface LinkedInSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedList: any;
}

export const LinkedInSalesModal: React.FC<LinkedInSalesModalProps> = ({
  isOpen,
  onClose,
  selectedList
}) => {
  const [filterTypes, setFilterTypes] = useState<FilterTypesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchType, setSearchType] = useState<'people' | 'company'>('people');
  const [keywords, setKeywords] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // États pour l'étape 2
  const [companyFilters, setCompanyFilters] = useState<{[filterType: string]: {[companyId: string]: 'INCLUDED' | 'EXCLUDED'}}>({});
  const [generatingUrl, setGeneratingUrl] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');

  // États pour l'étape 3 - Configuration du scraping
  const [scrapingConfig, setScrapingConfig] = useState({
    search_url: '',
    webhook_url: '',
    name: '',
    streaming: true,
    custom: {
      hubspot_id: ''
    },
    limit: 100
  });
  const [launchingScraping, setLaunchingScraping] = useState(false);
  const [scrapingResult, setScrapingResult] = useState<any>(null);

  // États pour l'étape 4 - Résultats du scraping
  const [scrapingStatus, setScrapingStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');

  // Charger les types de filtres disponibles
  const loadFilterTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/linkedin-sales/filter-types', {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFilterTypes(data);
        console.log('✅ Types de filtres LinkedIn chargés:', data);
      } else {
        console.error('❌ Erreur lors du chargement des types de filtres');
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour générer un ID LinkedIn aléatoire
  const generateLinkedInId = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  // Charger les types de filtres quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      loadFilterTypes();
      // Réinitialiser les valeurs
      setCurrentStep(1);
      setSearchType('people');
      setKeywords('');
      setSelectedFilters([]);
      setCompanyFilters({});
      setGeneratingUrl(false);
      setGeneratedUrl('');
      setScrapingConfig({
        search_url: '',
        webhook_url: '',
        name: '',
        streaming: true,
        custom: { hubspot_id: '' },
        limit: 100
      });
      setLaunchingScraping(false);
      setScrapingResult(null);
      setScrapingStatus('idle');
    }
  }, [isOpen]);

  // Gérer la sélection/désélection des filtres
  const toggleFilter = (filterType: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterType)
        ? prev.filter(f => f !== filterType)
        : [...prev, filterType]
    );
  };

  // Obtenir les filtres selon le type de recherche
  const getAvailableFilters = (): FilterType[] => {
    if (!filterTypes) return [];
    return searchType === 'people' ? filterTypes.people : filterTypes.company;
  };

  // Gérer la sélection d'inclusion/exclusion pour une entreprise dans un filtre
  const toggleCompanyFilter = (filterType: string, companyName: string, selectionType: 'INCLUDED' | 'EXCLUDED') => {
    setCompanyFilters(prev => ({
      ...prev,
      [filterType]: {
        ...prev[filterType],
        [companyName]: prev[filterType]?.[companyName] === selectionType ? undefined : selectionType
      }
    }));
  };

  // Obtenir les entreprises de la liste sélectionnée
  const getCompaniesFromList = () => {
    return selectedList?.companies || [];
  };

  // Passer à l'étape suivante
  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      handleGenerateUrl();
    } else if (currentStep === 3) {
      handleLaunchScraping();
    }
  };

  // Générer l'URL LinkedIn Sales Navigator
  const handleGenerateUrl = async () => {
    setGeneratingUrl(true);

    try {
      // Construire les filtres selon la structure attendue
      const filters = selectedFilters.map(filterType => {
        const companies = getCompaniesFromList();
        const values = companies
          .filter((company: any) => companyFilters[filterType]?.[company.company_name])
          .map((company: any) => ({
            id: `urn:li:organization:${generateLinkedInId()}`,
            text: company.company_name,
            selectionType: companyFilters[filterType][company.company_name]
          }));

        return {
          type: filterType,
          values
        };
      }).filter(filter => filter.values.length > 0);

      const payload = {
        searchType,
        keywords,
        filters
      };

      console.log('🚀 Génération URL LinkedIn Sales Navigator:', payload);

      const response = await fetch('/api/linkedin-sales/generate-url', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ URL générée:', result);

        // Stocker l'URL générée et passer à l'étape 3
        const url = result.url || result.search_url || '';
        setGeneratedUrl(url);
        setScrapingConfig(prev => ({
          ...prev,
          search_url: url,
          name: selectedList?.name || 'Recherche sans nom'
        }));
        setCurrentStep(3);
      } else {
        console.error('❌ Erreur lors de la génération de l\'URL');
        alert('Erreur lors de la génération de l\'URL LinkedIn Sales Navigator');
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
      alert('Erreur réseau lors de la génération de l\'URL');
    } finally {
      setGeneratingUrl(false);
    }
  };

  // Lancer le scraping des leads
  const handleLaunchScraping = async () => {
    setLaunchingScraping(true);
    setScrapingStatus('running');

    try {
      console.log('🚀 Lancement du scraping Pronto:', scrapingConfig);

      // Préparer le payload en excluant les champs vides
      const payload = {
        search_url: scrapingConfig.search_url,
        name: scrapingConfig.name,
        streaming: scrapingConfig.streaming,
        limit: scrapingConfig.limit
      };

      // Ajouter les champs optionnels s'ils sont remplis
      if (scrapingConfig.webhook_url.trim()) {
        payload.webhook_url = scrapingConfig.webhook_url;
      }

      if (scrapingConfig.custom.hubspot_id.trim()) {
        payload.custom = {
          hubspot_id: scrapingConfig.custom.hubspot_id
        };
      }

      const response = await fetch('/api/pronto/leads', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Scraping lancé avec succès:', result);
        setScrapingResult(result);
        setScrapingStatus('completed');
        setCurrentStep(4); // Passer à l'étape des résultats
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur lors du lancement du scraping:', errorData);
        setScrapingStatus('error');
        alert(`Erreur lors du lancement du scraping: ${errorData.message || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('❌ Erreur réseau lors du lancement du scraping:', error);
      setScrapingStatus('error');
      alert('Erreur réseau lors du lancement du scraping');
    } finally {
      setLaunchingScraping(false);
    }
  };

  // Retourner à l'étape précédente
  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 4) {
      setCurrentStep(3);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-h-[90vh] w-full max-w-2xl mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configuration LinkedIn Sales Navigator - Étape {currentStep}/4
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Liste sélectionnée: <span className="font-medium">{selectedList?.name || 'Untitled'}</span>
              {selectedList?.companies_count && (
                <span className="ml-2 text-gray-500">({selectedList.companies_count} entreprises)</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement des options...</span>
            </div>
          ) : currentStep === 1 ? (
            <div className="space-y-6">
              {/* Étape 1: Type de recherche */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  1. Type de recherche
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSearchType('people')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      searchType === 'people'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Personnes</div>
                    <div className="text-sm text-gray-600">Rechercher des contacts</div>
                  </button>
                  <button
                    onClick={() => setSearchType('company')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      searchType === 'company'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Entreprises</div>
                    <div className="text-sm text-gray-600">Rechercher des entreprises</div>
                  </button>
                </div>
              </div>

              {/* Étape 2: Mots-clés */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  2. Mots-clés de recherche
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Ex: développeur, commercial, directeur..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Étape 3: Types de filtres */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  3. Types de filtres à utiliser
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez les types de filtres que vous souhaitez appliquer:
                </p>
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                  {getAvailableFilters().map((filter) => (
                    <label
                      key={filter.type}
                      className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(filter.type)}
                        onChange={() => toggleFilter(filter.type)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{filter.name}</div>
                        <div className="text-sm text-gray-600">{filter.description}</div>
                        <div className="text-xs text-gray-400 mt-1">Type: {filter.type}</div>
                      </div>
                      {selectedFilters.includes(filter.type) && (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Résumé */}
              {(keywords || selectedFilters.length > 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Résumé de la configuration:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Type: <span className="font-medium">{searchType === 'people' ? 'Personnes' : 'Entreprises'}</span></li>
                    {keywords && <li>• Mots-clés: <span className="font-medium">"{keywords}"</span></li>}
                    <li>• Filtres sélectionnés: <span className="font-medium">{selectedFilters.length}</span></li>
                    <li>• Liste d'entreprises: <span className="font-medium">{selectedList?.companies_count || 0} entreprises</span></li>
                  </ul>
                </div>
              )}
            </div>
          ) : currentStep === 2 ? (
            <div className="space-y-6">
              {/* Étape 2: Configuration des filtres d'entreprises */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Configuration des filtres d'entreprises
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Pour chaque type de filtre sélectionné, choisissez quelles entreprises inclure ou exclure:
                </p>

                {selectedFilters.map((filterType) => {
                  const filterInfo = getAvailableFilters().find(f => f.type === filterType);
                  const companies = getCompaniesFromList();

                  return (
                    <div key={filterType} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {filterInfo?.name} ({filterInfo?.type})
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">{filterInfo?.description}</p>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {companies.map((company: any, index: number) => {
                          const isIncluded = companyFilters[filterType]?.[company.company_name] === 'INCLUDED';
                          const isExcluded = companyFilters[filterType]?.[company.company_name] === 'EXCLUDED';

                          return (
                            <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{company.company_name}</div>
                                {company.company_website && (
                                  <div className="text-sm text-gray-500">{company.company_website}</div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleCompanyFilter(filterType, company.company_name, 'INCLUDED')}
                                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    isIncluded
                                      ? 'bg-green-100 text-green-800 border border-green-300'
                                      : 'bg-gray-100 text-gray-700 hover:bg-green-50'
                                  }`}
                                >
                                  Inclure
                                </button>
                                <button
                                  onClick={() => toggleCompanyFilter(filterType, company.company_name, 'EXCLUDED')}
                                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    isExcluded
                                      ? 'bg-red-100 text-red-800 border border-red-300'
                                      : 'bg-gray-100 text-gray-700 hover:bg-red-50'
                                  }`}
                                >
                                  Exclure
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Résumé de la configuration finale */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Résumé final:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Type: <span className="font-medium">{searchType === 'people' ? 'Personnes' : 'Entreprises'}</span></li>
                    <li>• Mots-clés: <span className="font-medium">"{keywords}"</span></li>
                    <li>• Filtres configurés: <span className="font-medium">{selectedFilters.length}</span></li>
                    {selectedFilters.map(filterType => {
                      const companies = getCompaniesFromList();
                      const includedCount = companies.filter((c: any) => companyFilters[filterType]?.[c.company_name] === 'INCLUDED').length;
                      const excludedCount = companies.filter((c: any) => companyFilters[filterType]?.[c.company_name] === 'EXCLUDED').length;
                      const filterInfo = getAvailableFilters().find(f => f.type === filterType);

                      return (
                        <li key={filterType}>
                          • {filterInfo?.name}: <span className="font-medium">{includedCount} incluses, {excludedCount} exclues</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          ) : currentStep === 3 ? (
            <div className="space-y-6">
              {/* Étape 3: Configuration du scraping */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Configuration du scraping de leads
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configurez les paramètres pour lancer le scraping des leads LinkedIn.
                </p>

                <div className="space-y-4">
                  {/* URL de recherche (lecture seule) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de recherche LinkedIn Sales Navigator *
                    </label>
                    <textarea
                      value={scrapingConfig.search_url}
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm resize-none"
                      rows={3}
                      placeholder="L'URL sera générée automatiquement..."
                    />
                  </div>

                  {/* Nom de la recherche */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de la recherche *
                    </label>
                    <input
                      type="text"
                      value={scrapingConfig.name}
                      onChange={(e) => setScrapingConfig(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Développeurs Paris - Janvier 2025"
                    />
                  </div>

                  {/* Webhook URL (optionnel) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de webhook (optionnel)
                    </label>
                    <input
                      type="url"
                      value={scrapingConfig.webhook_url}
                      onChange={(e) => setScrapingConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://votre-app.com/webhook/pronto"
                    />
                  </div>

                  {/* Streaming */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mode de streaming
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={scrapingConfig.streaming === true}
                          onChange={() => setScrapingConfig(prev => ({ ...prev, streaming: true }))}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Activé (recommandé)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={scrapingConfig.streaming === false}
                          onChange={() => setScrapingConfig(prev => ({ ...prev, streaming: false }))}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Désactivé</span>
                      </label>
                    </div>
                  </div>

                  {/* Limite */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limite de leads à extraire
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={scrapingConfig.limit}
                      onChange={(e) => setScrapingConfig(prev => ({ ...prev, limit: parseInt(e.target.value) || 100 }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Entre 1 et 1000 leads</p>
                  </div>

                  {/* HubSpot ID (optionnel) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID HubSpot (optionnel)
                    </label>
                    <input
                      type="text"
                      value={scrapingConfig.custom.hubspot_id}
                      onChange={(e) => setScrapingConfig(prev => ({
                        ...prev,
                        custom: { ...prev.custom, hubspot_id: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="134567"
                    />
                  </div>
                </div>

                {/* Résumé de la configuration */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <h4 className="font-medium text-blue-900 mb-2">Résumé de la configuration:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Nom: <span className="font-medium">{scrapingConfig.name || 'Non défini'}</span></li>
                    <li>• Streaming: <span className="font-medium">{scrapingConfig.streaming ? 'Activé' : 'Désactivé'}</span></li>
                    <li>• Limite: <span className="font-medium">{scrapingConfig.limit} leads</span></li>
                    <li>• Entreprises ciblées: <span className="font-medium">{selectedList?.companies_count || 0}</span></li>
                    {scrapingConfig.webhook_url && <li>• Webhook configuré</li>}
                    {scrapingConfig.custom.hubspot_id && <li>• HubSpot ID: {scrapingConfig.custom.hubspot_id}</li>}
                  </ul>
                </div>
              </div>
            </div>
          ) : currentStep === 4 ? (
            <div className="space-y-6">
              {/* Étape 4: Résultats du scraping */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Résultats du scraping
                </h3>

                {scrapingStatus === 'running' && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Scraping en cours...</p>
                    <p className="text-sm text-gray-500 mt-2">Cela peut prendre quelques minutes</p>
                  </div>
                )}

                {scrapingStatus === 'completed' && scrapingResult && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span className="font-medium text-green-900">Scraping lancé avec succès !</span>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Détails de la recherche:</h4>
                      <dl className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <dt className="font-medium text-gray-700">ID de recherche:</dt>
                          <dd className="text-gray-600 font-mono">{scrapingResult.search?.search_id}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">Nom:</dt>
                          <dd className="text-gray-600">{scrapingResult.search?.name}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">Statut:</dt>
                          <dd className="text-gray-600">{scrapingResult.search?.status}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">Limite:</dt>
                          <dd className="text-gray-600">{scrapingResult.search?.limit} leads</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">Créé le:</dt>
                          <dd className="text-gray-600">
                            {scrapingResult.search?.created_at ?
                              new Date(scrapingResult.search.created_at).toLocaleString('fr-FR') :
                              'Non disponible'
                            }
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Prochaines étapes:</strong> Le scraping est maintenant en cours.
                        Vous recevrez les résultats via webhook (si configuré) ou vous pourrez
                        consulter les résultats dans votre dashboard Pronto.
                      </p>
                    </div>
                  </div>
                )}

                {scrapingStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <X className="w-5 h-5 text-red-500 mr-2" />
                      <span className="font-medium text-red-900">Erreur lors du scraping</span>
                    </div>
                    <p className="text-sm text-red-700 mt-2">
                      Une erreur s'est produite lors du lancement du scraping.
                      Vérifiez vos paramètres et réessayez.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
            )}
          </div>

          {currentStep < 4 && (
            <button
              onClick={handleNext}
              disabled={
                currentStep === 1
                  ? (!keywords || selectedFilters.length === 0)
                  : currentStep === 2
                  ? (generatingUrl || selectedFilters.every(filterType => {
                      const companies = getCompaniesFromList();
                      return !companies.some((c: any) => companyFilters[filterType]?.[c.company_name]);
                    }))
                  : currentStep === 3
                  ? (!scrapingConfig.search_url || !scrapingConfig.name || launchingScraping)
                  : false
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {(generatingUrl || launchingScraping) && (
                <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {currentStep === 1
                ? 'Étape suivante'
                : currentStep === 2
                ? (generatingUrl ? 'Génération...' : 'Générer URL LinkedIn')
                : currentStep === 3
                ? (launchingScraping ? 'Lancement...' : 'Lancer le scraping')
                : 'Terminer'
              }
            </button>
          )}

          {currentStep === 4 && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Terminer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
