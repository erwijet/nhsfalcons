/**
 * Create table HTML from data and a table script
 * @param { JSON } jsonData The raw data from the db to use in the table
 * @param { String } tableScript The script to transform the table
 * @returns { String } The HTML representation of the table 
 */
function buildTableHTMLFromScript(jsonData, tableScript) {
    let _in = jsonData;
    let _out = [];
    let err;
    
    try {
        eval (`try { ${tableScript} } catch (e) { err = e; };`);
    } catch (e) {
        err = e;
    }

    if (err)
        return '<center><table class="table is-fullwidth is-bordered is-striped"><tr><th>An exception occured!</th></tr><tr><td>' + err.toString(); + '</td></tr></table></center>';

    let table = $('<table>').addClass('table is-fullwidth is-bordered is-striped');

    let headers = [];
    _out.forEach(elem => {
        for (let key of Object.keys(elem)) {
            if (!headers.includes(key))
                headers.push(key);
        }
    });

    table.append(tr(headers.map(header => th(header))));
    _out.forEach(elem => {
        table.append(tr(Object.values(elem).map(val => td(val))));
    });

    return table.get(0); // jQuery -> HTML
}

function th(str) {
    let newTh = $('<th>');

    newTh.html(str);

    return newTh;
}

function td(str) {
    let newTd = $('<td>')

    newTd.html(str);

    return newTd;
}

function tr(...children) {
    let newTd = $('<tr>');

    children.forEach(elem => {
        newTd.append(elem);
    });

    return newTd;
}