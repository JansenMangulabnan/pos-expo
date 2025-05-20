$("document").ready(function () {
    $("#logOutBtn").click(function () {
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

    $("#btnLogin").click(function () {
        window.location.href = "/login";
    });

    $("document").ready(function () {
        $("#dropDown").click(function () {
            const dropdownContent = $(".dropdown-content");
            dropdownContent.toggleClass("visible"); // Toggle the 'visible' class
        });
    });

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        $("body").addClass("light-mode");
        $toggleButton.empty().append("<i class='bx bxs-moon'></i>");
    }
});
