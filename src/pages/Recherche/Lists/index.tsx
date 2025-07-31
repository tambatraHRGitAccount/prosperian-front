import React, { useState, useEffect, useRef } from "react";
import SectionCard from "@shared/components/SectionCard/SectionCard";
import SectionTableCard from "@shared/components/SectionCard/SectionTableCard";
import { ListService, List } from "@services/listService";
import { Building, User, MoreVertical, Settings, Trash2, Download } from 'lucide-react';

const Lists: React.FC = () => {
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [listName, setListName] = useState("");
  const [listType, setListType] = useState("Entreprise");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpenIndex, setMenuOpenIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Charger les listes au montage du composant
  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    if (menuOpenIndex === null) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenIndex]);

  const loadLists = async () => {
    try {
      setLoading(true);
      const data = await ListService.getAllLists();
      setLists(data);
    } catch (error) {
      console.error('Erreur lors du chargement des listes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const validation = ListService.validateCSVFile(f);
      if (!validation.isValid) {
        setFileError(validation.error || "Format de fichier non supporté");
        setFile(null);
      } else {
        setFile(f);
        setFileError("");
      }
    }
  };

  const handleCreateList = async () => {
    if (!file || !listName) return;
    
    try {
      await ListService.createList({
        type: listType,
        nom: listName,
        file: file
      });
      
      // Recharger les listes
      await loadLists();
      
      // Fermer le modal et réinitialiser
      setShowNewListModal(false);
      setListName("");
      setFile(null);
      setFileError("");
    } catch (error) {
      console.error('Erreur lors de la création de la liste:', error);
      setFileError("Erreur lors de la création de la liste");
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await ListService.deleteList(id);
      await loadLists(); // Recharger les listes
      setMenuOpenIndex(null);
    } catch (error) {
      console.error('Erreur lors de la suppression de la liste:', error);
    }
  };

  const handleDownloadList = async (id: string, nom: string) => {
    try {
      await ListService.downloadListFile(id, `${nom}.csv`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const myListColumns = ["Type", "Nom", "Éléments", "Créée le", "Modifiée le", ""];

  // Convertir les listes en format pour le tableau
  const myListItems = lists.map((list, index) => [
    list.type === 'Entreprise' ? <Building className="w-5 h-5 text-gray-400" /> : <User className="w-5 h-5 text-gray-400" />,
    list.nom,
    list.elements,
    new Date(list.created_at).toLocaleDateString("fr-FR"),
    new Date(list.updated_at).toLocaleDateString("fr-FR"),
    <div key={list.id} className="relative" ref={menuOpenIndex === index ? menuRef : undefined}>
      <button onClick={() => setMenuOpenIndex(index === menuOpenIndex ? null : index)} className="p-2">
        <MoreVertical className="w-5 h-5 text-gray-400" />
      </button>
      {menuOpenIndex === index && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-20">
          <button 
            className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 gap-2" 
            onClick={() => handleDownloadList(list.id, list.nom)}
          >
            <Download className="w-4 h-4 text-gray-500" />
            Télécharger
          </button>
          <button 
            className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 gap-2" 
            onClick={() => {/* TODO: handle config */}}
          >
            <Settings className="w-4 h-4 text-gray-500" />
            Configurer
          </button>
          <button 
            className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-500 gap-2" 
            onClick={() => handleDeleteList(list.id)}
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      )}
    </div>
  ]);

  const sharedListColumns = ["Type", "Nom", "Éléments", "Créée le", "Modifiée le"];
  const sharedListItems: React.ReactNode[][] = [];

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
      {/* Modal Nouvelle Liste */}
      {showNewListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 relative animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-6">Créer une nouvelle liste</h2>
            <input
              className="w-full border-b-2 border-gray-200 focus:border-orange-500 outline-none px-3 py-2 mb-4 placeholder-gray-400 bg-gray-50 rounded-t"
              placeholder="Nom de liste"
              value={listName}
              onChange={e => setListName(e.target.value)}
            />
            <select
              className="w-full border border-gray-200 rounded px-3 py-2 mb-6 bg-white"
              value={listType}
              onChange={e => setListType(e.target.value)}
            >
              <option>Entreprise</option>
              <option>Contact</option>
            </select>
            <div className="mb-2 font-medium text-gray-700">Ajouter des entreprises à ma liste</div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 mb-2 flex flex-col items-center justify-center text-center bg-gray-50">
              <div className="text-gray-400 mb-2">Déposez votre fichier ici</div>
              <div className="text-gray-400 mb-2">ou</div>
              <label htmlFor="file-upload" className="inline-block cursor-pointer">
                <span className="inline-block bg-gradient-to-r from-orange-400 to-[#E95C41] text-white font-medium px-6 py-2 rounded-full text-base">Sélectionnez votre fichier</span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {file && <div className="mt-2 text-sm text-gray-700">{file.name}</div>}
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1 mb-4">
              <span className="text-orange-500 mr-1">&#9888;</span>
              Formats supportés: CSV
            </div>
            {fileError && <div className="text-xs text-red-500 mb-2">{fileError}</div>}
            <div className="flex justify-between mt-6">
              <button
                className="px-6 py-2 rounded-full border border-orange-400 text-orange-500 font-medium bg-white hover:bg-orange-50"
                onClick={() => setShowNewListModal(false)}
              >
                Annuler
              </button>
              <button
                className="px-6 py-2 rounded-full bg-gradient-to-r from-orange-400 to-[#E95C41] text-white font-medium hover:opacity-90 disabled:opacity-50"
                disabled={!listName || !file}
                onClick={handleCreateList}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Fin Modal */}
      <SectionCard
        mainTitle="Créez et gérez vos listes en toute simplicité !"
        subTitle="Pourquoi utiliser notre service de liste ?"
        items={[
          "Sélectionnez précisément les entreprises qui vous intéressent",
          "Visualisez directement les contacts de votre liste d'entreprise",
          "Créez une surveillance à partir d'une liste de sociétés",
          "Accédez à des listes exclusives partagées par l'équipe SocieteInfo",
        ]}
        remark={
          <>
            Pour mieux comprendre notre <strong>service de liste</strong>, nous vous recommandons
            de jeter un œil à nos <a href="#" className="text-[#E95C41] underline">tutoriels</a> !
          </>
        }
        buttonText="Créer ma première liste"
        onButtonClick={() => console.log("Créer une liste")}
      />
      <div className="relative">
        <SectionTableCard
          title="Mes listes"
          columns={myListColumns}
          items={myListItems}
          showExport={false}
          emptyMessage={loading ? "Chargement..." : "Vous n'avez créé aucune liste."}
          onExportSelect={() => {}}
        />
        <button
          className="absolute top-0 right-0 mt-2 mr-8 inline-flex items-center bg-gradient-to-r from-orange-400 to-[#E95C41] hover:opacity-90 text-white font-medium py-3 px-6 rounded-full text-sm z-10"
          onClick={() => setShowNewListModal(true)}
        >
          Nouvelle liste
        </button>
      </div>
      <SectionTableCard
        title="Listes partagées"
        columns={sharedListColumns}
        items={sharedListItems}
        showExport={false}
        emptyMessage="Aucune liste partagée."
        onExportSelect={() => console.log("Export CSV")}
      />
      <p className="text-center text-xs text-gray-500 my-6">
        © SMART DATA 2024 · <a href="#" className="underline">CGV / CGU</a> · <a href="#" className="underline">Vie privée & Confidentialité</a> · <a href="#" className="underline">Mentions Légales</a>
      </p>
      </div>
    </div>
  );
};

export default Lists;
