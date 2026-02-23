"use client";
import AnimatedPage from '@/components/AnimatedPage.jsx';
import WhitelistForm from '@/components/WhitelistForm.jsx';
import { useLanguage } from '@/i18n/LanguageContext.jsx';
import { useEffect } from 'react';

export default function WhitelistSinhala() {
    const { setLanguage } = useLanguage();

    useEffect(() => {
        setLanguage('si');
    }, [setLanguage]);

    return (
        <AnimatedPage>
            <WhitelistForm slug="sinhala" />
        </AnimatedPage>
    );
}
