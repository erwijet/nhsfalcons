// use jQuery
// use jsoneditor (npmjs.com/package/jsoneditor)

const authToken = globalThis.document.cookie.split('=')[1];
if (!authToken) globalThis.location.replace('/auth?redirect=/admin/db?obj=' + editor.getText());

// Setup JSON response container
let resContainer = document.getElementById('jsonresult');
let resEditor = new JSONEditor(resContainer, { modes: ['code', 'tree', 'form'], mode: 'tree' });
resEditor.set({  })

function runQueryOnClick() {
    let failed = false;
    let mode = new URLSearchParams(globalThis.location.search) .get('mode');

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
            url: 'http://localhost:2020/raw/' + mode,
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

    let usp = new URLSearchParams(globalThis.location.search);
    let newAddr = '/admin/db?obj=' + editor.getText() + '&mode=' + usp.get('mode');

    alert('JSON saved to url. Copy & Save');
    globalThis.location.replace(newAddr);
}

function viewDocsOnClick() {
    globalThis.location.replace('https://docs.mongodb.com/manual/reference/operator/query/')
}

$(() => {
    // show selected mode

    let selection = new URLSearchParams(globalThis.location.search) .get('mode');
    console.log(selection);
    $(`#menu-` + new URLSearchParams(globalThis.location.search) .get('mode')).addClass('is-active');

    // setup mode menu selector
    for (let mode of ['query', 'remove', 'agg']) {
        $(`#menu-${mode}`).find('a').attr('href', `/admin/db?mode=${mode}&obj=${editor.getText()}`)
    };
});