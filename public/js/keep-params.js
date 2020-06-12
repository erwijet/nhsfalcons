// any a tag link redirect will keep token

$('a').click(function(e) {
    e.preventDefault();

    let params = window.location.search;
    let dest = $(this).attr('href') + params;

    console.log(dest);

    if (dest.substr(0, 1) == '#')
        return;

    window.setTimeout(function() {
        window.location.href = dest;
    }, 100);
});