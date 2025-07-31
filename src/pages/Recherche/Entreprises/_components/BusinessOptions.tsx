import React, { useState, useRef, useEffect } from "react";
import {
  Filter,
  Download,
  Plus,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as LayoutList,
} from "lucide-react";
import { Business } from "@entities/Business";
import ExportModalGlobal from "../../../../components/ExportModalGlobal";

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
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
  const deleteDropdownRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);

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

  // Fermer le dropdown de suppression si on clique en dehors
  useEffect(() => {
    if (!showDeleteDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      if (deleteDropdownRef.current && !deleteDropdownRef.current.contains(event.target as Node)) {
        setShowDeleteDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDeleteDropdown]);

  // Gestion dynamique des listes pour suppression
  const [deleteBusinessCardLists, setDeleteBusinessCardLists] = useState(exportBusinessCardLists);
  useEffect(() => {
    setDeleteBusinessCardLists(exportBusinessCardLists);
  }, [exportBusinessCardLists.length]);

  const handleSort = () => {
    const next = sortKey === "Pertinence" ? "Date" : "Pertinence";
    setSortKey(next);
    onSortChange(next);
  };

  const displayTotalItems = totalItems || businesses.length;

  const handlePrevPage = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNextPage = () => onPageChange(Math.min(currentPage + 1, totalPages));

  const selectedCount = selectedIds.length;

  return (
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
                    onExport();
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
          <div className="relative">
            <button
              onClick={() => setShowDeleteDropdown((v) => !v)}
              className="flex items-center border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-100 transition"
            >
              <Trash2 className="w-4 h-4 spec-xl:mr-2 text-gray-600" />
              <span className="hidden spec-xl:inline">Supprimer</span>
            </button>
            {showDeleteDropdown && (
              <div
                ref={deleteDropdownRef}
                className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-30 p-3"
              >
                {deleteBusinessCardLists.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm mb-3">Aucune liste à supprimer.</div>
                ) : (
                  <div className="mb-3">
                    {deleteBusinessCardLists.map((listName) => (
                      <div
                        key={listName}
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100 cursor-pointer text-gray-700 text-sm"
                      >
                        <span>{listName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.removeItem(`export_${listName}`);
                            setDeleteBusinessCardLists((prev) => prev.filter((n) => n !== listName));
                          }}
                          className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
                          aria-label={`Supprimer la liste ${listName}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                            <path
                              d="M6 6L14 14M14 6L6 14"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
  );
};

export default BusinessOptions;
