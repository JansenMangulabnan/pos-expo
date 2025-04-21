$('document').ready(function() {
    $('#logOutBtn').click(function() {
        $.ajax({
            url: '/logout',
            method: 'POST',
            success: function(response) {
                window.location.href = '/';
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

    $('#dropDown').click(function () {
        const dropdownContent = $('.dropdown-content');
        dropdownContent.toggle();
    });
});