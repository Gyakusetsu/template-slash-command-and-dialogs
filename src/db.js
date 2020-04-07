const mysql = require('knex')({
  client: 'mysql',
  connection: {
    timezone: 'UTC',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
});

const registerUser = (user, userName) => (
  mysql('users').insert({
    user: user,
    real_name: userName
  })
);
const insertTypeIn = (user) => (
  mysql('attendance').insert({
    type: 'in',
    user
  })
);
const insertTypeOut = (user, computation) => (
  mysql('attendance').insert({
    type: 'out',
    user,
    computation: computation
  })
);
const selectLastTypeAndTime = (user) => (
  mysql.select('type', 'timestamp')
    .from('attendance')
    .where('user', user)
    .orderBy('timestamp', 'desc', { useTz: true })
    .limit(1)
)
const selectRecords = (user, sort = 'desc') => (
  mysql.select('type', 'timestamp', 'computation')
    .from('attendance')
    .where('user', user)
    .orderBy('timestamp', sort)
)
// const selectAllRecords = (user) => (
//   mysql.raw('SLEC')
// )

module.exports = {
  registerUser,
  insertTypeIn,
  insertTypeOut,
  selectLastTypeAndTime,
  selectRecords,
};