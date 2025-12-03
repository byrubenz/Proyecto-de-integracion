-- Add is_paid flag for paid access
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_paid TINYINT(1) NOT NULL DEFAULT 0;
