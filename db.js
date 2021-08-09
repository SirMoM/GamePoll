const { Pool } = require('pg');


module.exports = {
    setup: () => setup(),
    close: () => close(),

    get_past_messages: () => get_past_messages(),
    create_past_messages: (msg_id, lifetime_in_h) => create_past_messages(msg_id, lifetime_in_h),
};

const dbclient = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function setup() {
    await dbclient.connect();
    console.log('CONNECTED TO DB');
    await dbclient.query('CREATE TABLE past_messages(messageid INT PRIMARY KEY NOT null , created timestamp with time zone NOT null DEFAULT NOW(), sessionlife integer NOT NULL)').catch(err => {
        if (err.code == '42P07') {
            console.log('Did not create table; was there!');
        } else {
            console.error(err);
        }
    });
}

async function close() {
    console.log('DISCONECTING FROM DB');
    return await dbclient.end();
}

async function get_past_messages() {
    const result = await dbclient.query('SELECT * FROM past_messages pm WHERE created > (NOW() - (pm.sessionlife * \'1 hours\'::interval))')
        .catch((err) => { console.error(err); });
    return result.rows;
}

async function create_past_messages(msg_id, lifetime_in_h) {
    const querry = `INSERT INTO past_messages VALUES(${msg_id}, NOW(), ${lifetime_in_h})`;
    console.log(querry);
    dbclient.query(querry)
        .then(() => { console.log('Saved msg: ' + msg_id); })
        .catch((err) => { console.error(err); });
}