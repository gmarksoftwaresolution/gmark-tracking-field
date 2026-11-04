const { Client } = require('pg');

async function runOnPort(port) {
  const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'NavbharatAgroDB',
    password: 'postgres',
    port: port,
  });

  try {
    await client.connect();
    console.log(`Connected to database on port ${port}...`);
    
    // 1. Reset TodayTravelledDistance to 0 for all employees whose trip is not actively Started
    const res1 = await client.query('UPDATE "Employees" SET "TodayTravelledDistance" = 0 WHERE "TripStatus" != \'Started\' OR "TripStartTime" IS NULL');
    console.log(`Reset TodayTravelledDistance for ${res1.rowCount} employees.`);
    
    // 2. Clear stale/test coordinates so Nesari doesn't show
    const res2 = await client.query('UPDATE "Employees" SET "LastLatitude" = NULL, "LastLongitude" = NULL, "LastKnownAddress" = NULL, "LastLocationTimestamp" = NULL WHERE "TripStatus" != \'Started\'');
    console.log(`Cleared stale coordinates for ${res2.rowCount} employees.`);
    
    // 3. Clear old location histories from test runs
    const res3 = await client.query('DELETE FROM "LocationHistories"');
    console.log(`Cleared ${res3.rowCount} old LocationHistories.`);

    await client.end();
    return true;
  } catch (err) {
    console.log(`Port ${port} failed: ${err.message}`);
    return false;
  }
}

async function main() {
  const ok4321 = await runOnPort(4321);
  if (!ok4321) {
    await runOnPort(5432);
  }
}

main();
