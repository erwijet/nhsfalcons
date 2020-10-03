function loadMembers(searchText) {
    if (typeof searchText != 'string')
        return;

    // clear current contents
    $('tbody').empty();
    setLoading('main', true);

    (async () => {
        let { docs } = await $.ajax({
            url: 'http://api.nhsfalcons.com/member/query',
            method: 'POST',
            data: { query: { active: true, name: { '$regex': searchText, '$options': 'i' } } }
        });

        for (let member of docs) {
            if (!member) continue;

            $('tbody').append(
                generateTutoringRow(member)
            );

            let id = member._id;
            
            $(`#btn-add-${id}`).attr('onclick', `handleBtnClickPlus("${ id }")`);
            $(`#btn-sub-${id}`).attr('onclick', `handleBtnClickSub("${ id }")`);
        }

        applyLinkTokenization();

        setLoading('main', false);
    })();
}

function getCurrentSelectedMonthIndex() {
    let i = 0;
    for (let option of $('#select-month').children()) {
        if ($(option).is(':selected'))
            return i + 1;
        i++;
    }
}

function generateTutoringRow(member) {
    let { _id: id, name, tutoring } = member;
    console.log(member);
    let activeMonth = getCurrentSelectedMonthIndex();
    let activeTutoringCredits = -1;

    for (let _this of tutoring) {
        if (activeMonth == _this.month) {
            activeTutoringCredits = _this.count;
            break;
        }
    }

    if (activeTutoringCredits < 0) {
        console.log('[WARN ➡ OK] member with id of ' + id + ' (' + name + ') has no tutoring month entry for month index ' + activeMonth);
        activeTutoringCredits = 0;
    }

    return $('<tr>')
        .attr('memberid', id)
        .append(
            $('<td>')
            .append(
                $('<div>')
                .addClass('field')
                .append(
                    $('<a>')
                    .addClass('button has-text-black is-dark is-inverted')
                    .attr('href', '/advanced/' + id)
                    .text(name)
                )
            )
        )
        .append(
            $('<td>')
            .append(
                $('<div>')
                .attr('style', 'float: right')
                .append(
                    $('<div>')
                    .addClass('field has-addons')
                    .attr('style', 'float: right; width: 50%')
                    .append(
                        $('<div>')
                        .addClass('control')
                        .attr('id', `btn-add-${id}`)
                        .append(
                            $('<div>')
                            .addClass('button has-icons')
                            .append(
                                $('<span>')
                                .addClass('icon')
                                .append(
                                    $('<i>')
                                    .addClass('fas fa-plus')
                                )
                            )
                        )
                    )
                    .append(
                        $('<div>')
                        .addClass('control')
                        .attr('id', `btn-sub-${id}`)
                        .append(
                            $('<div>')
                            .addClass('button has-icons')
                            .append(
                                $('<span>')
                                .addClass('icon')
                                .append(
                                    $('<i>')
                                    .addClass('fas fa-minus')
                                )
                            )
                        )
                    )
                    .append(
                        $('<div>')
                        .addClass('control')
                        .append(
                            $('<input>')
                            .attr('id', `btn-num-${id}`)
                            .attr('onchange', `setTutoringCreditsForMemberid('${id}', $(this).val());`)
                            .addClass('input')
                            .attr('type', 'number')
                            .attr('value', activeTutoringCredits)
                            .attr('style', 'float: right; text-align: center')
                            .attr('min', 0)
                        )
                    )
                )
            )
        )
}

function changeMembersCreditsBy(memberid, num) {
    if (typeof num != 'number' || typeof memberid != 'string')
        return -1;
    
    const creditsSelector = `#btn-num-${memberid}`;
    let credits = $(creditsSelector).val();

    credits = Number.parseFloat(credits) + num;

    $(creditsSelector).val(credits);
    setTutoringCreditsForMemberid(memberid, credits);
}

function setTutoringCreditsForMemberid(memberid, num) {
    console.log('Starting update: ', memberid, num);
    (async () => {
        let res;
        
        res = await $.ajax({
            method: 'POST',
            url: 'http://api.nhsfalcons.com/tutoring/create',
            data: { memberID: memberid, month: getCurrentSelectedMonthIndex(), count: num }
        });

        if (res.code == 400) { // if create request rejected; entry for month index already exists
            res = await $.ajax({
                method: 'POST',
                url: 'http://api.nhsfalcons.com/tutoring/update',
                data: { memberID: memberid, month: getCurrentSelectedMonthIndex(), count: num }
            });

            console.log('updated! ', res);
        } else console.log('created!', res);
    })();
}

function handleBtnClickPlus(memberid) {
    changeMembersCreditsBy(memberid, 1);
}

function handleBtnClickSub(memberid) {
    changeMembersCreditsBy(memberid, -1);
}

function setupHandles() {
    $('#quicksearch-form').submit(e => {
        e.preventDefault();
        loadMembers($('#quicksearch-text').val());
    });
}

setupHandles();
loadMembers('');