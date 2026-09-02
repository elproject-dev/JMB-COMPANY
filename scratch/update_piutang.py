import re

with open('app/piutang/page.tsx', 'r') as f:
    content = f.read()

# 1. Add Card imports
if 'import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"' not in content:
    content = content.replace('import { Button } from "@/components/ui/button"', 'import { Button } from "@/components/ui/button"\nimport { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"')

# 2. Remove dompet list states and fetch
content = re.sub(r'// Dompetku states.*?const \[selectedCicilanDompet, setSelectedCicilanDompet\] = useState<string \| null>\(null\)', '', content, flags=re.DOTALL)
content = content.replace("const { data: dompetData } = await supabase.from('dompet').select('*')", "")
content = content.replace("if (dompetData) setDompetList(dompetData)", "")

# 3. Clean up handleSimpan
handle_simpan_old = """    if (!editingId && !selectedDompet) {
      toast.add({
        title: "Gagal",
        description: "Harap pilih sumber dana.",
      })
      return
    }

    const parsedJumlah = parseInt(String(jumlah).replace(/\D/g, ''), 10) || 0
    let dompetObj = null;
    if (selectedDompet) {
      dompetObj = dompetList.find(d => d.nama === selectedDompet)
      if (!dompetObj) return;
    }

    if (!editingId && dompetObj) {
      const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', dompetObj.id).single()
      if (freshDompet && Number(freshDompet.saldo) < parsedJumlah) {
        toast.add({
          title: "Gagal",
          description: `Saldo dompet/rekening kurang untuk pencatatan piutang ini.`,
        })
        return
      }
    }

    if (editingId) {
      const oldItem = piutang.find((item: any) => item.id === editingId)
      const oldJumlah = Number(oldItem?.jumlah) || 0
      const newJumlah = parsedJumlah
      const selisih = newJumlah - oldJumlah

      if (selisih > 0 && selectedDompet) {
        const dompetToUse = dompetList.find(d => d.nama === (oldItem?.dompet_nama || selectedDompet))
        if (dompetToUse) {
          const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', dompetToUse.id).single()
          if (freshDompet && Number(freshDompet.saldo) < selisih) {
            toast.add({
              title: "Gagal",
              description: `Saldo dompet/rekening kurang untuk tambahan nominal piutang ini.`,
            })
            return
          }
        }
      }

      if (selisih !== 0) {
        await supabase.from('kas').insert({
          tanggal,
          keterangan: `Ubah Nominal Piutang: ${selectedPelanggan}`,
          jumlah: Math.abs(selisih),
          jenis: selisih > 0 ? "piutang_keluar" : "piutang_masuk"
        })

        // Sesuaikan saldo dompet asal jika ada dompet_nama
        if (oldItem && oldItem.dompet_id) {
          const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', oldItem.dompet_id).single()
          if (freshDompet) {
            await supabase.from('dompet').update({ saldo: Number(freshDompet.saldo) - selisih }).eq('id', oldItem.dompet_id)
          }
        }
      }

      let newSisa = (Number(oldItem?.sisa_hutang) || 0) + selisih
      if (newSisa < 0) newSisa = 0

      await supabase.from('piutang').update({
        tanggal,
        jatuh_tempo: jatuhTempo,
        nama: selectedPelanggan,
        keterangan,
        jumlah: newJumlah,
        sisa_hutang: newSisa,
        status: newSisa === 0 ? "lunas" : status
      }).eq('id', editingId)

    } else {
      if (dompetObj) {
        // Potong saldo dompet yang dipilih
        const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', dompetObj.id).single()
        if (freshDompet) {
          await supabase.from('dompet').update({ saldo: Number(freshDompet.saldo) - parsedJumlah }).eq('id', dompetObj.id)
        }
      }

      await supabase.from('piutang').insert({
        tanggal,
        jatuh_tempo: jatuhTempo,
        nama: selectedPelanggan,
        keterangan,
        jumlah: parsedJumlah,
        sisa_hutang: parsedJumlah,
        status: "belum lunas",
        dompet_id: dompetObj?.id || null,
        dompet_nama: selectedDompet
      })

      await supabase.from('kas').insert({
        tanggal,
        keterangan: `Pencatatan Piutang Baru: ${selectedPelanggan}`,
        jumlah: parsedJumlah,
        jenis: "piutang_keluar"
      })
    }"""

