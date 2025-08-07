# Mapping des Données Entreprises vers Pronto

## Vue d'ensemble

Ce document explique comment les données des entreprises sélectionnées dans Prosperian sont mappées vers le format requis par l'API Pronto pour la création de listes.

## Flux de Données

### 1. Sélection des Entreprises
- **Source** : Checkboxes dans BusinessCard (mode liste)
- **Gestion** : `selectedIds` dans BusinessOptions
- **Type** : `EntrepriseApiResult[]` (données enrichies ou non)

### 2. Mapping vers Pronto
- **Utilitaire** : `prontoMapper.ts`
- **Fonction principale** : `convertSelectedBusinessesToProntoFormat()`
- **Type de sortie** : `ProntoCompany[]`

### 3. Envoi vers l'API
- **Service** : `ProntoService.createCompanyList()`
- **Nettoyage** : Suppression des valeurs null/undefined
- **Endpoint** : `POST /api/pronto/lists`

## Mapping des Champs

### Données Source (EntrepriseApiResult)

```typescript
interface EntrepriseApiResult {
  siren: string;
  nom_complet: string;
  nom_raison_sociale: string;
  siege: {
    adresse: string;
    code_postal: string;
    commune: string;
  };
  complements?: {
    web_info?: {
      website?: string;
    };
    website?: string;
  };
}
```

### Données Cible (ProntoCompany)

```typescript
interface ProntoCompany {
  name: string;
  country_code?: string | null;
  domain?: string | null;
  linkedin_url?: string | null;
}
```

## Règles de Mapping

### 1. Nom de l'Entreprise (`name`)
- **Source** : `nom_complet` (priorité) ou `nom_raison_sociale`
- **Requis** : ✅ Oui
- **Exemple** : `"PRONTO SAS"` → `"PRONTO SAS"`

### 2. Code Pays (`country_code`)
- **Source** : Dérivé de l'adresse ou défaut
- **Valeur par défaut** : `"FR"` (entreprises françaises)
- **Format** : ISO 3166-1 alpha-2
- **Exemple** : `"FR"`

### 3. Domaine (`domain`)
- **Source** : `complements.web_info.website` ou `complements.website`
- **Traitement** : Extraction du domaine depuis l'URL complète
- **Nettoyage** : Suppression de `www.` et du protocole
- **Exemples** :
  - `"https://www.prontohq.com/about"` → `"prontohq.com"`
  - `"www.google.com"` → `"google.com"`
  - `null` si aucun site web

### 4. URL LinkedIn (`linkedin_url`)
- **Source** : Générée à partir du nom de l'entreprise
- **Algorithme** : Conversion en slug LinkedIn
- **Format** : `https://www.linkedin.com/company/{slug}`
- **Exemples** :
  - `"PRONTO SAS"` → `"https://www.linkedin.com/company/pronto-sas"`
  - `"Google France"` → `"https://www.linkedin.com/company/google-france"`
  - `null` si le nom est trop court ou invalide

## Fonctions Utilitaires

### `extractDomain(url: string)`
Extrait le domaine d'une URL complète.

```typescript
extractDomain("https://www.prontohq.com/about") // → "prontohq.com"
extractDomain("www.google.com") // → "google.com"
extractDomain("invalid-url") // → undefined
```

### `extractCountryCode(entreprise: EntrepriseApiResult)`
Détermine le code pays de l'entreprise.

```typescript
// Pour l'instant, retourne toujours "FR" car les données viennent de l'API française
extractCountryCode(entreprise) // → "FR"
```

### `generateLinkedInUrl(companyName: string)`
Génère une URL LinkedIn potentielle.

```typescript
generateLinkedInUrl("PRONTO SAS") // → "https://www.linkedin.com/company/pronto-sas"
generateLinkedInUrl("A") // → undefined (trop court)
```

### `mapEntrepriseToProtoCompany(entreprise: EntrepriseApiResult)`
Mappe une entreprise vers le format Pronto.

```typescript
const entreprise = {
  nom_complet: "PRONTO SAS",
  complements: {
    web_info: { website: "https://prontohq.com" }
  }
};

mapEntrepriseToProtoCompany(entreprise)
// → {
//     name: "PRONTO SAS",
//     country_code: "FR",
//     domain: "prontohq.com",
//     linkedin_url: "https://www.linkedin.com/company/pronto-sas"
//   }
```

