#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  console.log('🚀 Setting up BoothNow database...');

  try {
    // Test connection
    const { data, error } = await supabase
      .from('booths')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    console.log('✅ Database connection successful');

    // Create sample booths
    const sampleBooths = [
      {
        name: '7-Eleven Stockholm Central',
        partner: '7-Eleven',
        address: 'Storgatan 1, Stockholm, Sweden',
        lat: 59.3293,
        lng: 18.0686,
        availability: true,
      },
      {
        name: '7-Eleven Oslo Downtown',
        partner: '7-Eleven',
        address: 'Karl Johans gate 1, Oslo, Norway',
        lat: 59.9139,
        lng: 10.7522,
        availability: true,
      },
      {
        name: '7-Eleven Copenhagen Central',
        partner: '7-Eleven',
        address: 'Strøget 1, Copenhagen, Denmark',
        lat: 55.6761,
        lng: 12.5683,
        availability: false,
      }
    ];

    console.log('📦 Creating sample booths...');
    
    // Check if booths already exist
    const { data: existingBooths } = await supabase
      .from('booths')
      .select('name');

    const existingNames = existingBooths?.map(b => b.name) || [];
    const newBooths = sampleBooths.filter(booth => !existingNames.includes(booth.name));

    if (newBooths.length > 0) {
      const { error: insertError } = await supabase
        .from('booths')
        .insert(newBooths);

      if (insertError) {
        throw new Error(`Failed to insert booths: ${insertError.message}`);
      }
    }

    console.log('✅ Database setup complete!');
    console.log('📊 Sample booths are ready for testing');
    console.log('💡 Run the complete_schema.sql in your Supabase SQL editor for full setup');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('💡 Make sure to:');
    console.log('   1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log('   2. Run the complete_schema.sql in your Supabase SQL editor');
    process.exit(1);
  }
}

setupDatabase();
