"use client"

import React, { useState, useEffect, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { DotsThreeVertical, Plus, X, ArrowLeft, SortAscending, SortDescending } from "@phosphor-icons/react"
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

export default function TitipDanaPage() {
  const [titipDanaData, setTitipDanaData] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [tanggal, setTanggal] = useState<string>("")
  const [keterangan, setKeterangan] = useState("")
  const [jumlah, setJumlah] = useState("")
  const [status, setStatus] = useState("aktif")

  const [deletingId, setDeletingId] = useState<any | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selesaiId, setSelesaiId] = useState<any | null>(null)
  const [tambahTitipanId, setTambahTitipanId] = useState<any | null>(null)
  const [jumlahTambahTitipan, setJumlahTambahTitipan] = useState("")
  const [keteranganTambahTitipan, setKeteranganTambahTitipan] = useState("")
  const [tanggalTambahTitipan, setTanggalTambahTitipan] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [isCalendarTambahOpen, setIsCalendarTambahOpen] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const [mutasiId, setMutasiId] = useState<any | null>(null)
  const [jumlahMutasi, setJumlahMutasi] = useState("")

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [riwayatId, setRiwayatId] = useState<any | null>(null)
  const [riwayatData, setRiwayatData] = useState<any[]>([])
  const [riwayatSortOrder, setRiwayatSortOrder] = useState<'desc' | 'asc'>('desc')
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false)

  const [pelangganNames, setPelangganNames] = useState<string[]>([])
  const [searchPelanggan, setSearchPelanggan] = useState("")
  const [selectedPelanggan, setSelectedPelanggan] = useState<string | null>(null)



  const [totalUangMasuk, setTotalUangMasuk] = useState(0)
  const [totalUangKeluar, setTotalUangKeluar] = useState(0)

  async function loadData() {
    const { data: titipDanaData } = await supabase
      .from('titip_dana')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    if (titipDanaData) setTitipDanaData(titipDanaData)

    const { data: mutasiData } = await supabase
      .from('titip_dana_mutasi')
      .select('jumlah')
      .eq('jenis', 'ambil')

    if (mutasiData) {
      setTotalUangMasuk(mutasiData.reduce((acc, curr) => acc + Number(curr.jumlah), 0))
    }

    const { data: tambahTitipanData } = await supabase
      .from('titip_dana_mutasi')
      .select('jumlah')
      .eq('jenis', 'titip')

    let sumTambahTitipan = 0
    if (tambahTitipanData) {
      sumTambahTitipan = tambahTitipanData.reduce((acc, curr) => acc + Number(curr.jumlah), 0)
    }

    let sumTitipDanaAwal = 0
    if (titipDanaData) {
      sumTitipDanaAwal = titipDanaData.reduce((acc, curr) => acc + Number(curr.jumlah), 0)
    }

    setTotalUangKeluar(sumTitipDanaAwal + sumTambahTitipan)


    const { data: pData } = await supabase.from('pelanggan').select('nama').eq('is_deleted', false)
    if (pData) setPelangganNames(pData.map((p) => p.nama))
  }

  useEffect(() => {
    loadData()
  }, [])

  const fetchRiwayat = async (p: any) => {
    setRiwayatId(p)
    setIsLoadingRiwayat(true)
    setViewMode('detail')

    const { data } = await supabase
      .from('titip_dana_mutasi')
      .select('*')
      .eq('titip_dana_id', p.id)
      .order('created_at', { ascending: true })

    const mutations: any[] = []

    // 1. Catatan Titipan Awal
    mutations.push({
      id: 'awal',
      tanggal: p.tanggal,
      keterangan: p.keterangan || 'Catatan Titipan Awal',
      jenis: 'titip',
      jumlah: Number(p.jumlah)
    })

    // 2. Daftar Mutasi
    if (data && data.length > 0) {
      data.forEach(d => {
        mutations.push({
          id: d.id,
          tanggal: d.tanggal,
          keterangan: d.keterangan || (d.jenis === 'titip' ? 'Tambah Titipan' : 'Penarikan Dana'),
          jenis: d.jenis || 'ambil',
          jumlah: Number(d.jumlah)
        })
      })
    }

    // 3. Kalkulasi Saldo
    let currentSaldo = 0
    mutations.forEach(m => {
      if (m.jenis === 'titip') {
        currentSaldo += m.jumlah
      } else {
        currentSaldo -= m.jumlah
      }
      m.saldo = currentSaldo
    })

    setRiwayatData(mutations.reverse())
    setIsLoadingRiwayat(false)
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

  const formatRibuan = (val: string) => {
    const num = val.replace(/\D/g, '')
    if (!num) return ''
    return parseInt(num, 10).toLocaleString('id-ID')
  }

  const handleSimpan = async () => {
    if (!tanggal || !selectedPelanggan || !keterangan || !jumlah) {
      toast.add({
        title: "Gagal",
        description: "Harap lengkapi semua data.",
      })
      return
    }

    const parsedJumlah = parseInt(String(jumlah).replace(/\D/g, ''), 10) || 0

    if (editingId) {
      const oldItem = titipDanaData.find((item: any) => item.id === editingId)
      const oldJumlah = Number(oldItem?.jumlah) || 0
      const newJumlah = parsedJumlah
      const selisih = newJumlah - oldJumlah

      let newSisa = (Number(oldItem?.saldo) || 0) + selisih
      if (newSisa < 0) newSisa = 0

      await supabase.from('titip_dana').update({
        tanggal,
        nama: selectedPelanggan,
        keterangan,
        jumlah: newJumlah,
        saldo: newSisa,
        status: newSisa === 0 ? "selesai" : status
      }).eq('id', editingId)

    } else {
      await supabase.from('titip_dana').insert({
        tanggal,
        nama: selectedPelanggan,
        keterangan,
        jumlah: parsedJumlah,
        saldo: parsedJumlah,
        status: "aktif"
      })
    }

    await loadData()

    setTanggal("")
    setSelectedPelanggan(null)
    setKeterangan("")
    setJumlah("")
    setStatus("aktif")
    setIsAdding(false)
    setEditingId(null)

    toast.add({
      title: "Berhasil",
      description: editingId ? "Data titipDanaData telah diperbarui." : "Data titipDanaData telah disimpan.",
    })
  }

  const handleEdit = (p: any) => {
    setEditingId(p.id)
    setTanggal(p.tanggal)
    setSelectedPelanggan(p.nama)
    setSearchPelanggan(p.nama)
    setKeterangan(p.keterangan)
    setJumlah(formatRibuan(String(p.jumlah)))
    setStatus(p.status)
    setIsAdding(true)
  }

  const confirmHapus = async () => {
    if (!deletingId) return

    await supabase.from('titip_dana').delete().eq('id', deletingId.id)



    await loadData()

    toast.add({
      title: "Berhasil Dihapus",
      description: `Data titipDanaData telah dihapus.`,
    })
    setDeletingId(null)
  }

  const confirmTambahTitipan = async () => {
    if (!tambahTitipanId || !jumlahTambahTitipan) return

    const tambahanNum = Number(jumlahTambahTitipan.replace(/\./g, ''))
    if (isNaN(tambahanNum) || tambahanNum <= 0) {
      toast.add({ title: "Error", description: "Jumlah tidak valid." })
      return
    }

    const currentSisaTitipan = Number(tambahTitipanId.saldo !== undefined ? tambahTitipanId.saldo : (tambahTitipanId.status === 'selesai' ? '0' : tambahTitipanId.jumlah)) || 0
    const newSisaTitipan = currentSisaTitipan + tambahanNum

    // 1. Update titipDanaData
    await supabase.from('titip_dana').update({
      status: 'aktif',
      saldo: newSisaTitipan
    }).eq('id', tambahTitipanId.id)

    // 2. Insert into titip_dana_mutasi
    await supabase.from('titip_dana_mutasi').insert({
      titip_dana_id: tambahTitipanId.id,
      tanggal: tanggalTambahTitipan,
      jumlah: tambahanNum,
      keterangan: keteranganTambahTitipan || "Tambah Titipan",
      jenis: 'titip'
    })

    await loadData()

    toast.add({
      title: "Tambah Titipan Berhasil",
      description: `Titipan Rp ${formatRibuan(tambahanNum.toString())} ditambahkan ke ${tambahTitipanId.nama}.`,
    })

    setTambahTitipanId(null)
    setJumlahTambahTitipan("")
    setKeteranganTambahTitipan("")
  }

  const confirmSelesai = async () => {
    if (!selesaiId) return

    // Hitung sisa titip yang harus diselesaii
    const sisa = Number(selesaiId.saldo !== undefined ? selesaiId.saldo : selesaiId.jumlah) || 0;

    // 1. Update status titipDanaData
    await supabase.from('titip_dana').update({ status: 'selesai', saldo: 0 }).eq('id', selesaiId.id)

    // 2. Catat mutasi peselesaian (jika masih ada sisa)
    if (sisa > 0) {
      await supabase.from('titip_dana_mutasi').insert({
        titip_dana_id: selesaiId.id,
        tanggal: format(new Date(), 'yyyy-MM-dd'),
        jumlah: sisa,
        keterangan: 'Penyelesaian Penuh',
        jenis: 'ambil'
      })
    }

    await loadData()

    toast.add({
      title: "Berhasil Diselesaii",
      description: `Titip Dana telah berhasil diselesaii.`,
    })
    setSelesaiId(null)
  }

  const confirmMutasi = async () => {
    if (!mutasiId || !jumlahMutasi) return
    const mutasiNum = parseInt(jumlahMutasi.replace(/\D/g, ''), 10) || 0
    if (mutasiNum <= 0) return

    const sisaSaldoSaatIniNum = Number(mutasiId.saldo !== undefined ? mutasiId.saldo : mutasiId.jumlah) || 0

    let sisaSaldoBaruNum = sisaSaldoSaatIniNum - mutasiNum
    if (sisaSaldoBaruNum < 0) sisaSaldoBaruNum = 0

    const isSelesai = sisaSaldoBaruNum === 0

    // 1. Update titipDanaData
    await supabase.from('titip_dana').update({
      status: isSelesai ? 'selesai' : 'aktif',
      saldo: sisaSaldoBaruNum
    }).eq('id', mutasiId.id)

    // 2. Insert into titip_dana_mutasi
    await supabase.from('titip_dana_mutasi').insert({
      titip_dana_id: mutasiId.id,
      tanggal: format(new Date(), "yyyy-MM-dd"),
      jumlah: mutasiNum,
      keterangan: isSelesai ? "Mutasi Terakhir (Selesai)" : "Penarikan Dana",
      jenis: 'ambil'
    })

    await loadData()

    toast.add({
      title: "Mutasi Berhasil",
      description: `Penarikan Rp ${formatRibuan(mutasiNum.toString())} dicatat.${isSelesai ? ' Titip Dana LUNAS.' : ''}`,
    })

    setMutasiId(null)
    setJumlahMutasi("")
  }

  const formatTanggalOutput = (dateStr: string) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const itemsPerPage = 15
  const totalPages = Math.ceil(titipDanaData.length / itemsPerPage)
  const currentTitipDana = titipDanaData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Hook untuk efek hitung animasi (smooth)
  function useCountUp(endValue: number, duration: number = 1500) {
    const [count, setCount] = useState(0)

    useEffect(() => {
      if (endValue === 0) {
        setCount(0)
        return
      }

      let startTime: number | null = null
      let animationFrame: number

      const easeOutExpo = (t: number): number => {
        return t === 1 ? 1 : 1 - Math.pow(4, -5 * t)
      }

      const step = (currentTime: number) => {
        if (!startTime) startTime = currentTime
        const progress = Math.min((currentTime - startTime) / duration, 1)

        setCount(Math.floor(easeOutExpo(progress) * endValue))

        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(step)
        } else {
          setCount(endValue)
        }
      }

      animationFrame = window.requestAnimationFrame(step)

      return () => {
        if (animationFrame) window.cancelAnimationFrame(animationFrame)
      }
    }, [endValue, duration])

    return count
  }

  const valTitipDanaBerjalan = useMemo(() => titipDanaData.reduce((acc, curr) => acc + (curr.status !== 'selesai' ? (Number(curr.saldo !== undefined ? curr.saldo : curr.jumlah) || 0) : 0), 0), [titipDanaData])
  const valTitipDanaBelumSelesai = useMemo(() => titipDanaData.filter(p => p.status !== 'selesai').length, [titipDanaData])

  const animTotalTitipDana = useCountUp(valTitipDanaBerjalan)
  const animUangKeluar = useCountUp(totalUangKeluar)
  const animUangMasuk = useCountUp(totalUangMasuk)
  const animBelumSelesai = useCountUp(valTitipDanaBelumSelesai)

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
          {viewMode === 'list' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="relative rounded-none border bg-linear-to-t from-primary/5 to-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Titipan Berjalan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-violet-600">
                      Rp {formatRibuan(String(animTotalTitipDana))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="relative rounded-none border bg-linear-to-t from-primary/5 to-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Dana Masuk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      Rp {formatRibuan(String(animUangKeluar))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="relative rounded-none border bg-linear-to-t from-primary/5 to-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Dana Keluar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      Rp {formatRibuan(String(animUangMasuk))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="relative rounded-none border bg-linear-to-t from-primary/5 to-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Titipan Aktif</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {animBelumSelesai} <span className="text-sm font-normal text-muted-foreground">Catatan</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between items-center mb-4 mt-2">
                <h1 className="text-1xl font-bold tracking-tight">Catatan Titip Dana</h1>
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
                        setSelectedPelanggan(null)
                        setKeterangan("")
                        setJumlah("")
                        setStatus("aktif")
                      } else {
                        setIsAdding(true)
                      }
                    }}
                  >
                    {isAdding ? "Batal" : "Tambah Titip Dana"}
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
                        setSelectedPelanggan(null)
                        setKeterangan("")
                        setJumlah("")
                        setStatus("aktif")
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
                  <h2 className="text-sm font-semibold mb-4">{editingId ? "Edit Titip Dana" : "Tambah Titip Dana Baru"}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tanggal">Tanggal Titip Dana</Label>
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
                      <Label htmlFor="pelanggan">Nama Penitip/Pelanggan</Label>
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
                      <Label htmlFor="keterangan">Keterangan Titip Dana</Label>
                      <Input
                        id="keterangan"
                        placeholder="Misal: Kekurangan tarik"
                        className="rounded-none"
                        value={keterangan}
                        onChange={(e) => setKeterangan(e.target.value)}
                      />
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
                  {titipDanaData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Belum ada pencatatan titipDanaData.
                    </div>
                  ) : (
                    currentTitipDana.map((p, index) => {
                      return (
                        <div
                          key={p.id}
                          className="border bg-card shadow-sm p-3.5 flex flex-col gap-2 transition-all duration-200 hover:shadow-md hover:border-primary/20 active:bg-primary/5 rounded-none"
                        >
                          {/* Header: Nama Penitip & Aksi */}
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
                                  {p.status !== "selesai" && (
                                    <>
                                      <DropdownMenuItem className="rounded-none cursor-pointer font-semibold text-cyan-600 focus:bg-blue-50 focus:text-cyan-700" onClick={() => setMutasiId(p)}>
                                        Tarik Dana
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="rounded-none cursor-pointer font-semibold text-orange-600 focus:bg-orange-50 focus:text-orange-700" onClick={() => {
                                        setTambahTitipanId(p)
                                        setTanggalTambahTitipan(format(new Date(), "yyyy-MM-dd"))
                                      }}>
                                        Tambah Titipan
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="rounded-none cursor-pointer text-primary font-semibold" onClick={() => setSelesaiId(p)}>
                                        Tandai Selesai
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => fetchRiwayat(p)}>Lihat Riwayat</DropdownMenuItem>
                                  {p.status !== 'selesai' && (
                                    <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEdit(p)}>Edit</DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem className="rounded-none cursor-pointer text-red-600 focus:bg-red-600 focus:text-white" onClick={() => setDeletingId(p)}>Hapus</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Info Utama: Keterangan (Pojok Kiri) */}
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[100%]">
                              <span className="inline-block w-2 h-2 rounded-none bg-primary/40 shrink-0"></span>
                              <span className="truncate">{p.keterangan || "-"}</span>
                            </div>
                          </div>

                          {/* Detail Titipan (di dalam box) */}
                          <div className="flex items-center justify-between p-2 mt-1 bg-muted/50 border rounded-none text-xs text-muted-foreground">
                            <div className="flex flex-col">
                              <span className="mb-0.5 text-[10px] font-medium capitalize">Saldo Saat Ini</span>
                              <span className="font-semibold text-orange-600">
                                Rp {formatRibuan(String(p.saldo !== undefined ? p.saldo : (p.status === 'selesai' ? '0' : p.jumlah)))}
                              </span>
                            </div>
                            <div>
                              {p.status === "selesai" ? (
                                <span className="inline-flex items-center rounded-none bg-green-600 px-2 py-0.5 text-[10px] font-medium text-white">Selesai</span>
                              ) : (
                                <span className="inline-flex items-center rounded-none bg-orange-600 px-2 py-0.5 text-[10px] font-medium text-white">Aktif</span>
                              )}
                            </div>
                          </div>

                          {/* Tanggal & Jatuh Tempo */}
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                            <div>Tanggal: {formatTanggalOutput(p.tanggal)}</div>

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
                        <TableHead className="border-r whitespace-nowrap">Penitip</TableHead>
                        <TableHead className="border-r whitespace-nowrap">Keterangan</TableHead>
                        <TableHead className="border-r text-right whitespace-nowrap">Saldo Saat Ini</TableHead>
                        <TableHead className="border-r text-center whitespace-nowrap">Status</TableHead>
                        <TableHead className="w-[60px] text-center whitespace-nowrap">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {titipDanaData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                            Belum ada pencatatan titipDanaData.
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentTitipDana.map((p, index) => {
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium text-center border-r">{index + 1}</TableCell>
                              <TableCell className="border-r">{formatTanggalOutput(p.tanggal)}</TableCell>
                              <TableCell className="border-r font-semibold max-w-[150px] truncate" title={p.nama}>{p.nama}</TableCell>
                              <TableCell className="border-r max-w-[200px] truncate" title={p.keterangan}>{p.keterangan}</TableCell>
                              <TableCell className="border-r text-right font-semibold text-orange-600 whitespace-nowrap">
                                Rp {formatRibuan(String(p.saldo !== undefined ? p.saldo : (p.status === 'selesai' ? '0' : p.jumlah)))}
                              </TableCell>

                              <TableCell className="border-r text-center">
                                {p.status === "selesai" ? (
                                  <span className="inline-flex items-center rounded-none bg-green-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                    Selesai
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-none bg-orange-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                    Aktif
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
                                    {p.status !== "selesai" && (
                                      <>
                                        <DropdownMenuItem className="rounded-none cursor-pointer font-semibold text-cyan-600 focus:bg-blue-50 focus:text-cyan-700" onClick={() => setMutasiId(p)}>
                                          Tarik Dana
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-none cursor-pointer font-semibold text-orange-600 focus:bg-orange-50 focus:text-orange-700" onClick={() => {
                                          setTambahTitipanId(p)
                                          setTanggalTambahTitipan(format(new Date(), "yyyy-MM-dd"))
                                        }}>
                                          Tambah Titipan
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-none cursor-pointer text-primary font-semibold" onClick={() => setSelesaiId(p)}>
                                          Tandai Selesai
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => fetchRiwayat(p)}>Lihat Riwayat</DropdownMenuItem>
                                    {p.status !== 'selesai' && (
                                      <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEdit(p)}>Edit</DropdownMenuItem>
                                    )}
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
            </>
          )}

          {viewMode === 'detail' && riwayatId && (
            <div className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="relative rounded-none border bg-linear-to-t from-primary/5 to-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Nama Penitip</p>
                    <p className="text-xl font-bold text-foreground truncate">{riwayatId.nama}</p>
                  </CardContent>
                </Card>
                <Card className="relative rounded-none border bg-linear-to-t from-primary/5 to-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Titipan Awal</p>
                    <p className="text-xl font-bold text-violet-600">
                      Rp {formatRibuan(String(riwayatData.reduce((acc, m) => m.jenis === 'titip' ? acc + m.jumlah : acc, 0)))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="relative rounded-none border bg-linear-to-t from-primary/5 to-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Saat Ini</p>
                    <p className="text-xl font-bold text-primary">
                      Rp {formatRibuan(String(riwayatId.saldo !== undefined ? riwayatId.saldo : (riwayatId.status === 'selesai' ? '0' : riwayatId.jumlah)))}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between items-center mb-4 mt-2">
                <h1 className="text-1xl font-bold tracking-tight">Detail Mutasi Titip Dana</h1>
                <Button variant="outline" className="rounded-none" onClick={() => { setViewMode('list'); setRiwayatId(null); }}>
                  <ArrowLeft className="mr-2 h-4 w-4" weight="bold" /> Kembali
                </Button>
              </div>

              <div className="bg-card border rounded-none shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                  <h3 className="font-semibold">Buku Besar / Riwayat Mutasi</h3>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setRiwayatSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    title={riwayatSortOrder === 'asc' ? 'Urutkan Terbaru' : 'Urutkan Terlama'}
                  >
                    {riwayatSortOrder === 'asc' ? <SortAscending weight="bold" /> : <SortDescending weight="bold" />}
                  </Button>
                </div>
                {isLoadingRiwayat ? (
                  <div className="text-center py-12 text-muted-foreground">Memuat data mutasi...</div>
                ) : (
                  <>
                    {/* === MOBILE: Card View === */}
                    <div className="lg:hidden flex flex-col gap-3 p-3 bg-muted/10">
                      {(riwayatSortOrder === 'desc' ? riwayatData : [...riwayatData].reverse()).map((m, idx) => {
                        const nomorUrut = riwayatSortOrder === 'desc' ? riwayatData.length - idx : idx + 1;
                        return (
                          <div key={m.id} className="border bg-card shadow-sm p-4 flex flex-col gap-3 rounded-none">
                            <div className="flex justify-between items-center border-b pb-2">
                              <span className="text-xs font-medium text-muted-foreground">{formatTanggalOutput(m.tanggal)}</span>
                              <span className="text-xs font-bold text-muted-foreground">#{nomorUrut}</span>
                            </div>
                            <div className="font-semibold text-sm">{m.keterangan || "-"}</div>

                            <div className="flex justify-between items-center mt-1">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                  {m.jenis === 'titip' ? 'Masuk' : 'Keluar'}
                                </span>
                                <span className={`font-bold ${m.jenis === 'titip' ? 'text-primary' : 'text-red-600'}`}>
                                  Rp {formatRibuan(String(m.jumlah))}
                                </span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Saldo Akhir</span>
                                <span className="font-bold text-foreground">Rp {formatRibuan(String(m.saldo))}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* === DESKTOP: Table View === */}
                    <div className="hidden lg:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[50px] text-center border-r whitespace-nowrap">No</TableHead>
                            <TableHead className="border-r whitespace-nowrap min-w-[120px]">Tanggal</TableHead>
                            <TableHead className="border-r whitespace-nowrap min-w-[200px]">Keterangan</TableHead>
                            <TableHead className="border-r text-right whitespace-nowrap">Uang Masuk</TableHead>
                            <TableHead className="border-r text-right whitespace-nowrap">Uang Keluar</TableHead>
                            <TableHead className="text-right whitespace-nowrap font-bold">Saldo Tersedia</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(riwayatSortOrder === 'desc' ? riwayatData : [...riwayatData].reverse()).map((m, idx) => {
                            // Untuk nomor urut agar konsisten
                            const nomorUrut = riwayatSortOrder === 'desc' ? riwayatData.length - idx : idx + 1;
                            return (
                              <TableRow key={m.id} className="hover:bg-muted/20">
                                <TableCell className="text-center border-r">{nomorUrut}</TableCell>
                                <TableCell className="border-r whitespace-nowrap">{formatTanggalOutput(m.tanggal)}</TableCell>
                                <TableCell className="border-r max-w-[200px] truncate" title={m.keterangan}>{m.keterangan}</TableCell>
                                <TableCell className="border-r text-right text-primary whitespace-nowrap">
                                  {m.jenis === 'titip' ? `Rp ${formatRibuan(String(m.jumlah))}` : '-'}
                                </TableCell>
                                <TableCell className="border-r text-right text-red-600 whitespace-nowrap">
                                  {m.jenis === 'ambil' ? `Rp ${formatRibuan(String(m.jumlah))}` : '-'}
                                </TableCell>
                                <TableCell className="text-right font-bold whitespace-nowrap">
                                  Rp {formatRibuan(String(m.saldo))}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </SidebarInset>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Titip Dana?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data titipDanaData <strong>{deletingId?.nama}</strong> sebesar <strong>Rp {(Number(deletingId?.jumlah) || 0).toLocaleString('id-ID')}</strong>? Tindakan ini tidak dapat dibatalkan.
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

      <AlertDialog open={!!tambahTitipanId} onOpenChange={(open) => !open && setTambahTitipanId(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Tambah Titipan</AlertDialogTitle>
            <AlertDialogDescription>
              Catat tambahan titip baru untuk <strong>{tambahTitipanId?.nama}</strong>.
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
                      className={`w-full rounded-none justify-start text-left font-normal ${!tanggalTambahTitipan && "text-muted-foreground"}`}
                    >
                      {tanggalTambahTitipan ? formatTanggalOutput(tanggalTambahTitipan) : <span>Pilih tanggal</span>}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0 rounded-none border" align="start">
                  <Calendar
                    mode="single"
                    selected={tanggalTambahTitipan ? new Date(tanggalTambahTitipan) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setTanggalTambahTitipan(format(date, "yyyy-MM-dd"))
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
                value={keteranganTambahTitipan}
                onChange={(e) => setKeteranganTambahTitipan(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Jumlah Titipan Tambahan (Rp)</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                className="rounded-none border-orange-200 focus-visible:ring-orange-500"
                value={jumlahTambahTitipan}
                onChange={(e) => setJumlahTambahTitipan(formatRibuan(e.target.value))}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-orange-600 text-white hover:bg-orange-700"
              onClick={confirmTambahTitipan}
              disabled={!jumlahTambahTitipan || jumlahTambahTitipan === "0"}
            >
              Simpan Tambahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!selesaiId} onOpenChange={(open) => !open && setSelesaiId(null)}>
        <AlertDialogContent className="rounded-none border-green-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-700">Tandai Titipan Selesai?</AlertDialogTitle>
            <AlertDialogDescription>
              Tandai sisa titipDanaData atas nama <strong>{selesaiId?.nama}</strong> senilai <strong>Rp {(Number(selesaiId?.saldo !== undefined ? selesaiId?.saldo : selesaiId?.jumlah) || 0).toLocaleString('id-ID')}</strong> sebagai selesai?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-none bg-green-600 text-white hover:bg-green-700" onClick={confirmSelesai}>
              Ya, Tandai Selesai
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!mutasiId} onOpenChange={(open) => {
        if (!open) {
          setMutasiId(null)
          setJumlahMutasi("")
        }
      }}>
        <AlertDialogContent className="rounded-none border-primary">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-bold">Tarik Dana Saat Ini</AlertDialogTitle>
            <AlertDialogDescription>
              Catat mutasi dari <strong>{mutasiId?.nama}</strong>. Sisa dana saat ini: <strong>Rp {(Number(mutasiId?.saldo !== undefined ? mutasiId?.saldo : mutasiId?.jumlah) || 0).toLocaleString('id-ID')}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jumlahMutasi">Jumlah Tarik Dana (Rp)</Label>
              <Input
                id="jumlahMutasi"
                type="text"
                inputMode="numeric"
                className="rounded-none"
                placeholder="0"
                value={jumlahMutasi}
                onChange={(e) => setJumlahMutasi(formatRibuan(e.target.value))}
              />
            </div>

          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-primary text-white hover:bg-emerald-700"
              onClick={confirmMutasi}
              disabled={!jumlahMutasi || jumlahMutasi === "0"}
            >
              Simpan Mutasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>




    </SidebarProvider>
  )
}
