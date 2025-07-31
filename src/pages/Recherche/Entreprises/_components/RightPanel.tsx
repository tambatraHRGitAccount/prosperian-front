import React from 'react';
import { MapPin, TrendingUp, Info } from 'lucide-react';
import { VectorMap } from '@react-jvectormap/core';
import { frRegions_2016Mill } from '@react-jvectormap/franceregions2016';
import { FiltersPanel } from '@shared/components/Sidebar/FiltersPanel';

// Mapping ville (MAJUSCULE) → code région France
const cityToRegion: { [city: string]: string } = {
  PARIS: 'FR-IDF',
  BORDEAUX: 'FR-NAQ',
  MARSEILLE: 'FR-PAC',
  LYON: 'FR-ARA',
  LILLE: 'FR-HDF',
  NANTES: 'FR-PDL',
  STRASBOURG: 'FR-GES',
  RENNES: 'FR-BRE',
  TOULOUSE: 'FR-OCC',
  NICE: 'FR-PAC',
  // ... Ajoute ici tes villes et leur région correspondante
};

const cityColors = [
  '#FF7043', '#42A5F5', '#66BB6A', '#AB47BC', '#FFD600',
  '#26C6DA', '#EC407A', '#8D6E63', '#789262', '#FFA726'
];

interface RightPanelProps {
  businesses: { city: string; activity: string }[];
  totalBusinesses: number;
  filters: {
    activities: string[];
    cities: string[];
    legalForms: string[];
    roles: string[];
    employeeRange: [number, number];
    revenueRange: [number, number];
    ageRange: [number, number];
    searchTerm: string;
    ratingRange: [number, number];
    sortBy: string;
  };
  onFiltersChange: (filters: RightPanelProps['filters']) => void;
  availableCities: string[];
  availableLegalForms: string[];
  availableRoles: string[];
  employeeRange: [number, number];
  revenueRange: [number, number];
  ageRange: [number, number];
}

const defaultFilters = {
  activities: [],
  cities: [],
  legalForms: [],
  roles: [],
  employeeRange: [0, 0],
  revenueRange: [0, 0],
  ageRange: [0, 0],
  searchTerm: '',
  ratingRange: [0, 5],
  sortBy: 'Pertinence'
};

export const RightPanel: React.FC<RightPanelProps> = ({ businesses, totalBusinesses, filters, onFiltersChange, availableCities, availableLegalForms, availableRoles, employeeRange, revenueRange, ageRange, ...rest }) => {
  // Répartition géographique
  const getGeographicDistribution = () => {
    const cityCount: { [key: string]: number } = {};
    businesses.forEach(business => {
      // On met la ville en majuscule pour le comptage et la correspondance
      const city = business.city;
      const cityUpper = typeof city === 'string' ? city.toUpperCase() : '';
      if (!cityUpper) return;
      cityCount[cityUpper] = (cityCount[cityUpper] || 0) + 1;
    });
    return Object.entries(cityCount)
      .map(([city, count]) => ({
        city,
        count,
        percentage: ((count / businesses.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Top secteurs d'activité
  const getTopActivitySectors = () => {
    const activityCount: { [key: string]: number } = {};
    businesses.forEach(business => {
      activityCount[business.activity] = (activityCount[business.activity] || 0) + 1;
    });
    return Object.entries(activityCount)
      .map(([activity, count]) => ({
        activity,
        count,
        percentage: ((count / businesses.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const geographicData = getGeographicDistribution();
  const activityData = getTopActivitySectors();

  // Générer un mapping ville → couleur
  const cityToColor: { [city: string]: string } = {};
  geographicData.forEach((item, idx) => {
    cityToColor[item.city] = cityColors[idx % cityColors.length];
  });

  // Générer un mapping code région → couleur (selon la ville principale de chaque région)
  const regionColors: { [regionCode: string]: string } = {};
  geographicData.forEach(item => {
    const regionCode = cityToRegion[item.city];
    if (regionCode) {
      regionColors[regionCode] = cityToColor[item.city];
    }
  });

  // Palette pour les barres (pour garder la cohérence avec la map)
  const colors = cityColors;

  return (
    <div className="w-full max-w-xs md:w-80 flex-shrink-0 bg-white border-l border-gray-200 h-screen overflow-y-auto">
      {/* Répartition géographique */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Répartitions géographiques</h3>
        </div>
        
        {/* Carte de France par ville principale */}
        <div className="mb-6">
          <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center relative overflow-hidden">
            <VectorMap
              map={frRegions_2016Mill}
              backgroundColor="transparent"
              containerStyle={{ width: "100%", height: "100%" }}
              regionStyle={{
                initial: { fill: "#FFA500", "fill-opacity": 0.7, stroke: "#fff", "stroke-width": 1 },
                hover: { fill: "#FFCC80", "fill-opacity": 0.9 },
              }}
              colors={regionColors} // <--- ICI on passe le mapping couleurs par région
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-bold text-orange-700">{totalBusinesses}</div>
              <div className="text-sm text-orange-600">entreprises</div>
            </div>
          </div>
        </div>

        {/* Liste répartition géographique */}
        <div className="space-y-3">
          {geographicData.map((item, index) => (
            <div key={item.city} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: colors[index % colors.length] }}></div>
                <span className="text-sm text-gray-700">{item.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
                <span className="text-xs text-gray-500">({item.count})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top secteurs d'activité */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Top des secteurs d'activités</h3>
          <Info className="w-4 h-4 text-gray-400" />
        </div>

        <div className="space-y-4">
          {activityData.map((item, index) => (
            <div key={item.activity} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 font-medium truncate pr-2">
                  {item.activity}
                </span>
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                  {item.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full`}
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: colors[index % colors.length]
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {item.count} entreprise{item.count > 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Légende */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Répartition basée sur {totalBusinesses} entreprises analysées
          </div>
        </div>
      </div>
    </div>
  );
};
