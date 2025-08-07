import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ProntoService, ProntoFilters } from '@services/prontoService';

interface ProntoSearchFormProps {
  onSearchResults: (results: any) => void;
  onLoading: (loading: boolean) => void;
}

export const ProntoSearchForm: React.FC<ProntoSearchFormProps> = ({
  onSearchResults,
  onLoading
}) => {
  const [formData, setFormData] = useState({
    jobTitles: '',
    companySize: [] as string[],
    leadLocation: '',
    companyLocation: '',
    industries: ''
  });

  const [showCompanySizeDropdown, setShowCompanySizeDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companySizeOptions = ProntoService.getCompanySizeOptions();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompanySizeToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      companySize: prev.companySize.includes(value)
        ? prev.companySize.filter(size => size !== value)
        : [...prev.companySize, value]
    }));
  };

  const handleSearch = async () => {
    try {
      setError(null);
      onLoading(true);

      // Formater les filtres
      const filters = ProntoService.formatFiltersFromForm({
        ...formData,
        limit: 50 // Limite par défaut
      });

      console.log('🔍 Recherche avec filtres:', filters);

      // Effectuer la recherche
      const results = await ProntoService.searchLeads(filters);
      
      console.log('✅ Résultats reçus:', results);
      onSearchResults(results);

    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      onLoading(false);
    }
  };

  const getSelectedCompanySizeText = () => {
    if (formData.companySize.length === 0) {
      return '0 selected';
    }
    return `${formData.companySize.length} selected`;
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border">
      {/* Job Titles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Titles
        </label>
        <input
          type="text"
          placeholder="e.g., Marketing Director, Head of Marketing"
          value={formData.jobTitles}
          onChange={(e) => handleInputChange('jobTitles', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Additional filters */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional filters</h3>
        
        {/* Company Size */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Size
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCompanySizeDropdown(!showCompanySizeDropdown)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
            >
              <span className="text-gray-500">{getSelectedCompanySizeText()}</span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCompanySizeDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showCompanySizeDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {companySizeOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.companySize.includes(option.value)}
                      onChange={() => handleCompanySizeToggle(option.value)}
                      className="w-4 h-4 text-blue-600 rounded mr-3"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lead location */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lead location
          </label>
          <input
            type="text"
            placeholder="e.g., San Francisco, New York, Paris"
            value={formData.leadLocation}
            onChange={(e) => handleInputChange('leadLocation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Company location */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company location
          </label>
          <input
            type="text"
            placeholder="e.g., San Francisco, New York, Paris"
            value={formData.companyLocation}
            onChange={(e) => handleInputChange('companyLocation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Industries */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industries
          </label>
          <input
            type="text"
            placeholder="e.g., Retail, Software, Luxury"
            value={formData.industries}
            onChange={(e) => handleInputChange('industries', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Find personas button */}
      <button
        onClick={handleSearch}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
      >
        Find personas
      </button>
    </div>
  );
};
