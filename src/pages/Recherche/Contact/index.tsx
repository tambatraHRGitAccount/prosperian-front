import React, { useState, useEffect, useCallback } from "react";
import { Building, Globe, Eye, User, Mail, Phone, MapPin, BarChart3 } from "lucide-react";
import { useFilterContext } from "@contexts/FilterContext";
import ContactOptions from "./_components/ContactOptions";
import { ContactRightPanel } from "./_components/RightPanel";
import { ProntoResultsPanel } from "./_components/ProntoResultsPanel";
import { useNavigate } from 'react-router-dom';
import { ExportService } from '@services/exportService';
import francePostalCodes from '@data/france_postal_codes.json';
import { googlePlacesService } from "@services/googlePlacesService";
import { semanticService } from "@services/semanticService";
import { apifyService } from "@services/apifyService";

// Interface pour les dirigeants extraits des entreprises gouvernementales
interface Dirigeant {
  nom: string;
  prenoms: string;
  annee_de_naissance?: string;
  date_de_naissance?: string;
  qualite: string;
  nationalite?: string;
  type_dirigeant: string;
}

// Interface pour les contacts enrichis
interface ContactEnrichi {
  id: string;
  role: string;
  entreprise: string;
  nom: string;
  prenoms: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  logo?: string;
  address: string;
  ca?: number;
  employeesCount?: number;
  industry?: string;
  description?: string;
  isEnriched?: boolean;
  siren?: string;
  siret?: string;
  date_creation?: string;
  nature_juridique?: string;
  activite_principale?: string;
  nom_raison_sociale?: string; // Nom utilisé pour l'enrichissement Pronto
}

// Interface pour la réponse de l'endpoint d'enrichissement Pronto
interface ProntoEnrichmentResponse {
  found: boolean;
  name?: string;
  description?: string;
  industry?: string;
  website?: string;
  employeeCount?: number;
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
}

// Interface pour le stockage localStorage
interface ProntoEnrichmentCache {
  [companyName: string]: {
    data: ProntoEnrichmentResponse;
    timestamp: number;
  };
}

// Clé pour le localStorage
const PRONTO_ENRICHMENT_CACHE_KEY = 'pronto_enrichment_cache_contacts';
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

const API_URL = "https://prosperian.onrender.com/api/search?section_activite_principale=A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U";

