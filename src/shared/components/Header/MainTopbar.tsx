import React, { useState } from "react";
import { Sun, BookOpen, MessageCircle, User, Menu, X, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSearchLayoutContext } from "@contexts/SearchLayoutContext";
import { useAuth } from "@contexts/AuthContext";

const NAV_ITEMS: { label: string; to: string }[] = [
  { label: "Recherche", to: "/recherche" },
  { label: "Enrichissement", to: "/enrichissement" },
  { label: "Surveillance", to: "#" },
  { label: "Veille", to: "#" },
];

export const MainTopbar: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const { setShowSidebar } = useSearchLayoutContext();
  const { user, isAuthenticated, logout } = useAuth();

  const handleSidebar = (href: string) => {
    if (href === "/recherche") {
      setShowSidebar(true);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="p-0">
        {/* First Navigation */}
        <div className="flex items-center justify-between main-topbar p-2">
          {/* Logo + Main links (desktop only) */}
          <div className="flex flex-row items-center gap-10">
            <div className="flex items-center space-x-2 ps-2">
              <span className="text-xl font-bold text-white">
                PROSPER<span className="text-[#E95C41]">IAN</span>
              </span>
            </div>
            <div className="hidden lg:flex items-center space-x-8 text-white">
              <MenuNavLinks pathname={pathname} handleSidebar={handleSidebar} />
            </div>
          </div>

          {/* Hamburger (mobile only) */}
          <button className="lg:hidden p-2 text-white" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>

          {/* Right‑side icons + button (desktop only) */}
          <div className="hidden lg:flex items-center space-x-4">
            <IconButtons />
          </div>
        </div>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setDrawerOpen(false)} />}

      {/* Drawer panel */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-64 main-topbar shadow-lg z-50
          transform transition-transform duration-300
          ${drawerOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="p-6 flex justify-end items-center">
          <button onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        <nav className="flex flex-col items-center space-y-6 mt-8">
          <MenuNavLinks vertical pathname={pathname} handleSidebar={handleSidebar} />
          <IconButtons vertical />
        </nav>
      </aside>
    </header>
  );
};

const MenuNavLinks: React.FC<{ vertical?: boolean; pathname: string; handleSidebar: (to: string) => void }> = ({
  vertical,
  pathname,
  handleSidebar,
}) => (
  <div className={vertical ? "flex flex-col items-center space-y-4" : "flex items-center space-x-8"}>
    <nav className={vertical ? "flex flex-col items-center space-y-4" : "flex items-center space-x-6"}>
      {NAV_ITEMS.map(({ label, to }) => {
        const isActive = pathname.startsWith(to);
        return (
          <Link
            key={label}
            to={to}
            className={`
              transition-colors
              ${isActive ? "text-[#E95C41]" : "text-white hover:text-[#E95C41]"}
            `}
            onClick={() => handleSidebar(to)}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  </div>
);

const IconButtons: React.FC<{ vertical?: boolean }> = ({ vertical }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={vertical ? "flex flex-col items-center space-y-4" : "flex items-center space-x-4"}>
      <button className="p-2 text-white hover:text-[#E95C41] transition-colors">
        <Sun className="w-5 h-5" />
      </button>
      <button className="p-2 text-white hover:text-[#E95C41] transition-colors">
        <BookOpen className="w-5 h-5" />
      </button>
      <button className="p-2 text-white hover:text-[#E95C41] transition-colors">
        <MessageCircle className="w-5 h-5" />
      </button>
      
      {isAuthenticated ? (
        <div className="flex items-center space-x-3">
          {/* Admin Link */}
          {user?.role === 'admin' && (
            <Link 
              to="/admin" 
              className="text-white hover:text-[#E95C41] transition-colors p-2"
              title="Dashboard Admin"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </Link>
          )}
          <button
            onClick={() => navigate('/profile')}
            className="text-white text-sm hover:text-[#E95C41] transition-colors cursor-pointer"
          >
            <span className="font-medium">
              {user?.prenom ? `${user.prenom} ${user.nom || ''}` : user?.email}
            </span>
          </button>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          className="bg-[#E95C41] hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <User className="w-4 h-4" />
          <span>Se connecter</span>
        </Link>
      )}
    </div>
  );
};
