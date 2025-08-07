import React, { useState } from 'react';
import { X, Plus, Trash2, Building } from 'lucide-react';
import { EntrepriseApiResult } from '@entities/Business';
import { convertSelectedBusinessesToProntoFormat } from '../utils/prontoMapper';

interface Company {
  name: string;
  country_code?: string;
  domain?: string;
  linkedin_url?: string;
}

interface ProntoListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; webhook_url?: string; companies: Company[] }) => Promise<void>;
  selectedBusinesses?: EntrepriseApiResult[]; // Les entreprises sélectionnées depuis l'API
}

const ProntoListModal: React.FC<ProntoListModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedBusinesses = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    webhook_url: ''
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser les entreprises avec les entreprises sélectionnées
  React.useEffect(() => {
    if (selectedBusinesses && selectedBusinesses.length > 0) {
      console.log('🔄 Initialisation du modal avec', selectedBusinesses.length, 'entreprises sélectionnées');
      console.log('📊 Données des entreprises sélectionnées:', selectedBusinesses);

      // Utiliser le mapper pour convertir les EntrepriseApiResult en ProntoCompany
      const initialCompanies = convertSelectedBusinessesToProntoFormat(selectedBusinesses);
      setCompanies(initialCompanies);

      console.log('✅ Entreprises initialisées dans le modal:', initialCompanies);
    } else {
      // Aucune entreprise sélectionnée, commencer avec une liste vide
      setCompanies([]);
    }
  }, [selectedBusinesses]);

  const addCompany = () => {
    setCompanies([...companies, { name: '', country_code: 'FR', domain: '', linkedin_url: '' }]);
  };

  const removeCompany = (index: number) => {
    setCompanies(companies.filter((_, i) => i !== index));
  };

  const updateCompany = (index: number, field: keyof Company, value: string) => {
    const updatedCompanies = companies.map((company, i) => 
      i === index ? { ...company, [field]: value } : company
    );
    setCompanies(updatedCompanies);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Le nom de la liste est requis');
      return;
    }

    if (companies.length === 0) {
      setError('Au moins une entreprise est requise');
      return;
    }

    // Vérifier que toutes les entreprises ont un nom
    const invalidCompanies = companies.filter(company => !company.name.trim());
    if (invalidCompanies.length > 0) {
      setError('Toutes les entreprises doivent avoir un nom');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        webhook_url: formData.webhook_url.trim() || undefined,
        companies: companies.filter(company => company.name.trim())
      });
      
      // Reset form
      setFormData({ name: '', webhook_url: '' });
      setCompanies([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la liste');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Créer une liste Pronto
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Info message pour les entreprises pré-remplies */}
            {selectedBusinesses && selectedBusinesses.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-600 text-sm">
                  ✅ {selectedBusinesses.length} entreprise(s) sélectionnée(s) ont été automatiquement ajoutées à la liste.
                  Vous pouvez modifier leurs informations ou en ajouter d'autres.
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Nom de la liste */}
            <div>
              <label htmlFor="listName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la liste *
              </label>
              <input
                id="listName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Prospects Tech Paris"
                required
              />
            </div>

            {/* Webhook URL (optionnel) */}
            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-2">
                URL de webhook (optionnel)
              </label>
              <input
                id="webhookUrl"
                type="url"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://webhook.example.com"
              />
            </div>

            {/* Liste des entreprises */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Entreprises ({companies.length})
                </label>
                <button
                  type="button"
                  onClick={addCompany}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              {companies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune entreprise ajoutée</p>
                  <p className="text-sm">Cliquez sur "Ajouter" pour commencer</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {companies.map((company, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Entreprise {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeCompany(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            value={company.name}
                            onChange={(e) => updateCompany(index, 'name', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Nom de l'entreprise *"
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={company.country_code || ''}
                            onChange={(e) => updateCompany(index, 'country_code', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Code pays (ex: FR)"
                            maxLength={2}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={company.domain || ''}
                            onChange={(e) => updateCompany(index, 'domain', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Domaine (ex: example.com)"
                          />
                        </div>
                        <div>
                          <input
                            type="url"
                            value={company.linkedin_url || ''}
                            onChange={(e) => updateCompany(index, 'linkedin_url', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="URL LinkedIn"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || companies.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Création...
                </>
              ) : (
                <>
                  <Building className="w-4 h-4" />
                  Créer la liste
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProntoListModal;
