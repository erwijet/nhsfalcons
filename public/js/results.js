// use jquery
// results "admin" page for live.nhsfalcons.com
// served from this project to make use of /auth

let tokenRegex = new RegExp(/(?<=token=)[^&\s]*/i);
let token = globalThis.location.search.substr(1);
token = tokenRegex.exec(token).shift();

let options;
let votes;
let totalVotes;
let winner;

$(() => {
    $('#tags').removeClass('is-hidden');
    options = JSON.parse($('#starting-options').attr('json'));
    
    for (let option of options) {
        $('#navpanel').append(generateNavBlock(option));
    }

    totalVotes = 0;
    votes = [];
    winner = 0;

    // quick way to resize and fill votes array
    options.forEach((_, i) => votes[i] = 0);

    channel.bind('vote', data => {
        for (let i in data.options) {
            if (options[i] != data.options[i]) {
                options = [...data.options];
                totalVotes = 0; 
                for (let e in options) {
                    votes[e] = 0; // reset votes
                }
                break;
            }
        }

        votes[data.index]++;
        totalVotes++;

        $('#results-table').find('tbody').empty();

        let winner = votes.reduce((a, b) => Math.max(a, b));
        let winningIndex = votes.indexOf(winner);

        showVoteResults(winningIndex);
    });
});

function showVoteResults(winningIndex) {
    $('#results-table').find('tbody').empty();
    for (let i in options) {
        $('#results-table').find('tbody').append(
            $('<tr>').addClass(winningIndex == i ? 'is-selected' : '')
                .append($('<td>').html(options[i]))
                .append($('<td>').html(votes[i]))
                .append($('<td>').html(((votes[i] / totalVotes) * 100).toFixed(2) + '%'))
        )
    }
}

function addOption(name) {
    if (!name || name == '')
        return;

    options.push(name);
    $('#navpanel').append(generateNavBlock(name));
    $('#newoption').val(''); // "move" option from text box to list

    syncOptions();
}

function removeOption(name) {
    let i = options.indexOf(name);
    options.splice(i, 1);

    syncOptions();
}

function syncOptions() {
    votes = [];
    options.forEach(i => votes.push(0)); // clear votes
    totalVotes = 0;

    $.ajax({
        type: 'POST',
        url: '/live/set?token=' + token,
        data: {
            key: 'options',
            value: options
        },
        success: json => {
            console.log(json);
            if (json.code != 200) 
                alert(json.msg);
        }
    })
}

function updateLiveAccess() {
    let status = $('#activeSwitch').is(':checked');
    $.ajax({
        type: 'POST',
        url: '/live/set?token=' + token,
        data: {
            key: 'votingState',
            value: status
        },
        success: json => {
            if (json.code != 200) {
                alert('Something went wrong!')
                alert(json.msg);
            }
        }
    });
}

function generateNavBlock(name) {
    return $('<a>')
        .addClass('panel-block')
        .append($('<div>')
            .addClass('field')
            .attr('style', 'width: 100%')
            .append($('<p>')
                .addClass('control has-icons-right')
                .append($('<input>')
                    .attr('readonly', '')
                    .attr('type', 'text')
                    .attr('value', name)
                    .addClass('input is-expanded is-static has-icons-right'))
                .append($('<span>')
                    .addClass('icon is-right')
                    .append($('<i>')
                        .addClass('fas fa-trash'))
            )
        )
        .attr('onclick', `removeOption("${name}"); this.parentElement.setAttribute("style", "display: none")`)
        .attr('onmouseenter', '$(this).closest("icon").addClass("is-danger");')
        );
        // .append($('<span>')
        //     .addClass('panel-icon')
        //     .append($('<i>')
        //         .attr('onclick', `removeOption("${name}")`)
        //         .addClass('fas fa-trash')))
        // .append(name);
}