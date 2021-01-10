// use jquery

const monthIndex = { 
    1: 'January',
    2: 'February',
    3: 'March',
    4: 'April',
    5: 'May',
    6: 'June',
    7: 'July',
    8: 'August',
    9: 'September',
    10: 'October',
    11: 'November',
    12: 'December'
 }

 const id = $('#member-id').attr('value');

function loadData() {
    setLoading('main', true);

    $('#main-table').find('tbody').empty();
    $('#tutoring-table').find('tbody').empty();
    $('#volunteering-table').find('tbody').empty();

    $.ajax({
        type: 'POST',
        url: 'http://api.nhsfalcons.com/member/query',
        data: { query: { _id: id }},
        success: function (data) {
            let doc = data.docs.shift();

            // Load Hero
            $('#member-name').html(doc.name);
            $('#member-position').html(doc.position.charAt(0).toUpperCase() + doc.position.slice(1)); // capitilize first letter

            // set Hero color depending on if member is officer
            $('.hero').addClass(doc.position != 'member' ? 'is-primary' : 'is-info');

            let hours = 0;
            for (let volunteeringEvent of doc.volunteering) {
                hours += volunteeringEvent.hours;
            }

            let meetings = 0;
            for (let event of doc.attendence) {
                if (event.isMeeting)
                    meetings++;
            }

            // Load main table
            $('#main-table').find('tbody').append($('<tr>')
                .append($('<td>').html(doc.name))
                .append($('<td>').html(doc.grade))
                .append($('<td>').html(doc.active ? '<span class="tag is-success">Yes</span>': '<span class="tag is-danger">No</span>'))
                // .append($('<td>').html(doc.cord ? '<span class="tag is-success">Yes</span>': '<span class="tag is-danger">No</span>'))
                .append($('<td>').html(doc.position))
                .append($('<td>').attr('id', 'main-table-hours').html(hours))
                .append($('<td>').html(doc.attendence.length))
                .append($('<td>').html(meetings))
                .append($('<td>').html(doc.probation ? '<span class="tag is-danger">PROBATION</span>' : '<span class="tag is-success">No</span>'))
            );

            // load tutoring table

            for (let session of doc.tutoring) {
                $('#tutoring-table').find('tbody').append(
                    $('<tr>').append($('<td>').html(monthIndex[session.month])).append($('<td>').html(session.count))
                );
            }

            // load attendence table

            for (let event of doc.attendence) {
                $('#attendence-table').find('tbody').append(
                    $('<tr>')
                        .append(
                            $('<td>').html(`${event.month}-${event.day}-${event.year}`)
                        )
                        .append(
                            $('<td>').html(event.title)
                        )
                        .append(
                            $('<td>').append(
                                $('<span>').addClass('tag').addClass(event.isMeeting ? 'is-warning' : '').html(event.isMeeting ? 'meeting' : 'event')
                            )
                        )
                )
            }

            // load volunteering table

            for (let vlt of doc.volunteering) {
                $('#volunteering-table').find('tbody').append(
                    generateStaticVolunteeringRow(vlt.month, vlt.day, vlt.year, vlt.title, vlt.hours, vlt.inDistrict ? 'In District' : 'Out of District', vlt._id)
                )
            }

            $('#volunteering-table').find('tbody').append(generateEditableVolunteeringRow(null, null, null, null, null, null, null, true, true))
            setLoading('main', false);
        }
    });
}

function generateStaticVolunteeringRow(month, day, year, title, hours, district, volunteeringID) {
    return $('<tr>')
        .append($('<td>').html(`${month}-${day}-${year}`))
        .append($('<td>').html(title))
        .append($('<td>').html(hours))
        .append($('<td>').append(
            $('<span>')
                .addClass('tag').addClass( district == 'In District' ? 'is-info' : 'is-warning')
                .html(district)
        ))
        .attr('onclick', `
            $(this).replaceWith(generateEditableVolunteeringRow(
                ${month},
                ${day},
                ${year},
                "${title}",
                ${hours},
                '${district}',
                '${volunteeringID}'
            ));
        `);
}

