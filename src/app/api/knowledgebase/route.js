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
                    en: JSON.parse(page.data_en || '{}'),
                    si: JSON.parse(page.data_si || '{}')
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

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, slug, en, si } = await req.json();

        if (id) {
            // Update existing
            await query(
                "UPDATE knowledgebase_pages SET data_en = ?, data_si = ? WHERE id = ?",
                [JSON.stringify(en), JSON.stringify(si), id]
            );
        } else {
            // Create new
            await query(
                "INSERT INTO knowledgebase_pages (slug, data_en, data_si) VALUES (?, ?, ?)",
                [slug, JSON.stringify(en), JSON.stringify(si)]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[KB API POST Error]', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
