import re

with open('app/piutang/page.tsx', 'r') as f:
    content = f.read()

# We want to swap the title/button div with the grid div in the detail view.
# Currently it is:
#           {viewMode === 'detail' && riwayatId && (
#             <div className="flex flex-col space-y-6">
#               <div className="flex items-center gap-4">
#                 <Button variant="outline" className="rounded-none" onClick={() => { setViewMode('list'); setRiwayatId(null); }}>
#                   <ArrowLeft className="mr-2 h-4 w-4" weight="bold" /> Kembali
#                 </Button>
#                 <h1 className="text-xl font-bold tracking-tight">Detail Mutasi Piutang</h1>
#               </div>
# 
#               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

# Find the block and rewrite it.
header_block = """              <div className="flex items-center gap-4 mb-4 mt-2">
                <h1 className="text-xl font-bold tracking-tight">Detail Mutasi Piutang</h1>
                <Button variant="outline" className="rounded-none ml-auto" onClick={() => { setViewMode('list'); setRiwayatId(null); }}>
                  <ArrowLeft className="mr-2 h-4 w-4" weight="bold" /> Kembali
                </Button>
              </div>"""

# Wait, the user said "seperti halaman piutang awal". In the piutang awal:
# The header has `flex justify-between items-center mb-4 mt-2`.
# The title is on the left, and button on the right (or vice versa).
# Let's check what I did for the list view header:
#           <div className="flex justify-between items-center mb-4 mt-2">
#             <h1 className="text-1xl font-bold tracking-tight">Catatan Piutang</h1>
#             <div className="flex gap-2 items-center">
#               ... buttons ...
#             </div>
#           </div>

# Let's match this exactly for the detail view.
new_detail_view_start = """          {viewMode === 'detail' && riwayatId && (
            <div className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="rounded-none border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Nama Peminjam</p>
                    <p className="text-xl font-bold text-foreground truncate">{riwayatId.nama}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-none">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Hutang Awal</p>
                    <p className="text-xl font-bold text-orange-600">Rp {formatRibuan(String(riwayatId.jumlah))}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-none">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Sisa Saldo Hutang</p>
                    <p className="text-xl font-bold text-primary">
                      Rp {formatRibuan(String(riwayatId.sisa_hutang !== undefined ? riwayatId.sisa_hutang : (riwayatId.status === 'lunas' ? '0' : riwayatId.jumlah)))}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between items-center mb-4 mt-2">
                <h1 className="text-xl font-bold tracking-tight">Detail Mutasi Piutang</h1>
                <Button variant="outline" className="rounded-none" onClick={() => { setViewMode('list'); setRiwayatId(null); }}>
                  <ArrowLeft className="mr-2 h-4 w-4" weight="bold" /> Kembali
                </Button>
              </div>

              <div className="bg-card border rounded-none shadow-sm overflow-hidden">"""

# Replace the existing structure.
old_regex = r"          \{viewMode === \'detail\' && riwayatId && \(\n            <div className=\"flex flex-col space-y-6\">\n              <div className=\"flex items-center gap-4\">\n                <Button variant=\"outline\" className=\"rounded-none\" onClick=\{\(\) => \{ setViewMode\(\'list\'\); setRiwayatId\(null\); \}\}>\n                  <ArrowLeft className=\"mr-2 h-4 w-4\" weight=\"bold\" /> Kembali\n                </Button>\n                <h1 className=\"text-xl font-bold tracking-tight\">Detail Mutasi Piutang</h1>\n              </div>\n\n              <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">\n                <Card className=\"rounded-none border-primary/20 bg-primary/5\">\n                  <CardContent className=\"p-6\">\n                    <p className=\"text-sm font-medium text-muted-foreground mb-1\">Nama Peminjam</p>\n                    <p className=\"text-xl font-bold text-foreground truncate\">\{riwayatId\.nama\}</p>\n                  </CardContent>\n                </Card>\n                <Card className=\"rounded-none\">\n                  <CardContent className=\"p-6\">\n                    <p className=\"text-sm font-medium text-muted-foreground mb-1\">Hutang Awal</p>\n                    <p className=\"text-xl font-bold text-orange-600\">Rp \{formatRibuan\(String\(riwayatId\.jumlah\)\)\}</p>\n                  </CardContent>\n                </Card>\n                <Card className=\"rounded-none\">\n                  <CardContent className=\"p-6\">\n                    <p className=\"text-sm font-medium text-muted-foreground mb-1\">Sisa Saldo Hutang</p>\n                    <p className=\"text-xl font-bold text-primary\">\n                      Rp \{formatRibuan\(String\(riwayatId\.sisa_hutang !== undefined \? riwayatId\.sisa_hutang : \(riwayatId\.status === \'lunas\' \? \'0\' : riwayatId\.jumlah\)\)\)\}\n                    </p>\n                  </CardContent>\n                </Card>\n              </div>\n\n              <div className=\"bg-card border rounded-none shadow-sm overflow-hidden\">"

content = re.sub(old_regex, new_detail_view_start, content)

with open('app/piutang/page.tsx', 'w') as f:
    f.write(content)
print("Done")
