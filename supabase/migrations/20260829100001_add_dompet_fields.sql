-- Add kategori and keterangan to dompet
ALTER TABLE dompet 
ADD COLUMN kategori TEXT DEFAULT 'tunai',
ADD COLUMN keterangan TEXT;
