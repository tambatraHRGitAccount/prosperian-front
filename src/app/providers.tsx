import React from "react";
import { BrowserRouter } from "react-router-dom";
import { SearchLayoutProvider } from "@contexts/SearchLayoutContext";
import { AuthProvider } from "@contexts/AuthContext";
import { FilterProvider } from "@contexts/FilterContext";

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchLayoutProvider>
          <FilterProvider>
            {children}
          </FilterProvider>
        </SearchLayoutProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
