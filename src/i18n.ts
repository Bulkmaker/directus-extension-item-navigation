type Locale = 'en' | 'ru';

type Translations = {
    interfaceName: string;
    interfaceDescription: string;
    sortFieldLabel: string;
    sortFieldNote: string;
    sortDirectionLabel: string;
    directionAscending: string;
    directionDescending: string;
    showLabelsLabel: string;
    showLabelsNote: string;
    prev: string;
    next: string;
};

const translations: Record<Locale, Translations> = {
    en: {
        interfaceName: 'Item Navigation',
        interfaceDescription: 'Prev/Next navigation buttons for items',
        sortFieldLabel: 'Sort Field',
        sortFieldNote: 'Leave empty to auto-detect (sort → id)',
        sortDirectionLabel: 'Sort Direction',
        directionAscending: 'Ascending',
        directionDescending: 'Descending',
        showLabelsLabel: 'Show Labels',
        showLabelsNote: 'Show Prev/Next text on buttons',
        prev: 'Prev',
        next: 'Next',
    },
    ru: {
        interfaceName: 'Навигация элементов',
        interfaceDescription: 'Кнопки навигации Назад/Далее для элементов',
        sortFieldLabel: 'Поле сортировки',
        sortFieldNote: 'Оставьте пустым для автоопределения (sort → id)',
        sortDirectionLabel: 'Направление сортировки',
        directionAscending: 'По возрастанию',
        directionDescending: 'По убыванию',
        showLabelsLabel: 'Показывать подписи',
        showLabelsNote: 'Показывать текст Назад/Далее на кнопках',
        prev: 'Назад',
        next: 'Далее',
    },
};

const getLocale = (): Locale => {
    const documentLang = typeof document !== 'undefined' ? document.documentElement.lang : '';
    const navigatorLang = typeof navigator !== 'undefined' ? navigator.language : '';
    const locale = (documentLang || navigatorLang || 'en').toLowerCase();

    return locale.startsWith('ru') ? 'ru' : 'en';
};

export const t = (key: keyof Translations) => {
    const locale = getLocale();

    return translations[locale][key] || translations.en[key] || key;
};
