'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const pathname = usePathname()
  useEffect(() => {
    // Jangan munculkan atau mulai timer jika di halaman login
    if (pathname === '/login') return;

    // Tangkap event PWA install
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      ;(window as any).deferredPrompt = e
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [pathname])

  useEffect(() => {
    // Jangan munculkan atau mulai timer jika di halaman login
    if (pathname === '/login') return;

    const isDismissed = localStorage.getItem('pwa_prompt_dismissed_v7')
    
    if (!isDismissed) {
      const timer = setTimeout(() => {
        toast(
          <div className="flex flex-col gap-3 w-full mt-1">
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">JMB Company App</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Instal aplikasi ini ke Beranda HP Anda untuk akses lebih cepat tanpa buka browser!</p>
            </div>
            <button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-medium transition-colors"
              onClick={async () => {
                const promptEvent = (window as any).deferredPrompt;
                if (!promptEvent) {
                  toast("Instalasi Manual", {
                    description: "Buka menu Browser (opsi 3 titik) lalu pilih 'Tambahkan ke Layar Utama'." 
                  })
                  return
                }
                
                promptEvent.prompt()
                const { outcome } = await promptEvent.userChoice
                if (outcome === 'accepted') {
                  toast.success("Terima Kasih!", { description: "Aplikasi sedang diinstal ke beranda Anda." })
                }
                (window as any).deferredPrompt = null;
                setInstallPrompt(null)
                localStorage.setItem('pwa_prompt_dismissed_v7', 'true')
                toast.dismiss() // Tutup toast saat tombol diklik
              }}
            >
              Instal Sekarang
            </button>
          </div>,
          {
            duration: Infinity,
            closeButton: true,
            onDismiss: () => {
              localStorage.setItem('pwa_prompt_dismissed_v7', 'true')
            }
          }
        )
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [installPrompt, pathname])

  // Komponen ini tidak merender UI (div) apapun, murni hanya memanggil toast
  return null
}
