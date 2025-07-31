// Utilitaires pour calculer les statistiques des éléments sélectionnés

import { Business } from "@entities/Business";
import { Contact } from "@entities/Contact";

export interface SelectedContactStats {
  total: number;
  entreprises: number;
  contactsDirectEmail: number;
  contactsDirectLinkedin: number;
  contactsGeneriquesTel: number;
}

export interface SelectedEntrepriseStats {
  total: number;
}

// Calculer les stats des contacts sélectionnés
export const calculateSelectedContactStats = (
  selectedContacts: Set<number>,
  filteredContacts: Contact[]
): SelectedContactStats => {
  const selectedContactList = Array.from(selectedContacts).map(index => filteredContacts[index]);
  
  // Compter les entreprises uniques
  const uniqueEntreprises = new Set(selectedContactList.map(contact => contact.entreprise));
  
  // Estimation des contacts directs avec email (60% des contacts sélectionnés)
  const contactsDirectEmail = Math.round(selectedContactList.length * 0.6);
  
  // Estimation des contacts directs avec LinkedIn (80% des contacts sélectionnés)
  const contactsDirectLinkedin = Math.round(selectedContactList.length * 0.8);
  
  // Estimation des contacts génériques avec téléphone (20% des contacts sélectionnés)
  const contactsGeneriquesTel = Math.round(selectedContactList.length * 0.2);
  
  return {
    total: selectedContactList.length,
    entreprises: uniqueEntreprises.size,
    contactsDirectEmail,
    contactsDirectLinkedin,
    contactsGeneriquesTel,
  };
};

// Calculer les stats des entreprises sélectionnées
export const calculateSelectedEntrepriseStats = (
  selectedBusinesses: Set<number>,
  businesses: Business[]
): SelectedEntrepriseStats => {
  return {
    total: selectedBusinesses.size,
  };
}; 