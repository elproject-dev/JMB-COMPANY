import re

with open('app/piutang/page.tsx', 'r') as f:
    content = f.read()

# 1. Add states for Riwayat Cicilan
states_old = """  const [cicilanId, setCicilanId] = useState<any | null>(null)
  const [jumlahCicilan, setJumlahCicilan] = useState("")

  const [pelangganNames, setPelangganNames] = useState<string[]>([])"""

states_new = """  const [cicilanId, setCicilanId] = useState<any | null>(null)
  const [jumlahCicilan, setJumlahCicilan] = useState("")

  const [riwayatId, setRiwayatId] = useState<any | null>(null)
  const [riwayatData, setRiwayatData] = useState<any[]>([])
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false)

  const [pelangganNames, setPelangganNames] = useState<string[]>([])"""

content = content.replace(states_old, states_new)

# 2. Add function fetchRiwayat
fetch_riwayat_func = """  const fetchRiwayat = async (p: any) => {
    setRiwayatId(p)
    setIsLoadingRiwayat(true)
    const { data } = await supabase
      .from('piutang_cicilan')
      .select('*')
      .eq('piutang_id', p.id)
      .order('created_at', { ascending: false })
    
    if (data) setRiwayatData(data)
    setIsLoadingRiwayat(false)
  }
"""
content = content.replace("const handleSimpanPelangganBaru = async () => {", fetch_riwayat_func + "\n  const handleSimpanPelangganBaru = async () => {")

# 3. Update confirmLunas
confirm_lunas_old = """    // 1. Update status piutang
    await supabase.from('piutang').update({ status: 'lunas', sisa_hutang: 0 }).eq('id', lunasId.id)

    const nominalLunas = lunasId.sisa_hutang && Number(lunasId.sisa_hutang) !== 0 ? Number(lunasId.sisa_hutang) : Number(lunasId.jumlah)

    await loadData()"""

confirm_lunas_new = """    const nominalLunas = lunasId.sisa_hutang && Number(lunasId.sisa_hutang) !== 0 ? Number(lunasId.sisa_hutang) : Number(lunasId.jumlah)

    // 1. Update status piutang
    await supabase.from('piutang').update({ status: 'lunas', sisa_hutang: 0 }).eq('id', lunasId.id)

    // 2. Insert into piutang_cicilan
    await supabase.from('piutang_cicilan').insert({
      piutang_id: lunasId.id,
      tanggal: format(new Date(), "yyyy-MM-dd"),
      jumlah: nominalLunas,
      keterangan: "Pelunasan Penuh"
    })

    await loadData()"""
content = content.replace(confirm_lunas_old, confirm_lunas_new)

# 4. Update confirmCicilan
confirm_cicilan_old = """    // 1. Update piutang
    await supabase.from('piutang').update({
      status: isLunas ? 'lunas' : 'belum lunas',
      sisa_hutang: sisaHutangBaruNum
    }).eq('id', cicilanId.id)

    await loadData()"""

confirm_cicilan_new = """    // 1. Update piutang
    await supabase.from('piutang').update({
      status: isLunas ? 'lunas' : 'belum lunas',
      sisa_hutang: sisaHutangBaruNum
    }).eq('id', cicilanId.id)

    // 2. Insert into piutang_cicilan
    await supabase.from('piutang_cicilan').insert({
      piutang_id: cicilanId.id,
      tanggal: format(new Date(), "yyyy-MM-dd"),
      jumlah: cicilanNum,
      keterangan: isLunas ? "Cicilan Terakhir (Lunas)" : "Pembayaran Cicilan"
    })

    await loadData()"""
content = content.replace(confirm_cicilan_old, confirm_cicilan_new)

# 5. Add UI Dialog for Riwayat Cicilan
riwayat_dialog = """
      <AlertDialog open={!!riwayatId} onOpenChange={(open) => !open && setRiwayatId(null)}>
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
      </AlertDialog>
"""
content = content.replace('</SidebarProvider>', riwayat_dialog + '\n    </SidebarProvider>')

# 6. Add "Lihat Riwayat" in Dropdown (Desktop and Mobile)
dropdown_add = """                                  <DropdownMenuItem className="rounded-none cursor-pointer font-semibold text-cyan-600 focus:bg-blue-50 focus:text-cyan-700" onClick={() => setCicilanId(p)}>
                                    Bayar Cicilan
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-none cursor-pointer text-primary font-semibold" onClick={() => setLunasId(p)}>
                                    Tandai Lunas Penuh
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => fetchRiwayat(p)}>Lihat Riwayat</DropdownMenuItem>"""

content = content.replace("""                                    Bayar Cicilan
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-none cursor-pointer text-primary font-semibold" onClick={() => setLunasId(p)}>
                                    Tandai Lunas Penuh
                                  </DropdownMenuItem>
                                </>
                              )}""", dropdown_add)

# Because there are two occurrences (mobile and desktop), it will replace both.

with open('app/piutang/page.tsx', 'w') as f:
    f.write(content)

print("Done update_piutang_cicilan")
