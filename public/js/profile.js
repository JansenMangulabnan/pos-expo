$(document).ready(function () {
    $(document).on("click", ".notification-item", function () {
        const orderId = $(this).attr("id");
        window.location.href = `/order/${orderId}`;
    });

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
            setTimeout(() => {
                $("#profileDetails").css("opacity", "1");
            }, 0);
            $("#profileDetails").focus();
        } else {
            $("#profileDetails").css("opacity", "0");
            setTimeout(() => {
                $("#profileDetails").css("display", "none");
            }, 300);
        }
    });

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

    const isSeller = $("#profileIcon").data("is-seller");

    if (isSeller) {
        $(".cart-icon").hide();
    }

    let toggleNotif = false;

    // Fetch and display user notifications
    function loadUserNotifications() {}

    $(".notification-icon").click(function () {
        toggleNotif = !toggleNotif;
        if (toggleNotif) {
            $("#notificationDetails").css("display", "flex");
            setTimeout(() => {
                $("#notificationDetails").css("opacity", "1");
            }, 0);
            loadUserNotifications();
        } else {
            $("#notificationDetails").css("opacity", "0");
            setTimeout(() => {
                $("#notificationDetails").css("display", "none");
            }, 300);
        }

        $.ajax({
            url: "/api/userNotifications",
            method: "GET",
            success: function (response) {
                if (response.success) {
                    const notificationList = $("#notificationList");
                    notificationList.empty();
                    response.history.forEach((notification) => {
                        notificationList.append(
                            `<div class='notification-item' id='${notification.history_id}'>
                                <p>#${notification.history_id}</p>
                                <p>${notification.history_product_name}</p>
                                <p><strong>Process on:</strong> ${notification.history_order_date}</p>
                            </div>`
                        );
                    });
                }
            },
            error: function () {
                console.error("Failed to load notifications");
            },
        });
    });

    $(document).click(function (e) {
        if (
            !$(e.target).closest(".notification-icon, #notificationDetails")
                .length
        ) {
            $("#notificationDetails").css("display", "none");
            toggleNotif = false;
        }
    });
});
