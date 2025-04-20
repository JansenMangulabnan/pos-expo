$(document).ready(function () {
    $('#signupForm').on('submit', function (event) {
        event.preventDefault();

        // Get password and confirm password values
        const password = $('#password').val();
        const confirmPassword = $('#confirm-password').val();

        // Check if passwords match
        if (password !== confirmPassword) {
            showPopup('Passwords do not match.');
            return; // Stop form submission
        }

        const formData = $(this).serialize();

        $.ajax({
            url: '/signup',
            method: 'POST',
            data: formData,
            success: function (response) {
                if (response.success) {
                    showPopup(response.message);
                    setTimeout(() => {
                        window.location.href = response.redirectUrl;
                    }, 2000); // Wait 2 seconds before redirecting
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