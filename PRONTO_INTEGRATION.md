# Intégration API Pronto

Ce document décrit l'intégration de l'API Pronto dans l'application frontend pour afficher les données d'entreprises et de contacts.

## Architecture

### 1. Types et Interfaces

Les types TypeScript sont définis dans `src/entities/Business.ts` :

- `ProntoLead` : Structure d'un contact/lead
- `ProntoCompany` : Structure d'une entreprise
- `ProntoLeadWithCompany` : Combinaison lead + entreprise
- `ProntoSearch` : Structure d'une recherche
- `ProntoSearchResponse` : Réponse complète d'une recherche
- `BusinessWithProntoData` : Extension de Business avec données Pronto

### 2. Service API

Le service `ProntoService` (`src/services/prontoService.ts`) gère tous les appels API :

```typescript
// Récupérer toutes les recherches
ProntoService.getAllSearches()

// Récupérer les détails d'une recherche avec ses leads
ProntoService.getSearchWithLeads(searchId)

// Récupérer les leads d'une recherche avec pagination
ProntoService.getSearchLeads(searchId, page, limit)

// Workflow complet pour récupérer toutes les données
ProntoService.getAllSearchesComplete(includeLeads, leadsPerSearch)
```

### 3. Hook personnalisé

Le hook `useProntoData` (`src/hooks/useProntoData.ts`) gère l'état et la logique métier :

- État des recherches, leads, loading, erreurs
- Fonctions pour récupérer les données
- Gestion des erreurs

### 4. Composants

#### BusinessCard
Le composant `BusinessCard` a été modifié pour supporter les données Pronto :
- Nouveau prop `isProntoData` pour distinguer les sources
- Fonction `getCompanyData()` qui adapte les données selon le type
- Affichage conditionnel des icônes selon les données disponibles

#### Intégration directe dans BusinessCard
Le composant `BusinessCard` a été modifié pour supporter les données Pronto :
- Nouveau prop `isProntoData` pour distinguer les sources
- Fonction `getCompanyData()` qui adapte les données selon le type
- Affichage conditionnel des icônes selon les données disponibles
- Gestion automatique des objets d'adresse et de localisation

## Utilisation

### 1. Dans la page des entreprises

La page `src/pages/Recherche/Entreprises/index.tsx` a été modifiée pour utiliser exclusivement l'API Pronto :

- Chargement automatique des données Pronto au montage
- Affichage direct des entreprises sans toggle
- Intégration transparente avec le composant BusinessCard existant

### 2. Workflow d'utilisation

1. **Chargement automatique** : Les entreprises se chargent automatiquement au montage de la page
2. **Affichage direct** : Visualiser les entreprises dans le même format que les données locales
3. **Sélection multiple** : Utiliser les checkboxes pour sélectionner des éléments

## Endpoints API utilisés

### Backend (prosperian-back)

- `GET /api/pronto/searches` : Liste des recherches
- `GET /api/pronto/searches/{id}` : Détails d'une recherche
- `GET /api/pronto/searches/{id}/leads` : Leads d'une recherche
- `GET /api/pronto-workflows/all-searches-complete` : Workflow complet

### Structure des données

#### Réponse de `/api/pronto/searches`
```json
{
  "searches": [
    {
      "id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
      "name": "Nom de la recherche",
      "created_at": "2023-11-07T05:31:56Z"
    }
  ]
}
```

#### Réponse de `/api/pronto/searches/{id}`
```json
{
  "search": {
    "id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
    "name": "Nom de la recherche",
    "created_at": "2023-11-07T05:31:56Z"
  },
  "leads": [
    {
      "lead": {
        "first_name": "John",
        "last_name": "Doe",
        "full_name": "John Doe",
        "most_probable_email": "john.doe@company.com",
        "phones": ["+33123456789"],
        "title": "CEO",
        "linkedin_profile_url": "https://linkedin.com/in/johndoe",
        "profile_image_url": "https://example.com/photo.jpg"
      },
      "company": {
        "name": "Example Corp",
        "website": "https://example.com",
        "location": "Paris, France",
        "industry": "Technology",
        "description": "Description de l'entreprise",
        "employee_range": "10-50",
        "company_profile_picture": "https://example.com/logo.png"
      }
    }
  ]
}
```

## Configuration

### Alias TypeScript

Les alias suivants ont été ajoutés dans `tsconfig.app.json` :

```json
{
  "@services/*": ["src/services/*"],
  "@hooks/*": ["src/hooks/*"]
}
```

### Variables d'environnement

L'URL de base de l'API est configurée dans `ProntoService` :
```typescript
const API_BASE_URL = '/api/pronto';
```

## Gestion des erreurs

- Erreurs de réseau : Affichage d'un message d'erreur avec bouton de retry
- Erreurs d'API : Messages d'erreur spécifiques selon le type d'erreur
- États de chargement : Spinners et messages de chargement
- Données vides : Messages appropriés quand aucune donnée n'est trouvée

## Fonctionnalités

### Mode Liste (avec checkboxes)
- Affichage en lignes avec checkboxes
- Colonnes : Logo, Nom, Icônes, Contacts, Employés, CA, Adresse
- Sélection multiple pour export/actions en lot

### Mode Carte
- Affichage en grille de cartes
- Informations détaillées : Logo, nom, activité, adresse, téléphone, employés, CA
- Actions : Bouton "PRODUITS 2024 - 2025" et lien externe

### Icônes conditionnelles
Les icônes s'affichent uniquement si les données correspondantes sont disponibles :
- 🌐 Website
- 📞 Téléphone
- 📧 Email
- 💼 LinkedIn
- 👤 Google (placeholder)
- 📘 Facebook

## Tests

Pour tester l'intégration :

1. Démarrer le backend (prosperian-back)
2. Démarrer le frontend (prosperian-front)
3. Aller sur la page des entreprises
4. Utiliser le composant de test pour vérifier la connectivité
5. Basculer vers "Pronto API" et tester l'affichage des données

## Développement futur

- Pagination des résultats
- Filtres avancés sur les données Pronto
- Export des données sélectionnées
- Synchronisation en temps réel
- Cache des données pour améliorer les performances 