handle_simpan_new = """    const parsedJumlah = parseInt(String(jumlah).replace(/\\D/g, ''), 10) || 0

    if (editingId) {
      const oldItem = piutang.find((item: any) => item.id === editingId)
      const oldJumlah = Number(oldItem?.jumlah) || 0
      const newJumlah = parsedJumlah
      const selisih = newJumlah - oldJumlah

      let newSisa = (Number(oldItem?.sisa_hutang) || 0) + selisih
      if (newSisa < 0) newSisa = 0

      await supabase.from('piutang').update({
        tanggal,
        jatuh_tempo: jatuhTempo,
        nama: selectedPelanggan,
        keterangan,
        jumlah: newJumlah,
        sisa_hutang: newSisa,
        status: newSisa === 0 ? "lunas" : status
      }).eq('id', editingId)

    } else {
      await supabase.from('piutang').insert({
        tanggal,
        jatuh_tempo: jatuhTempo,
        nama: selectedPelanggan,
        keterangan,
        jumlah: parsedJumlah,
        sisa_hutang: parsedJumlah,
        status: "belum lunas"
      })
    }"""

content = content.replace(handle_simpan_old, handle_simpan_new)

# 4. Remove setSelectedDompet in handleSimpan cleanup and handleEdit
content = content.replace("setSelectedDompet(null)\n", "")
content = content.replace("setSelectedDompet(p.dompet_nama)\n", "")

# 5. Clean up confirmHapus
confirm_hapus_old = """    const sisaHutangHapus = Number(deletingId.sisa_hutang !== undefined ? deletingId.sisa_hutang : deletingId.jumlah) || 0

    await supabase.from('kas').insert({
      tanggal: new Date().toISOString().split("T")[0],
      keterangan: `Penghapusan Piutang (Pembatalan): ${deletingId.nama}`,
      jumlah: sisaHutangHapus,
      jenis: "piutang_masuk"
    })

    // Kembalikan saldo dompet asalnya
    if (deletingId.dompet_id) {
      const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', deletingId.dompet_id).single()
      if (freshDompet) {
        await supabase.from('dompet').update({ saldo: Number(freshDompet.saldo) + sisaHutangHapus }).eq('id', deletingId.dompet_id)
      }
    }"""
content = content.replace(confirm_hapus_old, "")

# 6. Clean up confirmLunas
confirm_lunas_old = """    if (!selectedLunasDompet) {
      toast.add({
        title: "Gagal",
        description: "Harap pilih rekening/dompet untuk menyimpan dana pelunasan.",
      })
      return
    }

    const dompetObj = dompetList.find(d => d.nama === selectedLunasDompet)
    if (!dompetObj) return

    // 1. Update status piutang
    await supabase.from('piutang').update({ status: 'lunas', sisa_hutang: 0 }).eq('id', lunasId.id)

    const nominalLunas = lunasId.sisa_hutang && Number(lunasId.sisa_hutang) !== 0 ? Number(lunasId.sisa_hutang) : Number(lunasId.jumlah)

    await supabase.from('kas').insert({
      tanggal: format(new Date(), "yyyy-MM-dd"), // Tanggal hari ini
      keterangan: `Pelunasan piutang: ${lunasId.nama} (${lunasId.keterangan})`,
      jumlah: nominalLunas,
      jenis: "piutang_masuk",
      dompet_id: dompetObj.id,
      dompet_nama: selectedLunasDompet
    })

    // 2. Tambahkan ke Saldo Dompetku
    const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', dompetObj.id).single()
    if (freshDompet) {
      await supabase.from('dompet').update({ saldo: Number(freshDompet.saldo) + nominalLunas }).eq('id', dompetObj.id)
    }

    await loadData()

    toast.add({
      title: "Berhasil Dilunasi",
      description: `Piutang lunas dan uang sebesar Rp ${formatRibuan(nominalLunas.toString())} otomatis ditambahkan ke Kas Pemasukan & Rekening.`,
    })
    setLunasId(null)
    setSelectedLunasDompet(null)"""

