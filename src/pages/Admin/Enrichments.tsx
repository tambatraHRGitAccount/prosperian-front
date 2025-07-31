import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import enrichmentService, { Enrichment, LeadEnrich } from '../../services/enrichmentService';
import { sendEnrichmentToPronto, ProntoEnrichmentContact } from '../../services/prontoService';

const AdminEnrichments: React.FC = () => {
  const { user } = useAuth();
  const [enrichments, setEnrichments] = useState<Enrichment[]>([]);
  const [selectedEnrichment, setSelectedEnrichment] = useState<Enrichment | null>(null);
  const [leads, setLeads] = useState<LeadEnrich[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    fetchEnrichments();
  }, [currentPage, statusFilter]);

  const fetchEnrichments = async () => {
    try {
      setLoading(true);
      const response = await enrichmentService.getEnrichments(currentPage, 10, statusFilter);
      setEnrichments(response.enrichments || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Erreur lors du chargement des enrichments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async (enrichmentId: string) => {
    try {
      setLoadingLeads(true);
      const response = await enrichmentService.getLeadsEnrich(enrichmentId, 1, 100);
      setLeads(response.leads || []);
    } catch (error) {
      console.error('Erreur lors du chargement des leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleViewLeads = async (enrichment: Enrichment) => {
    setSelectedEnrichment(enrichment);
    await fetchLeads(enrichment.id);
  };

  const handleValidateEnrichment = async (enrichment: Enrichment) => {
    if (!enrichment) return;

    try {
      setValidating(true);
      console.log('🚀 Début de la validation pour l\'enrichment:', enrichment.name);
      
      // Récupérer les leads de l'enrichment
      console.log('📋 Récupération des leads...');
      const leadsResponse = await enrichmentService.getLeadsEnrich(enrichment.id, 1, 1000);
      const leads = leadsResponse.leads || [];
      console.log('✅ Leads récupérés:', leads.length, 'contacts');
      
      // Convertir les leads au format Pronto
      const contacts: ProntoEnrichmentContact[] = leads.map(lead => ({
        firstname: lead.firstname,
        lastname: lead.lastname,
        company_name: lead.company_name || undefined,
        linkedin_url: lead.linkedin_url || undefined,
        domain: lead.domain || undefined,
      }));
      
      // Déterminer le type d'enrichment pour Pronto
      let enrichmentTypes: string[] = [];
      if (enrichment.type === 'email') {
        enrichmentTypes = ['email'];
      } else if (enrichment.type === 'phone') {
        enrichmentTypes = ['phone'];
      } else if (enrichment.type === 'tous') {
        enrichmentTypes = ['email', 'phone'];
      }
      
      const prontoData = {
        contacts,
        enrichment_type: enrichmentTypes
      };
      
      console.log('📤 Envoi vers Pronto API:', prontoData);
      console.log('🔗 URL:', 'http://localhost:4000/api/pronto/enrichments/contacts/bulk');
      
      // Envoyer vers l'API Pronto
      const prontoResponse = await sendEnrichmentToPronto(prontoData);
      console.log('✅ Réponse de Pronto API:', prontoResponse);
      
      console.log('💾 Mise à jour du statut dans la base de données...');
      
      // Mettre à jour le statut de l'enrichment
      await enrichmentService.updateEnrichment(enrichment.id, {
        status: 'Terminé'
      });
      
      console.log('✅ Statut mis à jour: Terminé');
      
      // Rafraîchir la liste
      await fetchEnrichments();
      console.log('🔄 Liste des enrichments rafraîchie');
      
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      
      // En cas d'erreur, mettre le statut à "Échec"
      try {
        console.log('💾 Mise à jour du statut à "Échec"...');
        await enrichmentService.updateEnrichment(enrichment.id, {
          status: 'Échec'
        });
        await fetchEnrichments();
        console.log('✅ Statut mis à jour: Échec');
      } catch (updateError) {
        console.error('❌ Erreur lors de la mise à jour du statut:', updateError);
      }
    } finally {
      setValidating(false);
    }
  };



  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'En cours': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      'Terminé': { color: 'bg-green-100 text-green-800', icon: '✅' },
      'Échec': { color: 'bg-red-100 text-red-800', icon: '❌' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['En cours'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {status}
      </span>
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Enrichments</h1>
            <p className="text-gray-600 mt-2">Validez et gérez les enrichments des utilisateurs</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Tous les statuts</option>
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
              <option value="Échec">Échec</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des Enrichments */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Enrichments</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrichments.map((enrichment) => (
                  <tr key={enrichment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enrichment.name}</div>
                        {enrichment.description && (
                          <div className="text-sm text-gray-500">{enrichment.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{enrichment.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(enrichment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(enrichment.date_created).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewLeads(enrichment)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Voir Leads
                        </button>
                        {enrichment.status === 'En cours' && (
                          <button
                            onClick={() => handleValidateEnrichment(enrichment)}
                            disabled={validating}
                            className={`text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                              validating ? 'cursor-not-allowed' : ''
                            }`}
                          >
                            {validating ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1"></div>
                                Validation...
                              </div>
                            ) : (
                              'Valider'
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>



      {/* Modal des leads */}
      {selectedEnrichment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Leads de "{selectedEnrichment.name}"
                </h3>
                <button
                  onClick={() => setSelectedEnrichment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingLeads ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Nom
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Entreprise
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Domaine
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          LinkedIn
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leads.map((lead) => (
                        <tr key={lead.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {lead.firstname} {lead.lastname}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {lead.company_name || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {lead.domain || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {lead.linkedin_url ? (
                              <a
                                href={lead.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Voir profil
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(lead.date_creation).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnrichments; 