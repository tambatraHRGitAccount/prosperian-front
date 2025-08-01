import axios from 'axios';
import { API_CONFIG } from './api';
import { handle404Error, redirectToLogin } from '@utils/redirectUtils';

// Configuration Axios globale
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour les requêtes
axiosInstance.interceptors.request.use(
  (config) => {
    // Ajouter le token d'authentification si disponible
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

  // Intercepteur pour les réponses
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Gestion spécifique des erreurs 404 NOT_FOUND
      handle404Error(error);

      // Gestion des autres erreurs
      if (error.response?.status === 401) {
        // Erreur d'authentification - déconnexion
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        redirectToLogin();
      }

      return Promise.reject(error);
    }
  );

export default axiosInstance; 