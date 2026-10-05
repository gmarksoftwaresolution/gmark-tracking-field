const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'NavbharatAgroDB',
  user: 'postgres',
  password: 'postgres',
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to database.");

    const query = `
      ALTER TABLE "Employees" ADD COLUMN IF NOT EXISTS "DeviceId" text NULL;
      ALTER TABLE "Employees" ADD COLUMN IF NOT EXISTS "PendingDeviceId" text NULL;
      ALTER TABLE "Employees" ADD COLUMN IF NOT EXISTS "DeviceChangeStatus" text NULL;
      ALTER TABLE "Employees" ADD COLUMN IF NOT EXISTS "BatteryLevel" integer NULL;
    `;

    await client.query(query);
    console.log("Columns added successfully.");

  } catch (err) {
    console.error("Error executing query", err.stack);
  } finally {
    await client.end();
  }
}

main();
