import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = session?.user?.role === 'admin';

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

        // Fetch pending orders to deduct from available stock
        const pendingOrders = await query(`
            SELECT vehicle_model, COALESCE(SUM(quantity), 0) as pending_qty 
            FROM pdm_orders 
            WHERE status = 'pending' 
            GROUP BY vehicle_model
        `);
        
        let pendingMap = {};
        for (const p of pendingOrders) {
            pendingMap[p.vehicle_model] = parseInt(p.pending_qty) || 0;
        }

        // Fetch luxury enabled setting
        const settings = await query("SELECT setting_value FROM site_settings WHERE setting_key = 'pdm_luxury_enabled'");
        const isLuxuryEnabled = settings.length > 0 ? settings[0].setting_value === 'true' : false;

        const excludeCategories = [
            'boat', 'boats', 'commercial', 'commercail', 'emergency', 'emergancy', 
            'helicopters', 'industrial', 'military', 'openwheel', 'planes', 'service'
        ];
        const excludeShops = ['aircraft dealer', 'boat dealer', 'truck dealer', 'other'];

        const enrichedVehicles = vehicles.map(v => {
            const pendingAuth = pendingMap[v.spawn_code] || 0;
            const trueStock = Math.max(0, (v.current_stock || 0) - pendingAuth);
            return {
                ...v,
                shop: shopMap[v.category] || 'Other',
                current_stock: trueStock,
                original_stock: v.current_stock || 0,
                pending_orders: pendingAuth
            };
        }).filter(v => {
            const categoryLow = (v.category || '').toLowerCase();
            if (excludeCategories.includes(categoryLow)) return false;
            if (excludeShops.includes((v.shop || '').toLowerCase())) return false;
            
            // Luxury Category toggle
            if ((categoryLow === 'luxury' || categoryLow === 'luxury vehicles') && !isLuxuryEnabled && !isAdmin) return false;
            
            return true;
        });

        return NextResponse.json({ success: true, vehicles: enrichedVehicles });
    } catch (error) {
        console.error('PDM Vehicles Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
