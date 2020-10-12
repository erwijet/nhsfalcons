// use jQuery
// use jsoneditor (npmjs.com/package/jsoneditor)

if (!editor) globalThis.location.replace('/auth'); // ensure editor is loaded
const authToken = globalThis.document.cookie.split('=').pop();

function runQueryOnClick() {
    $('#runQueryBtn').addClass('is-loading');

    (async () => {
        let res = await $.ajax({
            method: 'GET',
            url: 'http://localhost:2020/raw/query',
            data: {
                auth: authToken,
                query: editor.get() // load user-defined JSON
            }
        });

        if (res.code == 401)
            globalThis.location.replace('/auth?redirect=/admin?obj=' + editor.getText());
    })();
}

function viewDocsOnClick() {
    globalThis.location.replace('https://docs.mongodb.com/manual/reference/operator/query/')
}