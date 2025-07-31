// In filterUtils.ts
import { Business, FilterState } from '@entities/Business';
import { Contact } from '@entities/Contact';

export const filterBusinesses = (businesses: Business[], filters: FilterState): Business[] => {
  return businesses.filter(business => {
    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        business.name.toLowerCase().includes(searchLower) ||
        business.activity.toLowerCase().includes(searchLower) ||
        business.description.toLowerCase().includes(searchLower) ||
        business.city.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Activity filter
    if (filters.activities.length > 0) {
      const matchesActivity = filters.activities.some(activity =>
        business.activity.toLowerCase().includes(activity.toLowerCase())
      );
      if (!matchesActivity) return false;
    }

    // Employee count filter
    if (business.employeeCount !== undefined) {
      if (business.employeeCount < filters.employeeRange[0] || 
          business.employeeCount > filters.employeeRange[1]) {
        return false;
      }
    }

    // Revenue filter
    if (business.revenue !== undefined) {
      if (business.revenue < filters.revenueRange[0] || 
          business.revenue > filters.revenueRange[1]) {
        return false;
      }
    }

    // Age filter (company age)
    if (business.foundedYear !== undefined) {
      const currentYear = new Date().getFullYear();
      const companyAge = currentYear - business.foundedYear;
      if (companyAge < filters.ageRange[0] || companyAge > filters.ageRange[1]) {
        return false;
      }
    }

    // City filter
    if (filters.cities.length > 0) {
      if (!filters.cities.includes(business.city)) {
        return false;
      }
    }

    // Legal form filter
    if (filters.legalForms.length > 0) {
      if (!business.legalForm || !filters.legalForms.includes(business.legalForm)) {
        return false;
      }
    }

    // Rating filter
    if (business.rating !== undefined) {
      if (business.rating < filters.ratingRange[0] || 
          business.rating > filters.ratingRange[1]) {
        return false;
      }
    }

    // Role filter
    if (filters.roles.length > 0) {
      const contacts = (business as any).contacts || [];
      if (!contacts.some((contact: Contact) => filters.roles.includes(contact.role))) {
        return false;
      }
    }

    return true;
  });
};

export const filterContacts = (contacts: Contact[], filters: FilterState, businesses: Business[]): Contact[] => {
  return contacts.filter(contact => {
    const business = businesses.find(b => 
      b.name.toLowerCase() === contact.entreprise.toLowerCase()
    );

    // Role filter
    if (filters.roles.length > 0 && !filters.roles.includes(contact.role)) {
      return false;
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        contact.role.toLowerCase().includes(searchLower) ||
        contact.subrole.toLowerCase().includes(searchLower) ||
        contact.entreprise.toLowerCase().includes(searchLower) ||
        (business && (
          business.activity.toLowerCase().includes(searchLower) ||
          business.description.toLowerCase().includes(searchLower) ||
          business.city.toLowerCase().includes(searchLower)
        ));
      if (!matchesSearch) return false;
    }

    // Business-related filters (only applied if business exists)
    if (business) {
      if (filters.activities.length > 0) {
        const matchesActivity = filters.activities.some(activity =>
          business.activity.toLowerCase().includes(activity.toLowerCase())
        );
        if (!matchesActivity) return false;
      }
      if (business.employeeCount !== undefined) {
        if (business.employeeCount < filters.employeeRange[0] || 
            business.employeeCount > filters.employeeRange[1]) {
          return false;
        }
      }
      if (business.revenue !== undefined) {
        if (business.revenue < filters.revenueRange[0] || 
            business.revenue > filters.revenueRange[1]) {
          return false;
        }
      }
      if (business.foundedYear !== undefined) {
        const currentYear = new Date().getFullYear();
        const companyAge = currentYear - business.foundedYear;
        if (companyAge < filters.ageRange[0] || companyAge > filters.ageRange[1]) {
          return false;
        }
      }
      if (filters.cities.length > 0) {
        if (!filters.cities.includes(business.city)) {
          return false;
        }
      }
      if (filters.legalForms.length > 0) {
        if (!business.legalForm || !filters.legalForms.includes(business.legalForm)) {
          return false;
        }
      }
      if (business.rating !== undefined) {
        if (business.rating < filters.ratingRange[0] || 
            business.rating > filters.ratingRange[1]) {
          return false;
        }
      }
    }

    return true;
  });
};


export const getUniqueActivities = (businesses: Business[]): string[] => {
  return [...new Set(businesses.map(b => b.activity))].sort();
};

export const getUniqueCities = (businesses: Business[]): string[] => {
  return [...new Set(businesses.map(b => b.city))].sort();
};

export const getUniqueLegalForms = (businesses: Business[]): string[] => {
  return [...new Set(businesses.map(b => b.legalForm).filter((legalForm): legalForm is string => legalForm !== undefined))].sort();
};

export const getEmployeeRanges = (businesses: Business[]): [number, number] => {
  const counts = businesses
    .map(b => b.employeeCount)
    .filter((count): count is number => count !== undefined);
  
  if (counts.length === 0) return [0, 1000];
  
  return [Math.min(...counts), Math.max(...counts)];
};

export const getRevenueRanges = (businesses: Business[]): [number, number] => {
  const revenues = businesses
    .map(b => b.revenue)
    .filter((revenue): revenue is number => revenue !== undefined);
  
  if (revenues.length === 0) return [0, 1000000];
  
  return [Math.min(...revenues), Math.max(...revenues)];
};

export const getAgeRanges = (businesses: Business[]): [number, number] => {
  const currentYear = new Date().getFullYear();
  const ages = businesses
    .map(b => b.foundedYear ? currentYear - b.foundedYear : undefined)
    .filter((age): age is number => age !== undefined);
  
  if (ages.length === 0) return [0, 50];
  
  return [Math.min(...ages), Math.max(...ages)];
};