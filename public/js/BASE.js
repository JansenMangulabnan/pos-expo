$('document').ready(function() {
    $('#logOutBtn').click(function() {
        $.ajax({
            url: '/logout',
            method: 'POST',
            success: function(response) {
                if (response.success) {
                    window.location.href = response.redirectUrl;
                } else {
                    showPopup(response.message);
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON?.message || 'An unexpected error occurred.';
                showPopup(errorMessage);
            }
        });
    });

    $('#btnLogin').click(function() {
        window.location.href = '/login';
    });

});