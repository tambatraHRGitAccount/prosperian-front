// Script de test simple pour vérifier le mapping
// Peut être exécuté dans Node.js pour tester les fonctions utilitaires

// Simulation des fonctions de mapping (version simplifiée pour test)
const extractDomain = (url) => {
  if (!url) return undefined;
  
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const domain = new URL(urlWithProtocol).hostname;
    return domain.startsWith('www.') ? domain.substring(4) : domain;
  } catch {
    const cleaned = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    return cleaned || undefined;
  }
};

const generateLinkedInUrl = (companyName) => {
  if (!companyName) return undefined;
  
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (slug.length < 2) return undefined;
  
  return `https://www.linkedin.com/company/${slug}`;
};

const mapEntrepriseToProtoCompany = (entreprise) => {
  const website = entreprise.complements?.web_info?.website || entreprise.complements?.website;
  const domain = extractDomain(website);
  const linkedinUrl = generateLinkedInUrl(entreprise.nom_complet);

  return {
    name: entreprise.nom_complet || entreprise.nom_raison_sociale || '',
    country_code: 'FR',
    domain: domain || null,
    linkedin_url: linkedinUrl || null,
  };
};

// Données de test
const testEntreprises = [
  {
    siren: '123456789',
    nom_complet: 'PRONTO SAS',
    nom_raison_sociale: 'PRONTO',
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
    complements: {}
  }
];

// Tests
console.log('🧪 Test du mapping Pronto');
console.log('========================\n');

console.log('1. Test extractDomain:');
console.log('https://www.prontohq.com/about →', extractDomain('https://www.prontohq.com/about'));
console.log('www.google.com →', extractDomain('www.google.com'));
console.log('google.com →', extractDomain('google.com'));
console.log('invalid-url →', extractDomain('invalid-url'));

console.log('\n2. Test generateLinkedInUrl:');
console.log('PRONTO SAS →', generateLinkedInUrl('PRONTO SAS'));
console.log('Google France →', generateLinkedInUrl('Google France'));
console.log('A →', generateLinkedInUrl('A'));

console.log('\n3. Test mapEntrepriseToProtoCompany:');
testEntreprises.forEach((entreprise, index) => {
  console.log(`Entreprise ${index + 1}:`, mapEntrepriseToProtoCompany(entreprise));
});

console.log('\n✅ Tests terminés');

// Simulation de l'envoi à l'API (nettoyage des valeurs null)
const cleanForAPI = (companies) => {
  return companies.map(company => {
    const cleaned = { name: company.name };
    
    if (company.country_code) cleaned.country_code = company.country_code;
    if (company.domain) cleaned.domain = company.domain;
    if (company.linkedin_url) cleaned.linkedin_url = company.linkedin_url;
    
    return cleaned;
  });
};

const mappedCompanies = testEntreprises.map(mapEntrepriseToProtoCompany);
const cleanedForAPI = cleanForAPI(mappedCompanies);

console.log('\n4. Données nettoyées pour l\'API:');
console.log(JSON.stringify(cleanedForAPI, null, 2));
