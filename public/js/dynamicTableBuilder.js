let editor;

(function setupAceEditor() {

    ace.define('ace/mode/dtb', ['require', 'exports', '/ace/lib/oop', 'ace/mode/text', 'ace/mode/custom_highlight_rules'], (acequire, exports) => {
        const oop = acequire('ace/lib/oop');
        
    });

    editor = ace.edit('editor');
    editor.setTheme('ace/theme/monokai');
    editor.session.setMode('ace/mode/javascript');

    editor.setOptions({
        maxLines: 20,
        fontSize: 20,
        showGutter: false
    });

    editor.setValue(`/**
* nhsfalcons table script
* Generate a table containing all data about members
*/

function validate(elem) {
    return true;
}

_in.forEach(elem => {
if (validate(elem))
    _out.push(elem);
});

// Click "test script" to preview table
`, 1);
})();

function hideModal() {
    $('#export-modal').removeClass('is-active');
}

function showModal() {
    $('#export-modal').addClass('is-active');
}

// called by input field on key down
function validateTableName() {
    if ($('#tableName').val() != '' && new RegExp('^[a-zA-Z0-9-_]+$') .test($('#tableName').val())) {
        $('#tableName').addClass('is-success');
        $('#tableName').removeClass('is-danger');
        $('#btnPublish').removeClass('is-static');
    } else {
        $('#tableName').removeClass('is-success');
        $('#tableName').addClass('is-danger');
        $('#btnPublish').addClass('is-static');
    }
}

// called by publish button
function publish() {
    const name = $('#tableName').val();
    if (name == '')
        return;

    (async () => {
        const token = globalThis.document.cookie.split(' ')[0].split('=')[1];
        console.log(token);

        // get minified js

        const minified = await $.ajax({
            method: 'POST',
            url: '/misc/jsmin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: { code: editor.getValue() }
        });

        await $.ajax({
            method: 'POST',
            url: 'http://api.nhsfalcons.com/dtb/insert',
            data: {
                auth: token,
                name,
                js: minified
            }
        });

        globalThis.document.location = '/dt/' + name;
    })();
}

// called by Test Script button
function testScript() {
    (async () => {
        const { docs } = await $.ajax({
            method: 'POST',
            url: 'http://api.nhsfalcons.com/member/query'
        });

        $('#output').html(buildTableHTMLFromScript(docs, editor.getValue()));
    })();
}