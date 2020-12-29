require('dotenv').config();

const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const serveFavicon = require('serve-favicon');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const getJSON = require('get-json'); // load json from url

const advisorLinks = require('./public/js/advisorlinks.json');
const advauth = require('./advauth');
const validate = require('./validate');
const today = require('./today');
const rand = require('./random');
const live = require('./live');
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
    console.log('testing specialAuth...', req.query.guess, process.env.ADV_HASH, req.query.guess == process.env.ADV_HASH);
    if (req.query.guess == process.env.ADV_HASH) {
        res.clearCookie('nhsfalconsauth');
        res.cookie('nhsfalconsadvauth', advauth(), { maxAge: 60 * 60 * 1000 });
        res.cookie('nhsfalconsauth', today(), { maxAge: 60 * 60 * 1000 }); // administer cookie. 1 hr
        res.redirect(req.query.redirect);
        return;
    }

    if (req.query.guess == process.env.HASH) {
        res.cookie('nhsfalconsauth', today(), { maxAge: 60 * 60 * 1000 }); // administer cookie. 1 hr
        res.redirect(req.query.redirect); 
    }
    else {
        rand.advance(); // generate seeded token
        res.render('auth', { redirect: req.query.redirect || '/', specialAuth: req.query.specialAuth || null });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('nhsfalconsauth');
    res.clearCookie('nhsfalconsadvauth');
    res.redirect('/auth');
});

app.get('/', (req, res) => res.redirect('/members'));

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

            let script = `
                setTimeout(() => globalThis.location.replace(${entry.url}), 10);
            `;

            // res.end(`<script>${script}</script>`)

            res.redirect(307, entry.url); // redirect with code 308
        });
    })();
});

app.get('/advisor', (req, res) => {
    if (req.cookies.nhsfalconsadvauth != advauth())
        res.redirect('/auth?specialAuth=adv&redirect=/advisor');
    else
        res.render('advisor', { groups: advisorLinks });
});

app.get('/admin/db', (req, res) => {
    if (req.cookies.nhsfalconsauth != today())
        res.redirect('/auth?redirect=' + req.url.replace('?', encodeURIComponent('?')).replace('&', encodeURIComponent('&')));

    if (!req.query.mode || req.query.mode == 'undefined')
        res.redirect(`/admin/db?mode=query${ req.query.obj ? '&obj=' + req.query.obj : '' }${ req.query.isExplore ? '&isExplore=' + req.query.isExplore : '' }`);
    else
        res.render('admin', { isExplore: req.query.isExplore, urljson: req.query.obj || ''})
});

app.get('/admin/dtb', (req, res) => {
    res.render('dynamicTableBuilder');
});

app.get('/admin/drawTable', (req, res) => {
    let docs = JSON.parse(req.query.docs);
    res.render('table', { docs });
});

app.post('/gsync/onSubmit', (req, res) => {
    console.log(req.body);
    res.sendStatus(200).json({
        code: 200,
        'msg': 'ok'
    });
});

app.get('/misc/coop-email', (req, res) => {
    if (req.cookies.nhsfalconsadvauth != advauth())
        res.redirect('/auth?specialAuth=adv&redirect=/misc/coop-email');
    else
        res.render('coopEmail.pug');
});

function doMailSend(msg, cb) {
    const email = process.env.EMAIL;
    const password = process.env.EMAIL_PASS;

    let transport;

    function updateTransport() {
        transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: email,
                pass: password
            }
        });
    }

    function sendMail(msg, cb) {
        transport.sendMail(msg, err => cb(err));
    }

    updateTransport();

    sendMail(msg, err => cb); // with "error", execute callback
}

app.get('/misc/tutoringVideoArchive', (req, res) => {
    res.render('help');
});

app.post('/misc/coop-email', (req, res) => {
    if (req.cookies.nhsfalconsauth != today()) {
        res.redirect('/auth?redirect=/misc/coop-email')
    }

    // check that all required parameters are present

    let failed = false;

    const { to, vidTitle, nhsMember, ytLink, gdLink } = req.body;
    [to, vidTitle, nhsMember, ytLink, gdLink].forEach(param => {
        if (typeof param != 'string')
            failed = true;
    });

    if (failed) {
        res.redirect('/misc/coop-email');
        return;
    }

    let text = `
        Hello! 

        Your video request for "${vidTitle}" has finished up.
        
        The video is avalible for download from Google Drive here: ${gdLink}.
        The video is also uploaded to the Westosha Central COOP Video Youtube Channel so it can be shared easily: ${ytLink}.

        The NHS Member who created your video was **${nhsMember}**.
        Please feel free to reach out if you have any questions or concerns.

        Thank you so much for your video submission; all videos go to helping NHS members fulfill their volunteer hour requirements, and allow for Westosha Central NHS to help out in the community.
        If you would like to request and *additional* video, you can do so by filling out the Google Form at http://coop.nhsfalcons.com

        Thanks!! :D
        
        Tyler Holewinski

        President, 2020-2021 NHS
        e: tyler@nhsfalcons.com
        p: (719) 822 5878
    `;

    let msg = {
        from: email,
        to: recipient,
        subject: 'NHS Video Submission Finished',
        text,
    };

    doMailSend(to, msg, err => {
        if (err) {
            res.end(err.message);
            return;
        }

        res.render('liveThanks'); // show green confirmation circle
    });
});

function nextVideoId() {
    const FILEPATH = __dirname + '/num.txt';
    let num = Number.parseInt(fs.readFileSync(FILEPATH));
    fs.writeFileSync(FILEPATH, ++num);
    
    
    // pad with prefixed zeros (total digits: 4)
    let str = num.toString();
    while (str.length < 4) {
      str = '0' + str;
    }  
  
    return str;
}

// app.use(express.json()); // use JSON body parsing

app.get('/misc/nhs-video-request', (req, res) => {
    // console.log(GAS_MAIL_KEY, PROVIDED_KEY, GAS_MAIL_KEY == PROVIDED_KEY);

    // if (PROVIDED_KEY != GAS_MAIL_KEY) {
    //     res.statusCode = 401; // rejected; forbidden (not authed)
    //     res.end();
    //     return; // stop processing request
    // }

    let name = req.query.name;
    let title = req.query.title;
    let isWestosha = req.query.isWestosha == "Yes";
    
    let westoshaTeacher = null;
    let westoshaClass = null;
    let westoshaRuntime = null;
    
    if (isWestosha) {
      westoshaTeacher = req.query.westoshaTeacher
      westoshaClass = req.query.westoshaClass;
      westoshaRuntime = req.query.westoshaTeacher;
    }
    
    let videoConcept = req.body.shift();
    let dueDate = req.body.shift();

    let westoshaNote = `
  > **NOTE**: This is in line with a westosha class
  >
  > Teacher: ${westoshaTeacher}
  > Class: ${westoshaClass} @[${westoshaRuntime}]
  `;
  
  const backticks = '```';
  
  let msg = {
    from: process.env.EMAIL,
    to: TRELLO_EMAIL,
    subject: title + ' (Z-' + nextVideoId() + ')',
    text: `
${backticks}
TITLE: **${title}**
BY: ${name}
DUE ON: ${dueDate}
${backticks}
      
concept: _${videoConcept}_
${isWestosha ? westoshaNote : '' }
    `
  }
    sendMail('tylerholewinski+c44h3kiab6lvxjshucoz@boards.trello.com', msg, err => {
        if (err)
            res.statusCode = 400; // bad request

        res.end(); // success
    });
});

app.listen(PORT, console.log(`Server listening on port ${PORT}`));
