import { useState, useEffect } from 'react';
import { productsService, StripeProduct, StripePrice } from '../services/productsService';
import { useNotification } from '../components/Notification';
import { getStripe } from '../config/stripe';

interface UseProductsReturn {
  products: StripeProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  handleSubscribe: (priceId: string) => Promise<void>;
}

export const useProducts = (): UseProductsReturn => {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotification();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsService.getProducts();
      setProducts(response.products);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des produits';
      setError(errorMessage);
      addNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    try {
      setError(null);
      
      // Créer la session de checkout
      const response = await productsService.createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscription`,
      });

      // Rediriger vers Stripe Checkout
      const stripe = await getStripe();
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la session de paiement';
      setError(errorMessage);
      addNotification('error', errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    handleSubscribe,
  };
}; 