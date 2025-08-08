// In FiltersPanel.tsx
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { Filter, MapPin, ChevronDown } from "lucide-react";
import { FilterState } from "@entities/Business";
import { useFilterContext } from "@contexts/FilterContext";
import { ListService, List } from "@services/listService";
import axios from 'axios';
import nafCodes from '@data/naf_codes.json';
import naturesJuridiques from '@data/natures_juridiques.json';
import conventionsCollectives from '@data/conventions_collectives.json';
import linkedinSectors from '@data/linkedin_sectors_with_naf.json';
import departementsFrance from '@data/departements_france.json';
import regionsFrance from '@data/regions_france.json';
import ReactDOM from 'react-dom';
import { googlePlacesService, GooglePlacesCategory } from '../../../services/googlePlacesService';
import { semanticService, PopularConcept, SemanticSuggestion } from '../../../services/semanticService';
import { apifyService } from '../../../services/apifyService';
import { companyListService, CompanyListItem } from '../../../services/companyListService';
import { contactListService, ContactListItem } from '../../../services/contactListService';
import { ProntoSearchForm } from '../../../pages/Recherche/Contact/_components/ProntoSearchForm';
import { LinkedInSalesModal } from './LinkedInSalesModal';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  label: string;
  unit?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  formatValue,
  label,
  unit,
}) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: [number, number]) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMouseDown = (index: 0 | 1) => (e: React.MouseEvent) => {
    e.preventDefault();
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const updateValue = (clientX: number) => {
      const percentage = (clientX - rect.left) / rect.width;
      let newVal = Math.round(min + percentage * (max - min));
      newVal = Math.max(min, Math.min(max, newVal));

      const newValues: [number, number] = [...localValue];
      newValues[index] = newVal;

      if (index === 0 && newVal > localValue[1]) {
        newValues[1] = newVal;
      } else if (index === 1 && newVal < localValue[0]) {
        newValues[0] = newVal;
      }

      handleChange([Math.min(newValues[0], newValues[1]), Math.max(newValues[0], newValues[1])]);
    };

    const handleMouseMove = (e: MouseEvent) => updateValue(e.clientX);
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    updateValue(e.clientX);
  };

  const percentageLeft = ((localValue[0] - min) / (max - min)) * 100;
  const percentageRight = ((localValue[1] - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600 mb-8">
        <span>{label}</span>
        <span>
          {formatValue ? formatValue(localValue[0]) : localValue[0]}
          {unit && ` ${unit}`} -{" "}
          {formatValue ? formatValue(localValue[1]) : localValue[1]}
          {unit && ` ${unit}`}
        </span>
      </div>
      <div className="relative h-2 bg-gray-200 rounded max-w-[90%] mx-auto" ref={trackRef}>
        <div
          className="absolute h-2 bg-orange-500 rounded"
          style={{
            left: `${percentageLeft}%`,
            width: `${percentageRight - percentageLeft}%`,
          }}
        ></div>
        <div
          className="absolute w-4 h-4 bg-orange-500 rounded-full -translate-x-1/2 -translate-y-1 cursor-pointer"
          style={{ left: `${percentageLeft}%`, top: "50%" }}
          onMouseDown={handleMouseDown(0)}
        ></div>
        <div
          className="absolute w-4 h-4 bg-orange-500 rounded-full -translate-x-1/2 -translate-y-1 cursor-pointer"
          style={{ left: `${percentageRight}%`, top: "50%" }}
          onMouseDown={handleMouseDown(1)}
        ></div>
      </div>
    </div>
  );
};

