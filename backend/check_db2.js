const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: 'localhost', database: 'NavbharatAgroDB', password: 'postgres', port: 5432 });
client.connect()
  .then(() => client.query("SELECT \"Id\", \"CustomerName\", \"Latitude\", \"Longitude\" FROM \"OrderBookings\" WHERE \"BookingDate\" = '2026-09-06'"))
  .then(res => console.log('ORDER BOOKINGS 06:', res.rows))
  .then(() => client.query("SELECT \"Id\", \"CustomerName\", \"Latitude\", \"Longitude\" FROM \"FieldVisits\" WHERE \"VisitDate\" = '2026-09-06'"))
  .then(res => console.log('FIELD VISITS 06:', res.rows))
  .finally(() => client.end());
