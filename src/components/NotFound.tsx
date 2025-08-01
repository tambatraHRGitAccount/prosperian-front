import React, { useEffect } from 'react';
import { redirectWithDelay } from '@utils/redirectUtils';

const NotFound: React.FC = () => {
  useEffect(() => {
    console.log('🚨 Route 404 détectée, redirection vers https://prosperian-front.vercel.app');
    
    // Redirection automatique après un court délai
    redirectWithDelay('https://prosperian-front.vercel.app', 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E95C41] mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Page non trouvée
        </h2>
        <p className="text-gray-600 mb-4">
          Redirection en cours vers la page principale...
        </p>
        <p className="text-sm text-gray-500">
          Si la redirection ne fonctionne pas, 
          <a 
            href="https://prosperian-front.vercel.app" 
            className="text-[#E95C41] hover:underline ml-1"
          >
            cliquez ici
          </a>
        </p>
      </div>
    </div>
  );
};

export default NotFound; 