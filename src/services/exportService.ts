import { ProntoService } from './prontoService';
import { buildApiUrl } from '../config/api';

// Types pour l'exportation
export interface ExportData {
  leads: Array<{
    lead: {
      status: string;
      rejection_reasons: string[];
      first_name: string;
      last_name: string;
      gender: string | null;
      email: string | null;
      email_status: string | null;
      phone: Array<{
        number: string;
        status: string;
        provider: string;
        phone_type: string;
      }>;
      linkedin_url: string;
      profile_image_url: string;
      location: string;
      title: string;
      years_in_position: number;
      months_in_position: number;
      years_in_company: number;
      months_in_company: number;
    };
    company: {
      name: string;
      cleaned_name: string;
      website: string;
      location: string;
      industry: string;
      headquarters: {
        city: string;
        line1: string;
        country: string;
        postalCode: string;
        geographicArea: string;
      };
      description: string;
      linkedin_url: string;
      linkedin_id: string;
      employee_range: string;
      company_profile_picture: string;
    };
  }>;
}

export class ExportService {
  // Fonction pour récupérer les données complètes d'une recherche
  static async getCompleteSearchData(searchId: string): Promise<ExportData> {
    try {
      const data = await ProntoService.getSearchWithLeads(searchId);
      return data as ExportData;
    } catch (error) {
      console.error('Error fetching complete search data:', error);
      throw error;
    }
  }

