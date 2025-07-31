import React, { useState } from 'react';
import { Check, X, Star, Zap, Crown, Building, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { productsService } from '../../services/productsService';

// Mapping des icônes par nom de produit
const getProductIcon = (productName: string) => {
  const name = productName.toLowerCase();
  if (name.includes('starter') || name.includes('basic')) return Building;
  if (name.includes('pro') || name.includes('professional')) return Zap;
  if (name.includes('growth') || name.includes('business')) return Star;
  if (name.includes('scale') || name.includes('enterprise')) return Crown;
  return Building;
};

// Mapping des couleurs par nom de produit et tout
const getProductColor = (productName: string, index: number) => {
  const name = productName.toLowerCase();
  if (name.includes('starter') || name.includes('basic')) return 'from-gray-500 to-gray-600';
  if (name.includes('pro') || name.includes('professional')) return 'from-blue-500 to-blue-600';
  if (name.includes('growth') || name.includes('business')) return 'from-[#E95C41] to-orange-600';
  if (name.includes('scale') || name.includes('enterprise')) return 'from-purple-600 to-purple-700';
  
  // Couleurs par défaut basées sur l'index
  const colors = [
    'from-gray-500 to-gray-600',
    'from-blue-500 to-blue-600',
    'from-[#E95C41] to-orange-600',
    'from-purple-600 to-purple-700',
    'from-indigo-600 to-indigo-700'
  ];
  return colors[index % colors.length];
};

export const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, loading, error, refetch, handleSubscribe } = useProducts();
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handlePlanSelect = async (priceId: string) => {
    try {
      setSubscribing(priceId);
      await handleSubscribe(priceId);
    } catch (error) {
      console.error('Erreur lors de la souscription:', error);
      // L'erreur est déjà gérée dans le hook
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-[#E95C41] mx-auto mb-4" />
          <p className="text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-[#E95C41] hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Aucun produit disponible pour le moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Tarification</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Choisissez le plan qui correspond le mieux à vos besoins. 
            Commencez dès aujourd'hui avec l'abonnement qui vous convient.
          </p>
        </div>

        {/* Plans Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {products.map((product, index) => {
            const IconComponent = getProductIcon(product.name);
            const colorClass = getProductColor(product.name, index);
            const isPopular = product.metadata?.popular === 'true';
            
            return product.prices.map((price) => (
            <div
                key={`${product.id}-${price.id}`}
              className={`relative rounded-lg shadow-lg border-2 transition-all duration-300 hover:shadow-xl min-h-[500px] ${
                  isPopular 
                  ? 'bg-blue-900 text-white border-blue-900' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
                {isPopular && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-[#E95C41] text-white px-3 py-1 rounded-full text-xs font-medium">
                    Populaire
                  </span>
                </div>
              )}

              <div className="p-6 flex flex-col h-full">
                {/* Plan Header */}
                <div className="text-center mb-6">
                    <h3 className={`text-xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                      {product.name}
                  </h3>
                    
                    {/* Description */}
                    {product.description && (
                      <p className={`text-sm mb-4 ${isPopular ? 'text-gray-300' : 'text-gray-600'}`}>
                        {product.description}
                      </p>
                    )}
                  
                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex flex-col items-center">
                        <span className={`text-2xl font-bold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                          {productsService.formatPrice(price.unit_amount, price.currency)}
                          {productsService.formatBillingInterval(price.recurring)}
                      </span>
                        
                        {/* Prix annuel si mensuel */}
                        {price.recurring.interval === 'month' && price.recurring.interval_count === 1 && (
                          <span className={`text-sm ${isPopular ? 'text-gray-300' : 'text-gray-500'}`}>
                            Soit {productsService.formatPrice(price.unit_amount * 12, price.currency)}/an
                        </span>
                      )}
                    </div>
                  </div>

                    {/* Crédits si disponibles dans les métadonnées */}
                    {price.metadata?.credits && (
                  <div className="mb-6">
                        <span className={`text-lg font-semibold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                          {price.metadata.credits} Crédits / {price.recurring.interval === 'month' ? 'mois' : 'an'}
                    </span>
                  </div>
                    )}

                </div>

                {/* Spacer to push button to bottom */}
                <div className="flex-grow"></div>

                {/* CTA Button */}
                <button
                    onClick={() => handlePlanSelect(price.id)}
                    disabled={subscribing === price.id}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 text-sm ${
                      isPopular 
                        ? 'bg-white text-[#E95C41] hover:bg-gray-50' 
                        : 'bg-[#E95C41] hover:bg-orange-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {subscribing === price.id ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Chargement...</span>
                      </>
                    ) : (
                      <span>S'ABONNER</span>
                    )}
                </button>
              </div>
            </div>
            ));
          })}
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Besoin d'aide pour choisir le bon plan ?
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="text-[#E95C41] hover:text-orange-600 font-medium transition-colors"
          >
            Contactez notre équipe de vente
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage; 