
$(document).ready(function () {
    const profileImage = $("#profileImage");
    const profilePlaceholder = $("#profilePlaceholder");
    
    // Check if the profile image is empty or fails to load
    if (!profileImage.attr("src") || profileImage.attr("src").trim() === "") {
        profileImage.css("display", "none"); // Hide the image
        $("#profileDetailImage").css("display", "none"); // Hide the detail image
        profilePlaceholder.css("display", "flex"); 
    }
    
    // Handle image load error
    profileImage.on("error", function () {
        $(this).hide(); // Hide the image
        profilePlaceholder.css("display", "flex");
    });

    let togglePfp = false;

    $("#profileIcon").click(function () {
        togglePfp = !togglePfp;
        if (togglePfp) {
            $("#profileDetails").css("display", "flex");
            $("#profileDetails").focus();
        } else {
            $("#profileDetails").css("display", "none");
        }
    })

    $(document).click(function (e) {
        if (!$(e.target).closest("#profileIcon, #profileDetails").length) {
            $("#profileDetails").css("display", "none");
            togglePfp = false;
        }
    });

    $(".detail-logout").on("click", function () {
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