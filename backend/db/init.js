// Initialize database tables if they don't exist
const db = require('./connection');

async function initDatabase() {
  try {
    console.log('Checking database tables...');

    // Create responses table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS responses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id VARCHAR(128) NOT NULL,
        rgb_r TINYINT UNSIGNED NOT NULL,
        rgb_g TINYINT UNSIGNED NOT NULL,
        rgb_b TINYINT UNSIGNED NOT NULL,
        hex VARCHAR(7) NOT NULL,
        user_classification ENUM('pink', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'black', 'white', 'grey') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        classified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session (session_id),
        INDEX idx_rgb (rgb_r, rgb_g, rgb_b)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

module.exports = { initDatabase };
