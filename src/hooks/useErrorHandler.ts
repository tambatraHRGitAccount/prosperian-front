import { useCallback } from 'react';

interface ErrorHandlerOptions {
  redirectOn404?: boolean;
  redirectUrl?: string;
  showNotification?: boolean;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {
    redirectOn404 = true,
    redirectUrl = 'https://prosperian-front.vercel.app',
    showNotification = true
  } = options;

  const handleError = useCallback((error: any) => {
    console.error('🚨 Erreur détectée:', error);

    // Gestion spécifique des erreurs 404
    if (error?.response?.status === 404 || error?.status === 404) {
      console.log('🚨 Erreur 404 détectée, redirection vers', redirectUrl);
      
      if (redirectOn404) {
        // Redirection immédiate
        window.location.href = redirectUrl;
        return;
      }
    }

    // Gestion des autres erreurs
    if (error?.response?.status === 401) {
      // Erreur d'authentification
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }

    if (error?.response?.status === 403) {
      // Erreur d'autorisation
      console.error('Accès interdit');
      return;
    }

    if (error?.response?.status >= 500) {
      // Erreur serveur
      console.error('Erreur serveur:', error.response?.data);
      return;
    }

    // Erreur générique
    console.error('Erreur inattendue:', error);
  }, [redirectOn404, redirectUrl, showNotification]);

  return { handleError };
}; 