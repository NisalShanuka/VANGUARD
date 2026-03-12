import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const tables = await query(`SHOW TABLES`);
        const tablesList = tables.map(t => Object.values(t)[0]);
        
        const schema = {};
        for (const tbl of ['dealership_vehicles', 'dealership_stock', 'dealers']) {
            if (tablesList.includes(tbl)) {
                const desc = await query(`DESCRIBE ${tbl}`);
                schema[tbl] = desc;
            }
        }
        
        return NextResponse.json({ success: true, tablesList, schema });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
