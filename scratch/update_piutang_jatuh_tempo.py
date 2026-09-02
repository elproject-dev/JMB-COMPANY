import re

with open('app/piutang/page.tsx', 'r') as f:
    content = f.read()

# 1. Remove state
content = content.replace('  const [jatuhTempo, setJatuhTempo] = useState<string>("")\n', '')

# 2. Update validation in handleSimpan
content = content.replace(
    'if (!tanggal || !selectedPelanggan || !keterangan || !jumlah || !jatuhTempo) {',
    'if (!tanggal || !selectedPelanggan || !keterangan || !jumlah) {'
)
content = content.replace(
    'description: "Harap lengkapi semua data, termasuk Tanggal Jatuh Tempo.",',
    'description: "Harap lengkapi semua data.",'
)

# 3. Remove jatuh_tempo from DB inserts/updates in handleSimpan
content = content.replace('        jatuh_tempo: jatuhTempo,\n', '')
content = content.replace('    setJatuhTempo("")\n', '')

# 4. Remove setJatuhTempo in handleEdit
content = content.replace('    setJatuhTempo(p.jatuh_tempo || "")\n', '')

# 5. Remove isJatuhTempoCalendarOpen state
content = content.replace('  const [isJatuhTempoCalendarOpen, setIsJatuhTempoCalendarOpen] = useState(false)\n', '')

# 6. Remove UI for Jatuh Tempo Input Field
jatuh_tempo_ui = """                <div className="space-y-2">
                  <Label htmlFor="jatuhTempo">Jatuh Tempo</Label>
                  <div>
                    <Popover open={isJatuhTempoCalendarOpen} onOpenChange={setIsJatuhTempoCalendarOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            id="jatuhTempo"
                            variant={"outline"}
                            className={`w-full rounded-none justify-start text-left font-normal ${!jatuhTempo && "text-muted-foreground"}`}
                          >
                            {jatuhTempo ? formatTanggalOutput(jatuhTempo) : <span>Pilih jatuh tempo</span>}
                          </Button>
                        }
                      />
                      <PopoverContent className="w-auto p-0 rounded-none border" align="start">
                        <Calendar
                          mode="single"
                          selected={jatuhTempo ? new Date(jatuhTempo) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setJatuhTempo(format(date, "yyyy-MM-dd"))
                              setIsJatuhTempoCalendarOpen(false)
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>"""
content = content.replace(jatuh_tempo_ui, '')

# 7. Remove isLewatJatuhTempo logic from Mobile list and Desktop table
content = content.replace('const isLewatJatuhTempo = p.jatuh_tempo && new Date(p.jatuh_tempo) < new Date() && p.status !== "lunas"\n', '')

# 8. Remove Jatuh Tempo rendering from Mobile List
mobile_jatuh_tempo_ui = """                        <div>
                          Jatuh Tempo: <span className={`font-semibold ${isLewatJatuhTempo ? 'text-red-600' : 'text-foreground'}`}>
                            {p.jatuh_tempo ? formatTanggalOutput(p.jatuh_tempo) : '-'}
                          </span>
                        </div>"""
content = content.replace(mobile_jatuh_tempo_ui, '')

# 9. Remove Jatuh Tempo rendering from Desktop Table Header and Cell
content = content.replace('<TableHead className="border-r text-right whitespace-nowrap">Jatuh Tempo</TableHead>\n', '')

desktop_jatuh_tempo_cell = """                          <TableCell className={`border-r text-right ${isLewatJatuhTempo ? 'text-red-600 font-bold' : ''}`}>
                            {p.jatuh_tempo ? formatTanggalOutput(p.jatuh_tempo) : '-'}
                          </TableCell>"""
content = content.replace(desktop_jatuh_tempo_cell, '')

with open('app/piutang/page.tsx', 'w') as f:
    f.write(content)

print("Done removing jatuh tempo")
