require('dotenv').config();

const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const getJSON = require('get-json'); // load json from url
const validate = require('./validate');
const rand = require('./random');
const live = require('./live');
const PORT = process.env.PORT || 1773;
let app = express();
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(morgan('common'));
app.use(helmet());
app.use(cors());
app.set('view engine', 'pug');

app.use('/live', live); // configure live middleware

app.get('/auth', (req, res) => {
    if (req.query.guess == process.env.HASH) {
        if (req.query.redirect.indexOf('?') != -1)
            res.redirect(`${req.query.redirect}&token=${rand.getVal()}`);
        else
            res.redirect(`${req.query.redirect}?token=${rand.getVal()}`);   
    }
    else {
        rand.advance(); // generate seeded token
        res.render('auth', { redirect: req.query.redirect || '/' });
    }
});

app.get('/', (req, res) => {
    let token = '';
    if (validate(req))
        token = '?token=' + req.query.token;
    res.redirect('/members' + token);
});

app.get('/showme', (req, res) => {
    if (validate(req))
        res.render('mongoDBCharts');
    else res.redirect('/auth?redirect=/showme');
});

app.get('/advanced/:id', (req, res) => {
    let { id } = req.params;
    if (!id)
        res.redirect('/members');
    if (validate(req))
        res.render('member-advanced', { id });
    else
        res.redirect('/auth?redirect=/advanced/' + id || '');
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
        res.redirect('/auth?redirect=/members/showall');
});

app.get('/members', (req, res) => {
    if (validate(req))
        res.render('members');
    else
        res.redirect('/auth?redirect=/members');
});

app.get('/attendence', (req, res) => {
    if (validate(req))
        res.render('attendence', { eventID: req.query.eventid });
    else
        res.redirect('/auth?redirect=' + encodeURIComponent('/attendence' + (req.query.eventid ? '?eventid=' + req.query.eventid : '')))
});

app.get('/events', (req, res) => {
    if (validate(req))
        res.render('events', { token: req.query.token });
    else
        res.redirect('/auth?redirect=/events')
});

app.get('/probation', (req, res) => {
    if (validate(req))
        res.render('probation', {});
    else
        res.redirect('/auth?redirect=/probation')
});

app.get('/tutoring', (req, res) => {
    // if (validate(req))
        res.render('tutoring', {});
    // else
        // res.redirect('/auth?redirect=/tutoring');
});

app.get('/res/speech', (req, res) => {
    res.sendFile()
});

app.listen(PORT, console.log(`Server listening on port ${PORT}`));