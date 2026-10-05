const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'NavbharatAgroDB',
  password: 'postgres',
  port: 5432,
});

async function resetKm() {
  try {
    await client.connect();
    console.log("Connected to database...");
    
    // Update the TodayTravelledDistance for all employees to 0
    const res = await client.query('UPDATE "Employees" SET "TodayTravelledDistance" = 0');
    console.log(`Successfully reset TodayTravelledDistance to 0 for ${res.rowCount} employees.`);
    
  } catch (err) {
    console.error("Error resetting distance:", err);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

resetKm();
