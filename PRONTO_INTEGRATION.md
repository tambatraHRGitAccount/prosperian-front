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

#### ✅ Endpoints Disponibles
- `GET /api/pronto/searches` : Liste des recherches disponibles
- `POST /api/pronto/lists` : Création de listes d'entreprises
- `GET /api/pronto/status` : Statut des services Pronto
- `GET /api/pronto-workflows/diagnostic` : Diagnostic complet

#### ⚠️ Endpoints Indisponibles (API Pronto modifiée)
- `POST /api/pronto/search-leads` : Recherche de leads (503)
- `POST /api/pronto/search-leads-from-company` : Leads par entreprise (503)
- `POST /api/pronto/leads/extract` : Extraction de leads (503)
- `GET /api/pronto/searches/{id}/leads` : Leads d'une recherche (404)
- `GET /api/pronto-workflows/all-searches-complete` : Workflow complet (404)

### Structure des données

#### Réponse de `/api/pronto/searches` ✅
```json
{
  "success": true,
  "searches": [
    {
      "id": "39775257-9a6f-433a-ac2c-2cd3a39605a0",
      "name": "[Atlas Digital] Resp. Marketing - 1 / 50",
      "leads_count": 12,
      "created_at": "2025-08-06T14:59:33.284Z",
      "access_url": "/api/pronto-workflows/search-leads/39775257-9a6f-433a-ac2c-2cd3a39605a0"
    }
  ],
  "total": 22,
  "message": "22 recherches disponibles"
}
```

#### Réponse de `/api/pronto/lists` ✅ (Nouveau)
```json
{
  "success": true,
  "list": {
    "id": "df62412c-55a6-4fe2-af91-0b74b9e0f454",
    "name": "Ma liste d'entreprises",
    "webhook_url": "https://webhook.example.com",
    "companies_count": 2,
    "companies": [
      {
        "name": "Pronto",
        "country_code": "FR",
        "domain": "prontohq.com",
        "linkedin_url": "https://www.linkedin.com/company/prontohq"
      }
    ],
    "created_at": "2025-08-06T21:06:07.918Z",
    "pronto_response": {
      "id": "df62412c-55a6-4fe2-af91-0b74b9e0f454",
      "linkedin_id": "7358966630862757888",
      "type": "companies"
    }
  },
  "message": "Liste créée avec succès avec 2 entreprise(s)"
}
```

#### Réponse de `/api/pronto/status` ✅ (Nouveau)
```json
{
  "success": true,
  "status": {
    "timestamp": "2025-08-06T21:08:13.856Z",
    "services": {
      "authentication": { "available": true, "message": "Authentification réussie" },
      "searches": { "available": true, "message": "Endpoint /searches disponible" },
      "lists_creation": { "available": true, "message": "Endpoint /lists disponible" },
      "leads_extraction": { "available": false, "message": "Endpoints d'extraction directe indisponibles" }
    },
    "available_endpoints": ["GET /api/pronto/searches", "POST /api/pronto/lists"],
    "unavailable_endpoints": ["POST /api/pronto/search-leads", "POST /api/pronto/leads/extract"]
  }
}
```

#### ⚠️ Endpoints Indisponibles - Exemples de Réponses d'Erreur

##### Réponse de `/api/pronto/search-leads` (503)
```json
{
  "success": false,
  "error": "Service de recherche directe temporairement indisponible",
  "message": "L'API Pronto a modifié ses endpoints. Veuillez utiliser les recherches existantes.",
  "alternative": {
    "description": "Recherches existantes qui pourraient vous intéresser",
    "searches": [],
    "total_available_searches": 22
  },
  "suggestions": [
    "Utilisez l'endpoint /api/pronto/searches pour voir les recherches existantes",
    "Consultez /api/pronto/status pour voir l'état des services"
  ]
}
```

##### Réponse de `/api/pronto/leads/extract` (503)
```json
{
  "success": false,
  "error": "Service d'extraction de leads temporairement indisponible",
  "message": "L'API Pronto a modifié ses endpoints. Cette fonctionnalité n'est plus disponible.",
  "request_details": {
    "query": "software engineers",
    "filters": { "job_title": "Software Engineer", "location": "Paris, France" },
    "limit": 10
  },
  "alternative": {
    "description": "Alternatives disponibles",
    "suggestions": [
      "Utilisez l'endpoint /api/pronto/searches pour voir les recherches existantes",
      "Consultez /api/pronto/status pour voir l'état des services"
    ],
    "note": "Tous les endpoints d'extraction directe de leads sont actuellement indisponibles"
  }
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

## 🚨 Changements Récents (2025-08-06)

### Endpoints Modifiés par l'API Pronto

L'API Pronto a subi des modifications importantes qui affectent plusieurs endpoints :

#### ❌ Endpoints Supprimés
- `/extract/leads/search` - Recherche directe de leads
- `/leads/extract` - Extraction de leads avec filtres
- `/extract/leads/from_company` - Leads par entreprise
- `/searches/{id}/leads` - Leads d'une recherche spécifique

#### ✅ Nouveaux Endpoints Disponibles
- `POST /api/pronto/lists` - Création de listes d'entreprises
- `GET /api/pronto/status` - Monitoring des services

### Migration Nécessaire

#### 1. Service ProntoService
Le service doit être mis à jour pour :
- Supprimer les appels aux endpoints indisponibles
- Ajouter la gestion des nouveaux endpoints
- Implémenter la gestion d'erreurs pour les services indisponibles

```typescript
// ❌ À supprimer
static async getSearchLeads(searchId: string) {
  // Cet endpoint ne fonctionne plus
}

// ✅ À ajouter
static async createCompanyList(name: string, companies: Company[]) {
  const response = await fetch('/api/pronto/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, companies })
  });
  return response.json();
}

static async getServiceStatus() {
  const response = await fetch('/api/pronto/status');
  return response.json();
}
```

#### 2. Composants Frontend
- Mettre à jour les composants qui utilisent les endpoints supprimés
- Ajouter des messages d'erreur informatifs
- Implémenter des alternatives pour les fonctionnalités indisponibles

#### 3. Gestion d'Erreurs
Ajouter la gestion des erreurs 503 (Service Unavailable) :

```typescript
try {
  const data = await ProntoService.getSearchLeads(searchId);
} catch (error) {
  if (error.status === 503) {
    // Afficher un message d'indisponibilité avec alternatives
    showServiceUnavailableMessage(error.alternatives);
  }
}
```

## Développement futur

### Priorités Immédiates
- ✅ Migration vers les nouveaux endpoints disponibles
- ✅ Implémentation de la création de listes d'entreprises
- ⚠️ Remplacement des fonctionnalités d'extraction de leads

### Fonctionnalités à Développer
- Interface pour créer des listes d'entreprises
- Monitoring en temps réel du statut des services
- Cache des recherches existantes
- Export des données disponibles
- Système de notification pour les changements d'API

### Fonctionnalités Suspendues
- Pagination des leads (endpoint indisponible)
- Filtres avancés sur l'extraction (endpoint indisponible)
- Recherche directe de leads (endpoint indisponible)