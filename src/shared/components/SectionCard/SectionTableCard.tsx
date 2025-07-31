import React from "react";

export interface SectionTableCardProps {
  title: string;
  columns: string[];
  items: React.ReactNode[][];
  showExport?: boolean;
  emptyMessage?: string;
  onExportSelect?: (format: "csv" | "xlsx") => void;
  loading?: boolean;
}

export const SectionTableCard: React.FC<SectionTableCardProps> = ({
  title,
  columns,
  items,
  showExport = true,
  emptyMessage = "Aucune donnée disponible.",
  onExportSelect,
  loading = false,
}) => {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onExportSelect?.(e.target.value as "csv" | "xlsx");
  };
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Header: titre + export */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold inline-block pb-2 relative">
          {title}
          <span className="absolute left-0 bottom-0 w-[50px] h-0.5 bg-[#E95C41]" />
        </h2>

        {showExport && (
          <select
            onChange={handleSelectChange}
            className="inline-flex items-center bg-gray-100 text-sm font-medium py-2 px-4 rounded appearance-none"
            defaultValue="csv"
          >
            <option value="csv">Exporter en CSV</option>
            <option value="xlsx">Exporter en XLSX</option>
          </select>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
              {columns.map((col, i) => (
                <th key={i} className="pb-3">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-sm text-gray-600">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-2"></div>
                    Chargement...
                  </div>
                </td>
              </tr>
            ) : items.length > 0 ? (
              items.map((row, r) => (
                <tr key={r} className="border-t">
                  {row.map((cell, c) => (
                    <td key={c} className="py-4 text-sm">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-sm text-gray-600">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SectionTableCard;
