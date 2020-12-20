// use jQuery
// use jsoneditor (npmjs.com/package/jsoneditor)

let authToken;

let usp = new URLSearchParams(globalThis.location.search);

if (globalThis.document.cookie.split(';').length > 1)
    authToken = globalThis.document.cookie.split(';')[1].split('=')[1];
else if (globalThis.document.cookie.split('=').length > 1)
    authToken = globalThis.document.cookie.split('=')[1];
else {
    let { search, pathname } = globalThis.location; 
    globalThis.location.replace(`/auth?redirect=${pathname}${search}`);
}

// Setup JSON response container
let resContainer = document.getElementById('jsonresult');
let resEditor = new JSONEditor(resContainer, { modes: ['code', 'tree', 'form'], mode: 'tree' });
resEditor.set({  })

function runQueryOnClick() {
    let failed = false;
    // let usp = new URLSearchParams(globalThis.location.search);
    let mode = usp.get('mode');

    try {
        editor.get(); // attempt to parse
    } catch(ex) {
        alert(ex);
        failed = true;
    }

    if (failed) {
        alert('JSON parse failed. Are you using a root object with curly braces?');
        return;
    }

    $('#runQueryBtn').addClass('is-loading');
    setLoading('results', true);
    
    (async () => {
        let res = await $.ajax({
            method: 'POST',
            url: 'http://api.nhsfalcons.com/raw/' + mode,
            data: {
                auth: authToken,
                query: editor.get() // load user-defined JSON
            }
        });

        if (res.code == 401)
            globalThis.location.replace('/auth?redirect=/admin/db?obj=' + editor.getText() + '&mode=' + new URLSearchParams(globalThis.location.search) .get('mode'));

        if (res.docs) {
            if (editor.get()['@returns']) {
                if (editor.get()['@returns'].asTable) {
                    if (usp.get('autoexec') != 'true')
                        globalThis.window.open('/admin/drawTable?docs=' + JSON.stringify(res.docs));
                    else
                        globalThis.location.replace('/admin/drawTable?docs=' + JSON.stringify(res.docs));   
                }
            }
            resEditor.set(res.docs);
        }

        if (res.code == 400)
            resEditor.set(res.msg);

        $('#results').addClass('is-active');
        setLoading('results', false);
        $('#runQueryBtn').removeClass('is-loading');
    })();
}

function exportOnClick() {

    // let usp = new URLSearchParams(globalThis.location.search);
    const newAddr = '/admin/db?obj=' + encodeURIComponent(editor.getText()) + '&mode=' + usp.get('mode');
    const { origin } = globalThis.location;

    $('#permalink-modal').addClass('is-active');
    $('#permalink-textbox').val(origin + newAddr);

    // alert('JSON saved to url. Copy & Save');
    // globalThis.location.replace(newAddr);
}

function copyPermalink() {
    const elem = document.getElementById('permalink-textbox');
    elem.removeAttribute('disabled');
    elem.select();
    elem.setSelectionRange(0, 999999); // for mobile
    globalThis.document.execCommand('copy');
    elem.setAttribute('disabled', '');
    alert('Copied!');
}

async function createShortlink(name, url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            method: 'POST',
            url: 'http://api.nhsfalcons.com/rdr/insert',
            data: {
                auth: authToken,
                name,
                url
            },  
            success: resolve
        })
    });
}

function testCreateLink() {
    let newAddr = 'http://nhsfalcons.com/admin/db?obj=' + encodeURIComponent(editor.getText()) + '&mode=' + usp.get('mode');
    if ($('#autoexec').is(':checked')) newAddr += '&autoexec=true';
    const name = $('#shortlink-textbox').val();

    // ensure regex is enforced in case function is called directly
    if (new RegExp('^[a-zA-Z0-9-_]+$') .test(name) == false) {
        $('#shortlink-tag').removeClass('is-success').addClass('is-danger').innerText = 'entered path does not match RegExp: /^[a-zA-Z0-9-_]+$/';
        return;
    }

    (async () => {
        let apiRes = await createShortlink(name, newAddr);
        console.log(apiRes);
        switch (apiRes.code) {
            case 400:
                $('#shortlink-tag').removeClass('is-success').addClass('is-danger').text('Insufficient values passed to api. Are you calling from the terminal? Don\'t do that.');
                break;
            case 401:
                $('#shortlink-tag').removeClass('is-success').addClass('is-danger').text('Your authentication has expired. Please copy your program, and reload the page to reauthenticate.');
                break;
            case 403:
                $('#shortlink-tag').removeClass('is-success').addClass('is-danger').text('Your authentication is invalid. Please, in a new tab, nagivate to nhsfalcons.com/logout, log back in, and reload the program.');
                break;
            case 200:
                $('#shortlink-tag').removeClass('is-danger').addClass('is-success').text('Success! Created a new redirect with name ' + apiRes.name);
                break
            case 422:
                $('#shortlink-tag').removeClass('is-danger').removeClass('is-success').text('A resource with that name already exists');
        }
    })();
}

function viewDocsOnClick() {
    globalThis.location.replace('https://docs.mongodb.com/manual/reference/operator/query/')
}

$(() => {
    // show selected mode

    // let usp = new URLSearchParams(globalThis.location.search);
    let selection = usp.get('mode');
    console.log(selection);
    $(`#menu-` + new URLSearchParams(globalThis.location.search) .get('mode')).addClass('is-active');

    // setup mode menu selector
    for (let mode of ['query', 'remove', 'agg']) {
        $(`#menu-${mode}`).find('a').attr('href', `/admin/db?mode=${mode}&obj=${editor.getText()}`)
    };

    if (usp.get('autoexec') == 'true' && usp.get('mode') == 'query')
        runQueryOnClick(); // auto run find query. Illegal for remove queries
});