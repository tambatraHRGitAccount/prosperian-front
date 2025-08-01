/**
 * Utilitaires pour la gestion des redirections
 */

const DEFAULT_REDIRECT_URL = 'https://prosperian-front.vercel.app';

/**
 * Redirige vers l'URL spécifiée
 */
export const redirectTo = (url: string = DEFAULT_REDIRECT_URL): void => {
  console.log('🔄 Redirection vers:', url);
  window.location.href = url;
};

/**
 * Redirige vers l'URL par défaut (Prosperian Front)
 */
export const redirectToDefault = (): void => {
  redirectTo(DEFAULT_REDIRECT_URL);
};

/**
 * Redirige vers la page de login
 */
export const redirectToLogin = (): void => {
  redirectTo('/login');
};

/**
 * Redirige vers la page d'accueil
 */
export const redirectToHome = (): void => {
  redirectTo('/');
};

/**
 * Vérifie si l'URL actuelle est une erreur 404
 */
export const is404Error = (error: any): boolean => {
  return error?.response?.status === 404 || error?.status === 404;
};

/**
 * Gère une erreur 404 en redirigeant vers l'URL par défaut
 */
export const handle404Error = (error: any, customRedirectUrl?: string): void => {
  if (is404Error(error)) {
    console.log('🚨 Erreur 404 détectée, redirection...');
    redirectTo(customRedirectUrl || DEFAULT_REDIRECT_URL);
  }
};

/**
 * Redirection avec délai
 */
export const redirectWithDelay = (
  url: string = DEFAULT_REDIRECT_URL, 
  delay: number = 1000
): void => {
  setTimeout(() => {
    redirectTo(url);
  }, delay);
}; 