const today = require('./today');
const validate = require('./validate');
const Pusher = require('pusher');
let router = require('express').Router();

let options = [];
let votingEnabled = false;

let pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: 'us2',
    useTLS: true
});

router.get('/', (req, res) => {
    if (validate(req))
        res.render('live', { options, auth: req.cookies.nhsfalconsauth });
    else res.redirect('/auth?redirect=/live');
});

router.get('/vote', (req, res) => {
    console.log(options);
    res.render('castvote', { options });
});

router.get('/thanks', (req, res) => {
    res.render('liveThanks');
});

router.get('/get/:key', (req, res) => {
    let { key } = req.params;
    key = key.toLowerCase();

    switch (key) {
        case 'options':
            res.json({
                code: 200,
                msg: 'ok',
                value: options
            });
            break;
        case 'votingstate':
            res.json({
                code: 200,
                msg: 'ok',
                value: votingEnabled
            });
            break;
        default:
            res.json({
                code: 400,
                msg: "error! invalid request key (must be 'votingstate' or 'options'})"
            });
            break;
    }
});

router.post('/set', (req, res) => {
    if (req.query.token != today()) {
        res.json({
            code: 400,
            msg: 'error! invalid (or missing) request token. Try navigating to nhsfalcons.com/logout'
        });
        return;
    }

    let { key } = req.body;

    if (!key) {
        res.json({ code: 400, msg: 'no key' });
        return;
    }

    let value = req.body.value;
    
    if (key == 'votingState') {
        value = value.toLowerCase() == 'true';
        votingEnabled = value;
        res.json({ code: 200, msg: 'ok', key, value});
        return;
    } else if (key == 'options') {
        try {
            let newOptions = [];

            if (!value)
                value = []; // cant send empty arrays, so make up for it here

            for (let option of value) {
                newOptions.push(option);
            }

            options = newOptions;

            pusher.trigger('voting-channel', 'reload', { options }); // trigger reload on all pages

            res.json({ code: 200, msg: 'ok', key, value });
            return;
        } catch (ex) {
            res.json({ code: 400, msg: ex.toString()});
            return;
        }
    } else res.json({
        code: 400,
        msg: 'Could not find key: ' + key
    });
});

router.post('/vote', (req, res) => {
    if (votingEnabled) {
        pusher.trigger('voting-channel', 'vote', {
            options,
            index: req.body.index
        });
        res.json({
            code: 200,
            msg: 'ok',
            options,
            index: req.body.index
        });
        return;
    } else {
        res.json({
            code: 400,
            msg: 'Voting not enabled'
        });
    }
});

module.exports = router;