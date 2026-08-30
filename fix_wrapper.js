const fs = require('fs');

const files = [
  'app/pelanggan/page.tsx',
  'app/pembelian/page.tsx',
  'app/penjualan/page.tsx',
  'app/pemasukan/page.tsx',
  'app/pengeluaran/page.tsx',
  'app/piutang/page.tsx',
  'app/dompetku/page.tsx',
  'app/mutasi/page.tsx',
  'components/recent-mutasi.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  let replaced = content;
  
  // Try replacing with different indentations
  for (let indent of [8, 10, 12, 14]) {
    const spaces = ' '.repeat(indent);
    const s = `<div className="bg-card text-card-foreground shadow-sm border rounded-none">\n${spaces}  {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}\n${spaces}  <div className="flex flex-col gap-3 p-4 lg:hidden">`;
    const r = `<div className="lg:bg-card lg:text-card-foreground lg:shadow-sm lg:border lg:rounded-none">\n${spaces}  {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}\n${spaces}  <div className="flex flex-col gap-3 lg:hidden">`;
    replaced = replaced.replace(s, r);
    
    // Also variants with overflow-x-auto on the wrapper
    const s2 = `<div className="bg-card text-card-foreground shadow-sm border rounded-none overflow-x-auto">\n${spaces}  {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}\n${spaces}  <div className="flex flex-col gap-3 p-4 lg:hidden">`;
    const r2 = `<div className="lg:bg-card lg:text-card-foreground lg:shadow-sm lg:border lg:rounded-none overflow-x-auto">\n${spaces}  {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}\n${spaces}  <div className="flex flex-col gap-3 lg:hidden">`;
    replaced = replaced.replace(s2, r2);
    
    // recent-mutasi variant
    const s3 = `<CardContent className="p-0">\n${spaces}  {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}\n${spaces}  <div className="flex flex-col gap-3 p-4 lg:hidden">`;
    const r3 = `<CardContent className="p-0">\n${spaces}  {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}\n${spaces}  <div className="flex flex-col gap-3 lg:hidden">`;
    replaced = replaced.replace(s3, r3);
  }
  
  if (content !== replaced) {
    fs.writeFileSync(file, replaced);
    console.log(`Updated ${file}`);
  }
});

