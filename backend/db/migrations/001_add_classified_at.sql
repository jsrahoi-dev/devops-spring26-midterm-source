-- Add timestamp to track when classifications occur
-- Step 1: Add column as nullable initially
ALTER TABLE responses
ADD COLUMN classified_at TIMESTAMP NULL;

-- Step 2: Backfill existing rows with created_at (best available historical data)
UPDATE responses
SET classified_at = created_at
WHERE classified_at IS NULL;

-- Step 3: Make column NOT NULL with default for new rows
ALTER TABLE responses
MODIFY COLUMN classified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 4: Add index for first-to-classify queries
CREATE INDEX idx_classified_at ON responses(color_id, classified_at);

-- To rollback this migration:
-- DROP INDEX idx_classified_at ON responses;
-- ALTER TABLE responses DROP COLUMN classified_at;
