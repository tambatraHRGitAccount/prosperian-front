import React, { useState, useRef, useEffect } from "react";
import {
  Filter,
  Download,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as LayoutList,
  X,
  Building,
} from "lucide-react";
import { Business } from "@entities/Business";
import ExportModalGlobal from "../../../../components/ExportModalGlobal";
import { ListService } from "@services/listService";
import ProntoListModal from "../../../../components/ProntoListModal";
import ProntoListsViewer from "../../../../components/ProntoListsViewer";
import { ProntoService, ProntoListRequest } from "@services/prontoService";

export interface BusinessOptionsProps {
  businesses: Business[];
  currentPage: number;
  itemsPerPage: number;
  start: number;
  end: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  onExport?: () => void;
  onDelete?: () => void;
  onSortChange?: (sortKey: string) => void;
  layout: 'list' | 'grid';
  setLayout: (layout: 'list' | 'grid') => void;
  selectedIds: number[]; // <-- Ajout de la prop
  storedEnterprisesCount?: number; // Compteur depuis localStorage
  storedContactsCount?: number; // Compteur contacts depuis localStorage
}

const BusinessOptions: React.FC<BusinessOptionsProps> = ({
  businesses,
  currentPage,
  itemsPerPage,
  start,
  end,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  onItemsPerPageChange,
  onExport = () => {},
  onSortChange = () => {},
  layout,
  setLayout,
  selectedIds = [], // valeur par défaut ajoutée
  storedEnterprisesCount = 0, // valeur par défaut ajoutée
  storedContactsCount = 0, // valeur par défaut ajoutée
}) => {
  // Récupérer les exports BusinessCard (base64 string, pas JSON)
  const exportBusinessCardLists = Object.keys(localStorage)
    .filter((key) => key.startsWith("export_"))
    .map((key) => {
      const value = localStorage.getItem(key);
      if (value && value[0] !== "{") return key.replace("export_", "");
      return null;
    })
    .filter((key): key is string => key !== null);

  const [sortKey, setSortKey] = useState("Pertinence");
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(itemsPerPage.toString());
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const addDropdownRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // États pour le modal de nommage de liste
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [listName, setListName] = useState("");
  const [listNameError, setListNameError] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);

  // États pour le modal Pronto
  const [showProntoListModal, setShowProntoListModal] = useState(false);
  const [showProntoListsViewer, setShowProntoListsViewer] = useState(false);

  // Fonction pour créer une liste Pronto
  const handleCreateProntoList = async (data: ProntoListRequest) => {
    try {
      const result = await ProntoService.createCompanyList(data);
      console.log('✅ Liste Pronto créée avec succès:', result);

      // Afficher un message de succès (vous pouvez utiliser un toast ou une notification)
      alert(`Liste "${result.list.name}" créée avec succès avec ${result.list.companies_count} entreprise(s)!`);

      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la création de la liste Pronto:', error);
      throw error;
    }
  };

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    if (!showAddDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target as Node)) {
        setShowAddDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddDropdown]);



  const handleSort = () => {
    const next = sortKey === "Pertinence" ? "Date" : "Pertinence";
    setSortKey(next);
    onSortChange(next);
  };

  const displayTotalItems = totalItems || businesses.length;

  const handlePrevPage = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNextPage = () => onPageChange(Math.min(currentPage + 1, totalPages));

  const selectedCount = selectedIds.length;

  // Fonction pour récupérer les entreprises sélectionnées
  const getSelectedBusinesses = () => {
    if (selectedCount === 0) {
      // Si aucune entreprise n'est sélectionnée, retourner un tableau vide
      return [];
    } else {
      // Filtrer les entreprises selon les IDs sélectionnés
      // Les selectedIds correspondent aux SIREN des entreprises
      return businesses.filter(business =>
        selectedIds.includes(Number(business.siren))
      );
    }
  };

  // Fonction pour gérer la création de liste
  const handleCreateList = async () => {
    // Validation du nom de liste
    if (!listName.trim()) {
      setListNameError("Le nom de la liste est requis");
      return;
    }
    
    if (listName.trim().length < 2) {
      setListNameError("Le nom de la liste doit contenir au moins 2 caractères");
      return;
    }

    // Vérifier si le nom existe déjà
    const existingLists = Object.keys(localStorage)
      .filter((key) => key.startsWith("export_"))
      .map((key) => key.replace("export_", ""));
    
    if (existingLists.includes(listName.trim())) {
      setListNameError("Une liste avec ce nom existe déjà");
      return;
    }

    setIsCreatingList(true);
    try {
      const selectedBusinesses = getSelectedBusinesses();
      
      // Appeler l'API pour créer la liste
      const createdList = await ListService.createListFromSelection(
        listName.trim(),
        selectedBusinesses
      );

      console.log('✅ Liste créée avec succès:', createdList);
      
      // Fermer le modal et réinitialiser
      setShowCreateListModal(false);
      setListName("");
      setListNameError("");
      
      // Optionnel : afficher un message de succès
      alert(`Liste "${listName}" créée avec succès ! Elle contient ${createdList.elements} entreprise(s).`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de la liste:', error);
      setListNameError("Erreur lors de la création de la liste. Veuillez réessayer.");
    } finally {
      setIsCreatingList(false);
    }
  };

  // Fonction pour fermer le modal
  const handleCloseCreateListModal = () => {
    setShowCreateListModal(false);
    setListName("");
    setListNameError("");
  };

  return (
    <>
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        {/* Top row: left buttons / right filters + layout toggles */}
        <div className="flex flex-col spec-xs:flex-row justify-between items-center w-full space-y-3 spec-xs:space-y-0">
          {/* 1st group */}
          <div className="flex spec-xs:self-start justify-evenly spec-xs:justify-between items-center space-x-2 w-auto">
            <div className="relative">
              <button
                onClick={() => {
                  setShowItemsDropdown((v) => !v);
                  setInputValue(itemsPerPage.toString());
                }}
                className="flex items-center border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-100 transition"
              >
                <Filter className="w-4 h-4 mr-2 text-gray-600" />
                <ChevronDown className="w-4 h-4 ml-2 text-gray-600" />
              </button>
              {showItemsDropdown && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-20 p-3 flex flex-col items-center">
                  <label className="block text-sm text-gray-700 mb-2">Nombre de résultats à afficher :</label>
                  <input
                    type="number"
                    min={1}
                    value={inputValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setInputValue(val);
                      const n = Math.max(1, parseInt(val, 10) || 1);
                      onItemsPerPageChange(n);
                    }}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col items-start">
              <button
                onClick={() => {
                  if (selectedCount === 0) {
                    setShowExportModal(false);
                  } else {
                    setShowExportModal(true);
                  }
                }}
                className="flex items-center bg-[#E95C41] hover:bg-orange-600 text-white 
                     rounded-md px-3 py-2 transition"
              >
                <Download className="w-4 h-4 spec-xl:mr-2" />
                <span className="hidden spec-xl:inline">Exporter</span>
              </button>
              {showExportModal && (
                <ExportModalGlobal
                  mode="entreprise"
                  selectedCount={selectedCount}
                  statsEntreprise={{ total: displayTotalItems }} // Use the same total as BusinessSummaryCard
                  statsContact={{
                    total: 12224982,
                    entreprises: 1149984,
                    contactsDirectEmail: 6684902,
                    contactsDirectLinkedin: 11914156,
                    contactsGeneriquesTel: 620018,
                  }}
                  selectedEntrepriseListsCount={storedEnterprisesCount} // Nombre d'entreprises sélectionnées depuis localStorage
                  selectedContactListsCount={storedContactsCount} // Nombre de contacts sélectionnés depuis localStorage
                  onClose={() => setShowExportModal(false)}
                  onExport={onExport}
                />
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowAddDropdown((v) => !v)}
                className="flex items-center border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-100 transition"
              >
                <Plus className="w-4 h-4 spec-xl:mr-2 text-gray-600" />
                <span className="hidden spec-xl:inline">Ajouter</span>
              </button>
              {showAddDropdown && (
                <div
                  ref={addDropdownRef}
                  className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-30 p-3"
                >
                  <input
                    type="text"
                    placeholder="Nom de liste..."
                    className="w-full mb-2 px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50"
                  />
                  {exportBusinessCardLists.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm mb-3">Aucune liste trouvée.</div>
                  ) : (
                    <div className="mb-3">
                      {exportBusinessCardLists.map((listName) => (
                        <div
                          key={listName}
                          className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer text-gray-700 text-sm"
                          onClick={() => {
                            const base64 = localStorage.getItem(`export_${listName}`);
                            if (!base64) return;
                            const csv = decodeURIComponent(escape(atob(base64)));
                            const lines = csv.split("\n").filter(Boolean);
                            const businesses = lines.slice(1).map((line) => {
                              const values = line
                                .replace(/\r/g, "")
                                .split(",")
                                .map((v) => v.replace(/"/g, "").trim());
                              return {
                                id: Math.random().toString(36).substr(2, 9),
                                name: values[0] || "",
                                activity: values[1] || "",
                                city: values[2] || "",
                                address: values[3] || "",
                                postalCode: values[4] || "",
                                phone: values[5] || "",
                                legalForm: values[6] || "",
                                description: values[7] || "",
                                foundedYear: values[8] ? Number(values[8]) : undefined,
                                employeeCount: values[9] ? Number(values[9]) : undefined,
                                revenue: values[10] ? Number(values[10]) : undefined,
                              };
                            });
                            window.dispatchEvent(new CustomEvent("updateBusinessList", { detail: businesses }));
                            window.dispatchEvent(new CustomEvent("updateBusinessListShowCheckbox", { detail: true }));
                            setShowAddDropdown(false);
                          }}
                        >
                          {listName}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className="w-full flex items-center justify-between px-3 py-2 mb-2 bg-gray-100 rounded text-gray-700 font-medium hover:bg-gray-200"
                    onClick={() => {
                      setShowAddDropdown(false);
                      setShowCreateListModal(true);
                    }}
                  >
                    Créer une liste
                    <span className="ml-2">
                      <svg width="18" height="18" fill="none">
                        <rect width="18" height="18" rx="2" fill="#E5E7EB" />
                        <path d="M9 5v8M5 9h8" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                  <button className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 rounded text-gray-700 font-medium hover:bg-gray-200">
                    Voir toutes mes listes
                    <span className="ml-2">
                      <svg width="18" height="18" fill="none">
                        <rect width="18" height="18" rx="2" fill="#E5E7EB" />
                        <path d="M7 9l4 0M11 9l-2-2M11 9l-2 2" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProntoListModal(true)}
                className="flex items-center border border-blue-300 bg-blue-50 rounded-md px-3 py-2 hover:bg-blue-100 transition text-blue-700"
                title="Créer une liste Pronto avec les entreprises sélectionnées"
              >
                <Building className="w-4 h-4 spec-xl:mr-2" />
                <span className="hidden spec-xl:inline">Créer</span>
              </button>

              {/* <button
                onClick={() => setShowProntoListsViewer(true)}
                className="flex items-center border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-100 transition text-gray-700"
                title="Voir les listes Pronto existantes"
              >
                <Building className="w-4 h-4 spec-xl:mr-2" />
                <span className="hidden spec-xl:inline">Listes</span>
              </button> */}
            </div>
          </div>

          {/* 2nd group */}
          <div className="flex flex-col sm:flex-row md:flex-col spec-md:flex-row spec-xl:flex-col items-end sm:items-center spec-xl:items-end gap-3 spec-2xl:flex-row spec-2xl:items-center space-x-2 w-auto">
            <div className="flex flex-row items-center">
              {/* First button */}
              <button
                onClick={handleSort}
                className="hidden spec-xl:block border border-gray-300 rounded-md px-3 py-2
                   hover:bg-gray-100 transition"
              >
                Trier : {sortKey}
              </button>

              {/* Push the last two all the way to the right */}
              <div className="ml-2">
                <button
                  onClick={() => setLayout("list")}
                  className={`ml-auto p-2 border rounded-md transition ${
                    layout === "list" ? "bg-[#E95C41] text-white" : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <LayoutList className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setLayout("grid")}
                  className={`p-2 border rounded-md transition ${
                    layout === "grid" ? "bg-[#E95C41] text-white" : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex justify-end items-center space-x-2 text-gray-700">
              <button onClick={handlePrevPage} disabled={currentPage === 1} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm">
                {start}–{end} sur {displayTotalItems}
              </span>
              <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de création de liste */}
      {showCreateListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Créer une nouvelle liste</h3>
              <button
                onClick={handleCloseCreateListModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isCreatingList}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="listName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la liste
                </label>
                <input
                  type="text"
                  id="listName"
                  value={listName}
                  onChange={(e) => {
                    setListName(e.target.value);
                    if (listNameError) setListNameError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isCreatingList) {
                      handleCreateList();
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                    listNameError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Entrez le nom de votre liste..."
                  autoFocus
                  disabled={isCreatingList}
                />
                {listNameError && (
                  <p className="mt-1 text-sm text-red-600">{listNameError}</p>
                )}
              </div>

              <div className="text-sm text-gray-600 mb-6">
                Cette liste contiendra {selectedCount > 0 ? selectedCount : businesses.length} entreprise(s).
                {selectedCount === 0 && (
                  <span className="text-orange-600 font-medium"> (Toutes les entreprises de la page courante)</span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseCreateListModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isCreatingList}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateList}
                disabled={isCreatingList || !listName.trim()}
                className="px-4 py-2 bg-[#E95C41] text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreatingList && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isCreatingList ? 'Création...' : 'Créer la liste'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pronto pour créer une liste */}
      <ProntoListModal
        isOpen={showProntoListModal}
        onClose={() => setShowProntoListModal(false)}
        onSubmit={handleCreateProntoList}
        selectedBusinesses={getSelectedBusinesses()}
      />

      {/* Viewer des listes Pronto existantes */}
      <ProntoListsViewer
        isOpen={showProntoListsViewer}
        onClose={() => setShowProntoListsViewer(false)}
      />
    </>
  );
};

export default BusinessOptions;
