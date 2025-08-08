import React, { useState } from 'react';
import ProntoListModal from '../components/ProntoListModal';
import ProntoListsViewer from '../components/ProntoListsViewer';
import { ProntoService, ProntoListRequest } from '../services/prontoService';
import { Building, TestTube, List } from 'lucide-react';
import { EntrepriseApiResult } from '../entities/Business';

const TestProntoModal: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showListsViewer, setShowListsViewer] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Données de test pour simuler des entreprises sélectionnées (format EntrepriseApiResult)
  const mockSelectedBusinesses: EntrepriseApiResult[] = [
    {
      siren: '123456789',
      nom_complet: 'PRONTO SAS',
      nom_raison_sociale: 'PRONTO',
      siege: {
        adresse: '123 Rue de la Tech, 75001 Paris',
        code_postal: '75001',
        commune: 'Paris'
      },
      complements: {
        web_info: {
          website: 'https://prontohq.com'
        }
      }
    },
    {
      siren: '987654321',
      nom_complet: 'GOOGLE FRANCE SARL',
      nom_raison_sociale: 'GOOGLE FRANCE',
      siege: {
        adresse: '8 Rue de Londres, 75009 Paris',
        code_postal: '75009',
        commune: 'Paris'
      },
      complements: {
        web_info: {
          website: 'https://google.com'
        }
      }
    },
    {
      siren: '456789123',
      nom_complet: 'MICROSOFT FRANCE SAS',
      nom_raison_sociale: 'MICROSOFT FRANCE',
      siege: {
        adresse: '37 Quai du Président Roosevelt, 92130 Issy-les-Moulineaux',
        code_postal: '92130',
        commune: 'Issy-les-Moulineaux'
      },
      complements: {}
    }
  ];

  const handleCreateList = async (data: ProntoListRequest) => {
    try {
      setError(null);
      console.log('🚀 Test - Création de liste Pronto:', data);
      
      const result = await ProntoService.createCompanyList(data);
      setLastResult(result);
      
      console.log('✅ Test - Liste créée avec succès:', result);
      alert(`✅ Liste "${result.list.name}" créée avec succès!\nID: ${result.list.id}\nEntreprises: ${result.list.companies_count}`);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Test - Erreur:', err);
      throw err;
    }
  };

  const testServiceStatus = async () => {
    try {
      setError(null);
      const status = await ProntoService.getServiceStatus();
      console.log('📊 Statut des services Pronto:', status);
      alert(`📊 Statut des services:\n${JSON.stringify(status.status.services, null, 2)}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur statut:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <TestTube className="w-8 h-8 text-blue-600" />
            Test Modal Pronto - Création de Listes
          </h1>

          <div className="space-y-6">
            {/* Section de test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Tests Disponibles</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Building className="w-5 h-5" />
                  Tester Modal (avec données)
                </button>

                <button
                  onClick={() => setShowListsViewer(true)}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 transition-colors"
                >
                  <List className="w-5 h-5" />
                  Voir Listes Existantes
                </button>

                <button
                  onClick={testServiceStatus}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors"
                >
                  <TestTube className="w-5 h-5" />
                  Tester Statut API
                </button>
              </div>
            </div>

            {/* Données de test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Données de Test</h2>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-600 mb-2">Entreprises simulées :</p>
                <pre className="text-xs text-gray-700 overflow-x-auto">
                  {JSON.stringify(mockSelectedBusinesses, null, 2)}
                </pre>
              </div>
            </div>

            {/* Résultats */}
            {lastResult && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-green-800 mb-4">✅ Dernier Résultat</h2>
                <div className="space-y-2">
                  <p><strong>ID:</strong> {lastResult.list.id}</p>
                  <p><strong>Nom:</strong> {lastResult.list.name}</p>
                  <p><strong>Entreprises:</strong> {lastResult.list.companies_count}</p>
                  <p><strong>Date:</strong> {new Date(lastResult.list.created_at).toLocaleString()}</p>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-green-700 font-medium">Voir détails complets</summary>
                    <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-x-auto">
                      {JSON.stringify(lastResult, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}

            {/* Erreurs */}
            {error && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-red-800 mb-2">❌ Erreur</h2>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-800 mb-4">📋 Instructions</h2>
              <ol className="list-decimal list-inside space-y-2 text-blue-700">
                <li>Cliquez sur "Tester Modal" pour ouvrir le modal avec des données pré-remplies</li>
                <li>Modifiez les informations si nécessaire</li>
                <li>Cliquez sur "Créer la liste" pour tester l'API</li>
                <li>Vérifiez les résultats dans la console et dans l'interface</li>
                <li>Testez aussi le statut de l'API pour vérifier la connectivité</li>
              </ol>
            </div>

            {/* Liens utiles */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">🔗 Liens Utiles</h2>
              <div className="space-y-2">
                <a 
                  href="http://localhost:4000/api-docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-800 underline"
                >
                  📚 Documentation Swagger API
                </a>
                <a 
                  href="http://localhost:4000/api/pronto/status" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-800 underline"
                >
                  📊 Statut API Pronto (JSON)
                </a>
                <a 
                  href="/recherche/entreprises" 
                  className="block text-blue-600 hover:text-blue-800 underline"
                >
                  🏢 Page Recherche Entreprises (intégration réelle)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de test */}
      <ProntoListModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateList}
        selectedBusinesses={mockSelectedBusinesses}
      />

      {/* Viewer des listes existantes */}
      <ProntoListsViewer
        isOpen={showListsViewer}
        onClose={() => setShowListsViewer(false)}
      />
    </div>
  );
};

export default TestProntoModal;
