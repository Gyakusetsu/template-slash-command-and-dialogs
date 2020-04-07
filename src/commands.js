const { selectLastTypeAndTime, selectRecords, insertTypeIn, insertTypeOut, registerUser } = require('./db');
const api = require('./api');
const moment = require('moment-timezone');

async function commandHandler(user, command) {
  const record = await selectLastTypeAndTime(user) || null;
  const result = await api.callAPIMethod('users.info', {
    user: user
  });

  let userName = result.user.profile.real_name;

  let commandResponse = {
    text: '',
    type: 'ephemeral'
  };

  // if (record.length === 0) {
  //   if (command === '/login') {
  //     await insertTypeIn(user)
  //     commandResponse.text = `*${userName}* logged-in ${moment().format('MMMM Do YYYY, h:mm a')}`;
  //     commandResponse.type = 'in_channel';
  //   } else {
  //     commandResponse.text = `*${userName}* you can type login first`;
  //   }
  // }

  switch (command) {
    case '/login':
      if (record.length === 0 || record[0].type !== 'in') {
        await insertTypeIn(user);
        commandResponse.text = `*${userName}* logged-in *${moment().tz("Asia/Manila").format('MMMM Do YYYY, h:mm a')}*`;
        commandResponse.type = 'in_channel';
      } else {
        commandResponse.text = `*${userName}* already logged-in`;
      }

      break;

    case '/logout':
      if (record[0].type !== 'out') {
        const hours = Math.abs(Date.now() - record[0].timestamp) / 36e5;
        await insertTypeOut(user, hours);
        commandResponse.text = `*${userName}* logged-out *${moment().tz("Asia/Manila").format('MMMM Do YYYY, h:mm a')}* Hours : *${hours.toFixed(2)}*`;
        commandResponse.type = 'in_channel';
      } else {
        commandResponse.text = `*${userName}* already logged-out`;
      }

      break;

    case '/list':
      const records = await selectRecords(user);
      const response = records
        .map(r => `type: *${r.type.toUpperCase()}* time: *${moment(r.timestamp).tz("Asia/Manila").format('MMMM Do YYYY, h:mm a')}* ${r.computation > 0 ? `computation : ${r.computation}` : ''}`)
        .reduce((pre, cur) => cur + '\n' + pre);

      commandResponse.text = response;

      break;

    case '/register':
      // just catch unique constrait on mysql
      try {
        await registerUser(user, userName);
        commandResponse.text = `Hello *${userName}* thank you for registering your name!`;        
        commandResponse.type = 'in_channel';
      } catch (error) {
        console.error(error);
        commandResponse.text = `Hello *${userName}* you're already registered`;
      }

      break;

    default:
      commandResponse.text = `command '${command}' not found`;
  }

  return commandResponse;
}

module.exports = {
  commandHandler
}