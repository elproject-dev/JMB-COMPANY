import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function LifecyclePage() {
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
        <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Input Transaksi Toko Mas</CardTitle>
              <CardDescription>Masukkan detail transaksi pelanggan di bawah ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Pengguna</Label>
                  <Input id="nama" placeholder="Masukkan nama pelanggan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telp">No. Telepon</Label>
                  <Input id="telp" type="tel" placeholder="Masukkan nomor telepon" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="berat_kotor">Berat Kotor (gr)</Label>
                    <Input id="berat_kotor" type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="berat_bersih">Berat Bersih (gr)</Label>
                    <Input id="berat_bersih" type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saldo">Saldo (Rp)</Label>
                  <Input id="saldo" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saat_ini">Saat Ini (Tanggal Transaksi)</Label>
                  <Input id="saat_ini" type="datetime-local" />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline">Batal</Button>
              <Button>Simpan Transaksi</Button>
            </CardFooter>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
