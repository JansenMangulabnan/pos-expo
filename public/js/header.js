$(document).ready(function () {
    $.ajax({
        url: "/api/notifications/count", // Replace with your API endpoint
        method: "GET",
        success: function (response) {
            const notificationCount = response.count || 0; // Default to 0 if no count is returned
            $("#notificationCount").text(notificationCount);

            // Hide the badge if there are no notifications
            if (notificationCount === 0) {
                $("#notificationCount").hide();
            } else {
                $("#notificationCount").show();
                if (notificationCount > 99) {
                    $("#notificationCount").text("99+"); // Cap at 99+
                }
            }
        },
        error: function () {
            console.error("Failed to fetch notification count.");
        },
    });

    // Fetch cart item count from the server
    $.ajax({
        url: "/api/cart/count", // Replace with your API endpoint
        method: "GET",
        success: function (response) {
            const cartCount = response.count || 0; // Default to 0 if no count is returned
            $("#cartCount").text(cartCount);

            // Hide the badge if there are no items in the cart
            if (cartCount === 0) {
                $("#cartCount").hide();
            } else {
                $("#cartCount").show();
                if (cartCount > 99) {
                    $("#cartCount").text("99+"); // Cap at 99+
                }
            }
        },
        error: function () {
            console.error("Failed to fetch cart item count.");
        },
    });

    // Handle click on the cart icon
    $(".cart-icon").on("click", function () {
        window.location.href = "/cart"; // Redirect to the cart page
    });
});
