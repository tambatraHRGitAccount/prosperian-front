import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ProntoLeadsForm: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    search_url: "",
    webhook_url: "",
    name: "",
    streaming: false,
    custom: { hubspot_id: "" },
    limit: 100,
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === "streaming") {
      setForm((prev) => ({ ...prev, streaming: checked }));
    } else if (name === "hubspot_id") {
      setForm((prev) => ({ ...prev, custom: { ...prev.custom, hubspot_id: value } }));
    } else if (name === "limit") {
      setForm((prev) => ({ ...prev, limit: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/pronto/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Erreur lors de l'appel à l'API");
      const data = await response.json();
      setResult(data);
      setShowSuccessModal(true); // Afficher la modale en cas de succès
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-gray-100 p-6">
      <div className="w-full max-w-4xl flex bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Panneau gauche - Critères de recherche */}
        <div className="w-2/3 bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Scraping</h2>
            <button
              className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 hover:bg-gray-100"
              onClick={() => navigate(-1)}
            >
              Retour
            </button>
          </div>
          <p className="text-gray-600 mb-6">Définissez vos paramètres de scraping</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL de recherche</label>
              <input
                type="text"
                name="search_url"
                value={form.search_url}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex. : https://example.com/search"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez un nom"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="streaming"
                checked={form.streaming}
                onChange={handleChange}
                id="streaming"
                className="mr-2"
              />
              <label htmlFor="streaming" className="text-sm text-gray-700">Diffusion en continu</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL de webhook</label>
              <input
                type="text"
                name="webhook_url"
                value={form.webhook_url}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex. : https://webhook.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Hubspot</label>
              <input
                type="text"
                name="hubspot_id"
                value={form.custom.hubspot_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez l'ID Hubspot"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Limite</label>
              <input
                type="number"
                name="limit"
                value={form.limit}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={1}
                max={1000}
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-orange-400 to-[#E95C41] hover:opacity-90 text-white font-medium py-3 px-6 rounded-full"
              disabled={loading}
            >
              {loading ? "Recherche en cours..." : "Trouver des leads"}
            </button>
          </form>
          {error && <div className="text-red-500 mt-4">{error}</div>}
        </div>

        {/* Panneau droit - Résultats */}
        <div className="w-1/3 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Résultats</h3>
          {/* Espace réservé pour les résultats, à remplir dynamiquement */}
          <div className="text-gray-500">Aucun résultat pour l'instant. Soumettez pour voir les leads.</div>
        </div>
      </div>

      {/* Modale de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative flex flex-col items-center">
            <button
              className="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={() => setShowSuccessModal(false)}
              aria-label="Fermer"
            >
              ×
            </button>
            <div className="flex flex-col items-center">
              <div className="bg-green-100 rounded-full p-3 mb-4">
                <svg width="32" height="32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="#22C55E" fillOpacity="0.15" />
                  <path
                    d="M10 16l4 4 6-6"
                    stroke="#22C55E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-green-600 mb-2">Scraping terminé avec succès !</h2>
              <p className="text-gray-600 text-center mb-4">Votre tâche de scraping a été complétée.</p>
              <button
                className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-md font-semibold hover:bg-orange-700"
                onClick={() => setShowSuccessModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProntoLeadsForm;