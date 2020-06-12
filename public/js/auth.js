// use jquery
// use md5.min.js (gh.com/blueimp/JavaScript-MD5)

$(() => $('#keybar').focus());

// hash guess on submit
function onSubmit(form) {
    $('#main-field').toggleClass('is-hidden');
    $('#hidden-field').toggleClass('is-hidden');
    
    let guess = form['guess'];
    guess.value = md5(guess.value);


    return true;
}