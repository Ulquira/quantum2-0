import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'phx-win-mysql-9508.mysql.database.azure.com',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'bd_quantum2_test',
  port: Number(process.env.DB_PORT) || 3306,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
});
