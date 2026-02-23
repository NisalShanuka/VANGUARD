"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AnimatedPage from '@/components/AnimatedPage';
import RulesLayout from '@/components/RulesLayout';
import { useLanguage } from '@/i18n/LanguageContext';

export default function RulesPage() {
    const params = useParams();
    const { language } = useLanguage();
    const { data: session } = useSession();
    const [fullData, setFullData] = useState(null);
    const [rulesData, setRulesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const isAdmin = session?.user?.role === 'admin';

    const fetchRules = () => {
        setLoading(true);
        fetch(`/api/knowledgebase/${params.slug}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setFullData(data);
                    setRulesData(data[language]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRules();
    }, [params.slug, language]);

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="relative flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent-400 shadow-[0_0_10px_#c8c8c84d]"></div><div className="absolute inset-[-4px] rounded-full border border-white/5 animate-pulse"></div></div>
        </div>
    );

    if (!rulesData) return <div className="p-20 text-center text-white/50">Page not found or failed to load.</div>;

    return (
        <AnimatedPage>
            <RulesLayout
                data={rulesData}
                fullPageData={fullData}
                isAdmin={isAdmin}
                refreshData={fetchRules}
            />
        </AnimatedPage>
    );
}
