import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const results = await query("SELECT value_data FROM kv_store WHERE key_name = 'knowledgebase_categories'");
        if (results.length > 0) {
            return NextResponse.json(JSON.parse(results[0].value_data));
        }

        // Fallback or error if not found
        return NextResponse.json({ error: 'Knowledgebase categories not found' }, { status: 404 });
    } catch (error) {
        console.error('[KB Categories GET Error]', error.message);
        return NextResponse.json({ error: 'Failed to load knowledgebase categories' }, { status: 500 });
    }
}
