"use client"

import React, { useState, useEffect } from "react"

import { WalletIcon, CurrencyCircleDollarIcon, ArrowCircleDown, ArrowCircleUp, ShoppingCartIcon } from "@phosphor-icons/react"

import { supabase } from "@/lib/supabase"

export function SectionCards() {
  const [totalSaldo, setTotalSaldo] = useState(0)
  const [totalPenjualan, setTotalPenjualan] = useState(0)
  const [totalPembelian, setTotalPembelian] = useState(0)
  const [totalPemasukan, setTotalPemasukan] = useState(0)
  const [totalPengeluaran, setTotalPengeluaran] = useState(0)

  useEffect(() => {
    async function fetchData() {
      // 1. Hitung Total Saldo dari tabel dompet
      const { data: dataDompet, error: errDompet } = await supabase
        .from('dompet')
        .select('saldo')
      if (dataDompet && !errDompet) {
        const sumSaldo = dataDompet.reduce((acc: number, curr: any) => acc + (Number(curr.saldo) || 0), 0)
        setTotalSaldo(sumSaldo)
      }

      // 2. Hitung Total Penjualan dari tabel transaksi
      const { data: dataTx, error: errTx } = await supabase
        .from('transaksi')
        .select('jumlah_total')
        .eq('jenis', 'penjualan')
        .eq('is_deleted', false)
      if (dataTx && !errTx) {
        const sumPenjualan = dataTx.reduce((acc: number, curr: any) => acc + (Number(curr.jumlah_total) || 0), 0)
        setTotalPenjualan(sumPenjualan)
      }

      // Hitung Total Pembelian dari tabel transaksi
      const { data: dataTxBeli, error: errTxBeli } = await supabase
        .from('transaksi')
        .select('jumlah_total')
        .eq('jenis', 'pembelian')
        .eq('is_deleted', false)
      if (dataTxBeli && !errTxBeli) {
        const sumPembelian = dataTxBeli.reduce((acc: number, curr: any) => acc + (Number(curr.jumlah_total) || 0), 0)
        setTotalPembelian(sumPembelian)
      }

      // 3. Hitung Pemasukan & Pengeluaran dari tabel kas
      const { data: dataKas, error: errKas } = await supabase
        .from('kas')
        .select('jenis, jumlah')
        .eq('is_deleted', false)
      if (dataKas && !errKas) {
        let inSum = 0
        let outSum = 0
        dataKas.forEach((k: any) => {
          const nom = Number(k.jumlah) || 0
          if (k.jenis === 'pemasukan') inSum += nom
          if (k.jenis === 'pengeluaran') outSum += nom
        })
        setTotalPemasukan(inSum)
        setTotalPengeluaran(outSum)
      }
    }

    fetchData()
  }, [])

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

  const animTotalSaldo = useCountUp(totalSaldo)
  const animTotalPenjualan = useCountUp(totalPenjualan)
  const animTotalPembelian = useCountUp(totalPembelian)
  const animTotalPemasukan = useCountUp(totalPemasukan)
  const animTotalPengeluaran = useCountUp(totalPengeluaran)

  const formatUang = (num: number) => {
    return num.toLocaleString('id-ID')
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @6xl/main:grid-cols-5">
      <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total Saldo</p>
          <h3 className="text-lg font-bold tracking-tight text-primary mt-1">Rp {formatUang(animTotalSaldo)}</h3>
        </div>
        <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
          <WalletIcon weight="duotone" className="w-5 h-5" />
        </div>
      </div>

      <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total Pembelian</p>
          <h3 className="text-lg font-bold tracking-tight text-primary mt-1">Rp {formatUang(animTotalPembelian)}</h3>
        </div>
        <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
          <ShoppingCartIcon weight="duotone" className="w-5 h-5" />
        </div>
      </div>

      <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total Penjualan</p>
          <h3 className="text-lg font-bold tracking-tight text-primary mt-1">Rp {formatUang(animTotalPenjualan)}</h3>
        </div>
        <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
          <CurrencyCircleDollarIcon weight="duotone" className="w-5 h-5" />
        </div>
      </div>

      <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total Pemasukan Kas</p>
          <h3 className="text-lg font-bold tracking-tight text-primary mt-1">Rp {formatUang(animTotalPemasukan)}</h3>
        </div>
        <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
          <ArrowCircleUp weight="duotone" className="w-5 h-5" />
        </div>
      </div>

      <div className="relative rounded-none border bg-linear-to-t from-primary/5 to-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total Pengeluaran Kas</p>
          <h3 className="text-lg font-bold tracking-tight text-primary mt-1">Rp {formatUang(animTotalPengeluaran)}</h3>
        </div>
        <div className="absolute top-0 right-0 p-4 text-primary opacity-50">
          <ArrowCircleDown weight="duotone" className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
