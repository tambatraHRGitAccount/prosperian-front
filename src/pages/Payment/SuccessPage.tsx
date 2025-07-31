import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    // Ici vous pouvez récupérer les détails du paiement si nécessaire
    // Pour l'instant, on simule un chargement
    setTimeout(() => {
      setLoading(false);
      setPaymentDetails({
        amount: '29.99',
        currency: 'EUR',
        status: 'completed'
      });
    }, 2000);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E95C41] mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Paiement réussi !
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Votre paiement a été traité avec succès. Vous recevrez un email de confirmation dans quelques instants.
          </p>

          {/* Payment Details */}
          {paymentDetails && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails du paiement</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant :</span>
                  <span className="font-medium">{paymentDetails.amount} {paymentDetails.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut :</span>
                  <span className="font-medium text-green-600 capitalize">{paymentDetails.status}</span>
                </div>
                {sessionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID de session :</span>
                    <span className="font-mono text-xs text-gray-500">{sessionId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prochaines étapes</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#E95C41] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email de confirmation</p>
                  <p className="text-sm text-gray-600">Vous recevrez un email avec les détails de votre achat</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#E95C41] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Accès immédiat</p>
                  <p className="text-sm text-gray-600">Vos crédits sont maintenant disponibles dans votre compte</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#E95C41] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Commencer à utiliser</p>
                  <p className="text-sm text-gray-600">Vous pouvez maintenant utiliser toutes les fonctionnalités</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => navigate('/recherche')}
              className="w-full bg-[#E95C41] hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <ArrowRight className="w-5 h-5" />
              <span>Commencer à rechercher</span>
            </button>
            
            <button
              onClick={() => navigate('/profile')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Voir mon profil</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Si vous avez des questions, contactez notre support client à{' '}
              <a href="mailto:support@prosperian.com" className="text-[#E95C41] hover:underline">
                support@prosperian.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage; 