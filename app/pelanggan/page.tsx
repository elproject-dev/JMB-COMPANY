"use client"

import React, { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { supabase } from "@/lib/supabase"

const initialPelanggan = [
  { id: 1, nama: "Agus Pak Won", telp: "081234567890" },
  { id: 2, nama: "Tigus", telp: "085678901234" },
  { id: 3, nama: "Iwan", telp: "089012345678" },
  { id: 4, nama: "Mang Wawan", telp: "082345678901" },
]

export default function PelangganPage() {
  const [pelanggan, setPelanggan] = useState<{ id: string, nama: string, telp: string }[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [newNama, setNewNama] = useState("")

  const [transaksiData, setTransaksiData] = useState<any[]>([])
  const [piutangData, setPiutangData] = useState<any[]>([])
  const [kasData, setKasData] = useState<any[]>([])

  async function loadData() {
    const { data: pData } = await supabase.from('pelanggan').select('*').eq('is_deleted', false).order('created_at', { ascending: false })
    if (pData) setPelanggan(pData)

    const { data: txData } = await supabase.from('transaksi').select('*').eq('is_deleted', false)
    if (txData) setTransaksiData(txData)

    const { data: pData2 } = await supabase.from('piutang').select('*').eq('is_deleted', false)
    if (pData2) setPiutangData(pData2)

    const { data: kData } = await supabase.from('kas').select('*').eq('is_deleted', false)
    if (kData) setKasData(kData)
  }

  React.useEffect(() => {
    loadData()
  }, [])

  const getTransaksiInfo = (namaPelanggan: string) => {
    const tx = transaksiData.filter((t: any) => t.pelanggan === namaPelanggan)
    const totalTx = tx.reduce((acc: number, curr: any) => acc + (Number(curr.jumlah_total) || 0), 0)

    const piutangSemua = piutangData.filter((p: any) => p.pelanggan === namaPelanggan || p.nama === namaPelanggan)
    const piutangAktif = piutangSemua.filter((p: any) => p.status !== "lunas")

    const cicilanList = kasData.filter((k: any) =>
      k.jenis === "pemasukan" &&
      (k.keterangan?.includes(`Cicilan piutang: ${namaPelanggan}`) || k.keterangan?.includes(`Pelunasan piutang: ${namaPelanggan}`))
    )

    const count = tx.length + piutangSemua.length + cicilanList.length

    const totalHutang = piutangAktif.reduce((acc: number, curr: any) => {
      const sisa = curr.sisa_hutang !== undefined ? curr.sisa_hutang : curr.jumlah
      return acc + (Number(sisa) || 0)
    }, 0)

    const netTotal = totalTx - totalHutang

    let formattedTotal = "-"
    if (netTotal !== 0) {
      formattedTotal = netTotal < 0
        ? `-Rp ${Math.abs(netTotal).toLocaleString('id-ID')}`
        : `Rp ${netTotal.toLocaleString('id-ID')}`
    }

    return {
      count: count > 0 ? count : "-",
      total: formattedTotal,
      isMinus: netTotal < 0
    }
  }

  const [newTelp, setNewTelp] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<{ id: string, nama: string } | null>(null)

  const handleSimpan = async () => {
    if (!newNama) return

    if (editingId !== null) {
      await supabase.from('pelanggan').update({ nama: newNama, telp: newTelp || "-" }).eq('id', editingId)

      setEditingId(null)
      setNewNama("")
      setNewTelp("")
      setIsAdding(false)
      toast.add({
        title: "Berhasil Menyimpan",
        description: `Data pelanggan "${newNama}" telah diperbarui.`,
      })
    } else {
      await supabase.from('pelanggan').insert({
        nama: newNama,
        telp: newTelp || "-",
      })

      setNewNama("")
      setNewTelp("")
      setIsAdding(false)
      toast.add({
        title: "Berhasil Menyimpan",
        description: `Pelanggan "${newNama}" telah ditambahkan.`,
      })
    }
    await loadData()
  }

  const handleEdit = (p: { id: string, nama: string, telp: string }) => {
    setEditingId(p.id)
    setNewNama(p.nama)
    setNewTelp(p.telp)
    setIsAdding(true)
  }

  const confirmHapus = async () => {
    if (!deletingCustomer) return

    await supabase.from('pelanggan').update({ is_deleted: true }).eq('id', deletingCustomer.id)

    toast.add({
      title: "Berhasil Dihapus",
      description: `Pelanggan "${deletingCustomer.nama}" telah dihapus.`,
    })
    setDeletingCustomer(null)
    await loadData()
  }

  const itemsPerPage = 15
  const totalPages = Math.ceil(pelanggan.length / itemsPerPage)
  const currentPelanggan = pelanggan.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
            <h1 className="text-1xl font-bold tracking-tight">Daftar Pelanggan</h1>
            <div className="flex gap-2 items-center">
              {/* Desktop Button */}
              <Button
                type="button"
                className="hidden md:flex rounded-none"
                onClick={() => {
                  if (isAdding) {
                    setIsAdding(false)
                    setEditingId(null)
                    setNewNama("")
                    setNewTelp("")
                  } else {
                    setIsAdding(true)
                  }
                }}
              >
                {isAdding ? "Batal" : "Tambah Pelanggan"}
              </Button>

              {/* Mobile Button (Bulat Icon) */}
              <Button
                type="button"
                className="md:hidden rounded-full w-8 h-8 p-0 shadow-md flex items-center justify-center transition-transform active:scale-95"
                onClick={() => {
                  if (isAdding) {
                    setIsAdding(false)
                    setEditingId(null)
                    setNewNama("")
                    setNewTelp("")
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
            <div className="mb-6 p-4 bg-card border rounded-none shadow-sm">
              <h2 className="text-sm font-semibold mb-4">{editingId !== null ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Pelanggan</Label>
                  <Input
                    id="nama"
                    placeholder="Masukkan nama"
                    className="rounded-none"
                    value={newNama}
                    onChange={(e) => setNewNama(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telp">No. Telepon</Label>
                  <Input
                    id="telp"
                    placeholder="Contoh: 0812..."
                    className="rounded-none"
                    value={newTelp}
                    onChange={(e) => setNewTelp(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button type="button" className="rounded-none" onClick={handleSimpan}>
                  Simpan Pelanggan
                </Button>
              </div>
            </div>
          )}

          <div className="lg:bg-card lg:text-card-foreground lg:shadow-sm lg:border lg:rounded-none">
            {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}
            <div className="flex flex-col gap-3 lg:hidden">
              {pelanggan.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Belum ada pelanggan terdaftar.
                </div>
              ) : (
                currentPelanggan.map((p, index) => {
                  const txInfo = getTransaksiInfo(p.nama)
                  return (
                    <div
                      key={p.id}
                      className="border bg-card shadow-sm p-4 flex flex-col gap-2 transition-all duration-200 hover:shadow-md hover:border-primary/20 active:bg-primary/5 rounded-none"
                    >
                      {/* Row 1: Nama + Dropdown Aksi */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm leading-snug truncate">{p.nama}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {p.telp}
                          </div>
                        </div>
                        <div className="shrink-0 -mr-2 -mt-2">
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
                              <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEdit(p)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="rounded-none cursor-pointer text-primary focus:bg-primary focus:text-primary-foreground" onClick={() => setDeletingCustomer({ id: p.id, nama: p.nama })}>Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Row 2: Transaksi Info */}
                      <div className="flex items-center justify-between pt-1 border-t border-dashed">
                        <span className="text-xs text-muted-foreground">{txInfo.count} Transaksi</span>
                        <span className={`text-sm font-semibold ${txInfo.isMinus ? 'text-red-500' : ''}`}>
                          {txInfo.total}
                        </span>
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
                    <TableHead className="w-[50px] text-center border-r">No</TableHead>
                    <TableHead className="border-r">Nama</TableHead>
                    <TableHead className="border-r">Telepon</TableHead>
                    <TableHead className="border-r text-center">Jml Transaksi</TableHead>
                    <TableHead className="border-r text-right">Total</TableHead>
                    <TableHead className="w-[60px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPelanggan.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Belum ada pelanggan terdaftar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentPelanggan.map((p, index) => {
                      const txInfo = getTransaksiInfo(p.nama)
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-center border-r">{index + 1}</TableCell>
                          <TableCell className="border-r">{p.nama}</TableCell>
                          <TableCell className="border-r">{p.telp}</TableCell>
                          <TableCell className="border-r text-center">{txInfo.count}</TableCell>
                          <TableCell className={`border-r text-right ${txInfo.isMinus ? 'text-red-500 font-medium' : ''}`}>{txInfo.total}</TableCell>
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
                                <DropdownMenuItem className="rounded-none cursor-pointer" onClick={() => handleEdit(p)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-none cursor-pointer text-primary focus:bg-primary focus:text-primary-foreground" onClick={() => setDeletingCustomer({ id: p.id, nama: p.nama })}>Hapus</DropdownMenuItem>
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

      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pelanggan <strong>"{deletingCustomer?.nama}"</strong>? Tindakan ini tidak dapat dibatalkan.
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

    </SidebarProvider>
  )
}
