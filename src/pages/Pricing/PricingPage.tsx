import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, CreditCard, Users } from 'lucide-react';
import pricingService, { Subscription, CreditPack } from '../../services/pricingService';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);

  useEffect(() => {
    const loadPricing = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const pricing = await pricingService.getPricing();
        setSubscriptions(pricing.subscriptions);
        setCreditPacks(pricing.credit_packs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tarifs');
      } finally {
        setLoading(false);
      }
    };

    loadPricing();
  }, []);

  const handleSubscribe = (subscription: Subscription) => {
    navigate(`/payment?type=subscription&subscription_id=${subscription.id}`);
  };

  const handleBuyPack = (pack: CreditPack) => {
    navigate(`/payment?type=credit_pack&pack_id=${pack.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E95C41] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des tarifs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Des abonnements flexibles et des packs de crédits pour répondre à tous vos besoins
          </p>
        </div>

        {/* Abonnements */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Abonnements Mensuels</h2>
            <p className="text-gray-600">Paiement récurrent, crédits renouvelés chaque mois</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{subscription.name}</h3>
                  <div className="text-3xl font-bold text-[#E95C41] mb-4">
                    €{subscription.price}
                    <span className="text-sm font-normal text-gray-500">/mois</span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-6">
                    {subscription.monthly_credits} crédits par mois
                  </div>

                  {subscription.description && (
                    <p className="text-sm text-gray-500 mb-6">{subscription.description}</p>
                  )}

                  <button
                    onClick={() => handleSubscribe(subscription)}
                    className="w-full bg-[#E95C41] hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    S'abonner
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Packs de Crédits */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Packs de Crédits</h2>
            <p className="text-gray-600">Paiement unique, crédits disponibles immédiatement</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditPacks.map((pack) => (
              <div key={pack.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{pack.name}</h3>
                  <div className="text-3xl font-bold text-[#E95C41] mb-4">
                    €{pack.price}
                    <span className="text-sm font-normal text-gray-500">/unique</span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-6">
                    {pack.credits} crédits
                  </div>

                  {pack.description && (
                    <p className="text-sm text-gray-500 mb-6">{pack.description}</p>
                  )}

                  <button
                    onClick={() => handleBuyPack(pack)}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Acheter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Toutes nos fonctionnalités incluses</h2>
            <p className="text-gray-600">Profitez de toutes les fonctionnalités avec n'importe quel plan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Recherche d'entreprises</h3>
                <p className="text-sm text-gray-600">Trouvez des entreprises avec des critères avancés</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Enrichissement de données</h3>
                <p className="text-sm text-gray-600">Enrichissez vos listes de prospects</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Export de données</h3>
                <p className="text-sm text-gray-600">Exportez vos résultats en CSV/Excel</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Support client</h3>
                <p className="text-sm text-gray-600">Support dédié pour tous les utilisateurs</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">API access</h3>
                <p className="text-sm text-gray-600">Accès à notre API pour l'intégration</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Mises à jour gratuites</h3>
                <p className="text-sm text-gray-600">Nouvelles fonctionnalités incluses</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions fréquentes</h2>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Comment fonctionnent les crédits ?</h3>
              <p className="text-sm text-gray-600">Chaque recherche ou enrichissement consomme un crédit. Les crédits sont renouvelés chaque mois pour les abonnements ou disponibles immédiatement pour les packs.</p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Puis-je annuler mon abonnement ?</h3>
              <p className="text-sm text-gray-600">Oui, vous pouvez annuler votre abonnement à tout moment depuis votre profil. L'annulation prendra effet à la fin de la période de facturation.</p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Les crédits expirent-ils ?</h3>
              <p className="text-sm text-gray-600">Les crédits des abonnements sont renouvelés chaque mois. Les crédits des packs n'expirent pas et restent disponibles jusqu'à utilisation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 