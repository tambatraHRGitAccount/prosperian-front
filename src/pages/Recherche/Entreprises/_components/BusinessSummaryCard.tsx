import React from "react";
import { Business } from "@entities/Business";

interface BusinessSummaryCardProps {
    totalBusinesses: number;
}

const BusinessSummaryCard: React.FC<BusinessSummaryCardProps> = ({ totalBusinesses }) => {
  return (
    <div className="hidden spec-xl:block p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-6 w-100 md:max-w-sm">
      <h1 className="text-xl font-bold text-gray-900">Entreprises</h1>
      <div className="flex items-center justify-between mt-6 font-bold">
        <h5>Total</h5>
        <div>{totalBusinesses.toLocaleString()}</div>
      </div>
    </div>
  );
};

export default BusinessSummaryCard;
