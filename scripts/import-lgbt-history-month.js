#!/usr/bin/env node
/**
 * Import LGBT History Month 2026 events into Supabase
 *
 * Usage: node scripts/import-lgbt-history-month.js
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function importEvents() {
  console.log('📅 Importing LGBT History Month 2026 events...\n');

  // Read and parse CSV
  const csvContent = readFileSync('./lgbt-history-month-2026.csv', 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`Found ${records.length} events to import\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    try {
      // Parse tags from comma-separated string
      const tags = record.tags ? record.tags.split(',').map(t => t.trim()) : [];

      // Create event object matching QuickAddEventPage format
      const event = {
        title: record.name,
        description: record.description,
        date: record.event_date,
        location: record.location,
        url: record.source_url,
        organizer: record.organizer_name,
        tags: tags,
        cost: record.price,
        status: 'approved',
        source: 'admin-quick-add',
        created_at: new Date().toISOString()
      };

      // Use REST API like QuickAddEventPage
      const response = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(event)
      });

      if (response.ok) {
        console.log(`✅ Imported: ${record.name} (${record.event_date})`);
        imported++;
      } else {
        const errorData = await response.text();
        console.error(`❌ Error importing "${record.name}":`, errorData);
        errors++;
      }
    } catch (err) {
      console.error(`❌ Exception for "${record.name}":`, err.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary:');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Errors:   ${errors}`);
  console.log('='.repeat(50));
}

importEvents().catch(console.error);
