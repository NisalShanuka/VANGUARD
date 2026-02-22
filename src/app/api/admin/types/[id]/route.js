import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';


// PATCH - update type settings (webhooks, roles, active status etc)
export async function PATCH(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Safely extract all fields - use ?? null to avoid undefined (mysql2 rejects undefined)
    const is_active = body.is_active ?? 0;
    const icon = body.icon ?? 'fas fa-file-alt';
    const cover_image = body.cover_image ?? 'custom.jpg';
    const webhook_pending = body.webhook_pending ?? '';
    const webhook_interview = body.webhook_interview ?? '';
    const webhook_accepted = body.webhook_accepted ?? '';
    const webhook_declined = body.webhook_declined ?? '';
    const role_pending = body.role_pending ?? '';
    const role_interview = body.role_interview ?? '';
    const role_accepted = body.role_accepted ?? '';
    const role_declined = body.role_declined ?? '';

    try {
        await query(
            `UPDATE application_types SET
                is_active = ?, icon = ?, cover_image = ?,
                webhook_pending = ?, webhook_interview = ?, webhook_accepted = ?, webhook_declined = ?,
                role_pending = ?, role_interview = ?, role_accepted = ?, role_declined = ?
             WHERE id = ?`,
            [
                is_active ? 1 : 0,
                icon,
                cover_image,
                webhook_pending, webhook_interview, webhook_accepted, webhook_declined,
                role_pending, role_interview, role_accepted, role_declined,
                id,
            ]
        );
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('PATCH /api/admin/types/[id] error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE - remove type
export async function DELETE(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    try {
        await query(`DELETE FROM application_types WHERE id = ?`, [id]);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
