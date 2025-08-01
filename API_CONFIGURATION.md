# Configuration API

## Variables d'environnement

Créez un fichier `.env` dans le dossier `prosperian-front` avec les variables suivantes :

```env
# Configuration API
VITE_API_BASE_URL=https://prosperiantest1.onrender.com

# En production, changez cette URL vers votre serveur
# VITE_API_BASE_URL=https://api.votre-domaine.com
```

## Configuration du proxy Vite

En développement, Vite utilise un proxy pour rediriger les requêtes `/api` vers le backend :

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'https://prosperiantest1.onrender.com',
      changeOrigin: true,
      secure: false,
    },
  },
},
```

## Structure des endpoints

### Pronto API
- `GET /api/pronto/searches` - Liste des recherches
- `GET /api/pronto/searches/{id}` - Détails d'une recherche
- `GET /api/pronto/searches/{id}/leads` - Leads d'une recherche
- `GET /api/pronto-workflows/all-searches-complete` - Workflow complet

### Autres endpoints
- `GET /graphql` - GraphQL endpoint
- `GET /api-docs` - Documentation Swagger

## Utilisation

Le service `ProntoService` utilise automatiquement la bonne URL selon l'environnement :

- **Développement** : Utilise le proxy Vite (`/api/pronto`)
- **Production** : Utilise l'URL complète (`${VITE_API_BASE_URL}/api/pronto`)

## Dépannage

### Erreur "Unexpected token '<'"
Cette erreur indique que l'API retourne du HTML au lieu de JSON. Vérifiez :
1. Le backend est-il démarré sur le bon port ?
2. L'URL de l'API est-elle correcte ?
3. L'endpoint existe-t-il ?

### Erreur CORS
En développement, le proxy Vite évite les problèmes CORS. En production, configurez CORS sur le backend.

### Erreur de connexion
Vérifiez que le backend est accessible à l'URL configurée. 