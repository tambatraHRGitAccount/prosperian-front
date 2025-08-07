import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Info, Lock, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Récupérer les paramètres de l'URL
  const subscriptionId = searchParams.get('subscription_id');
  const packId = searchParams.get('pack_id');
  const type = searchParams.get('type'); // 'subscription' ou 'credit_pack'
  
  // États pour les données
  const [subscription, setSubscription] = useState<any>(null);
  const [creditPack, setCreditPack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: `${user?.prenom || ''} ${user?.nom || ''}`.trim(),
    country: 'France',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    saveInfo: false,
    acceptTerms: false
  });

  // Charger les données de l'abonnement ou du pack de crédits
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (type === 'subscription' && subscriptionId) {
          const response = await fetch(`https://prosperian.onrender.com/api/payment/subscriptions/${subscriptionId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Erreur lors du chargement de l\'abonnement');
          }
          
          const data = await response.json();
          setSubscription(data.subscription);
        } else if (type === 'credit_pack' && packId) {
          const response = await fetch(`https://prosperian.onrender.com/api/payment/credit-packs/${packId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Erreur lors du chargement du pack de crédits');
          }
          
          const data = await response.json();
          setCreditPack(data.credit_pack);
        } else {
          throw new Error('Type de paiement non reconnu');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    if (type && (subscriptionId || packId)) {
      loadData();
    } else {
      setError('Cette page nécessite des paramètres de paiement. Veuillez sélectionner un abonnement ou un pack de crédits depuis la page de tarification.');
      setLoading(false);
    }
  }, [type, subscriptionId, packId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.acceptTerms) {
      alert('Veuillez accepter les conditions générales');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      if (type === 'subscription' && subscriptionId) {
        // Créer une session de paiement pour l'abonnement
        const response = await fetch('https://prosperian.onrender.com/api/payment/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            subscription_id: subscriptionId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de la création de la session de paiement');
        }

        const data = await response.json();
        
        // Rediriger vers Stripe Checkout
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          throw new Error('URL de paiement non reçue');
        }

      } else if (type === 'credit_pack' && packId) {
        // Créer une intention de paiement pour le pack de crédits
        const response = await fetch('https://prosperian.onrender.com/api/payment/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            pack_id: packId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de la création de l\'intention de paiement');
        }

        const data = await response.json();
        
        // Ici vous pouvez intégrer Stripe Elements pour le paiement par carte
        // Pour l'instant, on simule un succès
        alert('Paiement traité avec succès ! Redirection vers la page de succès...');
        navigate('/payment/success?session_id=' + data.payment_intent.id);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du traitement du paiement');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + ' / ' + v.substring(2, 4);
    }
    return v;
  };

  // Afficher l'état de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#E95C41] mx-auto mb-4" />
          <p className="text-gray-600">Chargement des informations de paiement...</p>
        </div>
      </div>
    );
  }

  // Afficher l'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center space-x-2 text-[#E95C41] hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour à la tarification</span>
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-orange-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Paramètres de paiement manquants</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Cette page nécessite des paramètres de paiement. Veuillez sélectionner un abonnement ou un pack de crédits depuis la page de tarification.
            </p>
            
            <div className="space-y-4">
                              <button
                  onClick={() => navigate('/pricing')}
                  className="bg-[#E95C41] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Voir les tarifs
                </button>
              
              <div className="text-sm text-gray-500">
                Ou utilisez ces liens directs pour tester :
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => navigate('/payment?type=subscription&subscription_id=test-subscription')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Test Abonnement
                </button>
                <button
                  onClick={() => navigate('/payment?type=credit_pack&pack_id=test-pack')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Test Pack Crédits
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Récupérer les données selon le type
  const item = type === 'subscription' ? subscription : creditPack;
  const itemName = item?.name || 'Plan';
  const itemPrice = item?.price || 0;
  const itemCredits = type === 'subscription' ? item?.monthly_credits : item?.credits;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/subscription')}
            className="flex items-center space-x-2 text-[#E95C41] hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour à la tarification</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Subscription Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {type === 'subscription' ? 'S\'abonner à' : 'Acheter'} {itemName}
              </h1>
              <div className="text-3xl font-bold text-[#E95C41] mb-4">
                €{itemPrice}{type === 'subscription' ? ' par mois' : ''}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div>
                  <div className="font-medium text-gray-900">{itemName}</div>
                  <div className="text-sm text-gray-500">
                    {type === 'subscription' ? 'Facturé tous les mois' : 'Paiement unique'}
                  </div>
                </div>
                <div className="font-medium text-gray-900">€{itemPrice}</div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div className="font-medium text-gray-900">Sous-total</div>
                <div className="font-medium text-gray-900">€{itemPrice}</div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">TVA</span>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
                <div className="font-medium text-gray-900">€0,00</div>
              </div>

              <div className="flex justify-between items-center py-3">
                <div className="text-lg font-bold text-gray-900">Total dû aujourd'hui</div>
                <div className="text-lg font-bold text-[#E95C41]">€{itemPrice}</div>
              </div>
            </div>

            {/* Plan Details */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                Détails du {type === 'subscription' ? 'plan' : 'pack'}
              </h3>
              <div className="text-sm text-gray-600">
                <div>• {itemCredits} crédits{type === 'subscription' ? ' par mois' : ''}</div>
                <div>• Accès complet à toutes les fonctionnalités</div>
                <div>• Support client inclus</div>
                {item?.description && (
                  <div>• {item.description}</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Coordonnées</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E95C41] focus:border-transparent"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Moyen de paiement</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Informations de la carte
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                      className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E95C41] focus:border-transparent"
                      placeholder="1234 1234 1234 1234"
                      maxLength={19}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
                      <div className="w-6 h-4 bg-blue-600 rounded-sm"></div>
                      <div className="w-6 h-4 bg-red-600 rounded-sm"></div>
                      <div className="w-6 h-4 bg-yellow-600 rounded-sm"></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MM / AA
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: formatExpiryDate(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E95C41] focus:border-transparent"
                      placeholder="MM / AA"
                      maxLength={7}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="cvc"
                        value={formData.cvc}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E95C41] focus:border-transparent"
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                      <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du titulaire de la carte
                  </label>
                  <input
                    type="text"
                    name="cardholderName"
                    value={formData.cardholderName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E95C41] focus:border-transparent"
                    placeholder="Nom complet"
                    required
                  />
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Adresse de facturation</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E95C41] focus:border-transparent"
                  >
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ligne d'adresse n°1
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E95C41] focus:border-transparent"
                    placeholder="Adresse"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ligne d'adresse n°2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E95C41] focus:border-transparent"
                    placeholder="Appartement, suite, etc. (optionnel)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code postal
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E95C41] focus:border-transparent"
                      placeholder="75001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E95C41] focus:border-transparent"
                      placeholder="Paris"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Save Information */}
              <div>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="saveInfo"
                    checked={formData.saveInfo}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-[#E95C41] border-gray-300 rounded focus:ring-[#E95C41]"
                  />
                  <div className="text-sm text-gray-700">
                    <div>Enregistrer mes informations pour régler plus rapidement</div>
                    <div className="text-gray-500 mt-1">
                      Réglez plus rapidement vos achats auprès de Prosperian et de tous les autres professionnels qui acceptent Link.
                    </div>
                  </div>
                </label>
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-[#E95C41] border-gray-300 rounded focus:ring-[#E95C41]"
                    required
                  />
                  <div className="text-sm text-gray-700">
                    <div>J'accepte les conditions générales</div>
                    <div className="text-gray-500 mt-1">
                      En vous abonnant, vous acceptez que nous puissions vous facturer le montant indiqué ci-dessus à la date de facturation. 
                      Vous pouvez annuler votre abonnement à tout moment. 
                      En vous abonnant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                    </div>
                  </div>
                </label>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-[#E95C41] hover:bg-orange-600 disabled:bg-gray-400 text-white py-4 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Traitement en cours...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>{type === 'subscription' ? 'S\'abonner' : 'Acheter'}</span>
                  </>
                )}
              </button>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-4 mb-2">
                  <span>Propulsé par Stripe</span>
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <a href="#" className="text-[#E95C41] hover:underline">Conditions d'utilisation</a>
                  <a href="#" className="text-[#E95C41] hover:underline">Confidentialité</a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 