// Utilitaires pour gérer les compteurs de sélection en localStorage

const CONTACTS_COUNT_KEY = 'selected_contacts_count';
const ENTERPRISES_COUNT_KEY = 'selected_enterprises_count';

export const getSelectedContactsCount = (): number => {
  try {
    const count = localStorage.getItem(CONTACTS_COUNT_KEY);
    const parsed = count ? parseInt(count, 10) : 0;
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error('Erreur lors de la lecture du compteur contacts:', error);
    return 0;
  }
};

export const getSelectedEnterprisesCount = (): number => {
  try {
    const count = localStorage.getItem(ENTERPRISES_COUNT_KEY);
    const parsed = count ? parseInt(count, 10) : 0;
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error('Erreur lors de la lecture du compteur entreprises:', error);
    return 0;
  }
};

export const setSelectedContactsCount = (count: number): void => {
  try {
    const safeCount = isNaN(count) ? 0 : Math.max(0, count);
    localStorage.setItem(CONTACTS_COUNT_KEY, safeCount.toString());
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du compteur contacts:', error);
  }
};

export const setSelectedEnterprisesCount = (count: number): void => {
  try {
    const safeCount = isNaN(count) ? 0 : Math.max(0, count);
    localStorage.setItem(ENTERPRISES_COUNT_KEY, safeCount.toString());
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du compteur entreprises:', error);
  }
};

export const incrementSelectedContactsCount = (): void => {
  const currentCount = getSelectedContactsCount();
  setSelectedContactsCount(currentCount + 1);
};

export const decrementSelectedContactsCount = (): void => {
  const currentCount = getSelectedContactsCount();
  setSelectedContactsCount(Math.max(0, currentCount - 1));
};

export const incrementSelectedEnterprisesCount = (): void => {
  const currentCount = getSelectedEnterprisesCount();
  setSelectedEnterprisesCount(currentCount + 1);
};

export const decrementSelectedEnterprisesCount = (): void => {
  const currentCount = getSelectedEnterprisesCount();
  setSelectedEnterprisesCount(Math.max(0, currentCount - 1));
};

export const resetSelectedContactsCount = (): void => {
  setSelectedContactsCount(0);
};

export const resetSelectedEnterprisesCount = (): void => {
  setSelectedEnterprisesCount(0);
}; 