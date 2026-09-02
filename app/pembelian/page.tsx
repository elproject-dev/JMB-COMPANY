"use client"

import React, { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
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
import { DotsThreeVertical, ShoppingCart, Scales, Receipt } from "@phosphor-icons/react"
import { SlidersHorizontal } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"

export default function PembelianPage() {
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [deletingTransaksi, setDeletingTransaksi] = useState<any | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState<string>("")
  const [filterEndDate, setFilterEndDate] = useState<string>("")
  const [tempStartDate, setTempStartDate] = useState<string>("")
  const [tempEndDate, setTempEndDate] = useState<string>("")
  const [isTempStartCalendarOpen, setIsTempStartCalendarOpen] = useState(false)
  const [isTempEndCalendarOpen, setIsTempEndCalendarOpen] = useState(false)

  const [editingTransaksi, setEditingTransaksi] = useState<any | null>(null)
  const [editTanggal, setEditTanggal] = useState("")
  const [editPelanggan, setEditPelanggan] = useState("")
  const [editBk, setEditBk] = useState("")
  const [editBb, setEditBb] = useState("")
  const [editHarga, setEditHarga] = useState("")
  const [editTotal, setEditTotal] = useState("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  async function loadData(start: string = filterStartDate, end: string = filterEndDate) {
    let query = supabase
      .from('transaksi')
      .select('*')
      .eq('jenis', 'pembelian')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (start) {
      query = query.gte('tanggal', start)
    }
    if (end) {
      query = query.lte('tanggal', end)
    }

    const { data } = await query
    if (data) setTransaksi(data)
  }

  React.useEffect(() => {
    loadData(filterStartDate, filterEndDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStartDate, filterEndDate])

  React.useEffect(() => {
    const bbNum = parseFloat(editBb.replace(/,/g, '.'))
    const hargaNum = parseInt(editHarga.replace(/\./g, ''), 10)

    if (!isNaN(bbNum) && !isNaN(hargaNum) && bbNum > 0 && hargaNum > 0) {
      const calculatedTotal = Math.round(bbNum * hargaNum)
      setEditTotal(calculatedTotal.toLocaleString('id-ID'))
    }
  }, [editBb, editHarga])

  const formatRibuan = (val: string) => {
    const num = val.replace(/\D/g, '')
    if (!num) return ''
    return parseInt(num, 10).toLocaleString('id-ID')
  }

  const handleEditClick = (t: any) => {
    setEditingTransaksi(t)
    setEditTanggal(t.tanggal)
    setEditPelanggan(t.pelanggan)
    setEditBk(t.bk || "")
    setEditBb(t.bb !== null ? String(t.bb) : "")
    setEditHarga(t.harga_per_gram ? String(t.harga_per_gram) : "")
    setEditTotal(t.jumlah_total ? String(t.jumlah_total) : "")
  }

  const confirmEdit = async () => {
    if (!editingTransaksi) return
    const oldItem = transaksi.find((t: any) => t.id === editingTransaksi.id)

    const oldJumlah = Number(oldItem?.jumlah_total) || 0
    const newJumlah = parseInt(String(editTotal).replace(/\D/g, ''), 10) || 0
    const selisih = newJumlah - oldJumlah

    if (oldItem && oldItem.dompet_id) {
      if (selisih !== 0) {
        const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', oldItem.dompet_id).single()
        if (freshDompet) {
          // Untuk pembelian, jika nominalnya naik (selisih > 0), berarti pengeluaran nambah -> saldo berkurang
          await supabase.from('dompet').update({ saldo: Number(freshDompet.saldo) - selisih }).eq('id', oldItem.dompet_id)
        }
      }
    }

    await supabase.from('transaksi').update({
      tanggal: editTanggal,
      pelanggan: editPelanggan,
      bk: editBk || null,
      bb: parseFloat(editBb.replace(/,/g, '.')) || null,
      harga_per_gram: parseInt(editHarga.replace(/\./g, ''), 10) || null,
      jumlah_total: newJumlah
    }).eq('id', editingTransaksi.id)

    if (selisih !== 0) {
      const jenisSelisih = selisih > 0 ? "penyesuaian_keluar" : "penyesuaian_masuk"
      await supabase.from('kas').insert({
        tanggal: format(new Date(), 'yyyy-MM-dd'),
        keterangan: `Revisi Pembelian - ${editPelanggan}`,
        jumlah: Math.abs(selisih),
        jenis: jenisSelisih
      })
    }

    await loadData()
    toast.add({
      title: "Berhasil Diedit",
      description: "Data transaksi berhasil diperbarui dan saldo dompet telah disesuaikan.",
    })
    setEditingTransaksi(null)
  }

  const confirmHapus = async () => {
    if (!deletingTransaksi) return

    await supabase.from('transaksi').update({ is_deleted: true }).eq('id', deletingTransaksi.id)

    const delJumlah = Number(deletingTransaksi.jumlah_total) || 0

    if (deletingTransaksi.dompet_id) {
      const { data: freshDompet } = await supabase.from('dompet').select('saldo').eq('id', deletingTransaksi.dompet_id).single()
      if (freshDompet) {
        await supabase.from('dompet').update({ saldo: Number(freshDompet.saldo) + delJumlah }).eq('id', deletingTransaksi.dompet_id)
      }
    }

    await supabase.from('kas').insert({
      tanggal: format(new Date(), 'yyyy-MM-dd'),
      keterangan: `Penghapusan Transaksi Pembelian - ${deletingTransaksi.pelanggan}`,
      jumlah: delJumlah,
      jenis: "penyesuaian_masuk"
    })

    await loadData()

    toast.add({
      title: "Berhasil Dihapus",
      description: `Transaksi dengan pelanggan "${deletingTransaksi.pelanggan}" telah dihapus dan saldo dompet telah dikembalikan.`,
    })
    setDeletingTransaksi(null)
  }

  const formatTanggalOutput = (dateStr: string) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const itemsPerPage = 15
  const totalPages = Math.ceil(transaksi.length / itemsPerPage)
  const currentTransaksi = transaksi.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalPembelian = transaksi.reduce((acc, curr) => acc + (Number(curr.jumlah_total) || 0), 0)
  const totalBK = transaksi.reduce((acc, curr) => acc + (Number(curr.bk) || 0), 0)
  const totalBB = transaksi.reduce((acc, curr) => acc + (Number(curr.bb) || 0), 0)
  const totalTransaksiCount = transaksi.length

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
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 mb-6">
            <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pembelian</p>
                <h3 className="text-2xl font-bold tracking-tight text-primary mt-1">Rp {totalPembelian.toLocaleString('id-ID')}</h3>
              </div>
              <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
                <ShoppingCart weight="duotone" className="w-6 h-6" />
              </div>
            </div>
            <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Berat Kotor (BK)</p>
                <h3 className="text-2xl font-bold tracking-tight text-primary mt-1">{totalBK.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g</h3>
              </div>
              <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
                <Scales weight="duotone" className="w-6 h-6" />
              </div>
            </div>
            <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Berat Bersih (BB)</p>
                <h3 className="text-2xl font-bold tracking-tight text-primary mt-1">{totalBB.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g</h3>
              </div>
              <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
                <Scales weight="duotone" className="w-6 h-6" />
              </div>
            </div>
            <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
                <h3 className="text-2xl font-bold tracking-tight text-primary mt-1">{totalTransaksiCount}</h3>
              </div>
              <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
                <Receipt weight="duotone" className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h1 className="text-1xl font-bold tracking-tight">
              {editingTransaksi ? "Edit Transaksi Pembelian" : "Daftar Transaksi Pembelian"}
            </h1>
            {!editingTransaksi && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-8 h-8 shadow-sm flex items-center justify-center transition-transform active:scale-95"
                onClick={() => {
                  setTempStartDate(filterStartDate)
                  setTempEndDate(filterEndDate)
                  setIsFilterModalOpen(true)
                }}
                title="Filter Tanggal"
              >
                <SlidersHorizontal className="w-4 h-4" strokeWidth={2.5} />
              </Button>
            )}
          </div>

          {editingTransaksi ? (
            <div className="bg-card text-card-foreground shadow-sm border rounded-none p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pelanggan">Pelanggan</Label>
                    <Input
                      id="pelanggan"
                      className="rounded-none"
                      value={editPelanggan}
                      onChange={(e) => setEditPelanggan(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tanggal">Tanggal</Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            id="tanggal"
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal rounded-none ${!editTanggal && "text-muted-foreground"}`}
                          >
                            {editTanggal ? formatTanggalOutput(editTanggal) : <span>Pilih tanggal</span>}
                          </Button>
                        }
                      />
                      <PopoverContent className="w-auto p-0 rounded-none border" align="start">
                        <Calendar
                          mode="single"
                          selected={editTanggal ? new Date(editTanggal) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setEditTanggal(format(date, "yyyy-MM-dd"))
                              setIsCalendarOpen(false)
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
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
                        className="rounded-none"
                        value={editBk}
                        onChange={(e) => setEditBk(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bb">Berat Bersih (BB)</Label>
                      <Input
                        id="bb"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="rounded-none"
                        value={editBb}
                        onChange={(e) => setEditBb(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="harga">Harga / Gram (Rp)</Label>
                      <Input
                        id="harga"
                        inputMode="numeric"
                        placeholder="0"
                        className="rounded-none"
                        value={editHarga}
                        onChange={(e) => setEditHarga(formatRibuan(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total">Total (Rp)</Label>
                      <Input
                        id="total"
                        inputMode="numeric"
                        placeholder="0"
                        className="rounded-none"
                        value={editTotal}
                        onChange={(e) => setEditTotal(formatRibuan(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <Button type="button" variant="outline" className="rounded-none" onClick={() => setEditingTransaksi(null)}>
                    Batal
                  </Button>
                  <Button type="button" className="rounded-none" onClick={confirmEdit}>
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="lg:bg-card lg:text-card-foreground lg:shadow-sm lg:border lg:rounded-none">
              {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}
              <div className="flex flex-col gap-3 lg:hidden">
                {transaksi.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Belum ada transaksi pembelian.
                  </div>
                ) : (
                  currentTransaksi.map((t, index) => (
                    <div
                      key={t.id}
                      className="border bg-card shadow-sm p-3.5 flex flex-col gap-2 transition-all duration-200 hover:shadow-md hover:border-primary/20 active:bg-primary/5 rounded-none"
                    >
                      {/* Header: Nama Pelanggan & Aksi */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm leading-snug truncate flex-1">{t.pelanggan}</div>
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
                              <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEditClick(t)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="rounded-none cursor-pointer text-primary focus:bg-primary focus:text-primary-foreground" onClick={() => setDeletingTransaksi(t)}>Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Info Utama: Tanggal & Total */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-none bg-primary/40"></span>
                          {formatTanggalOutput(t.tanggal)}
                        </div>
                        <div className="font-bold text-primary text-sm whitespace-nowrap">
                          Rp {t.jumlah_total ? formatRibuan(String(t.jumlah_total)) : "-"}
                        </div>
                      </div>

                      {/* Detail Berat & Harga (di dalam box) */}
                      <div className="grid grid-cols-3 gap-2 p-2 mt-1 bg-muted/50 border rounded-none text-xs text-muted-foreground">
                        <div className="flex flex-col">
                          <span className="mb-0.5 text-[10px] font-medium capitalize">Kotor</span>
                          <span className="font-semibold text-foreground">{t.bk || "-"} g</span>
                        </div>
                        <div className="flex flex-col text-center">
                          <span className="mb-0.5 text-[10px] font-medium capitalize">Bersih</span>
                          <span className="font-semibold text-foreground">{t.bb || "-"} g</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="mb-0.5 text-[10px] font-medium capitalize">Harga/g</span>
                          <span className="font-semibold text-foreground">{t.harga_per_gram ? formatRibuan(String(t.harga_per_gram)) : "-"}</span>
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
                      <TableHead className="border-r whitespace-nowrap">Pelanggan</TableHead>
                      <TableHead className="border-r text-right whitespace-nowrap">Berat Kotor (g)</TableHead>
                      <TableHead className="border-r text-right whitespace-nowrap">Berat Bersih (g)</TableHead>
                      <TableHead className="border-r text-right whitespace-nowrap">Harga / Gram</TableHead>
                      <TableHead className="border-r text-right whitespace-nowrap">Total</TableHead>
                      <TableHead className="w-[60px] text-center whitespace-nowrap">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transaksi.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                          Belum ada transaksi pembelian.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentTransaksi.map((t, index) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium text-center border-r">{index + 1}</TableCell>
                          <TableCell className="border-r text-left">{formatTanggalOutput(t.tanggal)}</TableCell>
                          <TableCell className="border-r">{t.pelanggan}</TableCell>
                          <TableCell className="border-r text-right">{t.bk || "-"}</TableCell>
                          <TableCell className="border-r text-right">{t.bb || "-"}</TableCell>
                          <TableCell className="border-r text-right">{t.harga_per_gram ? formatRibuan(String(t.harga_per_gram)) : "-"}</TableCell>
                          <TableCell className="border-r text-right font-semibold">{t.jumlah_total ? formatRibuan(String(t.jumlah_total)) : "-"}</TableCell>
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
                                <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEditClick(t)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-none cursor-pointer text-primary focus:bg-primary focus:text-primary-foreground" onClick={() => setDeletingTransaksi(t)}>Hapus</DropdownMenuItem>
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
          )}
        </div>
      </SidebarInset>

      <AlertDialog open={!!deletingTransaksi} onOpenChange={(open) => !open && setDeletingTransaksi(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi pembelian dari <strong>"{deletingTransaksi?.pelanggan}"</strong>? Tindakan ini tidak dapat dibatalkan.
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

      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="rounded-none sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter Tanggal Pembelian</DialogTitle>
            <DialogDescription>
              Pilih rentang tanggal untuk menyaring transaksi pembelian.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tanggal Mulai</Label>
              <Popover open={isTempStartCalendarOpen} onOpenChange={setIsTempStartCalendarOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal rounded-none ${!tempStartDate && "text-muted-foreground"}`}
                    >
                      {tempStartDate ? formatTanggalOutput(tempStartDate) : <span>Pilih tanggal mulai</span>}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0 rounded-none border" align="start">
                  <Calendar
                    mode="single"
                    selected={tempStartDate ? new Date(tempStartDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setTempStartDate(format(date, "yyyy-MM-dd"))
                        setIsTempStartCalendarOpen(false)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>Tanggal Akhir</Label>
              <Popover open={isTempEndCalendarOpen} onOpenChange={setIsTempEndCalendarOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal rounded-none ${!tempEndDate && "text-muted-foreground"}`}
                    >
                      {tempEndDate ? formatTanggalOutput(tempEndDate) : <span>Pilih tanggal akhir</span>}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0 rounded-none border" align="start">
                  <Calendar
                    mode="single"
                    selected={tempEndDate ? new Date(tempEndDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setTempEndDate(format(date, "yyyy-MM-dd"))
                        setIsTempEndCalendarOpen(false)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-none"
              onClick={() => {
                setTempStartDate("")
                setTempEndDate("")
                setFilterStartDate("")
                setFilterEndDate("")
                setIsFilterModalOpen(false)
              }}
            >
              Reset Filter
            </Button>
            <Button
              className="rounded-none bg-primary text-primary-foreground"
              onClick={() => {
                setFilterStartDate(tempStartDate)
                setFilterEndDate(tempEndDate)
                setIsFilterModalOpen(false)
              }}
            >
              Terapkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
