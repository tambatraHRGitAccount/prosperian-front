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
import {
  getSelectedContactsCount,
  setSelectedContactsCount,
  resetSelectedContactsCount,
  getSelectedEnterprisesCount,
} from "../../../../utils/localStorageCounters";
import ExportModalGlobal from "../../../../components/ExportModalGlobal";

export interface ContactOptionsProps {
  currentLimit: number;
  onLimitChangeClick: () => void;
  showLimitInput: boolean;
  limitInputValue: string;
  onSetLimit: (n: number) => void;
  onCancelLimit: () => void;
  currentSort: string;
  onSortChange: (value: string) => void;
  selectedCount: number;
  onExportClick: () => void;
  showExportModal: boolean;
  onExportConfirm: () => void;
  onExportClose: () => void;
  filteredTotal: number;
  pageStart: number;
  pageEnd: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  layout: "list" | "grid";
  setLayout: (layout: "list" | "grid") => void;
}

const ContactOptions: React.FC<ContactOptionsProps> = ({
  currentLimit,
  onLimitChangeClick,
  showLimitInput,
  limitInputValue,
  onSetLimit,
  onCancelLimit,
  currentSort,
  onSortChange,
  selectedCount,
  onExportClick,
  showExportModal,
  onExportConfirm,
  onExportClose,
  filteredTotal,
  pageStart,
  pageEnd,
  onPrevPage,
  onNextPage,
  layout,
  setLayout,
}) => {
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const [itemsInput, setItemsInput] = useState(currentLimit.toString());
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);
  const [storedContactsCount, setStoredContactsCount] = useState(0);
  const [storedEnterprisesCount, setStoredEnterprisesCount] = useState(0);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());

  // Charger le compteur depuis localStorage au montage
  useEffect(() => {
    const contactsCount = getSelectedContactsCount();
    const enterprisesCount = getSelectedEnterprisesCount();
    setStoredContactsCount(isNaN(contactsCount) ? 0 : contactsCount);
    setStoredEnterprisesCount(isNaN(enterprisesCount) ? 0 : enterprisesCount);
  }, []);

  // Mettre à jour le localStorage quand selectedContacts change
  useEffect(() => {
    const count = selectedContacts.size;
    setSelectedContactsCount(count);
    setStoredContactsCount(count);
  }, [selectedContacts.size]);

  // click outside handlers
  useEffect(() => {
    function outside(e: MouseEvent) {
      if (addRef.current && !addRef.current.contains(e.target as Node)) setShowAddDropdown(false);
    }
    if (showAddDropdown) document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [showAddDropdown]);
  useEffect(() => {
    function outside(e: MouseEvent) {
      if (deleteRef.current && !deleteRef.current.contains(e.target as Node)) setShowDeleteDropdown(false);
    }
    if (showDeleteDropdown) document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [showDeleteDropdown]);

  const totalPages = Math.ceil(filteredTotal / currentLimit);

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col spec-xs:flex-row justify-between items-center w-full space-y-3 spec-xs:space-y-0">
        {/* 1st group */}
        <div className="flex spec-xs:self-start justify-evenly spec-xs:justify-between items-center space-x-2 w-auto">
          {/* Limit dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowItemsDropdown((v) => !v)}
              className="flex items-center border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-100 transition"
            >
              <Filter className="w-4 h-4 text-gray-600 mr-2" />
              <span className="text-sm text-gray-600">{currentLimit}</span>
              <ChevronDown className="w-4 h-4 text-gray-600 ml-2" />
            </button>
            {showItemsDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-20 p-3">
                <label className="block text-sm text-gray-700 mb-2">Résultats par page :</label>
                <input
                  type="number"
                  min={1}
                  value={itemsInput}
                  onChange={(e) => setItemsInput(e.target.value.replace(/[^0-9]/g, ""))}
                  onBlur={() => onSetLimit(Number(itemsInput) || currentLimit)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => (selectedCount > 0 ? onExportClick() : null)}
              className={`flex items-center px-3 py-2 rounded-md transition ${
                selectedCount > 0
                  ? "bg-[#E95C41] text-white hover:bg-orange-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Download className="w-4 h-4 spec-xl:mr-2" />
              <span className="text-sm hidden spec-xl:inline">Exporter</span>
            </button>
            {showExportModal && (
              <ExportModalGlobal
                mode="contact"
                selectedCount={selectedCount}
                statsEntreprise={{ total: 0 }}
                selectedEntrepriseListsCount={storedEnterprisesCount} // Nombre d'entreprises sélectionnées depuis localStorage
                selectedContactListsCount={storedContactsCount} // Nombre de contacts sélectionnés depuis localStorage
                statsContact={{
                  total: 0,
                  entreprises: 0,
                  contactsDirectEmail: 0,
                  contactsDirectLinkedin: 0,
                  contactsGeneriquesTel: 0,
                }}
                onClose={onExportClose}
                onExport={onExportConfirm}
              />
            )}
          </div>
        </div>

        {/* 2nd group */}
        <div className="flex flex-col sm:flex-row md:flex-col spec-md:flex-row spec-xl:flex-col items-end sm:items-center spec-xl:items-end gap-3 spec-2xl:flex-row spec-2xl:items-center space-x-2 w-auto">
          <div className="flex flex-row items-center">
            {/* Sort button visible on xl */}
            <select
              value={currentSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="hidden spec-xl:flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700 text-sm hover:bg-gray-100 transition"
            >
              <option value="Pertinence">Pertinence</option>
              <option value="Entreprise">Entreprise</option>
              <option value="Role">Role</option>
            </select>

            {/* Layout toggles */}
            <div className="ml-2">
              <button
                onClick={() => setLayout("list")}
                className={`p-2 border rounded-md transition ${
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
          {/* Pagination */}
          <div className="flex justify-end items-center space-x-2 text-gray-700">
            <button onClick={onPrevPage} disabled={pageStart === 1} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm text-gray-700">
              {pageStart}–{pageEnd} sur {filteredTotal}
            </span>
            <button onClick={onNextPage} disabled={pageEnd >= filteredTotal} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactOptions;
