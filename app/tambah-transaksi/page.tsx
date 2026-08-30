"use client"

import React, { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { toast } from "@/components/ui/toast"
import { supabase } from "@/lib/supabase"

const initialPelanggan = [
  { id: 1, nama: "Agus Pak Won", telp: "081234567890" },
  { id: 2, nama: "Tigus", telp: "085678901234" },
  { id: 3, nama: "Iwan", telp: "089012345678" },
  { id: 4, nama: "Mang Wawan", telp: "082345678901" },
]

export default function TambahTransaksiPage() {
  const [tanggal, setTanggal] = useState<string>("")
  const [jenis, setJenis] = useState<string>("")
  const [pelangganNames, setPelangganNames] = useState<string[]>([])

  async function loadData() {
    const { data: pData } = await supabase.from('pelanggan').select('nama').eq('is_deleted', false)
    if (pData) {
      setPelangganNames(pData.map((p) => p.nama))
    } else {
      setPelangganNames(initialPelanggan.map(p => p.nama))
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])
  const [searchPelanggan, setSearchPelanggan] = useState("")
  const [selectedPelanggan, setSelectedPelanggan] = useState<string | null>(null)

  const [jumlahTotal, setJumlahTotal] = useState("")
  const [hargaPerGram, setHargaPerGram] = useState("")
  const [bk, setBk] = useState("")
  const [bb, setBb] = useState("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const [dompetList, setDompetList] = useState<any[]>([])
  const [selectedDompet, setSelectedDompet] = useState<string>("")

  async function loadDompet() {
    const { data } = await supabase.from('dompet').select('*')
    if (data) setDompetList(data)
  }

  React.useEffect(() => {
    loadDompet()
  }, [])

  React.useEffect(() => {
    const bbNum = parseFloat(bb.replace(/,/g, '.'))
    const hargaNum = parseInt(hargaPerGram.replace(/\./g, ''), 10)

    if (!isNaN(bbNum) && !isNaN(hargaNum) && bbNum > 0 && hargaNum > 0) {
      const calculatedTotal = Math.round(bbNum * hargaNum)
      setJumlahTotal(calculatedTotal.toLocaleString('id-ID'))
    }
  }, [bb, hargaPerGram])

  const formatRibuan = (val: string) => {
    const num = val.replace(/\D/g, '')
    if (!num) return ''
    return parseInt(num, 10).toLocaleString('id-ID')
  }

  const handleSimpanPelangganBaru = async () => {
    if (!searchPelanggan) return
    if (!pelangganNames.includes(searchPelanggan)) {
      await supabase.from('pelanggan').insert({ nama: searchPelanggan })
      setPelangganNames([...pelangganNames, searchPelanggan])
    }
    setSelectedPelanggan(searchPelanggan)
    setSearchPelanggan("")
    toast.add({
      title: "Berhasil",
      description: `Pelanggan ${searchPelanggan} ditambahkan.`,
    })
  }

  const handleSimpanTransaksi = async () => {
    if (!selectedPelanggan || !tanggal || !jenis || !bk || !bb || !hargaPerGram || !jumlahTotal || !selectedDompet) {
      toast.add({
        title: "Gagal",
        description: "Harap lengkapi semua kolom form termasuk Sumber Dana.",
      })
      return
    }

    const dompetObj = dompetList.find(d => d.nama === selectedDompet)
    if (!dompetObj) return;
    const parsedTotal = parseInt(jumlahTotal.replace(/\D/g, ''), 10) || 0

    // Proteksi Saldo Kurang
    if (jenis === "pembelian") {
      const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', dompetObj.id).single()
      if (freshDompet && Number(freshDompet.saldo) < parsedTotal) {
        toast.add({
          title: "Saldo Tidak Cukup",
          description: `Saldo ${selectedDompet} (Rp ${formatRibuan(String(freshDompet.saldo))}) kurang untuk pembelian ini.`,
        })
        return
      }
    }

    await supabase.from('transaksi').insert({
      pelanggan: selectedPelanggan,
      tanggal,
      jenis,
      bk,
      bb: parseFloat(bb.replace(/,/g, '.')),
      harga_per_gram: parseInt(hargaPerGram.replace(/\D/g, ''), 10),
      jumlah_total: parsedTotal,
      dompet_id: dompetObj.id,
      dompet_nama: selectedDompet
    })

    // Update saldo dompet
    const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', dompetObj.id).single()
    if (freshDompet) {
      const currentSaldo = Number(freshDompet.saldo)
      const newSaldo = jenis === "penjualan" ? currentSaldo + parsedTotal : currentSaldo - parsedTotal
      await supabase.from('dompet').update({ saldo: newSaldo }).eq('id', dompetObj.id)
    }

    // Catat ke Kas
    await supabase.from('kas').insert({
      tanggal,
      keterangan: `${jenis === 'pembelian' ? 'Pembelian' : 'Penjualan'} Emas - ${selectedPelanggan}`,
      jumlah: parsedTotal,
      jenis: jenis === "pembelian" ? "pembelian_emas" : "penjualan_emas",
      dompet_id: dompetObj.id,
      dompet_nama: selectedDompet
    })

    toast.add({
      title: "Berhasil",
      description: "Data transaksi berhasil disimpan dan saldo dompet telah diperbarui.",
    })

    // Reset form
    setSelectedPelanggan(null)
    setTanggal("")
    setJenis("")
    setBk("")
    setBb("")
    setHargaPerGram("")
    setJumlahTotal("")
    setSelectedDompet("")
  }

  const formatTanggalOutput = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-1xl font-bold tracking-tight">Mulai Transaksi</h1>
          </div>

          <div className="bg-card text-card-foreground shadow-sm border rounded-none p-6">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Pelanggan</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Combobox 
                        items={pelangganNames} 
                        value={selectedPelanggan} 
                        onValueChange={(val: any) => setSelectedPelanggan(val)}
                        inputValue={searchPelanggan}
                        onInputValueChange={(val: any) => setSearchPelanggan(val || "")}
                      >
                        <ComboboxInput placeholder="Cari atau ketik nama pelanggan..." className="rounded-none w-full" />
                        <ComboboxContent className="rounded-none">
                          <ComboboxEmpty>
                            <div className="p-2 text-sm text-center">Pelanggan tidak ditemukan.</div>
                          </ComboboxEmpty>
                          <ComboboxList className="max-h-32">
                            {(item: string) => (
                              <ComboboxItem key={item} value={item} className="rounded-none">
                                {item}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                          {searchPelanggan && !pelangganNames.includes(searchPelanggan) && (
                            <div className="p-1 border-t mt-1">
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start rounded-none text-primary"
                                onClick={handleSimpanPelangganBaru}
                              >
                                + Tambah "{searchPelanggan}"
                              </Button>
                            </div>
                          )}
                        </ComboboxContent>
                      </Combobox>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tanggal">Tanggal</Label>
                  </div>
                  <div>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            id="tanggal"
                            variant={"outline"}
                            className={`w-full rounded-none justify-start text-left font-normal ${!tanggal && "text-muted-foreground"}`}
                          >
                            {tanggal ? formatTanggalOutput(tanggal) : <span>Pilih tanggal</span>}
                          </Button>
                        }
                      />
                      <PopoverContent className="w-auto p-0 rounded-none border" align="start">
                        <Calendar
                          mode="single"
                          selected={tanggal ? new Date(tanggal) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setTanggal(format(date, "yyyy-MM-dd"))
                              setIsCalendarOpen(false)
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="jenis">Jenis Transaksi</Label>
                  <Select value={jenis} onValueChange={(val: any) => setJenis(val || "")}>
                    <SelectTrigger id="jenis" className="w-full rounded-none">
                      <SelectValue placeholder="Pilih jenis transaksi" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="penjualan">Penjualan</SelectItem>
                      <SelectItem value="pembelian">Pembelian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sumberDana">Sumber Dana / Tujuan {jenis === 'penjualan' ? '(Uang Masuk ke)' : (jenis === 'pembelian' ? '(Uang Keluar dari)' : '')}</Label>
                  <Select value={selectedDompet} onValueChange={(val: any) => setSelectedDompet(val || "")}>
                    <SelectTrigger id="sumberDana" className="w-full rounded-none">
                      <SelectValue placeholder="Pilih rekening atau dompet" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {dompetList.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">Belum ada dompet, tambahkan di menu Dompetku.</div>
                      ) : (
                        dompetList.map(d => (
                          <SelectItem key={d.id} value={d.nama}>
                            {d.nama} (Sisa Saldo: Rp {formatRibuan(d.saldo.toString())})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">Detail Emas</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bk">Berat Kotor (BK)</Label>
                    <Input
                      id="bk"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={bk}
                      onChange={(e) => setBk(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bb">Berat Bersih (BB)</Label>
                    <Input
                      id="bb"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={bb}
                      onChange={(e) => setBb(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="harga">Harga / Gram</Label>
                    <Input
                      id="harga"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={hargaPerGram}
                      onChange={(e) => setHargaPerGram(formatRibuan(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jumlah">Jumlah Total (Rp)</Label>
                    <Input
                      id="jumlah"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={jumlahTotal}
                      onChange={(e) => setJumlahTotal(formatRibuan(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button type="button" variant="outline" nativeButton={false} render={<a href="/" />}>
                  Batal
                </Button>
                <Button type="button" onClick={handleSimpanTransaksi}>Simpan Data</Button>
              </div>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
