$(document).ready(function () {
    // On page load, update the notification badge based on local storage
    const readNotifications =
        JSON.parse(localStorage.getItem("readNotifications")) || [];
    const totalNotifications = $(".notification-item").length;
    const unreadCount = totalNotifications - readNotifications.length;

    $("#notificationCount").text(unreadCount > 0 ? unreadCount : 0);

    // Visually mark read notifications
    $(".notification-item").each(function () {
        const orderId = $(this).attr("id");
        if (readNotifications.includes(orderId)) {
            $(this).addClass("read"); // Add a class to style read notifications
        }
    });

    $(document).on("click", ".notification-item", function () {
        const orderId = $(this).attr("id");

        // Mark the notification as read in local storage
        let readNotifications =
            JSON.parse(localStorage.getItem("readNotifications")) || [];
        if (!readNotifications.includes(orderId)) {
            readNotifications.push(orderId);
            localStorage.setItem(
                "readNotifications",
                JSON.stringify(readNotifications)
            );

            // Reduce the notification count
            const notificationCount = $("#notificationCount");
            const currentCount = parseInt(notificationCount.text(), 10);
            if (currentCount > 0) {
                notificationCount.text(currentCount - 1);
            }

            // Visually mark the notification as read
            $(this).addClass("read");
        }

        // Redirect to the order receipt page
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

    // Update badge count and visual marking after loading notifications
    function updateNotificationsUI() {
        const readNotifications =
            JSON.parse(localStorage.getItem("readNotifications")) || [];
        const totalNotifications = $(".notification-item").length;
        const unreadCount = totalNotifications - readNotifications.length;

        const notificationCountElement = $("#notificationCount");
        if (unreadCount > 0) {
            notificationCountElement.text(unreadCount);
            notificationCountElement.show();
        } else {
            notificationCountElement.text(0);
            notificationCountElement.hide();
        }

        $(".notification-item").each(function () {
            const orderId = $(this).attr("id");
            if (readNotifications.includes(orderId)) {
                $(this).addClass("read");
            }
        });
    }

    // Call updateNotificationsUI after dynamically loading notifications
    $(document).on("ajaxSuccess", function () {
        updateNotificationsUI();
    });
    updateNotificationsUI();

    const socket = io();

    socket.on("refreshNotifications", () => {
        loadUserNotifications();
        updateNotificationsUI();
        console.log("Notifications refreshed");
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
});
