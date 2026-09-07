const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: 'localhost', database: 'NavbharatAgroDB', password: 'postgres', port: 5432 });
client.connect()
  .then(() => client.query("SELECT \"Id\", \"CustomerName\", \"BookingDate\" FROM \"OrderBookings\""))
  .then(res => console.log('ALL OBS:', res.rows))
  .finally(() => client.end());
