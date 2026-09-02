import re

with open('app/piutang/page.tsx', 'r') as f:
    content = f.read()

# 1. Add States
states_old = """  const [lunasId, setLunasId] = useState<any | null>(null)"""
states_new = """  const [lunasId, setLunasId] = useState<any | null>(null)
  const [tambahHutangId, setTambahHutangId] = useState<any | null>(null)
  const [jumlahTambahHutang, setJumlahTambahHutang] = useState("")
  const [keteranganTambahHutang, setKeteranganTambahHutang] = useState("")
  const [tanggalTambahHutang, setTanggalTambahHutang] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [isCalendarTambahOpen, setIsCalendarTambahOpen] = useState(false)"""

content = content.replace(states_old, states_new)

# 2. Add confirmTambahHutang function
confirm_lunas_idx = content.find("const confirmLunas = async () =>")

confirm_tambah_hutang_code = """  const confirmTambahHutang = async () => {
    if (!tambahHutangId || !jumlahTambahHutang) return

    const tambahanNum = Number(jumlahTambahHutang.replace(/\./g, ''))
    if (isNaN(tambahanNum) || tambahanNum <= 0) {
      toast.add({ title: "Error", description: "Jumlah tidak valid." })
      return
    }

    const currentSisaHutang = Number(tambahHutangId.sisa_hutang !== undefined ? tambahHutangId.sisa_hutang : (tambahHutangId.status === 'lunas' ? '0' : tambahHutangId.jumlah)) || 0
    const newSisaHutang = currentSisaHutang + tambahanNum

    // 1. Update piutang
    await supabase.from('piutang').update({
      status: 'belum lunas',
      sisa_hutang: newSisaHutang
    }).eq('id', tambahHutangId.id)

    // 2. Insert into piutang_cicilan
    await supabase.from('piutang_cicilan').insert({
      piutang_id: tambahHutangId.id,
      tanggal: tanggalTambahHutang,
      jumlah: tambahanNum,
      keterangan: keteranganTambahHutang || "Tambah Hutang",
      jenis: 'hutang'
    })

    await loadData()

    toast.add({
      title: "Tambah Hutang Berhasil",
      description: `Hutang Rp ${formatRibuan(tambahanNum.toString())} ditambahkan ke ${tambahHutangId.nama}.`,
    })

    setTambahHutangId(null)
    setJumlahTambahHutang("")
    setKeteranganTambahHutang("")
  }

"""
content = content[:confirm_lunas_idx] + confirm_tambah_hutang_code + content[confirm_lunas_idx:]


# 3. Add DropdownMenuItem
dropdown_old = """                                    <DropdownMenuItem className="rounded-none cursor-pointer font-semibold text-cyan-600 focus:bg-blue-50 focus:text-cyan-700" onClick={() => setCicilanId(p)}>
                                      Bayar Cicilan
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-none cursor-pointer text-primary font-semibold" onClick={() => setLunasId(p)}>
                                      Tandai Lunas Penuh
                                    </DropdownMenuItem>"""

dropdown_new = """                                    <DropdownMenuItem className="rounded-none cursor-pointer font-semibold text-cyan-600 focus:bg-blue-50 focus:text-cyan-700" onClick={() => setCicilanId(p)}>
                                      Bayar Cicilan
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-none cursor-pointer font-semibold text-orange-600 focus:bg-orange-50 focus:text-orange-700" onClick={() => {
                                      setTambahHutangId(p)
                                      setTanggalTambahHutang(format(new Date(), "yyyy-MM-dd"))
                                    }}>
                                      Tambah Hutang
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-none cursor-pointer text-primary font-semibold" onClick={() => setLunasId(p)}>
                                      Tandai Lunas Penuh
                                    </DropdownMenuItem>"""

content = content.replace(dropdown_old, dropdown_new)

# Note: Dropdown is rendered twice (mobile and desktop)
# I need to do it with regex or multiple replace
# Oh wait, the `dropdown_old` might have been replaced globally if `.replace` does that? In python string `.replace` replaces ALL occurrences.
# Let's verify: Yes, it replaces all occurrences.

# 4. Add AlertDialog UI
alert_dialog_lunas = """      <AlertDialog open={!!lunasId} onOpenChange={(open) => !open && setLunasId(null)}>"""

alert_tambah_hutang_ui = """      <AlertDialog open={!!tambahHutangId} onOpenChange={(open) => !open && setTambahHutangId(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Tambah Hutang</AlertDialogTitle>
            <AlertDialogDescription>
              Catat tambahan hutang baru untuk <strong>{tambahHutangId?.nama}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tanggal</Label>
              <Popover open={isCalendarTambahOpen} onOpenChange={setIsCalendarTambahOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant={"outline"}
                      className={`w-full rounded-none justify-start text-left font-normal ${!tanggalTambahHutang && "text-muted-foreground"}`}
                    >
                      {tanggalTambahHutang ? formatTanggalOutput(tanggalTambahHutang) : <span>Pilih tanggal</span>}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0 rounded-none border" align="start">
                  <Calendar
                    mode="single"
                    selected={tanggalTambahHutang ? new Date(tanggalTambahHutang) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setTanggalTambahHutang(format(date, "yyyy-MM-dd"))
                        setIsCalendarTambahOpen(false)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label>Keterangan Tambahan (Opsional)</Label>
              <Input
                placeholder="Misal: Barang B"
                className="rounded-none"
                value={keteranganTambahHutang}
                onChange={(e) => setKeteranganTambahHutang(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Jumlah Hutang Tambahan (Rp)</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                className="rounded-none border-orange-200 focus-visible:ring-orange-500"
                value={jumlahTambahHutang}
                onChange={(e) => setJumlahTambahHutang(formatRibuan(e.target.value))}
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-orange-600 text-white hover:bg-orange-700"
              onClick={confirmTambahHutang}
              disabled={!jumlahTambahHutang || jumlahTambahHutang === "0"}
            >
              Simpan Tambahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

"""

content = content.replace(alert_dialog_lunas, alert_tambah_hutang_ui + alert_dialog_lunas)

with open('app/piutang/page.tsx', 'w') as f:
    f.write(content)
print("Done")
