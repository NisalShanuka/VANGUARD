import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    try {
        if (slug) {
            // Fetch individual page
            const results = await query("SELECT * FROM knowledgebase_pages WHERE slug = ?", [slug]);
            if (results.length > 0) {
                const page = results[0];
                return NextResponse.json({
                    id: page.id,
                    slug: page.slug,
                    en: JSON.parse(page.en_content || '{}'),
                    si: JSON.parse(page.si_content || '{}')
                });
            }
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        // Default: Fetch categories (for list view)
        const results = await query("SELECT value_data FROM kv_store WHERE key_name = 'knowledgebase_categories'");
        if (results.length > 0) {
            return NextResponse.json(JSON.parse(results[0].value_data));
        }

        return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    } catch (error) {
        console.error('[KB API GET Error]', error.message);
        return NextResponse.json({ error: 'Failed to load knowledgebase data' }, { status: 500 });
    }
}
