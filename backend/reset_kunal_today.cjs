const { Client } = require('pg');

const client = new Client({
  connectionString: 'Host=localhost;Port=5432;Database=NavbharatAgroDB_akanksha;Username=postgres;Password=postgres;'
});

async function reset() {
  await client.connect();
  const res = await client.query("DELETE FROM \"AttendanceRecords\" WHERE \"EmployeeId\" = 1 AND \"AttendanceDate\" = '2026-09-07'");
  console.log("Deleted today's attendance record for Kunal:", res.rowCount);
  await client.end();
}

reset().catch(console.error);
