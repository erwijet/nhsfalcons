// any a tag link redirect will keep token

$('a').click(function(e) {
    e.preventDefault();

    let params = window.location.search;
    let dest = $(this).attr('href') + params;

    if (dest == '#')
        return;

    window.setTimeout(function() {
        window.location.href = dest;
    }, 100);
});