"use client";
import AnimatedPage from '@/components/AnimatedPage';
import WhitelistForm from '@/components/WhitelistForm';
import PageHeader from '@/components/PageHeader';
import { useLanguage } from '@/i18n/LanguageContext';
import { useEffect } from 'react';

export default function WhitelistEnglish() {
    const { setLanguage, t } = useLanguage();

    useEffect(() => {
        setLanguage('en');
    }, [setLanguage]);

    return (
        <AnimatedPage>
            <PageHeader
                title="WHITELIST REGISTRATION"
                kicker="Membership Application"
                description="Join our elite community. Fill out the application below to start your journey in Vanguard Roleplay."
            />

            <div className="mx-auto max-w-7xl px-8 pb-32 md:px-12">
                <WhitelistForm
                    slug="english"
                    successMessage="Your application has been submitted successfully. Our staff will review it soon."
                    errorMessage="Something went wrong. Please try again or contact support."
                />
            </div>
        </AnimatedPage>
    );
}
