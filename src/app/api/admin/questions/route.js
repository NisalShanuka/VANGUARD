import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';


// Safely ensure a column exists
async function ensureColumn(table, column, definition) {
    try {
        const rows = await query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [table, column]
        );
        if (!rows || rows.length === 0) {
            await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        }
    } catch (e) {
        console.error(`[ensureColumn] ${table}.${column}:`, e.message);
    }
}

// GET questions for a type
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const typeId = searchParams.get('type_id');
    if (!typeId) return NextResponse.json({ error: 'type_id required' }, { status: 400 });

    await ensureColumn('application_questions', 'section_title', "VARCHAR(255) DEFAULT 'General Information'");
    await ensureColumn('application_questions', 'order_num', "INT DEFAULT 0");
    await ensureColumn('application_questions', 'section_order', "INT DEFAULT 0");
    await query(`ALTER TABLE application_questions MODIFY COLUMN field_type VARCHAR(255) DEFAULT 'text'`);

    const questions = await query(
        `SELECT * FROM application_questions WHERE type_id = ? ORDER BY section_order ASC, order_num ASC`,
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

    const { type_id, label, field_type, options, is_required, section_title } = await req.json();
    if (!type_id || !label) return NextResponse.json({ error: 'type_id and label required' }, { status: 400 });

    await ensureColumn('application_questions', 'section_title', "VARCHAR(255) DEFAULT 'General Information'");
    await ensureColumn('application_questions', 'order_num', "INT DEFAULT 0");
    await ensureColumn('application_questions', 'section_order', "INT DEFAULT 0");
    await query(`ALTER TABLE application_questions MODIFY COLUMN field_type VARCHAR(255) DEFAULT 'text'`);


    try {
        const result = await query(
            `INSERT INTO application_questions (type_id, section_title, label, field_type, options, is_required) VALUES (?, ?, ?, ?, ?, ?)`,
            [type_id, section_title || 'General Information', label, field_type || 'text', options || '', is_required ? 1 : 0]
        );
        return NextResponse.json({ success: true, id: result.insertId });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PATCH - update question(s)
export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Bulk update for reordering
    if (body.reorder && Array.isArray(body.questions)) {
        try {
            for (const q of body.questions) {
                await query(
                    'UPDATE application_questions SET order_num = ?, section_order = ?, section_title = ? WHERE id = ?',
                    [q.order_num, q.section_order, q.section_title, q.id]
                );
            }
            return NextResponse.json({ success: true });
        } catch (e) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }
    }

    // Single update
    const { id, type_id, label, field_type, options, is_required, section_title } = body;
    if (!id || !type_id) return NextResponse.json({ error: 'id and type_id required' }, { status: 400 });

    try {
        await query(
            `UPDATE application_questions SET label = ?, field_type = ?, options = ?, is_required = ?, section_title = ? WHERE id = ? AND type_id = ?`,
            [label, field_type, options, is_required ? 1 : 0, section_title, id, type_id]
        );
        return NextResponse.json({ success: true });
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
