import re

with open('app/piutang/page.tsx', 'r') as f:
    content = f.read()

# 1. Update Phosphor icons import
content = content.replace(
    'import { DotsThreeVertical, Plus, X } from "@phosphor-icons/react"',
    'import { DotsThreeVertical, Plus, X, ArrowLeft } from "@phosphor-icons/react"'
)

# 2. Add viewMode state
states_old = """  const [riwayatId, setRiwayatId] = useState<any | null>(null)
  const [riwayatData, setRiwayatData] = useState<any[]>([])
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false)"""

states_new = """  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [riwayatId, setRiwayatId] = useState<any | null>(null)
  const [riwayatData, setRiwayatData] = useState<any[]>([])
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false)"""
content = content.replace(states_old, states_new)

# 3. Update fetchRiwayat to format mutations correctly
fetch_old = """  const fetchRiwayat = async (p: any) => {
    setRiwayatId(p)
    setIsLoadingRiwayat(true)
    const { data } = await supabase
      .from('piutang_cicilan')
      .select('*')
      .eq('piutang_id', p.id)
      .order('created_at', { ascending: false })
    
    if (data) setRiwayatData(data)
    setIsLoadingRiwayat(false)
  }"""

fetch_new = """  const fetchRiwayat = async (p: any) => {
    setRiwayatId(p)
    setIsLoadingRiwayat(true)
    setViewMode('detail')
    
    const { data } = await supabase
      .from('piutang_cicilan')
      .select('*')
      .eq('piutang_id', p.id)
      .order('created_at', { ascending: true })
    
    const mutations = []
    
    // 1. Catatan Hutang Awal
    mutations.push({
      id: 'awal',
      tanggal: p.tanggal,
      keterangan: p.keterangan || 'Catatan Hutang Awal',
      jenis: 'hutang',
      jumlah: Number(p.jumlah)
    })
    
    // 2. Daftar Cicilan
    if (data && data.length > 0) {
      data.forEach(d => {
        mutations.push({
          id: d.id,
          tanggal: d.tanggal,
          keterangan: d.keterangan || 'Pembayaran Cicilan',
          jenis: 'bayar',
          jumlah: Number(d.jumlah)
        })
      })
    }
    
    // 3. Kalkulasi Saldo
    let currentSaldo = 0
    mutations.forEach(m => {
      if (m.jenis === 'hutang') {
        currentSaldo += m.jumlah
      } else {
        currentSaldo -= m.jumlah
      }
      m.saldo = currentSaldo
    })
    
    setRiwayatData(mutations.reverse())
    setIsLoadingRiwayat(false)
  }"""
content = content.replace(fetch_old, fetch_new)

# 4. Remove AlertDialog for Riwayat at the bottom of the file
alert_dialog = """      <AlertDialog open={!!riwayatId} onOpenChange={(open) => !open && setRiwayatId(null)}>
        <AlertDialogContent className="rounded-none max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Riwayat Cicilan Piutang</AlertDialogTitle>
            <AlertDialogDescription>
              Detail pembayaran cicilan untuk <strong>{riwayatId?.nama}</strong>. Total Hutang Awal: Rp {formatRibuan(String(riwayatId?.jumlah || 0))}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            {isLoadingRiwayat ? (
              <div className="text-center text-sm text-muted-foreground py-4">Memuat data...</div>
            ) : riwayatData.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">Belum ada riwayat cicilan untuk piutang ini.</div>
            ) : (
              <div className="overflow-x-auto border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-center border-r whitespace-nowrap">No</TableHead>
                      <TableHead className="border-r whitespace-nowrap">Tanggal</TableHead>
                      <TableHead className="border-r whitespace-nowrap">Jumlah</TableHead>
                      <TableHead className="whitespace-nowrap">Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riwayatData.map((r, idx) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-center border-r">{idx + 1}</TableCell>
                        <TableCell className="border-r whitespace-nowrap">{formatTanggalOutput(r.tanggal)}</TableCell>
                        <TableCell className="border-r font-semibold text-green-600 whitespace-nowrap">Rp {formatRibuan(String(r.jumlah))}</TableCell>
                        <TableCell>{r.keterangan || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none w-full sm:w-auto">Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>"""
content = content.replace(alert_dialog, '')

# 5. Conditionally render the main view or detail view
detail_view_jsx = """
          {viewMode === 'detail' && riwayatId && (
            <div className="flex flex-col space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" className="rounded-none" onClick={() => { setViewMode('list'); setRiwayatId(null); }}>
                  <ArrowLeft className="mr-2 h-4 w-4" weight="bold" /> Kembali
                </Button>
                <h1 className="text-xl font-bold tracking-tight">Detail Mutasi Piutang</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="bg-card border rounded-none shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20">
                  <h3 className="font-semibold">Buku Besar / Riwayat Mutasi</h3>
                </div>
                {isLoadingRiwayat ? (
                  <div className="text-center py-12 text-muted-foreground">Memuat data mutasi...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[50px] text-center border-r whitespace-nowrap">No</TableHead>
                          <TableHead className="border-r whitespace-nowrap min-w-[120px]">Tanggal</TableHead>
                          <TableHead className="border-r whitespace-nowrap min-w-[200px]">Keterangan</TableHead>
                          <TableHead className="border-r text-right whitespace-nowrap">Masuk (Hutang)</TableHead>
                          <TableHead className="border-r text-right whitespace-nowrap">Keluar (Bayar)</TableHead>
                          <TableHead className="text-right whitespace-nowrap font-bold">Saldo Hutang</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {riwayatData.map((m, idx) => (
                          <TableRow key={m.id} className="hover:bg-muted/20">
                            <TableCell className="text-center border-r">{riwayatData.length - idx}</TableCell>
                            <TableCell className="border-r whitespace-nowrap">{formatTanggalOutput(m.tanggal)}</TableCell>
                            <TableCell className="border-r max-w-[200px] truncate" title={m.keterangan}>{m.keterangan}</TableCell>
                            <TableCell className="border-r text-right text-orange-600 whitespace-nowrap">
                              {m.jenis === 'hutang' ? `Rp ${formatRibuan(String(m.jumlah))}` : '-'}
                            </TableCell>
                            <TableCell className="border-r text-right text-green-600 whitespace-nowrap">
                              {m.jenis === 'bayar' ? `Rp ${formatRibuan(String(m.jumlah))}` : '-'}
                            </TableCell>
                            <TableCell className="text-right font-bold whitespace-nowrap">
                              Rp {formatRibuan(String(m.saldo))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
"""

main_view_start = """          {viewMode === 'list' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">"""

# Replace the start of the grid with the wrapper
content = content.replace('<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">', main_view_start)

# Now we need to close the wrapper and insert the detail view at the end before SidebarProvider closes
end_wrapper = """            </>
          )}

""" + detail_view_jsx

# Let's place it right before `</SidebarInset>`
content = content.replace('      </SidebarInset>', end_wrapper + '\n      </SidebarInset>')

with open('app/piutang/page.tsx', 'w') as f:
    f.write(content)

print("Done refactoring UI mutasi piutang")
