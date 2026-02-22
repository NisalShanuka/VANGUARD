import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';


// GET all application types
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const types = await query(`SELECT * FROM application_types ORDER BY name ASC`);
    return NextResponse.json(types);
}

// POST - create new type
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, icon, cover_image } = body;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    try {
        const result = await query(
            `INSERT INTO application_types (name, slug, description, icon, cover_image, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
            [name, slug, description || '', icon || 'fas fa-file-alt', cover_image || 'custom.jpg']
        );
        return NextResponse.json({ success: true, id: result.insertId });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