## Gestion des Valeurs Manquantes

### Stratégie
- **Champs requis** : Validation stricte (nom obligatoire)
- **Champs optionnels** : `null` si non disponible
- **Nettoyage** : Suppression des `null`/`undefined` avant envoi API

### Exemples

#### Entreprise avec toutes les données
```json
{
  "name": "PRONTO SAS",
  "country_code": "FR",
  "domain": "prontohq.com",
  "linkedin_url": "https://www.linkedin.com/company/pronto-sas"
}
```

#### Entreprise avec données minimales
```json
{
  "name": "ENTREPRISE SANS SITE",
  "country_code": "FR"
}
```

#### Après nettoyage pour l'API
```json
{
  "name": "ENTREPRISE SANS SITE",
  "country_code": "FR"
  // domain et linkedin_url omis car null
}
```

## Validation et Filtrage

### `validateProntoCompanies(companies: ProntoCompany[])`
Filtre les entreprises valides.

```typescript
const companies = [
  { name: "PRONTO SAS", country_code: "FR" },
  { name: "", country_code: "FR" }, // ❌ Nom vide
  { name: "   ", country_code: "FR" }, // ❌ Nom avec espaces seulement
  { name: "GOOGLE", country_code: "US" } // ✅ Valide
];

validateProntoCompanies(companies)
// → [
//     { name: "PRONTO SAS", country_code: "FR" },
//     { name: "GOOGLE", country_code: "US" }
//   ]
```

## Enrichissement des Données

### Fonction `enrichProntoCompany()`
Permet d'enrichir les données avec des informations supplémentaires.

```typescript
const baseCompany = {
  name: "PRONTO SAS",
  country_code: "FR",
  domain: null,
  linkedin_url: null
};

const enrichmentData = {
  website: "https://prontohq.com",
  linkedin_url: "https://www.linkedin.com/company/prontohq"
};

enrichProntoCompany(baseCompany, enrichmentData)
// → {
//     name: "PRONTO SAS",
//     country_code: "FR",
//     domain: "prontohq.com",
//     linkedin_url: "https://www.linkedin.com/company/prontohq"
//   }
```

## Logs et Debug

### Messages de Log
- `🔄 Conversion des entreprises sélectionnées` : Début du mapping
- `✅ Entreprises converties` : Fin du mapping avec compteur
- `📊 Détails des entreprises converties` : Données complètes
- `🚀 Envoi des données nettoyées` : Avant appel API

### Debug dans la Console
```javascript
// Voir les entreprises sélectionnées
console.log('Entreprises sélectionnées:', selectedBusinesses);

// Voir le mapping
console.log('Après mapping:', convertSelectedBusinessesToProntoFormat(selectedBusinesses));

// Voir les données envoyées à l'API
// (automatiquement loggé dans ProntoService.createCompanyList)
```

## Cas d'Usage

### 1. Entreprise Complète
```typescript
// Entrée
{
  nom_complet: "PRONTO SAS",
  complements: {
    web_info: { website: "https://prontohq.com" }
  }
}

// Sortie
{
  name: "PRONTO SAS",
  country_code: "FR",
  domain: "prontohq.com",
  linkedin_url: "https://www.linkedin.com/company/pronto-sas"
}
```

### 2. Entreprise Sans Site Web
```typescript
// Entrée
{
  nom_complet: "ENTREPRISE LOCALE SARL",
  complements: {}
}

// Sortie
{
  name: "ENTREPRISE LOCALE SARL",
  country_code: "FR",
  linkedin_url: "https://www.linkedin.com/company/entreprise-locale-sarl"
}
```

### 3. Entreprise avec Données Enrichies
```typescript
// Si des données d'enrichissement sont disponibles via d'autres services
// elles peuvent être intégrées via enrichProntoCompany()
```

## Évolutions Futures

### Améliorations Possibles
1. **Détection automatique du pays** via l'adresse
2. **Validation des URLs LinkedIn** existantes
3. **Cache des mappings** pour éviter les recalculs
4. **Intégration avec les services d'enrichissement** existants
5. **Support d'autres formats** d'entreprises

### Extensibilité
Le système est conçu pour être facilement extensible :
- Ajout de nouveaux champs dans `ProntoCompany`
- Nouvelles sources de données d'entreprise
- Algorithmes de mapping plus sophistiqués
