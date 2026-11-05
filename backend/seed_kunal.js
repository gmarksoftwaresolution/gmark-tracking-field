const { Client } = require('pg');

async function seedKunal() {
  const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'NavbharatAgroDB',
    password: 'postgres',
    port: 4321,
  });

  await client.connect();

  try {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDateObj = new Date(now.getTime() + istOffset);
    const todayIstStr = istDateObj.toISOString().split('T')[0];

    const kunalId = 1;

    // 1. Update Kunal trip status, today distance (3.8 km), live location (Cyber Chowk, Kolhapur)
    const tripStartUtc = new Date(now.getTime() - 85 * 60 * 1000).toISOString();
    const lastPingUtc = new Date(now.getTime() - 25 * 1000).toISOString();

    await client.query(`
      UPDATE "Employees"
      SET "SelectedRouteCode" = 'K001',
          "AssignedArea" = 'Kolhapur',
          "TripStatus" = 'Started',
          "TripStartTime" = $1,
          "TripEndTime" = NULL,
          "TodayTravelledDistance" = 3800,
          "BatteryLevel" = 92,
          "LastLatitude" = 16.6850,
          "LastLongitude" = 74.2480,
          "LastKnownAddress" = 'Cyber Chowk, Rajarampuri, Kolhapur, Maharashtra',
          "LastLocationTimestamp" = $2,
          "LastMovementTimestamp" = $2,
          "DeviceChangeStatus" = NULL,
          "PendingDeviceId" = NULL
      WHERE "Id" = $3
    `, [tripStartUtc, lastPingUtc, kunalId]);

    // 2. Ensure Route K001 exists in RouteMasters
    await client.query(`
      INSERT INTO "RouteMasters" ("RouteCode", "RouteName", "DayOfWeek", "AssignedEmployeeId", "IsActive", "CreatedAt")
      VALUES ('K001', 'Bindu Chowk → Cyber Chowk (Kolhapur)', 'Wednesday', $1, true, NOW())
      ON CONFLICT DO NOTHING
    `, [kunalId]);

    await client.query(`
      UPDATE "RouteMasters"
      SET "RouteName" = 'Bindu Chowk → Cyber Chowk (Kolhapur)',
          "AssignedEmployeeId" = $1,
          "IsActive" = true
      WHERE "RouteCode" = 'K001'
    `, [kunalId]);

    // 3. Clear today's old test breadcrumbs for Kunal
    await client.query(`
      DELETE FROM "LocationHistories"
      WHERE "EmployeeId" = $1
    `, [kunalId]);

    // Kolhapur road waypoints
    const waypoints = [
      { lat: 16.6975, lng: 74.2235, minsAgo: 80 }, // Bindu Chowk
      { lat: 16.6962, lng: 74.2255, minsAgo: 70 },
      { lat: 16.6950, lng: 74.2280, minsAgo: 60 }, // Shivaji Chowk
      { lat: 16.6938, lng: 74.2305, minsAgo: 50 },
      { lat: 16.6920, lng: 74.2340, minsAgo: 40 }, // Station Road
      { lat: 16.6905, lng: 74.2375, minsAgo: 30 },
      { lat: 16.6890, lng: 74.2410, minsAgo: 20 }, // Dabholkar Corner
      { lat: 16.6872, lng: 74.2445, minsAgo: 10 },
      { lat: 16.6850, lng: 74.2480, minsAgo: 1 }   // Cyber Chowk
    ];

    for (const wp of waypoints) {
      const wpTime = new Date(now.getTime() - wp.minsAgo * 60 * 1000).toISOString();
      await client.query(`
        INSERT INTO "LocationHistories" ("EmployeeId", "Latitude", "Longitude", "Timestamp")
        VALUES ($1, $2, $3, $4)
      `, [kunalId, wp.lat, wp.lng, wpTime]);
    }

    // 4. Seed Field Visits for Kunal for today
    await client.query(`
      DELETE FROM "FieldVisits"
      WHERE "EmployeeId" = $1 AND "VisitDate" = $2
    `, [kunalId, todayIstStr]);

    await client.query(`
      INSERT INTO "FieldVisits" 
        ("EmployeeId", "Route", "CustomerName", "Village", "MobileNumber", "CustomerCategory", "ShortNote", "Latitude", "Longitude", "VisitDate", "VisitTime")
      VALUES
        ($1, 'Bindu Chowk → Cyber Chowk', 'Shetkari Sahakari Sangh', 'Kolhapur', '9822998877', 'Dealer', 'Discussed micro-fertilizer bulk stock order', 16.6950, 74.2280, $2, '09:15:00')
    `, [kunalId, todayIstStr]);

    // 5. Seed Order Booking for Kunal for today
    await client.query(`
      DELETE FROM "OrderBookings"
      WHERE "EmployeeId" = $1 AND "BookingDate" = $2
    `, [kunalId, todayIstStr]);

    const orderRes = await client.query(`
      INSERT INTO "OrderBookings"
        ("EmployeeId", "Route", "CustomerName", "Village", "MobileNumber", "CustomerCategory", "OrderStatus", "GrandTotal", "BookingDate", "BookingTime", "Latitude", "Longitude")
      VALUES
        ($1, 'Bindu Chowk → Cyber Chowk', 'Rajarampuri Agro Traders', 'Kolhapur', '9850443322', 'Dealer', 'Delivered', 22500.00, $2, '10:30:00', 16.6850, 74.2480)
      RETURNING "Id"
    `, [kunalId, todayIstStr]);
    const orderId = orderRes.rows[0].Id;

    await client.query(`
      INSERT INTO "OrderProducts" ("OrderBookingId", "ProductName", "Quantity", "UnitPrice", "RowTotal")
      VALUES ($1, 'Crop Shield Fungicide (500ml)', 15, 1500.00, 22500.00)
    `, [orderId]);

    console.log('✓ Successfully seeded Kunal with Kolhapur route, 9 GPS waypoints, field visit, and order booking!');
  } catch (err) {
    console.error('Error seeding Kunal:', err);
  } finally {
    await client.end();
  }
}

seedKunal();

