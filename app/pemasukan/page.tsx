"use client"

import React, { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function PemasukanPage() {
  const [kas, setKas] = useState<any[]>([])
  const [dompetList, setDompetList] = useState<any[]>([])
  const [selectedDompet, setSelectedDompet] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [tanggal, setTanggal] = useState<string>("")
  const [keterangan, setKeterangan] = useState<any>(null)
  const [jumlah, setJumlah] = useState("")
  const [deletingKas, setDeletingKas] = useState<any | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [keteranganOptions, setKeteranganOptions] = useState<string[]>([])
  const [searchKeterangan, setSearchKeterangan] = useState("")

  async function loadData() {
    const { data: kasData } = await supabase
      .from('kas')
      .select('*')
      .eq('jenis', 'pemasukan')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    if (kasData) setKas(kasData)

    const { data: dompetData } = await supabase.from('dompet').select('*')
    if (dompetData) setDompetList(dompetData)

    const { data: katData } = await supabase.from('kategori_kas').select('nama').eq('jenis', 'pemasukan')
    if (katData && katData.length > 0) {
      setKeteranganOptions(katData.map((k) => k.nama))
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  const handleSimpanKeteranganBaru = async () => {
    if (!searchKeterangan) return
    if (!keteranganOptions.includes(searchKeterangan)) {
      await supabase.from('kategori_kas').insert({ nama: searchKeterangan, jenis: 'pemasukan' })
      const updated = [...keteranganOptions, searchKeterangan]
      setKeteranganOptions(updated)
    }
    setKeterangan(searchKeterangan)
    setSearchKeterangan("")
  }

  const formatRibuan = (val: string) => {
    const num = val.replace(/\D/g, '')
    if (!num) return ''
    return parseInt(num, 10).toLocaleString('id-ID')
  }

  const handleSimpan = async () => {
    if (!tanggal || !keterangan || !jumlah || !selectedDompet) {
      toast.add({
        title: "Gagal",
        description: "Harap lengkapi semua data, termasuk sumber dana.",
      })
      return
    }

    const parsedJumlah = parseInt(String(jumlah).replace(/\D/g, ''), 10) || 0
    const dompetObj = dompetList.find(d => d.nama === selectedDompet)
    if (!dompetObj) return

    if (editingId) {
      const oldItem = kas.find((item: any) => item.id === editingId)
      const oldJumlah = Number(oldItem?.jumlah) || 0

      if (oldItem && oldItem.dompet_id) {
        // Kurangi saldo dari dompet lama
        const oldDompet = dompetList.find(d => d.id === oldItem.dompet_id)
        if (oldDompet) {
          await supabase.from('dompet').update({ saldo: Number(oldDompet.saldo) - oldJumlah }).eq('id', oldDompet.id)
        }
      }

      // Tambah saldo ke dompet baru
      const targetDompet = oldItem?.dompet_id === dompetObj.id
        ? dompetList.find(d => d.id === dompetObj.id)
        : dompetList.find(d => d.id === dompetObj.id) // Get fresh balance if they are different

      // We actually should just recalculate based on the fresh data if possible. Since we're doing it simply:
      const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', dompetObj.id).single()
      if (freshDompet) {
        await supabase.from('dompet').update({ saldo: Number(freshDompet.saldo) + parsedJumlah }).eq('id', dompetObj.id)
      }

      await supabase.from('kas').update({
        tanggal,
        keterangan,
        jumlah: parsedJumlah,
        dompet_id: dompetObj.id,
        dompet_nama: selectedDompet
      }).eq('id', editingId)

    } else {
      // Tambah saldo ke dompet
      const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', dompetObj.id).single()
      if (freshDompet) {
        await supabase.from('dompet').update({ saldo: Number(freshDompet.saldo) + parsedJumlah }).eq('id', dompetObj.id)
      }

      await supabase.from('kas').insert({
        tanggal,
        keterangan,
        jumlah: parsedJumlah,
        jenis: "pemasukan",
        dompet_id: dompetObj.id,
        dompet_nama: selectedDompet
      })
    }

    await loadData()

    setTanggal("")
    setKeterangan("")
    setJumlah("")
    setSelectedDompet(null)
    setIsAdding(false)
    setEditingId(null)

    toast.add({
      title: "Berhasil",
      description: editingId ? "Data pemasukan telah diperbarui." : "Data pemasukan telah disimpan.",
    })
  }

  const handleEdit = (k: any) => {
    setEditingId(k.id)
    setTanggal(k.tanggal)
    setKeterangan(k.keterangan)
    setSearchKeterangan(k.keterangan)
    setJumlah(formatRibuan(String(k.jumlah)))
    setSelectedDompet(k.dompet_nama)
    setIsAdding(true)
  }

  const confirmHapus = async () => {
    if (!deletingKas) return

    const delJumlah = Number(deletingKas.jumlah) || 0

    if (deletingKas.dompet_id) {
      const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', deletingKas.dompet_id).single()
      if (freshDompet) {
        await supabase.from('dompet').update({ saldo: Number(freshDompet.saldo) - delJumlah }).eq('id', deletingKas.dompet_id)
      }
    }

    await supabase.from('kas').update({ is_deleted: true }).eq('id', deletingKas.id)
    await loadData()

    toast.add({
      title: "Berhasil Dihapus",
      description: `Data pemasukan telah dihapus.`,
    })
    setDeletingKas(null)
  }

  const handleDeleteAll = async () => {
    // Revert dompet balances
    for (const p of kas) {
      if (p.dompet_id) {
        const delJumlah = Number(p.jumlah) || 0
        const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', p.dompet_id).single()
        if (freshDompet) {
          await supabase.from('dompet').update({ saldo: Number(freshDompet.saldo) - delJumlah }).eq('id', p.dompet_id)
        }
      }
    }

    // Soft delete all pemasukan
    await supabase.from('kas').update({ is_deleted: true }).eq('jenis', 'pemasukan')

    await loadData()
    setIsDeletingAll(false)
    toast.add({
      title: "Berhasil",
      description: "Semua riwayat pemasukan telah dihapus.",
    })
  }

  const formatTanggalOutput = (dateStr: string) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const isSystemGenerated = (ket: string) => {
    if (!ket) return false;
    const prefixes = [
      "Penyesuaian Saldo:",
      "Pembuatan Dompet Baru:",
      "Penghapusan Akun:",
      "Pencatatan Piutang Baru:",
      "Penghapusan Piutang (Pembatalan):",
      "Ubah Nominal Piutang:",
      "Pelunasan piutang:",
      "Cicilan piutang:"
    ];
    return prefixes.some(prefix => ket.startsWith(prefix));
  };

  const itemsPerPage = 15
  const totalPages = Math.ceil(kas.length / itemsPerPage)
  const currentKas = kas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
            <div className="flex items-center gap-4">
              <h1 className="text-1xl font-bold tracking-tight">Daftar Pemasukan</h1>
            </div>
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
                    setKeterangan("")
                    setJumlah("")
                    setSelectedDompet(null)
                  } else {
                    setIsAdding(true)
                  }
                }}
              >
                {isAdding ? "Batal" : "Tambah Pemasukan"}
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
                    setKeterangan("")
                    setJumlah("")
                    setSelectedDompet(null)
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
              <h2 className="text-sm font-semibold mb-4">{editingId ? "Edit Pemasukan" : "Tambah Pemasukan Baru"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal</Label>
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
                  <Label htmlFor="keterangan">Keterangan / Sumber</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Combobox
                        items={keteranganOptions}
                        value={keterangan}
                        onValueChange={(val: any) => setKeterangan(val)}
                        inputValue={searchKeterangan}
                        onInputValueChange={(val: any) => setSearchKeterangan(val || "")}
                      >
                        <ComboboxInput placeholder="Pilih atau ketik baru..." className="rounded-none w-full" />
                        <ComboboxContent className="rounded-none">
                          <ComboboxEmpty>
                            <div className="p-2 text-sm text-center">Keterangan tidak ditemukan.</div>
                          </ComboboxEmpty>
                          <ComboboxList className="max-h-32">
                            {(item: string) => (
                              <ComboboxItem key={item} value={item} className="rounded-none">
                                {item}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                          {searchKeterangan && !keteranganOptions.includes(searchKeterangan) && (
                            <div className="p-1 border-t mt-1">
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start rounded-none text-primary"
                                onClick={handleSimpanKeteranganBaru}
                              >
                                + Tambah "{searchKeterangan}"
                              </Button>
                            </div>
                          )}
                        </ComboboxContent>
                      </Combobox>
                    </div>
                  </div>
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
                  <Label>Sumber Dana (Masuk Ke)</Label>
                  <Select value={selectedDompet || ""} onValueChange={setSelectedDompet}>
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue placeholder="Pilih dompet/rekening" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {dompetList.map(d => (
                        <SelectItem key={d.id} value={d.nama} className="rounded-none">
                          {d.nama} (Rp {d.saldo.toLocaleString('id-ID')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="button" className="rounded-none" onClick={handleSimpan}>
                  Simpan Pemasukan
                </Button>
              </div>
            </div>
          )}

          <div className="lg:bg-card lg:text-card-foreground lg:shadow-sm lg:border lg:rounded-none">
            {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}
            <div className="flex flex-col gap-3 lg:hidden">
              {kas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Belum ada pencatatan pemasukan.
                </div>
              ) : (
                currentKas.map((k, index) => (
                  <div
                    key={k.id}
                    className="border bg-card shadow-sm p-3.5 flex flex-col gap-2 transition-all duration-200 hover:shadow-md hover:border-primary/20 active:bg-primary/5 rounded-none"
                  >
                    {/* Header: Keterangan & Aksi */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm leading-snug truncate flex-1">{k.keterangan}</div>
                      <div className="-mr-2 -mt-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none" disabled={isSystemGenerated(k.keterangan)}>
                                <DotsThreeVertical weight="bold" />
                                <span className="sr-only">Buka menu</span>
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="rounded-none">
                            <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEdit(k)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="rounded-none cursor-pointer text-primary focus:bg-primary focus:text-primary-foreground" onClick={() => setDeletingKas(k)}>Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Info Utama: Tanggal & Jumlah */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-none bg-primary/40"></span>
                        {formatTanggalOutput(k.tanggal)}
                      </div>
                      <div className="font-bold text-primary text-sm whitespace-nowrap">
                        +Rp {formatRibuan(String(k.jumlah))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* === DESKTOP: Table View (hidden below lg) === */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center border-r whitespace-nowrap">No</TableHead>
                    <TableHead className="border-r whitespace-nowrap text-left">Tanggal</TableHead>
                    <TableHead className="border-r whitespace-nowrap">Keterangan / Sumber</TableHead>
                    <TableHead className="border-r text-right whitespace-nowrap">Jumlah</TableHead>
                    <TableHead className="w-[60px] text-center whitespace-nowrap">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Belum ada pencatatan pemasukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentKas.map((k, index) => (
                      <TableRow key={k.id}>
                        <TableCell className="font-medium text-center border-r">{index + 1}</TableCell>
                        <TableCell className="border-r text-left">{formatTanggalOutput(k.tanggal)}</TableCell>
                        <TableCell className="border-r">{k.keterangan}</TableCell>
                        <TableCell className="border-r text-right font-semibold text-primary">+{formatRibuan(String(k.jumlah))}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" disabled={isSystemGenerated(k.keterangan)}>
                                  <DotsThreeVertical weight="bold" />
                                  <span className="sr-only">Buka menu</span>
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="rounded-none">
                              <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEdit(k)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="rounded-none cursor-pointer text-primary focus:bg-primary focus:text-primary-foreground" onClick={() => setDeletingKas(k)}>Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
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

      <AlertDialog open={!!deletingKas} onOpenChange={(open) => !open && setDeletingKas(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Pemasukan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data pemasukan sebesar <strong>Rp {formatRibuan(String(deletingKas?.jumlah || ""))}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90" onClick={confirmHapus}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeletingAll} onOpenChange={setIsDeletingAll}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Pemasukan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>seluruh data pemasukan</strong>? Saldo dompet akan disesuaikan kembali. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleDeleteAll}>
              Ya, Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </SidebarProvider>
  )
}
