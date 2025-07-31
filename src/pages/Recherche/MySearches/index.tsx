import SectionCard from "@shared/components/SectionCard/SectionCard";
import SectionTableCard from "@shared/components/SectionCard/SectionTableCard";

const MySearches: React.FC = () => {
  const columns = ["Type", "Nom de recherche", "Créée le"];
  const items: React.ReactNode[][] = [];

  return (
    <div className="mx-auto p-3">
      <SectionCard
        mainTitle="Enregistrez vos recherches en toute simplicité !"
        subTitle="Pourquoi enregistrer une recherche ?"
        items={[
          "Recharger facilement tous vos critères",
          "Facilitez la collaboration en partageant vos recherches avec votre équipe",
          "Activez une veille sur vos recherches",
          "Accédez à des recherches exclusives partagées par l'équipe SocieteInfo",
        ]}
        buttonText="Lancer une recherche"
        onButtonClick={() => {}}
      />
      <SectionTableCard
        title="Mes recherches"
        columns={columns}
        items={items}
        showExport={false}
        emptyMessage="Aucune recherche sauvegardée."
        onExportSelect={() => console.log("Export CSV")}
      />
      <SectionTableCard
        title="Recherches partagées"
        columns={columns}
        items={items}
        showExport={false}
        emptyMessage="Aucune recherche partagée."
        onExportSelect={() => console.log("Export CSV")}
      />
    </div>
  );
};

export default MySearches;
