function loadEvents() {
    $.ajax({
        type: 'POST',
        url: 'http://api.nhsfalcons.com/member/query',
        data: { query: { } },
        success: memberJSON => {
            $.ajax({
                type: 'POST',
                url: 'http://api.nhsfalcons.com/event/query',
                data: { query: {  } },
                success: eventJSON =>  {
                    let events = eventJSON.docs;
                    let members = memberJSON.docs;

                    for (let event of events) {
                        let attendenceCount = 0;

                        for (let member of members) {
                            for (let atd of member.attendence) {
                                if (atd._id == event._id)
                                    attendenceCount ++;
                            }
                        }

                        let turnout = (attendenceCount / memberJSON.docs.length * 100).toFixed(2);
                        console.log('rendering event...', attendenceCount, event);

                        $('#events-table').find('tbody').append(generateStaticRow(
                            event._id,
                            event.title,
                            event.month,
                            event.day,
                            event.year,
                            event.isMeeting,
                            attendenceCount,
                            turnout
                        ));
                    }
        
                    setLoading('main', false);
                }
            });
        }
    });
}

function generateStaticRow(id, title, day, month, year, isMeeting, attendence, turnout) {
    let tr = $('<tr>').attr('eventid', id)
    .append(
        $('<td>')
            .append(
                    $('<a>')
                        .addClass('button is-inverted is-dark is-small')
                        .append(
                            $('<span>').addClass('icon is-small')
                                .append(
                                    $('<i>').addClass('fas fa-clipboard')
                                )
                        )
                        .attr('href', `/attendence?eventid=${id}&token=${$('#token')[0].innerText}`)
                        .html('Take Attendence')
            )
    )    
    .append(
            $('<td>').html(`${month}-${day}-${year}`)
        )
        .append(
            $('<td>').html(title)
        )
        .append(
            $('<td>')
                .append(
                    $('<span>')
                        .addClass('tag')
                        .addClass(isMeeting ? 'is-warning' : 'is-light')
                        .html(isMeeting ? 'meeting' : 'event')           
                )
        )
        .append(
            $('<td>').html(attendence)
        )
        .append(
            $('<td>').html(turnout + "%")
        )

    return tr;
}

$(() => {
    setLoading('main', true);
    loadEvents();
});