export const Contact: React.FC = () => {
  const navigate = useNavigate();
  const { filters } = useFilterContext();
  const [contacts, setContacts] = useState<ContactEnrichi[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalEntreprises, setTotalEntreprises] = useState(0); // Total des entreprises disponibles
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showLimitInput, setShowLimitInput] = useState(false);
  const [currentSort, setCurrentSort] = useState("Pertinence");
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [selectedContact, setSelectedContact] = useState<ContactEnrichi | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  // État pour contrôler la visibilité du RightPanel
  const [showRightPanel, setShowRightPanel] = useState(false);
  // Utiliser le contexte pour la liste sélectionnée
  const { filters: filterContext, setFilters } = useFilterContext();
  const selectedList = filterContext.selectedList;

  // Cache pour les enrichissements Pronto
  const [enrichmentCache, setEnrichmentCache] = useState<Record<string, any>>({});
  const [enrichmentLoading, setEnrichmentLoading] = useState<Record<string, boolean>>({});

  // États pour les résultats de recherche Pronto
  const [prontoResults, setProntoResults] = useState<any>(null);
  const [prontoLoading, setProntoLoading] = useState(false);
  const [showProntoResults, setShowProntoResults] = useState(false);

  // Utiliser le contexte global du RightPanel
  // const { isRightPanelVisible } = useRightPanel(); // This line is removed as per the new_code

  // Fonction pour enrichir une entreprise avec Pronto (comme dans BusinessCard)
  const enrichWithPronto = async (companyName: string): Promise<any> => {
    if (!companyName || enrichmentCache[companyName]) {
      return enrichmentCache[companyName];
    }

    // Vérifier le cache localStorage d'abord
    const cachedData = getCachedEnrichment(companyName);
    if (cachedData) {
      setEnrichmentCache(prev => ({ ...prev, [companyName]: cachedData }));
      return cachedData;
    }

    // Marquer comme en cours de chargement
    setEnrichmentLoading(prev => ({ ...prev, [companyName]: true }));

    try {
      const response = await fetch(`https://prosperian.onrender.com/api/pronto/companies/enrich?name=${encodeURIComponent(companyName)}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Mettre en cache localStorage et state
        setCachedEnrichment(companyName, data);
        setEnrichmentCache(prev => ({ ...prev, [companyName]: data }));
        
        console.log(`✅ Enrichissement Pronto réussi pour: ${companyName}`);
        return data;
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'enrichissement Pronto pour ${companyName}:`, error);
    } finally {
      setEnrichmentLoading(prev => ({ ...prev, [companyName]: false }));
    }
    return null;
  };

  // Fonction pour enrichir progressivement tous les contacts avec optimisation des noms répétitifs
  const enrichContactsProgressively = async (contacts: ContactEnrichi[]) => {
    console.log('🔄 Début de l\'enrichissement progressif des contacts...');
    
    // Créer un Set des noms d'entreprises uniques pour éviter les appels répétés
    const uniqueCompanyNames = new Set<string>();
    const contactsByCompany = new Map<string, ContactEnrichi[]>();
    
    // Grouper les contacts par nom d'entreprise (nom_raison_sociale pour l'enrichissement)
    for (const contact of contacts) {
      const companyName = contact.nom_raison_sociale || contact.entreprise;
      if (!uniqueCompanyNames.has(companyName)) {
        uniqueCompanyNames.add(companyName);
        contactsByCompany.set(companyName, []);
      }
      contactsByCompany.get(companyName)!.push(contact);
    }
    
    console.log(`📊 ${contacts.length} contacts répartis sur ${uniqueCompanyNames.size} entreprises uniques`);
    console.log('🏢 Entreprises uniques à enrichir:', Array.from(uniqueCompanyNames));
    
    // Enrichir chaque entreprise unique une seule fois
    for (const companyName of uniqueCompanyNames) {
      if (!enrichmentCache[companyName]) {
        console.log(`🔍 Enrichissement de l'entreprise unique: ${companyName}`);
        await enrichWithPronto(companyName);
        // Petit délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.log(`⏭️ Entreprise déjà enrichie: ${companyName}`);
      }
    }
    
    console.log('✅ Enrichissement progressif terminé');
  };

  // Fonction pour extraire les dirigeants d'une entreprise
  const extractDirigeants = (entreprise: any): Dirigeant[] => {
    if (!entreprise.dirigeants || !Array.isArray(entreprise.dirigeants)) {
      return [];
    }
    return entreprise.dirigeants;
  };

  // Fonction pour extraire l'adresse
  const extractAddress = (siege: any): string => {
    if (!siege) return 'Adresse non disponible';
    
    const parts = [];
    if (siege.adresse) parts.push(siege.adresse);
    if (siege.libelle_commune) parts.push(siege.libelle_commune);
    if (siege.code_postal) parts.push(siege.code_postal);
    
    return parts.length > 0 ? parts.join(', ') : 'Adresse non disponible';
  };

  // Fonction pour convertir les entreprises en contacts (sans attendre l'enrichissement Pronto)
  const convertEntreprisesToContacts = (entreprises: any[]): ContactEnrichi[] => {
    const contacts: ContactEnrichi[] = [];
    
    for (const entreprise of entreprises) {
      const dirigeants = extractDirigeants(entreprise);
      
      for (const dirigeant of dirigeants) {
        // Utiliser nom_raison_sociale pour l'enrichissement Pronto, sinon nom_complet
        const enrichmentName = entreprise.nom_raison_sociale || entreprise.nom_complet;
        
        const contact: ContactEnrichi = {
          id: `${entreprise.siren}_${dirigeant.nom}_${dirigeant.prenoms}`,
          role: dirigeant.qualite,
          entreprise: entreprise.nom_complet, // Affichage : nom_complet
          nom: dirigeant.nom,
          prenoms: dirigeant.prenoms,
          website: entreprise.siege?.site_web,
          logo: undefined, // Sera enrichi progressivement
          address: extractAddress(entreprise.siege),
          ca: entreprise.finances?.chiffre_affaires,
          employeesCount: entreprise.tranche_effectif_salarie,
          industry: entreprise.activite_principale,
          description: undefined, // Sera enrichi progressivement
          isEnriched: false, // Sera mis à jour progressivement
          siren: entreprise.siren,
          siret: entreprise.siret,
          date_creation: entreprise.date_creation,
          nature_juridique: entreprise.nature_juridique,
          activite_principale: entreprise.activite_principale,
          nom_raison_sociale: enrichmentName // Nom utilisé pour l'enrichissement Pronto
        };
        
        contacts.push(contact);
      }
    }
    
    return contacts;
  };

  // Fonction pour obtenir les données enrichies d'un contact
  const getEnrichedContactData = (contact: ContactEnrichi) => {
    // Utiliser nom_raison_sociale pour l'enrichissement, sinon nom_complet
    const enrichmentKey = contact.nom_raison_sociale || contact.entreprise;
    const prontoData = enrichmentCache[enrichmentKey];
    const isLoading = enrichmentLoading[enrichmentKey];
    
    return {
      ...contact,
      website: prontoData?.website || contact.website,
      logo: prontoData?.companyPictureDisplayImage ? 
        `${prontoData.companyPictureDisplayImage.rootUrl}${prontoData.companyPictureDisplayImage.artifacts[0]?.fileIdentifyingUrlPathSegment}` : contact.logo,
      ca: prontoData?.revenue || contact.ca,
      employeesCount: prontoData?.employeeCount || contact.employeesCount,
      industry: prontoData?.industry || contact.industry,
      description: prontoData?.description || contact.description,
      isEnriched: !!prontoData?.found,
      isLoading
    };
  };

  const fetchContacts = useCallback(
    async (
      page: number,
      perPageValue: number,
      nafCodes: string[],
      revenueRange: [number, number],
      ageRange: [number, number],
      employeeRange: [number, number],
      legalForms: string[],
      idConventionCollective?: string,
      selectedCities: string[] = [],
      googleActivities: string[] = [],
      semanticTerms: string[] = [],
      enseignes: string[] = [],
      activitySearchType: string = 'naf',
      selectedCompany?: string
    ) => {
      setLoading(true);
      setError(null);
      
      try {
        let entreprises: any[] = [];

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

        // Filtre de recherche d'entreprise
        if (selectedCompany) {
          url += `&q=${encodeURIComponent(selectedCompany)}`;
        }

        console.log('🔍 URL de recherche contacts:', url);
        console.log('🌐 Recherche globale avec tous les secteurs d\'activité:', !nafCodes.length);
        console.log('📋 Paramètres de recherche:', {
          page,
          perPageValue,
          nafCodes: nafCodes.length > 0 ? nafCodes : 'Tous secteurs',
          revenueRange,
          ageRange,
          employeeRange,
          legalForms: legalForms.length > 0 ? legalForms : 'Toutes',
          selectedCities: selectedCities.length > 0 ? selectedCities : 'Toute la France'
        });

        const res = await fetch(url, { headers: { accept: "application/json" } });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Erreur lors de la récupération des entreprises");
        }

        const data = await res.json();
        entreprises = data.results || [];
        setTotalEntreprises(data.total_results); // Mettre à jour le total des entreprises

        console.log(`✅ ${entreprises.length} entreprises trouvées, extraction des dirigeants...`);
        console.log('📊 Statistiques des entreprises:', {
          total_entreprises: entreprises.length,
          total_results_api: data.total_results,
          page_api: data.page,
          per_page_api: data.per_page,
          entreprises_avec_dirigeants: entreprises.filter(e => e.dirigeants && e.dirigeants.length > 0).length,
          total_dirigeants: entreprises.reduce((acc, e) => acc + (e.dirigeants?.length || 0), 0),
          entreprises_avec_nom_raison_sociale: entreprises.filter(e => e.nom_raison_sociale).length,
          exemples_noms: entreprises.slice(0, 3).map(e => ({
            nom_complet: e.nom_complet,
            nom_raison_sociale: e.nom_raison_sociale,
            dirigeants_count: e.dirigeants?.length || 0
          }))
        });

        // Convertir les entreprises en contacts (sans attendre l'enrichissement Pronto)
        const contactsFromEntreprises = convertEntreprisesToContacts(entreprises);
        
        console.log(`✅ ${contactsFromEntreprises.length} contacts extraits des dirigeants`);
        console.log('📊 Statistiques des contacts extraits:', {
          total_contacts: contactsFromEntreprises.length,
          contacts_par_entreprise: contactsFromEntreprises.length / Math.max(entreprises.length, 1),
          entreprises_avec_contacts: new Set(contactsFromEntreprises.map(c => c.entreprise)).size,
          exemples_contacts: contactsFromEntreprises.slice(0, 3).map(c => ({
            role: c.role,
            nom: `${c.prenoms} ${c.nom}`,
            entreprise: c.entreprise,
            nom_raison_sociale: c.nom_raison_sociale,
            siren: c.siren
          }))
        });
        
        // Calculer le nombre total estimé de contacts basé sur le total_results de l'API
        const contactsParEntreprise = entreprises.length > 0 ? contactsFromEntreprises.length / entreprises.length : 0;
        const totalContactsEstime = Math.round(data.total_results * contactsParEntreprise);
        
        console.log('📈 Estimation du total des contacts:', {
          total_entreprises_api: data.total_results,
          contacts_par_entreprise_moyen: contactsParEntreprise,
          total_contacts_estime: totalContactsEstime,
          contacts_page_actuelle: contactsFromEntreprises.length
        });
        
        // Afficher immédiatement les résultats de base
        setContacts(contactsFromEntreprises);
        setTotalResults(totalContactsEstime); // Utiliser l'estimation du total des contacts
        setCurrentPage(data.page || page);
        setPerPage(data.per_page || perPageValue);
        setTotalPages(Math.ceil(totalContactsEstime / perPageValue));

        console.log(`✅ ${contactsFromEntreprises.length} contacts extraits et affichés immédiatement`);
        console.log('📈 Pagination mise à jour:', {
          totalResults: totalContactsEstime,
          currentPage: data.page || page,
          perPage: data.per_page || perPageValue,
          totalPages: Math.ceil(totalContactsEstime / perPageValue)
        });

        // Lancer l'enrichissement progressif en arrière-plan
        if (contactsFromEntreprises.length > 0) {
          console.log('🔄 Lancement de l\'enrichissement progressif en arrière-plan...');
          enrichContactsProgressively(contactsFromEntreprises).then(() => {
            console.log('✅ Enrichissement progressif terminé, mise à jour de l\'interface...');
            // Forcer la mise à jour de l'interface pour afficher les données enrichies
            setContacts(prevContacts => [...prevContacts]);
          });
        }

      } catch (e: any) {
        console.error('❌ Erreur lors de la recherche de contacts:', e);
        setError(e.message || "Erreur inconnue");
        setContacts([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fonction de test pour la recherche globale
  const testGlobalSearch = async () => {
    console.log('🧪 Test de recherche globale...');
    try {
      const testUrl = `${API_URL}&page=1&per_page=5`;
      console.log('🔗 URL de test:', testUrl);
      
      const response = await fetch(testUrl, { headers: { accept: "application/json" } });
      const data = await response.json();
      
      console.log('✅ Test réussi:', {
        total_results: data.total_results,
        entreprises_test: data.results?.length || 0,
        premier_resultat: data.results?.[0]?.nom_complet,
        dirigeants_premier: data.results?.[0]?.dirigeants?.length || 0,
        nom_raison_sociale_premier: data.results?.[0]?.nom_raison_sociale,
        total_dirigeants_test: data.results?.reduce((acc: number, e: any) => acc + (e.dirigeants?.length || 0), 0) || 0
      });
      
      // Test d'extraction des contacts
      if (data.results && data.results.length > 0) {
        const testContacts = convertEntreprisesToContacts(data.results);
        const contactsParEntreprise = testContacts.length / data.results.length;
        const totalContactsEstime = Math.round(data.total_results * contactsParEntreprise);
        
        console.log('📊 Test d\'extraction des contacts:', {
          entreprises_test: data.results.length,
          contacts_extraits: testContacts.length,
          ratio_contacts_entreprises: contactsParEntreprise,
          total_entreprises_api: data.total_results,
          total_contacts_estime: totalContactsEstime,
          exemples_contacts: testContacts.slice(0, 2).map(c => ({
            role: c.role,
            nom: `${c.prenoms} ${c.nom}`,
            entreprise: c.entreprise,
            nom_raison_sociale: c.nom_raison_sociale
          }))
        });
      }
      
      return data;
    } catch (error) {
      console.error('❌ Test échoué:', error);
      return null;
    }
  };

  // Test automatique au chargement si aucun filtre
  useEffect(() => {
    const hasAnyFilter = Object.values(filters).some(value => 
      value && (Array.isArray(value) ? value.length > 0 : true)
    );
    
    if (!hasAnyFilter && !loading) {
      console.log('🚀 Test automatique de recherche globale...');
      testGlobalSearch();
    }
  }, [filters, loading]);

  // Écouter l'événement de recherche par liste d'entreprises
  useEffect(() => {
    const handleSearchByCompanyList = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { listId, listName, companyNames } = customEvent.detail;
      console.log('🎯 Recherche par liste d\'entreprises déclenchée:', {
        listId,
        listName,
        companyCount: companyNames.length
      });

      // Sauvegarder la liste sélectionnée dans le contexte
      const newFilters = {
        ...filterContext,
        selectedList: {
          listId,
          listName,
          companyCount: companyNames.length
        }
      };
      setFilters(newFilters);

      setLoading(true);
      setError(null);

      try {
        let allContacts: ContactEnrichi[] = [];
        let totalEntreprisesFound = 0;

                            // Rechercher pour chaque nom d'entreprise individuellement
                    for (let i = 0; i < companyNames.length; i++) {
                      let companyName = companyNames[i];
                      
                      // Nettoyer le nom d'entreprise : enlever les guillemets et les virgules
                      companyName = companyName.replace(/^["']|["']$/g, ''); // Enlever les guillemets au début et à la fin
                      companyName = companyName.split(',')[0]; // Prendre seulement la première partie avant la virgule
                      companyName = companyName.trim(); // Enlever les espaces
                      
                      console.log(`🔍 Recherche ${i + 1}/${companyNames.length}: "${companyName}" (nettoyé)`);

                      // Vérifier que le nom d'entreprise n'est pas vide après nettoyage
                      if (!companyName || companyName.length < 2) {
                        console.log(`⚠️ Nom d'entreprise trop court ou vide après nettoyage: "${companyName}"`);
                        continue;
                      }

                      try {
                        // Construire l'URL de recherche pour cette entreprise
                        const searchUrl = `${API_URL}&q=${encodeURIComponent(companyName)}&limite_matching_etablissements=10&page=1&per_page=10`;
            
            const response = await fetch(searchUrl, { 
              headers: { accept: "application/json" } 
            });
            
            if (response.ok) {
              const data = await response.json();
              const entreprises = data.results || [];
              
              if (entreprises.length > 0) {
                console.log(`✅ ${entreprises.length} entreprise(s) trouvée(s) pour "${companyName}"`);
                totalEntreprisesFound += entreprises.length;
                
                // Convertir les entreprises en contacts
                const contactsFromEntreprises = convertEntreprisesToContacts(entreprises);
                allContacts.push(...contactsFromEntreprises);
                
                console.log(`📊 ${contactsFromEntreprises.length} contact(s) extrait(s) pour "${companyName}"`);
              } else {
                console.log(`⚠️ Aucune entreprise trouvée pour "${companyName}"`);
              }
            } else {
              console.error(`❌ Erreur API pour "${companyName}":`, response.status);
            }

            // Petit délai pour éviter de surcharger l'API
            await new Promise(resolve => setTimeout(resolve, 200));

          } catch (error) {
            console.error(`❌ Erreur lors de la recherche pour "${companyName}":`, error);
          }
        }

        console.log(`🎉 Recherche terminée: ${allContacts.length} contacts trouvés pour ${totalEntreprisesFound} entreprises`);
        
        // Mettre à jour l'état avec les résultats
        setContacts(allContacts);
        setTotalResults(allContacts.length);
        setTotalEntreprises(totalEntreprisesFound);
        setCurrentPage(1);
        setPerPage(10);
        setTotalPages(Math.ceil(allContacts.length / 10));

        // Lancer l'enrichissement progressif en arrière-plan
        if (allContacts.length > 0) {
          console.log('🔄 Lancement de l\'enrichissement progressif...');
          enrichContactsProgressively(allContacts).then(() => {
            console.log('✅ Enrichissement progressif terminé');
            setContacts(prevContacts => [...prevContacts]);
          });
        }

      } catch (error) {
        console.error('❌ Erreur lors de la recherche par liste:', error);
        setError('Erreur lors de la recherche par liste d\'entreprises');
        setContacts([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    // Ajouter l'écouteur d'événement
    window.addEventListener('searchByCompanyList', handleSearchByCompanyList as EventListener);

    // Nettoyer l'écouteur d'événement
    return () => {
      window.removeEventListener('searchByCompanyList', handleSearchByCompanyList as EventListener);
    };
  }, []);

  // Écouter l'événement de retrait du filtre de liste
  useEffect(() => {
    const handleRemoveListFilter = () => {
      console.log('🗑️ Retrait du filtre de liste via événement:', selectedList);
      const newFilters = {
        ...filterContext,
        selectedList: null
      };
      setFilters(newFilters);
      setContacts([]);
      setTotalResults(0);
      setTotalEntreprises(0);
      setCurrentPage(1);
      setTotalPages(1);
      setError(null);
      
      // Relancer une recherche normale avec les filtres actuels
      fetchContacts(
        currentPage,
        perPage,
        filterContext.activities || [],
        filterContext.revenueRange || [0, 1000000],
        filterContext.ageRange || [0, 50],
        filterContext.employeeRange || [0, 5000],
        filterContext.legalForms || [],
        filterContext.id_convention_collective,
        filterContext.cities || [],
        filterContext.googleActivities || [],
        filterContext.semanticTerms || [],
        filterContext.enseignes || [],
        filterContext.activitySearchType || 'naf',
        filterContext.selectedCompany
      );
    };

    // Ajouter l'écouteur d'événement
    window.addEventListener('removeListFilter', handleRemoveListFilter);

    // Nettoyer l'écouteur d'événement
    return () => {
      window.removeEventListener('removeListFilter', handleRemoveListFilter);
    };
  }, [filterContext, currentPage, perPage]);

  // Écouter les événements Pronto
  useEffect(() => {
    const handleProntoResults = (event: CustomEvent) => {
      console.log('📊 Résultats Pronto reçus via événement:', event.detail);
      setProntoResults(event.detail);
      setShowProntoResults(true);
    };

    const handleProntoLoadingEvent = (event: CustomEvent) => {
      console.log('⏳ État de chargement Pronto:', event.detail);
      setProntoLoading(event.detail);

      // Afficher le panel dès que le chargement commence
      if (event.detail === true) {
        setShowProntoResults(true);
      }
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener('prontoSearchResults', handleProntoResults as EventListener);
    window.addEventListener('prontoLoading', handleProntoLoadingEvent as EventListener);

    // Nettoyer les écouteurs d'événements
    return () => {
      window.removeEventListener('prontoSearchResults', handleProntoResults as EventListener);
      window.removeEventListener('prontoLoading', handleProntoLoadingEvent as EventListener);
    };
  }, []);

  // Recherche normale avec filtres
  useEffect(() => {
    // Recherche globale : utiliser tous les secteurs d'activité si aucun filtre spécifique
    const hasSpecificFilters = (
      (filters.activities && filters.activities.length > 0) ||
      (filters.revenueRange && (filters.revenueRange[0] > 0 || filters.revenueRange[1] < 1000000)) ||
      (filters.ageRange && (filters.ageRange[0] > 0 || filters.ageRange[1] < 50)) ||
      (filters.employeeRange && (filters.employeeRange[0] > 0 || filters.employeeRange[1] < 5000)) ||
      (filters.legalForms && filters.legalForms.length > 0) ||
      filters.id_convention_collective ||
      (filters.cities && filters.cities.length > 0) ||
      (filters.googleActivities && filters.googleActivities.length > 0) ||
      (filters.semanticTerms && filters.semanticTerms.length > 0) ||
      (filters.enseignes && filters.enseignes.length > 0) ||
      filters.selectedCompany
    );

    console.log('🔍 Recherche contacts - Filtres appliqués:', {
      hasSpecificFilters,
      activities: filters.activities,
      revenueRange: filters.revenueRange,
      ageRange: filters.ageRange,
      employeeRange: filters.employeeRange,
      legalForms: filters.legalForms,
      id_convention_collective: filters.id_convention_collective,
      cities: filters.cities,
      googleActivities: filters.googleActivities,
      semanticTerms: filters.semanticTerms,
      enseignes: filters.enseignes,
      activitySearchType: filters.activitySearchType,
      selectedCompany: filters.selectedCompany
    });

    fetchContacts(
      currentPage,
      perPage,
      filters.activities || [],
      filters.revenueRange || [0, 1000000],
      filters.ageRange || [0, 50],
      filters.employeeRange || [0, 5000],
      filters.legalForms || [],
      filters.id_convention_collective,
      filters.cities || [],
      filters.googleActivities || [],
      filters.semanticTerms || [],
      filters.enseignes || [],
      filters.activitySearchType || 'naf',
      filters.selectedCompany
    );
  }, [filters, currentPage, perPage, fetchContacts]);

  // Pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  // Handlers
  const handleLimitClick = () => setShowLimitInput(true);
  const handleCancelLimit = () => {
    setPerPage(10);
    setShowLimitInput(false);
  };

  const handleSortChange = (value: string) => {
    setCurrentSort(value);
    setSelectedContacts(new Set());
  };

  const handleCheckboxChange = (contactId: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const handleExport = () => {
    if (selectedContacts.size > 0) setShowExportPopup(true);
    else alert("Aucun contact sélectionné pour l'export.");
  };

  const handleExportClose = () => setShowExportPopup(false);

  const handleDirectExport = () => {
    if (selectedContacts.size === 0) return;
    const randomDigits1 = Math.floor(10000000 + Math.random() * 90000000);
    const randomDigits2 = Math.floor(10000000 + Math.random() * 90000000);
    const fileName = `export_${randomDigits1}-${randomDigits2}`;
    
    const selectedContactsData = Array.from(selectedContacts).map(id => 
      contacts.find(contact => contact.id === id)
    ).filter(Boolean);
    
    if (selectedContactsData.length === 0) return;
    ExportService.exportSelectedBusinesses(selectedContactsData, fileName, 'contact');
    setShowExportPopup(false);
    setSelectedContacts(new Set());
    navigate('/recherche/export');
  };



  // Fonction pour tronquer l'adresse à 3 mots maximum
  const truncateAddress = (address: string, maxWords: number = 3): string => {
    if (!address) return '';
    const words = address.split(' ').filter(word => word.trim().length > 0);
    if (words.length <= maxWords) return address;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const pageStart = (currentPage - 1) * perPage + 1;
  const pageEnd = Math.min(currentPage * perPage, totalResults);
  const paginatedContacts = contacts.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Calcul des statistiques améliorées
  const stats = {
    totalContacts: totalResults, // Total estimé des contacts
    totalEntreprises: totalEntreprises, // Total des entreprises disponibles
    contactsPageActuelle: contacts.length, // Contacts de la page actuelle
    contactsWithEmail: contacts.filter(c => c.email).length,
    contactsWithLinkedIn: contacts.filter(c => c.linkedin).length,
    contactsEnriched: contacts.filter(c => c.isEnriched).length,
    contactsWithCA: contacts.filter(c => c.ca).length,
    contactsWithEmployees: contacts.filter(c => c.employeesCount).length,
    averageCA: contacts.filter(c => c.ca).length > 0 
      ? Math.round(contacts.filter(c => c.ca).reduce((acc, c) => acc + (c.ca || 0), 0) / contacts.filter(c => c.ca).length)
      : 0,
    // Statistiques d'optimisation
    uniqueCompanies: new Set(contacts.map(c => c.nom_raison_sociale || c.entreprise)).size,
    companiesWithRaisonSociale: contacts.filter(c => c.nom_raison_sociale && c.nom_raison_sociale !== c.entreprise).length,
    optimizationRatio: contacts.length > 0 ? Math.round((new Set(contacts.map(c => c.nom_raison_sociale || c.entreprise)).size / contacts.length) * 100) : 0
  };

  const handleCloseProntoResults = () => {
    setShowProntoResults(false);
  };

  return (
    <>
      {/* Popup contact */}
      {showContactModal && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fade-in">
            <button
              className="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={() => setShowContactModal(false)}
              aria-label="Fermer"
            >
              ×
            </button>
            <div className="text-center mb-2 text-lg font-semibold text-gray-800">
              {selectedContact.role}
            </div>
            <div className="text-center mb-4">
              <span className="text-blue-900 font-bold text-base underline cursor-pointer">
                {selectedContact.entreprise}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-6">
              <div className="text-gray-500">Prénom</div>
              <div className="text-gray-900">{selectedContact.prenoms}</div>
              <div className="text-gray-500">Nom</div>
              <div className="text-gray-900">{selectedContact.nom}</div>
              <div className="text-gray-500">Entreprise</div>
              <div className="text-gray-900">{selectedContact.entreprise}</div>
              <div className="text-gray-500">SIREN</div>
              <div className="text-gray-900">{selectedContact.siren}</div>
              <div className="text-gray-500">Activité</div>
              <div className="text-gray-900">{selectedContact.activite_principale}</div>
              <div className="text-gray-500">Adresse</div>
              <div className="text-gray-900">{selectedContact.address}</div>
              {selectedContact.ca && (
                <>
                  <div className="text-gray-500">CA</div>
                  <div className="text-gray-900">{selectedContact.ca.toLocaleString()} €</div>
                </>
              )}
              {selectedContact.employeesCount && (
                <>
                  <div className="text-gray-500">Effectifs</div>
                  <div className="text-gray-900">{selectedContact.employeesCount}</div>
                </>
              )}
            </div>
            <div className="flex justify-between items-center mt-6">
              <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-orange-400 text-orange-500 font-medium bg-white hover:bg-orange-50">
                <Eye className="w-4 h-4" />
                Plus de contacts
              </button>
              <button className="px-6 py-2 rounded-full bg-gradient-to-r from-orange-400 to-[#E95C41] text-white font-medium hover:opacity-90">
                1 crédit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen bg-gray-50">
        <div className={`overflow-auto relative`}
             style={showRightPanel
               ? { width: 'calc(100vw - 384px - 320px)' } // Sidebar (384px) + RightPanel (320px)
               : { width: 'calc(100vw - 384px)' } // Seulement Sidebar (384px)
             }>
          {/* Panneau de résultats Pronto en overlay dans le container principal */}
          <ProntoResultsPanel
            results={prontoResults}
            isVisible={showProntoResults}
            onClose={handleCloseProntoResults}
            loading={prontoLoading}
          />
          <div className="p-6">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white shadow rounded-lg p-4">
                <div className="text-common-blue font-bold mb-1">Contacts</div>
                <div className="text-xl font-bold text-dark-blue">{stats.totalContacts.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">
                  {stats.totalEntreprises.toLocaleString()} entreprises
                </div>
                {/* <div className="text-xs text-gray-500 mt-1">
                  {stats.contactsPageActuelle} sur cette page
                </div> */}
              </div>
            </div>

            <ContactOptions
              currentLimit={perPage}
              onLimitChangeClick={handleLimitClick}
              showLimitInput={showLimitInput}
              limitInputValue={perPage.toString()}
              onSetLimit={handleItemsPerPageChange}
              onCancelLimit={handleCancelLimit}
              currentSort={currentSort}
              onSortChange={handleSortChange}
              selectedCount={selectedContacts.size}
              onExportClick={handleExport}
              showExportModal={showExportPopup}
              onExportConfirm={handleDirectExport}
              onExportClose={handleExportClose}
              filteredTotal={totalResults}
              pageStart={pageStart}
              pageEnd={pageEnd}
              onPrevPage={() => handlePageChange(currentPage - 1)}
              onNextPage={() => handlePageChange(currentPage + 1)}
              layout={layout}
              setLayout={setLayout}
            />

            {/* Main content */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: '800px' }}>
                  <thead>
                    <tr className="text-xs font-semibold text-gray-700 uppercase bg-gray-100 shadow-sm">
                      {currentSort !== 'Pertinence' && <th className="w-8 p-3"></th>}
                      <th className="text-left p-3 w-1/6">Rôle</th>
                      <th className="text-center p-3 w-16">Web</th>
                      <th className="text-left p-3 w-1/3">Entreprise</th>
                      <th className="text-center p-3 w-16 text-[#E95C41]">Contacts</th>
                      <th className="text-center p-3 w-16">CA</th>
                      <th className="text-right p-3 w-1/4">Adresse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-gray-500 text-center">
                          <div className="flex flex-col items-center justify-center min-h-[200px] w-full mx-auto">
                            <style>{`
                              @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
                              .animate-spin-reverse { animation: spin-reverse 1s linear infinite; }
                            `}</style>
                            <div className="relative w-12 h-12 mb-2">
                              <div className="absolute inset-0 rounded-full border-4 border-orange-400 border-t-transparent animate-spin"></div>
                              <div className="absolute inset-2 rounded-full border-4 border-[#E95C41] border-b-transparent animate-spin-reverse"></div>
                            </div>
                            <span className="text-gray-500 mt-2">Chargement des contacts...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedContacts.length > 0 ? (
                      paginatedContacts.map((contact) => {
                        const enrichedContact = getEnrichedContactData(contact);
                        return (
                          <tr key={contact.id} className="hover:bg-gray-50">
                            {currentSort !== 'Pertinence' && (
                              <td className="w-8 p-3 bg-white">
                                <input
                                  type="checkbox"
                                  checked={selectedContacts.has(contact.id)}
                                  onChange={() => handleCheckboxChange(contact.id)}
                                  aria-label={`Select contact ${enrichedContact.role} at ${enrichedContact.entreprise}`}
                                />
                              </td>
                            )}
                            <td className="font-semibold text-gray-900 text-sm truncate p-3 bg-white">
                              {enrichedContact.role}
                            </td>
                            <td className="text-center p-3 bg-white">
                              <div className="flex items-center justify-center gap-2">
                                <Eye 
                                  className="w-5 h-5 cursor-pointer text-gray-500 hover:text-blue-600" 
                                  onClick={() => { setSelectedContact(enrichedContact); setShowContactModal(true); }} 
                                />
                                {enrichedContact.website && (
                                  <a href={enrichedContact.website} target="_blank" rel="noopener noreferrer">
                                    <Globe className="w-5 h-5 cursor-pointer text-blue-600 hover:text-blue-800" />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="flex items-center gap-2 min-w-0 p-3 bg-white">
                              {enrichedContact.logo ? (
                                <img src={enrichedContact.logo} alt={enrichedContact.entreprise} className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Building className="w-4 h-4 text-white" />
                                </div>
                              )}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-semibold text-blue-800 text-sm underline truncate cursor-pointer">
                                  {enrichedContact.entreprise}
                                </span>
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  {enrichedContact.isEnriched && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex-shrink-0">
                                      Pronto
                                    </span>
                                  )}
                                  {enrichedContact.isLoading && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                                      <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                      <span>Enrichissement...</span>
                                    </div>
                                  )}
                                  {/* Indicateur du nom utilisé pour l'enrichissement */}
                                  {contact.nom_raison_sociale && contact.nom_raison_sociale !== contact.entreprise && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex-shrink-0" title={`Enrichissement avec: ${contact.nom_raison_sociale}`}>
                                      RS
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-center text-sm font-semibold text-[#E95C41] p-3 bg-white">
                              {enrichedContact.email ? (
                                <Mail className="w-4 h-4 mx-auto text-[#E95C41]" />
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="text-center text-sm text-gray-800 font-medium p-3 bg-white">
                              {enrichedContact.ca ? `${(enrichedContact.ca / 1000).toFixed(0)}k€` : '-'}
                            </td>
                            <td className="text-right text-sm text-blue-800 underline truncate p-3 bg-white">
                              <div className="flex items-center justify-end gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{truncateAddress(enrichedContact.address)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-4 text-gray-500 text-center">
                          <div className="flex flex-col items-center justify-center min-h-[200px] w-full mx-auto">
                            <User className="w-12 h-12 text-gray-300 mb-2" />
                            <span className="text-gray-500 mt-2">
                              {error ? `Erreur: ${error}` : 'Aucun contact trouvé'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bouton flottant pour afficher/masquer le RightPanel */}
        <button
          onClick={() => setShowRightPanel(!showRightPanel)}
          className="fixed bottom-6 right-6 z-50 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title={showRightPanel ? "Masquer les statistiques" : "Afficher les statistiques"}
        >
          <BarChart3 className="w-6 h-6" />
        </button>
        
        {/* RightPanel sans animation */}
        <div className={`${showRightPanel ? 'w-80' : 'w-0'} flex-shrink-0 overflow-hidden`}>
          <ContactRightPanel
            contacts={paginatedContacts.map(contact => {
              const enrichedContact = getEnrichedContactData(contact);
              return {
                city: enrichedContact.address.split(',').pop()?.trim() || "Ville inconnue",
                role: enrichedContact.role,
                entreprise: enrichedContact.entreprise,
                ca: enrichedContact.ca,
                employeesCount: enrichedContact.employeesCount
              };
            })}
            totalContacts={totalResults}
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
      </div>
    </>
  );
};

export default Contact;
