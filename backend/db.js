const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'form',
  waitForConnections: true,
  connectionLimit: 10,
};

async function createPoolAndMigrate() {
  const bootstrap = await mysql.createConnection({
    host: DB_CONFIG.host,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  });

  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\``);
  await bootstrap.end();

  const pool = await mysql.createPool(DB_CONFIG);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      university ENUM('Graphic Era Deemed to be University', 'Graphic Era Hill University') NOT NULL,
      enrollment_number VARCHAR(100) NOT NULL,
      contact_number VARCHAR(50) NOT NULL,
      apple_devices JSON,
      cgpa DECIMAL(4,2) NOT NULL,
      active_backlogs ENUM('none', '1 backlog', '2 or more backlogs'),
      programming_skills JSON,
      other_languages TEXT,
      leetcode_rank VARCHAR(100),
      leetcode_link VARCHAR(255),
      hackerrank_rank VARCHAR(100),
      hackerrank_link VARCHAR(255),
      github_link VARCHAR(255),
      hackathons_participated TINYINT(1),
      hackathon_details TEXT,
      projects_done TINYINT(1),
      project_details TEXT,
      entrepreneurship_programs TINYINT(1),
      entrepreneurship_details TEXT,
      other_skill_building TINYINT(1),
      other_skill_details TEXT,
      special_skills TEXT,
      awards TEXT,
      plan_after_graduation ENUM('Job/Placement', 'Further studies', 'Entrepreneurship/New Venture or Startup', 'Other'),
      plan_other TEXT,
      motivation TEXT,
      resume_path VARCHAR(512),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure new columns exist when table was created before they were added
  await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_path VARCHAR(512)`);

  return pool;
}

module.exports = { createPoolAndMigrate, DB_CONFIG };
