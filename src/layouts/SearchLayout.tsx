import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useFilterContext } from "@contexts/FilterContext";
import { SecondaryNav } from "@shared/components/Header/SecondaryNav";
import { ResponsiveSidebar } from "@shared/components/Sidebar/ResponsiveSidebar";
import { FilterState } from "@entities/Business";
import { useSearchLayoutContext } from "@contexts/SearchLayoutContext";

export const SearchLayout: React.FC = () => {
  const location = useLocation();
  const isExportPage = location.pathname.includes("/recherche/export");
  const {
    filters,
    setFilters,
    availableActivities,
    availableCities,
    availableLegalForms,
    availableRoles,
    employeeRange,
    revenueRange,
    ageRange,
    handleSearchChange,
  } = useFilterContext();

  const { showSidebar } = useSearchLayoutContext();

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

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
            onFiltersChange={handleFiltersChange}
            availableCities={availableCities}
            availableLegalForms={availableLegalForms}
            availableRoles={availableRoles}
            employeeRange={employeeRange}
            revenueRange={revenueRange}
            ageRange={ageRange}
            searchTerm={filters.searchTerm}
            activities={filters.activities}
            cities={filters.cities}
            legalForms={filters.legalForms}
            ratingRange={filters.ratingRange}
            roles={filters.roles}
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
