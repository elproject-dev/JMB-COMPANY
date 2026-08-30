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
