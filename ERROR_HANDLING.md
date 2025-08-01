# Gestion des erreurs 404 et redirections automatiques

## Vue d'ensemble

Ce projet implémente une gestion automatique des erreurs 404 NOT_FOUND avec redirection vers `https://prosperian-front.vercel.app`.

## Mécanismes de redirection

### 1. Intercepteur Axios global
- **Fichier** : `src/config/axios.ts`
- **Fonction** : Capture toutes les erreurs 404 des requêtes API
- **Action** : Redirection immédiate vers l'URL spécifiée

### 2. Route 404 React Router
- **Fichier** : `src/app/App.tsx`
- **Fonction** : Capture les routes non trouvées
- **Action** : Affichage d'un composant avec redirection automatique

### 3. Composant NotFound
- **Fichier** : `src/components/NotFound.tsx`
- **Fonction** : Interface utilisateur pendant la redirection
- **Action** : Redirection avec délai de 1 seconde

### 4. Utilitaires de redirection
- **Fichier** : `src/utils/redirectUtils.ts`
- **Fonction** : Fonctions centralisées pour les redirections
- **Actions** : Gestion des différents types de redirections

### 5. Hook personnalisé
- **Fichier** : `src/hooks/useErrorHandler.ts`
- **Fonction** : Gestion d'erreurs dans les composants
- **Actions** : Redirection conditionnelle selon le type d'erreur

## Configuration

### URL de redirection par défaut
```typescript
const DEFAULT_REDIRECT_URL = 'https://prosperian-front.vercel.app';
```

### Délai de redirection
- **Route 404** : 1 seconde
- **Erreur API** : Immédiat

## Utilisation

### Dans un composant
```typescript
import { useErrorHandler } from '@hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError } = useErrorHandler();
  
  const fetchData = async () => {
    try {
      // Votre code
    } catch (error) {
      handleError(error); // Gestion automatique des 404
    }
  };
};
```

### Redirection manuelle
```typescript
import { redirectToDefault, redirectWithDelay } from '@utils/redirectUtils';

// Redirection immédiate
redirectToDefault();

// Redirection avec délai
redirectWithDelay('https://prosperian-front.vercel.app', 2000);
```

## Logs et débogage

### Messages de console
- `🚨 Erreur 404 détectée, redirection...`
- `🔄 Redirection vers: https://prosperian-front.vercel.app`
- `🚨 Route 404 détectée, redirection vers...`

### Vérification
1. Ouvrir les outils de développement (F12)
2. Aller dans l'onglet Console
3. Rechercher les messages avec 🚨 et 🔄

## Personnalisation

### Changer l'URL de redirection
```typescript
// Dans src/utils/redirectUtils.ts
const DEFAULT_REDIRECT_URL = 'https://votre-nouvelle-url.com';
```

### Désactiver la redirection automatique
```typescript
const { handleError } = useErrorHandler({
  redirectOn404: false
});
```

### URL personnalisée pour un cas spécifique
```typescript
import { handle404Error } from '@utils/redirectUtils';

handle404Error(error, 'https://url-personnalisee.com');
```

## Gestion des autres erreurs

### Erreur 401 (Non autorisé)
- Suppression des tokens d'authentification
- Redirection vers `/login`

### Erreur 403 (Interdit)
- Log de l'erreur
- Pas de redirection automatique

### Erreur 500+ (Serveur)
- Log de l'erreur
- Pas de redirection automatique

## Tests

### Tester une erreur 404 API
1. Faire une requête vers un endpoint inexistant
2. Vérifier la redirection automatique

### Tester une route 404
1. Naviguer vers une URL inexistante
2. Vérifier l'affichage du composant NotFound
3. Vérifier la redirection après 1 seconde

### Tester la désactivation
1. Utiliser `redirectOn404: false`
2. Vérifier qu'aucune redirection ne se produit 