"use client"

import React, { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { DownloadSimple } from "@phosphor-icons/react"

export function RecentMutasi() {
  const [mutasi, setMutasi] = useState<any[]>([])
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingPelanggan, setIsDownloadingPelanggan] = useState(false)
  const [isDownloadingPembelian, setIsDownloadingPembelian] = useState(false)
  const [isDownloadingPenjualan, setIsDownloadingPenjualan] = useState(false)
  const [isDownloadingPengeluaran, setIsDownloadingPengeluaran] = useState(false)
  const [isDownloadingPemasukan, setIsDownloadingPemasukan] = useState(false)
  const [isDownloadingPiutang, setIsDownloadingPiutang] = useState(false)
  const [downloadType, setDownloadType] = useState<"mutasi" | "pembelian" | "penjualan" | "pengeluaran" | "pemasukan" | "piutang">("mutasi")

  const getAllMutasiData = async () => {
    // 1. Ambil data Kas
    const { data: dataKas } = await supabase
      .from('kas')
      .select('*')
      .eq('is_deleted', false)

    const mappedKas = (dataKas || [])
      .filter((k: any) => k.jenis !== 'penjualan_emas' && k.jenis !== 'pembelian_emas')
      .map((k: any) => {
      return {
        id: new Date(k.created_at).getTime(),
        tanggal: k.tanggal,
        keterangan: k.jenis === "info" && k.jumlah ? `${k.keterangan} (Rp ${formatRupiah(Number(k.jumlah) || 0)})` : k.keterangan,
        jenisMutasi: (k.jenis === "pemasukan" || k.jenis === "piutang_masuk" || k.jenis === "dompet_masuk" || k.jenis === "penyesuaian_masuk") ? "masuk" :
          ((k.jenis === "pengeluaran" || k.jenis === "piutang_keluar" || k.jenis === "dompet_keluar" || k.jenis === "penyesuaian_keluar") ? "keluar" : "info"),
        nominal: k.jenis === "info" ? 0 : (Number(k.jumlah) || 0)
      }
    })

    // 2. Ambil data Transaksi
    const { data: dataTx } = await supabase
      .from('transaksi')
      .select('*')
      .eq('is_deleted', false)

    const mappedTx = (dataTx || []).map((t: any) => ({
      id: new Date(t.created_at).getTime(),
      tanggal: t.tanggal,
      keterangan: `${t.jenis === "penjualan" ? "Penjualan Emas" : "Pembelian Emas"} - ${t.pelanggan}`,
      jenisMutasi: t.jenis === "penjualan" ? "masuk" : "keluar",
      nominal: Number(t.jumlah_total) || 0
    }))

    // 3. Ambil data Transfer
    const { data: dataTransfer } = await supabase
      .from('transfer_dana')
      .select('*')

    const mappedTransfer = (dataTransfer || []).map((t: any) => ({
      id: new Date(t.created_at).getTime(),
      tanggal: t.tanggal,
      keterangan: `${t.keterangan} (Rp ${formatRupiah(Number(t.nominal) || 0)})`,
      jenisMutasi: "transfer",
      nominal: 0
    }))

    // 4. Gabungkan dan urutkan (ascending)
    let combined = [...mappedKas, ...mappedTx, ...mappedTransfer]
    combined.sort((a, b) => {
      const timeDiff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      if (timeDiff === 0) return a.id - b.id
      return timeDiff
    })

    // 5. Filter jika dihapus
    const clearedAtStr = localStorage.getItem("mutasi_cleared_at")
    if (clearedAtStr) {
      const clearedAt = parseInt(clearedAtStr, 10)
      combined = combined.filter(item => item.id > clearedAt)
    }

    // 6. Hitung Saldo
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

    // 7. Tambah saldo awal jika ada
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

    return visibleData
  }

  useEffect(() => {
    async function init() {
      const data = await getAllMutasiData()
      data.reverse()
      setMutasi(data.slice(0, 10))
    }
    init()
  }, [])

  const formatTanggalOutput = (dateStr: string) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatRupiah = (num: number) => {
    return num.toLocaleString('id-ID')
  }

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true)
      const data = await getAllMutasiData()

      // Filter berdasarkan tanggal
      const filteredData = data.filter((m: any) => {
        if (!startDate && !endDate) return true

        const itemDate = new Date(m.tanggal).setHours(0, 0, 0, 0)

        if (startDate && endDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0) && itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        } else if (startDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0)
        } else if (endDate) {
          return itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        }
        return true
      })

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Mutasi")

      // Kolom Header
      worksheet.columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Keterangan", key: "keterangan", width: 40 },
        { header: "Masuk (Rp)", key: "masuk", width: 20 },
        { header: "Keluar (Rp)", key: "keluar", width: 20 },
        { header: "Saldo (Rp)", key: "saldo", width: 20 },
      ]

      // Styling Header dengan warna hijau Supabase (#3ECF8E)
      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF3ECF8E" }, // Supabase green
        }
        cell.font = {
          bold: true,
          color: { argb: "FF000000" }, // Black text
        }

        // Kolom Masuk (4), Keluar (5), Saldo (6) rata kanan
        // Kolom Keterangan (3) rata kiri, sisanya (1, 2) rata tengah
        if (colNumber >= 4) {
          cell.alignment = { vertical: "middle", horizontal: "right" }
        } else if (colNumber === 3) {
          cell.alignment = { vertical: "middle", horizontal: "left" }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        }

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }
      })

      // Menambahkan Data
      filteredData.forEach((m: any, idx: number) => {
        const isMasuk = m.jenisMutasi === "masuk"
        const isKeluar = m.jenisMutasi === "keluar"

        const row = worksheet.addRow({
          no: idx + 1,
          tanggal: formatTanggalOutput(m.tanggal),
          keterangan: m.keterangan,
          masuk: isMasuk ? m.nominal : "",
          keluar: isKeluar ? m.nominal : "",
          saldo: m.saldo,
        })

        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          }
        })

        row.getCell("no").alignment = { horizontal: "center" }
        row.getCell("tanggal").alignment = { horizontal: "center" }
        row.getCell("masuk").alignment = { horizontal: "right" }
        row.getCell("keluar").alignment = { horizontal: "right" }
        row.getCell("saldo").alignment = { horizontal: "right" }

        row.getCell("masuk").numFmt = "#,##0"
        row.getCell("keluar").numFmt = "#,##0"
        row.getCell("saldo").numFmt = "#,##0"
      })

      // Generate dan Download file
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      saveAs(blob, "Mutasi_Data.xlsx")
    } catch (error) {
      console.error("Gagal mengunduh Excel:", error)
    } finally {
      setIsDownloading(false)
      setIsDownloadModalOpen(false)
    }
  }

  const handleDownloadPelangganExcel = async () => {
    try {
      setIsDownloadingPelanggan(true)

      const { data: pData } = await supabase.from('pelanggan').select('*').eq('is_deleted', false).order('created_at', { ascending: true })
      const { data: txData } = await supabase.from('transaksi').select('*').eq('is_deleted', false)
      const { data: piutangData } = await supabase.from('piutang').select('*').eq('is_deleted', false)
      const { data: kasData } = await supabase.from('kas').select('*').eq('is_deleted', false)

      const pelangganList = pData || []
      const transaksiList = txData || []
      const piutangList = piutangData || []
      const kasList = kasData || []

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Data Pelanggan")

      worksheet.columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Nama", key: "nama", width: 30 },
        { header: "Telepon", key: "telp", width: 20 },
        { header: "Jml Transaksi", key: "jml_tx", width: 15 },
        { header: "Total Pembelian (Rp)", key: "total_tx", width: 20 },
        { header: "Sisa Hutang (Rp)", key: "total_hutang", width: 20 },
        { header: "Total Akhir (Rp)", key: "total_akhir", width: 20 },
      ]

      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3ECF8E" } }
        cell.font = { bold: true, color: { argb: "FF000000" } }
        if (colNumber >= 4) {
          cell.alignment = { vertical: "middle", horizontal: "right" }
        } else if (colNumber === 2 || colNumber === 3) {
          cell.alignment = { vertical: "middle", horizontal: "left" }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        }
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
      })

      pelangganList.forEach((p, idx) => {
        const namaPelanggan = p.nama

        const tx = transaksiList.filter((t: any) => t.pelanggan === namaPelanggan)
        const totalTx = tx.reduce((acc: number, curr: any) => acc + (Number(curr.jumlah_total) || 0), 0)

        const piutangSemua = piutangList.filter((ptg: any) => ptg.pelanggan === namaPelanggan || ptg.nama === namaPelanggan)
        const piutangAktif = piutangSemua.filter((ptg: any) => ptg.status !== "lunas")

        const cicilanList = kasList.filter((k: any) =>
          k.jenis === "pemasukan" &&
          (k.keterangan?.includes(`Cicilan piutang: ${namaPelanggan}`) || k.keterangan?.includes(`Pelunasan piutang: ${namaPelanggan}`))
        )

        const count = tx.length + piutangSemua.length + cicilanList.length

        const totalHutang = piutangAktif.reduce((acc: number, curr: any) => {
          const sisa = curr.sisa_hutang !== undefined ? curr.sisa_hutang : curr.jumlah
          return acc + (Number(sisa) || 0)
        }, 0)

        const netTotal = totalTx - totalHutang

        const row = worksheet.addRow({
          no: idx + 1,
          nama: p.nama,
          telp: p.telp || "-",
          jml_tx: count > 0 ? count : 0,
          total_tx: totalTx,
          total_hutang: totalHutang,
          total_akhir: netTotal
        })

        row.eachCell((cell) => {
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
        })

        row.getCell("no").alignment = { horizontal: "center" }
        row.getCell("jml_tx").alignment = { horizontal: "right" }
        row.getCell("total_tx").alignment = { horizontal: "right" }
        row.getCell("total_hutang").alignment = { horizontal: "right" }
        row.getCell("total_akhir").alignment = { horizontal: "right" }

        row.getCell("jml_tx").numFmt = "#,##0"
        row.getCell("total_tx").numFmt = "#,##0"
        row.getCell("total_hutang").numFmt = "#,##0"
        row.getCell("total_akhir").numFmt = "#,##0"
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      saveAs(blob, "Data_Pelanggan.xlsx")

    } catch (error) {
      console.error("Gagal mengunduh Excel Pelanggan:", error)
    } finally {
      setIsDownloadingPelanggan(false)
    }
  }

  const handleDownloadPembelianExcel = async () => {
    try {
      setIsDownloadingPembelian(true)

      const { data: txData } = await supabase
        .from('transaksi')
        .select('*')
        .eq('jenis', 'pembelian')
        .eq('is_deleted', false)
        .order('tanggal', { ascending: true })

      const rawTransaksiList = txData || []

      const transaksiList = rawTransaksiList.filter((t: any) => {
        if (!startDate && !endDate) return true

        const itemDate = new Date(t.tanggal).setHours(0, 0, 0, 0)

        if (startDate && endDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0) && itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        } else if (startDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0)
        } else if (endDate) {
          return itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        }
        return true
      })

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Data Pembelian")

      worksheet.columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Pelanggan", key: "pelanggan", width: 30 },
        { header: "Berat Kotor (g)", key: "bk", width: 20 },
        { header: "Berat Bersih (g)", key: "bb", width: 20 },
        { header: "Harga / Gram (Rp)", key: "harga", width: 20 },
        { header: "Total (Rp)", key: "total", width: 20 },
      ]

      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3ECF8E" } }
        cell.font = { bold: true, color: { argb: "FF000000" } }
        if (colNumber >= 4) {
          cell.alignment = { vertical: "middle", horizontal: "right" }
        } else if (colNumber === 3) {
          cell.alignment = { vertical: "middle", horizontal: "left" }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        }
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
      })

      transaksiList.forEach((t, idx) => {
        const row = worksheet.addRow({
          no: idx + 1,
          tanggal: formatTanggalOutput(t.tanggal),
          pelanggan: t.pelanggan,
          bk: t.bk,
          bb: t.bb,
          harga: t.harga_per_gram,
          total: t.jumlah_total
        })

        row.eachCell((cell) => {
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
        })

        row.getCell("no").alignment = { horizontal: "center" }
        row.getCell("tanggal").alignment = { horizontal: "center" }
        row.getCell("bk").alignment = { horizontal: "right" }
        row.getCell("bb").alignment = { horizontal: "right" }
        row.getCell("harga").alignment = { horizontal: "right" }
        row.getCell("total").alignment = { horizontal: "right" }

        row.getCell("harga").numFmt = "#,##0"
        row.getCell("total").numFmt = "#,##0"
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      saveAs(blob, "Data_Pembelian.xlsx")

    } catch (error) {
      console.error("Gagal mengunduh Excel Pembelian:", error)
    } finally {
      setIsDownloadingPembelian(false)
      setIsDownloadModalOpen(false)
    }
  }

  const handleDownloadPenjualanExcel = async () => {
    try {
      setIsDownloadingPenjualan(true)

      const { data: txData } = await supabase
        .from('transaksi')
        .select('*')
        .eq('jenis', 'penjualan')
        .eq('is_deleted', false)
        .order('tanggal', { ascending: true })

      const rawTransaksiList = txData || []

      const transaksiList = rawTransaksiList.filter((t: any) => {
        if (!startDate && !endDate) return true

        const itemDate = new Date(t.tanggal).setHours(0, 0, 0, 0)

        if (startDate && endDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0) && itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        } else if (startDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0)
        } else if (endDate) {
          return itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        }
        return true
      })

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Data Penjualan")

      worksheet.columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Pelanggan", key: "pelanggan", width: 30 },
        { header: "Berat Kotor (g)", key: "bk", width: 20 },
        { header: "Berat Bersih (g)", key: "bb", width: 20 },
        { header: "Harga / Gram (Rp)", key: "harga", width: 20 },
        { header: "Total (Rp)", key: "total", width: 20 },
      ]

      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3ECF8E" } }
        cell.font = { bold: true, color: { argb: "FF000000" } }
        if (colNumber >= 4) {
          cell.alignment = { vertical: "middle", horizontal: "right" }
        } else if (colNumber === 3) {
          cell.alignment = { vertical: "middle", horizontal: "left" }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        }
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
      })

      transaksiList.forEach((t, idx) => {
        const row = worksheet.addRow({
          no: idx + 1,
          tanggal: formatTanggalOutput(t.tanggal),
          pelanggan: t.pelanggan,
          bk: t.bk,
          bb: t.bb,
          harga: t.harga_per_gram,
          total: t.jumlah_total
        })

        row.eachCell((cell) => {
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
        })

        row.getCell("no").alignment = { horizontal: "center" }
        row.getCell("tanggal").alignment = { horizontal: "center" }
        row.getCell("bk").alignment = { horizontal: "right" }
        row.getCell("bb").alignment = { horizontal: "right" }
        row.getCell("harga").alignment = { horizontal: "right" }
        row.getCell("total").alignment = { horizontal: "right" }

        row.getCell("harga").numFmt = "#,##0"
        row.getCell("total").numFmt = "#,##0"
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      saveAs(blob, "Data_Penjualan.xlsx")

    } catch (error) {
      console.error("Gagal mengunduh Excel Penjualan:", error)
    } finally {
      setIsDownloadingPenjualan(false)
      setIsDownloadModalOpen(false)
    }
  }

  const handleDownloadPengeluaranExcel = async () => {
    try {
      setIsDownloadingPengeluaran(true)

      const { data: kasData } = await supabase
        .from('kas')
        .select('*')
        .eq('jenis', 'pengeluaran')
        .eq('is_deleted', false)
        .order('tanggal', { ascending: true })

      const rawKasList = kasData || []

      const kasList = rawKasList.filter((k: any) => {
        if (!startDate && !endDate) return true

        const itemDate = new Date(k.tanggal).setHours(0, 0, 0, 0)

        if (startDate && endDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0) && itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        } else if (startDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0)
        } else if (endDate) {
          return itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        }
        return true
      })

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Data Pengeluaran")

      worksheet.columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Keterangan / Keperluan", key: "keterangan", width: 40 },
        { header: "Jumlah (Rp)", key: "jumlah", width: 20 },
      ]

      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3ECF8E" } }
        cell.font = { bold: true, color: { argb: "FF000000" } }
        if (colNumber === 4) {
          cell.alignment = { vertical: "middle", horizontal: "right" }
        } else if (colNumber === 3) {
          cell.alignment = { vertical: "middle", horizontal: "left" }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        }
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
      })

      kasList.forEach((k, idx) => {
        const row = worksheet.addRow({
          no: idx + 1,
          tanggal: formatTanggalOutput(k.tanggal),
          keterangan: k.keterangan,
          jumlah: k.jumlah
        })

        row.eachCell((cell) => {
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
        })

        row.getCell("no").alignment = { horizontal: "center" }
        row.getCell("tanggal").alignment = { horizontal: "center" }
        row.getCell("jumlah").alignment = { horizontal: "right" }

        row.getCell("jumlah").numFmt = "#,##0"
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      saveAs(blob, "Data_Pengeluaran.xlsx")

    } catch (error) {
      console.error("Gagal mengunduh Excel Pengeluaran:", error)
    } finally {
      setIsDownloadingPengeluaran(false)
      setIsDownloadModalOpen(false)
    }
  }

  const handleDownloadPemasukanExcel = async () => {
    try {
      setIsDownloadingPemasukan(true)

      const { data: kasData } = await supabase
        .from('kas')
        .select('*')
        .eq('jenis', 'pemasukan')
        .eq('is_deleted', false)
        .order('tanggal', { ascending: true })

      const rawKasList = kasData || []

      const kasList = rawKasList.filter((k: any) => {
        if (!startDate && !endDate) return true

        const itemDate = new Date(k.tanggal).setHours(0, 0, 0, 0)

        if (startDate && endDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0) && itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        } else if (startDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0)
        } else if (endDate) {
          return itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        }
        return true
      })

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Data Pemasukan")

      worksheet.columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Keterangan / Sumber", key: "keterangan", width: 40 },
        { header: "Jumlah (Rp)", key: "jumlah", width: 20 },
      ]

      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3ECF8E" } }
        cell.font = { bold: true, color: { argb: "FF000000" } }
        if (colNumber === 4) {
          cell.alignment = { vertical: "middle", horizontal: "right" }
        } else if (colNumber === 3) {
          cell.alignment = { vertical: "middle", horizontal: "left" }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        }
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
      })

      kasList.forEach((k, idx) => {
        const row = worksheet.addRow({
          no: idx + 1,
          tanggal: formatTanggalOutput(k.tanggal),
          keterangan: k.keterangan,
          jumlah: k.jumlah
        })

        row.eachCell((cell) => {
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
        })

        row.getCell("no").alignment = { horizontal: "center" }
        row.getCell("tanggal").alignment = { horizontal: "center" }
        row.getCell("jumlah").alignment = { horizontal: "right" }

        row.getCell("jumlah").numFmt = "#,##0"
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      saveAs(blob, "Data_Pemasukan.xlsx")

    } catch (error) {
      console.error("Gagal mengunduh Excel Pemasukan:", error)
    } finally {
      setIsDownloadingPemasukan(false)
      setIsDownloadModalOpen(false)
    }
  }

  const handleDownloadPiutangExcel = async () => {
    try {
      setIsDownloadingPiutang(true)

      const { data: piutangData } = await supabase
        .from('piutang')
        .select('*')
        .eq('is_deleted', false)
        .order('tanggal', { ascending: true })

      const rawPiutangList = piutangData || []

      const piutangList = rawPiutangList.filter((p: any) => {
        if (!startDate && !endDate) return true

        const itemDate = new Date(p.tanggal).setHours(0, 0, 0, 0)

        if (startDate && endDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0) && itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        } else if (startDate) {
          return itemDate >= new Date(startDate).setHours(0, 0, 0, 0)
        } else if (endDate) {
          return itemDate <= new Date(endDate).setHours(0, 0, 0, 0)
        }
        return true
      })

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Data Piutang")

      worksheet.columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Peminjam", key: "peminjam", width: 30 },
        { header: "Keterangan", key: "keterangan", width: 30 },
        { header: "Total Hutang (Rp)", key: "total", width: 20 },
        { header: "Sisa Hutang (Rp)", key: "sisa", width: 20 },
        { header: "Jatuh Tempo", key: "jatuh_tempo", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ]

      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3ECF8E" } }
        cell.font = { bold: true, color: { argb: "FF000000" } }
        if (colNumber === 5 || colNumber === 6) {
          cell.alignment = { vertical: "middle", horizontal: "right" }
        } else if (colNumber === 3 || colNumber === 4) {
          cell.alignment = { vertical: "middle", horizontal: "left" }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        }
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
      })

      piutangList.forEach((p, idx) => {
        const sisaHutang = p.sisa_hutang !== undefined ? Number(p.sisa_hutang) : (p.status === 'lunas' ? 0 : Number(p.jumlah))

        const row = worksheet.addRow({
          no: idx + 1,
          tanggal: formatTanggalOutput(p.tanggal),
          peminjam: p.nama,
          keterangan: p.keterangan || "-",
          total: Number(p.jumlah) || 0,
          sisa: sisaHutang,
          jatuh_tempo: p.jatuh_tempo ? formatTanggalOutput(p.jatuh_tempo) : "-",
          status: p.status === "lunas" ? "Lunas" : "Belum Lunas"
        })

        row.eachCell((cell) => {
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
        })

        row.getCell("no").alignment = { horizontal: "center" }
        row.getCell("tanggal").alignment = { horizontal: "center" }
        row.getCell("jatuh_tempo").alignment = { horizontal: "center" }
        row.getCell("status").alignment = { horizontal: "center" }
        row.getCell("total").alignment = { horizontal: "right" }
        row.getCell("sisa").alignment = { horizontal: "right" }

        row.getCell("total").numFmt = "#,##0"
        row.getCell("sisa").numFmt = "#,##0"
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      saveAs(blob, "Data_Piutang.xlsx")

    } catch (error) {
      console.error("Gagal mengunduh Excel Piutang:", error)
    } finally {
      setIsDownloadingPiutang(false)
      setIsDownloadModalOpen(false)
    }
  }

  const executeDownload = () => {
    if (downloadType === "mutasi") {
      handleDownloadExcel()
    } else if (downloadType === "pembelian") {
      handleDownloadPembelianExcel()
    } else if (downloadType === "penjualan") {
      handleDownloadPenjualanExcel()
    } else if (downloadType === "pengeluaran") {
      handleDownloadPengeluaranExcel()
    } else if (downloadType === "pemasukan") {
      handleDownloadPemasukanExcel()
    } else if (downloadType === "piutang") {
      handleDownloadPiutangExcel()
    }
  }

  const isAnyDownloading = isDownloading || isDownloadingPembelian || isDownloadingPenjualan || isDownloadingPengeluaran || isDownloadingPemasukan || isDownloadingPiutang

  return (
    <>
      <Card className="@container/card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>Riwayat Mutasi Terakhir</CardTitle>
            <CardDescription>
              Menampilkan 10 riwayat mutasi terakhir
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "default", size: "sm" }) + " flex items-center gap-2 cursor-pointer"}>
              <DownloadSimple className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh Data</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setDownloadType("mutasi")
                  setIsDownloadModalOpen(true)
                }}
                className="cursor-pointer"
              >
                Data Mutasi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPelangganExcel} disabled={isDownloadingPelanggan} className="cursor-pointer">
                {isDownloadingPelanggan ? "Mengunduh..." : "Data Pelanggan"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDownloadType("pembelian")
                  setIsDownloadModalOpen(true)
                }}
                className="cursor-pointer"
              >
                Data Pembelian
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDownloadType("penjualan")
                  setIsDownloadModalOpen(true)
                }}
                className="cursor-pointer"
              >
                Data Penjualan
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDownloadType("pengeluaran")
                  setIsDownloadModalOpen(true)
                }}
                className="cursor-pointer"
              >
                Data Pengeluaran
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDownloadType("pemasukan")
                  setIsDownloadModalOpen(true)
                }}
                className="cursor-pointer"
              >
                Data Pemasukan
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDownloadType("piutang")
                  setIsDownloadModalOpen(true)
                }}
                className="cursor-pointer"
              >
                Data Piutang
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-0">
          {/* === MOBILE & TABLET: Card List (hidden on lg+) === */}
          <div className="flex flex-col gap-3 lg:hidden">
            {mutasi.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Belum ada riwayat mutasi.
              </div>
            ) : (
              mutasi.map((m: any, idx: number) => (
                <div
                  key={m.id + "-" + idx}
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
                    <span className="text-xs text-muted-foreground">Saldo</span>
                    <span className="text-sm font-semibold">Rp {formatRupiah(m.saldo)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* === DESKTOP: Table View (hidden below lg) === */}
          <div className="hidden lg:block bg-card text-card-foreground shadow-sm border rounded-none overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center border-r whitespace-nowrap">No</TableHead>
                  <TableHead className="w-[140px] border-r whitespace-nowrap">Tanggal</TableHead>
                  <TableHead className="border-r whitespace-nowrap">Keterangan</TableHead>
                  <TableHead className="border-r text-right whitespace-nowrap text-primary">Masuk (Rp)</TableHead>
                  <TableHead className="border-r text-right whitespace-nowrap text-red-600">Keluar (Rp)</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Saldo (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mutasi.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Belum ada riwayat mutasi.
                    </TableCell>
                  </TableRow>
                ) : (
                  mutasi.map((m: any, idx: number) => (
                    <TableRow key={m.id + "-" + idx} className="h-[49px]">
                      <TableCell className="font-medium text-center border-r">{idx + 1}</TableCell>
                      <TableCell className="border-r whitespace-nowrap">{formatTanggalOutput(m.tanggal)}</TableCell>
                      <TableCell className="border-r">{m.keterangan}</TableCell>
                      <TableCell className="border-r text-right text-primary">
                        {m.jenisMutasi === "masuk" ? formatRupiah(m.nominal) : "-"}
                      </TableCell>
                      <TableCell className="border-r text-right text-red-600">
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
        </CardContent>
      </Card>

      <Dialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unduh {downloadType === "mutasi" ? "Mutasi" : downloadType === "pembelian" ? "Pembelian" : downloadType === "penjualan" ? "Penjualan" : downloadType === "pengeluaran" ? "Pengeluaran" : downloadType === "pemasukan" ? "Pemasukan" : "Piutang"} Excel</DialogTitle>
            <DialogDescription>
              Pilih rentang tanggal data {downloadType} yang ingin diunduh. <br />Biarkan kosong untuk mengunduh semua data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-date" className="text-right">
                Mulai
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="col-span-3 cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end-date" className="text-right">
                Akhir
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="col-span-3 cursor-pointer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDownloadModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={executeDownload} disabled={isAnyDownloading}>
              {isAnyDownloading ? "Mengunduh..." : "Unduh"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
