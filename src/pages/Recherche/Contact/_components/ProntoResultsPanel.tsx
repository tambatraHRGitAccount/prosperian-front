import React, { useState } from 'react';
import { X, ExternalLink, User, Save } from 'lucide-react';
import { ProntoGlobalResponse, ProntoLead } from '@services/prontoService';
import { ListService } from '@services/listService';

interface ProntoResultsPanelProps {
  results: ProntoGlobalResponse | null;
  isVisible: boolean;
  onClose: () => void;
  loading: boolean;
}

export const ProntoResultsPanel: React.FC<ProntoResultsPanelProps> = ({
  results,
  isVisible,
  onClose,
  loading
}) => {
  // États pour la sauvegarde des personas
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [listName, setListName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Fonction pour ouvrir le modal de sauvegarde
  const handleSavePersonas = () => {
    if (!results || !results.leads || results.leads.length === 0) {
      alert('Aucun lead à sauvegarder');
      return;
    }

    // Générer un nom par défaut
    const defaultName = `Leads ${new Date().toLocaleDateString('fr-FR')} - ${results.leads.length} personas`;
    setListName(defaultName);
    setSaveError('');
    setShowSaveModal(true);
  };

  // Fonction pour sauvegarder les leads
  const handleConfirmSave = async () => {
    if (!listName.trim()) {
      setSaveError('Le nom de la liste est requis');
      return;
    }

    if (!results || !results.leads || results.leads.length === 0) {
      setSaveError('Aucun lead à sauvegarder');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      console.log('💾 Sauvegarde des leads:', {
        nom: listName.trim(),
        nombreLeads: results.leads.length,
        leads: results.leads
      });

      const savedList = await ListService.createLeadsListFromPronto(
        listName.trim(),
        results.leads
      );

      console.log('✅ Liste de leads sauvegardée:', savedList);

      // Fermer le modal et réinitialiser
      setShowSaveModal(false);
      setListName('');
      setSaveError('');

      // Afficher un message de succès
      alert(`Liste "${listName}" sauvegardée avec succès ! Elle contient ${savedList.elements} lead(s).`);

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des leads:', error);
      setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction pour annuler la sauvegarde
  const handleCancelSave = () => {
    setShowSaveModal(false);
    setListName('');
    setSaveError('');
  };

  if (!isVisible) return null;

  const handleLinkedInClick = (linkedinUrl?: string) => {
    if (linkedinUrl) {
      window.open(linkedinUrl, '_blank');
    }
  };

  const getFullName = (leadData: ProntoLead) => {
    if (leadData.lead?.first_name && leadData.lead?.last_name) {
      return `${leadData.lead.first_name} ${leadData.lead.last_name}`;
    }
    return 'Nom non disponible';
  };

  const getLocation = (leadData: ProntoLead) => {
    return leadData.lead?.location || 'Localisation non disponible';
  };

  const getCompanyInfo = (leadData: ProntoLead) => {
    if (!leadData.company) return 'Entreprise non disponible';
    return leadData.company.name || 'Nom d\'entreprise non disponible';
  };

  const getProfileImage = (leadData: ProntoLead) => {
    return leadData.lead?.profile_image_url;
  };

  const getTitle = (leadData: ProntoLead) => {
    return leadData.lead?.title || 'Titre non disponible';
  };

  const getLinkedInUrl = (leadData: ProntoLead) => {
    return leadData.lead?.linkedin_url;
  };

  return (
    <>
      {/* Overlay sombre */}
      {isVisible && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`absolute left-0 top-0 bg-white shadow-2xl transition-transform duration-300 ease-in-out z-40 flex flex-col ${
            isVisible ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            height: '100%', // Prendre toute la hauteur du container parent
            width: '400px'
          }}>

      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900">Results</h2>
          {results && (
            <button
              onClick={handleSavePersonas}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Personas
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-md transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto h-full">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : results ? (
          <>
            {/* Results count and LinkedIn link */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {results.filtered_leads} results found
                </h3>
                <button className="px-3 py-1 border border-blue-600 text-blue-600 text-sm rounded-md hover:bg-blue-50 transition-colors">
                  See in LinkedIn
                </button>
              </div>
            </div>

            {/* Results list */}
            <div
              className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              style={{
                maxHeight: 'calc(100vh - 200px)',
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6'
              }}
            >
              <div className="p-4 space-y-3">
              {results.leads && results.leads.length > 0 ? (
                results.leads.map((leadData, index) => (
                  <div key={leadData.search_id || index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    {/* Profile image */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 relative">
                        {getProfileImage(leadData) ? (
                          <>
                            <img
                              src={getProfileImage(leadData)}
                              alt={getFullName(leadData)}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                console.log('❌ Erreur de chargement image pour:', getFullName(leadData), getProfileImage(leadData));
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'flex';
                                }
                              }}
                              onLoad={(e) => {
                                console.log('✅ Image chargée pour:', getFullName(leadData));
                                const target = e.target as HTMLImageElement;
                                const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'none';
                                }
                              }}
                            />
                            <div className="fallback-avatar absolute inset-0 flex items-center justify-center bg-gray-200">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lead info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {getFullName(leadData)}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {getTitle(leadData)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 truncate">
                            {getCompanyInfo(leadData)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {getLocation(leadData)}
                          </p>
                        </div>

                        {/* LinkedIn button */}
                        {getLinkedInUrl(leadData) && (
                          <button
                            onClick={() => handleLinkedInClick(getLinkedInUrl(leadData))}
                            className="flex-shrink-0 p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors ml-2"
                            title="Voir sur LinkedIn"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucun résultat trouvé</p>
                </div>
              )}
              </div>
            </div>

            {/* Applied filters summary */}
            {results.applied_filters && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Filtres appliqués</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  {results.applied_filters.titles.length > 0 && (
                    <div>
                      <span className="font-medium">Titres:</span> {results.applied_filters.titles.join(', ')}
                    </div>
                  )}
                  {results.applied_filters.company_names.length > 0 && (
                    <div>
                      <span className="font-medium">Entreprises:</span> {results.applied_filters.company_names.join(', ')}
                    </div>
                  )}
                  {results.applied_filters.lead_locations.length > 0 && (
                    <div>
                      <span className="font-medium">Localisations leads:</span> {results.applied_filters.lead_locations.join(', ')}
                    </div>
                  )}
                  {results.applied_filters.employee_ranges.length > 0 && (
                    <div>
                      <span className="font-medium">Tailles:</span> {results.applied_filters.employee_ranges.join(', ')}
                    </div>
                  )}
                  {results.applied_filters.company_locations.length > 0 && (
                    <div>
                      <span className="font-medium">Localisations entreprises:</span> {results.applied_filters.company_locations.join(', ')}
                    </div>
                  )}
                  {results.applied_filters.industries.length > 0 && (
                    <div>
                      <span className="font-medium">Secteurs:</span> {results.applied_filters.industries.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Aucun résultat à afficher</p>
          </div>
        )}
      </div>
    </div>

    {/* Modal de sauvegarde */}
    {showSaveModal && (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Sauvegarder les personas
            </h3>
            <button
              onClick={handleCancelSave}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Vous allez sauvegarder <span className="font-semibold">{results?.leads?.length || 0} personas</span> dans une nouvelle liste.
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la liste *
              </label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Leads développeurs Paris - Janvier 2025"
                disabled={isSaving}
              />

              {saveError && (
                <p className="text-red-600 text-sm mt-2">{saveError}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Informations sauvegardées :</strong> Nom, prénom, titre, entreprise, localisation, URL LinkedIn, et autres données disponibles.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={handleCancelSave}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmSave}
              disabled={isSaving || !listName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving && (
                <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
