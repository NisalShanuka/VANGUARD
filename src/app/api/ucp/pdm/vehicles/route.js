import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const vehicles = await query(`
            SELECT 
                v.spawn_code,
                v.brand,
                v.model,
                v.category,
                v.price,
                v.unlimited_stock,
                v.global_stock_limit,
                COALESCE(SUM(s.stock), 0) AS current_stock
            FROM dealership_vehicles v
            LEFT JOIN dealership_stock s ON v.spawn_code = s.vehicle
            GROUP BY v.spawn_code, v.brand, v.model, v.category, v.price, v.unlimited_stock, v.global_stock_limit
            ORDER BY v.category, v.price ASC
        `);

        return NextResponse.json({ success: true, vehicles });
    } catch (error) {
        console.error('PDM Vehicles Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
