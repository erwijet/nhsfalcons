$(diagnose);

function diagnose() {
    (async () => {
        setLoading('main', true);

        // PULL all member data from db (yes, all of it)

        await $.ajax({
            method: 'POST',
            url: 'http://api.nhsfalcons.com/member/query',
            success: data => {
                // FIND WHERE MEMBER CONTAINS A VOLUNTEERING ARRAY
                // WITH A NULL ELEMENT
                let brokenData = [];
                data = data.docs;

                data.forEach(elem => {
                    let brokenItems = 0;

                    elem.volunteering.forEach(evt => {
                        if (!evt) brokenItems++;        
                    });

                    brokenData.push({
                        name: elem.name,
                        _id: elem._id,
                        brokenItems: brokenItems
                    });
                });

                // SORT table by brokenItems greatest to lowest

                brokenData.sort((a, b) => 
                    a.brokenItems > b.brokenItems ? -1 : 
                        a.brokenItems == b.brokenItems ? 0 : 1);

                // APPEND data to table

                console.log(brokenData);
                $('#memberTable').find('tbody').empty();
                $('#memberTable').find('tbody').append($('<tr>').append($('<th>').html('Member')).append($('<th>').html('Null Entries ( target: 0 )')))

                brokenData.forEach(elem => {
                    $('#memberTable').find('tbody')
                        .append(
                            $('<tr>').attr('id', elem._id).append(
                                $('<td>').html(elem.name)
                            ).append(
                                $('<td>').html(elem.brokenItems)
                            )
                        )
                });

                setLoading('main', false);
            }
        })
    })();
}