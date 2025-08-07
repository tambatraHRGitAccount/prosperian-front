# Création de Listes Pronto - Guide d'Utilisation

## Vue d'ensemble

La fonctionnalité de création de listes Pronto permet aux utilisateurs de créer des listes d'entreprises directement dans Pronto via l'interface Prosperian. Cette fonctionnalité remplace l'ancien bouton "Supprimer" par un nouveau bouton "Créer" dans les options d'entreprises.

## Fonctionnalités

### ✅ Nouveau Bouton "Créer"
- **Emplacement** : Dans la barre d'options des entreprises (BusinessOptions)
- **Apparence** : Bouton bleu avec icône Building
- **Action** : Ouvre un modal pour créer une liste Pronto

### ✅ Modal de Création
- **Formulaire complet** avec validation
- **Pré-remplissage** avec les entreprises sélectionnées
- **Gestion d'erreurs** intégrée
- **Interface responsive**

## Utilisation

### 1. Accès à la Fonctionnalité

1. Naviguez vers la page **Recherche > Entreprises**
2. Sélectionnez une ou plusieurs entreprises (optionnel)
3. Cliquez sur le bouton **"Créer"** (icône Building) dans la barre d'options

### 2. Remplissage du Formulaire

#### Champs Obligatoires
- **Nom de la liste** : Nom descriptif pour votre liste Pronto
- **Au moins une entreprise** : Minimum requis pour créer la liste

#### Champs Optionnels
- **URL de webhook** : Pour recevoir des notifications
- **Informations d'entreprise** :
  - Code pays (ex: FR, US)
  - Domaine (ex: example.com)
  - URL LinkedIn

### 3. Gestion des Entreprises

#### Entreprises Pré-remplies
Si vous avez sélectionné des entreprises avant d'ouvrir le modal, elles seront automatiquement ajoutées avec :
- Nom de l'entreprise
- Code pays (FR par défaut)
- Domaine (si disponible)
- URL LinkedIn (si disponible)

#### Ajouter des Entreprises
- Cliquez sur **"Ajouter"** pour ajouter une nouvelle entreprise
- Remplissez au minimum le nom de l'entreprise
- Les autres champs sont optionnels

#### Supprimer des Entreprises
- Cliquez sur l'icône **poubelle** à côté de l'entreprise à supprimer

### 4. Validation et Soumission

#### Validation Automatique
- Nom de liste requis
- Au moins une entreprise requise
- Nom d'entreprise requis pour chaque entreprise

#### Soumission
- Cliquez sur **"Créer la liste"**
- Un indicateur de chargement s'affiche pendant la création
- Un message de succès confirme la création

## Structure des Données

### Données Envoyées à l'API

```json
{
  "name": "Ma liste d'entreprises",
  "webhook_url": "https://webhook.example.com",
  "companies": [
    {
      "name": "Pronto",
      "country_code": "FR",
      "domain": "prontohq.com",
      "linkedin_url": "https://www.linkedin.com/company/prontohq"
    },
    {
      "name": "Google",
      "country_code": "US",
      "domain": "google.com",
      "linkedin_url": "https://www.linkedin.com/company/google"
    }
  ]
}
```

### Réponse de l'API

```json
{
  "success": true,
  "list": {
    "id": "df62412c-55a6-4fe2-af91-0b74b9e0f454",
    "name": "Ma liste d'entreprises",
    "webhook_url": "https://webhook.example.com",
    "companies_count": 2,
    "companies": [...],
    "created_at": "2025-08-06T21:06:07.918Z",
    "pronto_response": {
      "id": "df62412c-55a6-4fe2-af91-0b74b9e0f454",
      "linkedin_id": "7358966630862757888",
      "type": "companies"
    }
  },
  "message": "Liste \"Ma liste d'entreprises\" créée avec succès avec 2 entreprise(s)"
}
```

## Gestion d'Erreurs

### Erreurs de Validation
- **Nom manquant** : "Le nom de la liste est requis"
- **Aucune entreprise** : "Au moins une entreprise est requise"
- **Nom d'entreprise manquant** : "Toutes les entreprises doivent avoir un nom"

### Erreurs API
- **Erreur 400** : Paramètres invalides
- **Erreur 401** : Clé API invalide
- **Erreur 429** : Limite de taux dépassée
- **Erreur 500** : Erreur serveur

### Affichage des Erreurs
- Messages d'erreur affichés en rouge dans le modal
- Détails spécifiques selon le type d'erreur
- Possibilité de corriger et réessayer

## Architecture Technique

### Composants

#### `ProntoListModal.tsx`
- Modal principal pour la création de listes
- Gestion du formulaire et validation
- Interface responsive avec scroll

#### `BusinessOptions.tsx` (Modifié)
- Remplacement du bouton "Supprimer" par "Créer"
- Intégration du modal Pronto
- Gestion des entreprises sélectionnées

### Services

#### `ProntoService.ts` (Étendu)
- Nouvelle méthode `createCompanyList()`
- Nouvelle méthode `getServiceStatus()`
- Types TypeScript pour les requêtes/réponses

#### Configuration API
- Nouveaux endpoints dans `api.ts`
- Support pour `/api/pronto/lists` et `/api/pronto/status`

## Exemples d'Utilisation

### Cas d'Usage 1 : Création Simple
1. Cliquer sur "Créer"
2. Saisir "Prospects Tech Paris"
3. Ajouter une entreprise "Pronto"
4. Cliquer sur "Créer la liste"

### Cas d'Usage 2 : Avec Sélection Préalable
1. Sélectionner 5 entreprises dans la liste
2. Cliquer sur "Créer"
3. Les entreprises sont pré-remplies
4. Ajuster les informations si nécessaire
5. Créer la liste

### Cas d'Usage 3 : Avec Webhook
1. Créer une liste comme ci-dessus
2. Ajouter une URL de webhook
3. Recevoir des notifications sur les changements

## Bonnes Pratiques

### Nommage des Listes
- Utilisez des noms descriptifs
- Incluez la date ou le contexte
- Exemples : "Prospects Q1 2025", "Clients Tech France"

### Gestion des Entreprises
- Vérifiez les domaines pour éviter les doublons
- Utilisez les codes pays standards (ISO 3166-1)
- Validez les URLs LinkedIn

### Webhooks
- Utilisez HTTPS pour les URLs de webhook
- Implémentez une gestion d'erreurs robuste
- Testez les webhooks avant utilisation

## Dépannage

### Problèmes Courants

#### Le bouton "Créer" n'apparaît pas
- Vérifiez que le composant BusinessOptions est bien importé
- Vérifiez les permissions utilisateur

#### Erreur lors de la création
- Vérifiez la connexion réseau
- Consultez les logs du navigateur (F12)
- Vérifiez le statut de l'API via `/api/pronto/status`

#### Entreprises non pré-remplies
- Vérifiez que des entreprises sont sélectionnées
- Vérifiez la structure des données d'entreprise

### Logs et Debug
- Ouvrez la console développeur (F12)
- Recherchez les messages préfixés par "✅" ou "❌"
- Vérifiez les appels réseau dans l'onglet Network

## Support

Pour toute question ou problème :
1. Consultez les logs de la console
2. Vérifiez le statut de l'API Pronto
3. Consultez la documentation Swagger à `/api-docs`