confirm_lunas_new = """    // 1. Update status piutang
    await supabase.from('piutang').update({ status: 'lunas', sisa_hutang: 0 }).eq('id', lunasId.id)

    const nominalLunas = lunasId.sisa_hutang && Number(lunasId.sisa_hutang) !== 0 ? Number(lunasId.sisa_hutang) : Number(lunasId.jumlah)

    await loadData()

    toast.add({
      title: "Berhasil Dilunasi",
      description: `Piutang telah berhasil dilunasi.`,
    })
    setLunasId(null)"""
content = content.replace(confirm_lunas_old, confirm_lunas_new)

# 7. Clean up confirmCicilan
confirm_cicilan_old = """    if (!selectedCicilanDompet) {
      toast.add({
        title: "Gagal",
        description: "Harap pilih rekening/dompet untuk menyimpan uang cicilan.",
      })
      return
    }

    const cicilanNum = parseInt(jumlahCicilan.replace(/\\D/g, ''), 10) || 0
    if (cicilanNum <= 0) return

    const dompetObj = dompetList.find(d => d.nama === selectedCicilanDompet)
    if (!dompetObj) return

    const sisaHutangSaatIniNum = Number(cicilanId.sisa_hutang !== undefined ? cicilanId.sisa_hutang : cicilanId.jumlah) || 0

    let sisaHutangBaruNum = sisaHutangSaatIniNum - cicilanNum
    if (sisaHutangBaruNum < 0) sisaHutangBaruNum = 0

    const isLunas = sisaHutangBaruNum === 0

    // 1. Update piutang
    await supabase.from('piutang').update({
      status: isLunas ? 'lunas' : 'belum lunas',
      sisa_hutang: sisaHutangBaruNum
    }).eq('id', cicilanId.id)

    await supabase.from('kas').insert({
      tanggal: format(new Date(), "yyyy-MM-dd"),
      keterangan: `Cicilan piutang: ${cicilanId.nama} (${cicilanId.keterangan})`,
      jumlah: cicilanNum,
      jenis: "piutang_masuk",
      dompet_id: dompetObj.id,
      dompet_nama: selectedCicilanDompet
    })

    // 2. Tambahkan ke Saldo Dompetku
    const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', dompetObj.id).single()
    if (freshDompet) {
      await supabase.from('dompet').update({ saldo: Number(freshDompet.saldo) + cicilanNum }).eq('id', dompetObj.id)
    }

    await loadData()

    toast.add({
      title: "Cicilan Berhasil",
      description: `Pembayaran Rp ${formatRibuan(cicilanNum.toString())} dicatat.${isLunas ? ' Piutang LUNAS.' : ''}`,
    })

    setCicilanId(null)
    setJumlahCicilan("")
    setSelectedCicilanDompet(null)"""

confirm_cicilan_new = """    const cicilanNum = parseInt(jumlahCicilan.replace(/\\D/g, ''), 10) || 0
    if (cicilanNum <= 0) return

    const sisaHutangSaatIniNum = Number(cicilanId.sisa_hutang !== undefined ? cicilanId.sisa_hutang : cicilanId.jumlah) || 0

    let sisaHutangBaruNum = sisaHutangSaatIniNum - cicilanNum
    if (sisaHutangBaruNum < 0) sisaHutangBaruNum = 0

    const isLunas = sisaHutangBaruNum === 0

    // 1. Update piutang
    await supabase.from('piutang').update({
      status: isLunas ? 'lunas' : 'belum lunas',
      sisa_hutang: sisaHutangBaruNum
    }).eq('id', cicilanId.id)

    await loadData()

    toast.add({
      title: "Cicilan Berhasil",
      description: `Pembayaran Rp ${formatRibuan(cicilanNum.toString())} dicatat.${isLunas ? ' Piutang LUNAS.' : ''}`,
    })

    setCicilanId(null)
    setJumlahCicilan("")"""
content = content.replace(confirm_cicilan_old, confirm_cicilan_new)

