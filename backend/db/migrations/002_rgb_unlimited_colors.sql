-- Migration 002: Add RGB columns to responses table for unlimited color collection
-- This allows storing any RGB color without pre-seeding the colors table
--
-- IMPORTANT: MySQL DDL statements are NOT transactional. Each ALTER TABLE commits immediately.
-- If this migration fails partway through, manual intervention will be required.
-- Always backup your database before running migrations.

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

-- Step 3: Validate backfill completed successfully
-- Run this query and verify the result is 0 before proceeding:
SELECT COUNT(*) as missing_values
FROM responses
WHERE rgb_r_new IS NULL OR rgb_g_new IS NULL OR rgb_b_new IS NULL OR hex_new IS NULL;
-- Expected result: 0 rows with missing values
-- If count > 0, investigate before proceeding with the migration

-- Enforce validation - fail migration if NULL values found
SET @null_count = (SELECT COUNT(*) FROM responses WHERE rgb_r_new IS NULL OR rgb_g_new IS NULL OR rgb_b_new IS NULL OR hex_new IS NULL);

-- Enforce validation - fail migration if NULL values found
DELIMITER $$
CREATE PROCEDURE check_validation()
BEGIN
  IF @null_count > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Backfill validation failed: NULL values found';
  END IF;
END$$
DELIMITER ;

CALL check_validation();
DROP PROCEDURE check_validation;

-- Step 4: Make columns NOT NULL (now that backfill is complete)
ALTER TABLE responses
  MODIFY COLUMN rgb_r_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN rgb_g_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN rgb_b_new TINYINT UNSIGNED NOT NULL,
  MODIFY COLUMN hex_new VARCHAR(7) NOT NULL;

-- Step 5: Drop FK constraint and color_id column
-- IMPORTANT: Verify the actual FK constraint name before running this migration.
-- The constraint name may vary depending on how the database was created.
-- To find the actual constraint name, run:
--   SELECT CONSTRAINT_NAME
--   FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
--   WHERE TABLE_SCHEMA = DATABASE()
--     AND TABLE_NAME = 'responses'
--     AND COLUMN_NAME = 'color_id'
--     AND REFERENCED_TABLE_NAME = 'colors';
--
-- Common names: responses_ibfk_2, fk_responses_color_id, responses_color_id_fk
-- Update the DROP FOREIGN KEY statement below with the actual constraint name.

-- Query for FK constraint name dynamically
SET @fk_name = (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'responses'
    AND COLUMN_NAME = 'color_id'
    AND REFERENCED_TABLE_NAME = 'colors'
  LIMIT 1
);

-- Verify FK constraint was found
DELIMITER $$
CREATE PROCEDURE check_fk_constraint()
BEGIN
  IF @fk_name IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FK constraint not found on responses.color_id';
  END IF;
END$$
DELIMITER ;

CALL check_fk_constraint();
DROP PROCEDURE check_fk_constraint;

-- Drop the FK constraint using dynamic SQL
SET @sql = CONCAT('ALTER TABLE responses DROP FOREIGN KEY ', @fk_name);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop the color_id column
ALTER TABLE responses
  DROP COLUMN color_id;

-- Step 6: Rename new columns to final names
ALTER TABLE responses
  CHANGE COLUMN rgb_r_new rgb_r TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN rgb_g_new rgb_g TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN rgb_b_new rgb_b TINYINT UNSIGNED NOT NULL,
  CHANGE COLUMN hex_new hex VARCHAR(7) NOT NULL;

-- Step 7: Add index for RGB lookups
ALTER TABLE responses
  ADD INDEX idx_rgb (rgb_r, rgb_g, rgb_b);

-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================
-- WARNING: This rollback script will result in data loss for any responses
-- created after this migration (i.e., responses with RGB values not in colors table).
--
-- To rollback this migration:
--
-- 1. Drop the RGB index
-- ALTER TABLE responses DROP INDEX idx_rgb;
--
-- 2. Rename columns back to temporary names
-- ALTER TABLE responses
--   CHANGE COLUMN rgb_r rgb_r_old TINYINT UNSIGNED NOT NULL,
--   CHANGE COLUMN rgb_g rgb_g_old TINYINT UNSIGNED NOT NULL,
--   CHANGE COLUMN rgb_b rgb_b_old TINYINT UNSIGNED NOT NULL,
--   CHANGE COLUMN hex hex_old VARCHAR(7) NOT NULL;
--
-- 3. Re-add color_id column (nullable for backfill)
-- ALTER TABLE responses
--   ADD COLUMN color_id INT AFTER session_id;
--
-- 4. Backfill color_id from colors table where matching RGB exists
-- UPDATE responses r
-- JOIN colors c ON r.rgb_r_old = c.rgb_r
--   AND r.rgb_g_old = c.rgb_g
--   AND r.rgb_b_old = c.rgb_b
-- SET r.color_id = c.id;
--
-- 5. Verify all rows have color_id (any NULL values indicate data that can't be restored)
-- SELECT COUNT(*) as orphaned_responses FROM responses WHERE color_id IS NULL;
-- If count > 0, you must either:
--   a) Delete these responses (data loss), or
--   b) Insert matching colors into colors table, then re-run step 4
--
-- 6. Make color_id NOT NULL and re-add FK constraint
-- ALTER TABLE responses
--   MODIFY COLUMN color_id INT NOT NULL;
--
-- Query for FK constraint to restore
-- SET @fk_restore_name = CONCAT('fk_responses_color_id_', UNIX_TIMESTAMP());
-- SET @sql_restore = CONCAT(
--   'ALTER TABLE responses ADD CONSTRAINT ', @fk_restore_name,
--   ' FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE'
-- );
-- PREPARE stmt_restore FROM @sql_restore;
-- EXECUTE stmt_restore;
-- DEALLOCATE PREPARE stmt_restore;
--
-- 7. Drop old RGB columns
-- ALTER TABLE responses
--   DROP COLUMN rgb_r_old,
--   DROP COLUMN rgb_g_old,
--   DROP COLUMN rgb_b_old,
--   DROP COLUMN hex_old;
--
-- 8. Re-add index on color_id
-- ALTER TABLE responses ADD INDEX idx_color (color_id);
