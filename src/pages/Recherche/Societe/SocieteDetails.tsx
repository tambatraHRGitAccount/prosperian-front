import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = 'https://prosperian.onrender.com/api/search';

// Interface pour la réponse de l'endpoint d'enrichissement Pronto
interface ProntoEnrichmentResponse {
  found: boolean;
  name?: string;
  description?: string;
  industry?: string;
  website?: string;
  employeeCount?: number;
  linkedin?: string;
  headquarters?: {
    city?: string;
    country?: string;
    line1?: string;
    postalCode?: string;
  };
  companyPictureDisplayImage?: {
    artifacts: Array<{
      width: number;
      height: number;
      fileIdentifyingUrlPathSegment: string;
    }>;
    rootUrl: string;
  };
  // Autres champs possibles...
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

// Fonction pour enrichir l'entreprise avec Pronto
const enrichWithPronto = async (companyName: string): Promise<ProntoEnrichmentResponse | null> => {
  if (!companyName) return null;
  
  // Vérifier d'abord le cache localStorage
  const cachedData = getCachedEnrichment(companyName);
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const response = await fetch(`https://prosperian.onrender.com/api/pronto/companies/enrich?name=${encodeURIComponent(companyName)}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data: ProntoEnrichmentResponse = await response.json();
      
      // Mettre en cache même si found: false (pour éviter de refaire l'appel)
      setCachedEnrichment(companyName, data);
      
      if (data.found) {
        console.log(`✅ Enrichissement Pronto réussi pour: ${companyName}`);
      } else {
        console.log(`⚠️ Aucune donnée Pronto trouvée pour: ${companyName}`);
      }
      
      return data;
    } else {
      console.error(`❌ Erreur lors de l'enrichissement Pronto pour: ${companyName}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Erreur réseau lors de l'enrichissement Pronto:`, error);
    return null;
  }
};

const SocieteDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('legal');
  const [societeData, setSocieteData] = useState<any>(null);
  const [prontoEnrichment, setProntoEnrichment] = useState<ProntoEnrichmentResponse | null>(null);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Données de revenus dynamiques basées sur les finances de l'entreprise
  const getRevenueData = (finances: any) => {
    if (!finances || typeof finances !== 'object') {
      return [];
    }

    const revenueData = [];
    const years = Object.keys(finances).filter(year => 
      finances[year] && finances[year].ca != null
    ).sort((a, b) => Number(a) - Number(b));

    for (const year of years) {
      const ca = finances[year].ca;
      if (ca != null) {
        revenueData.push({
          year: parseInt(year),
          revenue: Math.round(ca / 1_000_000) // Convertir en millions d'euros
        });
      }
    }

    return revenueData;
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    // Récupérer les données de l'entreprise
    fetch(`${API_URL}?q=${id}&limite_matching_etablissements=10&page=1&per_page=10`, {
      headers: { accept: 'application/json' }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erreur lors de la récupération des données société');
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const companyData = data.results[0];
          setSocieteData(companyData);
          
          // Enrichir avec Pronto si on a le nom de l'entreprise
          if (companyData.nom_complet) {
            setEnrichmentLoading(true);
            const enrichment = await enrichWithPronto(companyData.nom_complet);
            setProntoEnrichment(enrichment);
            setEnrichmentLoading(false);
          }
        } else {
          setError('Aucune société trouvée pour ce SIREN');
        }
      })
      .catch((e) => setError(e.message || 'Erreur inconnue'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full mx-auto">
        <style>{`
          @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
          .animate-spin-reverse { animation: spin-reverse 1s linear infinite; }
        `}</style>
        <div className="relative w-12 h-12 mb-2">
          <div className="absolute inset-0 rounded-full border-4 border-orange-400 border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-[#E95C41] border-b-transparent animate-spin-reverse"></div>
        </div>
        <span className="ml-2 text-gray-600 text-lg">Chargement des données société...</span>
      </div>
    );
  }
  if (error || !societeData) {
    return <div className="flex items-center justify-center min-h-screen text-lg text-red-600">{error || 'Erreur inconnue'}</div>;
  }

  // Données dynamiques basées sur l'enrichissement Pronto
  const dynamicData = {
    siteWeb: prontoEnrichment?.website || 'Site web non disponible',
    linkedin: prontoEnrichment?.linkedin || 'https://www.linkedin.com/',
    social: prontoEnrichment?.description || societeData.activite_principale || 'Description non disponible',
    revenueData: getRevenueData(societeData.finances)
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans p-6">
      {/* Company Overview Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-5xl mx-auto my-5">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Section: Company Info */}
          <div className="flex flex-col items-start w-full md:w-1/2">
            <h1 className="font-bold text-3xl text-gray-800 mb-6">{societeData.nom_complet}</h1>
            <div className="flex flex-col gap-y-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-1 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#E95C41"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" stroke="#E95C41" strokeWidth="0.5" />
                </svg>
                <p className="text-base text-gray-700">
                  Site Web: {dynamicData.siteWeb !== 'Site web non disponible' ? (
                    <a href={dynamicData.siteWeb} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {dynamicData.siteWeb}
                    </a>
                  ) : (
                    dynamicData.siteWeb
                  )}
                </p>
              </div>
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-1 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#E95C41"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" stroke="#E95C41" strokeWidth="0.5" />
                </svg>
                <p className="text-base text-gray-700">
                  LinkedIn: <a href={dynamicData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{dynamicData.linkedin}</a>
                </p>
              </div>
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-1 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#E95C41"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" stroke="#E95C41" strokeWidth="0.5" />
                </svg>
                <p className="text-base text-gray-700">
                  Description: {dynamicData.social}
                  {enrichmentLoading && (
                    <span className="ml-2 text-xs text-gray-500">
                      <div className="inline-flex items-center gap-1">
                        <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        Enrichissement en cours...
                      </div>
                    </span>
                  )}
                  {prontoEnrichment?.found && (
                    <span className="ml-2 text-xs text-green-600 font-medium">
                      ✓ Enrichi Pronto
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Right Section: Revenue Chart */}
          <div className="flex flex-col items-center justify-center w-full md:w-1/2">
            <div className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <h2 className="text-lg font-medium text-gray-700 mb-2 text-center">Chiffre d'affaires</h2>
              {dynamicData.revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dynamicData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#1E3A8A" name="Revenue (M€)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <p>Aucune donnée financière disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Actions */}
        <div className="flex flex-col sm:flex-row justify-start items-center gap-4 mt-8 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center bg-gradient-to-r from-orange-400 to-[#E95C41] hover:opacity-90 text-white font-medium py-3 px-6 rounded-full"
          >
            <span className="mr-2 flex-shrink-0">
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </span>
            Retour
          </button>
        </div>
      </div>

      {/* Onglets principaux */}
      <div className="max-w-5xl mx-auto">
        <div className="">
          {/* Onglets désactivés pour l'instant */}
        </div>

        {/* Contenu des informations générales */}
        {activeTab === 'legal' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colonne 1 - Informations générales de l'entreprise */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">SIREN</div>
                  <div className="text-gray-800">{societeData.siren}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Nom complet</div>
                  <div className="text-gray-800">{societeData.nom_complet}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Raison sociale</div>
                  <div className="text-gray-800">{societeData.nom_raison_sociale}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Sigle</div>
                  <div className="text-gray-800">{societeData.sigle || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Nombre d'établissements</div>
                  <div className="text-gray-800">{societeData.nombre_etablissements}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Nombre d'établissements ouverts</div>
                  <div className="text-gray-800">{societeData.nombre_etablissements_ouverts}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Activité principale</div>
                  <div className="text-gray-800">{societeData.activite_principale}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Catégorie entreprise</div>
                  <div className="text-gray-800">{societeData.categorie_entreprise}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Année catégorie entreprise</div>
                  <div className="text-gray-800">{societeData.annee_categorie_entreprise}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Date de création</div>
                  <div className="text-gray-800">{societeData.date_creation}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">État administratif</div>
                  <div className="text-gray-800">{societeData.etat_administratif === 'A' ? 'Actif' : 'Inactif'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Nature juridique</div>
                  <div className="text-gray-800">{societeData.nature_juridique}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Section activité principale</div>
                  <div className="text-gray-800">{societeData.section_activite_principale}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Tranche effectif salarié</div>
                  <div className="text-gray-800">{societeData.tranche_effectif_salarie}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Année tranche effectif salarié</div>
                  <div className="text-gray-800">{societeData.annee_tranche_effectif_salarie}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Statut diffusion</div>
                  <div className="text-gray-800">{societeData.statut_diffusion}</div>
                </div>
              </div>
            </div>

            {/* Colonne 2 - Informations du siège */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Siège social</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Adresse siège</div>
                  <div className="text-gray-800">{societeData.siege.adresse}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Code postal</div>
                  <div className="text-gray-800">{societeData.siege.code_postal}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Commune</div>
                  <div className="text-gray-800">{societeData.siege.libelle_commune}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Département</div>
                  <div className="text-gray-800">{societeData.siege.departement}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Région</div>
                  <div className="text-gray-800">{societeData.siege.region}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">EPCI</div>
                  <div className="text-gray-800">{societeData.siege.epci}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">SIRET siège</div>
                  <div className="text-gray-800">{societeData.siege.siret}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Activité principale siège</div>
                  <div className="text-gray-800">{societeData.siege.activite_principale}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Caractère employeur</div>
                  <div className="text-gray-800">{societeData.siege.caractere_employeur === 'O' ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Date création siège</div>
                  <div className="text-gray-800">{societeData.siege.date_creation}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Date début activité</div>
                  <div className="text-gray-800">{societeData.siege.date_debut_activite}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Date mise à jour INSEE</div>
                  <div className="text-gray-800">{societeData.siege.date_mise_a_jour_insee}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Coordonnées</div>
                  <div className="text-gray-800">{societeData.siege.coordonnees}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Latitude</div>
                  <div className="text-gray-800">{societeData.siege.latitude}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Longitude</div>
                  <div className="text-gray-800">{societeData.siege.longitude}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Enseignes</div>
                  <div className="text-gray-800">{Array.isArray(societeData.siege.liste_enseignes) ? societeData.siege.liste_enseignes.join(', ') : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">FINESS</div>
                  <div className="text-gray-800">{societeData.siege.liste_finess ? societeData.siege.liste_finess.join(', ') : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Conventions collectives (IDCC)</div>
                  <div className="text-gray-800">{societeData.siege.liste_idcc ? societeData.siege.liste_idcc.join(', ') : '-'}</div>
                </div>
              </div>
            </div>

            {/* Colonne 3 - Finances et Compléments */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Finances et compléments</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Chiffre d'affaires (2023)</div>
                  <div className="text-gray-800">{societeData.finances && societeData.finances['2023'] && societeData.finances['2023'].ca != null ? societeData.finances['2023'].ca.toLocaleString() + ' €' : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Résultat net (2023)</div>
                  <div className="text-gray-800">{societeData.finances && societeData.finances['2023'] && societeData.finances['2023'].resultat_net != null ? societeData.finances['2023'].resultat_net.toLocaleString() + ' €' : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Convention collective renseignée</div>
                  <div className="text-gray-800">{societeData.complements.convention_collective_renseignee ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">EGAPRO renseignée</div>
                  <div className="text-gray-800">{societeData.complements.egapro_renseignee ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Achats responsables</div>
                  <div className="text-gray-800">{societeData.complements.est_achats_responsables ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Alim confiance</div>
                  <div className="text-gray-800">{societeData.complements.est_alim_confiance ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Association</div>
                  <div className="text-gray-800">{societeData.complements.est_association ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Bio</div>
                  <div className="text-gray-800">{societeData.complements.est_bio ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Entrepreneur individuel</div>
                  <div className="text-gray-800">{societeData.complements.est_entrepreneur_individuel ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Entrepreneur spectacle</div>
                  <div className="text-gray-800">{societeData.complements.est_entrepreneur_spectacle ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">ESS</div>
                  <div className="text-gray-800">{societeData.complements.est_ess ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">FINESS</div>
                  <div className="text-gray-800">{societeData.complements.est_finess ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Organisme de formation</div>
                  <div className="text-gray-800">{societeData.complements.est_organisme_formation ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Qualiopi</div>
                  <div className="text-gray-800">{societeData.complements.est_qualiopi ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">RGE</div>
                  <div className="text-gray-800">{societeData.complements.est_rge ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Service public</div>
                  <div className="text-gray-800">{societeData.complements.est_service_public ? 'Oui' : 'Non'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-medium mb-1">Bilan GES</div>
                  <div className="text-gray-800">{societeData.complements.bilan_ges_renseigne ? 'Oui' : 'Non'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-100 text-center py-8 mt-8 rounded-2xl text-xs text-gray-500 max-w-5xl mx-auto">
          <div className="max-w-7xl mx-auto">
            <span>© SMART DATA 2025 • </span>
            <a href="#" className="hover:text-red-600 transition-colors">CGV / CGU</a> •
            <a href="#" className="hover:text-red-600 transition-colors"> Vie privée & Confidentialité</a> •
            <a href="#" className="hover:text-red-600 transition-colors"> Mentions Légales</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocieteDetails;