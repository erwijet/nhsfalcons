// use jQuery
// use jsoneditor (npmjs.com/package/jsoneditor)

let authToken;

if (globalThis.cookie.split(';').length > 0)
    authToken = globalThis.document.cookie.split(';')[1].split('=')[1];
else
    authToken = globalThis.document.cookie.split('=')[1];
let usp = new URLSearchParams(globalThis.location.search);
if (!authToken) globalThis.location.replace('/auth?redirect=/admin/db?obj=' + '&mode=' + usp.get('mode') + usp.get('autoexec') == 'true' ? '&autoexec=true' : '');

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
    let newAddr = '/admin/db?obj=' + encodeURIComponent(editor.getText()) + '&mode=' + usp.get('mode');

    alert('JSON saved to url. Copy & Save');
    globalThis.location.replace(newAddr);
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