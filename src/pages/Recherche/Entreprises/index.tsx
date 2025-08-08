import React, { useState, useEffect, useCallback, useMemo } from "react";
import { EntrepriseApiResponse, EntrepriseApiResult, ProntoLeadWithCompany } from "@entities/Business";
import { MainContent } from "./_components/MainContent";
import { RightPanel } from "./_components/RightPanel";
import { useProntoData } from "@hooks/useProntoData";
import { useFilterContext } from "@contexts/FilterContext";
import { BarChart3 } from "lucide-react";
import francePostalCodes from '@data/france_postal_codes.json';

// Fonction utilitaire pour obtenir toutes les villes françaises
const getAllFrenchCities = () => {
  const cities = francePostalCodes.map(item => item.titre).sort();
  console.log('🏙️ getAllFrenchCities - Villes chargées:', cities.length);
  return cities;
};
import { googlePlacesService } from "@services/googlePlacesService";
import { semanticService } from "@services/semanticService";
import { apifyService } from "@services/apifyService";

const API_URL =
  "http://localhost:4000/api/search?section_activite_principale=A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U";

export const Entreprises = () => {
  const [businesses, setBusinesses] = useState<EntrepriseApiResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { filters } = useFilterContext();

  // Calculer les villes françaises une seule fois
  const availableCities = useMemo(() => {
    const cities = getAllFrenchCities();
    console.log('🏙️ Entreprises Page - Villes calculées avec useMemo:', cities.length);
    return cities;
  }, []);

  // Pronto data
  const { leads: prontoLeads } = useProntoData();

  // Mapping Pronto: nom => { logo, description }
  const prontoMap = prontoLeads.reduce((acc: Record<string, { logo: string; description: string }>, lead: ProntoLeadWithCompany) => {
    if (lead.company && lead.company.name) {
              acc[lead.company.name.trim().toLowerCase()] = {
          logo: lead.company.company_profile_picture,
          description: lead.company.description
        };
    }
    return acc;
  }, {});

  // Enrichir les entreprises avec logo/description Pronto si nom identique
  const enrichedBusinesses = businesses.map(biz => {
    const pronto = prontoMap[biz.nom_complet.trim().toLowerCase()];
    return pronto
      ? { ...biz, prontoLogo: pronto.logo, prontoDescription: pronto.description }
      : biz;
  });

  const fetchBusinesses = useCallback(
    async (
      page: number,
      perPageValue: number,
      nafCodes: string[],
      revenueRange: [number, number],
      ageRange: [number, number],
      employeeRange: [number, number],
      legalForms: string[],
      idConventionCollective?: string,
      selectedCities: string[] = [], // Ajout du paramètre
      googleActivities: string[] = [], // Activités Google GMB
      semanticTerms: string[] = [], // Termes sémantiques
      enseignes: string[] = [], // Enseignes/franchises
      activitySearchType: string = 'naf', // Type de recherche d'activité
      selectedContact?: string // Contact sélectionné
    ) => {
      console.log('🔍 [ENTREPRISES] fetchBusinesses appelé avec:');
      console.log('🔍 [ENTREPRISES] - nafCodes:', nafCodes);
      console.log('🔍 [ENTREPRISES] - activitySearchType:', activitySearchType);
      console.log('🔍 [ENTREPRISES] - googleActivities:', googleActivities);
      console.log('🔍 [ENTREPRISES] - semanticTerms:', semanticTerms);
      console.log('🔍 [ENTREPRISES] - enseignes:', enseignes);
      
      setLoading(true);
      setError(null);
      try {
        // Si c'est une recherche Google GMB, utiliser l'API Google Places
        if (activitySearchType === 'google' && googleActivities.length > 0) {
          console.log('🔍 Recherche via Google Places pour:', googleActivities);
          
          // Rechercher via Google Places
          const location = selectedCities.length > 0 ? selectedCities.join(', ') : 'France';
          const googleResponse = await googlePlacesService.searchAdvanced({
            activities: googleActivities,
            location: location,
            limit: perPageValue,
            combine_results: true
          });

          // Convertir les résultats Google Places au format EntrepriseApiResult
          const convertedResults: EntrepriseApiResult[] = googleResponse.results.map(result => ({
            siren: result.google_place_id,
            nom_complet: result.nom_complet,
            nom_raison_sociale: result.raison_sociale,
            sigle: null,
            nombre_etablissements: 1,
            nombre_etablissements_ouverts: 1,
            siege: {
              activite_principale: result.activite_principale,
              activite_principale_registre_metier: null,
              annee_tranche_effectif_salarie: '',
              adresse: result.adresse_complete || '',
              caractere_employeur: '',
              cedex: null,
              code_pays_etranger: null,
              code_postal: result.code_postal || '',
              commune: result.ville || '',
              complement_adresse: null,
              coordonnees: '',
              date_creation: result.date_creation || '',
              date_debut_activite: result.date_creation || '',
              date_fermeture: null,
              date_mise_a_jour: null,
              date_mise_a_jour_insee: result.date_extraction,
              departement: result.departement || '',
              distribution_speciale: null,
              epci: '',
              est_siege: true,
              etat_administratif: 'A',
              geo_adresse: result.adresse_complete || '',
              geo_id: '',
              indice_repetition: null,
              latitude: result.latitude?.toString() || '',
              libelle_cedex: null,
              libelle_commune: result.ville || '',
              libelle_commune_etranger: null,
              libelle_pays_etranger: null,
              libelle_voie: '',
              liste_enseignes: null,
              liste_finess: null,
              liste_id_bio: null,
              liste_idcc: null,
              liste_id_organisme_formation: null,
              liste_rge: null,
              liste_uai: null,
              longitude: result.longitude?.toString() || '',
              nom_commercial: null,
              numero_voie: '',
              region: '',
              siret: result.google_place_id,
              statut_diffusion_etablissement: 'O',
              tranche_effectif_salarie: '',
              type_voie: ''
            },
            activite_principale: result.activite_principale,
            categorie_entreprise: '',
            caractere_employeur: null,
            annee_categorie_entreprise: '',
            date_creation: result.date_creation || '',
            date_fermeture: null,
            date_mise_a_jour: result.date_extraction,
            date_mise_a_jour_insee: result.date_extraction,
            date_mise_a_jour_rne: '',
            dirigeants: [],
            etat_administratif: 'A',
            nature_juridique: '',
            section_activite_principale: '',
            tranche_effectif_salarie: '',
            annee_tranche_effectif_salarie: '',
            statut_diffusion: 'O',
            matching_etablissements: [],
            finances: {},
            complements: {
              // Données spécifiques Google Places
              google_place_id: result.google_place_id,
              google_rating: result.google_rating,
              google_reviews_count: result.google_reviews_count,
              google_categories: result.google_categories,
              google_photos: result.google_photos,
              telephone: result.telephone,
              site_web: result.site_web,
              source: 'google_places'
            }
          }));

          setBusinesses(convertedResults);
          setTotalResults(googleResponse.total_results);
          setCurrentPage(page);
          setPerPage(perPageValue);
          setTotalPages(Math.ceil(googleResponse.total_results / perPageValue));
          
          console.log(`✅ ${convertedResults.length} entreprises trouvées via Google Places`);
          return;
        }

        // Si c'est une recherche par secteur, utiliser les codes NAF des secteurs sélectionnés
        if (activitySearchType === 'secteur' && nafCodes.length > 0) {
          console.log('🔍 Recherche via codes NAF des secteurs:', nafCodes);
        }

        // Recherche classique via l'API INSEE/NAF (pour NAF et Secteur)
        let url = `${API_URL}&page=${page}&per_page=${perPageValue}`;

        // Filtres d'activité (codes NAF ou codes NAF des secteurs)
        if (nafCodes.length > 0) {
          url += `&activite_principale=${nafCodes.join(',')}`;
        }

        // Filtres de chiffre d'affaires
        if (revenueRange && revenueRange.length === 2 && (revenueRange[0] > 0 || revenueRange[1] < 1000000)) {
          if (revenueRange[0] > 0) {
            url += `&ca_min=${revenueRange[0]}`;
          }
          if (revenueRange[1] < 1000000) {
            url += `&ca_max=${revenueRange[1]}`;
          }
        }

        // Filtres d'âge d'entreprise
        if (ageRange && ageRange.length === 2 && (ageRange[0] > 0 || ageRange[1] < 50)) {
          if (ageRange[0] > 0) {
            url += `&age_min=${ageRange[0]}`;
          }
          if (ageRange[1] < 50) {
            url += `&age_max=${ageRange[1]}`;
          }
        }
        
        // Filtres de nombre d'employés
        if (employeeRange && employeeRange.length === 2 && (employeeRange[0] > 0 || employeeRange[1] < 5000)) {
          if (employeeRange[0] > 0) {
            url += `&employee_min=${employeeRange[0]}`;
          }
          if (employeeRange[1] < 5000) {
            url += `&employee_max=${employeeRange[1]}`;
          }
        }

        // Filtres de nature juridique
        if (legalForms && legalForms.length > 0) {
          url += `&nature_juridique=${legalForms.join(',')}`;
        }

        // Filtre de convention collective
        if (idConventionCollective) {
          url += `&id_convention_collective=${idConventionCollective}`;
        }

        // Filtre de recherche de contact
        if (selectedContact) {
          url += `&q=${encodeURIComponent(selectedContact)}&limite_matching_etablissements=10`;
        }

        // Filtre code_postal (mapping villes -> codes postaux)
        if (selectedCities && selectedCities.length > 0) {
          // On récupère tous les codes postaux correspondant aux villes sélectionnées
          const postalCodes = francePostalCodes
            .filter(entry => selectedCities.includes(entry.titre))
            .map(entry => entry.code);
          if (postalCodes.length > 0) {
            url += `&code_postal=${encodeURIComponent(postalCodes.join(','))}`;
          }
        }

        // Filtre département
        if (filters.departmentCodes && filters.departmentCodes.length > 0) {
          url += `&departement=${encodeURIComponent(filters.departmentCodes.join(','))}`;
        }

        // Filtre région
        if (filters.regionCodes && filters.regionCodes.length > 0) {
          url += `&region=${encodeURIComponent(filters.regionCodes.join(','))}`;
        }

        console.log('🔍 URL de recherche avec filtres complets:', url);
        console.log('📊 Filtres appliqués:', {
          type: activitySearchType,
          activites: nafCodes,
          chiffreAffaires: revenueRange,
          ageEntreprise: ageRange,
          nombreEmployes: employeeRange,
          naturesJuridiques: legalForms,
          conventionCollective: idConventionCollective,
          villes: selectedCities,
          departements: filters.departmentCodes,
          regions: filters.regionCodes
        });

        const res = await fetch(url, { headers: { accept: "application/json" } });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Erreur lors de la récupération des entreprises");
        }

        const data: EntrepriseApiResponse = await res.json();

        console.log('✅ Réponse API reçue:', {
          total: data.total_results,
          entreprisesRecues: data.results?.length || 0,
          enrichedWithAge: (data as any).enriched_with_age,
          filteredByEmployees: (data as any).filtered_by_employees,
          filtersApplied: (data as any).filters_applied
        });

        setBusinesses(data.results || []);
        setTotalResults(data.total_results || 0);
        setCurrentPage(data.page || page);
        setPerPage(data.per_page || perPageValue);
        setTotalPages(data.total_pages || 1);
      } catch (e: any) {
        console.error('❌ Erreur lors de la recherche:', e);
        setError(e.message || "Erreur inconnue");
        setBusinesses([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

    useEffect(() => {
    console.log('🔍 [ENTREPRISES] useEffect déclenché');
    console.log('🔍 [ENTREPRISES] filters reçus:', filters);
    console.log('🔍 [ENTREPRISES] filters.sectorNafCodes:', filters.sectorNafCodes);
    console.log('🔍 [ENTREPRISES] filters.activitySearchType:', filters.activitySearchType);
    console.log('🔍 [ENTREPRISES] filters.sectors:', filters.sectors);
    console.log('🔍 [ENTREPRISES] filters.departmentCodes:', filters.departmentCodes);
    console.log('🔍 [ENTREPRISES] filters.departments:', filters.departments);
    console.log('🔍 [ENTREPRISES] filters.regionCodes:', filters.regionCodes);
    console.log('🔍 [ENTREPRISES] filters.regions:', filters.regions);
    
    // Déterminer quels codes NAF utiliser selon le type de recherche
    let nafCodesToUse: string[] = [];
    if (filters.activitySearchType === 'secteur' && filters.sectorNafCodes && filters.sectorNafCodes.length > 0) {
      nafCodesToUse = filters.sectorNafCodes;
      console.log('🔍 [ENTREPRISES] Utilisation des codes NAF des secteurs:', nafCodesToUse);
    } else {
      nafCodesToUse = filters.activities || [];
      console.log('🔍 [ENTREPRISES] Utilisation des codes NAF classiques:', nafCodesToUse);
    }
    
    fetchBusinesses(
      currentPage, 
      perPage, 
      nafCodesToUse, // Utiliser les codes NAF appropriés selon le type de recherche
      filters.revenueRange || [0, 1000000], 
      filters.ageRange || [0, 50],
      filters.employeeRange || [0, 5000],
      filters.legalForms || [],
      filters.id_convention_collective || undefined,
      filters.cities || [], // Filtre villes
      filters.googleActivities || [], // Activités Google GMB
      filters.semanticTerms || [], // Termes sémantiques
      filters.enseignes || [], // Enseignes (garder pour compatibilité)
      filters.activitySearchType || 'naf', // Type de recherche d'activité
      filters.selectedContact // Contact sélectionné
    );
    // eslint-disable-next-line
  }, [currentPage, perPage, filters.activities, filters.revenueRange, filters.ageRange, filters.employeeRange, filters.legalForms, filters.id_convention_collective, filters.cities, filters.googleActivities, filters.semanticTerms, filters.sectorNafCodes, filters.departmentCodes, filters.activitySearchType, filters.selectedContact]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  // Ajouter l'état pour contrôler la visibilité du RightPanel
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 relative">
      <div className={`overflow-auto relative`}
           style={isRightPanelVisible
             ? { width: 'calc(100vw - 384px - 320px)' } // Sidebar (384px) + RightPanel (320px)
             : { width: 'calc(100vw - 384px)' } // Seulement Sidebar (384px)
           }>
      <MainContent
        businesses={enrichedBusinesses}
        totalBusinesses={totalResults}
        loading={loading}
        error={error}
                onRetry={() => {
          // Déterminer quels codes NAF utiliser selon le type de recherche
          let nafCodesToUse: string[] = [];
          if (filters.activitySearchType === 'secteur' && filters.sectorNafCodes && filters.sectorNafCodes.length > 0) {
            nafCodesToUse = filters.sectorNafCodes;
          } else {
            nafCodesToUse = filters.activities || [];
          }
          
          fetchBusinesses(
            currentPage, 
            perPage, 
            nafCodesToUse,
            filters.revenueRange || [0, 1000000], 
            filters.ageRange || [0, 50],
            filters.employeeRange || [0, 5000],
            filters.legalForms || [],
            filters.id_convention_collective || undefined,
            filters.cities || [],
            filters.googleActivities || [],
            filters.semanticTerms || [],
            filters.enseignes || [],
            filters.activitySearchType || 'naf',
            filters.selectedContact
          );
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={perPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
      </div>
      
      {/* Bouton flottant pour afficher/masquer le RightPanel */}
      <button
        onClick={() => setIsRightPanelVisible(!isRightPanelVisible)}
        className="fixed bottom-6 right-6 z-50 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        title={isRightPanelVisible ? "Masquer les statistiques" : "Afficher les statistiques"}
      >
        <BarChart3 className="w-6 h-6" />
      </button>
      
      {/* RightPanel sans animation */}
      <div className={`${isRightPanelVisible ? 'w-80' : 'w-0'} flex-shrink-0 overflow-hidden`}>
      <RightPanel
        businesses={enrichedBusinesses.map(biz => ({
          city: biz.siege?.libelle_commune || "Ville inconnue",
          activity: biz.activite_principale || "Activité inconnue"
        }))}
        totalBusinesses={totalResults}
        filters={filters}
        onFiltersChange={() => {}}
        availableCities={getAllFrenchCities()}
        availableLegalForms={Array.from(new Set(
          businesses
            .map(business => business.nature_juridique)
            .filter(form => form && form.trim().length > 0)
        )).sort()}
        availableRoles={Array.from(new Set(
          businesses
            .flatMap(business => business.dirigeants || [])
            .map(dirigeant => dirigeant.qualite)
            .filter(role => role && role.trim().length > 0)
        )).sort()}
        employeeRange={[0, 5000]}
        revenueRange={[0, 1000000]}
        ageRange={[0, 50]}
      />
      </div>
    </div>
  );
};

export default Entreprises;