// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
var projectId = 'GoodSalesDemo',
    user = 'bear@gooddata.com',
    passwd = 'jindrisska';

// Show login info
$('.root').append('<div class="login-loader">Logging in...</div>');

sdk.login(user, passwd).then(function() {
    // Loged in
    $('div.login-loader').remove();
    $('.root').append('<div class="loading-data">Loading data...</div>');

    sdk.getColorPalette(projectId).then(function(colors) {
        $('.loading-data').remove();
        colors.forEach(function(c) {
            var styleStr = 'rgb('+c.r+','+c.g+','+c.b+');';
            $('#list').append('<li class="list-group-item" style="background:'+styleStr+'">'+styleStr+'</li>');
        });
        $('#list').sortable();
    });
    // Do your stuff here
    // ...
});
