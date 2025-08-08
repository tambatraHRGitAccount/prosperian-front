# Test d'Intégration Pronto - Guide de Test

## 🎯 Fonctionnalités Implémentées

### ✅ Formulaire de Recherche Pronto
- **Localisation** : Dans le FilterPanel de la page `/recherche/contact`
- **Champs disponibles** :
  - Job Titles (texte libre)
  - Company Size (sélection multiple)
  - Lead Location (texte libre)
  - Company Location (texte libre)
  - Industries (texte libre)
- **Bouton** : "Find personas" (bleu)

### ✅ Panneau de Résultats
- **Localisation** : Barre verticale à gauche avec z-index élevé
- **Largeur** : 400px
- **Animation** : Slide depuis la gauche
- **Contenu** :
  - Header avec "Results" et bouton "Save Persona"
  - Nombre de résultats trouvés
  - Bouton "See in LinkedIn"
  - Liste des leads avec photos de profil
  - Informations détaillées par lead
  - Résumé des filtres appliqués

### ✅ Communication
- **Méthode** : Événements personnalisés (CustomEvents)
- **Événements** :
  - `prontoSearchResults` : Transmet les résultats
  - `prontoLoading` : Transmet l'état de chargement

## 🧪 Comment Tester

### 1. Démarrer le Backend
```bash
cd prosperian-back
npm start
# Le serveur doit être accessible sur http://localhost:4000
```

### 2. Démarrer le Frontend
```bash
cd prosperian-front
npm start
# L'application doit être accessible sur http://localhost:3000
```

### 3. Naviguer vers la Page Contact
- Aller sur `http://localhost:3000/recherche/contact`
- Vérifier que le FilterPanel est visible à droite
- Vérifier que le formulaire Pronto est présent en haut du FilterPanel

### 4. Tester le Formulaire
1. **Remplir les champs** :
   - Job Titles : `Marketing Director, CEO, CTO`
   - Company Size : Sélectionner `51-200` et `201-500`
   - Lead Location : `Paris, London, New York`
   - Company Location : `France, UK, USA`
   - Industries : `Technology, Software, SaaS`

2. **Cliquer sur "Find personas"**
   - Vérifier que l'état de chargement s'affiche
   - Vérifier que la barre de résultats apparaît à gauche

### 5. Vérifier les Résultats
1. **Panneau de résultats** :
   - Doit s'afficher à gauche avec animation
   - Header avec nombre de résultats
   - Liste des leads avec photos
   - Informations détaillées

2. **Données affichées** :
   - Nom du lead
   - Titre/poste
   - Entreprise
   - Localisation
   - Photo de profil (si disponible)
   - Bouton LinkedIn

3. **Filtres appliqués** :
   - Résumé en bas du panneau
   - Affichage des filtres utilisés

### 6. Tester les Interactions
1. **Bouton LinkedIn** : Doit ouvrir le profil dans un nouvel onglet
2. **Bouton de fermeture (X)** : Doit fermer le panneau
3. **Bouton "Save Persona"** : Préparé pour future implémentation
4. **Bouton "See in LinkedIn"** : Préparé pour future implémentation

## 🔍 Points de Vérification

### Console du Navigateur
Vérifier les logs suivants :
```
🔍 Recherche avec filtres: {...}
✅ Résultats reçus: {...}
📊 Résultats Pronto reçus via événement: {...}
⏳ État de chargement Pronto: true/false
```

### Réseau (Network Tab)
Vérifier l'appel API :
```
GET /api/pronto/workflow/global-results?title_filter=...&employee_range_filter=...
```

### Structure des Données
Les résultats doivent contenir :
```json
{
  "success": true,
  "total_leads": 1250,
  "filtered_leads": 45,
  "leads": [
    {
      "id": "...",
      "name": "John Doe",
      "title": "Marketing Director",
      "profile_image_url": "...",
      "linkedin_url": "...",
      "company": {
        "name": "Example Corp",
        "location": "Paris, France"
      }
    }
  ],
  "applied_filters": {
    "titles": ["marketing director", "ceo", "cto"],
    "employee_ranges": ["51-200", "201-500"]
  }
}
```

## 🐛 Dépannage

### Problème : Formulaire non visible
- Vérifier que vous êtes sur `/recherche/contact`
- Vérifier que le FilterPanel est ouvert
- Vérifier les imports dans `FiltersPanel.tsx`

### Problème : Pas de résultats
- Vérifier que le backend est démarré
- Vérifier l'URL de l'API dans `prontoService.ts`
- Vérifier les logs de la console

### Problème : Panneau ne s'affiche pas
- Vérifier les événements dans la console
- Vérifier que `ProntoResultsPanel` est bien importé
- Vérifier les écouteurs d'événements

### Problème : Erreur de compilation
- Vérifier les imports TypeScript
- Vérifier que tous les composants sont exportés
- Relancer `npm start`

## 📝 Notes Techniques

### Architecture
- **Service** : `prontoService.ts` - Gestion des appels API
- **Formulaire** : `ProntoSearchForm.tsx` - Interface de recherche
- **Résultats** : `ProntoResultsPanel.tsx` - Affichage des résultats
- **Communication** : Événements personnalisés via `window.dispatchEvent`

### Styles
- **Formulaire** : Intégré dans le FilterPanel existant
- **Panneau** : Position fixe, z-index 50, largeur 400px
- **Animation** : Transition CSS `translate-x`

### API
- **Endpoint** : `/api/pronto/workflow/global-results`
- **Méthode** : GET avec paramètres de requête
- **Filtres** : Tous optionnels, mode ET (AND)

## 🚀 Prochaines Étapes

1. **Implémentation "Save Persona"** : Sauvegarder les résultats
2. **Intégration LinkedIn** : Bouton "See in LinkedIn" fonctionnel
3. **Pagination** : Gérer plus de résultats
4. **Filtres avancés** : Ajouter plus d'options de filtrage
5. **Cache** : Mettre en cache les résultats de recherche
