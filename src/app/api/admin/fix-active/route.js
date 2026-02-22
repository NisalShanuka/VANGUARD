import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — check current state of application_types table
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin only' }, { status: 401 });
    }
    try {
        const types = await query(`SELECT id, name, slug, is_active FROM application_types ORDER BY name ASC`);
        return NextResponse.json({
            db: process.env.DB_NAME,
            total: types.length,
            active: types.filter(t => t.is_active == 1).length,
            hidden: types.filter(t => t.is_active == 0).length,
            types,
        });
    } catch (e) {
        return NextResponse.json({ error: e.message, code: e.code }, { status: 500 });
    }
}

// POST — activate ALL types at once (one-time fix)
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin only' }, { status: 401 });
    }
    try {
        await query(`UPDATE application_types SET is_active = 1`);
        const types = await query(`SELECT id, name, slug, is_active FROM application_types`);
        return NextResponse.json({ success: true, message: `All ${types.length} types activated!`, types });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
