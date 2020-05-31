// use jquery

for (let target of $('.goto')) {

    // handle mouse over turing card gray
    $(target).hover(
        function () {
            // on mouse enter
            $(this).toggleClass('is-grey');
            $(this).toggleClass('is-info');
        },

        function () {
            // on mouse exit
            $(this).toggleClass('is-grey');
            $(this).toggleClass('is-info');
        }
    );

    // handle redirecting on click (keeping token ofc 😜)
    $(target).click(() => {
        window.setTimeout(function() {
            window.location.href = $(target).attr('target') + 
                window.location.search;
        }, 100);
    });
}

// handle loading data for metrics

$.ajax({
    type: 'POST',
    url: 'http://localhost:2020/member/query',
    data: { query: { active: true } }, // pull all active members
    success: function (res) {
        let { docs } = res;
        $('#metric-Members').html(docs.length);

        setLoading('Members', false); // show metric

        let totalHours = 0;
        for (let member of docs) {
            for (let volunteerEvent of member.volunteering) {
                totalHours += volunteerEvent.hours;
            }
        }
        $('#metric-Hours-Volunteered').html(totalHours);
        setLoading('Hours-Volunteered', false); // show
    }
})