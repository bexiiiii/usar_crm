-- Recalculate client totalBookings and totalRevenue from actual bookings
-- Count all non-cancelled bookings per client
UPDATE clients c SET
    total_bookings = (
        SELECT COUNT(*) FROM bookings b
        WHERE b.client_id = c.id AND b.status != 'CANCELLED'
    ),
    total_revenue = (
        SELECT COALESCE(SUM(b.total_price), 0) FROM bookings b
        WHERE b.client_id = c.id AND b.status != 'CANCELLED'
    );
