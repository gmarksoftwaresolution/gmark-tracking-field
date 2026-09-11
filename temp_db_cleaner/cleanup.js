const { Client } = require('pg');

async function cleanup() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'NavbharatAgroDB',
        user: 'postgres',
        password: 'postgres'
    });
    await client.connect();

    try {
        console.log("Starting cleanup...");
        await client.query(`DELETE FROM "LocationHistories"`);
        console.log("Deleted LocationHistories");
        
        await client.query(`DELETE FROM "FieldVisits"`);
        console.log("Deleted FieldVisits");
        
        await client.query(`DELETE FROM "OrderProducts"`);
        console.log("Deleted OrderProducts");
        
        await client.query(`DELETE FROM "OrderBookings"`);
        console.log("Deleted OrderBookings");
        
        await client.query(`UPDATE "Employees" SET "TodayTravelledDistance" = 0, "LastLatitude" = NULL, "LastLongitude" = NULL, "LastLocationTimestamp" = NULL, "LastMovementTimestamp" = NULL, "TripStatus" = 'Not Started', "TripStartTime" = NULL, "TripEndTime" = NULL`);
        console.log("Reset Employees tracking fields");

        console.log("Cleanup completed successfully.");
    } catch (err) {
        console.error("Error during cleanup:", err);
    } finally {
        await client.end();
    }
}

cleanup();
