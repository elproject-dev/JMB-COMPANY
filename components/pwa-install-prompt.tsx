'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  useEffect(() => {
    // Tangkap event PWA install
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  useEffect(() => {
    // Hapus penyimpanan sementara untuk tes, lalu panggil toast notifikasi
    localStorage.removeItem('pwa_prompt_dismissed')
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed')
    
    if (!isDismissed) {
      const timer = setTimeout(() => {
        toast("JMB Company App", {
          description: "Instal aplikasi ini ke Beranda HP Anda untuk akses lebih cepat tanpa buka browser!",
          duration: Infinity, // Jangan hilang otomatis sampai diklik
          action: {
            label: 'Instal Sekarang',
            onClick: async () => {
              if (!installPrompt) {
                toast("Instalasi Manual", {
                  description: "Buka menu Browser (opsi 3 titik) lalu pilih 'Tambahkan ke Layar Utama'." 
                })
                return
              }
              
              installPrompt.prompt()
              const { outcome } = await installPrompt.userChoice
              if (outcome === 'accepted') {
                toast.success("Terima Kasih!", { description: "Aplikasi sedang diinstal ke beranda Anda." })
              }
              setInstallPrompt(null)
            },
          },
          cancel: {
            label: 'Nanti Saja',
            onClick: () => {
              localStorage.setItem('pwa_prompt_dismissed', 'true')
            },
          },
        })
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [installPrompt])

  // Komponen ini tidak merender UI (div) apapun, murni hanya memanggil toast
  return null
}
