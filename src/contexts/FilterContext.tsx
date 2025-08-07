import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { mockBusinesses } from '@data/mockBusinesses';
import { mockContacts } from '@data/mockContacts';
import type { FilterState } from '@entities/Business';
import {
  filterBusinesses,
  filterContacts,
  getUniqueActivities,
  getUniqueCities,
  getUniqueLegalForms,
  getEmployeeRanges,
  getRevenueRanges,
  getAgeRanges,
} from '@shared/utils/filterUtils';
import francePostalCodes from '@data/france_postal_codes.json';

interface FilterContextType {
  filters: FilterState;
  availableCities: string[];
  availableLegalForms: string[];
  availableRoles: string[];
  employeeRange: [number, number];
  revenueRange: [number, number];
  ageRange: [number, number];
  filteredBusinesses: typeof mockBusinesses;
  filteredContacts: any[];
  headerStats: typeof mockContacts.headerStats;
  postes: typeof mockContacts.postes;
  niveaux: typeof mockContacts.niveaux;
  setFilters: (f: FilterState) => void;
  updateFilters: (f: FilterState) => void;
  handleSearchChange: (term: string) => void;
  setSort: (sortBy: string) => void;
  setFilteredContacts: (contacts: any[]) => void; // New function to update filteredContacts
}

const defaultFilters: FilterState = {
  searchTerm: '',
  activities: [],
  employeeRange: [0, 5000],
  revenueRange: [0, 1000000],
  ageRange: [0, 50],
  cities: [],
  legalForms: [],
  ratingRange: [0, 5],
  roles: [],
  sortBy: 'Pertinence',
  googleActivities: [],
  semanticTerms: [],
  enseignes: [],
  sectors: [],
  sectorNafCodes: [],
  departments: [],
  departmentCodes: [],
  activitySearchType: 'naf'
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]); // Manage state separately

  // Remplacer availableCities par les villes uniques du fichier postal
  const availableCities = useMemo(() => {
    // On extrait tous les titres uniques
    const citySet = new Set(francePostalCodes.map((entry: { titre: string }) => entry.titre));
    return Array.from(citySet).sort((a, b) => a.localeCompare(b, 'fr'));
  }, []);
  const availableLegalForms = useMemo(() => getUniqueLegalForms(mockBusinesses), []);
  const availableRoles = useMemo(() => {
    return Array.from(new Set(mockContacts.contacts.map((contact) => contact.role)));
  }, []);
  const employeeRange = useMemo(() => getEmployeeRanges(mockBusinesses), []);
  const revenueRange = useMemo(() => getRevenueRanges(mockBusinesses), []);
  const ageRange = useMemo(() => getAgeRanges(mockBusinesses), []);

  // Sync initial ranges into filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, employeeRange, revenueRange, ageRange }));
  }, [employeeRange, revenueRange, ageRange]);

  const filteredBusinesses = useMemo(() => {
    const businessesWithContacts = mockBusinesses.map(business => ({
      ...business,
      contacts: mockContacts.contacts.filter(contact => 
        contact.entreprise.toLowerCase() === business.name.toLowerCase()
      ),
    }));
    return filterBusinesses(businessesWithContacts, filters);
  }, [filters]);

  // Initial filteredContacts based on filters
  useEffect(() => {
    const contacts = filterContacts(mockContacts.contacts, filters, mockBusinesses);
    setFilteredContacts([...contacts].sort((a, b) => {
      switch (filters.sortBy) {
        case 'Role':
          return a.role.localeCompare(b.role);
        case 'Entreprise':
          return a.entreprise.localeCompare(b.entreprise);
        case 'Pertinence':
        default:
          return b.role.length - a.role.length;
      }
    }));
  }, [filters]);

  const setSort = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const handleSearchChange = (searchTerm: string) => {
    console.log('🔍 [CONTEXTE] handleSearchChange appelé avec:', searchTerm);
    setFilters(prev => ({ ...prev, searchTerm }));
  };

  const updateFilters = (f: FilterState) => {
    console.log('🔍 [CONTEXTE] updateFilters appelé avec:', f);
    console.log('🔍 [CONTEXTE] Anciens filtres:', filters);
    console.log('🔍 [CONTEXTE] Nouveaux filtres:', f);
    setFilters(f);
    console.log('🔍 [CONTEXTE] updateFilters terminé');
  };

  return (
    <FilterContext.Provider
      value={{
        filters,
        availableCities,
        availableLegalForms,
        availableRoles,
        employeeRange,
        revenueRange,
        ageRange,
        filteredBusinesses,
        filteredContacts,
        headerStats: mockContacts.headerStats,
        postes: mockContacts.postes,
        niveaux: mockContacts.niveaux,
        setFilters,
        updateFilters,
        handleSearchChange,
        setSort,
        setFilteredContacts, // Expose the new setter
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export function useFilterContext() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilterContext must be used within a FilterProvider');
  return ctx;
}