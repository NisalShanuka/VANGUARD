"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AnimatedPage from '@/components/AnimatedPage';
import SituationLayout from '@/components/SituationLayout';
import { useLanguage } from '@/i18n/LanguageContext';

export default function CountsPage() {
    const params = useParams();
    const { language } = useLanguage();
    const [countsData, setCountsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/knowledgebase/${params.slug}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setCountsData(data[language]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [params.slug, language]);

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="relative flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent-400 shadow-[0_0_10px_#c8c8c84d]"></div><div className="absolute inset-[-4px] rounded-full border border-white/5 animate-pulse"></div></div>
        </div>
    );

    if (!countsData) return <div className="p-20 text-center text-white/50">Page not found or failed to load.</div>;

    return (
        <AnimatedPage>
            <SituationLayout data={countsData} />
        </AnimatedPage>
    );
}
