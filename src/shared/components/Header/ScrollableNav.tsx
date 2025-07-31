import React, { useRef, useState, useLayoutEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchLayoutContext } from "@contexts/SearchLayoutContext";
import { Link, useLocation } from "react-router-dom";

interface Links {
  label: string;
  href: string;
}

interface ScrollableNavProps {
  links: Links[];
  /** how many pixels to scroll per click */
  scrollOffset?: number;
}

export const ScrollableNav: React.FC<ScrollableNavProps> = ({ links, scrollOffset = 200 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { setShowSidebar } = useSearchLayoutContext();
  const { pathname } = useLocation();

  // update whether we have overflow on each side
  const updateScrollState = () => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
  };

  // run after DOM measurements
  useLayoutEffect(() => {
    updateScrollState();
    const el = containerRef.current;
    el?.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      el?.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const scrollBy = (offset: number) => containerRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  const normalizedHref = pathname === "/recherche" ? "/recherche/entreprises" : pathname;

  const handleSidebar = (href: string) => {
    if (href !== "/recherche/entreprises" && href !== "/recherche/contact") {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
    }
  };

  return (
    <div className="relative w-full">
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-scrollOffset)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white rounded-full shadow"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}

      <div
        ref={containerRef}
        className="w-full overflow-x-auto whitespace-nowrap scroll-smooth no-scrollbar py-0 lg:py-1 flex justify-start"
      >
        {links.map(({ label, href }) => {
          const isActive = href === normalizedHref;
          return (
            <Link
              key={href}
              to={href}
              className={`
              inline-block px-2 transition-colors
              ${isActive ? "text-[#E95C41]" : "text-common-blue"}
              hover:text-[#E95C41] active:text-[#E95C41]`}
              onClick={() => handleSidebar(href)}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scrollBy(scrollOffset)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white rounded-full shadow"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
};
