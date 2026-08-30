"use client"

import React, { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { Calendar } from "@/components/ui/calendar"
import { supabase } from "@/lib/supabase"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DotsThreeVertical, Plus, X } from "@phosphor-icons/react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function PiutangPage() {
  const [piutang, setPiutang] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [tanggal, setTanggal] = useState<string>("")
  const [keterangan, setKeterangan] = useState("")
  const [jumlah, setJumlah] = useState("")
  const [status, setStatus] = useState("belum lunas")
  const [jatuhTempo, setJatuhTempo] = useState<string>("")

  const [deletingId, setDeletingId] = useState<any | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [lunasId, setLunasId] = useState<any | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isJatuhTempoCalendarOpen, setIsJatuhTempoCalendarOpen] = useState(false)

  const [cicilanId, setCicilanId] = useState<any | null>(null)
  const [jumlahCicilan, setJumlahCicilan] = useState("")

  const [pelangganNames, setPelangganNames] = useState<string[]>([])
  const [searchPelanggan, setSearchPelanggan] = useState("")
  const [selectedPelanggan, setSelectedPelanggan] = useState<string | null>(null)

  // Dompetku states
  const [dompetList, setDompetList] = useState<any[]>([])
  const [selectedDompet, setSelectedDompet] = useState<string | null>(null)
  const [selectedLunasDompet, setSelectedLunasDompet] = useState<string | null>(null)
  const [selectedCicilanDompet, setSelectedCicilanDompet] = useState<string | null>(null)

  async function loadData() {
    const { data: piutangData } = await supabase
      .from('piutang')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    if (piutangData) setPiutang(piutangData)

    const { data: dompetData } = await supabase.from('dompet').select('*')
    if (dompetData) setDompetList(dompetData)

    const { data: pData } = await supabase.from('pelanggan').select('nama').eq('is_deleted', false)
    if (pData) setPelangganNames(pData.map((p) => p.nama))
  }

  useEffect(() => {
    loadData()
  }, [])

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

  const formatRibuan = (val: string) => {
    const num = val.replace(/\D/g, '')
    if (!num) return ''
    return parseInt(num, 10).toLocaleString('id-ID')
  }

  const handleSimpan = async () => {
    if (!tanggal || !selectedPelanggan || !keterangan || !jumlah || !jatuhTempo) {
      toast.add({
        title: "Gagal",
        description: "Harap lengkapi semua data, termasuk Tanggal Jatuh Tempo.",
      })
      return
    }

    if (!editingId && !selectedDompet) {
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
    }

    await loadData()

    setTanggal("")
    setSelectedPelanggan(null)
    setKeterangan("")
    setJumlah("")
    setStatus("belum lunas")
    setJatuhTempo("")
    setSelectedDompet(null)
    setIsAdding(false)
    setEditingId(null)

    toast.add({
      title: "Berhasil",
      description: editingId ? "Data piutang telah diperbarui." : "Data piutang telah disimpan.",
    })
  }

  const handleEdit = (p: any) => {
    setEditingId(p.id)
    setTanggal(p.tanggal)
    setJatuhTempo(p.jatuh_tempo || "")
    setSelectedPelanggan(p.nama)
    setSearchPelanggan(p.nama)
    setKeterangan(p.keterangan)
    setJumlah(formatRibuan(String(p.jumlah)))
    setStatus(p.status)
    setSelectedDompet(p.dompet_nama)
    setIsAdding(true)
  }

  const confirmHapus = async () => {
    if (!deletingId) return

    await supabase.from('piutang').update({ is_deleted: true }).eq('id', deletingId.id)

    const sisaHutangHapus = Number(deletingId.sisa_hutang !== undefined ? deletingId.sisa_hutang : deletingId.jumlah) || 0

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
    }

    await loadData()

    toast.add({
      title: "Berhasil Dihapus",
      description: `Data piutang telah dihapus.`,
    })
    setDeletingId(null)
  }

  const confirmLunas = async () => {
    if (!lunasId) return
    if (!selectedLunasDompet) {
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
    setSelectedLunasDompet(null)
  }

  const confirmCicilan = async () => {
    if (!cicilanId || !jumlahCicilan) return
    if (!selectedCicilanDompet) {
      toast.add({
        title: "Gagal",
        description: "Harap pilih rekening/dompet untuk menyimpan uang cicilan.",
      })
      return
    }

    const cicilanNum = parseInt(jumlahCicilan.replace(/\D/g, ''), 10) || 0
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
    setSelectedCicilanDompet(null)
  }

  const formatTanggalOutput = (dateStr: string) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const itemsPerPage = 15
  const totalPages = Math.ceil(piutang.length / itemsPerPage)
  const currentPiutang = piutang.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
            <h1 className="text-1xl font-bold tracking-tight">Catatan Piutang</h1>
            <div className="flex gap-2 items-center">
              {/* Desktop Button */}
              <Button
                type="button"
                className="hidden md:flex rounded-none"
                onClick={() => {
                  if (isAdding) {
                    setIsAdding(false)
                    setEditingId(null)
                    setTanggal("")
                    setJatuhTempo("")
                    setSelectedPelanggan(null)
                    setKeterangan("")
                    setJumlah("")
                    setStatus("belum lunas")
                  } else {
                    setIsAdding(true)
                  }
                }}
              >
                {isAdding ? "Batal" : "Tambah Piutang"}
              </Button>

              {/* Mobile Button (Bulat Icon) */}
              <Button
                type="button"
                className="md:hidden rounded-full w-8 h-8 p-0 shadow-md flex items-center justify-center transition-transform active:scale-95"
                onClick={() => {
                  if (isAdding) {
                    setIsAdding(false)
                    setEditingId(null)
                    setTanggal("")
                    setJatuhTempo("")
                    setSelectedPelanggan(null)
                    setKeterangan("")
                    setJumlah("")
                    setStatus("belum lunas")
                  } else {
                    setIsAdding(true)
                  }
                }}
              >
                {isAdding ? <X weight="bold" size={16} /> : <Plus weight="bold" size={16} />}
              </Button>
            </div>
          </div>

          {isAdding && (
            <div className="mb-6 p-6 bg-card border rounded-none shadow-sm">
              <h2 className="text-sm font-semibold mb-4">{editingId ? "Edit Piutang" : "Tambah Piutang Baru"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal Piutang</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="pelanggan">Nama Peminjam/Pelanggan</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Combobox
                        items={pelangganNames}
                        value={selectedPelanggan}
                        onValueChange={(val: any) => setSelectedPelanggan(val)}
                        inputValue={searchPelanggan}
                        onInputValueChange={(val: any) => setSearchPelanggan(val || "")}
                      >
                        <ComboboxInput placeholder="Cari atau ketik nama..." className="rounded-none w-full" />
                        <ComboboxContent className="rounded-none">
                          <ComboboxEmpty>
                            <div className="p-2 text-sm text-center">Nama tidak ditemukan.</div>
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
                  <Label htmlFor="keterangan">Keterangan Piutang</Label>
                  <Input
                    id="keterangan"
                    placeholder="Misal: Kekurangan bayar"
                    className="rounded-none"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah (Rp)</Label>
                  <Input
                    id="jumlah"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className="rounded-none"
                    value={jumlah}
                    onChange={(e) => setJumlah(formatRibuan(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jatuhTempo">Jatuh Tempo</Label>
                  <div>
                    <Popover open={isJatuhTempoCalendarOpen} onOpenChange={setIsJatuhTempoCalendarOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            id="jatuhTempo"
                            variant={"outline"}
                            className={`w-full rounded-none justify-start text-left font-normal ${!jatuhTempo && "text-muted-foreground"}`}
                          >
                            {jatuhTempo ? formatTanggalOutput(jatuhTempo) : <span>Pilih jatuh tempo</span>}
                          </Button>
                        }
                      />
                      <PopoverContent className="w-auto p-0 rounded-none border" align="start">
                        <Calendar
                          mode="single"
                          selected={jatuhTempo ? new Date(jatuhTempo) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setJatuhTempo(format(date, "yyyy-MM-dd"))
                              setIsJatuhTempoCalendarOpen(false)
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button type="button" className="rounded-none" onClick={handleSimpan}>
                  Simpan Data
                </Button>
              </div>
            </div>
          )}

          <div className="lg:bg-card lg:text-card-foreground lg:shadow-sm lg:border lg:rounded-none">
            {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}
            <div className="flex flex-col gap-3 lg:hidden">
              {piutang.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Belum ada pencatatan piutang.
                </div>
              ) : (
                currentPiutang.map((p, index) => {
                  const isLewatJatuhTempo = p.jatuh_tempo && new Date(p.jatuh_tempo) < new Date() && p.status !== "lunas"
                  return (
                    <div
                      key={p.id}
                      className="border bg-card shadow-sm p-3.5 flex flex-col gap-2 transition-all duration-200 hover:shadow-md hover:border-primary/20 active:bg-primary/5 rounded-none"
                    >
                      {/* Header: Nama Peminjam & Aksi */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm leading-snug truncate flex-1" title={p.nama}>{p.nama}</div>
                        <div className="-mr-2 -mt-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none">
                                  <DotsThreeVertical weight="bold" />
                                  <span className="sr-only">Buka menu</span>
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="rounded-none">
                              {p.status !== "lunas" && (
                                <>
                                  <DropdownMenuItem className="rounded-none cursor-pointer font-semibold text-cyan-600 focus:bg-blue-50 focus:text-cyan-700" onClick={() => setCicilanId(p)}>
                                    Bayar Cicilan
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-none cursor-pointer text-primary font-semibold" onClick={() => setLunasId(p)}>
                                    Tandai Lunas Penuh
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEdit(p)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="rounded-none cursor-pointer text-red-600 focus:bg-red-600 focus:text-white" onClick={() => setDeletingId(p)}>Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Info Utama: Keterangan & Sisa Hutang (Pojok Kanan) */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[60%]">
                          <span className="inline-block w-2 h-2 rounded-none bg-primary/40 shrink-0"></span>
                          <span className="truncate">{p.keterangan || "-"}</span>
                        </div>
                        <div className="font-bold text-orange-600 text-sm whitespace-nowrap">
                          Rp {formatRibuan(String(p.sisa_hutang !== undefined ? p.sisa_hutang : (p.status === 'lunas' ? '0' : p.jumlah)))}
                        </div>
                      </div>

                      {/* Detail Hutang (di dalam box) */}
                      <div className="flex items-center justify-between p-2 mt-1 bg-muted/50 border rounded-none text-xs text-muted-foreground">
                        <div className="flex flex-col">
                          <span className="mb-0.5 text-[10px] font-medium capitalize">Total Hutang</span>
                          <span className="font-semibold text-foreground">Rp {formatRibuan(String(p.jumlah))}</span>
                        </div>
                        <div>
                          {p.status === "lunas" ? (
                            <span className="inline-flex items-center rounded-none bg-green-600 px-2 py-0.5 text-[10px] font-medium text-white">Lunas</span>
                          ) : (
                            <span className="inline-flex items-center rounded-none bg-orange-600 px-2 py-0.5 text-[10px] font-medium text-white">Belum Lunas</span>
                          )}
                        </div>
                      </div>

                      {/* Tanggal & Jatuh Tempo */}
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                        <div>Tanggal: {formatTanggalOutput(p.tanggal)}</div>
                        <div>
                          Jatuh Tempo: <span className={`font-semibold ${isLewatJatuhTempo ? 'text-red-600' : 'text-foreground'}`}>
                            {p.jatuh_tempo ? formatTanggalOutput(p.jatuh_tempo) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* === DESKTOP: Table View (hidden below lg) === */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center border-r whitespace-nowrap">No</TableHead>
                    <TableHead className="border-r whitespace-nowrap">Tanggal</TableHead>
                    <TableHead className="border-r whitespace-nowrap">Peminjam</TableHead>
                    <TableHead className="border-r whitespace-nowrap">Keterangan</TableHead>
                    <TableHead className="border-r text-right whitespace-nowrap">Total Hutang</TableHead>
                    <TableHead className="border-r text-right whitespace-nowrap">Sisa Hutang</TableHead>
                    <TableHead className="border-r text-right whitespace-nowrap">Jatuh Tempo</TableHead>
                    <TableHead className="border-r text-center whitespace-nowrap">Status</TableHead>
                    <TableHead className="w-[60px] text-center whitespace-nowrap">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {piutang.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                        Belum ada pencatatan piutang.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentPiutang.map((p, index) => {
                      const isLewatJatuhTempo = p.jatuh_tempo && new Date(p.jatuh_tempo) < new Date() && p.status !== "lunas"
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-center border-r">{index + 1}</TableCell>
                          <TableCell className="border-r">{formatTanggalOutput(p.tanggal)}</TableCell>
                          <TableCell className="border-r font-semibold max-w-[150px] truncate" title={p.nama}>{p.nama}</TableCell>
                          <TableCell className="border-r max-w-[200px] truncate" title={p.keterangan}>{p.keterangan}</TableCell>
                          <TableCell className="border-r text-right whitespace-nowrap">Rp {formatRibuan(String(p.jumlah))}</TableCell>
                          <TableCell className="border-r text-right font-semibold text-orange-600 whitespace-nowrap">
                            Rp {formatRibuan(String(p.sisa_hutang !== undefined ? p.sisa_hutang : (p.status === 'lunas' ? '0' : p.jumlah)))}
                          </TableCell>
                          <TableCell className={`border-r text-right ${isLewatJatuhTempo ? 'text-red-600 font-bold' : ''}`}>
                            {p.jatuh_tempo ? formatTanggalOutput(p.jatuh_tempo) : '-'}
                          </TableCell>
                          <TableCell className="border-r text-center">
                            {p.status === "lunas" ? (
                              <span className="inline-flex items-center rounded-none bg-green-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                Lunas
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-none bg-orange-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                Belum Lunas
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none">
                                    <DotsThreeVertical weight="bold" />
                                    <span className="sr-only">Buka menu</span>
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="rounded-none">
                                {p.status !== "lunas" && (
                                  <>
                                    <DropdownMenuItem className="rounded-none cursor-pointer font-semibold text-cyan-600 focus:bg-blue-50 focus:text-cyan-700" onClick={() => setCicilanId(p)}>
                                      Bayar Cicilan
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-none cursor-pointer text-primary font-semibold" onClick={() => setLunasId(p)}>
                                      Tandai Lunas Penuh
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEdit(p)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-none cursor-pointer text-red-600 focus:bg-red-600 focus:text-white" onClick={() => setDeletingId(p)}>Hapus</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="py-4 border-t flex items-center justify-between">
                <div className="text-sm text-muted-foreground px-4">Halaman {currentPage} dari {totalPages}</div>
                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) setCurrentPage(p => p - 1)
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) setCurrentPage(p => p + 1)
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Piutang?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data piutang <strong>{deletingId?.nama}</strong> sebesar <strong>Rp {(Number(deletingId?.jumlah) || 0).toLocaleString('id-ID')}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-none bg-red-600 text-white hover:bg-red-700" onClick={confirmHapus}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!lunasId} onOpenChange={(open) => !open && setLunasId(null)}>
        <AlertDialogContent className="rounded-none border-green-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-700">Tandai Piutang Lunas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tandai sisa piutang atas nama <strong>{lunasId?.nama}</strong> senilai <strong>Rp {(Number(lunasId?.sisa_hutang !== undefined ? lunasId?.sisa_hutang : lunasId?.jumlah) || 0).toLocaleString('id-ID')}</strong> sebagai lunas?<br /><br />
              Uang pelunasan akan <strong>otomatis dicatat ke dalam Pemasukan Kas hari ini</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 space-y-2">
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
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-none bg-green-600 text-white hover:bg-green-700" onClick={confirmLunas}>
              Ya, Tandai Lunas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cicilanId} onOpenChange={(open) => {
        if (!open) {
          setCicilanId(null)
          setJumlahCicilan("")
        }
      }}>
        <AlertDialogContent className="rounded-none border-primary">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-bold">Bayar Cicilan Piutang</AlertDialogTitle>
            <AlertDialogDescription>
              Catat cicilan dari <strong>{cicilanId?.nama}</strong>. Sisa hutang saat ini: <strong>Rp {(Number(cicilanId?.sisa_hutang !== undefined ? cicilanId?.sisa_hutang : cicilanId?.jumlah) || 0).toLocaleString('id-ID')}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jumlahCicilan">Jumlah Bayar Cicilan (Rp)</Label>
              <Input
                id="jumlahCicilan"
                type="text"
                inputMode="numeric"
                className="rounded-none"
                placeholder="0"
                value={jumlahCicilan}
                onChange={(e) => setJumlahCicilan(formatRibuan(e.target.value))}
              />
            </div>
            <div className="space-y-2">
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
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-primary text-white hover:bg-emerald-700"
              onClick={confirmCicilan}
              disabled={!jumlahCicilan || jumlahCicilan === "0"}
            >
              Simpan Cicilan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </SidebarProvider>
  )
}
