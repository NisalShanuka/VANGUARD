"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AnimatedPage from '@/components/AnimatedPage';
import PageHeader from '@/components/PageHeader';
import { useLanguage } from '@/i18n/LanguageContext';
import { getLocalized } from '@/i18n/utils';

export default function Knowledgebase() {
    const { language, t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/knowledgebase')
            .then(res => res.json())
            .then(data => {
                if (!data.error) setItems(getLocalized(data, language));
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [language]);

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-none border-b-2 border-white"></div>
        </div>
    );

    const knowledgebaseItems = items;

    return (
        <AnimatedPage>
            <PageHeader
                title={t('knowledgebase.title')}
                subtitle={t('knowledgebase.subtitle')}
                description={t('knowledgebase.description')}
            />

            <section className="mx-auto max-w-6xl px-6 pb-16">
                <div
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {knowledgebaseItems.map((item) => {
                        const isUnavailable = !item.to;
                        const card = (
                            <div
                                className={`rounded-none border border-white/10 bg-black/90 p-6 shadow-lg flex h-full flex-col gap-4 transition duration-300 ${isUnavailable ? 'opacity-60' : 'hover:border-white hover:-translate-y-1 hover:scale-[1.01] active:scale-95'
                                    }`}
                            >
                                <div>
                                    <h3 className="text-h3">{item.title}</h3>
                                    <p className="mt-2 text-overline uppercase tracking-[0.24em] text-white/50">{item.status}</p>
                                </div>
                                {isUnavailable ? (
                                    <span className="text-small text-white/60">{t('knowledgebase.comingSoon')}</span>
                                ) : (
                                    <span className="text-small text-white font-bold tracking-widest">{t('knowledgebase.openFolder')}</span>
                                )}
                            </div>
                        );

                        return item.to ? (
                            <Link key={item.title} href={item.to} className="block">
                                {card}
                            </Link>
                        ) : (
                            <div key={item.title}>{card}</div>
                        );
                    })}
                </div>
            </section>
        </AnimatedPage>
    );
}
