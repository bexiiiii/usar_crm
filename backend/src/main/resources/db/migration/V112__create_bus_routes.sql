CREATE TABLE bus_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES bus_fleet(id) ON DELETE CASCADE,
    route_name VARCHAR(255) NOT NULL,
    driver_id UUID REFERENCES drivers(id),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    route_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bus_routes_bus_id ON bus_routes(bus_id);
CREATE INDEX idx_bus_routes_driver_id ON bus_routes(driver_id);
CREATE INDEX idx_bus_routes_route_date ON bus_routes(route_date);
CREATE INDEX idx_bus_routes_composite ON bus_routes(bus_id, route_date);
