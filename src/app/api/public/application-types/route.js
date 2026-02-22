import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Force dynamic - never cache this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Public route - no auth needed, returns only active types
export async function GET() {
    try {
        const types = await query(
            `SELECT id, name, slug, description, icon, cover_image FROM application_types WHERE is_active = 1 ORDER BY name ASC`
        );
        return NextResponse.json(Array.isArray(types) ? types : [], {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            }
        });
    } catch (error) {
        const errMsg = error.message || error.code || 'Unknown Error';
        console.error('[Public API] application-types error:', errMsg);
        // Return error info so we can debug (not empty array)
        return NextResponse.json({ error: errMsg, code: error.code }, { status: 500 });
    }
}
