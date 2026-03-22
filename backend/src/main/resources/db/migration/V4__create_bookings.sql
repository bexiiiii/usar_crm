CREATE SEQUENCE booking_number_seq START 1;

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    lead_id UUID REFERENCES leads(id),
    client_id UUID REFERENCES clients(id) NOT NULL,
    assigned_manager_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    type VARCHAR(50) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    departure_city VARCHAR(100),
    departure_date DATE NOT NULL,
    return_date DATE,
    pax_adults INT DEFAULT 1,
    pax_children INT DEFAULT 0,
    hotel_name VARCHAR(255),
    hotel_stars INT,
    meal_plan VARCHAR(50),
    flight_number VARCHAR(50),
    tour_operator VARCHAR(255),
    supplier_ref VARCHAR(255),
    total_price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    supplier_payment_deadline DATE,
    supplier_paid BOOLEAN DEFAULT false,
    notes TEXT,
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_departure ON bookings(departure_date);
CREATE INDEX idx_bookings_manager ON bookings(assigned_manager_id);
CREATE INDEX idx_bookings_number ON bookings(booking_number);
