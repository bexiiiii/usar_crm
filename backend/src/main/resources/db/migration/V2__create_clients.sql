CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    passport_number VARCHAR(50),
    passport_expiry DATE,
    date_of_birth DATE,
    status VARCHAR(50) DEFAULT 'NEW',
    tags TEXT[],
    preferences JSONB,
    source VARCHAR(100),
    assigned_manager_id UUID REFERENCES users(id),
    notes TEXT,
    total_bookings INT DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_manager ON clients(assigned_manager_id);
CREATE INDEX idx_clients_email ON clients(email);
