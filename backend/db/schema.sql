CREATE TABLE IF NOT EXISTS colors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rgb_r TINYINT UNSIGNED NOT NULL,
  rgb_g TINYINT UNSIGNED NOT NULL,
  rgb_b TINYINT UNSIGNED NOT NULL,
  hex VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rgb (rgb_r, rgb_g, rgb_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  language VARCHAR(50),
  expires BIGINT UNSIGNED NOT NULL,
  data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS responses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(128) NOT NULL,
  color_id INT NOT NULL,
  user_classification ENUM('pink', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'black', 'white', 'grey') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
  INDEX idx_session (session_id),
  INDEX idx_color (color_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
