-- EV Exec Airport Transfer Calendar — PostgreSQL Schema
-- Compatible with Supabase (enable RLS as required)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────
-- Drivers
-- ──────────────────────────────────────────
CREATE TABLE drivers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(120)  NOT NULL,
  phone          VARCHAR(20)   NOT NULL,
  email          VARCHAR(255)  NOT NULL UNIQUE,
  vehicle_details JSONB        NOT NULL DEFAULT '{}',
  -- e.g. { "make": "Tesla", "model": "Model S", "reg": "EV23 XEC", "colour": "Midnight Silver" }
  status         VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- Bookings
-- ──────────────────────────────────────────
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pickup_datetime   TIMESTAMPTZ   NOT NULL,
  customer_name     VARCHAR(120)  NOT NULL,
  customer_phone    VARCHAR(20)   NOT NULL,
  customer_email    VARCHAR(255),
  pickup_address    TEXT          NOT NULL,
  dropoff_address   TEXT          NOT NULL,
  passenger_count   SMALLINT      NOT NULL DEFAULT 1 CHECK (passenger_count BETWEEN 1 AND 16),
  luggage_count     SMALLINT      NOT NULL DEFAULT 0 CHECK (luggage_count >= 0),
  flight_number     VARCHAR(12),
  terminal          VARCHAR(20),
  status            VARCHAR(25)   NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                      'pending',
                      'assigned',
                      'dispatched',
                      'at_airport',
                      'passenger_on_board',
                      'completed',
                      'cancelled'
                    )),
  driver_id         UUID REFERENCES drivers(id) ON DELETE SET NULL,
  price             NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_pickup_datetime ON bookings (pickup_datetime);
CREATE INDEX idx_bookings_driver_id       ON bookings (driver_id);
CREATE INDEX idx_bookings_status          ON bookings (status);

-- ──────────────────────────────────────────
-- Flight Logs
-- ──────────────────────────────────────────
CREATE TABLE flight_logs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  standard_arrival_time TIMESTAMPTZ NOT NULL,
  estimated_arrival_time TIMESTAMPTZ NOT NULL,
  actual_arrival_time   TIMESTAMPTZ,
  flight_status         VARCHAR(12) NOT NULL DEFAULT 'scheduled'
                        CHECK (flight_status IN ('scheduled','delayed','landed','cancelled')),
  last_updated          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flight_logs_booking_id ON flight_logs (booking_id);

-- ──────────────────────────────────────────
-- Auto-update updated_at on bookings / drivers
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
