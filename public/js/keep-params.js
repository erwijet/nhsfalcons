// use jquery
// run on DOMContentLoaded to make sure all 'a' tags are targeted

$(applyLinkTokenization);

// any a tag link redirect will keep the token
function applyLinkTokenization() {
    $('a').click(function(e) {
        e.preventDefault();

        let params = window.location.search;
        let dest = $(this).attr('href');
        params = (dest.indexOf('?') == -1 ? '?' : '&' ) + params.substr(params.search(/(token)[^&]*/), 13);

        if (dest.substr(0, 1) == '#')
            return;

        window.setTimeout(function() {
            window.location.href = dest + params;
        }, 100);
    });

    return true;
}