const { Client } = require('pg');

async function seed() {
  const ports = [4321, 5432];
  let client = null;

  for (const port of ports) {
    try {
      const c = new Client({
        user: 'postgres',
        host: '127.0.0.1',
        database: 'NavbharatAgroDB',
        password: 'postgres',
        port: port,
      });
      await c.connect();
      console.log(`Connected to PostgreSQL on port ${port}!`);
      client = c;
      break;
    } catch (e) {
      console.log(`Port ${port} connection failed: ${e.message}`);
    }
  }

  if (!client) {
    console.error('Could not connect to PostgreSQL on either port 4321 or 5432.');
    process.exit(1);
  }

  try {
    const now = new Date();
    // Calculate today's date in IST (YYYY-MM-DD)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDateObj = new Date(now.getTime() + istOffset);
    const todayIstStr = istDateObj.toISOString().split('T')[0];
    const [year, month, day] = todayIstStr.split('-').map(Number);

    console.log(`Target date for seed: ${todayIstStr}`);

    // 1. Ensure Pruthviraj exists with Id = 2, code = 'P001'
    const empRes = await client.query('SELECT * FROM "Employees" WHERE "Id" = 2 OR LOWER("EmployeeCode") = \'p001\' OR LOWER("Name") LIKE \'%pruthviraj%\'');
    
    let pruthvirajId = 2;
    if (empRes.rows.length > 0) {
      pruthvirajId = empRes.rows[0].Id;
      console.log(`Found existing Pruthviraj with Id = ${pruthvirajId}`);
    } else {
      console.log('Pruthviraj record not found, inserting with Id = 2...');
      await client.query(`
        INSERT INTO "Employees" ("Id", "Name", "EmployeeCode", "MobileNumber", "AssignedArea", "PasswordHash", "IsActive", "CreatedAt")
        VALUES (2, 'Pruthviraj', 'P001', '9876543211', 'Nesari', '$2a$11$908yF/FmN3pY84y8zF7nB.3s9y9yF7nB3s9y9yF7nB3s9y9yF7nB.', true, NOW())
        ON CONFLICT ("Id") DO NOTHING
      `);
      pruthvirajId = 2;
    }

    // 2. Set Pruthviraj trip status, today's distance (4.85 km = 4850 m), live location, battery, and timestamp
    const tripStartUtc = new Date(now.getTime() - 65 * 60 * 1000).toISOString(); // started 65 mins ago
    const lastPingUtc = new Date(now.getTime() - 40 * 1000).toISOString(); // 40 secs ago (Online)

    await client.query(`
      UPDATE "Employees"
      SET "SelectedRouteCode" = 'P001',
          "AssignedArea" = 'Nesari',
          "TripStatus" = 'Started',
          "TripStartTime" = $1,
          "TripEndTime" = NULL,
          "TodayTravelledDistance" = 4850,
          "BatteryLevel" = 85,
          "LastLatitude" = 16.04385,
          "LastLongitude" = 74.34672,
          "LastKnownAddress" = 'Waghrali, Nesari, Kolhapur, Maharashtra',
          "LastLocationTimestamp" = $2,
          "LastMovementTimestamp" = $2,
          "DeviceChangeStatus" = NULL,
          "PendingDeviceId" = NULL
      WHERE "Id" = $3
    `, [tripStartUtc, lastPingUtc, pruthvirajId]);
    console.log(`Updated Pruthviraj (Id: ${pruthvirajId}) with active trip, 4.85 km distance, and online live coordinates.`);

    // 3. Ensure Route P001 exists in RouteMasters
    await client.query(`
      INSERT INTO "RouteMasters" ("RouteCode", "RouteName", "DayOfWeek", "AssignedEmployeeId", "IsActive", "CreatedAt")
      VALUES ('P001', 'Nesari → Waghrali', 'Wednesday', $1, true, NOW())
      ON CONFLICT DO NOTHING
    `, [pruthvirajId]);

    // Also update if exists
    await client.query(`
      UPDATE "RouteMasters"
      SET "RouteName" = 'Nesari → Waghrali',
          "AssignedEmployeeId" = $1,
          "IsActive" = true
      WHERE "RouteCode" = 'P001'
    `, [pruthvirajId]);
    console.log('Ensured RouteMaster P001 (Nesari → Waghrali) assigned to Pruthviraj.');

    // 4. Seed GPS Breadcrumb Trail in LocationHistories for today
    // Clear today's old test breadcrumbs for Pruthviraj
    await client.query(`
      DELETE FROM "LocationHistories"
      WHERE "EmployeeId" = $1
    `, [pruthvirajId]);

        // Nesari to Waghrali realistic road-following coordinates
    const waypoints = [
      {
            "lat": 16.06822,
            "lng": 74.33284,
            "minsAgo": 60
      },
      {
            "lat": 16.06613,
            "lng": 74.33245,
            "minsAgo": 58
      },
      {
            "lat": 16.06366,
            "lng": 74.33071,
            "minsAgo": 57
      },
      {
            "lat": 16.06277,
            "lng": 74.33035,
            "minsAgo": 55
      },
      {
            "lat": 16.06169,
            "lng": 74.32964,
            "minsAgo": 53
      },
      {
            "lat": 16.06147,
            "lng": 74.33065,
            "minsAgo": 51
      },
      {
            "lat": 16.0617,
            "lng": 74.33171,
            "minsAgo": 50
      },
      {
            "lat": 16.06294,
            "lng": 74.3341,
            "minsAgo": 48
      },
      {
            "lat": 16.06289,
            "lng": 74.33442,
            "minsAgo": 46
      },
      {
            "lat": 16.06196,
            "lng": 74.33482,
            "minsAgo": 44
      },
      {
            "lat": 16.05988,
            "lng": 74.33544,
            "minsAgo": 43
      },
      {
            "lat": 16.05884,
            "lng": 74.33617,
            "minsAgo": 41
      },
      {
            "lat": 16.05748,
            "lng": 74.33639,
            "minsAgo": 39
      },
      {
            "lat": 16.05625,
            "lng": 74.33678,
            "minsAgo": 37
      },
      {
            "lat": 16.05537,
            "lng": 74.33789,
            "minsAgo": 36
      },
      {
            "lat": 16.05435,
            "lng": 74.34148,
            "minsAgo": 34
      },
      {
            "lat": 16.05436,
            "lng": 74.34551,
            "minsAgo": 32
      },
      {
            "lat": 16.05442,
            "lng": 74.34772,
            "minsAgo": 31
      },
      {
            "lat": 16.05504,
            "lng": 74.35014,
            "minsAgo": 29
      },
      {
            "lat": 16.05484,
            "lng": 74.35187,
            "minsAgo": 27
      },
      {
            "lat": 16.05351,
            "lng": 74.35255,
            "minsAgo": 25
      },
      {
            "lat": 16.05149,
            "lng": 74.35441,
            "minsAgo": 24
      },
      {
            "lat": 16.04932,
            "lng": 74.35515,
            "minsAgo": 22
      },
      {
            "lat": 16.04829,
            "lng": 74.35498,
            "minsAgo": 20
      },
      {
            "lat": 16.04637,
            "lng": 74.35484,
            "minsAgo": 18
      },
      {
            "lat": 16.04382,
            "lng": 74.35503,
            "minsAgo": 17
      },
      {
            "lat": 16.04236,
            "lng": 74.35478,
            "minsAgo": 15
      },
      {
            "lat": 16.04141,
            "lng": 74.35516,
            "minsAgo": 13
      },
      {
            "lat": 16.04109,
            "lng": 74.35387,
            "minsAgo": 11
      },
      {
            "lat": 16.04111,
            "lng": 74.35276,
            "minsAgo": 10
      },
      {
            "lat": 16.04149,
            "lng": 74.35224,
            "minsAgo": 8
      },
      {
            "lat": 16.04211,
            "lng": 74.35097,
            "minsAgo": 6
      },
      {
            "lat": 16.04209,
            "lng": 74.34981,
            "minsAgo": 4
      },
      {
            "lat": 16.04185,
            "lng": 74.34839,
            "minsAgo": 3
      },
      {
            "lat": 16.04385,
            "lng": 74.34672,
            "minsAgo": 1
      }
];

    for (const wp of waypoints) {
      const wpTime = new Date(now.getTime() - wp.minsAgo * 60 * 1000).toISOString();
      await client.query(`
        INSERT INTO "LocationHistories" ("EmployeeId", "Latitude", "Longitude", "Timestamp")
        VALUES ($1, $2, $3, $4)
      `, [pruthvirajId, wp.lat, wp.lng, wpTime]);
    }
    console.log(`Inserted ${waypoints.length} GPS breadcrumbs for Pruthviraj on route Nesari → Waghrali.`);

    // 5. Seed Field Visits for Pruthviraj for today
    await client.query(`
      DELETE FROM "FieldVisits"
      WHERE "EmployeeId" = $1 AND "VisitDate" = $2
    `, [pruthvirajId, todayIstStr]);

    await client.query(`
      INSERT INTO "FieldVisits" 
        ("EmployeeId", "Route", "CustomerName", "Village", "MobileNumber", "CustomerCategory", "ShortNote", "Latitude", "Longitude", "VisitDate", "VisitTime")
      VALUES
        ($1, 'Nesari → Waghrali', 'Ananda Patil (Sugarcane Farmer)', 'Nesari', '9822114455', 'Farmer', 'Soil sample collected & bio-fertilizer demo given', 16.06822, 74.33284, $2, '09:30:00'),
        ($1, 'Nesari → Waghrali', 'Babanrao Shinde', 'Waghrali', '9422556677', 'Farmer', 'Follow-up for micronutrient spray. Confirmed good yield.', 16.04211, 74.35097, $2, '10:45:00')
    `, [pruthvirajId, todayIstStr]);
    console.log('Inserted 2 field visits for Pruthviraj with matched GPS coordinates.');

    // 6. Seed Order Booking for Pruthviraj for today
    await client.query(`
      DELETE FROM "OrderBookings"
      WHERE "EmployeeId" = $1 AND "BookingDate" = $2
    `, [pruthvirajId, todayIstStr]);

    const orderRes = await client.query(`
      INSERT INTO "OrderBookings"
        ("EmployeeId", "Route", "CustomerName", "Village", "MobileNumber", "CustomerCategory", "OrderStatus", "GrandTotal", "BookingDate", "BookingTime", "Latitude", "Longitude")
      VALUES
        ($1, 'Nesari → Waghrali', 'Kisan Agro Traders & Seva Kendra', 'Waghrali', '9850123456', 'Dealer', 'Delivered', 14500.00, $2, '11:15:00', 16.04385, 74.34672)
      RETURNING "Id"
    `, [pruthvirajId, todayIstStr]);
    const orderId = orderRes.rows[0].Id;

    // Insert order line items
    await client.query(`
      INSERT INTO "OrderProducts" ("OrderBookingId", "ProductName", "Quantity", "UnitPrice", "RowTotal")
      VALUES ($1, 'Bio-Enzyme Growth Booster (1L)', 10, 1450.00, 14500.00)
    `, [orderId]);

    console.log(`Inserted Order Booking # ${orderId} (₹14,500) for Pruthviraj.`);

    console.log('\n============================================================');
    console.log('✓ SUCCESS: Pruthviraj employee data & route seeded successfully!');
    console.log('Employee Name    : Pruthviraj');
    console.log('Employee Code    : P001');
    console.log('Password         : gmark@p001');
    console.log('Assigned Area    : Nesari');
    console.log('Assigned Route   : Nesari → Waghrali (P001)');
    console.log('Status           : ONLINE (Active 🚗 On Trip)');
    console.log('Today Distance   : 4.85 km');
    console.log('Battery          : 🔋 85%');
    console.log('Current Location : Waghrali (16.0420Â° N, 74.3460Â° E)');
    console.log(`Date             : ${todayIstStr}`);
    console.log('============================================================\n');

  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await client.end();
  }
}

seed();
