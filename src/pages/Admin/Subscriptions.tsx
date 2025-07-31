import React, { useState, useEffect } from 'react';
import subscriptionService, { 
  Subscription, 
  CreditPack, 
  UserSubscription, 
  Transaction,
  CreateSubscriptionData,
  CreateCreditPackData
} from '../../services/subscriptionService';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Subscriptions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'credit-packs' | 'user-subscriptions' | 'transactions'>('subscriptions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les données
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // États pour les modals
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCreditPackModal, setShowCreditPackModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Subscription | CreditPack | null>(null);

  // États pour les formulaires
  const [subscriptionForm, setSubscriptionForm] = useState<CreateSubscriptionData>({
    name: '',
    monthly_credits: 0,
    price: 0,
    description: ''
  });

  const [creditPackForm, setCreditPackForm] = useState<CreateCreditPackData>({
    name: '',
    credits: 0,
    price: 0,
    description: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case 'subscriptions':
          const subsResponse = await subscriptionService.getAllSubscriptions();
          setSubscriptions(subsResponse.subscriptions);
          break;
        case 'credit-packs':
          const packsResponse = await subscriptionService.getAllCreditPacks();
          setCreditPacks(packsResponse.credit_packs);
          break;
        case 'user-subscriptions':
          const userSubsResponse = await subscriptionService.getAllUserSubscriptions();
          setUserSubscriptions(userSubsResponse.subscriptions);
          break;
        case 'transactions':
          const transactionsResponse = await subscriptionService.getAllTransactions();
          setTransactions(transactionsResponse.transactions);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    try {
      if (editingItem) {
        await subscriptionService.updateSubscription(editingItem.id, subscriptionForm);
      } else {
        await subscriptionService.createSubscription(subscriptionForm);
      }
      
      setShowSubscriptionModal(false);
      setEditingItem(null);
      setSubscriptionForm({ name: '', monthly_credits: 0, price: 0, description: '' });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  const handleCreateCreditPack = async () => {
    try {
      if (editingItem) {
        await subscriptionService.updateCreditPack(editingItem.id, creditPackForm);
      } else {
        await subscriptionService.createCreditPack(creditPackForm);
      }
      
      setShowCreditPackModal(false);
      setEditingItem(null);
      setCreditPackForm({ name: '', credits: 0, price: 0, description: '' });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')) return;

    try {
      await subscriptionService.deleteSubscription(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleDeleteCreditPack = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pack de crédits ?')) return;

    try {
      await subscriptionService.deleteCreditPack(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (item: Subscription | CreditPack, type: 'subscription' | 'credit-pack') => {
    setEditingItem(item);
    if (type === 'subscription') {
      setSubscriptionForm({
        name: item.name,
        monthly_credits: 'monthly_credits' in item ? item.monthly_credits : 0,
        price: item.price,
        description: item.description || ''
      });
      setShowSubscriptionModal(true);
    } else {
      setCreditPackForm({
        name: item.name,
        credits: 'credits' in item ? item.credits : 0,
        price: item.price,
        description: item.description || ''
      });
      setShowCreditPackModal(true);
    }
  };

  const tabs = [
    { id: 'subscriptions', label: 'Abonnements', count: subscriptions.length },
    { id: 'credit-packs', label: 'Packs de Crédits', count: creditPacks.length },
    { id: 'user-subscriptions', label: 'Abonnements Utilisateurs', count: userSubscriptions.length },
    { id: 'transactions', label: 'Transactions', count: transactions.length }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Abonnements</h1>
          <p className="text-gray-600">Gérez les abonnements, packs de crédits et transactions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {activeTab === 'subscriptions' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Abonnements Disponibles</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setSubscriptionForm({ name: '', monthly_credits: 0, price: 0, description: '' });
                  setShowSubscriptionModal(true);
                }}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Nouvel Abonnement
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crédits/Mois</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{subscription.name}</div>
                          <div className="text-sm text-gray-500">{subscription.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.monthly_credits} crédits
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.price}€
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subscription.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {subscription.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(subscription, 'subscription')}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteSubscription(subscription.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'credit-packs' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Packs de Crédits</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setCreditPackForm({ name: '', credits: 0, price: 0, description: '' });
                  setShowCreditPackModal(true);
                }}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Nouveau Pack
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crédits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {creditPacks.map((pack) => (
                    <tr key={pack.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{pack.name}</div>
                          <div className="text-sm text-gray-500">{pack.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pack.credits} crédits
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pack.price}€
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pack.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {pack.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(pack, 'credit-pack')}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteCreditPack(pack.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'user-subscriptions' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Abonnements Utilisateurs</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abonnement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userSubscriptions.map((userSub) => (
                    <tr key={userSub.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {userSub.user?.prenom} {userSub.user?.nom}
                        </div>
                        <div className="text-sm text-gray-500">{userSub.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{userSub.subscriptions?.name}</div>
                        <div className="text-sm text-gray-500">{userSub.subscriptions?.monthly_credits} crédits/mois</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          userSub.status === 'active' ? 'bg-green-100 text-green-800' :
                          userSub.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {userSub.status === 'active' ? 'Actif' :
                           userSub.status === 'cancelled' ? 'Annulé' :
                           userSub.status === 'past_due' ? 'En retard' : 'Impayé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userSub.current_period_start && userSub.current_period_end ? (
                          <div>
                            <div>Du: {new Date(userSub.current_period_start).toLocaleDateString('fr-FR')}</div>
                            <div>Au: {new Date(userSub.current_period_end).toLocaleDateString('fr-FR')}</div>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(userSub.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des Transactions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crédits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.user?.prenom} {transaction.user?.nom}
                        </div>
                        <div className="text-sm text-gray-500">{transaction.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'credit_pack' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {transaction.type === 'credit_pack' ? 'Pack de crédits' : 'Abonnement'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.amount}€
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.credits} crédits
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status === 'completed' ? 'Terminé' :
                           transaction.status === 'pending' ? 'En attente' :
                           transaction.status === 'failed' ? 'Échoué' : 'Annulé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal pour les abonnements */}
      <Modal
        isOpen={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          setEditingItem(null);
          setSubscriptionForm({ name: '', monthly_credits: 0, price: 0, description: '' });
        }}
        title={editingItem ? 'Modifier l\'abonnement' : 'Nouvel abonnement'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              value={subscriptionForm.name}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, name: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Crédits par mois</label>
            <input
              type="number"
              value={subscriptionForm.monthly_credits}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, monthly_credits: parseInt(e.target.value) })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prix (€)</label>
            <input
              type="number"
              step="0.01"
              value={subscriptionForm.price}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, price: parseFloat(e.target.value) })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={subscriptionForm.description}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowSubscriptionModal(false);
              setEditingItem(null);
              setSubscriptionForm({ name: '', monthly_credits: 0, price: 0, description: '' });
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleCreateSubscription}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {editingItem ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </Modal>

      {/* Modal pour les packs de crédits */}
      <Modal
        isOpen={showCreditPackModal}
        onClose={() => {
          setShowCreditPackModal(false);
          setEditingItem(null);
          setCreditPackForm({ name: '', credits: 0, price: 0, description: '' });
        }}
        title={editingItem ? 'Modifier le pack de crédits' : 'Nouveau pack de crédits'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              value={creditPackForm.name}
              onChange={(e) => setCreditPackForm({ ...creditPackForm, name: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de crédits</label>
            <input
              type="number"
              value={creditPackForm.credits}
              onChange={(e) => setCreditPackForm({ ...creditPackForm, credits: parseInt(e.target.value) })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prix (€)</label>
            <input
              type="number"
              step="0.01"
              value={creditPackForm.price}
              onChange={(e) => setCreditPackForm({ ...creditPackForm, price: parseFloat(e.target.value) })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={creditPackForm.description}
              onChange={(e) => setCreditPackForm({ ...creditPackForm, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowCreditPackModal(false);
              setEditingItem(null);
              setCreditPackForm({ name: '', credits: 0, price: 0, description: '' });
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleCreateCreditPack}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {editingItem ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Subscriptions; 