export interface FiltersPanelProps extends FilterState {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableCities: string[];
  availableLegalForms: string[];
  availableRoles: string[];
  employeeRange: [number, number];
  revenueRange: [number, number];
  ageRange: [number, number];
  // onNafCodesChange?: (codes: string[]) => void; // SUPPRIMÉ
  selectedList?: {
    listId: string;
    listName: string;
    companyCount: number;
  } | null;
  onRemoveListFilter?: () => void;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  filters,
  onFiltersChange,
  availableCities,
  availableLegalForms,
  availableRoles,
  employeeRange,
  revenueRange,
  ageRange,
  // onNafCodesChange, // SUPPRIMÉ
  selectedList,
  onRemoveListFilter,
}) => {
  console.log('FiltersPanel mounted');
  console.log('🏙️ FilterPanel - availableCities reçues:', availableCities);
  console.log('🏙️ FilterPanel - Nombre de villes reçues:', availableCities?.length || 0);
  const { setFilters } = useFilterContext();
  const location = useLocation();
  // Détecter la section par défaut selon la route
  const isContactPage = location.pathname.includes("/recherche/contact");
  const isEntreprisePage = location.pathname.includes("/recherche/entreprises") || location.pathname === "/recherche";

  // Ajout 'listes' comme valeur possible
  const [expandedMainSection, setExpandedMainSection] = useState<'entreprise' | 'contact' | 'listes' | null>(
    isContactPage ? 'contact' : 'entreprise'
  );

  const [activitySearch, setActivitySearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [nafModalOpen, setNafModalOpen] = useState(false);
  const [selectedNafCodes, setSelectedNafCodes] = useState<string[]>([]);

  // Ajoute un state pour la recherche
  const [legalFormSearch, setLegalFormSearch] = useState("");

  // Ajoute un state pour la recherche de convention collective
  const [conventionSearch, setConventionSearch] = useState("");
  // Supprime la déclaration de conventionsCollectives (liste statique)
  // Remplace selectedConventions par selectedConventionId (string|null)
  const [selectedConventionId, setSelectedConventionId] = useState<string|null>(null);

  // Ajoute un state pour l'ouverture des sections de conventions collectives
  const [openConventionSections, setOpenConventionSections] = useState<{ [prefix: string]: boolean }>({ '0': true });

  // Ajouter de nouveaux states pour Google GMB
  const [activitySearchType, setActivitySearchType] = useState<'naf' | 'google' | 'semantic' | 'secteur'>('naf');
  const [googleCategories, setGoogleCategories] = useState<GooglePlacesCategory[]>([]);
  const [loadingGoogleCategories, setLoadingGoogleCategories] = useState(false);
  const [selectedGoogleActivities, setSelectedGoogleActivities] = useState<string[]>([]);

  // States pour la recherche sémantique
  const [popularConcepts, setPopularConcepts] = useState<PopularConcept[]>([]);
  const [semanticSuggestions, setSemanticSuggestions] = useState<SemanticSuggestion[]>([]);
  const [loadingSemanticConcepts, setLoadingSemanticConcepts] = useState(false);
  const [selectedSemanticTerms, setSelectedSemanticTerms] = useState<string[]>([]);
  const [semanticSearchTerm, setSemanticSearchTerm] = useState('');

  // States pour les secteurs (remplace enseigne/franchise)
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [sectorSearchTerm, setSectorSearchTerm] = useState('');

  // States pour les listes Pronto
  const [prontoLists, setProntoLists] = useState<any[]>([]);
  const [loadingProntoLists, setLoadingProntoLists] = useState(false);
  const [loadingListDetails, setLoadingListDetails] = useState<Set<string>>(new Set());
  const [selectedProntoList, setSelectedProntoList] = useState<string | null>(null);

  // States pour le modal LinkedIn Sales Navigator
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [selectedListForLinkedIn, setSelectedListForLinkedIn] = useState<any>(null);

  // States pour les départements
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [citySearchTerm, setCitySearchTerm] = useState('');

  // States pour les régions
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [regionSearchTerm, setRegionSearchTerm] = useState('');

  // States pour la liste des entreprises (page contact)
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [companyCurrentPage, setCompanyCurrentPage] = useState(1);
  const [companyTotalPages, setCompanyTotalPages] = useState(1);
  const [companyTotalResults, setCompanyTotalResults] = useState(0);

  // States pour la liste des contacts (page entreprises)
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [contactCurrentPage, setContactCurrentPage] = useState(1);
  const [contactTotalPages, setContactTotalPages] = useState(1);
  const [contactTotalResults, setContactTotalResults] = useState(0);

  // Fonction utilitaire pour grouper par millier
  const conventionsGrouped = conventionsCollectives.reduce((acc: Record<string, typeof conventionsCollectives>, c) => {
    const prefix = c.idcc[0];
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(c);
    return acc;
  }, {});
  const conventionPrefixes = Object.keys(conventionsGrouped).sort();

  // Gestion de l'ouverture/fermeture des sous-filtres dans chaque section principale
  const [openEntrepriseFilters, setOpenEntrepriseFilters] = useState<{ [key: string]: boolean }>(() => {
    return {
      activites: isEntreprisePage,
      chiffres: false,
      forme: false,
      localisation: isEntreprisePage && availableCities.length > 0, // Ouvrir si des villes sont disponibles
      contact: isEntreprisePage,
    };
  });
  const [openContactFilters, setOpenContactFilters] = useState<{ [key: string]: boolean }>(() => {
    return {
      entreprise: isContactPage,
      roles: isContactPage,
      localisation: isContactPage && availableCities.length > 0, // Ouvrir si des villes sont disponibles
    };
  });

  // Synchroniser l'ouverture par défaut lors du changement de route
  useEffect(() => {
    setExpandedMainSection(isContactPage ? 'contact' : 'entreprise');
    setOpenEntrepriseFilters((prev) => {
      // Si au moins un filtre est déjà ouvert, on ne change rien
      if (Object.values(prev).some(Boolean)) return prev;
      // Sinon, on applique le comportement par défaut
      return {
        activites: isEntreprisePage,
        chiffres: false,
        forme: false,
        localisation: false,
        contact: isEntreprisePage,
      };
    });
    setOpenContactFilters({
      roles: isContactPage,
      localisation: isContactPage,
    });
  }, [isContactPage, isEntreprisePage]);

  const toggleEntrepriseFilter = (key: string) => {
    setOpenEntrepriseFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const toggleContactFilter = (key: string) => {
    setOpenContactFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateFilters = (updates: Partial<FilterState>) => {
    console.log('🔍 [FILTRES] updateFilters appelé avec:', updates);
    console.log('🔍 [FILTRES] filters actuels:', filters);
    
    const newFilters = { 
      ...filters, 
      ...updates,
      sortBy: filters.sortBy || 'Pertinence' // Assurer que sortBy est toujours défini
    };
    
    console.log('🔍 [FILTRES] Nouveaux filtres:', newFilters);
    console.log('🔍 [FILTRES] Appel de onFiltersChange...');
    
    onFiltersChange(newFilters);
    
    console.log('🔍 [FILTRES] onFiltersChange appelé avec succès');
  };

  const safeFilters = {
    ...filters,
    activities: filters.activities || [],
    cities: filters.cities || [],
    legalForms: filters.legalForms || [],
    roles: filters.roles || [],
    sortBy: filters.sortBy || 'Pertinence'
  };

  const toggleActivity = (activity: string) => {
    const currentActivities = safeFilters.activities;
    const newActivities = currentActivities.includes(activity)
      ? currentActivities.filter((a) => a !== activity)
      : [...currentActivities, activity];
    updateFilters({ activities: newActivities });
  };

  const toggleCity = (city: string) => {
    const currentCities = safeFilters.cities;
    const newCities = currentCities.includes(city)
      ? currentCities.filter((c) => c !== city)
      : [...currentCities, city];
    updateFilters({ cities: newCities });
  };

  const toggleLegalForm = (form: string) => {
    const currentLegalForms = safeFilters.legalForms;
    const newForms = currentLegalForms.includes(form)
      ? currentLegalForms.filter((f) => f !== form)
      : [...currentLegalForms, form];
    updateFilters({ legalForms: newForms });
  };

  const toggleRole = (role: string) => {
    const currentRoles = safeFilters.roles;
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];
    updateFilters({ roles: newRoles });
  };

  const filteredRoles = availableRoles.filter((role) =>
    role.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const [importedLists, setImportedLists] = useState<List[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    // Charger les listes importées au montage
    ListService.getAllImportedLists()
      .then((data) => setImportedLists(data))
      .catch(() => setImportedLists([]))
      .finally(() => setLoadingLists(false));
  }, []);

  const handleNafCheckbox = (code: string) => {
    setSelectedNafCodes((prev) => {
      const newCodes = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code];
      setFilters({ ...filters, activities: newCodes });
      return newCodes;
    });
  };

  const legalFormListRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const conventionListRef = useRef<HTMLDivElement>(null);
  const lastConventionScrollTop = useRef(0);

  // Ajouter useEffect pour charger les catégories Google au montage
  useEffect(() => {
    if (activitySearchType === 'google') {
      loadGoogleCategories();
    } else if (activitySearchType === 'semantic') {
      loadSemanticConcepts();
    }
  }, [activitySearchType]);

  const loadGoogleCategories = async () => {
    setLoadingGoogleCategories(true);
    try {
      const response = await googlePlacesService.getCategories();
      const allCategories: GooglePlacesCategory[] = [];
      Object.values(response.categories).forEach(group => {
        allCategories.push(...group);
      });
      setGoogleCategories(allCategories);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories Google:', error);
    } finally {
      setLoadingGoogleCategories(false);
    }
  };

  const handleGoogleActivityToggle = (activity: string) => {
    const newSelected = selectedGoogleActivities.includes(activity)
      ? selectedGoogleActivities.filter(a => a !== activity)
      : [...selectedGoogleActivities, activity];
    
    setSelectedGoogleActivities(newSelected);
    updateFilters({ 
      googleActivities: newSelected,
      activitySearchType: 'google'
    });
  };

  const loadSemanticConcepts = async () => {
    setLoadingSemanticConcepts(true);
    try {
      const concepts = await semanticService.getPopularConcepts();
      setPopularConcepts(concepts);
    } catch (error) {
      console.error('Erreur lors du chargement des concepts sémantiques:', error);
    } finally {
      setLoadingSemanticConcepts(false);
    }
  };

  const handleSemanticSearch = async (term: string) => {
    if (term.length < 2) {
      setSemanticSuggestions([]);
      return;
    }

    try {
      const suggestions = await semanticService.getSuggestions(term);
      setSemanticSuggestions(suggestions);
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions sémantiques:', error);
    }
  };

  const handleSemanticTermToggle = (term: string) => {
    const newSelected = selectedSemanticTerms.includes(term)
      ? selectedSemanticTerms.filter(t => t !== term)
      : [...selectedSemanticTerms, term];
    
    setSelectedSemanticTerms(newSelected);
    updateFilters({ 
      semanticTerms: newSelected,
      activitySearchType: 'semantic'
    } as any);
  };

  // Gestion des secteurs (remplace enseigne/franchise)
  const handleSectorAdd = (sector: string) => {
    console.log('🔍 [SECTEUR] handleSectorAdd appelé avec:', sector);
    console.log('🔍 [SECTEUR] selectedSectors actuels:', selectedSectors);
    console.log('🔍 [SECTEUR] filters actuels:', filters);
    
    if (!selectedSectors.includes(sector)) {
      const newSelected = [...selectedSectors, sector];
      setSelectedSectors(newSelected);
      console.log('🔍 [SECTEUR] Nouveaux secteurs sélectionnés:', newSelected);
      
      // Trouver le code NAF correspondant au secteur
      const sectorData = linkedinSectors.find(s => s.secteur === sector);
      console.log('🔍 [SECTEUR] Données du secteur trouvées:', sectorData);
      
      if (sectorData) {
        const newNafCodes = [...(filters.sectorNafCodes || []), sectorData.code];
        console.log('🔍 [SECTEUR] Nouveaux codes NAF:', newNafCodes);
        
        const updates = { 
          sectors: newSelected,
          sectorNafCodes: newNafCodes,
          activitySearchType: 'secteur'
        };
        console.log('🔍 [SECTEUR] Mise à jour des filtres:', updates);
        
        updateFilters(updates as any);
      } else {
        console.error('❌ [SECTEUR] Secteur non trouvé dans linkedinSectors:', sector);
        console.log('🔍 [SECTEUR] linkedinSectors disponibles:', linkedinSectors.slice(0, 5));
      }
    } else {
      console.log('🔍 [SECTEUR] Secteur déjà sélectionné:', sector);
    }
    setSectorSearchTerm(''); // Vider le champ de saisie
  };

  const handleSectorToggle = (sector: string) => {
    console.log('🔍 [SECTEUR] handleSectorToggle appelé avec:', sector);
    console.log('🔍 [SECTEUR] selectedSectors actuels:', selectedSectors);
    
    const newSelected = selectedSectors.filter(s => s !== sector);
    setSelectedSectors(newSelected);
    console.log('🔍 [SECTEUR] Nouveaux secteurs après suppression:', newSelected);
    
    // Retirer le code NAF correspondant au secteur
    const sectorData = linkedinSectors.find(s => s.secteur === sector);
    console.log('🔍 [SECTEUR] Données du secteur à supprimer:', sectorData);
    
    if (sectorData) {
      const newNafCodes = (filters.sectorNafCodes || []).filter(code => code !== sectorData.code);
      console.log('🔍 [SECTEUR] Nouveaux codes NAF après suppression:', newNafCodes);
      
      const updates = { 
        sectors: newSelected,
        sectorNafCodes: newNafCodes,
        activitySearchType: newSelected.length > 0 ? 'secteur' : 'naf'
      };
      console.log('🔍 [SECTEUR] Mise à jour des filtres après suppression:', updates);
      
      updateFilters(updates as any);
    }
  };

  // Gestion des départements
  const handleDepartmentAdd = (department: string) => {
    console.log('🔍 [DEPARTEMENT] handleDepartmentAdd appelé avec:', department);
    console.log('🔍 [DEPARTEMENT] selectedDepartments actuels:', selectedDepartments);
    
    if (!selectedDepartments.includes(department)) {
      const newSelected = [...selectedDepartments, department];
      setSelectedDepartments(newSelected);
      console.log('🔍 [DEPARTEMENT] Nouveaux départements sélectionnés:', newSelected);
      
      // Trouver le code département correspondant
      const departmentData = departementsFrance.find(d => d.departement === department);
      console.log('🔍 [DEPARTEMENT] Données du département trouvées:', departmentData);
      
      if (departmentData) {
        const newDepartmentCodes = [...(filters.departmentCodes || []), departmentData.code];
        console.log('🔍 [DEPARTEMENT] Nouveaux codes département:', newDepartmentCodes);
        
        const updates = { 
          departments: newSelected,
          departmentCodes: newDepartmentCodes
        };
        console.log('🔍 [DEPARTEMENT] Mise à jour des filtres:', updates);
        
        updateFilters(updates as any);
      } else {
        console.error('❌ [DEPARTEMENT] Département non trouvé dans departementsFrance:', department);
        console.log('🔍 [DEPARTEMENT] departementsFrance disponibles:', departementsFrance.slice(0, 5));
      }
    } else {
      console.log('🔍 [DEPARTEMENT] Département déjà sélectionné:', department);
    }
    setDepartmentSearchTerm(''); // Vider le champ de saisie
  };

  const handleDepartmentToggle = (department: string) => {
    console.log('🔍 [DEPARTEMENT] handleDepartmentToggle appelé avec:', department);
    console.log('🔍 [DEPARTEMENT] selectedDepartments actuels:', selectedDepartments);
    
    const newSelected = selectedDepartments.filter(d => d !== department);
    setSelectedDepartments(newSelected);
    console.log('🔍 [DEPARTEMENT] Nouveaux départements après suppression:', newSelected);
    
    // Retirer le code département correspondant
    const departmentData = departementsFrance.find(d => d.departement === department);
    console.log('🔍 [DEPARTEMENT] Données du département à supprimer:', departmentData);
    
    if (departmentData) {
      const newDepartmentCodes = (filters.departmentCodes || []).filter(code => code !== departmentData.code);
      console.log('🔍 [DEPARTEMENT] Nouveaux codes département après suppression:', newDepartmentCodes);
      
      const updates = { 
        departments: newSelected,
        departmentCodes: newDepartmentCodes
      };
      console.log('🔍 [DEPARTEMENT] Mise à jour des filtres après suppression:', updates);
      
      updateFilters(updates as any);
    }
  };

  // Fonctions pour la gestion des régions
  const handleRegionAdd = (region: string) => {
    console.log('🔍 [REGION] handleRegionAdd appelé avec:', region);
    console.log('🔍 [REGION] selectedRegions actuels:', selectedRegions);
    
    if (selectedRegions.includes(region)) {
      console.log('🔍 [REGION] Région déjà sélectionnée:', region);
      return;
    }
    
    const newSelected = [...selectedRegions, region];
    setSelectedRegions(newSelected);
    console.log('🔍 [REGION] Nouveaux régions sélectionnés:', newSelected);
    
    // Trouver le code région correspondant
    const regionData = regionsFrance.find(r => r.region === region);
    console.log('🔍 [REGION] Données de la région trouvées:', regionData);
    
    if (regionData) {
      const newRegionCodes = [...(filters.regionCodes || []), regionData.code];
      console.log('🔍 [REGION] Nouveaux codes région:', newRegionCodes);
      
      const updates = { 
        regions: newSelected,
        regionCodes: newRegionCodes
      };
      console.log('🔍 [REGION] Mise à jour des filtres:', updates);
      
      updateFilters(updates as any);
    } else {
      console.error('❌ [REGION] Région non trouvée dans regionsFrance:', region);
    }
    setRegionSearchTerm(''); // Vider le champ de saisie
  };

  const handleRegionToggle = (region: string) => {
    console.log('🔍 [REGION] handleRegionToggle appelé avec:', region);
    console.log('🔍 [REGION] selectedRegions actuels:', selectedRegions);
    
    const newSelected = selectedRegions.filter(r => r !== region);
    setSelectedRegions(newSelected);
    console.log('🔍 [REGION] Nouveaux régions après suppression:', newSelected);
    
    // Retirer le code région correspondant
    const regionData = regionsFrance.find(r => r.region === region);
    console.log('🔍 [REGION] Données de la région à supprimer:', regionData);
    
    if (regionData) {
      const newRegionCodes = (filters.regionCodes || []).filter(code => code !== regionData.code);
      console.log('🔍 [REGION] Nouveaux codes région après suppression:', newRegionCodes);
      
      const updates = { 
        regions: newSelected,
        regionCodes: newRegionCodes
      };
      console.log('🔍 [REGION] Mise à jour des filtres après suppression:', updates);
      
      updateFilters(updates as any);
    }
  };

  // Charger les secteurs populaires au démarrage
  useEffect(() => {
    // Les secteurs populaires sont déjà dans le fichier JSON
    // On peut les charger directement
  }, []);

  // Synchroniser les départements sélectionnés avec les filtres
  useEffect(() => {
    if (filters.departments) {
      setSelectedDepartments(filters.departments);
    }
  }, [filters.departments]);

  // Synchroniser les régions sélectionnées avec les filtres
  useEffect(() => {
    if (filters.regions) {
      setSelectedRegions(filters.regions);
    }
  }, [filters.regions]);

  // Fonctions pour la gestion des entreprises (page contact)
  const loadCompanies = async (page: number = 1, searchTerm: string = '') => {
    if (isContactPage) {
      setLoadingCompanies(true);
      try {
        const response = await companyListService.getCompanies(page, 10, searchTerm);
        setCompanies(response.results);
        setCompanyCurrentPage(response.page);
        setCompanyTotalPages(response.total_pages);
        setCompanyTotalResults(response.total_results);
      } catch (error) {
        console.error('Erreur lors du chargement des entreprises:', error);
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    }
  };

  const handleCompanySearch = async (searchTerm: string) => {
    setCompanySearchTerm(searchTerm);
    setCompanyCurrentPage(1);
    // Si le terme de recherche est vide, on charge toutes les entreprises (recherche globale)
    await loadCompanies(1, searchTerm);
  };

  const handleCompanyPageChange = async (page: number) => {
    setCompanyCurrentPage(page);
    await loadCompanies(page, companySearchTerm);
  };

  const handleCompanySelect = (company: CompanyListItem) => {
    const companyName = company.nom_raison_sociale || company.nom_complet;
    updateFilters({ selectedCompany: companyName });
  };

  // Charger les entreprises au montage si on est sur la page contact
  useEffect(() => {
    if (isContactPage) {
      loadCompanies(1, '');
    }
  }, [isContactPage]);

  // Fonctions pour la gestion des contacts (page entreprises)
  const loadContacts = async (page: number = 1, searchTerm: string = '') => {
    if (isEntreprisePage) {
      setLoadingContacts(true);
      try {
        const response = await contactListService.getContacts(page, 10, searchTerm);
        setContacts(response.results);
        setContactCurrentPage(response.page);
        setContactTotalPages(response.total_pages);
        setContactTotalResults(response.total_results);
      } catch (error) {
        console.error('Erreur lors du chargement des contacts:', error);
        setContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    }
  };

  const handleContactSearch = async (searchTerm: string) => {
    setContactSearchTerm(searchTerm);
    setContactCurrentPage(1);
    await loadContacts(1, searchTerm);
  };

  const handleContactPageChange = async (page: number) => {
    setContactCurrentPage(page);
    await loadContacts(page, contactSearchTerm);
  };

  const handleContactSelect = (contact: ContactListItem) => {
    const companyName = contact.entreprise;
    updateFilters({ selectedContact: companyName });
  };

  // Charger les contacts au montage si on est sur la page entreprises
  useEffect(() => {
    if (isEntreprisePage) {
      loadContacts(1, '');
    }
  }, [isEntreprisePage]);

  // Fonction pour charger les détails d'une liste spécifique (lazy loading)
  const loadListDetails = async (listId: string) => {
    if (loadingListDetails.has(listId)) return;

    // Marquer cette liste comme en cours de chargement
    setLoadingListDetails(prev => new Set([...prev, listId]));

    try {
      const detailResponse = await fetch(`/api/pronto/lists/${listId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        if (detailData.success && detailData.list) {
          // Mettre à jour la liste spécifique avec ses détails
          setProntoLists(prevLists =>
            prevLists.map(list =>
              list.id === listId
                ? {
                    ...list,
                    companies_count: detailData.list.companies_count,
                    companies: detailData.list.companies || [],
                    detailsLoaded: true
                  }
                : list
            )
          );
          console.log(`✅ Détails chargés pour la liste ${listId}: ${detailData.list.companies_count} entreprises`);
        }
      } else {
        console.warn(`⚠️ Impossible de charger les détails de la liste ${listId}`);
      }
    } catch (error) {
      console.warn(`⚠️ Erreur lors du chargement des détails de la liste ${listId}:`, error);
    } finally {
      // Retirer cette liste de la liste des chargements en cours
      setLoadingListDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(listId);
        return newSet;
      });
    }
  };

  // Fonction pour charger les listes Pronto (affichage rapide puis lazy loading des détails)
  const loadProntoLists = async () => {
    if (loadingProntoLists) return;

    setLoadingProntoLists(true);
    try {
      // Étape 1: Charger rapidement la liste des listes (affichage immédiat)
      const response = await fetch('/api/pronto/lists', {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // La réponse a la structure { success: true, lists: [...] }
        if (data.success && data.lists) {
          // Afficher immédiatement les listes avec les données de base
          setProntoLists(data.lists.map((list: any) => ({
            ...list,
            detailsLoaded: false // Indicateur que les détails ne sont pas encore chargés
          })));
          console.log('✅ Listes Pronto chargées (affichage rapide):', data.lists);

          // Étape 2: Charger les détails de chaque liste une par une (lazy loading)
          // Petit délai entre chaque chargement pour éviter de surcharger l'API
          for (let i = 0; i < data.lists.length; i++) {
            const list = data.lists[i];
            // Délai progressif pour étaler les requêtes
            setTimeout(() => {
              loadListDetails(list.id);
            }, i * 200); // 200ms entre chaque requête
          }
        } else {
          console.warn('⚠️ Réponse inattendue de l\'API:', data);
          setProntoLists([]);
        }
      } else {
        console.error('❌ Erreur lors du chargement des listes Pronto');
        setProntoLists([]);
      }
    } catch (error) {
      console.error('❌ Erreur réseau lors du chargement des listes Pronto:', error);
      setProntoLists([]);
    } finally {
      setLoadingProntoLists(false);
    }
  };

  // Charger les listes Pronto au montage si on est sur la page contact
  useEffect(() => {
    if (isContactPage) {
      loadProntoLists();
    }
  }, [isContactPage]);

  // Debug et ouverture automatique de la section Localisation
  useEffect(() => {
    console.log('🏙️ FilterPanel - Villes disponibles:', availableCities);
    console.log('🏙️ FilterPanel - Nombre de villes:', availableCities.length);

    if (availableCities.length > 0) {
      if (isEntreprisePage) {
        setOpenEntrepriseFilters(prev => ({ ...prev, localisation: true }));
      }
      if (isContactPage) {
        setOpenContactFilters(prev => ({ ...prev, localisation: true }));
      }
      console.log(`🏙️ Section Localisation ouverte automatiquement (${availableCities.length} villes disponibles)`);
    } else {
      console.log('⚠️ Aucune ville disponible dans le FilterPanel');
    }
  }, [availableCities, isEntreprisePage, isContactPage]);

  // Adapte MainSection pour accepter 'listes'
  const MainSection = ({
    title,
    id,
    children,
  }: {
    title: string;
    id: 'entreprise' | 'contact' | 'listes';
    children?: React.ReactNode;
  }) => (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setExpandedMainSection(expandedMainSection === id ? null : id)}
        className={`w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors rounded-t-lg ${expandedMainSection === id ? 'bg-gray-100' : ''}`}
      >
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-xl font-bold text-gray-500 select-none">
          {expandedMainSection === id ? '-' : '+'}
        </span>
      </button>
      {expandedMainSection === id && children && <div className="px-4 pb-4">{children}</div>}
    </div>
  );

  return (
    <>
      {/* Section Listes importées toujours ouverte, non réductible */}
      {/* <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="font-medium text-gray-900 mb-2">Listes importées</div>
        {loadingLists ? (
          <div className="text-xs text-gray-500">Chargement...</div>
        ) : importedLists.length === 0 ? (
          <div className="text-xs text-gray-500">Aucune liste importée</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {importedLists.map((list) => (
              <button
                key={list.id}
                className="text-white text-sm font-normal py-1 px-3 rounded-full transition hover:opacity-90 truncate max-w-full"
                type="button"
                title={list.nom}
                style={{ background: 'linear-gradient(to right, #141838, #2a2f5a)' }}
                onClick={async () => {
                  try {
                    const res = await axios.get(`/api/list/${list.id}/first-column`);
                    window.dispatchEvent(new CustomEvent('updateBusinessList', { detail: res.data }));
                    console.log('Liste des noms autorisés envoyée:', res.data);
                  } catch (err) {
                    alert("Erreur lors de la récupération des noms d'entreprise !");
                    console.error(err);
                  }
                }}
              >
                {list.nom}
              </button>
            ))}
          </div>
        )}
      </div> */}
      
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Filtres</span>
          <button
            onClick={() =>
              onFiltersChange({
                searchTerm: "",
                activities: [],
                employeeRange: employeeRange,
                revenueRange: revenueRange,
                ageRange: ageRange,
                cities: [],
                legalForms: [],
                ratingRange: [0, 5],
                roles: [],
                sortBy: "Pertinence",
                googleActivities: [],
                semanticTerms: [],
                activitySearchType: 'naf',
                selectedCompany: undefined,
                selectedContact: undefined
              })
            }
            className="ml-auto text-xs text-orange-600 hover:text-orange-700 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div>
        {/* Affichage dynamique de l'ordre des sections selon la page */}
        {/* Toujours afficher la section Entreprise en premier si on est sur la page entreprise */}
        {isEntreprisePage ? (
          <>
            <MainSection title="Entreprise" id="entreprise">
      {/* Activités (UI inspirée de l'image fournie) */}
      <div className={`mb-2 border-b border-gray-100 last:border-b-0 ${openEntrepriseFilters.activites ? 'border-2 border-orange-500 rounded p-3' : ''}` }>
        <button
          className="w-full flex items-center justify-between py-2 text-left"
          onClick={() => toggleEntrepriseFilter('activites')}
        >
          <span className="font-semibold">Activités</span>
          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform ${openEntrepriseFilters.activites ? 'rotate-180' : ''}`}
          />
        </button>
        {openEntrepriseFilters.activites && (
          <div className="pt-2 pb-4 space-y-4">
            {/* Onglets de recherche */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'naf', label: 'Code NAF' }, 
                { key: 'google', label: 'Activité Google (GMB)' }, 
                { key: 'semantic', label: 'Sémantique' }, 
                { key: 'secteur', label: 'Secteur' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`px-3 py-1 rounded text-sm font-medium border transition ${
                    activitySearchType === tab.key 
                      ? 'bg-orange-600 text-white border-orange-600' 
                      : 'text-orange-600 border-orange-300 hover:bg-orange-50'
                  }`}
                  type="button"
                  onClick={() => setActivitySearchType(tab.key as any)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Zone de recherche conditionnelle selon le type */}
            {activitySearchType === 'naf' && (
              <>
                <input
                  type="text"
                  placeholder="Mots-clés, code NAF"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />

                {/* Boutons de code et chargement */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 rounded border border-gray-300"
                    onClick={() => { console.log('NAF modal click'); setNafModalOpen(true); }}
                  >
                    📘 Codes NAF
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 rounded border border-gray-300"
                  >
                    ⬆️ Charger
                  </button>
                </div>
              </>
            )}

            {activitySearchType === 'google' && (
              <>
                <input
                  type="text"
                  placeholder="Ex: restaurant, boulangerie, coiffeur..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />

                {/* Liste des catégories Google pré-définies */}
                {loadingGoogleCategories ? (
                  <div className="text-center py-4">
                    <span className="text-sm text-gray-500">Chargement des catégories...</span>
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 space-y-1">
                    {googleCategories
                      .filter(cat => 
                        !activitySearch || 
                        cat.name.toLowerCase().includes(activitySearch.toLowerCase())
                      )
                      .slice(0, 20) // Limiter à 20 résultats
                      .map(category => (
                        <label key={category.value} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 rounded p-1">
                          <input
                            type="checkbox"
                            checked={selectedGoogleActivities.includes(category.value)}
                            onChange={() => handleGoogleActivityToggle(category.value)}
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <span className="text-gray-700">{category.name}</span>
                        </label>
                      ))}
                  </div>
                )}

                {/* Bouton pour rechercher directement */}
                <button
                  type="button"
                  className="w-full py-1.5 px-3 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded"
                  onClick={() => {
                    if (activitySearch.trim()) {
                      handleGoogleActivityToggle(activitySearch.trim());
                    }
                  }}
                  disabled={!activitySearch.trim()}
                >
                  ✓ Ajouter cette activité
                </button>

                {/* Activités sélectionnées */}
                {selectedGoogleActivities.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-700">Activités sélectionnées:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedGoogleActivities.map(activity => (
                        <span 
                          key={activity}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800"
                        >
                          {activity}
                          <button
                            type="button"
                            onClick={() => handleGoogleActivityToggle(activity)}
                            className="ml-1 text-orange-600 hover:text-orange-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activitySearchType === 'semantic' && (
              <>
                <input
                  type="text"
                  placeholder="Ex: services de beauté, commerce alimentaire, restauration..."
                  value={semanticSearchTerm}
                  onChange={(e) => {
                    setSemanticSearchTerm(e.target.value);
                    handleSemanticSearch(e.target.value);
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />

                {/* Concepts populaires */}
                {loadingSemanticConcepts ? (
                  <div className="text-center py-4">
                    <span className="text-sm text-gray-500">Chargement des concepts...</span>
                  </div>
                ) : popularConcepts.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-gray-700">Concepts populaires:</span>
                    <div className="flex flex-wrap gap-1">
                      {popularConcepts.slice(0, 6).map(concept => (
                        <button
                          key={concept.term}
                          type="button"
                          onClick={() => {
                            setSemanticSearchTerm(concept.term);
                            handleSemanticTermToggle(concept.term);
                          }}
                          className={`px-2 py-1 rounded text-xs border transition ${
                            selectedSemanticTerms.includes(concept.term)
                              ? 'bg-orange-100 text-orange-800 border-orange-300'
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                          }`}
                          title={concept.description}
                        >
                          {concept.term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions en temps réel */}
                {semanticSuggestions.length > 0 && semanticSearchTerm.length >= 2 && (
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                    <span className="text-xs font-medium text-gray-700 block mb-1">Suggestions:</span>
                    {semanticSuggestions.slice(0, 8).map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSemanticSearchTerm(suggestion.term);
                          handleSemanticTermToggle(suggestion.term);
                        }}
                        className="block w-full text-left px-2 py-1 text-sm hover:bg-white rounded mb-1 text-gray-700"
                      >
                        <span className="font-medium">{suggestion.term}</span>
                        {suggestion.type === 'synonym' && suggestion.originalTerm && (
                          <span className="text-xs text-gray-500 ml-1">→ {suggestion.originalTerm}</span>
                        )}
                        <span className="text-xs text-gray-500 block">
                          {suggestion.nafCodes.length} code{suggestion.nafCodes.length > 1 ? 's' : ''} NAF
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Bouton d'ajout de terme personnalisé */}
                <button
                  type="button"
                  className="w-full py-1.5 px-3 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded"
                  onClick={() => {
                    if (semanticSearchTerm.trim()) {
                      handleSemanticTermToggle(semanticSearchTerm.trim());
                    }
                  }}
                  disabled={!semanticSearchTerm.trim()}
                >
                  ✓ Rechercher "{semanticSearchTerm}"
                </button>

                {/* Termes sélectionnés */}
                {selectedSemanticTerms.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-700">Termes sélectionnés:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedSemanticTerms.map(term => (
                        <span 
                          key={term}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800"
                        >
                          {term}
                          <button
                            type="button"
                            onClick={() => handleSemanticTermToggle(term)}
                            className="ml-1 text-orange-600 hover:text-orange-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activitySearchType === 'secteur' && (
              <>
                <input
                  type="text"
                  placeholder="Rechercher un secteur..."
                  value={sectorSearchTerm}
                  onChange={(e) => setSectorSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                
                {/* Liste des secteurs filtrés */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                  {linkedinSectors
                    .filter(sector => 
                      !sectorSearchTerm || 
                      sector.secteur.toLowerCase().includes(sectorSearchTerm.toLowerCase())
                    )
                    .map(sector => (
                      <label key={sector.secteur} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 rounded p-1">
                        <input
                          type="checkbox"
                          checked={selectedSectors.includes(sector.secteur)}
                          onChange={() => {
                            if (selectedSectors.includes(sector.secteur)) {
                              handleSectorToggle(sector.secteur);
                            } else {
                              handleSectorAdd(sector.secteur);
                            }
                          }}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-gray-700 font-medium">{sector.secteur}</span>
                          {/* <div className="text-xs text-gray-500">
                            Code NAF: {sector.code}
                          </div> */}
                        </div>
                      </label>
                    ))}
                </div>

                {/* Secteurs sélectionnés */}
                {selectedSectors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <span className="text-xs font-medium text-gray-700">Secteurs sélectionnés:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedSectors.map(sector => {
                        const sectorData = linkedinSectors.find(s => s.secteur === sector);
                        return (
                          <span 
                            key={sector}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800"
                            title={sectorData ? `Code NAF: ${sectorData.code}` : ''}
                          >
                            {sector}
                            <button
                              type="button"
                              onClick={() => handleSectorToggle(sector)}
                              className="ml-1 text-orange-600 hover:text-orange-800"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Informations sur les codes NAF */}
                {selectedSectors.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <strong>Codes NAF sélectionnés:</strong>
                    <div className="mt-1">
                      {selectedSectors.map(sector => {
                        const sectorData = linkedinSectors.find(s => s.secteur === sector);
                        return sectorData ? (
                          <div key={sector} className="text-blue-700">
                            {sectorData.code} - {sectorData.secteur}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Checkbox d'exclusion */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                className="w-4 h-4 text-orange-600 rounded"
                onChange={(e) =>
                  updateFilters({
                    excludeSelectedActivities: e.target.checked,
                  } as any)
                }
              />
              <span className="text-gray-700">Exclure les éléments sélectionnés</span>
            </label>
          </div>
        )}
      </div>
              {/* Chiffres clés */}
              <div className={`mb-2 border-b border-gray-100 last:border-b-0 ${openEntrepriseFilters.chiffres ? 'border-2 border-orange-500 rounded p-3' : ''}` }>
                <button
                  className="w-full flex items-center justify-between py-2 text-left"
                  onClick={() => toggleEntrepriseFilter('chiffres')}
                >
                  <span className="font-semibold">Chiffres clés</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${openEntrepriseFilters.chiffres ? 'rotate-180' : ''}`}
                  />
                </button>
                {openEntrepriseFilters.chiffres && (
                  <div className="pt-2 pb-4 space-y-14 max-h-96 overflow-y-auto overflow-x-hidden">
                    <RangeSlider
                      min={ageRange[0]}
                      max={ageRange[1]}
                      value={filters.ageRange}
                      onChange={(value) => updateFilters({ ageRange: value })}
                      label="Âge de l'entreprise"
                      unit=" ans"
                    />
                    <RangeSlider
                      min={employeeRange[0]}
                      max={employeeRange[1]}
                      value={filters.employeeRange}
                      onChange={(value) => updateFilters({ employeeRange: value })}
                      label="Nombre d'employés"
                    />
                    <RangeSlider
                      min={revenueRange[0]}
                      max={revenueRange[1]}
                      value={filters.revenueRange}
                      onChange={(value) => setFilters({ ...filters, revenueRange: value })}
                      label="Chiffre d'affaires"
                      formatValue={(v) => `${Math.round(v / 1000)}k`}
                      unit="€"
                    />
                  </div>
                )}
              </div>

              {/* Juridique */}
              <div className={`mb-2 border-b border-gray-100 last:border-b-0 ${openEntrepriseFilters.forme ? 'border-2 border-orange-500 rounded p-3' : ''}` }>
                <button
                  className="w-full flex items-center justify-between py-2 text-left"
                  onClick={() => toggleEntrepriseFilter('forme')}
                >
                  <span className="font-semibold">Juridique</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${openEntrepriseFilters.forme ? 'rotate-180' : ''}`}
                  />
                </button>
                {openEntrepriseFilters.forme && (
                  <div className="pt-2 pb-4 space-y-6">
                    {/* Section Forme juridique avec scroll dédié */}
                    <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                      <div className="font-semibold text-base text-gray-700 mb-1">Forme juridique</div>
                      <input
                        type="text"
                        placeholder="Rechercher une forme juridique..."
                        value={legalFormSearch}
                        onChange={e => setLegalFormSearch(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                      />
                      {naturesJuridiques
                        .filter(nature => nature.titre.toLowerCase().includes(legalFormSearch.toLowerCase()))
                        .map((nature) => (
                          <label key={nature.id} className="flex items-center space-x-2 text-base">
                            <input
                              type="checkbox"
                              checked={safeFilters.legalForms.includes(nature.id)}
                              onChange={() => {
                                if (legalFormListRef.current) {
                                  lastScrollTop.current = legalFormListRef.current.scrollTop;
                                }
                                const currentIds = safeFilters.legalForms || [];
                                const newIds = currentIds.includes(nature.id)
                                  ? currentIds.filter((id) => id !== nature.id)
                                  : [...currentIds, nature.id];
                                setFilters({ ...filters, legalForms: newIds });
                              }}
                              className="w-4 h-4 text-orange-600 rounded"
                            />
                            <span className="text-gray-700">{nature.titre}</span>
                          </label>
                        ))}
                    </div>
                    {/* Séparateur */}
                    <div className="border-t border-gray-200 my-2"></div>
                    {/* Section Convention Collective avec scroll dédié */}
                    <div
                      ref={conventionListRef}
                      className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white"
                    >
                      <div className="font-semibold text-base text-gray-700 mb-1 mt-0">Convention Collective</div>
                      <input
                        type="text"
                        placeholder="Rechercher une convention..."
                        value={conventionSearch}
                        onChange={e => setConventionSearch(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                      />
                      {conventionPrefixes.map(prefix => (
                        <div key={prefix}>
                          <button
                            type="button"
                            className="w-full flex items-center justify-between py-1 text-left font-semibold text-orange-700 hover:bg-orange-50 rounded"
                            onClick={() => setOpenConventionSections(s => ({ ...s, [prefix]: !s[prefix] }))}
                          >
                            <span>{prefix}XXX</span>
                            <span className="text-xl font-bold text-gray-500 select-none">{openConventionSections[prefix] ? '-' : '+'}</span>
                          </button>
                          {openConventionSections[prefix] && (
                            <div className="pl-2 space-y-1">
                              {conventionsGrouped[prefix]
                                .filter(c => c.titre.toLowerCase().includes(conventionSearch.toLowerCase()))
                                .map(c => (
                                  <label key={c.idcc} className="flex items-center space-x-2 text-base">
                                    <input
                                      type="checkbox"
                                      checked={selectedConventionId === c.idcc}
                                      onChange={() => {
                                        if (conventionListRef.current) {
                                          lastConventionScrollTop.current = conventionListRef.current.scrollTop;
                                        }
                                        if (selectedConventionId === c.idcc) {
                                          setSelectedConventionId(null);
                                          setFilters({ ...filters, id_convention_collective: undefined });
                                        } else {
                                          setSelectedConventionId(c.idcc);
                                          setFilters({ ...filters, id_convention_collective: c.idcc });
                                        }
                                      }}
                                      className="w-4 h-4 text-orange-600 rounded"
                                    />
                                    <span className="text-gray-700">{c.titre}</span>
                                  </label>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Localisation */}
              <div className={`mb-2 border-b border-gray-100 last:border-b-0 ${openEntrepriseFilters.localisation ? 'border-2 border-orange-500 rounded p-3' : ''}` }>
                <button
                  className="w-full flex items-center justify-between py-2 text-left"
                  onClick={() => toggleEntrepriseFilter('localisation')}
                >
                  <span className="font-semibold">
                    Localisation
                    {availableCities.length > 0 && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {availableCities.length} villes
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${openEntrepriseFilters.localisation ? 'rotate-180' : ''}`}
                  />
                </button>
                {openEntrepriseFilters.localisation && (
                  <div className="pt-2 pb-4 space-y-6">
                    {/* Section Ville */}
                    <div className="space-y-2">
                      <div className="font-semibold text-base text-gray-700 mb-1 flex items-center justify-between">
                        <span>Ville</span>
                        {availableCities.length > 0 && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {availableCities.length} disponibles
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Rechercher une ville..."
                        value={citySearchTerm}
                        onChange={(e) => setCitySearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                      />
                      <div className="min-h-[100px] max-h-96 overflow-y-auto border border-gray-200 rounded p-3 bg-white">
                        {!availableCities || availableCities.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                            Aucune ville disponible
                            <div className="text-xs text-gray-400 mt-1">
                              Debug: availableCities = {JSON.stringify(availableCities)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Vérifiez la console pour plus de détails
                            </div>
                          </div>
                        ) : (
                          <>
                            {availableCities
                              .filter(city =>
                                !citySearchTerm ||
                                city.toLowerCase().includes(citySearchTerm.toLowerCase())
                              )
                              .map((city) => (
                                <label key={city} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={safeFilters.cities.includes(city)}
                                    onChange={() => toggleCity(city)}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                  />
                                  <span className="text-gray-700 flex items-center gap-2 flex-1">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">{city}</span>
                                  </span>
                                </label>
                              ))}
                            {availableCities
                              .filter(city =>
                                !citySearchTerm ||
                                city.toLowerCase().includes(citySearchTerm.toLowerCase())
                              ).length === 0 && citySearchTerm && (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                Aucune ville trouvée pour "{citySearchTerm}"
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Séparateur */}
                    <div className="border-t border-gray-200 my-2"></div>

                    {/* Section Département */}
                    <div className="space-y-2">
                      <div className="font-semibold text-base text-gray-700 mb-1">Département</div>
                      <input
                        type="text"
                        placeholder="Rechercher un département..."
                        value={departmentSearchTerm}
                        onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                      />
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                        {departementsFrance
                          .filter(dept => 
                            !departmentSearchTerm || 
                            dept.departement.toLowerCase().includes(departmentSearchTerm.toLowerCase()) ||
                            dept.code.toLowerCase().includes(departmentSearchTerm.toLowerCase())
                          )
                          .map((dept) => (
                            <label key={dept.code} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 rounded p-1">
                              <input
                                type="checkbox"
                                checked={selectedDepartments.includes(dept.departement)}
                                onChange={() => {
                                  if (selectedDepartments.includes(dept.departement)) {
                                    handleDepartmentToggle(dept.departement);
                                  } else {
                                    handleDepartmentAdd(dept.departement);
                                  }
                                }}
                                className="w-4 h-4 text-orange-600 rounded"
                              />
                              <span className="text-gray-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="font-mono text-xs bg-gray-100 px-1 rounded">{dept.code}</span>
                                {dept.departement}
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>

                    {/* Départements sélectionnés */}
                    {selectedDepartments.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <span className="text-xs font-medium text-gray-700">Départements sélectionnés:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedDepartments.map(department => {
                            const deptData = departementsFrance.find(d => d.departement === department);
                            return (
                              <span 
                                key={department}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800"
                                title={deptData ? `Code: ${deptData.code}` : ''}
                              >
                                {deptData && <span className="font-mono mr-1">{deptData.code}</span>}
                                {department}
                                <button
                                  onClick={() => handleDepartmentToggle(department)}
                                  className="ml-1 text-orange-600 hover:text-orange-800"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Séparateur */}
                    <div className="border-t border-gray-200 my-2"></div>

                    {/* Section Région */}
                    <div className="space-y-2">
                      <div className="font-semibold text-base text-gray-700 mb-1">Région</div>
                      <input
                        type="text"
                        placeholder="Rechercher une région..."
                        value={regionSearchTerm}
                        onChange={(e) => setRegionSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                      />
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                        {regionsFrance
                          .filter(region => 
                            !regionSearchTerm || 
                            region.region.toLowerCase().includes(regionSearchTerm.toLowerCase()) ||
                            region.code.toLowerCase().includes(regionSearchTerm.toLowerCase())
                          )
                          .map((region) => (
                            <label key={region.code} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 rounded p-1">
                              <input
                                type="checkbox"
                                checked={selectedRegions.includes(region.region)}
                                onChange={() => {
                                  if (selectedRegions.includes(region.region)) {
                                    handleRegionToggle(region.region);
                                  } else {
                                    handleRegionAdd(region.region);
                                  }
                                }}
                                className="w-4 h-4 text-orange-600 rounded"
                              />
                              <span className="text-gray-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="font-mono text-xs bg-gray-100 px-1 rounded">{region.code}</span>
                                {region.region}
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>

                    {/* Régions sélectionnées */}
                    {selectedRegions.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <span className="text-xs font-medium text-gray-700">Régions sélectionnées:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedRegions.map(region => {
                            const regionData = regionsFrance.find(r => r.region === region);
                            return (
                              <span 
                                key={region}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                                title={regionData ? `Code: ${regionData.code}` : ''}
                              >
                                {regionData && <span className="font-mono mr-1">{regionData.code}</span>}
                                {region}
                                <button
                                  onClick={() => handleRegionToggle(region)}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </MainSection>

            

          </>
        ) : (
          <>
            <MainSection title="Contact" id="contact">
              {/* Formulaire de recherche Pronto */}
              {isContactPage && (
                <div className="mb-6 border-b border-gray-200 pb-6">
                  <ProntoSearchForm
                    onSearchResults={(results) => {
                      // Émettre un événement personnalisé pour communiquer avec la page Contact
                      window.dispatchEvent(new CustomEvent('prontoSearchResults', {
                        detail: results
                      }));
                    }}
                    onLoading={(loading) => {
                      // Émettre un événement personnalisé pour l'état de chargement
                      window.dispatchEvent(new CustomEvent('prontoLoading', {
                        detail: loading
                      }));
                    }}
                  />
                </div>
              )}

              {/* Rôles */}
              <div className={`mb-2 border-b border-gray-100 last:border-b-0 ${openContactFilters.roles ? 'border-2 border-orange-500 rounded p-3' : ''}` }>
                <button
                  className="w-full flex items-center justify-between py-2 text-left"
                  onClick={() => toggleContactFilter('roles')}
                >
                  <span className="font-semibold">Rôles</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${openContactFilters.roles ? 'rotate-180' : ''}`}
                  />
                </button>
                {openContactFilters.roles && (
                  <div className="pt-2 pb-4 space-y-2 max-h-96 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Rechercher un rôle..."
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                    />
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {filteredRoles.map((role) => (
                        <label key={role} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={safeFilters.roles.includes(role)}
                            onChange={() => toggleRole(role)}
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <span className="text-gray-700">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Localisation */}
              <div className={`mb-2 border-b border-gray-100 last:border-b-0 ${openContactFilters.localisation ? 'border-2 border-orange-500 rounded p-3' : ''}` }>
                <button
                  className="w-full flex items-center justify-between py-2 text-left"
                  onClick={() => toggleContactFilter('localisation')}
                >
                  <span className="font-semibold">
                    Localisation
                    {availableCities.length > 0 && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {availableCities.length} villes
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${openContactFilters.localisation ? 'rotate-180' : ''}`}
                  />
                </button>
                {openContactFilters.localisation && (
                  <div className="pt-2 pb-4 space-y-6">
                    {/* Section Ville */}
                    <div className="space-y-2">
                      <div className="font-semibold text-base text-gray-700 mb-1 flex items-center justify-between">
                        <span>Ville</span>
                        {availableCities.length > 0 && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {availableCities.length} disponibles
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Rechercher une ville..."
                        value={citySearchTerm}
                        onChange={(e) => setCitySearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                      />
                      <div className="min-h-[100px] max-h-96 overflow-y-auto border border-gray-200 rounded p-3 bg-white">
                        {!availableCities || availableCities.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                            Aucune ville disponible
                            <div className="text-xs text-gray-400 mt-1">
                              Les villes apparaîtront après le chargement des données
                            </div>
                          </div>
                        ) : (
                          <>
                            {availableCities
                              .filter(city =>
                                !citySearchTerm ||
                                city.toLowerCase().includes(citySearchTerm.toLowerCase())
                              )
                              .map((city) => (
                                <label key={city} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={safeFilters.cities.includes(city)}
                                    onChange={() => toggleCity(city)}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                  />
                                  <span className="text-gray-700 flex items-center gap-2 flex-1">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">{city}</span>
                                  </span>
                                </label>
                              ))}
                            {availableCities
                              .filter(city =>
                                !citySearchTerm ||
                                city.toLowerCase().includes(citySearchTerm.toLowerCase())
                              ).length === 0 && citySearchTerm && (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                Aucune ville trouvée pour "{citySearchTerm}"
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Séparateur */}
                    <div className="border-t border-gray-200 my-2"></div>

                    {/* Section Département */}
                    <div className="space-y-2">
                      <div className="font-semibold text-base text-gray-700 mb-1">Département</div>
                      <input
                        type="text"
                        placeholder="Rechercher un département..."
                        value={departmentSearchTerm}
                        onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                      />
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                        {departementsFrance
                          .filter(dept => 
                            !departmentSearchTerm || 
                            dept.departement.toLowerCase().includes(departmentSearchTerm.toLowerCase()) ||
                            dept.code.toLowerCase().includes(departmentSearchTerm.toLowerCase())
                          )
                          .map((dept) => (
                            <label key={dept.code} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 rounded p-1">
                              <input
                                type="checkbox"
                                checked={selectedDepartments.includes(dept.departement)}
                                onChange={() => {
                                  if (selectedDepartments.includes(dept.departement)) {
                                    handleDepartmentToggle(dept.departement);
                                  } else {
                                    handleDepartmentAdd(dept.departement);
                                  }
                                }}
                                className="w-4 h-4 text-orange-600 rounded"
                              />
                              <span className="text-gray-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="font-mono text-xs bg-gray-100 px-1 rounded">{dept.code}</span>
                                {dept.departement}
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>

                    {/* Départements sélectionnés */}
                    {selectedDepartments.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <span className="text-xs font-medium text-gray-700">Départements sélectionnés:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedDepartments.map(department => {
                            const deptData = departementsFrance.find(d => d.departement === department);
                            return (
                              <span 
                                key={department}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800"
                                title={deptData ? `Code: ${deptData.code}` : ''}
                              >
                                {deptData && <span className="font-mono mr-1">{deptData.code}</span>}
                                {department}
                                <button
                                  onClick={() => handleDepartmentToggle(department)}
                                  className="ml-1 text-orange-600 hover:text-orange-800"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Séparateur */}
                    <div className="border-t border-gray-200 my-2"></div>

                    {/* Section Région */}
                    <div className="space-y-2">
                      <div className="font-semibold text-base text-gray-700 mb-1">Région</div>
                      <input
                        type="text"
                        placeholder="Rechercher une région..."
                        value={regionSearchTerm}
                        onChange={(e) => setRegionSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                      />
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                        {regionsFrance
                          .filter(region => 
                            !regionSearchTerm || 
                            region.region.toLowerCase().includes(regionSearchTerm.toLowerCase()) ||
                            region.code.toLowerCase().includes(regionSearchTerm.toLowerCase())
                          )
                          .map((region) => (
                            <label key={region.code} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 rounded p-1">
                              <input
                                type="checkbox"
                                checked={selectedRegions.includes(region.region)}
                                onChange={() => {
                                  if (selectedRegions.includes(region.region)) {
                                    handleRegionToggle(region.region);
                                  } else {
                                    handleRegionAdd(region.region);
                                  }
                                }}
                                className="w-4 h-4 text-orange-600 rounded"
                              />
                              <span className="text-gray-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="font-mono text-xs bg-gray-100 px-1 rounded">{region.code}</span>
                                {region.region}
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>

                    {/* Régions sélectionnées */}
                    {selectedRegions.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <span className="text-xs font-medium text-gray-700">Régions sélectionnées:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedRegions.map(region => {
                            const regionData = regionsFrance.find(r => r.region === region);
                            return (
                              <span 
                                key={region}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                                title={regionData ? `Code: ${regionData.code}` : ''}
                              >
                                {regionData && <span className="font-mono mr-1">{regionData.code}</span>}
                                {region}
                                <button
                                  onClick={() => handleRegionToggle(region)}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Listes Pronto */}
              {isContactPage && (
                <div className="mb-2 border-b border-gray-100 last:border-b-0">
                  <div className="py-2">
                    <h3 className="font-semibold text-gray-900 mb-3">Listes d'entreprises</h3>

                    {loadingProntoLists ? (
                      <div className="text-center py-4">
                        <span className="text-sm text-gray-500">Chargement des listes...</span>
                      </div>
                    ) : prontoLists.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 mb-2">
                          {prontoLists.length} liste(s) disponible(s)
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {prontoLists.map((list) => {
                            const isLoadingDetails = loadingListDetails.has(list.id);
                            const hasDetails = list.detailsLoaded;

                            return (
                              <button
                                key={list.id}
                                onClick={() => {
                                  setSelectedProntoList(list.id);
                                  setSelectedListForLinkedIn(list);
                                  setShowLinkedInModal(true);
                                  console.log('Liste sélectionnée pour LinkedIn Sales Navigator:', list);
                                }}
                                className={`w-full text-left p-2 rounded text-sm hover:bg-gray-50 transition-colors ${
                                  selectedProntoList === list.id
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : 'text-gray-700'
                                }`}
                              >
                                <div className="font-medium truncate flex items-center gap-2">
                                  {list.name || 'Untitled'}
                                  {isLoadingDetails && (
                                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {isLoadingDetails ? (
                                    <span className="text-gray-400">Chargement du nombre d'entreprises...</span>
                                  ) : hasDetails ? (
                                    <span>{list.companies_count} entreprise(s) • Type: {list.type}</span>
                                  ) : (
                                    <span>{list.companies_count || 0} entreprise(s) (estimation) • Type: {list.type}</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Créée le {new Date(list.created_at).toLocaleDateString("fr-FR")}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <span className="text-sm text-gray-500">Aucune liste disponible</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </MainSection>
            <MainSection title="Entreprise" id="entreprise">
              {/* Entreprise */}
              <div className={`mb-2 border-b border-gray-100 last:border-b-0 border-2 border-orange-500 rounded p-3` }>

                  <div className="pt-2 pb-4 space-y-4">
                    {/* Barre de recherche */}
                    <input
                      type="text"
                      placeholder="Rechercher une entreprise..."
                      value={companySearchTerm}
                      onChange={(e) => handleCompanySearch(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />

                    {/* Liste des entreprises */}
                    {loadingCompanies ? (
                      <div className="text-center py-4">
                        <span className="text-sm text-gray-500">Chargement des entreprises...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 mb-2">
                          {companyTotalResults > 0 ? `${companyTotalResults} entreprises trouvées` : 'Aucune entreprise trouvée'}
                        </div>
                        
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {companies.map((company) => (
                            <button
                              key={company.siren}
                              onClick={() => handleCompanySelect(company)}
                              className={`w-full text-left p-2 rounded text-sm hover:bg-gray-50 transition-colors ${
                                filters.selectedCompany === (company.nom_raison_sociale || company.nom_complet)
                                  ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                  : 'text-gray-700'
                              }`}
                            >
                              <div className="font-medium truncate">
                                {company.nom_raison_sociale || company.nom_complet}
                              </div>
                              {company.nom_raison_sociale && company.nom_raison_sociale !== company.nom_complet && (
                                <div className="text-xs text-gray-500 truncate">
                                  {company.nom_complet}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Pagination */}
                        {companyTotalPages > 1 && (
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <button
                              onClick={() => handleCompanyPageChange(companyCurrentPage - 1)}
                              disabled={companyCurrentPage <= 1}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                            >
                              Précédent
                            </button>
                            <span className="text-xs text-gray-600">
                              Page {companyCurrentPage} sur {companyTotalPages}
                            </span>
                            <button
                              onClick={() => handleCompanyPageChange(companyCurrentPage + 1)}
                              disabled={companyCurrentPage >= companyTotalPages}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                            >
                              Suivant
                            </button>
                          </div>
                        )}

                        {/* Entreprise sélectionnée */}
                        {filters.selectedCompany && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-1">Entreprise sélectionnée:</div>
                            <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                              <span className="text-sm text-orange-800 truncate flex-1">
                                {filters.selectedCompany}
                              </span>
                              <button
                                onClick={() => updateFilters({ selectedCompany: undefined })}
                                className="ml-2 text-orange-600 hover:text-orange-800 text-sm"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
              </div>

              {/* Liste */}
              <div className={`mb-2 border-b border-gray-100 last:border-b-0 border-2 border-orange-500 rounded p-3` }>
                <div className="pt-2 pb-4 space-y-4">
                  {/* Affichage de la liste sélectionnée */}
                  {selectedList && (
                    <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-orange-800">Liste active:</span>
                          <span className="text-xs text-orange-700 truncate">{selectedList.listName}</span>
                          <span className="text-xs text-orange-600">({selectedList.companyCount})</span>
                        </div>
                        <button
                          onClick={() => {
                            // Émettre un événement pour retirer le filtre de liste
                            window.dispatchEvent(new CustomEvent('removeListFilter'));
                          }}
                          className="text-orange-600 hover:text-orange-800 text-xs font-medium px-1 py-0.5 rounded hover:bg-orange-100 transition-colors"
                          title="Retirer ce filtre de liste"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-600 mb-2">
                    {loadingLists ? (
                      <span>Chargement des listes...</span>
                    ) : (
                      <span>{importedLists.length} liste(s) disponible(s)</span>
                    )}
                  </div>
                  
                  {loadingLists ? (
                    <div className="text-center py-4">
                      <span className="text-sm text-gray-500">Chargement des listes...</span>
                    </div>
                  ) : importedLists.length === 0 ? (
                    <div className="text-center py-4">
                      <span className="text-sm text-gray-500">Aucune liste disponible</span>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {importedLists.map((list) => (
                        <button
                          key={list.id}
                          onClick={async () => {
                            try {
                              // Récupérer les noms d'entreprises de la liste
                              const res = await axios.get(`/api/list/${list.id}/first-column`);
                              const companyNames = res.data;
                              console.log('Liste des noms d\'entreprises récupérée:', companyNames);
                              
                              // Émettre un événement avec les noms d'entreprises pour la recherche
                              window.dispatchEvent(new CustomEvent('searchByCompanyList', { 
                                detail: {
                                  listId: list.id,
                                  listName: list.nom,
                                  companyNames: companyNames
                                }
                              }));
                              
                              console.log('Événement searchByCompanyList émis avec:', {
                                listId: list.id,
                                listName: list.nom,
                                companyCount: companyNames.length
                              });
                            } catch (err) {
                              alert("Erreur lors de la récupération des noms d'entreprise !");
                              console.error(err);
                            }
                          }}
                          className={`w-full text-left p-2 rounded text-sm transition-colors ${
                            selectedList && selectedList.listId === list.id
                              ? 'bg-orange-100 text-orange-800 border border-orange-300'
                              : 'hover:bg-gray-50 text-gray-700 hover:text-orange-600'
                          }`}
                          title={`Cliquer pour utiliser la liste "${list.nom}" (${list.elements} entreprises)`}
                        >
                          <div className="font-medium truncate">
                            {list.nom}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {list.elements} entreprise(s) • {new Date(list.created_at).toLocaleDateString("fr-FR")}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </MainSection>
          </>
        )}
      </div>

      {(safeFilters.activities.length > 0 || safeFilters.cities.length > 0 || safeFilters.legalForms.length > 0 || safeFilters.roles.length > 0 || filters.selectedCompany || filters.selectedContact) && (
        <div className="p-4 bg-orange-50 border-t border-orange-200">
          <div className="text-sm font-medium text-orange-800 mb-2">Filtres actifs:</div>
          <div className="space-y-1 text-xs text-orange-700">
            {safeFilters.activities.length > 0 && <div>• {safeFilters.activities.length} activité(s)</div>}
            {safeFilters.cities.length > 0 && <div>• {safeFilters.cities.length} ville(s)</div>}
            {safeFilters.legalForms.length > 0 && <div>• {safeFilters.legalForms.length} forme(s) juridique(s)</div>}
            {safeFilters.roles.length > 0 && <div>• {safeFilters.roles.length} rôle(s)</div>}
            {filters.selectedCompany && <div>• Entreprise: {filters.selectedCompany}</div>}
            {filters.selectedContact && <div>• Entreprise (via contact): {filters.selectedContact}</div>}
          </div>
        </div>
      )}
      {/* Modal NAF Codes */}
      {nafModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-2xl max-h-[80vh] w-full max-w-xl mx-4 sm:mx-0 p-4 sm:p-8 relative flex flex-col">
                <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setNafModalOpen(false)}
              aria-label="Fermer"
                >
              ×
                </button>
            <h2 className="text-lg font-semibold mb-4 text-center">Codes NAF</h2>
            <div className="divide-y divide-gray-200 border rounded overflow-y-auto max-h-[60vh] bg-white">
              {Object.entries(nafCodes).map(([code, label], idx) => (
                <label
                  key={code}
                  className={`flex items-center space-x-2 text-sm px-2 py-2 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-orange-50 transition`}
                  style={{ cursor: 'pointer' }}
                >
                        <input
                          type="checkbox"
                    checked={selectedNafCodes.includes(code)}
                    onChange={() => handleNafCheckbox(code)}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                  <span className="font-mono text-gray-800 min-w-[5.5rem]">{code}</span>
                  <span className="text-gray-700 flex-1">{label as string}</span>
                      </label>
                    ))}
                  </div>
            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                onClick={() => setNafModalOpen(false)}
              >
                Fermer
              </button>
              </div>
      </div>
        </div>,
        document.body
      )}
      {/* Après le rendu du composant, restaure la position du scroll */}
      {useLayoutEffect(() => {
        if (legalFormListRef.current) {
          legalFormListRef.current.scrollTop = lastScrollTop.current;
        }
      })}
      {useLayoutEffect(() => {
        if (conventionListRef.current) {
          conventionListRef.current.scrollTop = lastConventionScrollTop.current;
        }
      })}

      {/* Modal LinkedIn Sales Navigator */}
      <LinkedInSalesModal
        isOpen={showLinkedInModal}
        onClose={() => {
          setShowLinkedInModal(false);
          setSelectedListForLinkedIn(null);
        }}
        selectedList={selectedListForLinkedIn}
      />
    </>
  );
};