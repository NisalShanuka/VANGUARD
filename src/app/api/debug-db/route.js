import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// TEMP debug + auto-fix route
export async function GET() {
    try {
        // Check if table exists and what data it has
        const types = await query(`SELECT id, name, slug, is_active FROM application_types ORDER BY name ASC`);
        const dbName = process.env.DB_NAME;
        return NextResponse.json({
            success: true,
            db: dbName,
            count: types.length,
            active: types.filter(t => t.is_active == 1).length,
            types
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            db: process.env.DB_NAME,
            error: error.message,
            code: error.code,
            hint: error.code === 'ER_NO_SUCH_TABLE'
                ? 'Table application_types does not exist! Import the SQL schema.'
                : 'Database connection or query error.'
        }, { status: 500 });
    }
}

// POST - activate ALL types (quick fix)
export async function POST() {
    try {
        await query(`UPDATE application_types SET is_active = 1`);
        const types = await query(`SELECT id, name, slug, is_active FROM application_types`);
        return NextResponse.json({
            success: true,
            message: `Activated all ${types.length} application types!`,
            types
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
