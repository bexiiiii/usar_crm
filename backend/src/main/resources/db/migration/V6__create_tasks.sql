CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'TODO',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    related_booking_id UUID REFERENCES bookings(id),
    related_client_id UUID REFERENCES clients(id),
    related_lead_id UUID REFERENCES leads(id),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned ON tasks(assigned_to) WHERE status != 'DONE';
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE status = 'TODO';
CREATE INDEX idx_tasks_status ON tasks(status);
