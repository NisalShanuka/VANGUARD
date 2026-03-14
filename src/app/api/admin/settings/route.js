import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const settings = await query('SELECT setting_key, setting_value FROM site_settings');
        const config = {};
        settings.forEach(s => {
            config[s.setting_key] = s.setting_value;
        });
        return NextResponse.json({ success: true, settings: config });
    } catch (error) {
        console.error('Settings GET Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        
        const { key, value } = await req.json();
        
        if (!key) {
            return NextResponse.json({ success: false, error: 'Key required' }, { status: 400 });
        }

        await query(
            'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            [key, String(value), String(value)]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Settings POST Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
