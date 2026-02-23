"use client";
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedPage from '@/components/AnimatedPage';
import PageHeader from '@/components/PageHeader';
import { useLanguage } from '@/i18n/LanguageContext';
import { getLocalized } from '@/i18n/utils';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function KnowledgebaseArticle({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const { slug } = params;
    const { language, t } = useLanguage();
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug) return;

        fetch(`/api/knowledgebase/${slug}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setPageData(data);
                }
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load article');
            })
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="relative flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent-400 shadow-[0_0_10px_#c8c8c84d]"></div><div className="absolute inset-[-4px] rounded-full border border-white/5 animate-pulse"></div></div>
        </div>
    );

    if (error || !pageData) return (
        <AnimatedPage>
            <div className="mx-auto max-w-4xl px-6 py-20 text-center">
                <h1 className="text-h2 text-white mb-4">{error || 'Article Not Found'}</h1>
                <Link href="/knowledgebase" className="text-white/60 hover:text-white transition-colors">
                    &larr; Back to Knowledgebase
                </Link>
            </div>
        </AnimatedPage>
    );

    const content = getLocalized(pageData, language);

    return (
        <AnimatedPage>
            <div className="mx-auto max-w-4xl px-6 pt-8 pb-16">
                <Link href="/knowledgebase" className="group flex items-center gap-2 text-overline text-white/50 hover:text-white transition-colors mb-8 capitalize">
                    <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    {t('knowledgebase.backToKB') || 'Back to Knowledgebase'}
                </Link>

                <div className="rounded-none border border-white/10 bg-black/90 p-8 md:p-12 shadow-2xl">
                    <h1 className="text-h2 text-white mb-2">{content.title}</h1>
                    <div className="h-1 w-20 bg-white mb-8"></div>

                    <div
                        className="prose prose-invert max-w-none text-white/80 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: content.content }}
                    />
                </div>
            </div>
        </AnimatedPage>
    );
}
