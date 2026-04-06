import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = session?.user?.role === 'admin';

        // Run queries in parallel to save time
        const [vehicles, shops, pendingOrders, settings] = await Promise.all([
            query(`
                SELECT 
                    s.dealership AS shop_name,
                    s.vehicle AS spawn_code,
                    s.stock AS current_stock,
                    COALESCE(s.price, 0) AS price,
                    COALESCE(v.brand, 'Unknown') AS brand,
                    COALESCE(v.model, s.vehicle) AS model,
                    COALESCE(v.category, 'Other') AS category
                FROM dealership_stock s
                LEFT JOIN dealership_vehicles v ON s.vehicle = v.spawn_code
                WHERE v.category IS NULL OR v.category NOT IN ('boat', 'boats', 'commercial', 'commercail', 'emergency', 'emergancy', 'helicopters', 'industrial', 'military', 'openwheel', 'planes', 'service')
                ORDER BY category, s.price ASC
            `),
            query('SELECT name, categories FROM dealership_locations'),
            query(`
                SELECT vehicle_model, COALESCE(SUM(quantity), 0) as pending_qty 
                FROM pdm_orders 
                WHERE status = 'pending' 
                GROUP BY vehicle_model
            `),
            query("SELECT setting_value FROM site_settings WHERE setting_key = 'pdm_luxury_enabled'")
        ]);

        let shopMap = {}; // Fallback mapping
        for (const shop of shops) {
            try {
                const cats = JSON.parse(shop.categories || '[]');
                for (const c of cats) shopMap[c] = shop.name;
            } catch (e) {}
        }
        
        let pendingMap = {};
        for (const p of pendingOrders) {
            pendingMap[p.vehicle_model] = parseInt(p.pending_qty) || 0;
        }

        const isLuxuryEnabled = settings.length > 0 ? settings[0].setting_value === 'true' : false;
        const excludeShops = ['aircraft dealer', 'boat dealer', 'truck dealer', 'other'];

        const enrichedVehicles = vehicles.map(v => {
            const pendingAuth = pendingMap[v.spawn_code] || 0;
            const trueStock = Math.max(0, (v.current_stock || 0) - pendingAuth);
            const finalShop = v.shop_name || shopMap[v.category] || 'Other';

            return {
                ...v,
                shop: finalShop,
                current_stock: trueStock,
                original_stock: v.current_stock || 0,
                pending_orders: pendingAuth
            };
        }).filter(v => {
            const shopLow = (v.shop || '').toLowerCase();
            if (excludeShops.includes(shopLow)) return false;
            
            // Luxury Shop toggle - Applies to everyone when disabled
            if ((shopLow.includes('luxury')) && !isLuxuryEnabled) return false;
            
            return true;
        });

        return NextResponse.json({ success: true, vehicles: enrichedVehicles });
    } catch (error) {
        console.error('PDM Vehicles Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
