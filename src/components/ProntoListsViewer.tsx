import React, { useState, useEffect } from 'react';
import { Building, Calendar, ExternalLink, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { ProntoService, ProntoListItem } from '../services/prontoService';

interface ProntoListsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProntoListsViewer: React.FC<ProntoListsViewerProps> = ({ isOpen, onClose }) => {
  const [lists, setLists] = useState<ProntoListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Charger les listes au montage du composant
  useEffect(() => {
    if (isOpen) {
      loadLists();
    }
  }, [isOpen]);

  const loadLists = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ProntoService.getAllLists();
      setLists(response.lists);
      setLastUpdated(new Date());
      console.log('📋 Listes chargées:', response.lists.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des listes';
      setError(errorMessage);
      console.error('❌ Erreur chargement listes:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Listes Pronto</h2>
              <p className="text-sm text-gray-500">
                {lastUpdated && `Dernière mise à jour: ${formatDate(lastUpdated.toISOString())}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadLists}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Chargement des listes...</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-medium text-red-800">Erreur</h3>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={loadLists}
                className="mt-3 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Lists */}
          {!loading && !error && (
            <>
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {lists.length} liste(s) trouvée(s)
                  </span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Total des entreprises: {lists.reduce((sum, list) => sum + list.companies_count, 0)}
                </p>
              </div>

              {/* Lists Grid */}
              {lists.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune liste trouvée</p>
                  <p className="text-sm">Créez votre première liste d'entreprises</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lists.map((list) => (
                    <div key={list.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{list.name}</h3>
                          <p className="text-sm text-gray-500">ID: {list.id}</p>
                        </div>
                        {list.status && (
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(list.status)}`}>
                            {list.status}
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{list.companies_count}</div>
                          <div className="text-xs text-gray-500">Entreprises</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{list.type}</div>
                          <div className="text-xs text-gray-500">Type</div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Créée: {formatDate(list.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Modifiée: {formatDate(list.updated_at)}</span>
                        </div>
                      </div>

                      {/* LinkedIn Link */}
                      {list.linkedin_id && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <a
                            href={`https://www.linkedin.com/company/${list.linkedin_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Voir sur LinkedIn
                          </a>
                        </div>
                      )}

                      {/* Webhook */}
                      {list.webhook_url && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            🔗 Webhook configuré
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {lists.length > 0 && (
              <>
                {lists.length} liste(s) • {lists.reduce((sum, list) => sum + list.companies_count, 0)} entreprise(s) au total
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProntoListsViewer;
