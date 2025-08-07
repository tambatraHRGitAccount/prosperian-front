// Test simple pour vérifier le mapping des données
// Ce fichier peut être exécuté dans la console du navigateur pour tester

import {
  extractDomain,
  extractCountryCode,
  generateLinkedInUrl,
  mapEntrepriseToProtoCompany,
  convertSelectedBusinessesToProntoFormat
} from './prontoMapper';
import { EntrepriseApiResult } from '../entities/Business';

// Données de test
const testEntreprises: EntrepriseApiResult[] = [
  {
    siren: '123456789',
    nom_complet: 'PRONTO SAS',
    nom_raison_sociale: 'PRONTO',
    siege: {
      adresse: '123 Rue de la Tech, 75001 Paris',
      code_postal: '75001',
      commune: 'Paris'
    },
    complements: {
      web_info: {
        website: 'https://www.prontohq.com'
      }
    }
  },
  {
    siren: '987654321',
    nom_complet: 'GOOGLE FRANCE SARL',
    nom_raison_sociale: 'GOOGLE FRANCE',
    siege: {
      adresse: '8 Rue de Londres, 75009 Paris',
      code_postal: '75009',
      commune: 'Paris'
    },
    complements: {
      web_info: {
        website: 'google.com'
      }
    }
  },
  {
    siren: '456789123',
    nom_complet: 'ENTREPRISE SANS SITE SARL',
    nom_raison_sociale: 'ENTREPRISE SANS SITE',
    siege: {
      adresse: '10 Avenue des Champs, 69000 Lyon',
      code_postal: '69000',
      commune: 'Lyon'
    },
    complements: {}
  }
];

// Tests unitaires
export const runTests = () => {
  console.log('🧪 Tests du mapper Pronto');
  console.log('========================');

  // Test extractDomain
  console.log('\n1. Test extractDomain:');
  console.log('https://www.prontohq.com/about →', extractDomain('https://www.prontohq.com/about'));
  console.log('www.google.com →', extractDomain('www.google.com'));
  console.log('google.com →', extractDomain('google.com'));
  console.log('invalid-url →', extractDomain('invalid-url'));

  // Test generateLinkedInUrl
  console.log('\n2. Test generateLinkedInUrl:');
  console.log('PRONTO SAS →', generateLinkedInUrl('PRONTO SAS'));
  console.log('Google France →', generateLinkedInUrl('Google France'));
  console.log('A →', generateLinkedInUrl('A'));

  // Test mapEntrepriseToProtoCompany
  console.log('\n3. Test mapEntrepriseToProtoCompany:');
  testEntreprises.forEach((entreprise, index) => {
    console.log(`Entreprise ${index + 1}:`, mapEntrepriseToProtoCompany(entreprise));
  });

  // Test convertSelectedBusinessesToProntoFormat
  console.log('\n4. Test convertSelectedBusinessesToProntoFormat:');
  const result = convertSelectedBusinessesToProntoFormat(testEntreprises);
  console.log('Résultat final:', result);

  console.log('\n✅ Tests terminés');
  return result;
};

// Fonction pour tester dans la console du navigateur
export const testInBrowser = () => {
  console.log('Pour tester le mapper dans la console du navigateur:');
  console.log('1. Ouvrez la console (F12)');
  console.log('2. Importez le module:');
  console.log('   import { runTests } from "./utils/prontoMapper.test";');
  console.log('3. Exécutez les tests:');
  console.log('   runTests();');
};

// Export pour utilisation directe
export { testEntreprises };
