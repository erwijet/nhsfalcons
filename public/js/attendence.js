// use jquery

function loadEvents() {
    setLoading('global', true);
    let selector = '#eventSelect';
    let query = {};

    $.ajax({
        type: 'POST',
        url: 'http://api.nhsfalcons.com/event/query',
        success: json => {
            let events = json.docs;

            for (let event of events) {
                let val = `${event.title} (${event.month}/${event.day})`;
                $(selector).append($('<option>').attr('eventID', event._id).attr('value', val).attr('isMeeting', event.isMeeting).html(val));
            }

            eventSelectChange($('#eventSelect')); // show meeting badge if default event is a meeting

            setLoading('global', false); // show page
        }
    })
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
            console.log(eventJSON.docs);

            let event = eventJSON.docs[0];

            $.ajax({
                type: 'POST',
                data: { query: { active: true } },
                url: 'http://api.nhsfalcons.com/member/query',
                success: memberJSON => {
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
            continue; // ignore headers

        if (checked)
            didAttend.push(memberID);
        else
            didNotAttend.push(memberID);
    }

    $.ajax({
        type: 'POST',
        url: 'http://api.nhsfalcons.com/attendence/update-bulk',
        data: {
            memberIDs: didAttend,
            eventID: $('#eventSelect').find(':selected').attr('eventID'),
            state: true
        },
        success: (json) => { 
            $.ajax({
                type: 'POST',
                url: 'http://api.nhsfalcons.com/attendence/update-bulk',
                data: {
                    memberIDs: didNotAttend,
                    eventID: $('#eventSelect').find(':selected').attr('eventID'),
                    state: false
                },
                success: (json) => {
                    $('#save-button').removeClass('is-loading');
                }
            });
        }
    });
}

loadEvents();