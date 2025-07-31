# Intégration du filtre Enseigne/Franchise avec Apify

## Vue d'ensemble

Ce document explique comment utiliser le nouveau filtre de recherche par enseigne/franchise intégré à l'application Prosperian. Ce filtre utilise l'API Apify Google Places Crawler pour rechercher des entreprises par nom d'enseigne ou de franchise.

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env.local` dans le dossier `prosperian-front` avec les variables suivantes :

```env
# Token API Apify (requis)
REACT_APP_APIFY_TOKEN=your_apify_api_token_here

# Mode développement (optionnel)
REACT_APP_APIFY_DEV_MODE=true
```

### 2. Obtenir le token API Apify

1. Allez sur [Apify Console](https://console.apify.com/)
2. Connectez-vous avec les identifiants fournis :
   - Email : `corenthin@buffard.net`
   - Mot de passe : `5b#TUGy77T_*p#x`
3. Allez dans **Account > Integrations** 
4. Créez un nouveau token API ou utilisez un token existant
5. Copiez le token dans votre fichier `.env.local`

## Utilisation

### Interface utilisateur

1. Allez dans la section **Recherche > Entreprises**
2. Dans le panneau de filtres, section **Entreprise > Activités**
3. Sélectionnez le type de recherche **"Enseigne/franchise"**
4. Vous verrez apparaître :
   - Un champ de saisie pour entrer une enseigne personnalisée
   - Des suggestions d'enseignes populaires (McDonald's, Carrefour, etc.)
   - La liste des enseignes sélectionnées

### Exemples d'enseignes pour tester

**Restauration :**
- McDonald's
- KFC
- Subway
- Pizza Hut
- Burger King

**Grande distribution :**
- Carrefour
- Leclerc
- Intermarché
- Auchan
- Casino

**Automobile :**
- Renault
- Peugeot
- Citroën
- Toyota
- BMW

**Bricolage :**
- Leroy Merlin
- Castorama
- Brico Dépôt

## Architecture technique

### Services

#### ApifyService (`src/services/apifyService.ts`)
- Gère les appels à l'API Apify
- Transforme les résultats au format de l'application
- Inclut une liste de franchises populaires françaises
- Mode de développement avec données de test

#### Intégration dans les filtres
- **FilterState** : Nouveau champ `enseignes: string[]`
- **FiltersPanel** : Interface utilisateur pour sélectionner les enseignes
- **fetchBusinesses** : Logique de recherche via Apify quand `activitySearchType === 'enseigne'`

### Flux de données

1. L'utilisateur sélectionne une ou plusieurs enseignes
2. Le filtre `activitySearchType` est défini sur `'enseigne'`
3. La fonction `fetchBusinesses` détecte le type de recherche
4. Pour chaque enseigne sélectionnée :
   - Appel à `apifyService.searchEnseigneSimplified()`
   - Transformation des résultats au format `EntrepriseApiResult`
   - Agrégation de tous les résultats
5. Affichage des résultats avec métadonnées spécifiques (source: 'apify_enseigne')

## Mode développement

En mode développement (`REACT_APP_APIFY_DEV_MODE=true`), le service utilise des données de test au lieu d'appeler l'API Apify réelle. Ceci permet de :
- Tester l'interface sans consommer de crédits API
- Développer sans dépendre de la connectivité réseau
- Valider le flux de données complet

## Données retournées

Chaque résultat d'enseigne inclut :
- **Informations de base** : Nom, adresse, téléphone, site web
- **Métadonnées Apify** : Place ID, rating, nombre d'avis
- **Géolocalisation** : Latitude, longitude si disponibles
- **Identification** : Nom de l'enseigne dans `complements.enseigne`

## Dépannage

### Erreurs courantes

1. **"Token API Apify non configuré"**
   - Vérifiez que `REACT_APP_APIFY_TOKEN` est défini
   - Redémarrez le serveur de développement après ajout de la variable

2. **"Timeout: Le run Apify a pris trop de temps"**
   - L'API Apify peut être lente (jusqu'à 60 secondes)
   - Vérifiez votre connexion réseau
   - Contactez le support Apify si le problème persiste

3. **Pas de résultats pour une enseigne**
   - Vérifiez l'orthographe de l'enseigne
   - Certaines enseignes peuvent ne pas être présentes dans la zone géographique
   - Essayez avec une enseigne populaire comme "McDonald's"

### Logs de débogage

Les logs suivants apparaissent dans la console :
- `🔍 Recherche via Apify pour enseignes: [...]`
- `✅ X entreprises trouvées via Apify pour les enseignes`

## Performance

- **Cache** : Les résultats ne sont pas mis en cache (à implémenter si nécessaire)
- **Pagination** : Les résultats Apify sont limités côté client
- **Limitations** : Respecter les limites de l'API Apify selon votre plan

## Prochaines améliorations

1. **Cache des résultats** pour éviter les appels répétés
2. **Géofiltrage avancé** par région/département
3. **Filtres spécifiques** par type d'enseigne (restauration, retail, etc.)
4. **Export des résultats** d'enseignes
5. **Analytics** sur les enseignes les plus recherchées 