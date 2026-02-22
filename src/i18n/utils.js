export const getLocalized = (localized, language, fallback = 'en') => {
  if (!localized || typeof localized !== 'object') return localized;

  if (Object.prototype.hasOwnProperty.call(localized, language)) {
    return localized[language];
  }

  if (Object.prototype.hasOwnProperty.call(localized, fallback)) {
    return localized[fallback];
  }

  return localized;
};
