"use client"

import React, { useState, useEffect, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
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
import { DotsThreeVertical, WalletIcon, CoinVertical, CreditCard, DeviceMobile, Plus, X } from "@phosphor-icons/react"
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

import { supabase } from "@/lib/supabase"

export default function DompetkuPage() {
  const [dompet, setDompet] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [namaAkun, setNamaAkun] = useState("")
  const [kategori, setKategori] = useState("tunai")
  const [saldo, setSaldo] = useState("")
  const [keterangan, setKeterangan] = useState("")

  const [deletingId, setDeletingId] = useState<any | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [transferSource, setTransferSource] = useState<any | null>(null)
  const [transferTargetId, setTransferTargetId] = useState<string>("")
  const [transferAmount, setTransferAmount] = useState("")

  async function loadDompet() {
    const { data, error } = await supabase.from('dompet').select('*').order('created_at', { ascending: false })
    if (data && !error) {
      setDompet(data)
    }
  }

  useEffect(() => {
    loadDompet()
  }, [])

  const formatRibuan = (val: string) => {
    const num = val.replace(/\D/g, '')
    if (!num) return ''
    return parseInt(num, 10).toLocaleString('id-ID')
  }

  const formatUang = (num: number) => {
    return num.toLocaleString('id-ID')
  }

  const handleSimpan = async () => {
    if (!namaAkun || !saldo) {
      toast.add({
        title: "Gagal",
        description: "Harap isi nama dompet/rekening dan saldo.",
      })
      return
    }

    const parsedSaldo = parseInt(saldo.replace(/\D/g, ''), 10) || 0

    if (editingId) {
      const oldItem = dompet.find((item: any) => item.id === editingId)
      const oldSaldo = oldItem ? Number(oldItem.saldo) : 0
      const selisih = parsedSaldo - oldSaldo

      if (selisih !== 0) {
        await supabase.from('kas').insert({
          tanggal: new Date().toISOString().split("T")[0],
          keterangan: `Penyesuaian Saldo: ${namaAkun}`,
          jumlah: Math.abs(selisih),
          jenis: selisih > 0 ? "dompet_masuk" : "dompet_keluar",
          dompet_id: editingId,
          dompet_nama: namaAkun
        })
      }

      await supabase.from('dompet').update({
        nama: namaAkun,
        kategori,
        saldo: parsedSaldo,
        keterangan
      }).eq('id', editingId)

    } else {
      const { data: newDompet, error } = await supabase.from('dompet').insert({
        nama: namaAkun,
        kategori,
        saldo: parsedSaldo,
        keterangan
      }).select().single()

      if (parsedSaldo > 0 && newDompet) {
        await supabase.from('kas').insert({
          tanggal: new Date().toISOString().split("T")[0],
          keterangan: `Pembuatan Dompet Baru: ${namaAkun}`,
          jumlah: parsedSaldo,
          jenis: "dompet_masuk",
          dompet_id: newDompet.id,
          dompet_nama: newDompet.nama
        })
      }
    }

    await loadDompet()

    setNamaAkun("")
    setKategori("tunai")
    setSaldo("")
    setKeterangan("")
    setIsAdding(false)
    setEditingId(null)

    toast.add({
      title: "Berhasil",
      description: editingId ? "Data dompet/rekening telah diperbarui." : "Data dompet/rekening telah disimpan.",
    })
  }

  const handleEdit = (d: any) => {
    setEditingId(d.id)
    setNamaAkun(d.nama)
    setKategori(d.kategori || "tunai")
    setSaldo(formatUang(Number(d.saldo)))
    setKeterangan(d.keterangan || "")
    setIsAdding(true)
  }

  const confirmHapus = async () => {
    if (!deletingId) return

    if (Number(deletingId.saldo) > 0) {
      await supabase.from('kas').insert({
        tanggal: new Date().toISOString().split("T")[0],
        keterangan: `Penghapusan Akun: ${deletingId.nama} (Saldo Hangus)`,
        jumlah: Number(deletingId.saldo),
        jenis: "dompet_keluar"
      })
    }

    await supabase.from('dompet').delete().eq('id', deletingId.id)
    await loadDompet()

    toast.add({
      title: "Berhasil Dihapus",
      description: `Akun ${deletingId.nama} telah dihapus.`,
    })
    setDeletingId(null)
  }

  const handleTransfer = async () => {
    if (!transferSource || !transferTargetId || !transferAmount) return

    const amountNum = parseInt(transferAmount.replace(/\D/g, ''), 10) || 0
    if (amountNum <= 0) return

    if (Number(transferSource.saldo) < amountNum) {
      toast.add({
        title: "Saldo Tidak Cukup",
        description: `Saldo di ${transferSource.nama} tidak cukup untuk ditransfer.`,
      })
      return
    }

    const targetDompet = dompet.find(d => d.id === transferTargetId)
    if (!targetDompet) return

    // Update sumber
    await supabase.from('dompet').update({ saldo: Number(transferSource.saldo) - amountNum }).eq('id', transferSource.id)
    // Update target
    await supabase.from('dompet').update({ saldo: Number(targetDompet.saldo) + amountNum }).eq('id', targetDompet.id)

    // Simpan riwayat transfer
    await supabase.from('transfer_dana').insert({
      tanggal: new Date().toISOString().split("T")[0],
      keterangan: `Transfer dari ${transferSource.nama} ke ${targetDompet.nama}`,
      nominal: amountNum,
      dari_dompet_id: transferSource.id,
      dari_dompet_nama: transferSource.nama,
      ke_dompet_id: targetDompet.id,
      ke_dompet_nama: targetDompet.nama
    })

    await loadDompet()

    toast.add({
      title: "Transfer Berhasil",
      description: `Mentransfer Rp ${formatUang(amountNum)} dari ${transferSource.nama} ke ${targetDompet.nama}.`,
    })

    setTransferSource(null)
    setTransferTargetId("")
    setTransferAmount("")
  }

  // Menghitung ringkasan saldo
  const summary = useMemo(() => {
    let total = 0
    let tunai = 0
    let bank = 0
    let ewallet = 0

    dompet.forEach(d => {
      const s = Number(d.saldo) || 0
      total += s
      if (d.kategori === 'tunai') tunai += s
      else if (d.kategori === 'bank') bank += s
      else if (d.kategori === 'ewallet') ewallet += s
    })

    return { total, tunai, bank, ewallet }
  }, [dompet])

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

  const animTotal = useCountUp(summary.total)
  const animTunai = useCountUp(summary.tunai)
  const animBank = useCountUp(summary.bank)
  const animEwallet = useCountUp(summary.ewallet)

  const itemsPerPage = 15
  const totalPages = Math.ceil(dompet.length / itemsPerPage)
  const currentDompet = dompet.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
                <p className="text-sm font-medium text-muted-foreground">Total Saldo</p>
                <h3 className="text-2xl font-bold tracking-tight text-primary mt-1">Rp {formatUang(animTotal)}</h3>
              </div>
              <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
                <WalletIcon weight="duotone" className="w-6 h-6" />
              </div>
            </div>

            <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cash Tunai</p>
                <h3 className="text-2xl font-bold tracking-tight text-primary mt-1">Rp {formatUang(animTunai)}</h3>
              </div>
              <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
                <CoinVertical weight="duotone" className="w-6 h-6" />
              </div>
            </div>

            <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rekening Bank</p>
                <h3 className="text-2xl font-bold tracking-tight text-primary mt-1">Rp {formatUang(animBank)}</h3>
              </div>
              <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
                <CreditCard weight="duotone" className="w-6 h-6" />
              </div>
            </div>

            <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
              <div>
                <p className="text-sm font-medium text-muted-foreground">E-Wallet</p>
                <h3 className="text-2xl font-bold tracking-tight text-primary mt-1">Rp {formatUang(animEwallet)}</h3>
              </div>
              <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
                <DeviceMobile weight="duotone" className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4 mt-2">
            <h2 className="text-1xl font-bold tracking-tight">Daftar Dompet / Rekening</h2>
            <div className="flex gap-2 items-center">
              {/* Desktop Button */}
              <Button
                type="button"
                className="hidden md:flex rounded-none"
                onClick={() => {
                  if (isAdding) {
                    setIsAdding(false)
                    setEditingId(null)
                    setNamaAkun("")
                    setKategori("tunai")
                    setSaldo("")
                    setKeterangan("")
                  } else {
                    setIsAdding(true)
                  }
                }}
              >
                {isAdding ? "Batal" : "Tambah Akun Baru"}
              </Button>

              {/* Mobile Button (Bulat Icon) */}
              <Button
                type="button"
                className="md:hidden rounded-full w-8 h-8 p-0 shadow-md flex items-center justify-center transition-transform active:scale-95"
                onClick={() => {
                  if (isAdding) {
                    setIsAdding(false)
                    setEditingId(null)
                    setNamaAkun("")
                    setKategori("tunai")
                    setSaldo("")
                    setKeterangan("")
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
              <h2 className="text-sm font-semibold mb-4">{editingId ? "Edit Akun/Rekening" : "Tambah Akun/Rekening Baru"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="namaAkun">Nama Dompet/Rekening</Label>
                  <Input
                    id="namaAkun"
                    placeholder="Contoh: Laci Kasir, BCA, Gopay"
                    className="rounded-none"
                    value={namaAkun}
                    onChange={(e) => setNamaAkun(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori</Label>
                  <Select value={kategori} onValueChange={(val: any) => setKategori(val)}>
                    <SelectTrigger id="kategori" className="w-full rounded-none">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="tunai">Uang Tunai</SelectItem>
                      <SelectItem value="bank">Rekening Bank</SelectItem>
                      <SelectItem value="ewallet">E-Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saldo">Saldo Saat Ini (Rp)</Label>
                  <Input
                    id="saldo"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className="rounded-none"
                    value={saldo}
                    onChange={(e) => setSaldo(formatRibuan(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keterangan">Keterangan / No. Rek</Label>
                  <Input
                    id="keterangan"
                    placeholder="Informasi tambahan opsional"
                    className="rounded-none"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
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
              {dompet.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Belum ada akun dompet/rekening. Silakan tambah baru.
                </div>
              ) : (
                currentDompet.map((d, index) => (
                  <div
                    key={d.id}
                    className="border bg-card shadow-sm p-3.5 flex flex-col gap-2 transition-all duration-200 hover:shadow-md hover:border-primary/20 active:bg-primary/5 rounded-none"
                  >
                    {/* Header: Nama Akun & Aksi */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="font-semibold text-sm leading-snug truncate" title={d.nama}>{d.nama}</div>
                        <span className={`inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-medium text-white capitalize shrink-0 ${d.kategori === 'tunai' ? 'bg-green-600' :
                          d.kategori === 'bank' ? 'bg-orange-600' :
                            d.kategori === 'ewallet' ? 'bg-purple-600' :
                              'bg-slate-600'
                          }`}>
                          {d.kategori}
                        </span>
                      </div>
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
                            <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEdit(d)}>Ubah Saldo/Info</DropdownMenuItem>
                            <DropdownMenuItem className="rounded-none cursor-pointer text-blue-600 focus:bg-blue-50 focus:text-blue-700 font-medium" onClick={() => setTransferSource(d)}>Transfer Dana</DropdownMenuItem>
                            <DropdownMenuItem className="rounded-none cursor-pointer text-red-600 focus:bg-red-600 focus:text-white" onClick={() => setDeletingId(d)}>Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Info Utama: Keterangan & Saldo (Pojok Kanan) */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-muted-foreground truncate max-w-[60%]">
                        {d.keterangan || "-"}
                      </div>
                      <div className="font-bold text-primary text-sm whitespace-nowrap">
                        Rp {formatUang(Number(d.saldo))}
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
                    <TableHead className="border-r whitespace-nowrap">Nama</TableHead>
                    <TableHead className="border-r whitespace-nowrap text-center">Kategori</TableHead>
                    <TableHead className="border-r whitespace-nowrap text-right">Saldo</TableHead>
                    <TableHead className="border-r whitespace-nowrap">Keterangan</TableHead>
                    <TableHead className="w-[60px] text-center whitespace-nowrap">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dompet.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Belum ada akun dompet/rekening. Silakan tambah baru.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentDompet.map((d, index) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium text-center border-r">{index + 1}</TableCell>
                        <TableCell className="border-r font-semibold">{d.nama}</TableCell>
                        <TableCell className="border-r text-center">
                          <span className={`inline-flex items-center rounded-none px-2.5 py-0.5 text-xs font-medium text-white capitalize ${d.kategori === 'tunai' ? 'bg-green-600' :
                            d.kategori === 'bank' ? 'bg-orange-600' :
                              d.kategori === 'ewallet' ? 'bg-purple-600' :
                                'bg-slate-600'
                            }`}>
                            {d.kategori}
                          </span>
                        </TableCell>
                        <TableCell className="border-r text-right font-semibold text-primary">Rp {formatUang(Number(d.saldo))}</TableCell>
                        <TableCell className="border-r text-muted-foreground">{d.keterangan || "-"}</TableCell>
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
                              <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEdit(d)}>Ubah Saldo/Info</DropdownMenuItem>
                              <DropdownMenuItem className="rounded-none cursor-pointer text-blue-600 focus:bg-blue-50 focus:text-blue-700 font-medium" onClick={() => setTransferSource(d)}>Transfer Dana</DropdownMenuItem>
                              <DropdownMenuItem className="rounded-none cursor-pointer text-red-600 focus:bg-red-600 focus:text-white" onClick={() => setDeletingId(d)}>Hapus</DropdownMenuItem>
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

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Dompet/Rekening?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akun <strong>{deletingId?.nama}</strong>? Saldo sebesar <strong>Rp {deletingId ? formatUang(Number(deletingId.saldo)) : 0}</strong> tidak akan terhitung lagi di Total Kekayaan. Tindakan ini tidak dapat dibatalkan.
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

      <AlertDialog open={!!transferSource} onOpenChange={(open) => {
        if (!open) {
          setTransferSource(null)
          setTransferTargetId("")
          setTransferAmount("")
        }
      }}>
        <AlertDialogContent className="rounded-none border-blue-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-700">Transfer Dana</AlertDialogTitle>
            <AlertDialogDescription>
              Pindahkan saldo dari <strong>{transferSource?.nama}</strong> (Saldo: Rp {transferSource ? formatUang(Number(transferSource.saldo)) : 0}) ke akun lain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transferTarget">Ke Rekening / Dompet Tujuan</Label>
              <Select value={transferTargetId} onValueChange={(val: any) => setTransferTargetId(val || "")}>
                <SelectTrigger id="transferTarget" className="w-full rounded-none">
                  <SelectValue placeholder="Pilih akun tujuan" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {dompet.filter(d => d.id !== transferSource?.id).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.nama} (Rp {formatUang(Number(d.saldo))})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferAmount">Nominal Transfer (Rp)</Label>
              <Input
                id="transferAmount"
                type="text"
                inputMode="numeric"
                className="rounded-none"
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(formatRibuan(e.target.value))}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleTransfer}
              disabled={!transferTargetId || !transferAmount || transferAmount === "0"}
            >
              Proses Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </SidebarProvider>
  )
}
