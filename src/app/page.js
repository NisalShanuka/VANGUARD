// Server Component — no "use client"
// Fetches application types directly from DB and passes to client component
import { query } from '@/lib/db';
import HomeClient from './HomeClient';

export default async function Home() {
  let applicationTypes = [];
  try {
    applicationTypes = await query(
      `SELECT id, name, slug, description, icon, cover_image
       FROM application_types
       WHERE is_active = 1
       ORDER BY name ASC`
    );
    // Ensure plain JS objects (not mysql2 RowDataPacket)
    applicationTypes = JSON.parse(JSON.stringify(applicationTypes));
  } catch (e) {
    console.warn('[Home] DB fetch error - Falling back to empty array:', e.message || e.code || 'Unknown Error');
    applicationTypes = [];
  }

  return <HomeClient applicationTypes={applicationTypes} />;
}