  // Fonction pour convertir les données en format CSV
  static convertToCSV(data: ExportData, type: string = 'entreprise'): string {
    // Colonnes personnalisées pour contact
    const contactHeaders = [
      'first name', 'last name', 'gender', 'title', 'email', 'phone', 'all phones', 'company name', 'company cleaned name', 'company website', 'company domain', 'linkedin profile url', 'company linkedin id url', 'location', 'company location', 'company industry', 'employee count', 'employee range', 'revenue', 'headquarters', 'year founded', 'linkedin headline', 'linkedin connections count', 'start date job', 'start date company', 'years in position', 'months in position', 'years in company', 'months in company', 'current positions count', 'title description', 'summary', 'full name', 'sales navigator profile url', 'linkedin id url', 'profile image url', 'company profile picture', 'company description', 'company linkedin', 'connection degree', 'is premium linkedin', 'is open profile linkedin', 'is open to work linkedin'
    ];
    // Colonnes standard pour l'entreprise
    const standardHeaders = [
      // Données du lead
      'Lead Status',
      'Lead Rejection Reasons',
      'Lead First Name',
      'Lead Last Name',
      'Lead Gender',
      'Lead Email',
      'Lead Email Status',
      'Lead Phone Numbers',
      'Lead Phone Status',
      'Lead Phone Provider',
      'Lead Phone Type',
      'Lead LinkedIn URL',
      'Lead Profile Image URL',
      'Lead Location',
      'Lead Title',
      'Lead Years in Position',
      'Lead Months in Position',
      'Lead Years in Company',
      'Lead Months in Company',
      // Données de l'entreprise
      'Company Name',
      'Company Cleaned Name',
      'Company Website',
      'Company Location',
      'Company Industry',
      'Company City',
      'Company Address Line 1',
      'Company Country',
      'Company Postal Code',
      'Company Geographic Area',
      'Company Description',
      'Company LinkedIn URL',
      'Company LinkedIn ID',
      'Company Employee Range',
      'Company Profile Picture'
    ];
    // Colonnes personnalisées pour entreprise (export depuis entreprise)
    const entrepriseHeaders = [
      'Company Name', 'Website', 'Domain', 'Description', 'Country', 'Industry', 'Employees', 'LinkedIn URL', 'LinkedIn ID'
    ];

    const headers = type === 'contact' ? contactHeaders : (type === 'entreprise' ? entrepriseHeaders : standardHeaders);

    const csvRows = [headers.join('\t')];

    // Fonction utilitaire pour nettoyer les champs (supprimer \n, \r)
    function cleanField(val: any) {
      if (typeof val !== 'string') return val || '';
      return val.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    data.leads.forEach(leadData => {
      const lead = leadData.lead || {};
      const company = leadData.company || {};
      const headquarters = company.headquarters || {};
      const phones = Array.isArray(lead.phone) ? lead.phone : [];

      if (type === 'contact') {
        // Mapping personnalisé pour contact
        const row = [
          cleanField(lead.first_name),
          cleanField(lead.last_name),
          cleanField(lead.gender),
          cleanField(lead.title),
          cleanField(lead.email),
          cleanField(phones[0]?.number),
          cleanField(phones.map(p => p.number).join('; ')),
          cleanField(company.name),
          cleanField(company.cleaned_name),
          cleanField(company.website),
          cleanField(company.domain),
          cleanField(lead.linkedin_url),
          cleanField(company.linkedin_id),
          cleanField(lead.location),
          cleanField(company.location),
          cleanField(company.industry),
          cleanField(company.employee_count),
          cleanField(company.employee_range),
          cleanField(company.revenue),
          cleanField(headquarters.line1),
          cleanField(company.year_founded),
          cleanField(lead.linkedin_headline),
          cleanField(lead.linkedin_connections_count),
          cleanField(lead.start_date_job),
          cleanField(lead.start_date_company),
          cleanField(lead.years_in_position),
          cleanField(lead.months_in_position),
          cleanField(lead.years_in_company),
          cleanField(lead.months_in_company),
          cleanField(lead.current_positions_count),
          cleanField(lead.title_description),
          cleanField(lead.summary),
          cleanField(lead.full_name),
          cleanField(lead.sales_navigator_profile_url),
          cleanField(lead.linkedin_id_url),
          cleanField(lead.profile_image_url),
          cleanField(company.company_profile_picture),
          cleanField(company.description),
          cleanField(company.linkedin_url),
          cleanField(lead.connection_degree),
          cleanField(lead.is_premium_linkedin),
          cleanField(lead.is_open_profile_linkedin),
          cleanField(lead.is_open_to_work_linkedin)
        ];
        csvRows.push(row.join('\t'));
      } else if (type === 'entreprise') {
        // Mapping personnalisé pour entreprise
        const row = [
          cleanField(company.name),
          cleanField(company.website),
          cleanField(company.domain),
          cleanField(company.description),
          cleanField(headquarters.country),
          cleanField(company.industry),
          company.employee_range ? cleanField(company.employee_range) + ' employees' : '',
          cleanField(company.linkedin_url),
          cleanField(company.linkedin_id)
        ];
        csvRows.push(row.join('\t'));
      } else {
        // Lead fields
        const phoneNumbers = phones.map(p => p.number).join('; ');
        const phoneStatuses = phones.map(p => p.status).join('; ');
        const phoneProviders = phones.map(p => p.provider).join('; ');
        const phoneTypes = phones.map(p => p.phone_type).join('; ');
        // Rejection reasons
        const rejectionReasons = Array.isArray(lead.rejection_reasons) ? lead.rejection_reasons.join('; ') : '';
        const row = [
          // Données du lead
          `"${lead.status || ''}"`,
          `"${rejectionReasons}"`,
          `"${lead.first_name || ''}"`,
          `"${lead.last_name || ''}"`,
          `"${lead.gender || ''}"`,
          `"${lead.email || ''}"`,
          `"${lead.email_status || ''}"`,
          `"${phoneNumbers}"`,
          `"${phoneStatuses}"`,
          `"${phoneProviders}"`,
          `"${phoneTypes}"`,
          `"${lead.linkedin_url || ''}"`,
          `"${lead.profile_image_url || ''}"`,
          `"${lead.location || ''}"`,
          `"${lead.title || ''}"`,
          lead.years_in_position || '',
          lead.months_in_position || '',
          lead.years_in_company || '',
          lead.months_in_company || '',
          // Données de l'entreprise
          `"${company.name || ''}"`,
          `"${company.cleaned_name || ''}"`,
          `"${company.website || ''}"`,
          `"${company.location || ''}"`,
          `"${company.industry || ''}"`,
          `"${headquarters.city || ''}"`,
          `"${headquarters.line1 || ''}"`,
          `"${headquarters.country || ''}"`,
          `"${headquarters.postalCode || ''}"`,
          `"${headquarters.geographicArea || ''}"`,
          `"${company.description || ''}"`,
          `"${company.linkedin_url || ''}"`,
          `"${company.linkedin_id || ''}"`,
          `"${company.employee_range || ''}"`,
          `"${company.company_profile_picture || ''}"`
        ];
        csvRows.push(row.join(','));
      }
    });

    return csvRows.join('\n');
  }

  // Fonction pour télécharger un fichier
  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Fonction pour envoyer le fichier exporté au backend
  static async uploadExportedFile(content: string, filename: string, mimeType: string) {
    try {
      const response = await fetch(buildApiUrl('/api/file'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          mimeType,
          content: btoa(unescape(encodeURIComponent(content))) // Encodage base64
        })
      });
      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload du fichier exporté');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur uploadExportedFile:', error);
    }
  }

  // Fonction principale d'exportation
  static async exportSearchData(searchId: string, filename: string) {
    try {
      // Récupérer les données complètes
      const data = await this.getCompleteSearchData(searchId);
      
      // Convertir en CSV
      const csvContent = this.convertToCSV(data);
      
      // Télécharger le fichier CSV
      this.downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
      
      // Pour l'export XLSX, nous utiliserons une bibliothèque externe
      // Pour l'instant, nous créons un fichier CSV avec extension .xlsx
      // TODO: Implémenter la vraie conversion XLSX avec une bibliothèque comme xlsx
      this.downloadFile(csvContent, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Fonction pour exporter les données sélectionnées depuis BusinessCard
  static async exportSelectedBusinesses(selectedBusinesses: any[], filename: string, type: string = 'entreprise') {
    try {
      // Convertir les données BusinessCard en format d'export
      const exportData: ExportData = {
        leads: selectedBusinesses.map(business => {
          // Correction du mapping phone
          let phones: any[] = [];
          if (Array.isArray(business.lead?.phone)) {
            // Déjà un tableau d'objets
            phones = business.lead.phone;
          } else if (typeof business.lead?.phone === 'string') {
            phones = [{ number: business.lead.phone, status: '', provider: '', phone_type: '' }];
          } else if (business.phone) {
            if (Array.isArray(business.phone)) {
              phones = business.phone.map((num: any) =>
                typeof num === 'string'
                  ? { number: num, status: '', provider: '', phone_type: '' }
                  : num
              );
            } else if (typeof business.phone === 'string') {
              phones = [{ number: business.phone, status: '', provider: '', phone_type: '' }];
            } else if (typeof business.phone === 'object' && business.phone !== null) {
              phones = [business.phone];
            }
          }
          return {
          lead: {
              status: business.lead?.status || 'QUALIFIED',
              rejection_reasons: business.lead?.rejection_reasons || [],
            first_name: business.lead?.first_name || '',
            last_name: business.lead?.last_name || '',
            gender: business.lead?.gender || null,
            email: business.lead?.email || business.email || null,
            email_status: business.lead?.email_status || null,
              phone: phones,
            linkedin_url: business.lead?.linkedin_url || business.linkedin || '',
            profile_image_url: business.lead?.profile_image_url || '',
            location: business.lead?.location || business.city || '',
            title: business.lead?.title || '',
            years_in_position: business.lead?.years_in_position || 0,
            months_in_position: business.lead?.months_in_position || 0,
            years_in_company: business.lead?.years_in_company || 0,
            months_in_company: business.lead?.months_in_company || 0
          },
          company: {
            name: business.name || business.company?.name || '',
            cleaned_name: business.company?.cleaned_name || business.name || '',
            website: business.website || business.company?.website || '',
            location: business.company?.location || business.city || '',
            industry: business.activity || business.company?.industry || '',
            headquarters: {
              city: business.city || business.company?.headquarters?.city || '',
              line1: business.address || business.company?.headquarters?.line1 || '',
              country: business.company?.headquarters?.country || 'France',
              postalCode: business.postalCode || business.company?.headquarters?.postalCode || '',
              geographicArea: business.company?.headquarters?.geographicArea || ''
            },
            description: business.description || business.company?.description || '',
            linkedin_url: business.company?.linkedin_url || '',
            linkedin_id: business.company?.linkedin_id || '',
            employee_range: business.employees || business.company?.employee_range || '',
            company_profile_picture: business.logo || business.company?.company_profile_picture || ''
          }
          };
        })
      };

      // Convertir en CSV
      const csvContent = this.convertToCSV(exportData, type);
      // Télécharger les fichiers
      this.downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
      this.downloadFile(csvContent, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      // Envoyer au backend (CSV)
      const csvRes = await this.uploadExportedFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
      const csvPath = csvRes?.filePath || `/public/file/${filename}.csv`;
      await fetch(buildApiUrl('/api/file/export'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: `${filename}.csv`,
          path: csvPath,
          type,
          ligne: exportData.leads.length
        })
      });
      // Envoyer au backend (XLSX)
      const xlsxRes = await this.uploadExportedFile(csvContent, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const xlsxPath = xlsxRes?.filePath || `/public/file/${filename}.xlsx`;
      await fetch(buildApiUrl('/api/file/export'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: `${filename}.xlsx`,
          path: xlsxPath,
          type,
          ligne: exportData.leads.length
        })
      });
      return true;
    } catch (error) {
      console.error('Error exporting selected businesses:', error);
      throw error;
    }
  }
} 