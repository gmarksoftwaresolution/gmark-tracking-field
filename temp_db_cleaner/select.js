const { Client } = require('pg');
const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'NavbharatAgroDB',
    user: 'postgres',
    password: 'postgres'
});
client.connect().then(() => client.query('SELECT "Id", "Name", "LastLocationTimestamp", "LastMovementTimestamp", "LastKnownAddress" FROM "Employees"'))
    .then(res => { console.log(res.rows); client.end(); })
    .catch(err => { console.error(err); client.end(); });
