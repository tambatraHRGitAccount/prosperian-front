import { MockContacts } from "../entities/Contact"; // Ajuste le chemin selon ton projet
import { mockBusinesses } from "./mockBusinesses";

export const mockContacts: MockContacts = {
  contacts: [
    {
      ...{
        role: "Président du directoire",
        subrole: "",
        id: "1",
        contactsCount: 2555,
        revenue: 3000000000,
        postalCode: mockBusinesses[0].postalCode,
        city: mockBusinesses[0].city,
        entreprise: mockBusinesses[0].name,
        logo: mockBusinesses[0].logo,
        civilite: "Mme.",
        prenom: "Renée",
        nom: "Dupont",
        niveau: "Responsable",
        domaine: "Gestion de projet",
        email: "renee.dupont@email.com",
        linkedin: "https://linkedin.com/in/reneedupont",
        webmail: "Non",
        statut: "/ AcceptAll"
      }
    },
    {
      ...{
        role: "Mandataire / Direction Générale",
        subrole: "Président du conseil de surveillance | Directeur a...",
        id: "2",
        contactsCount: 2555,
        revenue: 3000000000,
        postalCode: mockBusinesses[1].postalCode,
        city: mockBusinesses[1].city,
        entreprise: mockBusinesses[1].name,
        logo: mockBusinesses[1].logo,
        civilite: "M.",
        prenom: "Jean",
        nom: "Martin",
        niveau: "Directeur",
        domaine: "Direction générale",
        email: "jean.martin@email.com",
        linkedin: "https://linkedin.com/in/jeanmartin",
        webmail: "Oui",
        statut: "Valid"
      }
    },
    {
      ...{
        role: "Directeur / Commerce",
        subrole: "Directeur régional des ventes",
        id: "3",
        contactsCount: 2555,
        revenue: 3000000000,
        postalCode: mockBusinesses[2].postalCode,
        city: mockBusinesses[2].city,
        entreprise: mockBusinesses[2].name,
        logo: mockBusinesses[2].logo,
        civilite: "Mme.",
        prenom: "Sophie",
        nom: "Lefevre",
        niveau: "Manager",
        domaine: "Commerce",
        email: "sophie.lefevre@email.com",
        linkedin: "https://linkedin.com/in/sophielefevre",
        webmail: "Non",
        statut: "AcceptAll"
      }
    },
    {
      ...{
        role: "Directeur / Commerce",
        subrole: "Directeur commercial",
        id: "4",
        contactsCount: 2555,
        revenue: 3000000000,
        postalCode: mockBusinesses[3].postalCode,
        city: mockBusinesses[3].city,
        entreprise: mockBusinesses[3].name,
        logo: mockBusinesses[3].logo,
        civilite: "M.",
        prenom: "Pierre",
        nom: "Durand",
        niveau: "Responsable",
        domaine: "Ventes",
        email: "pierre.durand@email.com",
        linkedin: "https://linkedin.com/in/pierredurand",
        webmail: "Oui",
        statut: "Valid"
      }
    },
    {
      ...{
        role: "Directeur",
        subrole: "Directeur de production",
        id: "5",
        contactsCount: 2555,
        revenue: 3000000000,
        postalCode: mockBusinesses[4].postalCode,
        city: mockBusinesses[4].city,
        entreprise: mockBusinesses[4].name,
        logo: mockBusinesses[4].logo,
        civilite: "Mme.",
        prenom: "Claire",
        nom: "Moreau",
        niveau: "Chef de service",
        domaine: "Production",
        email: "claire.moreau@email.com",
        linkedin: "https://linkedin.com/in/clairemoreau",
        webmail: "Non",
        statut: "AcceptAll"
      }
    },
  ],
  postes: [
    { label: "Direction G...", value: 1.5 },
    { label: "Commerce", value: 1 },
    { label: "Informatique", value: 0.4914 },
    { label: "Administration", value: 0.4382 },
    { label: "Ressources...", value: 0.3789 },
    { label: "Production", value: 0.3308 },
    { label: "Marketing", value: 0.3194 },
    { label: "Autre", value: 0.1729 },
    { label: "Achats", value: 0.1596 },
    { label: "Autre", value: 0.1586 },
  ],
  niveaux: [
    { label: "Collaborateur", value: 4.7 },
    { label: "Responsable", value: 3.0 },
  ],
  headerStats: {
    totalContacts: "11 658 710",
    totalEntreprises: "1 180 176",
    contactsDirects: {
      avecEmail: "6 284 828",
      avecLinkedIn: "11 329 086",
    },
    contactsGeneriques: {
      avecTelephone: "562 841",
    },
  },
};
