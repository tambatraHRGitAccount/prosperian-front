import React, { useState, useEffect } from 'react';
import SectionEnrichmentCard from "@shared/components/SectionCard/SectionEnrichmentCard";
import SectionTableCard from "@shared/components/SectionCard/SectionTableCard";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import enrichmentService, { Enrichment as EnrichmentType } from '../../services/enrichmentService';

const Enrichment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrichments, setEnrichments] = useState<EnrichmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserEnrichments();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserEnrichments = async () => {
    try {
      setLoading(true);
      const response = await enrichmentService.getEnrichments(1, 100); // Récupérer tous les enrichments de l'utilisateur
      setEnrichments(response.enrichments || []);
    } catch (error) {
      console.error('Erreur lors du chargement des enrichments:', error);
      setError('Erreur lors du chargement des enrichments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    console.log("File uploaded:", file.name);
  };

  const handleSignUp = () => {
    navigate("/register");
  };

  const handleConnect = () => {
    navigate("/login");
  };

  const handleExportCSV = async (enrichmentId: string) => {
    try {
      console.log('📥 Téléchargement CSV pour l\'enrichment:', enrichmentId);
      
      // Récupérer les leads de l'enrichment
      const leadsResponse = await enrichmentService.getLeadsEnrich(enrichmentId, 1, 1000);
      const leads = leadsResponse.leads || [];
      
      if (leads.length === 0) {
        alert('Aucun lead à exporter');
        return;
      }

      // Créer le contenu CSV
      const headers = ['Prénom', 'Nom', 'Entreprise', 'Domaine', 'LinkedIn URL', 'Date de création'];
      const csvContent = [
        headers.join(','),
        ...leads.map(lead => [
          `"${lead.firstname || ''}"`,
          `"${lead.lastname || ''}"`,
          `"${lead.company_name || ''}"`,
          `"${lead.domain || ''}"`,
          `"${lead.linkedin_url || ''}"`,
          `"${new Date(lead.date_creation).toLocaleDateString()}"`
        ].join(','))
      ].join('\n');

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `enrichment_${enrichmentId}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ CSV téléchargé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement CSV:', error);
      alert('Erreur lors du téléchargement du fichier CSV');
    }
  };

  // On ne garde que les deux derniers features
  const features = [
    "Rechercher des contacts sur une liste d'entreprise",
    "Générer des emails sur une liste de contacts",
  ];

  const remarkContent = (
    <>
      Pour mieux comprendre notre <span className="font-bold">service d'enrichissement</span>, nous vous recommandons de
      jeter un œil à nos{" "}
      <a href="#" className="text-[#E95C41] font-bold underline">
        tutoriels
      </a>
      !
    </>
  );

  // Convertir les enrichments en format pour le tableau
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'En cours': { color: 'text-yellow-600', icon: '⏳' },
      'Terminé': { color: 'text-green-600', icon: '✅' },
      'Échec': { color: 'text-red-600', icon: '❌' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['En cours'];
    
    return (
      <span className={`font-semibold ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {status}
      </span>
    );
  };

  const tableItems = user ? enrichments.map(enrichment => [
    <span key="type">{enrichment.type}</span>,
    <span key="name">{enrichment.name}</span>,
    <span key="status">{getStatusBadge(enrichment.status)}</span>,
    <span key="date">{new Date(enrichment.date_created).toLocaleDateString()}</span>,
    <div key="actions" className="flex space-x-2">
      {enrichment.status === 'Terminé' && (
        <button
          onClick={() => handleExportCSV(enrichment.id)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          title="Télécharger CSV"
        >
          📥 CSV
        </button>
      )}
    </div>
  ]) : [];

  return (
    <div className="flex flex-col flex-1">
      <div className="mx-auto p-3">
        <SectionEnrichmentCard
          mainTitle="Enrichissez facilement vos fichiers en données d'entreprises ou de contacts"
          items={features}
          remark={remarkContent}
          onFileUpload={handleFileUpload}
          onSignUpClick={handleSignUp}
          onConnectClick={handleConnect}
        />
        <div className="mb-6 flex justify-end">
          <button
            className={`inline-flex items-center font-medium py-3 px-6 rounded-full ${
              user 
                ? 'bg-gradient-to-r from-orange-400 to-[#E95C41] hover:opacity-90 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={() => user && navigate("/enrichissement/pronto-leads")}
            disabled={!user}
          >
            Find Leads
          </button>
        </div>
        <SectionTableCard
          title="Mes enrichissements"
          columns={["Type", "Nom", "Statut", "Créé le", "Actions"]}
          items={tableItems}
          emptyMessage={loading ? "Chargement..." : "Vous n'avez pas encore réalisé un enrichissement."}
          onExportSelect={() => console.log("Export CSV")}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Enrichment;
