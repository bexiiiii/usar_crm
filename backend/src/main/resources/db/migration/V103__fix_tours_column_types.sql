-- Fix column type mismatch: hotel_stars was SMALLINT but entity maps to INTEGER
ALTER TABLE tours ALTER COLUMN hotel_stars TYPE INTEGER USING hotel_stars::INTEGER;
