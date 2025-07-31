import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchLayoutContextType {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
}

const SearchLayoutContext = createContext<SearchLayoutContextType | undefined>(undefined);

export const SearchLayoutProvider = ({ children }: { children: ReactNode }) => {
    const [showSidebar, setShowSidebar] = useState(true);

    return (
        <SearchLayoutContext.Provider value={{showSidebar, setShowSidebar}}>
            {children}
        </SearchLayoutContext.Provider>
    );
};

export const useSearchLayoutContext = () => {
    const context = useContext(SearchLayoutContext);
    if (!context) {
        throw new Error('useSearchLayoutContext must be used within a SearchLayoutProvider');
    }
    return context;
};