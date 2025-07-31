import React, { useState } from "react";
import { Search, Filter, Download, MapPin, Building } from "lucide-react";
import { BusinessCard } from "./BusinessCard";
import { EntrepriseApiResult } from "@entities/Business";
import BusinessOptions from "./BusinessOptions";
import BusinessSummaryCard from "./BusinessSummaryCard";
import { useNavigate } from 'react-router-dom';

export interface MainContentProps {
  businesses: EntrepriseApiResult[];
  totalBusinesses: number;
  showCheckbox?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  currentPage?: number;
  totalPages?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  businesses, 
  totalBusinesses,
  showCheckbox,
  loading = false,
  error = null,
  onRetry,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 12,
  onPageChange,
  onItemsPerPageChange
}) => {
  const navigate = useNavigate();
  const [layout, setLayout] = useState<'list' | 'grid'>('grid'); // Par défaut grid
  const [selectedBusinesses, setSelectedBusinesses] = useState<Set<string>>(new Set());

  const total = businesses.length;
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalBusinesses);

  // Pagination, export, etc. peuvent être adaptés ici si besoin

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto">
        <BusinessSummaryCard businesses={businesses} totalBusinesses={totalBusinesses} />
        <BusinessOptions
          businesses={businesses}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          start={start}
          end={end}
          totalPages={totalPages}
          totalItems={totalBusinesses}
          onPageChange={onPageChange || (() => {})}
          layout={layout}
          setLayout={setLayout}
          onItemsPerPageChange={onItemsPerPageChange || (() => {})}
          onExport={() => {}}
          selectedIds={Array.from(selectedBusinesses).map(id => Number(id))}
        />
        {loading && (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <style>{`
              @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
              .animate-spin-reverse { animation: spin-reverse 1s linear infinite; }
            `}</style>
            <div className="relative w-12 h-12 mb-2">
              <div className="absolute inset-0 rounded-full border-4 border-orange-400 border-t-transparent animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-[#E95C41] border-b-transparent animate-spin-reverse"></div>
            </div>
            <span className="ml-2 text-gray-600">Chargement des entreprises...</span>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-800">Erreur: {error}</p>
            {onRetry && (
              <button 
                onClick={onRetry}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Réessayer
              </button>
            )}
          </div>
        )}
        {!loading && !error && businesses.length > 0 && (
          <>
            {layout === 'list' && (
              <table className="min-w-full bg-white rounded-lg border border-gray-200 max-h-[calc(100vh-12rem)] overflow-y-auto">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                    <th className="px-2 py-2"></th>
                    <th className="px-2 py-2"></th>
                    <th className="px-2 py-2 text-left">Nom</th>
                    <th className="px-2 py-2 text-center">Contacts</th>
                    <th className="px-2 py-2 text-center">Employés</th>
                    <th className="px-2 py-2 text-center">CA</th>
                    <th className="px-2 py-2 text-right">Adresse</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((business, idx) => (
                    <BusinessCard
                      key={`${business.siren}-${idx}`}
                      company={business}
                      id={Number(business.siren)}
                      showCheckbox
                      checked={selectedBusinesses.has(business.siren)}
                      onCheckboxChange={() => {}}
                      isProntoData={false}
                      loading={loading}
                    />
                  ))}
                </tbody>
              </table>
            )}
            {layout === 'grid' && (
              <div className={
                'grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[calc(100vh-12rem)] overflow-y-auto'
              }>
                {businesses.map((business, idx) => (
                  <BusinessCard key={`${business.siren}-${idx}`} company={business} isProntoData={false} loading={loading} />
                ))}
              </div>
            )}
          </>
        )}
        {!loading && !error && businesses.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Building className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune entreprise trouvée</h3>
              <p className="text-gray-600 mb-6">
                Aucune entreprise ne correspond aux critères sélectionnés. Essayez d'ajuster les filtres.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
