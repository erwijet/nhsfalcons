require('dotenv').config();

const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const serveFavicon = require('serve-favicon');
const helmet = require('helmet');
const querystring = require('querystring'); // parse url json
const cookieParser = require('cookie-parser');
const getJSON = require('get-json'); // load json from url
const validate = require('./validate');
const today = require('./today');
const rand = require('./random');
const live = require('./live');
const { URLSearchParams } = require('url');
const PORT = process.env.PORT || 1773;

let app = express();

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(morgan('common'));
app.use(helmet());
app.use(serveFavicon(path.join(__dirname, 'public', 'img', 'favicon.png')));
app.use(cors());
app.use(cookieParser());
app.use('/live', live); // configure live middleware

app.set('view engine', 'pug');

app.get('/auth', (req, res) => {
    if (req.query.guess == process.env.HASH) {
        res.cookie('nhsfalconsauth', today(), { maxAge: 60 * 60 * 1000 }); // administer cookie. 1 hr
        res.redirect(req.query.redirect); 
    }
    else {
        rand.advance(); // generate seeded token
        res.render('auth', { redirect: req.query.redirect || '/' });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('nhsfalconsauth');
    res.redirect('/auth');
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
    if (validate(req))
        res.render('tutoring', {});
    else
        res.redirect('/auth?redirect=/tutoring');
});

app.get('/help', (req, res) => {
    const videos = [
        "https://www.youtube.com/embed/R6hq9cOaQAk",
        "https://www.youtube.com/embed/WT7AZNfkV04",
        "https://www.youtube.com/embed/PjR7Ry4NjW8",
        "https://www.youtube.com/embed/5m29_igFpPs",
        "https://www.youtube.com/embed/R-O5hP9k6qM",
        "https://www.youtube.com/embed/GQ_p4412qeQ",
        "https://www.youtube.com/embed/KCz2zhmG9V8",
        "https://www.youtube.com/embed/6hUZ01zaxzQ"
    ];

    let { v } = req.query;
    if (typeof v == 'undefined')
        v = 0;
    res.render('about', { vindex: v, vidurl: videos[v] });
})

app.get('/watch', (req, res) => res.render('watch'));

app.get('/fireflies', (req, res) => {
    res.render('owlcity');
});

app.get('/share/induction', (req, res) => {
    res.redirect('https://drive.google.com/file/d/1dHgvOo-_str0dhhSibhfSdy5mNdM8UMY/view?usp=sharing');
});

app.get('/test/:echo', (req, res) => res.end(req.params.echo));

app.get('/rdr/:name', (req, res) => {
    (async () => {
        console.log('starting...');
        getJSON('http://api.nhsfalcons.com/rdr/find?q=' + req.params.name, (err, entry) => {

            if (entry.code != 200) {
                res.end(":(\n\nNo NHSFalcons RDR string entry with provided name " + req.params.name + " exists. Check Capitilization?\n\n\nSorry,\nTyler (p'21)"); // show error
                return;
            }

            res.redirect(308, entry.url); // redirect with code 308
        });
    })();
});

app.get('/admin/db', (req, res) => {
    if (!req.query.mode || req.query.mode == 'undefined')
        res.redirect(`/admin/db?mode=query${ req.query.obj ? '&obj=' + req.query.obj : '' }${ req.query.isExplore ? '&isExplore=' + req.query.isExplore : '' }`);
    else
        res.render('admin', { isExplore: req.query.isExplore, urljson: req.query.obj || ''})
});

app.listen(PORT, console.log(`Server listening on port ${PORT}`));