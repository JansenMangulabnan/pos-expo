$(document).ready(function () {
    $(".sidebar-logout").click(function () {
        $.ajax({
            url: "/logout",
            method: "POST",
            success: function (response) {
                window.location.href = "/";
            },
            error: function (xhr) {
                const errorMessage =
                    xhr.responseJSON?.message ||
                    "An unexpected error occurred.";
                showPopup(errorMessage);
            },
        });
    });
});