function generateEditableVolunteeringRow(month, day, year, title, hours, district, volunteeringID, isCreate, isNewVolunteeringEvent) {
    let tr = $('<tr>').attr('id', volunteeringID + '-row')
        .append(
            $('<td>')
                .append($('<div>').addClass('columns')
                    .append('<div>').addClass('column').append($('<input>').attr('type', 'number').attr('min', '1').attr('max', '12').addClass('input is-small').attr('placeholder', 'mo').attr('value', month).attr('id', volunteeringID + '-month'))
                    .append('<div>').addClass('column').append($('<input>').attr('type', 'number').attr('min', '1').attr('max', '31').addClass('input is-small').attr('placeholder', 'dy').attr('value', day).attr('id', volunteeringID + '-day'))
                    .append('<div>').addClass('column').append($('<input>').attr('type', 'number').attr('min', '2020').addClass('input is-small').attr('placeholder', 'yr').attr('value', year).attr('id', volunteeringID + '-year'))
                )
        )
        .append(
            $('<td>').attr('style', 'width:40%')
                .append($('<input>').addClass('input is-small').attr('placeholder', 'Event Title').attr('value', title).attr('id', volunteeringID + '-title'))
        )
        .append(
            $('<td>')
                .append(
                    $('<input>')
                        .addClass('input is-small')
                        .attr('type', 'number')
                        .attr('placeholder', 'hrs')
                        .attr('min', 1)
                        .attr('value', hours || 0)
                        .attr('id', volunteeringID + '-hours'))
                        
                
        )
        .append(
            $('<td>')
                .append(
                    $('<div>').addClass('columns')
                    .append(
                        $('<div>').addClass('column')
                            .append(
                                $('<div>').addClass('select is-small')
                                    .append(
                                        $('<select>').attr('id', volunteeringID + '-district')
                                            .append($('<option>').attr(district == 'In District' ? 'selected' : 'value', '').attr('value', 'In District').html('In District'))
                                            .append($('<option>').attr(district == 'Out of District' ? 'selected' : 'value', '').attr('value', 'Out of District').html('Out of District'))
                                    )
                            )
                    )
                    .append(
                        $('<div>').addClass('column')
                            .append(
                                $('<div>').addClass('button is-small is-success').html('✔').attr('onclick', `saveVolunteeringRow('${volunteeringID}', ${isCreate == true})`)
                            )
                    )
                    .append(
                        $('<div>').addClass('column')
                            .attr('style', isNewVolunteeringEvent ? 'display: none' : '')
                            .append(
                                $('<div>').addClass('button btn-remove is-small is-danger').html('✖').attr('onclick', `saveVolunteeringRow('${volunteeringID}', false, true)`)
                            )
                    )
                )
        )
    return tr;
}

function saveVolunteeringRow(volunteeringID, isCreate, isRemove) {
    console.log(isCreate);

    let month = $('#' + volunteeringID + '-month').val();
    let day = $('#' + volunteeringID + '-day').val();
    let year = $('#' + volunteeringID + '-year').val();
    let title = $('#' + volunteeringID + '-title').val();
    let hours = $('#' + volunteeringID + '-hours').val();
    let district = $('#' + volunteeringID + '-district').val();

    console.log(month, day, year, title, hours);

    if (month == "" || day == "" || year == "" || title == "" || hours == "") {
        alert('No empty values allowed. No action taken.');
        return;
    }

    if (isRemove) {
        $.ajax({
            type: 'POST',
            url: 'http://api.nhsfalcons.com/volunteering/remove',
            data: { volunteeringID, memberID: id },
            success: json => {
                console.log(json);
                $('#' + volunteeringID + '-row').remove();
            }
        });
    }
    
    else {
        $.ajax({
            type: 'POST',
            url: 'http://api.nhsfalcons.com/member/query',
            data: { query: { _id: $('#member-id').attr('value') } },
            success: data => {
                let member = data.docs[0];
                for (let i in member.volunteering) {
                    let vlt = member.volunteering[i];
                    if (vlt._id == volunteeringID) {
                        // update entry
                        found = true;

                        member.volunteering[i].month = month;
                        member.volunteering[i].day = day;
                        member.volunteering[i].year = year;
                        member.volunteering[i].title = title;
                        member.volunteering[i].inDistrict = (district == 'In District'),
                        member.volunteering[i].hours = hours;

                        // send update to API

                        $.ajax({
                            type: 'POST',
                            url: 'http://api.nhsfalcons.com/member/update',
                            
                            data: { filter: { _id: $('#member-id').attr('value') }, update: { volunteering: member.volunteering } },
                            success: () => {
                                $('#' + volunteeringID + '-row').replaceWith(generateStaticVolunteeringRow(month, day, year, title, hours, district, volunteeringID));
                                
                                let newHrs = 0;
                                
                                for (let volunteeringEvent of member.volunteering) {
                                    newHrs += Number.parseFloat(volunteeringEvent.hours);
                                }

                                $('#main-table-hours').html(newHrs); // update total hours on main table
                            }
                        });
                    }
                }

                // if marked as create (the last row), then create new, replace self with new, and clone self below

                if (isCreate) {
                    $.ajax({
                        type: 'POST',
                        url: 'http://api.nhsfalcons.com/volunteering/new',
                        data: { memberID: member._id, day, month, year, hours, inDistrict: district == 'In District', title},
                        success: json => {
                            console.log(json);
                            $('#volunteering-table').find('tbody').find('tr:last-child').replaceWith(generateStaticVolunteeringRow(month, day, year, title, hours, district, json.volunteeringDoc._id)); // replace with static entry
                            $('#volunteering-table').find('tbody').append(generateEditableVolunteeringRow(null, null, null, null, null, null, null, true, true)); // create new row on bottom for new entry
                            
                            let newHrs = 0; 
                            for (let volunteeringEvent of json.member.volunteering) {
                                newHrs += Number.parseFloat(volunteeringEvent.hours);
                            }

                            $('#main-table-hours').html(newHrs); // update total hours on main table  
                        }
                    });
                }
            }
        });
    }
}

loadData();