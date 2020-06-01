// use jquery

const QUERY = [
    ['Grade', 'Name', 'Probation'],
    ['Equal To', 'Not Equal To']
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function addCondition() {
    let row = $('<tr>');

    // append select boxes
    for (let selectOptions of QUERY) {
        let select = $('<select>').attr('onchange', `
            // on selection changed
        
            let val = $(this).val();
            let input = 
                $(this)
                .closest('tr')
                .find('td:nth-child(3)')
                .find(':first-child')
                .prop('tagName');
            switch (val) {
                case 'Name':
                    if (input != 'INPUT') {
                        $(this)
                        .closest('tr')
                        .find('td:nth-child(3)')
                        .find(':first-child')
                        .replaceWith(
                            $('<input>').addClass('input').attr('type', 'text').attr('placeholder', 'value...')
                        );
                    }
                    break;
                case 'Grade':
                    if (input != 'INPUT') {
                        $(this)
                        .closest('tr')
                        .find('td:nth-child(3)')
                        .find(':first-child')
                        .replaceWith(
                            $('<input>').addClass('input').attr('type', 'text').attr('placeholder', 'value...')
                        );
                    }
                    break;
                case 'Probation':
                    if (input != 'SELECT') {
                        $(this)
                        .closest('tr')
                        .find('td:nth-child(3)')
                        .find(':first-child')
                        .replaceWith(
                            $('<div>').addClass('select').append(
                                $('<select>').append(
                                    $('<option>').html('true')
                                ).append(
                                    $('<option>').html('false')
                                )
                            )
                        );
                    }
                    break;
            }
        `);

        let td = $('<td>');
        for (let option of selectOptions) {
            select.append($('<option>').html(option))
        }
        td.append(
            ($('<div>').addClass('select').append(select))
        );
        row.append(td);
    }

    row.append(
        $('<td>').append(
            $('<input>').addClass('input').attr('type', 'text').attr('placeholder', 'Value...')
        )
    ).append(
        // append "remove" button
        $('<td>').append(
            $('<button>').addClass('button is-danger').append(
                $('<span>').addClass('icon is-small').append(
                    $('<i>').addClass('fas fa-times')
                )
            ).attr('onclick', `$(this).closest("tr").remove();`)
        )
    );

    $('#queries').append(row);
}

function sendRequest(active) {
    // build request
    let query = { active: active || true }; // select only active members

    let rows = $('#queries').find('tr');
    for (let row of rows) {
        let target = $(row).find('td:nth-child(1)').find('select:first-child').val();
        let modifier = $(row).find('td:nth-child(2)').find('select:first-child').val();
        let valueTag = $(row).find('td:nth-child(3)').find(':first-child');
        let tagName = $(valueTag).prop('tagName');
        let value;

        if (tagName == 'DIV')
            value = $(valueTag).find('select').val();
        else
            value = $(valueTag).val();
        if (modifier == 'Not Equal To')
            value = { $ne: value };
        query[target.toLowerCase()] = value;
    }

    setLoading('main', true);
    $('.modal').removeClass('is-active'); // hide all popups

    $.ajax({
        type: 'POST',
        url: 'http://localhost:2020/member/query',
        data: { query },
        success: function (data) {
            // load data into table

            let { docs } = data;
            let table = $('#main-table');
            table.find('tr:gt(0)').remove(); // clear all old data
        
            for (let doc of data.docs) {
                let tr = $('<tr>');
                let tags = $('<div>').addClass('tags');
                tags.append($('<span>').addClass('tag is-white is-medium').html(doc.name));
                
                // role tag
                let tag = $('<span>').addClass('tag');
                switch (doc.position) {
                    case 'president':
                        tag.addClass('is-warning').html('president');
                        break;
                    case 'vice-president':
                        tag.addClass('is-primary').html('vice-president');
                        break;
                    case 'secretary':
                        tag.addClass('is-info').html('secretary');
                        break;
                    case 'treasurer':
                        tag.addClass('is-success').html('treasurer');
                        break
                    default:
                        tag.addClass('is-light').html('member');
                        break;
                }
                tags.append(tag);

                // probation tag

                if (doc.probation == true) {
                    tags.append($('<span>').addClass('tag is-danger').addClass('style', 'text-align: center').html('probation'));
                }

                let name = $('<span>').html(($('<div>').append(tags)).html());

                // actions

                let buttons = $('<div>').addClass('field has-addons');
                let btn;

                // more info button
                btn = $('<p>').addClass('control').append(
                    $('<button>').addClass('button is-small').attr('onclick', `inspectMember('${ doc._id }')`).append(
                        $('<span>').addClass('icon is-small').append(
                            $('<i>').addClass('fas fa-street-view')
                        )
                    ).append($('<span>').html('Inspect'))
                );
                buttons.append(btn);

                // edit button
                btn = $('<p>').addClass('control').append(
                            $('<button>').addClass('button is-small').attr('onclick', `$('#editmember-submit-btn').prop('memberID', '${doc._id}'); $('#editmember-name').val('${doc.name}'); $('#editmember-grade').val(${doc.grade}); $('#editmember-role').val('${doc.position}'); $('#editmember-modal').addClass('is-active');`).append(
                                $('<span>').addClass('icon is-small').append(
                                    $('<i>').addClass('fas fa-user-edit')
                                )
                            ).append($('<span>').html('Edit'))
                        );
                buttons.append(btn);

                // tag for removal button
                btn = $('<p>').addClass('control').append(
                    $('<button>').addClass('button is-small').attr('onclick', `tagMemberForRemoval('${doc.name}', '${ doc._id }')`).append(
                        $('<span>').addClass('icon is-small').append(
                            $('<i>').addClass('fas fa-user-minus')
                        )
                    ).append($('<span>').html('Tag as Inactive'))
                );
                buttons.append(btn);

                tr.append($('<td>').append(name));
                tr.append($('<td>').append($('<span>').html(doc.grade)));
                tr.append($('<td>').append(buttons));

                table.append(tr);
            }

            setLoading('main', false); // show table
        }
    });
}

function tagMemberForRemoval(name, id) {
    $('#removal-member').html(`${name} (${id})`);
    $('#removal-modal').addClass('is-active');
}

function tagMemberForRemovalConfirmed() {
    let id = $('#removal-member').html().split('(').pop();
    id = id.substr(0, id.length - 1);
    $.ajax({
        type: 'POST',
        url: 'http://localhost:2020/member/update',
        data: { 
            filter: { _id: id }, 
            update: { active: false } 
        },
        success: function () {
            sendRequest(); // reload data
        }
    })
}

function loadInactiveMembers() {
    setLoading('main', true);

    $.ajax({
        type: 'POST',
        url: 'http://localhost:2020/member/query',
        data: {query: { active: false }},
        success: function (data) {
            // load data into table


            let table = $('#main-table');
            table.find('tr:gt(0)').remove(); // clear all old data
        
            for (let doc of data.docs) {
                let tr = $('<tr>');
                let tags = $('<div>').addClass('tags');
                tags.append($('<span>').addClass('tag is-white is-medium').html(doc.name));
                
                // role tag
                let tag = $('<span>').addClass('tag');
                switch (doc.position) {
                    case 'president':
                        tag.addClass('is-warning').html('president');
                        break;
                    case 'vice-president':
                        tag.addClass('is-primary').html('vice-president');
                        break;
                    case 'secretary':
                        tag.addClass('is-info').html('secretary');
                        break;
                    case 'treasurer':
                        tag.addClass('is-success').html('treasurer');
                        break;
                    default:
                        tag.addClass('is-light').html('member');
                }
                tags.append(tag);

                // probation tag

                if (doc.probation == true) {
                    tags.append($('<span>').addClass('tag is-danger').addClass('style', 'text-align: center').html('probation'));
                }

                let name = $('<span>').html(($('<div>').append(tags)).html());

                // actions

                let buttons = $('<div>').addClass('field has-addons');

                // make active button
                let btn = $('<p>').addClass('control').append(
                    $('<button>').addClass('button is-small').attr('onclick', `$.ajax({
                        type: 'POST', 
                        url: 'http://localhost:2020/member/update', 
                        data: {
                            filter: {_id: '${doc._id}'}, 
                            update: { active: true }
                        },
                        success: function (data) {loadInactiveMembers()}
                        })`).append(
                        $('<span>').addClass('icon is-small').append(
                            $('<i>').addClass('fas fa-undo-alt')
                        )
                    ).append($('<span>').html('Make Active'))
                );
                buttons.append(btn);

                tr.append($('<td>').append(name));
                tr.append($('<td>').append($('<span>').html(doc.grade)));
                tr.append($('<td>').append(buttons));

                table.append(tr);
            }

            setLoading('main', false); // show table
        }
    });
}

// data validation for new / edit member modal
function checkMemberNameValidation(selector) {
    let valid = false;
    // use lambda invocation to break on ANY invalid condition
    (() => {
        let parts = $(selector).val().trim().split(' ');
        if (parts.length < 2)
            return;
        for (let part of parts) {
            let firstChar = part.substr(0, 1);
            if (firstChar.toUpperCase() != firstChar)
                return;
        }
        valid = true;
    })();

    if (valid) {
        $(selector).addClass('is-success');
        $(selector).removeClass('is-danger');
    } else {
        $(selector).addClass('is-danger');
        $(selector).removeClass('is-success');
    }

    return valid;
}

function checkMemberGradeValidation(selector) {
    let val = $(selector).val();
    val = Math.round(val);

    if (val < 11)
        val = 11;
    if (val > 12)
        val = 12;

    $(selector).val(val);
}

function setupMemberValidation() {
    let selectors = [
        {name: '#member-name', grade: '#member-grade', btn: '#member-submit-btn'},
        {name: '#editmember-name', grade: '#editmember-grade', btn: '#editmember-submit-btn'}
    ];

    for (let selectPair of selectors) {
        $(selectPair.name).on('input', function () {
            let valid = checkMemberNameValidation(selectPair.name);
            if (valid)
                $(selectPair.btn)
                    .removeClass('is-static')
                    .addClass('is-success');
            else
                $(selectPair.btn)
                    .removeClass('is-success')
                    .addClass('is-static');
        });

        $(selectPair.grade).on('input', function () {
            checkMemberGradeValidation(selectPair.grade);
        })
    }
}

function editMember(id) {
    if ($('#editmember-submit-btn').hasClass('is-static'))
        return

    const nameSelect = '#editmember-name';
    const gradeSelect = '#editmember-grade';
    const roleSelect = '#editmember-role';

    let name = $(nameSelect).val();
    let grade = $(gradeSelect).val();
    let position = $(roleSelect).val().toLowerCase();
    
    $.ajax({
        type: 'POST',
        url: 'http://localhost:2020/member/update',
        data: { filter: { _id: id }, update: { name, grade, position }},
        success: function () { sleep(500); sendRequest(); }
    });
}

function newMember() {
    if ($('#member-submit-btn').hasClass('is-static'))
        return;

    const nameSelect = '#member-name';
    const gradeSelect = '#member-grade';
    const roleSelect = '#member-role';

    let name = $(nameSelect).val();
    let grade = $(gradeSelect).val();
    let position = $(roleSelect).val().toLowerCase();
    
    $.ajax({
        type: 'POST',
        url: 'http://localhost:2020/member/create',
        data: { name, grade, position },
        success: function () { sleep(500); sendRequest(); }
    });
}

setupMemberValidation();
sendRequest(); // show all data onload