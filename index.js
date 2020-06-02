require('dotenv').config();

const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const getJSON = require('get-json'); // load json from url
const validate = require('./validate');
const rand = require('./random');
const metrics = require('./metrics');
const PORT = process.env.PORT || 1773;

let app = express();
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(morgan('common'));
app.use(helmet());
app.use(cors());
app.set('view engine', 'pug');

app.get('/auth', (req, res) => {
    if (req.query.guess == process.env.PASSWORD)
        res.redirect('/?token=' + rand.getVal());
    else {
        rand.advance(); // generate seeded val
        res.render('auth');
    }
});

app.get('/', (req, res) => {
    if (validate(req, res))
        res.render('dashboard', {
            metrics: [
                {
                    title: 'Members',
                    target: '/members'
                },
                {
                    title: 'Hours Volunteered',
                    value: metrics.getVolunteerHourCount() + metrics.getTutoringHourCount(),
                    target: '/tutoring'
                },
                {
                    title: 'Events',
                    value: metrics.getEventCount(),
                    target: '/events'
                }
            ]
        });
    else
        res.redirect('/auth');
});

app.get('/showme', (req, res) => {
    res.render('mongoDBCharts');
});

app.get('/membersTable', (req, res) => {
    (async () => {
        getJSON('https://webhooks.mongodb-stitch.com/api/client/v2.0/app/googlesheets-qqzht/service/googlesheet-connect/incoming_webhook/webhook0', (err, json) => {
            res.render('exports', { data: json })
        });
    })();
});

app.get('/members', (req, res) => {
    if (validate(req))
        res.render('members');
    else
        res.redirect('/auth');
});

app.listen(PORT, console.log(`Server listening on port ${PORT}`));