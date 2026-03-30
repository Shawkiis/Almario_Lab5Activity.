import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

export interface Database {
    User: any; 
}

export const db: Database = {} as Database;

export async function initialize(): Promise<void> {
    const { host, port, user, password, database } = config.database;

    // 1. Create database if it doesn't exist
    // Using the config values to ensure we connect to the right instance
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();

    // 2. Connect to database with Sequelize
    const sequelize = new Sequelize(database, user, password, { 
        host, 
        port, 
        dialect: 'mysql',
        logging: false // Optional: set to console.log to see SQL queries in terminal
    });

    // 3. Initialize models
    // Removed the '.js' extension and ensured the path is relative to this file
    const modelModule = await import('./users/user.model'); 
    
    // 4. Attach the initialized model to the global db object
    // This allows userService.ts to access db.User.findAll(), etc.
    db.User = modelModule.default(sequelize); 

    // 5. Sync models with database
    // 'alter: true' will update tables if you change the model later
    await sequelize.sync({ alter: true });

    console.log('✅ Database initialized and models synced');
}