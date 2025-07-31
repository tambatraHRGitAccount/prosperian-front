import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import enrichmentService from '../../services/enrichmentService';
import { Enrichment } from '../../services/enrichmentService';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEnrichments: 0,
    pendingEnrichments: 0,
    completedEnrichments: 0,
    totalUsers: 0
  });
  const [recentEnrichments, setRecentEnrichments] = useState<Enrichment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Récupérer les enrichments récents
        const enrichmentsResponse = await enrichmentService.getEnrichments(1, 5);
        setRecentEnrichments(enrichmentsResponse.enrichments || []);

        // Calculer les statistiques
        const allEnrichmentsResponse = await enrichmentService.getEnrichments(1, 1000);
        const allEnrichments = allEnrichmentsResponse.enrichments || [];
        
        setStats({
          totalEnrichments: allEnrichments.length,
          pendingEnrichments: allEnrichments.filter(e => e.status === 'En cours').length,
          completedEnrichments: allEnrichments.filter(e => e.status === 'Terminé').length,
          totalUsers: 0 // À implémenter avec un service utilisateur
        });
      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
        <p className="text-gray-600 mt-2">Bienvenue dans votre espace d'administration</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Enrichments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalEnrichments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingEnrichments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Terminés</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedEnrichments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrichments Récents */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Enrichments Récents</h2>
        </div>
        <div className="p-6">
          {recentEnrichments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun enrichment récent</p>
          ) : (
            <div className="space-y-4">
              {recentEnrichments.map((enrichment) => (
                <div key={enrichment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      enrichment.status === 'Terminé' ? 'bg-green-500' :
                      enrichment.status === 'En cours' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <h3 className="font-medium text-gray-900">{enrichment.name}</h3>
                      <p className="text-sm text-gray-500">{enrichment.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{enrichment.status}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(enrichment.date_created).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default AdminDashboard; 