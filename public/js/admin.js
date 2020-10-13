// use jQuery
// use jsoneditor (npmjs.com/package/jsoneditor)

if (!editor) globalThis.location.replace('/auth'); // ensure editor is loaded
const authToken = globalThis.document.cookie.split('=')[1];
if (!authToken) globalThis.location.replace('/auth?redirect=/admin?obj=' + editor.getText());

// Setup JSON response container
let resContainer = document.getElementById('jsonresult');
let resEditor = new JSONEditor(resContainer, { modes: ['code', 'tree', 'form'], mode: 'code' });
resEditor.set({  })

function runQueryOnClick() {
    let failed = false;

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
            url: 'http://api.nhsfalcons.com/raw/query',
            data: {
                auth: authToken,
                query: editor.get() // load user-defined JSON
            }
        });

        if (res.code == 401)
            globalThis.location.replace('/auth?redirect=/admin?obj=' + editor.getText() + '&mode=' + new URLSearchParams(globalThis.location.search) .get('mode'));
        console.log(res);

        resEditor.set(res.docs);

        if (res.code == 400)
            resEditor.set(res.msg);

        $('#results').addClass('is-active');
        setLoading('results', false);
        $('#runQueryBtn').removeClass('is-loading');
    })();
}

function exportOnClick() {
    alert('JSON saved to url. Copy & Save');

    let usp = new URLSearchParams(globalThis.location.search);
    let newAddr = '/admin?obj=' + editor.getText();
    console.log(editor.getText());

    for (let key of usp.keys()) {
        if (key != 'obj')
            newAddr += `&${key}=${usp[key]}`;
    }

    globalThis.location.replace(newAddr);
}

function viewDocsOnClick() {
    globalThis.location.replace('https://docs.mongodb.com/manual/reference/operator/query/')
}

$(() => {
    // setup mode menu selector

    ['query', 'insert', 'remove', 'agg'].forEach(mode => {
        $(`#menu-${mode}`).find('a').attr('href', `/admin?mode=${mode}&obj=${editor.getText()}`)
    });
});