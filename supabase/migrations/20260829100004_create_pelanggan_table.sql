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
