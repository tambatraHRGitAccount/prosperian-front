import React from "react";
import { Building2, Users } from "lucide-react";

interface ExportModalProps {
  onClose: () => void;
  selectedContacts?: number;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, selectedContacts = 2 }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-0 relative">
        {/* Close button */}
        <button
          className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>
        {/* Titre */}
        <h2 className="text-[24px] font-semibold text-center mt-8 mb-2">Exporter les résultats</h2>
        {/* Sous-titre */}
        <div className="text-center text-[15px] text-gray-700 mb-6">
          Vous avez sélectionné <span className="font-bold">{selectedContacts} contact(s)</span>.<br />
          <span className="font-bold text-[15px] text-orange-600">Attention</span>, si vous souhaitez exporter des entreprises, vous allez exporter la totalité des entreprises trouvées.<br />
          Pour voir les résultats d'entreprises, allez sur la vue <span className="font-bold">Entreprises</span> en <a href="#" className="text-orange-600 underline">cliquant ici</a>.
        </div>
        {/* Colonnes */}
        <div className="flex flex-col sm:flex-row gap-4 px-6 mb-7">
          {/* Entreprises */}
          <div className="flex-1 border border-gray-200 rounded-xl bg-white flex flex-col items-center py-6 min-w-[240px]">
            <div className="flex flex-col items-center mb-2">
              <div className="bg-gray-100 rounded-full p-3 mb-2">
                <Building2 className="w-7 h-7 text-gray-400" />
              </div>
              <span className="font-semibold text-gray-700 text-[17px]">Exporter des entreprises</span>
            </div>
            <div className="mt-6 text-center">
              <div className="text-[15px] text-gray-500 mb-1">Entreprises</div>
              <div className="text-[26px] font-bold tracking-tight">12 416 180</div>
            </div>
          </div>
          {/* Contacts */}
          <div className="flex-1 border-2 border-green-400 rounded-xl bg-white flex flex-col items-center py-6 min-w-[240px] relative">
            {/* Check vert */}
            <span className="absolute top-3 right-4 bg-white rounded-full border-2 border-green-400 p-1">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="10" stroke="#22C55E" strokeWidth="2" fill="#fff"/><path d="M7 11.5L10 14.5L15 9.5" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="flex flex-col items-center mb-2">
              <div className="bg-green-100 rounded-full p-3 mb-2">
                <Users className="w-7 h-7 text-green-500" />
              </div>
              <span className="font-semibold text-gray-700 text-[17px]">Exporter des contacts</span>
            </div>
            <div className="mt-2 text-center w-full">
              <div className="text-[15px] text-gray-500 mb-1">Sélectionnés</div>
              <div className="text-[26px] font-bold text-orange-600 mb-2">{selectedContacts}</div>
              <div className="flex flex-col gap-1 text-[13px] text-gray-600 w-full">
                <div className="flex items-center justify-center gap-1">
                  <span>Contacts <span className="italic">(estimés)</span></span>
                  <svg width="16" height="16" fill="none" className="inline ml-1"><circle cx="8" cy="8" r="8" fill="#E5E7EB"/><text x="8" y="12" textAnchor="middle" fontSize="10" fill="#6B7280">i</text></svg>
                  <span className="font-bold ml-1">12 224 982</span>
                </div>
                <div className="text-gray-500">dans <span className="font-bold">1 149 984</span> entreprises</div>
                <div className="mt-2 font-bold">Contacts directs</div>
                <div className="flex flex-col text-gray-500">
                  <span>6 684 902 avec Email</span>
                  <span>11 914 156 avec LinkedIn</span>
                </div>
                <div className="mt-2 font-bold">Contacts génériques</div>
                <div className="text-gray-500">620 018 avec téléphone</div>
              </div>
            </div>
          </div>
        </div>
        {/* Paramètres */}
        <div className="px-6 mb-7">
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700 text-[15px]">Paramètres</span>
            <div className="flex items-center ml-6">
              <span className="text-[14px] text-gray-500 mr-2">Le repousseur contacts est désactivé</span>
              {/* Switch désactivé */}
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input type="checkbox" className="sr-only peer" disabled />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 transition-all"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white border border-gray-300 rounded-full transition-all"></div>
              </label>
            </div>
          </div>
        </div>
        {/* Boutons */}
        <div className="flex justify-end gap-4 px-6 pb-7">
          <button
            className="px-5 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 text-[15px] font-medium"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            className="px-5 py-2 rounded bg-[#E95C41] text-white font-semibold text-[15px] hover:bg-orange-600 shadow-sm"
          >
            Lancer l'export des contacts
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal; 