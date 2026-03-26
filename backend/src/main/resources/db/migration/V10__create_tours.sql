CREATE TABLE tours (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    country       VARCHAR(100) NOT NULL,
    resort        VARCHAR(100),
    hotel_name    VARCHAR(255),
    hotel_stars   SMALLINT,
    tour_operator VARCHAR(100),
    category      VARCHAR(50) NOT NULL DEFAULT 'BEACH',
    departure_city VARCHAR(100),
    duration_days  INT NOT NULL DEFAULT 7,
    meal_plan     VARCHAR(20),
    transport     VARCHAR(30) NOT NULL DEFAULT 'AIR',
    price_netto   DECIMAL(12, 2) NOT NULL DEFAULT 0,
    price_brutto  DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency      VARCHAR(3) NOT NULL DEFAULT 'USD',
    max_seats     INT,
    booked_seats  INT NOT NULL DEFAULT 0,
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    image_url     VARCHAR(500),
    departure_date DATE,
    return_date    DATE,
    visa_required      BOOLEAN NOT NULL DEFAULT FALSE,
    insurance_included BOOLEAN NOT NULL DEFAULT FALSE,
    notes         TEXT,
    created_by_id UUID REFERENCES users(id),
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tours_status   ON tours(status);
CREATE INDEX idx_tours_country  ON tours(country);
CREATE INDEX idx_tours_category ON tours(category);
CREATE INDEX idx_tours_departure ON tours(departure_date);
CREATE INDEX idx_tours_operator  ON tours(tour_operator);
