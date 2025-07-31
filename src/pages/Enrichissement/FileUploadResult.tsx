import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import enrichmentService, { CreateEnrichmentData, CreateLeadEnrichData } from '../../services/enrichmentService';

const FileUploadResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const file = location.state?.file as File | undefined;

  const [columns, setColumns] = useState({
    lead_first_name: '',
    lead_last_name: '',
    company_name: '',
    company_domain: '',
    lead_profile_linkedin_url: '',
  });
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [fileData, setFileData] = useState<any[]>([]);
  const [enrichmentType, setEnrichmentType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // États pour la modal d'enrichment
  const [showEnrichmentModal, setShowEnrichmentModal] = useState(false);
  const [enrichmentName, setEnrichmentName] = useState('');
  const [enrichmentTypeModal, setEnrichmentTypeModal] = useState('');
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const parseFile = async () => {
        try {
          if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: (result) => {
                const headers = Object.keys(result.data[0] || {}).filter(header => header && typeof header === 'string');
                setFileColumns(headers);
                // Ensure only data rows are stored, excluding any header-like rows
                setFileData(result.data.filter(row => Object.values(row).some(val => val !== headers.find(h => h === val))));
              },
              error: (error) => {
                console.error('Error parsing CSV:', error);
                setFileColumns([]);
                setFileData([]);
              },
            });
          } else if (file.name.endsWith('.xlsx')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheet = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheet];
              const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
              const headers = (json[0] as string[]).filter(header => header && typeof header === 'string');
              const rows = XLSX.utils.sheet_to_json(worksheet, { header: headers });
              setFileColumns(headers);
              // Ensure only data rows are stored, excluding any header-like rows
              setFileData(rows.filter(row => Object.values(row).some(val => val !== headers.find(h => h === val))));
            };
            reader.onerror = () => {
              console.error('Error reading XLSX file');
              setFileColumns([]);
              setFileData([]);
            };
            reader.readAsArrayBuffer(file);
          }
        } catch (error) {
          console.error('Error processing file:', error);
          setFileColumns([]);
          setFileData([]);
        }
      };
      parseFile();
    }
  }, [file]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setColumns(prev => ({ ...prev, [name]: value }));
  };

  const handleEnrichmentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEnrichmentType(e.target.value);
  };

  const handleEnrichment = async () => {
    // Ouvrir la modal d'enrichment au lieu d'exécuter directement
    setShowEnrichmentModal(true);
  };

  const handleCreateEnrichment = async () => {
    if (!user) {
      setEnrichmentError('Utilisateur non connecté');
      return;
    }

    if (!enrichmentName.trim()) {
      setEnrichmentError('Le nom de l\'enrichment est requis');
      return;
    }

    if (!enrichmentTypeModal.trim()) {
      setEnrichmentError('Le type d\'enrichment est requis');
      return;
    }

    setEnrichmentLoading(true);
    setEnrichmentError(null);

    try {
      // 1. Créer l'enrichment
      const enrichmentData: CreateEnrichmentData = {
        name: enrichmentName,
        type: enrichmentTypeModal,
        description: null // null comme demandé
      };

      console.log('Création de l\'enrichment:', enrichmentData);
      const enrichmentResponse = await enrichmentService.createEnrichment(enrichmentData);
      console.log('Enrichment créé:', enrichmentResponse);

      const enrichmentId = enrichmentResponse.enrichment?.id;
      if (!enrichmentId) {
        throw new Error('ID de l\'enrichment non reçu');
      }

      // 2. Préparer les données des leads
      const leadsData: CreateLeadEnrichData[] = fileData.map(row => ({
        firstname: row[columns.lead_first_name] || '',
        lastname: row[columns.lead_last_name] || '',
        company_name: row[columns.company_name] || '',
        domain: row[columns.company_domain] || '',
        linkedin_url: row[columns.lead_profile_linkedin_url] || ''
      })).filter(lead => lead.firstname && lead.lastname); // Filtrer les leads valides

      console.log('Données des leads à envoyer:', leadsData);

      // 3. Ajouter les leads un par un (pas de bulk pour l'instant)
      let successCount = 0;
      let errorCount = 0;

      for (const leadData of leadsData) {
        try {
          await enrichmentService.addLeadEnrich(enrichmentId, leadData);
          successCount++;
        } catch (error) {
          console.error('Erreur lors de l\'ajout du lead:', leadData, error);
          errorCount++;
        }
      }

      // 4. Afficher le résultat
      setResult({
        successful: successCount,
        failed: errorCount,
        total: leadsData.length,
        enrichment_id: enrichmentId
      });

      // 5. Fermer la modal et afficher le succès
      setShowEnrichmentModal(false);
      setShowSuccessModal(true);

      // 6. Réinitialiser les champs
      setEnrichmentName('');
      setEnrichmentTypeModal('');

    } catch (err: any) {
      console.error('Erreur lors de la création de l\'enrichment:', err);
      setEnrichmentError(err.message || 'Erreur lors de la création de l\'enrichment');
    } finally {
      setEnrichmentLoading(false);
    }
  };

  const getPreviewData = (columnKey: string) => {
    if (!columnKey || !fileData.length) return '—';
    const selectedColumn = columns[columnKey as keyof typeof columns];
    if (!selectedColumn) return '—';

    // Collect all non-empty values from the selected column, excluding the header
    const values = fileData
      .map(row => row[selectedColumn])
      .filter(value => value != null && value.toString().trim() !== '' && value !== selectedColumn)
      .map(value => value.toString());

    if (values.length === 0) return '—';

    const maxPreview = 5;
    let displayValues: string[];
    if (values.length > maxPreview) {
      displayValues = [...values.slice(0, maxPreview - 1), '...'];
    } else {
      displayValues = values;
    }

    // Format as line-by-line with indentation
    const formattedValues = displayValues.map(value => `    ${value},`).join('\n');
    return <pre className="text-sm text-gray-400">[&#10;{formattedValues}&#10;]</pre>;
  };

  if (!file) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full mx-auto">
        <p className="text-lg text-red-600">
          Aucun fichier n'a été téléchargé.{' '}
          <button onClick={() => navigate('/enrichissement')} className="text-[#E95C41] font-medium underline ml-2">
            Retour
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-6xl mx-auto">
        <button onClick={() => navigate('/enrichissement')} className="text-red-600 font-medium mb-6">
          ✕ Abandonner
        </button>
        <h2 className="text-xl font-bold text-[#E95C41] mb-4">Société</h2>
        <div className="mb-6">
          <label className="text-gray-700 text-sm font-medium block mb-2">Type d'enrichissement</label>
          <select
            name="enrichment_type"
            value={enrichmentType}
            onChange={handleEnrichmentTypeChange}
            className="border rounded px-2 py-1 w-full max-w-xs"
          >
            <option value="">Pas de type configuré</option>
            <option value="email">email</option>
            <option value="phone">phone</option>
            <option value="email et phone">email et phone</option>
          </select>
        </div>
        <table className="w-full text-left">
          <thead className="text-gray-600 text-sm">
            <tr className="">
              <th className="">Colonne Societeinfo</th>
              <th className="">Colonne de fichier importé</th>
              <th className="">Aperçu des données</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {[
              { label: 'Lead first name', key: 'lead_first_name' },
              { label: 'Lead last name', key: 'lead_last_name' },
              { label: 'Company name', key: 'company_name' },
              { label: 'Company domain', key: 'company_domain' },
              { label: 'Lead profile LinkedIn URL', key: 'lead_profile_linkedin_url' },
            ].map(col => (
              <tr key={col.key} className="my-5">
                <td className="py-4">{col.label}</td>
                <td className="py-4">
                  <select
                    name={col.key}
                    value={columns[col.key as keyof typeof columns]}
                    onChange={handleChange}
                    className="border rounded px-2 py-1 w-full"
                  >
                    <option value="">Pas de colonne configurée</option>
                    {fileColumns.map((column, index) => (
                      <option key={index} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-4">{getPreviewData(col.key)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bg-orange-50 text-sm text-orange-700 p-4 mt-6 rounded-md">
          <span className="font-medium">
            Pour mieux comprendre notre <strong>service d'enrichissement</strong>
          </span>
          , nous vous recommandons de jeter un œil à nos{' '}
          <a href="#" className="underline">
            tutoriels
          </a>{' '}
          !
        </div>

        <div className="flex justify-end mt-8">
          <button
            className="bg-gradient-to-r from-orange-400 to-[#E95C41] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90"
            onClick={handleEnrichment}
            disabled={loading}
          >
            {loading ? 'Enrichissement en cours...' : 'Lancer l\'enrichissement'}
          </button>
        </div>
      </div>



      {result && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          Enrichissement terminé ! {result.successful || result.total_processed} contacts enrichis.
        </div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      {/* Modal de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative flex flex-col items-center">
            <button
              className="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={() => setShowSuccessModal(false)}
              aria-label="Fermer"
            >
              ×
            </button>
            <div className="flex flex-col items-center">
              <div className="bg-green-100 rounded-full p-4 mb-4">
                <svg width="40" height="40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="#22C55E" fillOpacity="0.15"/>
                  <path d="M13 21l5 5 9-9" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Enrichissement terminé !</h2>
              <p className="text-gray-700 text-center mb-4">
                {result?.successful || fileData.length} contacts enrichis avec succès.
              </p>
              <button
                className="mt-2 px-6 py-2 bg-gradient-to-r from-orange-400 to-[#E95C41] text-white rounded-full font-semibold hover:opacity-90"
                onClick={() => setShowSuccessModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'enrichment */}
      {showEnrichmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
            <button
              className="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={() => setShowEnrichmentModal(false)}
              aria-label="Fermer"
            >
              ×
            </button>
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Créer un enrichment</h2>
              <p className="text-gray-600 text-sm">
                Configurez votre campagne d'enrichment pour {fileData.length} contacts
              </p>
            </div>

            <div className="space-y-4">
              {/* Nom de l'enrichment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'enrichment *
                </label>
                <input
                  type="text"
                  value={enrichmentName}
                  onChange={(e) => setEnrichmentName(e.target.value)}
                  placeholder="Ex: Campagne LinkedIn Q1 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Type d'enrichment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'enrichment *
                </label>
                <select
                  value={enrichmentTypeModal}
                  onChange={(e) => setEnrichmentTypeModal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un type</option>
                  <option value="email">email</option>
                  <option value="phone">phone</option>
                  <option value="tous">tous</option>
                </select>
              </div>

              {/* Erreur */}
              {enrichmentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{enrichmentError}</p>
                </div>
              )}

              {/* Informations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Informations</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>• {fileData.length} contacts seront ajoutés à cette campagne</p>
                      <p>• L'enrichment sera créé sous votre compte utilisateur</p>
                      <p>• Vous pourrez suivre le statut dans "Mes enrichissements"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEnrichmentModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateEnrichment}
                disabled={enrichmentLoading}
                className="px-6 py-2 bg-gradient-to-r from-orange-400 to-[#E95C41] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {enrichmentLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création en cours...
                  </div>
                ) : (
                  'Créer l\'enrichment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadResult;