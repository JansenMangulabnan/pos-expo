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

    // Fetch and display notifications for user or seller
    function loadNotifications() {
        const notificationList = $("#notificationList");
        notificationList.empty();
        if (isSeller) {
            $.ajax({
                url: "/api/shopOrders",
                method: "GET",
                success: function (response) {
                    if (response.success && Array.isArray(response.orders)) {
                        response.orders.forEach((order) => {
                            notificationList.append(
                                `<div class='notification-item' id='order-${order.order_id}'>
                                    <p><strong>New Order:</strong> #${order.order_id}</p>
                                    <p>${order.product_name}</p>
                                    <p><strong>Customer:</strong> ${order.user_name}</p>
                                    <p><strong>Quantity:</strong> ${order.order_quantity}</p>
                                    <p><strong>Date:</strong> ${order.order_date}</p>
                                    <p><strong>Total Price:</strong> ₱${order.order_final_price}</p>
                                </div>`
                            );
                        });
                        updateNotificationsUI();
                    }
                },
                error: function () {
                    console.error("Failed to load seller notifications");
                },
            });
        } else {
            $.ajax({
                url: "/api/userNotifications",
                method: "GET",
                success: function (response) {
                    if (response.success) {
                        response.history.forEach((notification) => {
                            notificationList.append(
                                `<div class='notification-item' id='${notification.history_id}'>
                                    <p>#${notification.history_id}</p>
                                    <p>${notification.history_product_name}</p>
                                    <p><strong>Process on:</strong> ${notification.history_order_date}</p>
                                </div>`
                            );
                        });
                        updateNotificationsUI();
                    }
                },
                error: function () {
                    console.error("Failed to load notifications");
                },
            });
        }
    }

    // Notification icon click: show/hide and load notifications
    $(".notification-icon").off("click").on("click", function () {
        toggleNotif = !toggleNotif;
        if (toggleNotif) {
            $("#notificationDetails").css("display", "flex");
            setTimeout(() => {
                $("#notificationDetails").css("opacity", "1");
            }, 0);
            loadNotifications();
        } else {
            $("#notificationDetails").css("opacity", "0");
            setTimeout(() => {
                $("#notificationDetails").css("display", "none");
            }, 300);
        }
    });

    const updateNotificationsUI = () => {
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
    };

    // Call updateNotificationsUI after dynamically loading notifications
    $(document).on("ajaxSuccess", function () {
        updateNotificationsUI();
    });
    updateNotificationsUI();

    const socket = io();

    socket.on("refreshNotifications", () => {
        if (!isSeller) {
            loadNotifications();
            updateNotificationsUI();
            console.log("Notifications refreshed");
        }
    });
    socket.on('orderUpdate', () => {
        if (isSeller) {
            loadNotifications();
        }
    })

    $.ajax({
        url: "/api/cart/count",
        method: "GET",
        success: function (response) {
            if (response.success) {
                $("#cartCount").text(response.count);
            }
        },
    });
});
