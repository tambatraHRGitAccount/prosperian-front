import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:4000/api/search';

const SocieteDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('legal');
  const [societeData, setSocieteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Static data with dynamic company name
  const staticData = {
    siteWeb: 'Trouvez rapidement un Emploi avec Hellowork, Premier site Emploi en France : 933 063 Offres d’Emploi, 12 402 Entreprises qui recrutent, CV, alerte mail, actualités.',
    linkedin: 'https://www.linkedin.com/company/hellowork-fr/',
    social: 'annonces d’emploi sur internet. Activités de formation. Prestations de services aux entreprises... Domaine informatique télécommunications internet et systèmes d’information en général et des ressources humaines (début : 20.08.2002).',
    revenueData: [
      { year: 2014, revenue: 23.3 },
      { year: 2015, revenue: 28.5 },
      { year: 2016, revenue: 35 },
      { year: 2017, revenue: 43.6 },
      { year: 2018, revenue: 57.4 },
      { year: 2019, revenue: 77.8 },
      { year: 2020, revenue: 96.2 },
      { year: 2021, revenue: 100 },
      { year: 2022, revenue: 125 },
      { year: 2023, revenue: 125 },
    ],
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`${API_URL}?q=${id}&limite_matching_etablissements=10&page=1&per_page=10`, {
      headers: { accept: 'application/json' }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erreur lors de la récupération des données société');
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setSocieteData(data.results[0]);
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
                <p className="text-base text-gray-700">Site Web: {staticData.siteWeb}</p>
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
                <p className="text-base text-gray-700">LinkedIn: <a href={staticData.linkedin} className="text-blue-600 hover:underline">{staticData.linkedin}</a></p>
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
                <p className="text-base text-gray-700">Réseau Social: {staticData.social}</p>
              </div>
            </div>
          </div>

          {/* Right Section: Revenue Chart */}
          <div className="flex flex-col items-center justify-center w-full md:w-1/2">
            <div className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <h2 className="text-lg font-medium text-gray-700 mb-2 text-center">Chiffre d'affaires</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={staticData.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#1E3A8A" name="Revenue (M€)" /> {/* Changed to dark blue */}
                </BarChart>
              </ResponsiveContainer>
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
          {/* <button
            onClick={() => {}}
            className="text-[#E95C41] font-medium py-3 px-6 rounded-full hover:bg-gray-100"
          >
            Télécharger les statuts
          </button> */}
        </div>
      </div>

      {/* Onglets principaux */}
      <div className="max-w-5xl mx-auto">
        <div className="">
          {/* <button
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === 'legal'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('legal')}
            aria-current={activeTab === 'legal' ? 'page' : undefined}
          >
            <FileText className="w-4 h-4" />
          </button> */}
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
                  <div className="text-gray-800">{societeData.activite_principale} (Activités de poste dans le cadre du service universel)</div>
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
                  <div className="text-gray-800">{societeData.nature_juridique} (Établissement public à caractère industriel et commercial)</div>
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