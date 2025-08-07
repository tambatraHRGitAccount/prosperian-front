import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ResponsiveSidebar } from "@shared/components/Sidebar/ResponsiveSidebar";
import { SecondaryNav } from "@shared/components/Header/SecondaryNav";
import { useFilterContext } from "@contexts/FilterContext";

export const SearchLayout: React.FC = () => {
  const location = useLocation();
  const { filters } = useFilterContext();
  
  // État pour contrôler la visibilité de la sidebar
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Détecter si on est sur la page export
  const isExportPage = location.pathname.includes('/recherche/export');

  // Masquer la sidebar sur mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* SubTopbar */}
      <SecondaryNav />
      {/* Content */}
      <div className="flex flex-col md:flex-row">
        {/* Filter Sidebar */}
        {showSidebar && !isExportPage && (
          <ResponsiveSidebar
            filters={filters}
            onFiltersChange={() => {}}
            availableCities={[]}
            availableLegalForms={[]}
            availableRoles={[]}
            employeeRange={[0, 5000]}
            revenueRange={[0, 1000000]}
            ageRange={[0, 50]}
            searchTerm={filters.searchTerm}
            activities={filters.activities}
            cities={filters.cities}
            legalForms={filters.legalForms}
            ratingRange={filters.ratingRange}
            roles={filters.roles}
            selectedList={filters.selectedList}
            onRemoveListFilter={() => {
              // Cette fonction sera gérée par la page Contact
              console.log('Retrait du filtre de liste demandé');
            }}
          />
        )}
        {/* Main Content */}
        <div className="flex flex-col spec-xl:flex-row flex-1">
          <Outlet />
        </div>
      </div>
    </>
  );
};
