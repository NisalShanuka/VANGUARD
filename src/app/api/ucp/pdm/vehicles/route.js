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

        // Fetch location details to know which vehicle goes to which shop
        const shops = await query('SELECT name, categories FROM dealership_locations');
        
        let shopMap = {};
        for (const shop of shops) {
            try {
                const cats = JSON.parse(shop.categories || '[]');
                for (const c of cats) shopMap[c] = shop.name;
            } catch (e) {}
        }

        const enrichedVehicles = vehicles.map(v => ({
            ...v,
            shop: shopMap[v.category] || 'Other'
        }));

        return NextResponse.json({ success: true, vehicles: enrichedVehicles });
    } catch (error) {
        console.error('PDM Vehicles Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
