// use jquery

const modalSelector = '#editevent-modal'; // target edit events modal
const saveButtonSelector = '#save-events-button'; // target save button on said modal

function loadEvents() {
    setLoading('global', true);
    let dropdownSelector = '#eventSelect';
    let bulkEditSelector = '#bulkEventSelect';
    let tableSelector = '#events-table';

    $(bulkEditSelector).empty();
    $(dropdownSelector).empty();

    $.ajax({
        type: 'POST',
        url: 'http://api.nhsfalcons.com/event/query',
        success: json => {
            let events = json.docs;
            // let startingEventID = $('#event-id').attr('value');

            $(tableSelector).find('tbody').empty();

            for (let event of events) {
                let val = `${event.title} (${event.month}/${event.day})`;
                $(dropdownSelector).append($('<option>').attr('eventID', event._id).attr('value', val).attr('isMeeting', event.isMeeting).attr(event._id == $('#event-id').attr('value') ? 'selected' : '_', '').html(val));
                $(bulkEditSelector).append($('<option>').attr('eventID', event._id).attr('value', val).attr('isMeeting', event.isMeeting).attr(event._id == $('#event-id').attr('value') ? 'selected' : '_', '').html(val));

                $(tableSelector).find('tbody').append($('<tr>')
                    .attr('eventid', event._id)
                    .append($('<td contenteditable>')
                        .html(event.title))
                    .append($('<td contenteditable>')
                        .html(event.day))
                    .append($('<td contenteditable>')
                        .html(event.month))
                    .append($('<td contenteditable>')
                        .html(event.year))
                    .append($('<td>')
                        .append($('<center>')
                            .append($('<input>')
                                .attr('type', 'checkbox')
                                .prop(event.isMeeting ? 'checked' : '', event.isMeeting ? 'checked' : '') // set checked state
                            )
                        )
                    )
                    .append($('<button>')
                        .addClass('button is-danger is-inverted btn-delete')
                        .attr('onclick', '$(this).parent().remove()')
                        .append($('<span>')
                            .addClass('icon')
                            .append($('<i>')
                                .addClass('fas fa-trash')
                            )
                        )
                    )
                );
            }

            // $(`option[eventid=${startingEventID}]`).prop('selected', true);
            eventSelectChange($('#eventSelect')); // show meeting badge if default event is a meeting 

            setLoading('global', false); // show page
        }
    })
}

function saveEvents() {
    let newEvents = [];
    // $(modalSelector).find("tbody");

    for (let i of $(modalSelector).find("tbody").children()) {
        let items = $(i).children();

        let id = $(i).attr('eventid'); // get eventID for the row

        // Get the rest of the updated event data

        let title = items[0].innerText;
        let day = Number.parseInt(items[1].innerText);
        let month = Number.parseInt(items[2].innerText);
        let year = Number.parseInt(items[3].innerText);
        let isMeeting = $(items[4]).find("input").is(":checked");

        // Validate entry

        if (typeof title != 'string' ||
            typeof isMeeting != 'boolean' ||
            Number.isNaN(day)   ||
            Number.isNaN(month) ||
            Number.isNaN(year)) continue;

        newEvents.push({ title, day, month, year, isMeeting, _id: id});
    }

    console.log(newEvents);

    // update events in database

    $.ajax({
        method: 'POST',
        url: 'http://api.nhsfalcons.com/event/sync',
        data: { events: newEvents },
        success: json => { 
            $(saveButtonSelector).removeClass('is-loading'); 
            $("#editevent-modal").find("tbody").empty();
            $("#editevent-modal").removeClass("is-active"); 
            
            loadEvents();
        }
    });
}

function eventSelectChange(sender) {
    let html = '';
    if (sender.find(':selected').attr('ismeeting') == 'true')
        html = `<span class="tag is-warning">Meeting</span>`;
    $('#badge').html(html);

    loadMembers(sender.find(':selected').attr('eventID'));
}

function loadMembers(eventID) {
    setLoading('members', true);

    $.ajax({
        type: 'POST',
        url: 'http://api.nhsfalcons.com/event/query',
        data: { query: { _id: eventID } },
        success: eventJSON => {
            let event = eventJSON.docs[0];

            $.ajax({
                type: 'POST',
                data: { query: { active: true } },
                url: 'http://api.nhsfalcons.com/member/query',
                success: memberJSON => {
                    console.log('loadMembers -> memberJSON: ', memberJSON.docs);
                    $('#members-table').find('tbody').empty();
                    for (let member of memberJSON.docs) {
                        let tr = $('<tr>').attr('onclick', `let checked = $(this).find('input').attr('checked'); $(this).find('input').attr('checked', !checked)`)
                        let includes = false; // event is included in member's attendence

                        for (let i in member.attendence) {
                            console.log(member.attendence[i], member.attendence[i]._id == eventID)
                            if (member.attendence[i]._id == eventID) {
                                includes = true;
                                break;
                            }
                        }

                        tr.append($('<td>').html(member.name));
                        tr.append(
                            $('<td>').append(
                                $('<div>').addClass('field').append(
                                    $('<div>').addClass('control').attr('style', 'float: right; margin: auto 2%').append(
                                        $('<input>')
                                            .attr('type', 'checkbox')
                                            .attr('memberID', member._id)
                                            .attr(includes ? 'checked' : 'null', '')
                                    )
                                )
                            )
                        );

                        $('#members-table').find('tbody').append(tr);
                    }
                }
            });

            setLoading('members', false);
        }
    });
}

