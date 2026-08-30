"use client"

import React, { useState, useEffect } from "react"
import { Trash } from "@phosphor-icons/react"
import { supabase } from "@/lib/supabase"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

export default function MutasiPage() {
  const [mutasi, setMutasi] = useState<any[]>([])
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  async function loadMutasi() {
    // 1. Ambil data Kas
    const { data: kasDataRaw } = await supabase.from('kas').select('*').eq('is_deleted', false)
    const kasData = kasDataRaw || []

    const mappedKas = kasData
      .filter((k: any) => k.jenis !== 'penjualan_emas' && k.jenis !== 'pembelian_emas')
      .map((k: any) => {
        const actualNominal = Number(k.jumlah) || 0
        return {
          id: new Date(k.created_at).getTime(),
          tanggal: k.tanggal,
          keterangan: k.jenis === "info" && k.jumlah ? `${k.keterangan} (Rp ${formatRupiah(actualNominal)})` : k.keterangan,
          jenisMutasi: (k.jenis === "pemasukan" || k.jenis === "piutang_masuk" || k.jenis === "dompet_masuk" || k.jenis === "penyesuaian_masuk") ? "masuk" :
            ((k.jenis === "pengeluaran" || k.jenis === "piutang_keluar" || k.jenis === "dompet_keluar" || k.jenis === "penyesuaian_keluar") ? "keluar" : "info"),
          nominal: k.jenis === "info" ? 0 : actualNominal
        }
      })

    // 2. Ambil data Transaksi
    const { data: txDataRaw } = await supabase.from('transaksi').select('*').eq('is_deleted', false)
    const txData = txDataRaw || []
    const mappedTx = txData.map((t: any) => ({
      id: new Date(t.created_at).getTime(),
      tanggal: t.tanggal,
      keterangan: `${t.jenis === "penjualan" ? "Penjualan Emas" : "Pembelian Emas"} - ${t.pelanggan}`,
      jenisMutasi: t.jenis === "penjualan" ? "masuk" : "keluar",
      nominal: Number(t.jumlah_total) || 0
    }))

    // 3. Ambil data Transfer
    const { data: transferDataRaw } = await supabase.from('transfer_dana').select('*')
    const transferData = transferDataRaw || []
    const mappedTransfer = transferData.map((t: any) => ({
      id: new Date(t.created_at).getTime(),
      tanggal: t.tanggal,
      keterangan: `${t.keterangan} (Rp ${formatRupiah(Number(t.nominal))})`,
      jenisMutasi: "transfer",
      nominal: 0 // Transfer tidak mempengaruhi total saldo global
    }))

    // 4. Gabungkan dan urutkan
    let combined = [...mappedKas, ...mappedTx, ...mappedTransfer]

    combined.sort((a, b) => {
      const timeDiff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      if (timeDiff === 0) return a.id - b.id
      return timeDiff
    })

    // 5. Filter jika riwayat pernah dihapus
    const clearedAtStr = localStorage.getItem("mutasi_cleared_at")
    if (clearedAtStr) {
      const clearedAt = parseInt(clearedAtStr, 10)
      combined = combined.filter(item => item.id > clearedAt)
    }

    // 6. Hitung Saldo Kumulatif
    const saldoAwalStr = localStorage.getItem("mutasi_saldo_awal")
    let currentSaldo = saldoAwalStr ? parseInt(saldoAwalStr, 10) : 0

    const allWithSaldo = combined.map(item => {
      if (item.jenisMutasi === "masuk") {
        currentSaldo += item.nominal
      } else if (item.jenisMutasi === "keluar") {
        currentSaldo -= item.nominal
      }
      return { ...item, saldo: currentSaldo }
    })

    // 7. Tambahkan baris "Saldo Awal"
    let visibleData = [...allWithSaldo]
    if (saldoAwalStr && parseInt(saldoAwalStr, 10) > 0) {
      const saldoAwal = parseInt(saldoAwalStr, 10)
      const clearedAt = clearedAtStr ? parseInt(clearedAtStr, 10) : 0
      visibleData.unshift({
        id: clearedAt,
        tanggal: localStorage.getItem("mutasi_cleared_date") || new Date().toISOString().split('T')[0],
        keterangan: "Saldo Awal",
        jenisMutasi: "info",
        nominal: 0,
        saldo: saldoAwal
      })
    }

    // 8. Balik urutan
    visibleData.reverse()
    setMutasi(visibleData)
  }

  useEffect(() => {
    loadMutasi()
  }, [])

  const formatTanggalOutput = (dateStr: string) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatRupiah = (num: number) => {
    return num.toLocaleString('id-ID')
  }

  const handleDeleteAll = async () => {
    // Hitung total saldo dompet saat ini sebagai baseline
    const { data: dompetDataRaw } = await supabase.from('dompet').select('saldo')
    const dompetData = dompetDataRaw || []
    const totalSaldo = dompetData.reduce((sum: number, d: any) => sum + (Number(d.saldo) || 0), 0)

    // Simpan timestamp dan saldo baseline (data asli TIDAK dihapus di database)
    localStorage.setItem("mutasi_cleared_at", Date.now().toString())
    localStorage.setItem("mutasi_saldo_awal", totalSaldo.toString())
    localStorage.setItem("mutasi_cleared_date", new Date().toISOString().split("T")[0])

    // Reload mutasi untuk mencerminkan penghapusan visual
    await loadMutasi()
    setIsDeletingAll(false)
  }

  const itemsPerPage = 15
  const totalPages = Math.ceil(mutasi.length / itemsPerPage)
  const currentMutasi = mutasi.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
            <h1 className="text-1xl font-bold tracking-tight">Riwayat Mutasi Global</h1>
            {mutasi.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDeletingAll(true)}
                  className="hidden md:block text-xs font-medium text-red-600 hover:text-red-700 underline"
                >
                  Hapus Semua Riwayat
                </button>
                <button
                  onClick={() => setIsDeletingAll(true)}
                  className="md:hidden flex items-center justify-center text-red-600 hover:bg-red-50 p-2 -mr-2 rounded-full transition-colors active:scale-95"
                  title="Hapus Semua Riwayat"
                >
                  <Trash size={20} weight="bold" />
                </button>
              </div>
            )}
          </div>

          <div className="lg:bg-card lg:text-card-foreground lg:shadow-sm lg:border lg:rounded-none">
            {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}
            <div className="flex flex-col gap-3 lg:hidden">
              {mutasi.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Belum ada transaksi sama sekali.
                </div>
              ) : (
                currentMutasi.map((m, index) => (
                  <div
                    key={`${m.id}-${index}`}
                    className="border bg-card shadow-sm p-4 flex flex-col gap-2 transition-all duration-200 hover:shadow-md hover:border-primary/20 active:bg-primary/5 rounded-none"
                  >
                    {/* Row 1: Keterangan + Nominal */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm leading-snug truncate">{m.keterangan}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatTanggalOutput(m.tanggal)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {m.jenisMutasi === "masuk" ? (
                          <div className="font-bold text-primary text-base whitespace-nowrap">
                            +Rp {formatRupiah(m.nominal)}
                          </div>
                        ) : m.jenisMutasi === "keluar" ? (
                          <div className="font-bold text-red-600 text-base whitespace-nowrap">
                            -Rp {formatRupiah(m.nominal)}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">info</div>
                        )}
                      </div>
                    </div>
                    {/* Row 2: Saldo */}
                    <div className="flex items-center justify-between pt-1 border-t border-dashed">
                      <span className="text-xs text-muted-foreground capitalize">Saldo</span>
                      <span className="text-sm font-semibold">Rp {formatRupiah(m.saldo)}</span>
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
                    <TableHead className="border-r whitespace-nowrap">Keterangan</TableHead>
                    <TableHead className="border-r text-right whitespace-nowrap text-primary">Masuk</TableHead>
                    <TableHead className="border-r text-right whitespace-nowrap text-red-600">Keluar</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mutasi.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Belum ada transaksi sama sekali.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentMutasi.map((m, index) => (
                      <TableRow key={`${m.id}-${index}`} className="h-[49px]">
                        <TableCell className="font-medium text-center border-r">{index + 1}</TableCell>
                        <TableCell className="border-r text-left">{formatTanggalOutput(m.tanggal)}</TableCell>
                        <TableCell className="border-r">{m.keterangan}</TableCell>
                        <TableCell className="border-r text-right text-primary font-semibold">
                          {m.jenisMutasi === "masuk" ? formatRupiah(m.nominal) : "-"}
                        </TableCell>
                        <TableCell className="border-r text-right text-red-600 font-semibold">
                          {m.jenisMutasi === "keluar" ? formatRupiah(m.nominal) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatRupiah(m.saldo)}
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
                <div className="text-xs text-muted-foreground px-4">Halaman {currentPage} dari {totalPages}</div>
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

      <AlertDialog open={isDeletingAll} onOpenChange={setIsDeletingAll}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Riwayat?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus <strong>seluruh data mutasi kas, transaksi, dan riwayat transfer</strong>. Anda tidak dapat membatalkan tindakan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-none bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteAll}>
              Ya, Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </SidebarProvider>
  )
}
