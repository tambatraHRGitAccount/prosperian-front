import React, { useState, useEffect, useCallback } from "react";
import { EntrepriseApiResponse, EntrepriseApiResult, ProntoLeadWithCompany } from "@entities/Business";
import { MainContent } from "./_components/MainContent";
import { RightPanel } from "./_components/RightPanel";
import { useProntoData } from "@hooks/useProntoData";
import { useFilterContext } from "@contexts/FilterContext";
import francePostalCodes from '@data/france_postal_codes.json';
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
      activitySearchType: string = 'naf' // Type de recherche d'activité
    ) => {
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

        // Si c'est une recherche par enseigne/franchise, utiliser l'API Apify
        if (activitySearchType === 'enseigne' && enseignes.length > 0) {
          console.log('🔍 Recherche via Apify pour enseignes:', enseignes);
          
          const location = selectedCities.length > 0 ? selectedCities.join(', ') : 'France';
          const allResults: any[] = [];
          
          // Rechercher pour chaque enseigne
          for (const enseigne of enseignes) {
            try {
              const apifyResponse = await apifyService.searchEnseigne(enseigne, location);
              
              // Afficher clairement le type de données dans la console
              if ((apifyResponse as any)._dataSource === 'APIFY_REAL_API') {
                console.log(`🌟 UTILISATION DE DONNÉES RÉELLES pour "${enseigne}" - ${apifyResponse.results.length} résultats`);
              } else {
                console.log(`🧪 UTILISATION DE DONNÉES FICTIVES pour "${enseigne}" - ${apifyResponse.results.length} résultats`);
              }
              
              // Convertir les résultats Apify au format EntrepriseApiResult
              const convertedEnseigneResults: EntrepriseApiResult[] = apifyResponse.results.map(result => ({
                siren: result.placeId,
                nom_complet: result.title,
                nom_raison_sociale: result.title,
                sigle: null,
                nombre_etablissements: 1,
                nombre_etablissements_ouverts: 1,
                siege: {
                  activite_principale: result.category,
                  activite_principale_registre_metier: null,
                  annee_tranche_effectif_salarie: '',
                  adresse: result.address,
                  caractere_employeur: '',
                  cedex: null,
                  code_pays_etranger: null,
                  code_postal: '',
                  commune: location.includes(',') ? location.split(',')[0] : location,
                  complement_adresse: null,
                  coordonnees: '',
                  date_creation: '',
                  date_debut_activite: '',
                  date_fermeture: null,
                  date_mise_a_jour: null,
                  date_mise_a_jour_insee: new Date().toISOString(),
                  departement: '',
                  distribution_speciale: null,
                  epci: '',
                  est_siege: true,
                  etat_administratif: 'A',
                  geo_adresse: result.address,
                  geo_id: '',
                  indice_repetition: null,
                  latitude: result.latitude?.toString() || '',
                  libelle_cedex: null,
                  libelle_commune: location.includes(',') ? location.split(',')[0] : location,
                  libelle_commune_etranger: null,
                  libelle_pays_etranger: null,
                  libelle_voie: '',
                  liste_enseignes: [enseigne],
                  liste_finess: null,
                  liste_id_bio: null,
                  liste_idcc: null,
                  liste_id_organisme_formation: null,
                  liste_rge: null,
                  liste_uai: null,
                  longitude: result.longitude?.toString() || '',
                  nom_commercial: enseigne,
                  numero_voie: '',
                  region: '',
                  siret: result.placeId,
                  statut_diffusion_etablissement: 'O',
                  tranche_effectif_salarie: '',
                  type_voie: ''
                },
                activite_principale: result.category,
                categorie_entreprise: '',
                caractere_employeur: null,
                annee_categorie_entreprise: '',
                date_creation: '',
                date_fermeture: null,
                date_mise_a_jour: new Date().toISOString(),
                date_mise_a_jour_insee: new Date().toISOString(),
                date_mise_a_jour_rne: new Date().toISOString(),
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
                  // Données spécifiques Apify
                  apify_place_id: result.placeId,
                  enseigne: enseigne,
                  rating: result.rating,
                  reviews_count: result.reviewsCount,
                  telephone: result.phone,
                  site_web: result.website,
                  source: 'apify_enseigne'
                }
              }));
              
              allResults.push(...convertedEnseigneResults);
            } catch (error) {
              console.error(`Erreur lors de la recherche de l'enseigne ${enseigne}:`, error);
            }
          }

          setBusinesses(allResults);
          setTotalResults(allResults.length);
          setCurrentPage(page);
          setPerPage(perPageValue);
          setTotalPages(Math.ceil(allResults.length / perPageValue));
          
          console.log(`✅ ${allResults.length} entreprises trouvées via Apify pour les enseignes`);
          return;
        }

        // Recherche classique via l'API INSEE/NAF
        let url = `${API_URL}&page=${page}&per_page=${perPageValue}`;

        // Filtres d'activité (codes NAF)
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

        console.log('🔍 URL de recherche avec filtres complets:', url);
        console.log('📊 Filtres appliqués:', {
          activites: nafCodes,
          chiffreAffaires: revenueRange,
          ageEntreprise: ageRange,
          nombreEmployes: employeeRange,
          naturesJuridiques: legalForms,
          conventionCollective: idConventionCollective
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
    fetchBusinesses(
      currentPage, 
      perPage, 
      filters.activities || [], 
      filters.revenueRange || [0, 1000000], 
      filters.ageRange || [0, 50],
      filters.employeeRange || [0, 5000],
      filters.legalForms || [],
      filters.id_convention_collective || undefined,
      filters.cities || [], // Filtre villes
      filters.googleActivities || [], // Activités Google GMB
      filters.semanticTerms || [], // Termes sémantiques
      filters.enseignes || [], // Enseignes/franchises
      filters.activitySearchType || 'naf' // Type de recherche d'activité
    );
    // eslint-disable-next-line
  }, [currentPage, perPage, filters.activities, filters.revenueRange, filters.ageRange, filters.employeeRange, filters.legalForms, filters.id_convention_collective, filters.cities, filters.googleActivities, filters.semanticTerms, filters.enseignes, filters.activitySearchType]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <MainContent
        businesses={enrichedBusinesses}
        totalBusinesses={totalResults}
        loading={loading}
        error={error}
                onRetry={() => fetchBusinesses(
          currentPage, 
          perPage, 
          filters.activities || [], 
          filters.revenueRange || [0, 1000000], 
          filters.ageRange || [0, 50],
          filters.employeeRange || [0, 5000],
          filters.legalForms || [],
          filters.id_convention_collective || undefined,
          filters.cities || []
        )}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={perPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
      <RightPanel
        businesses={enrichedBusinesses.map(biz => ({
          city: biz.siege?.libelle_commune || "Ville inconnue",
          activity: biz.activite_principale || "Activité inconnue"
        }))}
        totalBusinesses={totalResults}
        filters={filters}
        onFiltersChange={() => {}}
        availableCities={[]}
        availableLegalForms={[]}
        availableRoles={[]}
        employeeRange={[0, 5000]}
        revenueRange={[0, 1000000]}
        ageRange={[0, 50]}
      />
    </div>
  );
};

export default Entreprises;