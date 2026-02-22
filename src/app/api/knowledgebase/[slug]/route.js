import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    const { slug } = await params;
    try {
        const results = await query("SELECT * FROM knowledgebase_pages WHERE slug = ?", [slug]);
        if (results.length > 0) {
            const page = results[0];
            return NextResponse.json({
                slug: page.slug,
                en: JSON.parse(page.data_en),
                si: JSON.parse(page.data_si),
                updated_at: page.updated_at
            });
        }

        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    } catch (error) {
        console.error('[KB Page GET Error]', error.message);
        return NextResponse.json({ error: 'Failed to load knowledgebase page' }, { status: 500 });
    }
}
