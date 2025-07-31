import React, { useState, useEffect, useRef } from "react";
import { Search, Building, MapPin, X } from "lucide-react";
import { ScrollableNav } from "@shared/components/Header/ScrollableNav";
import { searchService, SearchResult } from "@services/searchService";
import { useNavigate } from "react-router-dom";

export const SecondaryNav: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Gestion du clic en dehors pour fermer les résultats
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        console.log('🖱️ [SecondaryNav] Clic en dehors, fermeture des résultats');
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Recherche à chaque frappe
  useEffect(() => {
    console.log('🔄 [SecondaryNav] useEffect déclenché avec searchQuery:', searchQuery);
    console.log('🔄 [SecondaryNav] Longueur de searchQuery:', searchQuery?.length || 0);

    if (!searchQuery.trim()) {
      console.log('⚠️ [SecondaryNav] Requête vide, nettoyage des résultats');
      setSearchResults([]);
      setShowResults(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (searchQuery.trim().length < 3) {
      console.log('⚠️ [SecondaryNav] Requête trop courte (< 3 caractères)');
      setSearchResults([]);
      setShowResults(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    console.log('🚀 [SecondaryNav] Lancement de la recherche pour:', searchQuery);
    setIsLoading(true);
    setError(null);
    setShowResults(true); // Afficher le dropdown même pendant le chargement

    // Recherche directe sans debounce pour un feedback immédiat
    searchService.searchCompanies(searchQuery)
      .then((results) => {
        console.log('✅ [SecondaryNav] Résultats reçus:', results);
        setSearchResults(results.results);
        setShowResults(true);
        setIsLoading(false);
        setError(null);
      })
      .catch((error) => {
        console.error('❌ [SecondaryNav] Erreur lors de la recherche:', error);
        
        // Gestion spécifique de l'erreur de requête trop courte
        if (error.message === 'TROP_COURTE') {
          setError('TROP_COURTE');
        } else {
          setError(error.message);
        }
        
        setSearchResults([]);
        setShowResults(true); // Afficher le message d'erreur
        setIsLoading(false);
      });

  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('⌨️ [SecondaryNav] Changement de valeur:', newValue);
    setSearchQuery(newValue);
  };

  const handleResultClick = (result: SearchResult) => {
    console.log('🖱️ [SecondaryNav] Clic sur résultat:', result);
    // Navigation vers la page de détail de l'entreprise
    navigate(`/recherche/societes/${result.siren}`);
    setShowResults(false);
    setSearchQuery("");
  };

  const clearSearch = () => {
    console.log('🧹 [SecondaryNav] Nettoyage de la recherche');
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between space-y-3 lg:space-y-0 p-3 lg:p-1 bg-white border-b border-gray-200">
      <div className="mx-auto lg:mx-0 max-w-full">
        <ScrollableNav
          links={[
            { label: "Entreprises", href: "/recherche/entreprises" },
            { label: "Contacts", href: "/recherche/contact" },
            { label: "Listes", href: "/recherche/listes" },
            { label: "Exports", href: "/recherche/export" },
            { label: "Mes Recherches", href: "/recherche/mes-recherches" },
          ]}
        />
      </div>
      <div className="w-full lg:max-w-lg">
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Je recherche une entreprise, un dirigeant..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {/* Résultats de recherche */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-2">Recherche en cours...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-orange-600">
                  {error === 'TROP_COURTE' ? (
                    <>
                      <p className="font-medium">Requête trop courte</p>
                      <p className="text-sm mt-1">Veuillez saisir au moins 3 caractères pour rechercher</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-red-500">Erreur lors de la recherche</p>
                      <p className="text-sm mt-1 text-red-500">{error}</p>
                    </>
                  )}
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.siren}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <Building className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {result.nom_complet}
                          </h4>
                          {result.raison_sociale && result.raison_sociale !== result.nom_complet && (
                            <p className="text-xs text-gray-500 truncate">
                              {result.raison_sociale}
                            </p>
                          )}
                          <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                            {result.siege?.libelle_commune && (
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span>{result.siege.libelle_commune}</span>
                                {result.siege.code_postal && (
                                  <span className="ml-1">({result.siege.code_postal})</span>
                                )}
                              </div>
                            )}
                          </div>
                          {result.activite_principale && (
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {result.activite_principale}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 text-center text-xs text-gray-500 border-t border-gray-100">
                    {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                  </div>
                </div>
              ) : searchQuery.length >= 3 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="font-medium">Aucun résultat trouvé</p>
                  <p className="text-sm mt-1">Aucune entreprise trouvée pour "{searchQuery}"</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
