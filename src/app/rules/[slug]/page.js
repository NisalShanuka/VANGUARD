"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AnimatedPage from '@/components/AnimatedPage';
import RulesLayout from '@/components/RulesLayout';
import { useLanguage } from '@/i18n/LanguageContext';

export default function RulesPage() {
    const params = useParams();
    const { language } = useLanguage();
    const [rulesData, setRulesData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/knowledgebase/${params.slug}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setRulesData(data[language]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [params.slug, language]);

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-none border-b-2 border-white"></div>
        </div>
    );

    if (!rulesData) return <div className="p-20 text-center text-white/50">Page not found or failed to load.</div>;

    return (
        <AnimatedPage>
            <RulesLayout data={rulesData} />
        </AnimatedPage>
    );
}
