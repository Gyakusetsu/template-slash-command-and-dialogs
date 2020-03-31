const mysql = require('knex')({
  client: 'mysql',
  connection: {
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME
  }
});

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
      computation : computation
    })
);
const selectLastTypeAndTime = (user) => (
  mysql.select('type', 'timestamp')
    .from('attendance')
    .where('user', user)
    .orderBy('timestamp', 'desc')
    .limit(1)
)
const selectRecords = (user, sort = 'desc') => (
  mysql.select('type', 'timestamp')
    .from('attendance')
    .where('user', user)
    .orderBy('timestamp', sort)
)
// const selectAllRecords = (user) => (
//   mysql.raw('SLEC')
// )

module.exports = {
  insertTypeIn,
  insertTypeOut,
  selectLastTypeAndTime,
  selectRecords,
};