import React from "react";
import { ChevronDown } from "lucide-react";

type MainContentProps = Record<string, never>

const roles = [
  {
    role: "Président du directoire",
    sub: "Président du conseil de surveillance | Directeur a…",
    company: "TRICOTAGE DES VOSGES",
  },
  {
    role: "Mandataire / Direction Générale",
    sub: "Président du conseil de surveillance | Directeur a…",
    company: "TRICOTAGE DES VOSGES",
  },
  {
    role: "Directeur / Commerce",
    sub: "Directeur régional des ventes",
    company: "TRICOTAGE DES VOSGES",
  },
  {
    role: "Directeur / Commerce",
    sub: "Directeur commercial",
    company: "TRICOTAGE DES VOSGES",
  },
  {
    role: "Directeur",
    sub: "Directeur de production",
    company: "TRICOTAGE DES VOSGES",
  },
  {
    role: "Responsable / Informatique",
    sub: "Responsable informatique",
    company: "TRICOTAGE DES VOSGES",
  },
  {
    role: "Responsable / Production et Logistique",
    sub: "Responsable production",
    company: "TRICOTAGE DES VOSGES",
  },
];

const jobTypes = [
  { name: "Direction G…", value: 1500000 },
  { name: "Commerce", value: 1000000 },
  { name: "Informatique", value: 491400 },
  { name: "Administration", value: 438200 },
  { name: "Ressources…", value: 378900 },
  { name: "Production…", value: 330800 },
  { name: "Marketing", value: 319400 },
  { name: "Autre", value: 172900 },
  { name: "Achats", value: 159600 },
  { name: "Autre", value: 158600 },
];

const levels = [
  { name: "Collaborateur", value: 4700000 },
  { name: "Responsable", value: 3000000 },
];

export const MainContent: React.FC<MainContentProps> = () => {
  return (
    <div className="p-4 space-y-4">
      {/* Top stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white shadow p-4 rounded">
          <p className="text-sm font-medium text-gray-500">Total Contacts</p>
          <p className="text-xl font-bold">11 658 710</p>
          <p className="text-sm text-gray-400">Entreprises: 1 180 176</p>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <p className="text-sm font-medium text-gray-500">Contacts directs</p>
          <p className="text-md">Avec email: <strong>6 284 828</strong></p>
          <p className="text-md">Avec LinkedIn: <strong>11 329 086</strong></p>
        </div>
        <div className="bg-white shadow p-4 rounded">
          <p className="text-sm font-medium text-gray-500">Contacts génériques</p>
          <p className="text-md">Avec téléphone: <strong>562 841</strong></p>
        </div>
      </div>

      {/* Table + Graphs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded shadow">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <input type="checkbox" />
              <button className="bg-orange-500 text-white px-3 py-1 rounded">Exporter</button>
            </div>
            <div className="flex items-center text-gray-600 text-sm gap-1">
              Trier : Pertinence <ChevronDown size={16} />
            </div>
          </div>
          <div>
            {roles.map((item, i) => (
              <div key={i} className="border-b px-4 py-3 hover:bg-gray-50">
                <p className="font-medium">{item.role}</p>
                <p className="text-sm text-gray-500">{item.sub}</p>
                <p className="text-sm text-blue-600 font-medium">{item.company}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-white rounded shadow p-4 space-y-6">
          <div>
            <p className="font-semibold mb-2">Types de postes</p>
            {jobTypes.map((j, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <div className="w-32 truncate text-sm text-gray-600">{j.name}</div>
                <div className="flex-1 h-2 bg-gray-200 rounded">
                  <div
                    className="h-full bg-red-500 rounded"
                    style={{ width: `${(j.value / 1500000) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">{(j.value / 1000).toFixed(0)}k+</div>
              </div>
            ))}
          </div>

          <div>
            <p className="font-semibold mb-2">Niveaux hiérarchiques</p>
            {levels.map((lvl, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <div className="w-32 truncate text-sm text-gray-600">{lvl.name}</div>
                <div className="flex-1 h-2 bg-gray-200 rounded">
                  <div
                    className="h-full bg-blue-500 rounded"
                    style={{ width: `${(lvl.value / 4700000) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">{(lvl.value / 1000000).toFixed(1)}M</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
