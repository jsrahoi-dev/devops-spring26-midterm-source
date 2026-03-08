-- Migration 002: Add RGB columns to responses table for unlimited color collection
-- This allows storing any RGB color without pre-seeding the colors table

-- Step 1: Add RGB columns (nullable initially for backfill)
ALTER TABLE responses
  ADD COLUMN rgb_r_new TINYINT UNSIGNED AFTER session_id,
  ADD COLUMN rgb_g_new TINYINT UNSIGNED AFTER rgb_r_new,
  ADD COLUMN rgb_b_new TINYINT UNSIGNED AFTER rgb_g_new,
  ADD COLUMN hex_new VARCHAR(7) AFTER rgb_b_new;

-- Step 2: Backfill from colors table
UPDATE responses r
JOIN colors c ON r.color_id = c.id
SET r.rgb_r_new = c.rgb_r,
    r.rgb_g_new = c.rgb_g,
    r.rgb_b_new = c.rgb_b,
    r.hex_new = c.hex;

-- Step 3: Make columns NOT NULL (now that backfill is complete)
ALTER TABLE responses
  MODIFY COLUMN rgb_r_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN rgb_g_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN rgb_b_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN hex_new VARCHAR(7) NOT NULL;

-- Step 4: Drop FK constraint and color_id column
ALTER TABLE responses
  DROP FOREIGN KEY responses_ibfk_2;

ALTER TABLE responses
  DROP COLUMN color_id;

-- Step 5: Rename new columns to final names
ALTER TABLE responses
  CHANGE COLUMN rgb_r_new rgb_r TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN rgb_g_new rgb_g TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN rgb_b_new rgb_b TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN hex_new hex VARCHAR(7) NOT NULL;

-- Step 6: Add index for RGB lookups
ALTER TABLE responses
  ADD INDEX idx_rgb (rgb_r, rgb_g, rgb_b);

-- Rollback script (if needed):
-- ALTER TABLE responses DROP INDEX idx_rgb;
-- ALTER TABLE responses ADD COLUMN color_id INT;
-- ALTER TABLE responses ADD FOREIGN KEY (color_id) REFERENCES colors(id);
-- ALTER TABLE responses DROP COLUMN rgb_r, DROP COLUMN rgb_g, DROP COLUMN rgb_b, DROP COLUMN hex;
