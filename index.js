require('dotenv').config();

const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const getJSON = require('get-json'); // load json from url
const ntimes = require('@erwijet/ntimes');
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
    console.log(req.query.guess, process.env.HASH, req.query.guess == process.env.HASH)
    if (req.query.guess == process.env.HASH)
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
                    target: '#'
                },
                {
                    title: 'Events',
                    target: '/events'
                }
            ]
        });
    else
        res.redirect('/auth');
});

app.get('/showme', (req, res) => {
    if (validate(req))
        res.render('mongoDBCharts');
    else res.redirect('/auth');
});

app.get('/advanced/:id', (req, res) => {
    let { id } = req.params;
    if (!id)
        res.redirect('/members');
    // if (validate(req))
        res.render('member-advanced', { id });
    // else
        // res.redirect('/auth');
});

app.get('/members/raw', (req, res) => {
    (async () => {
        getJSON('https://webhooks.mongodb-stitch.com/api/client/v2.0/app/googlesheets-qqzht/service/googlesheet-connect/incoming_webhook/webhook0', (err, json) => {
            let names = [];

            for (let doc of json) {
                if (doc.active)
                    names.push(doc.name);
            }

            names.sort();
            res.render('exports', { data: names })
        });
    })();
});

app.get('/members/showall', (req, res) => {
    if (validate(req))
        res.render('mongoInspectAll');
    else
        res.redirect('/auth');
});

app.get('/members', (req, res) => {
    if (validate(req))
        res.render('members');
    else
        res.redirect('/auth');
});

app.get('/attendence', (req, res) => {
    res.render('attendence');
});

app.listen(PORT, console.log(`Server listening on port ${PORT}`));