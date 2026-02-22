"use client";
import AnimatedPage from '@/components/AnimatedPage.jsx';
import RulesLayout from '@/components/RulesLayout.jsx';
import { serverRules as rulesData } from '@/data/rules.js';
import { useLanguage } from '@/i18n/LanguageContext.jsx';
import { getLocalized } from '@/i18n/utils.js';

export default function ServerRules() {
    const { language } = useLanguage();
    const data = getLocalized(rulesData, language);

    return (
        <AnimatedPage>
            <RulesLayout data={data} />
        </AnimatedPage>
    );
}
