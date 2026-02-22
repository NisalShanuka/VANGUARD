import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    try {
        // Ensure application_questions table exists with correct columns
        await query(`
            CREATE TABLE IF NOT EXISTS application_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type_id INT NOT NULL,
                section_title VARCHAR(255) DEFAULT 'General Information',
                label TEXT NOT NULL,
                field_type VARCHAR(50) DEFAULT 'text',
                options TEXT DEFAULT '',
                is_required TINYINT(1) DEFAULT 1,
                order_num INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (type_id) REFERENCES application_types(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Safely ensure section_title exists even if table was created before
        try {
            const rows = await query(
                `SELECT COLUMN_NAME FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_questions' AND COLUMN_NAME = 'section_title'`
            );
            if (!rows || rows.length === 0) {
                await query(`ALTER TABLE application_questions ADD COLUMN section_title VARCHAR(255) DEFAULT 'General Information' AFTER type_id`);
            }
        } catch (e) {
            console.error('[Form API] section_title migration:', e.message);
        }

        // Get application type
        const types = await query(
            'SELECT id, name, description, icon, cover_image FROM application_types WHERE slug = ? AND is_active = 1',
            [slug]
        );

        if (types.length === 0) {
            return NextResponse.json({ error: 'Application type not found or is not active' }, { status: 404 });
        }

        const type = types[0];

        // Get questions — include section_title
        const questions = await query(
            'SELECT id, section_title, label, field_type, is_required, options FROM application_questions WHERE type_id = ? ORDER BY order_num ASC',
            [type.id]
        );

        return NextResponse.json({ type, questions });

    } catch (error) {
        console.error('[Form API] Error:', error.message, error.code);
        return NextResponse.json({
            error: `Server error: ${error.message}`,
            code: error.code
        }, { status: 500 });
    }
}
