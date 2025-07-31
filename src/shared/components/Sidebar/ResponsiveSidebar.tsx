// In ResponsiveSidebar.tsx
import React, { useState } from "react";
import { Filter } from "lucide-react";
import { Sidebar as DesktopSidebar } from "./Sidebar";
import { FiltersPanel, FiltersPanelProps } from "./FiltersPanel";

export const ResponsiveSidebar: React.FC<FiltersPanelProps> = (props) => {
  const [showMobile, setShowMobile] = useState(false);

  return (
    <>
      {/* Desktop: show full sidebar from md+ */}
      <div className="hidden md:block">
        <DesktopSidebar {...props} />
      </div>

      {/* Mobile: show only the Filters button */}
      <div className="md:hidden p-4">
        <button
          onClick={() => setShowMobile(show => !show)}
          className="relative w-full rounded-3xl bg-white px-4 py-3 shadow text-center"
        >
          <span className="font-medium text-[#E95C41]">Filtres</span>
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E95C41]" />
        </button>
      </div>

      {/* Mobile drawer */}
      {showMobile && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-4 space-y-4">
            <FiltersPanel {...props} />
          </div>
          <div className="p-4">
            <button
              onClick={() => setShowMobile(false)}
              className="w-full rounded-3xl bg-[#E95C41] py-3 text-white font-medium shadow"
            >
              Voir les résultats
            </button>
          </div>
        </div>
      )}
    </>
  );
};