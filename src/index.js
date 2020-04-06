require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const ticket = require('./ticket');
const signature = require('./verifySignature');
const debug = require('debug')('slash-command-template:index');
const axios = require('axios');
const { commandHandler } = require('./commands');

// const CronJob = require('cron').CronJob;

// const every10minutes = '0 */10 * * * *';

// const jobAwake = new CronJob(every10minutes, async function () {
//   const result = await axios.get(`${process.env.AWAKE_URL}`);
//   console.log(result.data);
// });

// jobAwake.start();

const app = express();

/*
 * Parse application/x-www-form-urlencoded && application/json
 * Use body-parser's `verify` callback to export a parsed raw body
 * that you need to use to verify the signature
 */

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};

app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

app.get('/', (req, res) => {
  return res.status(200).send(`Healthy Since ${new Date()}`);
});

/*
 * Endpoint to receive /helpdesk slash command from Slack.
 * Checks verification token and opens a dialog to capture more info.
 */
app.post('/command', async (req, res) => {
  // Verify the signing secret
  if (!signature.isVerified(req)) {
    debug('Verification token mismatch');
    return res.status(404).send();
  }

  // extract the slash command text, and trigger ID from payload
  const { command, user_id, response_url } = req.body;


  // Covid Data

  if (command == '/covid-ph') {
    let phToday = {};
    await axios.get('https://corona.lmao.ninja/countries/PH')
      .then((result) => {
        phToday = result.data;
      })
    return res.status(200).json({
      "response_type": 'in_channel',
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `:flag-ph: API reference is https://github.com/NovelCOVID/API`
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text":
              `Cases: *${phToday.cases}* \n` +
              `Cases Today : *${phToday.todayCases}*\n` +
              `Deaths : *${phToday.deaths}*\n` +
              `Deaths Today : *${phToday.todayDeaths}*\n` +
              `Recovered : *${phToday.recovered}*\n` +
              `Active : *${phToday.active}*\n` +
              `Critical : *${phToday.critical}*\n` +
              `Last Update : *${new Date(phToday.updated)}*\n`
          }
        }
      ]
    });
  } else if (command == '/covid-world') {
    let worldToday = {};
    await axios.get('https://corona.lmao.ninja/all')
      .then((result) => {
        worldToday = result.data;
      })
    return res.status(200).json({
      "response_type": 'in_channel',
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `:flags: API reference is https://github.com/NovelCOVID/API`
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text":
              `Cases: *${worldToday.cases}* \n` +
              `Deaths : *${worldToday.deaths}*\n` +
              `Recovered : *${worldToday.recovered}*\n` +
              `Active : *${worldToday.active}*\n` +
              `Last Update : *${new Date(worldToday.updated)}*\n`
          }
        }
      ]
    });
  }

  const result = await commandHandler(user_id, command);

  // create the modal payload - includes the dialog structure, Slack API token,
  // and trigger ID
  // let view = payloads.modal({
  //   trigger_id
  // });

  // let result = await api.callAPIMethod('views.open', view);

  if (result.type == 'in_channel') {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      "text": result.text,
      "response_type": result.type,
      "channel" : process.env.SLACK_REPLY_CHANNEL_ID
    });

    return res.status(200).send('');
  }

  // debug('views.open: %o', result);
  return res.status(200).json({
    "text": result.text
  });
});

/*
 * Endpoint to receive the dialog submission. Checks the verification token
 * and creates a Helpdesk ticket
 */
app.post('/interactive', (req, res) => {
  // Verify the signing secret
  if (!signature.isVerified(req)) {
    debug('Verification token mismatch');
    return res.status(404).send();
  }

  const body = JSON.parse(req.body.payload);
  res.send('');
  ticket.create(body.user.id, body.view);
});

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});
