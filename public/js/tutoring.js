setLoading('main', false);

function loadMembers(searchText) {
    if (typeof searchText != 'string')
        return;

    (async () => {
        let { docs } = await $.ajax({
            url: 'http://api.nhsfalcons.com/member/query',
            method: 'POST',
            data: { query: { active: true } }
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
    })();
}

function getCurrentSelectedMonthIndex() {
    let i = 0;
    for (let option of $('#select-month').children()) {
        if ($(option).is(':selected'))
            return i;
        i++;
    }
}

function generateTutoringRow(member) {
    let { _id: id, name, tutoring } = member;
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
                    .addClass('button has-text-black is-danger is-inverted')
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

function handleBtnClickPlus(memberid) {
    console.log('Up click ' + memberid);
}

function handleBtnClickSub(memberid) {
    console.log('Down click ' + memberid);
}

loadMembers('');