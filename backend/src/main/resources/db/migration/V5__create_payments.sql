CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) NOT NULL,
    client_id UUID REFERENCES clients(id) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    type VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING',
    paid_at TIMESTAMPTZ,
    due_date DATE,
    reference VARCHAR(255),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_due ON payments(due_date) WHERE status = 'PENDING';
CREATE INDEX idx_payments_client ON payments(client_id);
