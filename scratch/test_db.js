const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('piutang_cicilan').select('*').limit(1);
  if (error) {
    console.error("Error fetching:", error);
  } else {
    console.log("Data:", data);
  }
  
  // Try inserting dummy
  const { error: err2 } = await supabase.from('piutang_cicilan').insert({
    piutang_id: '00000000-0000-0000-0000-000000000000', // dummy
    tanggal: '2026-09-02',
    jumlah: 1000,
    jenis: 'hutang'
  });
  console.log("Insert error (if any):", err2);
}

test();
