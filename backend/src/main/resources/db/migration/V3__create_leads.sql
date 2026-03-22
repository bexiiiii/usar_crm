CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    title VARCHAR(255) NOT NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'NEW',
    source VARCHAR(100),
    destination VARCHAR(255),
    travel_dates_from DATE,
    travel_dates_to DATE,
    pax_adults INT DEFAULT 1,
    pax_children INT DEFAULT 0,
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    assigned_manager_id UUID REFERENCES users(id),
    lost_reason VARCHAR(255),
    probability INT DEFAULT 50,
    expected_close_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_manager ON leads(assigned_manager_id);
CREATE INDEX idx_leads_client ON leads(client_id);
