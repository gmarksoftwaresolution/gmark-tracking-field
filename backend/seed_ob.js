const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: 'localhost', database: 'NavbharatAgroDB', password: 'postgres', port: 5432 });

async function seed() {
  await client.connect();
  
  // Get Field Visits for 06-09-2026
  const fvRes = await client.query("SELECT * FROM \"FieldVisits\" WHERE \"VisitDate\" = '2026-09-06'");
  const fieldVisits = fvRes.rows;
  
  console.log(`Found ${fieldVisits.length} Field Visits for 2026-09-06`);
  
  for (const fv of fieldVisits) {
    // Offset slightly so they don't exactly overlap the field visit
    const lat = parseFloat(fv.Latitude) + 0.0005;
    const lng = parseFloat(fv.Longitude) + 0.0005;
    
    // Convert name back to Order Booking name (e.g. Fake Customer Nesari 2 -> Fake Customer Nesari 2 Order)
    const name = fv.CustomerName + ' Order';
    
    // Insert Order Booking
    await client.query(`
      INSERT INTO "OrderBookings" 
      ("EmployeeId", "Route", "CustomerName", "MobileNumber", "GrandTotal", "BookingDate", "BookingTime", "Latitude", "Longitude", "OrderStatus")
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending')
    `, [
      fv.EmployeeId,
      'Test Route',
      name,
      '9999999999',
      1000,
      '2026-09-06',
      fv.VisitTime,
      lat,
      lng
    ]);
    console.log(`Inserted OrderBooking for ${name}`);
  }
  
  await client.end();
}

seed().catch(console.error);
