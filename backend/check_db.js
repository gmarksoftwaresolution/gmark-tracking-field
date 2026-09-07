const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: 'localhost', database: 'gmark_tracking_field', password: 'admin', port: 5432 });
client.connect().then(() => client.query("SELECT id, customer_name FROM field_visits WHERE visit_date = '2026-09-06'")).then(res => console.log('FIELD VISITS:', res.rows)).then(() => client.query("SELECT id, customer_name FROM order_bookings WHERE booking_date = '2026-09-06'")).then(res => console.log('ORDER BOOKINGS:', res.rows)).finally(() => client.end());
