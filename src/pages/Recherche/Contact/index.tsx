import React, { useState, useEffect } from "react";
import { Building, Globe, Eye } from "lucide-react";
import { useFilterContext } from "@contexts/FilterContext";
import ContactOptions from "./_components/ContactOptions";

import { RightPanel } from "../Entreprises/_components/RightPanel";
import { useNavigate } from 'react-router-dom';
import { useProntoData } from "@hooks/useProntoData";
import { ExportService } from '@services/exportService';

const Contact: React.FC = () => {
  const navigate = useNavigate();
  const { filteredContacts, headerStats, setSort } = useFilterContext();
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [showLimitInput, setShowLimitInput] = useState(false);
  const [currentSort, setCurrentSort] = useState("Pertinence");
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const { filteredBusinesses } = useFilterContext();
  const [businessesOverride, setBusinessesOverride] = useState(null);

  useEffect(() => {
    const handler = (e: unknown) => {
      setBusinessesOverride((e as any).detail);
    };
    window.addEventListener("updateBusinessList", handler);
    return () => {
      window.removeEventListener("updateBusinessList", handler);
    };
  }, []);

  const businessesToShow = businessesOverride || filteredBusinesses;

  // Pagination harmonisée avec BusinessCard
  const {
    leads,
    currentPage,
    totalPages,
    itemsPerPage,
    totalLeads,
    loadPage,
    setItemsPerPage,
    fetchSearches,
    searches
  } = useProntoData();

  // Initialisation des données Pronto (copié de Recherche/Entreprises)
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      fetchSearches().then(() => setIsInitialized(true));
    }
  }, [isInitialized, fetchSearches]);

  useEffect(() => {
    if (searches.length > 0 && isInitialized && leads.length === 0) {
      loadPage(1);
    }
  }, [searches.length, isInitialized, leads.length, loadPage]);

  // Fonction pour extraire l'adresse de manière sécurisée (copiée de BusinessCard)
  const extractAddress = (headquarters: unknown) => {
    if (!headquarters) return 'Adresse non disponible';
    const h = headquarters as unknown as { line1?: string; city?: string; postalCode?: string; country?: string };
    const parts = [];
    if (h.line1) parts.push(h.line1);
    if (h.city) parts.push(h.city);
    if (h.postalCode) parts.push(h.postalCode);
    if (h.country) parts.push(h.country);
    return parts.length > 0 ? parts.join(', ') : 'Adresse non disponible';
  };

  // Mapping des leads en objets contacts formatés (comme pour BusinessCard)
  const contacts = leads.map((leadWithCompany: unknown, index: number) => {
    const lwc = leadWithCompany as { lead?: { title?: string }, company?: { website?: string, company_profile_picture?: string, name?: string, headquarters?: unknown } };
    return {
      id: String(index),
      role: lwc.lead?.title || '',
      website: lwc.company?.website || '',
      logo: lwc.company?.company_profile_picture || '',
      entreprise: lwc.company?.name || '',
      address: extractAddress(lwc.company?.headquarters),
      // ... autres champs si besoin
    };
  });

  const handlePrevPage = () => {
    if (currentPage > 1) loadPage(currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) loadPage(currentPage + 1);
  };
  const handleSetLimit = (n: number) => {
    setItemsPerPage(n);
    loadPage(1);
    setShowLimitInput(false);
  };
  const pageStart = (currentPage - 1) * itemsPerPage + 1;
  const pageEnd = Math.min(currentPage * itemsPerPage, totalLeads);
  const paginatedContacts = contacts;

  useEffect(() => {
    console.log(filteredContacts);
  }, [filteredContacts]);

  // Handlers
  const handleLimitClick = () => setShowLimitInput(true);
  const handleCancelLimit = () => {
    setItemsPerPage(10);
    setShowLimitInput(false);
  };

  const handleSortChange = (value: string) => {
    setCurrentSort(value);
    setSort(value);
    setSelectedContacts(new Set());
  };
  /* const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortValue = e.target.value;
    setSort(sortValue);
    setCurrentSort(sortValue);
    setSelectedContacts(new Set());
    resetSelectedContactsCount(); // Reset le compteur localStorage
  }; */

  // Handle checkbox change for individual contacts
  const handleCheckboxChange = (index: number) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  };

  const handleExport = () => {
    if (selectedContacts.size > 0) setShowExportPopup(true);
    else alert("No contacts selected for export.");
  };

  const handleExportClose = () => setShowExportPopup(false);

  // Ajout : Export direct avec nom par défaut (pour ExportModalGlobal)
  const handleDirectExport = () => {
    if (selectedContacts.size === 0) return;
    const randomDigits1 = Math.floor(10000000 + Math.random() * 90000000);
    const randomDigits2 = Math.floor(10000000 + Math.random() * 90000000);
    const fileName = `export_${randomDigits1}-${randomDigits2}`;
    // Récupérer les contacts sélectionnés
    const selectedLeads = Array.from(selectedContacts).map(idx => leads[idx]);
    if (selectedLeads.length === 0) return;
    ExportService.exportSelectedBusinesses(selectedLeads, fileName, 'contact');
    setShowExportPopup(false);
    setSelectedContacts(new Set());
    navigate('/recherche/export');
  };

  // Calcul du nombre de leads avec email et avec LinkedIn
  const totalWithEmail = leads.filter(
    l => l.lead && l.lead.most_probable_email
  ).length;
  const totalWithLinkedIn = leads.filter(
    l => l.lead && l.lead.linkedin_profile_url
  ).length;

  return (
    <>
      {/* Popup contact */}
      {showContactModal && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fade-in">
            <button
              className="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={() => setShowContactModal(false)}
              aria-label="Fermer"
            >
              ×
            </button>
            <div className="text-center mb-2 text-lg font-semibold text-gray-800">
              {selectedContact.role}
            </div>
            <div className="text-center mb-4">
              <span className="text-blue-900 font-bold text-base underline cursor-pointer">
                {selectedContact.entreprise}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-6">
              <div className="text-gray-500">Civilité</div>
              <div className="text-gray-900">{selectedContact.civilite}</div>
              <div className="text-gray-500">Prénom</div>
              <div className="text-gray-900">{selectedContact.prenom}</div>
              <div className="text-gray-500">Nom</div>
              <div className="text-gray-900">{selectedContact.nom}</div>
              <div className="text-gray-500">Niveau</div>
              <div className="text-gray-900">{selectedContact.niveau}</div>
              <div className="text-gray-500">Domaine</div>
              <div className="text-gray-900">{selectedContact.domaine}</div>
              <div className="text-gray-500">LinkedIn</div>
              <div className="text-blue-700 underline truncate cursor-pointer">{selectedContact.linkedin}</div>
              <div className="text-gray-500">Email</div>
              <div className="text-orange-700 truncate">{selectedContact.email}</div>
              <div className="text-gray-500">Webmail</div>
              <div className="text-gray-900">{selectedContact.webmail}</div>
              <div className="text-gray-500">statut :</div>
              <div className="text-gray-900">{selectedContact.statut}</div>
            </div>
            <div className="flex justify-between items-center mt-6">
              <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-orange-400 text-orange-500 font-medium bg-white hover:bg-orange-50">
                <Eye className="w-4 h-4" />
                Plus de contacts
              </button>
              <button className="px-6 py-2 rounded-full bg-gradient-to-r from-orange-400 to-[#E95C41] text-white font-medium hover:opacity-90">
                1 crédit
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 p-6 min-h-screen">
          <div className="max-w-full mx-auto">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white shadow rounded-lg p-4">
                <div className="text-common-blue font-bold mb-1">Contacts</div>
                <div className="text-xl font-bold text-dark-blue">{totalLeads}</div>
                {/* <div className="text-gray-400 text-sm">Entreprises : {headerStats.totalEntreprises}</div> */}
              </div>
              {/* <div className="bg-white shadow rounded-lg p-4">
                <div className="text-common-blue font-bold mb-1">Contacts directs</div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-blue">Avec email :</span>
                  <span className="font-semibold text-dark-blue">{totalWithEmail}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-blue">Avec LinkedIn :</span>
                  <span className="font-semibold text-dark-blue">{totalWithLinkedIn}</span>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-4">
                <div className="text-common-blue font-bold mb-1">Contacts génériques</div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-blue">Avec téléphone :</span>
                  <span className="font-semibold text-dark-blue">{headerStats.contactsGeneriques.avecTelephone}</span>
                </div>
              </div> */}
            </div>

            <ContactOptions
              currentLimit={itemsPerPage}
              onLimitChangeClick={handleLimitClick}
              showLimitInput={showLimitInput}
              limitInputValue={itemsPerPage.toString()}
              onSetLimit={handleSetLimit}
              onCancelLimit={handleCancelLimit}
              currentSort={currentSort}
              onSortChange={handleSortChange}
              selectedCount={selectedContacts.size}
              onExportClick={handleExport}
              showExportModal={showExportPopup}
              onExportConfirm={handleDirectExport}
              onExportClose={handleExportClose}
              filteredTotal={totalLeads}
              pageStart={pageStart}
              pageEnd={pageEnd}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              layout={layout}
              setLayout={setLayout}
            />

            {/* Main content */}
            <div className="flex-1 bg-white shadow rounded-lg overflow-hidden">
              <div className="w-full overflow-x-auto max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <table className="min-w-[900px] w-full text-sm">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-700 uppercase bg-gray-100 shadow-sm">
                      {currentSort !== 'Pertinence' && <th className="w-8 p-3"></th>}
                      <th className="text-left p-3">Rôle</th>
                      <th className="w-24 text-center p-3">Web</th>
                      <th className="text-left p-3">Entreprise</th>
                      <th className="w-24 text-center text-[#E95C41] p-3">Contacts</th>
                      <th className="w-24 text-center p-3">CA</th>
                      <th className="w-32 text-right p-3">Adresse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedContacts.length > 0 ? (
                      paginatedContacts.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50">
                          {currentSort !== 'Pertinence' && (
                            <td className="w-8 p-3 bg-white">
                              <input
                                type="checkbox"
                                checked={selectedContacts.has(index)}
                                onChange={() => handleCheckboxChange(index)}
                                aria-label={`Select contact ${item.role} at ${item.entreprise}`}
                              />
                            </td>
                          )}
                          <td className="font-semibold text-gray-900 text-sm truncate max-w-[180px] p-3 bg-white">{item.role}</td>
                          <td className="w-24 text-center p-3 bg-white">
                            <div className="flex items-center justify-center gap-2">
                              <Eye className="w-5 h-5 cursor-pointer text-gray-500 hover:text-blue-600" onClick={() => { setSelectedContact(item); setShowContactModal(true); }} />
                              {item.website && (
                                <a href={item.website} target="_blank" rel="noopener noreferrer">
                                  <Globe className="w-5 h-5 cursor-pointer text-blue-600 hover:text-blue-800" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="flex items-center gap-2 min-w-0 p-3 bg-white">
                            {item.logo ? (
                              <img src={item.logo} alt={item.entreprise} className="w-8 h-8 rounded-lg object-cover border border-gray-200" />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <Building className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <span className="font-semibold text-blue-800 text-sm underline truncate cursor-pointer">{item.entreprise}</span>
                          </td>
                          <td className="w-24 text-center text-sm font-semibold text-[#E95C41] p-3 bg-white">-</td>
                          <td className="w-24 text-center text-sm text-gray-800 font-medium p-3 bg-white">-</td>
                          <td className="w-32 text-right text-sm text-blue-800 underline truncate p-3 bg-white">{item.address}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-gray-500 text-center">
                          <div className="flex flex-col items-center justify-center min-h-[200px] w-full mx-auto">
                            <style>{`
                              @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
                              .animate-spin-reverse { animation: spin-reverse 1s linear infinite; }
                            `}</style>
                            <div className="relative w-12 h-12 mb-2">
                              <div className="absolute inset-0 rounded-full border-4 border-orange-400 border-t-transparent animate-spin"></div>
                              <div className="absolute inset-2 rounded-full border-4 border-[#E95C41] border-b-transparent animate-spin-reverse"></div>
                            </div>
                            <span className="text-gray-500 mt-2">Chargement des contacts...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-80 flex-shrink-0">
          <RightPanel businesses={businessesToShow} />
        </div>
      </div>
    </>
  );
};

export default Contact;
