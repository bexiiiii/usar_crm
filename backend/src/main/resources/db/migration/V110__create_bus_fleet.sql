CREATE TABLE bus_fleet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_number VARCHAR(50) NOT NULL UNIQUE,
    bus_type VARCHAR(20) NOT NULL CHECK (bus_type IN ('BUS', 'MICROBUS')),
    capacity INTEGER NOT NULL,
    driver_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bus_fleet_bus_number ON bus_fleet(bus_number);
CREATE INDEX idx_bus_fleet_bus_type ON bus_fleet(bus_type);