function saveAttendence() {
    $('#save-button').addClass('is-loading');
    let didAttend = [];
    let didNotAttend = [];

    let members = $('#members-table').find('tr').toArray();
    for (let member of members) {
        let checkbox = $(member).find('input');
        let checked = checkbox.is(':checked');
        let memberID = checkbox.attr('memberid');

        if (typeof memberID == 'undefined')
            continue; // ignore headers or rows without "memberID" arributes

        if (checked)
            didAttend.push(memberID);
        else
            didNotAttend.push(memberID);
    }

    console.log($('#eventSelect').find(':selected').attr('eventID'));

    $.ajax({
        type: 'POST',
        url: 'http://api.nhsfalcons.com/attendence/update-bulk',
        data: {
            memberIDs: didAttend,
            eventID: $('#eventSelect').find(':selected').attr('eventID'),
            state: true
        },
        success: (json1) => { 
            $.ajax({
                type: 'POST',
                url: 'http://api.nhsfalcons.com/attendence/update-bulk',
                data: {
                    memberIDs: didNotAttend,
                    eventID: $('#eventSelect').find(':selected').attr('eventID'),
                    state: false
                },
                success: (json2) => {
                    console.log(json1, json2);
                    $('#save-button').removeClass('is-loading');
                }
            });
        }
    });
}

function onNewEventButtonClick() {
    const tableSelector = '#events-table';

    // run only if the modal is shown
    if (!$(modalSelector).hasClass('is-active'))
        return

    $(tableSelector).find('tbody').append($('<tr>')
        .append($('<td contenteditable>').text('<Event Title>'))
        .append($('<td contenteditable>').text('<Day>'))
        .append($('<td contenteditable>').text('<Month>'))
        .append($('<td contenteditable>').text('<Year>'))
        .append($('<td>')
            .append($('<center>')
                .append($('<input>')
                    .attr('type', 'checkbox')
                )
            )
        )
        .append($('<button>')
            .addClass('button is-danger is-inverted btn-delete')
            .attr('onclick', '$(this).parent().remove()')
            .append($('<span>')
                .addClass('icon')
                .append($('<i>')
                    .addClass('fas fa-trash')
                )
            )
        )
    );
}

function bulkSaveAttendence() {
    (async () => {
        $('#save-attendance-bulk-button').addClass('is-loading');
        let didAttend = [];
        let didNotAttend = [];
        let lines = $('#bulk-edit-lines').val().split('\n');

        let toLookup = [...lines];
        let passN = 0;

        let newToLookup = [];

        // if email is provided, strip domain
        for (let i of toLookup) {
            if (i == "") continue; // remove whitespace

            console.log(i.split('@'));
            if (i.split('@').length > 1) newToLookup.push(i.split('@').shift().trim());
            else newToLookup.push(i.trim());
        }

        toLookup = [...newToLookup];

        while (toLookup.length != 0) {
            console.log('starting pass ' + ++passN + '...', `toLookup: ${toLookup.length}`, `found: ${didAttend.length}`);
            newToLookup = [];

            for (let i in toLookup) {
                let response = await $.ajax({
                    method: 'POST',
                    url: 'http://api.nhsfalcons.com/member/query',
                    // add space before regex to indicate that we are matching last names, not first names
                    data: { query: { name: { '$regex': ' ' + toLookup[i], '$options': 'i' } } }
                });

                let { docs } = response;
                if (docs.length > 1) {
                    alert(`Expression "${toLookup[i]}" is ambiguous. Please replace with specific expression.`)
                }
                else if (docs.length > 0) {
                    let member = docs.shift();
                    console.log(`Member Found! (regex: ${toLookup[i]})`, member)
                    didAttend.push(member._id);
                }
                else {
                    newToLookup.push(toLookup[i]);
                    console.log(`Could not find member (regex: ${toLookup[i]}). Will search again in next pass...`, response)
                }
            }

            toLookup = [];
            toLookup = [...newToLookup];
            toLookup.forEach((_, i) => { toLookup[i] = toLookup[i].substr(0, toLookup[i].length - 1) })
        }

        console.log('[Member Query: DONE] ' + toLookup.length + ' unfound.', didAttend);
        console.log('Starting member update...');

        let { docs } = await $.ajax({
            type: 'POST',
            url: 'http://api.nhsfalcons.com/member/query',
            data: { query: { active: true } }
        });

        docs.forEach(elem => didNotAttend.push(elem._id)); // mark all members did not attend, then update with members that DID attend

        let res;

        res = await $.ajax({
            type: 'POST',
            url: 'http://api.nhsfalcons.com/attendence/update-bulk',
            data: {
                memberIDs: didNotAttend,
                eventID: $('#bulkEventSelect').find(':selected').attr('eventID'),
                state: false
            }
        });

        console.log(res);

        if (didAttend.length > 0) {

            res = await $.ajax({
                type: 'POST',
                url: 'http://api.nhsfalcons.com/attendence/update-bulk',
                data: {
                    memberIDs: didAttend,
                    eventID: $('#bulkEventSelect').find(':selected').attr('eventID'),
                    state: true
                }
            });

            console.log(res);
            
        }

        $('#save-attendance-bulk-button').removeClass('is-loading');
        $('#bulkmark-modal').removeClass('is-active'); // close popup
        $('#event-id').attr('value', $('#bulkEventSelect').find(':selected').attr('eventID'))
        loadEvents();
        // loadMembers($('#bulkEventSelect').find(':selected').attr('eventID')); // refresh attendance
    })();
}

loadEvents();