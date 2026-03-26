CREATE SEQUENCE invoice_number_seq START 1001 INCREMENT 1;

CREATE TABLE invoices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL DEFAULT ('INV-' || nextval('invoice_number_seq')),
    client_id      UUID REFERENCES clients(id),
    booking_id     UUID REFERENCES bookings(id),
    status         VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    amount         DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_amount     DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_amount   DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_percent    DECIMAL(5, 2) NOT NULL DEFAULT 0,
    currency       VARCHAR(3) NOT NULL DEFAULT 'USD',
    due_date       DATE,
    paid_at        TIMESTAMP WITH TIME ZONE,
    items          JSONB,
    notes          TEXT,
    created_by_id  UUID REFERENCES users(id),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_client  ON invoices(client_id);
CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_status  ON invoices(status);
CREATE INDEX idx_invoices_due     ON invoices(due_date) WHERE status IN ('SENT', 'OVERDUE');
