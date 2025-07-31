import { Outlet } from "react-router-dom";
import { MainTopbar } from "@shared/components/Header/MainTopbar";

export const MainLayout: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <MainTopbar />
    <div className="flex-1">
      <Outlet />
    </div>
  </div>
);
