$(document).ready(function () {
    // Function to show the correct content based on the active nav item
    function showContent(section) {
        $(".shop-content > div").hide(); // Hide all sections
        $(`.shop-content .${section}`).show(); // Show the selected section
    }

    // Check localStorage for the last active section
    const savedSection =
        localStorage.getItem("activeSection") || "content-menu";
    showContent(savedSection);

    // Set the active class on the corresponding sidebar item
    $(".sidebar-item").removeClass("active");
    $(
        `.sidebar-item:contains(${
            savedSection.split("-")[1].charAt(0).toUpperCase() +
            savedSection.split("-")[1].slice(1)
        })`
    ).addClass("active");

    // Handle sidebar navigation clicks
    $(".sidebar-item").on("click", function () {
        // Remove 'active' class from all sidebar items
        $(".sidebar-item").removeClass("active");

        // Add 'active' class to the clicked item
        $(this).addClass("active");

        // Determine the section to show based on the clicked item's text
        let section = "content-menu"; // Default section
        if ($(this).text().trim() === "Menu") {
            section = "content-menu";
        } else if ($(this).text().trim() === "POS") {
            section = "content-sales";
        } else if ($(this).text().trim() === "Inventory") {
            section = "content-inventory";
        } else if ($(this).text().trim() === "Reports") {
            section = "content-reports";
        } else if ($(this).text().trim() === "Orders") {
            section = "content-order";
        }

        // Save the active section to localStorage
        localStorage.setItem("activeSection", section);

        // Show the corresponding content section
        showContent(section);
    });

    $(document).on("keydown", function (event) {
        if (event.key === "Escape") {
            $(".modal").css("display", "none");
        }
    });

    //show addProductModal
    $(".add-product-btn").on("click", function () {
        $("#addProductModal").css("display", "flex");
    });

    $("#addProductForm").on("submit", function (event) {
        event.preventDefault();

        const formData = new FormData(this);

        $.ajax({
            url: "sellerAdd",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                location.reload();
            },
            error: function (xhr) {
                alert("Error adding product: " + xhr.responseText);
            },
        });
    });

    let moved = false;

    $("#sidebarToggle").on("click", function () {
        $(".flex-container").css(
            "transform",
            moved ? "translateX(0)" : "translateX(-100px)"
        );

        $(".flex-container").css({
            width: moved ? "100%" : "calc(100% + 100px)",
            transition: "all 0.3s",
        });

        $(".toggle-icon").css({
            transform: moved ? "scaleX(1)" : "scaleX(-1)",
            transition: "all 0.3s",
        });
        moved = !moved;
    });

    const orders = {};

    // Add product to orders
    $(".pos-add-to-order-btn").on("click", function () {
        const $card = $(this).closest(".pos-product-card");
        const productId = $card.data("id");
        const productName = $card.find(".pos-product-name").text();
        const productPrice = parseFloat($card.data("price"));

        if (!orders[productId]) {
            orders[productId] = {
                name: productName,
                price: productPrice,
                quantity: 1,
            };
        } else {
            orders[productId].quantity++;
        }

        updateOrders();
    });

    // Add product to orders when clicking on the product card
    $(document).on("click", ".pos-product-card", function () {
        const $card = $(this);
        const productId = $card.data("id");
        const productName = $card.find(".pos-product-name").text();
        const productPrice = parseFloat($card.data("price"));

        if (!orders[productId]) {
            orders[productId] = {
                name: productName,
                price: productPrice,
                quantity: 1,
            };
        } else {
            orders[productId].quantity++;
        }

        updateOrders();
    });

    // Update the orders table and summary
    function updateOrders() {
        const $orderItems = $("#pos-order-items");
        $orderItems.empty(); // Clear the table

        let total = 0;

        Object.keys(orders).forEach((productId) => {
            const order = orders[productId];
            const orderTotal = order.price * order.quantity;
            total += orderTotal;

            const $row = $(`
                <tr data-id="${productId}">
                    <td>${order.name}</td>
                    <td>
                        <div class="pos-quantity-container">
                            <button class="pos-decrease-qty">-</button>
                            <div class="pos-quantity">${order.quantity}</div>
                            <button class="pos-increase-qty">+</button>
                        </div>
                    </td>
                    <td>$${order.price.toFixed(2)}</td>
                    <td>$${orderTotal.toFixed(2)}</td>
                    <td><button class="pos-remove-item">Remove</button></td>
                </tr>
            `);

            $orderItems.append($row);
        });

        // Update the total
        $("#pos-order-total").text(total.toFixed(2));
    }

    // Increase quantity
    $(document).on("click", ".pos-increase-qty", function () {
        const $row = $(this).closest("tr");
        const productId = $row.data("id");

        if (orders[productId]) {
            orders[productId].quantity++;
            updateOrders();
        }
    });

    // Decrease quantity
    $(document).on("click", ".pos-decrease-qty", function () {
        const $row = $(this).closest("tr");
        const productId = $row.data("id");

        if (orders[productId] && orders[productId].quantity > 1) {
            orders[productId].quantity--;
        } else {
            delete orders[productId];
        }

        updateOrders();
    });

    // Remove item from orders
    $(document).on("click", ".pos-remove-item", function () {
        const $row = $(this).closest("tr");
        const productId = $row.data("id");

        if (orders[productId]) {
            delete orders[productId];
            updateOrders();
        }
    });

    // Checkout button
    $("#pos-checkout-btn").on("click", function () {
        if (!Object.keys(orders).length) {
            alert("No items in the order.");
            return;
        }

        // Prepare the orders array with product_id included
        const ordersArray = Object.keys(orders).map((productId) => {
            return {
                id: productId, // Include product_id
                name: orders[productId].name,
                price: orders[productId].price,
                quantity: orders[productId].quantity,
            };
        });

        // Log the orders array for debugging
        console.log("Checkout orders:", ordersArray);

        // Send the orders to the server
        $.ajax({
            url: "/sellerCheckout", // Endpoint to handle saving the order
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ orders: ordersArray }), // Send the orders array
            success: function (response) {
                alert(response.message);

                // Clear the orders object
                for (let key in orders) {
                    if (orders.hasOwnProperty(key)) delete orders[key];
                }

                // Update the UI
                updateOrders();
            },
            error: function (xhr) {
                alert("Error processing checkout: " + xhr.responseText);
            },
        });
    });

    // orders
    let currentlyLockedOrderId = null; 

    $(document).on("click", ".order-card", function () {
        const $orderCard = $(this);
        const orderId = $orderCard.data("order-id");

        const $orderOptions = $orderCard.find(".order-options");
        if ($orderOptions.is(":visible")) {
            $orderOptions.hide();

            socket.emit("unlockOrder", orderId);
            currentlyLockedOrderId = null; 
        } else {
            $(".order-options").hide();

            if (currentlyLockedOrderId && currentlyLockedOrderId !== orderId) {
                socket.emit("unlockOrder", currentlyLockedOrderId);
            }

            $orderOptions.show();

            socket.emit("lockOrder", orderId);
            currentlyLockedOrderId = orderId; 
        }
    });

    $(document).on("click", ".delete-order-btn", function (event) {
        event.stopPropagation();
        const orderId = $(this).data("order-id");

        if (confirm(`Are you sure you want to delete order ${orderId}?`)) {
            $.ajax({
                url: '/archiveOrder',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ order_id: orderId }),
                success: function (response) {
                    alert(response.message);
                    $(`.order-card[data-order-id="${orderId}"]`).remove();
                },
                error: function (xhr) {
                    alert('Error archiving order: ' + xhr.responseText);
                },
            });
        }
    });

    $(document).on('click', '.confirm-order-btn', function (event) {
        event.stopPropagation();
        const orderId = $(this).data('order-id');

        if (confirm(`Are you sure you want to confirm order ${orderId}?`)) {
            $.ajax({
                url: '/confirmOrder',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ order_id: orderId }),
                success: function (response) {
                    alert(response.message);
                    $(`.order-card[data-order-id="${orderId}"]`).remove();
                },
                error: function (xhr) {
                    alert('Error confirming order: ' + xhr.responseText);
                },
            });
        }
    });

    const socket = io();

    socket.on("lockedOrders", (lockedOrders) => {
        lockedOrders.forEach(([orderId, lockerId]) => {
            if (socket.id !== lockerId) {
                const $orderCard = $(`.order-card[data-order-id="${orderId}"]`);
                $orderCard.addClass("locked");
                $orderCard.find(".confirm-order-btn, .delete-order-btn").prop(
                    "disabled",
                    true
                );
                $orderCard.append(`<div class="lock-overlay">Processing <i class='bx bx-loader-circle bx-spin'></i></div>`);
            }
        });
    });

    socket.on("orderLocked", ({ orderId, lockerId }) => {
        if (socket.id !== lockerId) {
            const $orderCard = $(`.order-card[data-order-id="${orderId}"]`);
            $orderCard.addClass("locked");
            $orderCard.find(".confirm-order-btn, .delete-order-btn").prop(
                "disabled",
                true
            );
            $orderCard.append(`<div class="lock-overlay">Processing <i class='bx bx-loader-circle bx-spin'></i></div>`);
        }
    });

    socket.on("orderUnlocked", (orderId) => {
        const $orderCard = $(`.order-card[data-order-id="${orderId}"]`);
        $orderCard.removeClass("locked");
        $orderCard.find(".confirm-order-btn, .delete-order-btn").prop(
            "disabled",
            false
        );
        $orderCard.find(".lock-overlay").remove();
    });

    socket.on("orderAlreadyLocked", (orderId) => {
        alert(`Order ${orderId} is already locked by another seller.`);
    });

    socket.on("orderCompleted", (orderId) => {
        $(`.order-card[data-order-id="${orderId}"]`).remove(); 
        alert(`Order ${orderId} has been completed.`);
    });
});

function showPopup(message) {
    const $popup = $("#popup");
    $popup.text(message).css({
        display: "block",
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#f44336",
        color: "#fff",
        padding: "10px 20px",
        borderRadius: "5px",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
        zIndex: 2,
    });

    setTimeout(() => {
        $popup.fadeOut();
    }, 3000);
}
