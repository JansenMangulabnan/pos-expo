$(document).ready(function () {
    $('#loginForm').on('submit', function (event) {
        event.preventDefault();

        const formData = $(this).serialize();

        $.ajax({
            url: '/login',
            method: 'POST',
            data: formData,
            success: function (response) {
                if (response.success) {
                    window.location.href = response.redirectUrl;
                } else {
                    showPopup(response.message);
                }
            },
            error: function (xhr) {
                const errorMessage = xhr.responseJSON?.message || 'An unexpected error occurred.';
                showPopup(errorMessage);
            }
        });
    });

    $(document).ready(function () {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        if (error === 'unauthorized') {
            showPopup('Unauthorized access.');
        }
    }
    );

    function showPopup(message) {
        const $popup = $('#popup');
        $popup.text(message)
            .css({
                display: 'block',
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#f44336',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '5px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                zIndex: 2
            });

        setTimeout(() => {
            $popup.fadeOut();
        }, 3000);
    }
});