# 8. Remove Select dompet from Add Form UI
dompet_form_ui = """                <div className="space-y-2">
                  <Label htmlFor="sumberDana">Sumber Dana (Diambil dari)</Label>
                  <Select
                    value={selectedDompet || ""}
                    onValueChange={(val: any) => setSelectedDompet(val || "")}
                    disabled={!!editingId}
                  >
                    <SelectTrigger id="sumberDana" className="w-full rounded-none">
                      <SelectValue placeholder="Pilih rekening atau dompet" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {dompetList.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">Belum ada dompet, tambahkan di menu Dompetku.</div>
                      ) : (
                        dompetList.map(d => (
                          <SelectItem key={d.id.toString()} value={d.nama}>
                            {d.nama} (Sisa Saldo: Rp {formatRibuan(String(d.saldo))})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>"""
content = content.replace(dompet_form_ui, "")

# 9. Remove Select dompet from Lunas Modal UI
lunas_dompet_ui = """          <div className="my-4 space-y-2">
            <Label htmlFor="simpanLunasKe">Simpan ke Rekening</Label>
            <Select
              value={selectedLunasDompet || ""}
              onValueChange={(val: any) => setSelectedLunasDompet(val || "")}
            >
              <SelectTrigger id="simpanLunasKe" className="w-full rounded-none">
                <SelectValue placeholder="Pilih Tujuan Dana" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {dompetList.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">Belum ada dompet, tambahkan di menu Dompetku.</div>
                ) : (
                  dompetList.map(d => (
                    <SelectItem key={d.id.toString()} value={d.nama}>
                      {d.nama} (Rp {formatRibuan(String(d.saldo))})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>"""
content = content.replace(lunas_dompet_ui, "")

lunas_desc_old = """Tandai sisa piutang atas nama <strong>{lunasId?.nama}</strong> senilai <strong>Rp {(Number(lunasId?.sisa_hutang !== undefined ? lunasId?.sisa_hutang : lunasId?.jumlah) || 0).toLocaleString('id-ID')}</strong> sebagai lunas?<br /><br />
              Uang pelunasan akan <strong>otomatis dicatat ke dalam Pemasukan Kas hari ini</strong>."""
lunas_desc_new = """Tandai sisa piutang atas nama <strong>{lunasId?.nama}</strong> senilai <strong>Rp {(Number(lunasId?.sisa_hutang !== undefined ? lunasId?.sisa_hutang : lunasId?.jumlah) || 0).toLocaleString('id-ID')}</strong> sebagai lunas?"""
content = content.replace(lunas_desc_old, lunas_desc_new)

# 10. Remove Select dompet from Cicilan Modal UI
cicilan_dompet_ui = """            <div className="space-y-2">
              <Label htmlFor="simpanKe">Simpan ke Rekening</Label>
              <Select
                value={selectedCicilanDompet || ""}
                onValueChange={(val: any) => setSelectedCicilanDompet(val || "")}
              >
                <SelectTrigger id="simpanKe" className="w-full rounded-none">
                  <SelectValue placeholder="Pilih Tujuan Dana" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {dompetList.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Belum ada dompet, tambahkan di menu Dompetku.</div>
                  ) : (
                    dompetList.map(d => (
                      <SelectItem key={d.id.toString()} value={d.nama}>
                        {d.nama} (Rp {formatRibuan(String(d.saldo))})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>"""
content = content.replace(cicilan_dompet_ui, "")


# 11. Add Cards UI
cards_ui = """
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Piutang Berjalan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  Rp {formatRibuan(String(piutang.reduce((acc, curr) => acc + (curr.status !== 'lunas' ? (Number(curr.sisa_hutang !== undefined ? curr.sisa_hutang : curr.jumlah) || 0) : 0), 0)))}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Piutang Lunas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {piutang.filter(p => p.status === 'lunas').length} <span className="text-sm font-normal text-muted-foreground">Catatan</span>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Piutang Belum Lunas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {piutang.filter(p => p.status !== 'lunas').length} <span className="text-sm font-normal text-muted-foreground">Catatan</span>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Peminjam</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {Array.from(new Set(piutang.map(p => p.nama))).length} <span className="text-sm font-normal text-muted-foreground">Orang</span>
                </div>
              </CardContent>
            </Card>
          </div>
"""

# Insert cards_ui before {isAdding && (
content = content.replace('{isAdding && (', cards_ui + '\n          {isAdding && (')

with open('app/piutang/page.tsx', 'w') as f:
    f.write(content)

print("Done")
