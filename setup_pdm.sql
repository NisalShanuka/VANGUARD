CREATE TABLE IF NOT EXISTS pdm_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_name VARCHAR(255) NOT NULL,
  price FLOAT NOT NULL,
  status ENUM('pending', 'completed', 'declined') DEFAULT 'pending',
  is_preorder BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE application_users MODIFY COLUMN role ENUM('user', 'admin', 'dealer') DEFAULT 'user';
