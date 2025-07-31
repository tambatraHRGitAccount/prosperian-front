import React from "react";
import SectionCard from "@shared/components/SectionCard/SectionCard";
import SectionTableCard from "@shared/components/SectionCard/SectionTableCard";
import { buildApiUrl, API_CONFIG } from "../../../config/api";
import { Building, Users } from "lucide-react";

const Exports: React.FC = () => {
  const columns = ["Type", "Nom de fichier", "Statut", "Crée le", "#lignes", "Action"];
  const [items, setItems] = React.useState<React.ReactNode[][]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedFormat, setSelectedFormat] = React.useState<'csv' | 'xlsx'>('csv');

  React.useEffect(() => {
    const fetchExports = async () => {
      setLoading(true);
      try {
        const res = await fetch(buildApiUrl("/api/file/export"));
        const data = await res.json();
        setItems(
          Array.isArray(data)
            ? data
                .filter((exp) => selectedFormat === 'csv' ? exp.file?.endsWith('.csv') : exp.file?.endsWith('.xlsx'))
                .map((exp) => [
                  exp.type === 'entreprise' ? <Building className="w-5 h-5 text-blue-700 mx-auto" /> :
                  exp.type === 'contact' ? <Users className="w-5 h-5 text-green-600 mx-auto" /> :
                  "-", // Type
                  exp.file || "-", // Nom de fichier (avec extension)
                  exp.path ? (
                    <span className="text-green-600 font-medium">Disponible</span>
                  ) : (
                    <span className="text-red-600 font-medium">Erreur</span>
                  ),
                  new Date(exp.created_at).toLocaleString("fr-FR"),
                  exp.ligne ?? "-",
                  <div className="flex gap-2">
                    {exp.path && (
                      <button
                        className="inline-flex items-center bg-gradient-to-r from-orange-400 to-[#E95C41] hover:opacity-90 text-white font-medium py-3 px-6 rounded-full"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `${API_CONFIG.BASE_URL}${exp.path}`;
                          link.download = '';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        Télécharger
                      </button>
                    )}
                  </div>
                ])
            : []
        );
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExports();
  }, [selectedFormat]);

  return loading ? (
    <div className="flex items-center justify-center min-h-[60vh] w-full mx-auto">
      <style>{`
        @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
        .animate-spin-reverse { animation: spin-reverse 1s linear infinite; }
      `}</style>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-orange-400 border-t-transparent animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-[#E95C41] border-b-transparent animate-spin-reverse"></div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col flex-1">
      <div className="mx-auto p-3">
        <SectionCard
          mainTitle="Gérez vos exports en toute simplicité !"
          subTitle="Avec le service d'export, vous pouvez :"
          items={[
            "Exporter les données d'entreprises et/ou de contacts en quelques clics",
            "Appliquer un repoussoir de contacts ou d'entreprises",
            "Prévisualiser vos résultats avant de confirmer votre achat",
            "Paramétrer des champs additionnels dans votre format d'export",
          ]}
          remark={
            <>
              Pour mieux comprendre notre <strong>service d'export</strong>, nous vous recommandons de jeter un œil à nos{" "}
              <a href="/tutoriels" className="underline font-medium">
                tutoriels
              </a>{" "}
              !
            </>
          }
          buttonText="Lancer une recherche"
          onButtonClick={() => {}}
        />
        <SectionTableCard
          title="Mes exports"
          columns={columns}
          items={items}
          emptyMessage={loading ? "Chargement..." : "Vous n'avez pas encore réalisé un export."}
          onExportSelect={(format) => setSelectedFormat(format)}
        />
      </div>
    </div>
  );
};

export default Exports;