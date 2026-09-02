-- Gabungan semua file migrasi dari database lama

-- Migration 1: 20260829100000_init_schema.sql
-- Create Table: dompet
CREATE TABLE dompet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    saldo NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Table: kas
CREATE TABLE kas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL,
    jenis TEXT NOT NULL,
    keterangan TEXT,
    jumlah NUMERIC NOT NULL DEFAULT 0,
    dompet_id UUID REFERENCES dompet(id) ON DELETE SET NULL,
    dompet_nama TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Table: transaksi (Penjualan/Pembelian)
CREATE TABLE transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL,
    jenis TEXT NOT NULL,
    pelanggan TEXT,
    bk TEXT,
    bb NUMERIC,
    harga_per_gram NUMERIC,
    jumlah_total NUMERIC NOT NULL DEFAULT 0,
    dompet_id UUID REFERENCES dompet(id) ON DELETE SET NULL,
    dompet_nama TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Table: transfer_dana
CREATE TABLE transfer_dana (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL,
    dari_dompet_id UUID REFERENCES dompet(id) ON DELETE SET NULL,
    dari_dompet_nama TEXT,
    ke_dompet_id UUID REFERENCES dompet(id) ON DELETE SET NULL,
    ke_dompet_nama TEXT,
    nominal NUMERIC NOT NULL DEFAULT 0,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dompet_updated_at BEFORE UPDATE ON dompet FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_kas_updated_at BEFORE UPDATE ON kas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_transaksi_updated_at BEFORE UPDATE ON transaksi FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_transfer_dana_updated_at BEFORE UPDATE ON transfer_dana FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Migration 2: 20260829100001_add_dompet_fields.sql
-- Add kategori and keterangan to dompet
ALTER TABLE dompet 
ADD COLUMN kategori TEXT DEFAULT 'tunai',
ADD COLUMN keterangan TEXT;

-- Migration 3: 20260829100002_create_piutang_table.sql
-- Create Table: piutang
CREATE TABLE piutang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL,
    jatuh_tempo DATE,
    nama TEXT NOT NULL,
    keterangan TEXT,
    jumlah NUMERIC NOT NULL DEFAULT 0,
    sisa_hutang NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'belum lunas',
    dompet_id UUID REFERENCES dompet(id) ON DELETE SET NULL,
    dompet_nama TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_piutang_updated_at BEFORE UPDATE ON piutang FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Migration 4: 20260829100004_create_pelanggan_table.sql
-- Create Table: pelanggan
CREATE TABLE pelanggan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL UNIQUE,
    telp TEXT DEFAULT '-',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_pelanggan_updated_at BEFORE UPDATE ON pelanggan FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Migration 5: 20260829100005_create_kategori_kas.sql
-- Create Table: kategori_kas
CREATE TABLE kategori_kas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    jenis TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration 6: 20260902100000_create_piutang_cicilan.sql
-- Create Table: piutang_cicilan
CREATE TABLE piutang_cicilan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    piutang_id UUID REFERENCES piutang(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    jumlah NUMERIC NOT NULL DEFAULT 0,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\n-- Migration 7: Add jenis to piutang_cicilan\nALTER TABLE piutang_cicilan ADD COLUMN jenis TEXT NOT NULL DEFAULT 'bayar';
