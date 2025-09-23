import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="w-9 h-9 p-0 bg-white hover:bg-gray-100 dark:bg-white dark:hover:bg-gray-100 transition-colors rounded-md shadow-sm"
      aria-label={`Switch to ${i18n.language === 'en' ? 'French' : 'English'}`}
    >
      <span className="text-sm font-semibold text-gray-700">
        {i18n.language === 'en' ? 'FR' : 'EN'}
      </span>
    </Button>
  );
};

export default LanguageToggle;