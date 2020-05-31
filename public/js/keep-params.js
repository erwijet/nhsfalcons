// any a tag link redirect will keep token

$('a').click(function(e) {
    e.preventDefault();

    let params = window.location.search,
        dest = $(this).attr('href') + params;

    window.setTimeout(function() {
        window.location.href = dest;
    }, 100);
});