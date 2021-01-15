// use jquery

/**
 * OP CODES:
 *  1: LESS THAN
 *  2: GREATER THAN
 *  3: LESS THAN EQUAL TO
 *  4: GREATER THAN EQUAL TO
 */

let selectedMembers;

function loadMembers(hourReq, opCode) {
    setLoading('main', true);

    $.ajax({
        method: 'POST',
        url: 'http://api.nhsfalcons.com/hours',
        success: json => {
            let { code, memberDocs } = json;
            if (code == 400) {
                console.log(json.err);
                return;
            }

            selectedMembers = [];

            if (typeof hourReq != 'undefined' && opCode) {

                for (let member of memberDocs) {
                    if (assertViaOpcode(member.hours, hourReq, opCode))
                        selectedMembers.push(member);
                }
            } else {
                memberDocs.forEach(_this => selectedMembers.push(_this)); // clone memberDocs into selectedMembers (select all, no restrictions)
            }

            // show selected Members

            $('tbody').empty(); // clear all children

            for (let member of selectedMembers) {
                $('tbody').append($('<tr>')
                    .attr('memberid', member._id)
                    .append($('<td>')
                        .attr('style', 'width: 7%')
                        .html(member.hours)
                    ).append($('<td>')
                        .html(member.name)
                    ).append($('<td>')
                        .append($('<div>')
                            .addClass('field')
                            .append($('<div>')
                                .addClass('control')
                                .attr('style', 'float: right; margin: auto 2%')
                                .append($('<input>')
                                    .attr('type', 'checkbox')
                                    .attr(member.probation ? 'checked' : 'null', '')
                                )
                            )
                        )
                    )
                )
            }

            $('#btn-save').removeClass('is-loading');
            setLoading('main', false);
        }
    })
}

function assertViaOpcode(value1, value2, opCode) {
    if (typeof value1 == 'undefined' || typeof value2 == 'undefined' || typeof opCode == 'undefined')
        return false;

    switch (opCode) {
        case 1:
            return value1 < value2;
        case 2:
            return value1 > value2;
        case 3:
            return value1 <= value2;
        case 4:
            return value1 >= value2;
    }
}

// Called by Search Button
function handleSearchRequest() {
    let opCode;
    let e = 1;
    for (let child of $('#select-operator').children()) {
        child = $(child);
        if (child[0].selected)
            opCode = e;
        e++;
    }

    let hours = $('#input-hours').val();
    hours = Number.parseFloat(hours);


    loadMembers(hours, opCode);
}

function findSelectedMemberById(key) {
    for (let member of selectedMembers) {
        if (member._id == key)
            return member;
    }

    return null;
}

// Called by Save Probation button
function handleSaveButtonRequest() {
    setLoading('main', true);
    $('#btn-save').addClass('is-loading');

    let counter = 0;

    let onProbation = [];
    let notOnProbation = [];

    for (let row of $('#table-members').find('tbody').children()) {
        row = $(row);
        let isChecked = row.find('input').is(':checked')

       if (isChecked)
            onProbation.push(row.attr('memberid'));
        else
            notOnProbation.push(row.attr('memberid'));
    }


    (async () => {
        for (let memberid of onProbation) {
            // send update request to API only if member is not already on probation
            if (!findSelectedMemberById(memberid).probation) {
                await $.ajax({
                    method: 'POST',
                    url: 'http://api.nhsfalcons.com/member/update',
                    data: {
                        filter: { '_id': memberid },
                        update: { probation: true }
                    }
                });

                counter++;
            }
        }

        for (let memberid of notOnProbation) {
            // send update request to API only if member is already on probation and needs to be taken off of probation
            if (findSelectedMemberById(memberid).probation) {
                await $.ajax({
                    method: 'POST',
                    url: 'http://api.nhsfalcons.com/member/update',
                    data: {
                        filter: { '_id': memberid },
                        update: { probation: false }
                    }
                });

                counter++;
            }
        }

        // reload only if edits have been made
        if (counter > 0)
            handleSearchRequest(); // reload members with search params
        else
            $('#btn-save').removeClass('is-loading'); // normally removed from loadMembers(), which wouldnt be called. Remove it here
        setLoading('main', false);
        console.log('Update ' + counter + ' members [done]');
    })();
}

function handleMarkAllButton() {
    for (let row of $('tbody').children()) {
        $(row).find('input').prop('checked', true);
    }
}

function handleUnmarkAllButton() {
    for (let row of $('tbody').children()) {
        $(row).find('input').prop('checked', false);
    }
}

function handleInvertButton() {
    for (let row of $('tbody').children()) {
        $(row).find('input').prop('checked', !$(row).find('input').is(':checked'))
    }
}

loadMembers(); // select all members the first time