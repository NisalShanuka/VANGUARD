import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';


// GET questions for a type
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const typeId = searchParams.get('type_id');
    if (!typeId) return NextResponse.json({ error: 'type_id required' }, { status: 400 });

    const questions = await query(
        `SELECT * FROM application_questions WHERE type_id = ? ORDER BY order_num ASC`,
        [typeId]
    );
    return NextResponse.json(questions);
}

// POST - add question
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type_id, label, field_type, options, is_required } = await req.json();
    if (!type_id || !label) return NextResponse.json({ error: 'type_id and label required' }, { status: 400 });

    try {
        const result = await query(
            `INSERT INTO application_questions (type_id, label, field_type, options, is_required) VALUES (?, ?, ?, ?, ?)`,
            [type_id, label, field_type || 'text', options || '', is_required ? 1 : 0]
        );
        return NextResponse.json({ success: true, id: result.insertId });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE - remove question
export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, type_id } = await req.json();
    try {
        await query(`DELETE FROM application_questions WHERE id = ? AND type_id = ?`, [id, type_id]);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
