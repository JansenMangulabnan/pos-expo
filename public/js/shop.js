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
                showAlert({
                    message: "Error adding product: " + xhr.responseText
                });
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

        // Save the currently focused element and caret position
        const $focusedElement = $(document.activeElement);
        const isContentEditable = $focusedElement.is(".pos-quantity");
        let caretPosition = 0;

        if (isContentEditable) {
            const range = window.getSelection().getRangeAt(0);
            caretPosition = range.startOffset;
        }

        $orderItems.empty(); // Clear the table

        let total = 0;

        // Calculate the total price and render the order items
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
                            <div class="pos-quantity" contenteditable="true">${
                                order.quantity
                            }</div>
                            <button class="pos-increase-qty">+</button>
                        </div>
                    </td>
                    <td>₱${order.price.toFixed(2)}</td>
                    <td>₱${orderTotal.toFixed(2)}</td>
                    <td><button class="pos-remove-item">Remove</button></td>
                </tr>
            `);

            $orderItems.append($row);
        });

        // Update the total price
        $("#pos-order-total").text(total.toFixed(2));

        // If a discount is applied, recalculate the final price
        if (discountApplied) {
            const discount = total * 0.2; // 20% discount
            const final = total - discount;

            $("#pos-discount-amount").text(discount.toFixed(2));
            $("#pos-final-total-amount").text(final.toFixed(2));
            $("#pos-discount-indicator, #pos-final-total").show();
        } else {
            // Hide the discount indicator if no discount is applied
            $("#pos-discount-indicator, #pos-final-total").hide();
            $("#pos-final-total-amount").text(total.toFixed(2));
        }

        // Restore focus and caret position
        if (isContentEditable) {
            const $newFocusedElement = $orderItems.find(
                `[data-id="${$focusedElement
                    .closest("tr")
                    .data("id")}"] .pos-quantity`
            );
            $newFocusedElement.focus();

            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart($newFocusedElement[0].childNodes[0], caretPosition);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    // Handle quantity changes in the editable div
    $(document).on("input", ".pos-quantity", function () {
        const $quantityDiv = $(this);
        const productId = $quantityDiv.closest("tr").data("id");

        // Get the current value and validate it
        let quantity = parseInt($quantityDiv.text(), 10);

        if (isNaN(quantity) || quantity <= 0) {
            quantity = 1; // Default to 1 if invalid
        }

        // Update the quantity in the orders object
        if (orders[productId]) {
            orders[productId].quantity = quantity;
            updateOrders(); // Recalculate totals and update the UI
        }

        // Set the validated quantity back to the div
        $quantityDiv.text(quantity);
    });

    // Prevent non-numeric input
    $(document).on("keypress", ".pos-quantity", function (e) {
        const charCode = e.which ? e.which : e.keyCode;
        if (charCode < 48 || charCode > 57) {
            e.preventDefault(); // Allow only numeric input
        }
    });

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
            showAlert({
                message: "No items in the order."
            });
            return;
        }

        // Get the total and final total
        const total = parseFloat($("#pos-order-total").text());
        const finalTotal = parseFloat($("#pos-final-total-amount").text());
        const isDiscountApplied = discountApplied; // Check if the discount is applied

        // Prepare the orders array with product_id included
        const ordersArray = Object.keys(orders).map((productId) => {
            const order = orders[productId];
            const orderTotal = order.price * order.quantity;

            // Adjust price proportionally if a discount is applied
            const adjustedPrice = isDiscountApplied
                ? (finalTotal / total) * order.price
                : order.price;

            return {
                id: productId, // Include product_id
                name: order.name,
                price: adjustedPrice.toFixed(2), // Pass the adjusted price
                quantity: order.quantity,
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
                showAlert({
                    message: response.message
                });

                // Clear the orders object
                for (let key in orders) {
                    if (orders.hasOwnProperty(key)) delete orders[key];
                }

                // Update the UI
                updateOrders();
            },
            error: function (xhr) {
                showAlert({
                    message: "Error processing checkout: " + xhr.responseText
                });
            },
        });
        window.location.href = "/shop";
    });

    let discountApplied = false;

    $("#apply-discount-btn").on("click", function () {
        const total = parseFloat($("#pos-order-total").text());
        if (isNaN(total) || total <= 0)
            return showAlert({
                message: "No items in the order to apply a discount."
            });

        discountApplied = !discountApplied;

        if (discountApplied) {
            const discount = total * 0.2;
            const final = total - discount;

            $("#pos-discount-amount").text(discount.toFixed(2));
            $("#pos-final-total-amount").text(final.toFixed(2));

            $("#pos-discount-indicator, #pos-final-total").show();
            $(this).text("Remove Senior/PWD Discount");
        } else {
            $("#pos-discount-indicator, #pos-final-total").hide();
            $(this).text("Apply Senior/PWD Discount");
        }
    });

    // orders
    let currentlyLockedOrderId = null;

    $(document).on("click", ".order-card", function () {
        const $orderCard = $(this);
        const orderId = $orderCard.data("order-id");

        const $orderOptions = $orderCard.find(".order-options");
        const $orderDescription = $orderCard.find(".right-content p"); // Select the <p> element inside the card

        if ($orderOptions.is(":visible")) {
            $orderOptions.hide();
            $orderDescription.show(); // Show the <p> when options are hidden

            socket.emit("unlockOrder", orderId);
            currentlyLockedOrderId = null;
        } else {
            $(".order-options").hide();
            $(".right-content p").show(); // Show <p> for all cards

            if (currentlyLockedOrderId && currentlyLockedOrderId !== orderId) {
                socket.emit("unlockOrder", currentlyLockedOrderId);
            }

            $orderOptions.show();
            $orderDescription.hide(); // Hide the <p> when options are shown

            socket.emit("lockOrder", orderId);
            currentlyLockedOrderId = orderId;
        }
    });

    $(document).on("click", ".delete-order-btn", function (event) {
        event.stopPropagation();
        const orderId = $(this).data("order-id");

        if (confirm(`Are you sure you want to delete order ${orderId}?`)) {
            $.ajax({
                url: "/archiveOrder",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ order_id: orderId }),
                success: function (response) {
                    showAlert({
                        message: response.message
                    });
                    $(`.order-card[data-order-id="${orderId}"]`).remove();
                    socket.emit("orderRemove", orderId);
                },
                error: function (xhr) {
                    showAlert({
                        message: "Error archiving order: " + xhr.responseText
                    });
                },
            });
        }
        location.reload();
    });

    $(document).on("click", ".confirm-order-btn", function (event) {
        event.stopPropagation();
        const orderId = $(this).data("order-id");

        showAlert({
            message: `Are you sure you want to confirm order ${orderId}?`,
            secondaryButton: {
                text: "Cancel"
            },
            onOk: function () {
                $.ajax({
                    url: "/confirmOrder",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({ order_id: orderId }),
                    success: function (response) {
                        showAlert({
                            message: response.message
                        });
                        $(`.order-card[data-order-id="${orderId}"]`).remove();
                        socket.emit("orderRemove", orderId);
                        socket.emit("notificationUpdate");
                    },
                    error: function (xhr) {
                        showAlert({
                            message: "Error confirming order: " + xhr.responseText
                        });
                    },
                });
                window.location.href = "/shop";
            }
        });
    });

    const socket = io();

    socket.on("orderUpdate", function () {
        console.log("Order updated");
        $.ajax({
            url: "/api/shopOrders",
            method: "GET",
            success: function (response) {
                if (response.success && Array.isArray(response.orders)) {
                    const $ordersContainer = $(".orders-container");
                    $ordersContainer.empty();
                    response.orders.forEach((order) => {
                        $ordersContainer.append(`
                            <div class="order-card" data-order-id="${order.order_id}">
                                <div class="left-content">
                                    <h2>Order ID: ${order.order_id}</h2>
                                    <p><strong>Product:</strong> ${order.product_name}</p>
                                    <p><strong>Seller:</strong> ${order.seller_name}</p>
                                    <p><strong>Customer:</strong> ${order.user_name}</p>
                                    <p><strong>Date:</strong> ${order.order_date}</p>
                                    <p><strong>Quantity:</strong> ${order.order_quantity}</p>
                                    <p><strong>Total Price:</strong> ₱${order.order_final_price}</p>
                                </div>
                                <div class="right-content">
                                    <p><strong>Status:</strong>Pending</p>
                                    <div class="order-options" style="display: none;">
                                        <button class="delete-order-btn" data-order-id="${order.order_id}">Delete Order</button>
                                        <button class="confirm-order-btn" data-order-id="${order.order_id}">Confirm</button>
                                    </div>
                                </div>
                            </div>
                        `);
                    });
                }
            },
            error: function () {
                console.error("Failed to fetch updated orders.");
            },
        });
    });
    
    socket.on("lockedOrders", (lockedOrders) => {
        lockedOrders.forEach(([orderId, lockerId]) => {
            if (socket.id !== lockerId) {
                const $orderCard = $(`.order-card[data-order-id="${orderId}"]`);
                $orderCard.addClass("locked");
                $orderCard
                    .find(".confirm-order-btn, .delete-order-btn")
                    .prop("disabled", true);
                $orderCard.append(
                    `<div class="lock-overlay">Processing <i class='bx bx-loader-circle bx-spin'></i></div>`
                );
            }
        });
    });

    socket.on("orderLocked", ({ orderId, lockerId }) => {
        if (socket.id !== lockerId) {
            const $orderCard = $(`.order-card[data-order-id="${orderId}"]`);
            $orderCard.addClass("locked");
            $orderCard
                .find(".confirm-order-btn, .delete-order-btn")
                .prop("disabled", true);
            $orderCard.append(
                `<div class="lock-overlay">Processing <i class='bx bx-loader-circle bx-spin'></i></div>`
            );
        }
    });

    socket.on("orderUnlocked", (orderId) => {
        const $orderCard = $(`.order-card[data-order-id="${orderId}"]`);
        $orderCard.removeClass("locked");
        $orderCard
            .find(".confirm-order-btn, .delete-order-btn")
            .prop("disabled", false);
        $orderCard.find(".lock-overlay").remove();
    });

    socket.on("orderRemoved", (orderId) => {
        const $orderCard = $(`.order-card[data-order-id="${orderId}"]`);
        $orderCard.removeClass("locked");
        $orderCard
            .find(".confirm-order-btn, .delete-order-btn")
            .prop("disabled", false);
        $orderCard.remove();
    });

    socket.on("orderAlreadyLocked", (orderId) => {
        showAlert({
            message: `Order ${orderId} is already locked by another seller.`
        });
    });

    $.ajax({
        url: "/api/orderHistory",
        method: "GET",
        success: function (response) {
            if (response.success) {
                const orderHistory = response.orderHistory;

                // Get current month and year
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                // Filter for current month
                const currentMonthOrders = orderHistory.filter((order) => {
                    const date = new Date(order.history_order_date);
                    return (
                        date.getMonth() === currentMonth &&
                        date.getFullYear() === currentYear
                    );
                });

                // Get the current week number
                function getCurrentWeekNumber(date) {
                    const firstDayOfMonth = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        1
                    );
                    const dayOfMonth = date.getDate();
                    const adjustedDate = dayOfMonth + firstDayOfMonth.getDay(); // Adjust for the first day of the week
                    return Math.ceil(adjustedDate / 7); // Divide by 7 to get the week number
                }

                // Get the current week number
                const currentWeekNumber = getCurrentWeekNumber(now);

                // Filter for current week orders
                const currentWeekOrders = currentMonthOrders.filter((order) => {
                    const date = new Date(order.history_order_date);
                    return getCurrentWeekNumber(date) === currentWeekNumber;
                });

                // Prepare data for the daily income chart (current week only)
                const dailyLabels = [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                ];
                const dailyData = new Array(7).fill(0);

                // Only use current week orders for the daily chart
                currentWeekOrders.forEach((order) => {
                    const date = new Date(order.history_order_date);
                    const revenue =
                        order.history_product_price *
                        order.history_order_quantity;

                    // Group by day of the week
                    const dayIndex = date.getDay();
                    dailyData[dayIndex] += revenue;
                });

                // Render the daily income chart (current week)
                const dailyCtx = document
                    .getElementById("dailyIncomeChart")
                    .getContext("2d");
                new Chart(dailyCtx, {
                    type: "line",
                    data: {
                        labels: dailyLabels,
                        datasets: [
                            {
                                label: "Daily Income (Current Week)",
                                data: dailyData,
                                backgroundColor: "rgba(75, 192, 192, 0.2)",
                                borderColor: "rgba(75, 192, 192, 1)",
                                borderWidth: 2,
                                tension: 0.2,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: "Revenue (₱)",
                                },
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: "Day of the Week",
                                },
                            },
                        },
                    },
                });

                // Prepare data for the weekly income chart (current month only)
                const weeklyLabels = [
                    "Week 1",
                    "Week 2",
                    "Week 3",
                    "Week 4",
                    "Week 5",
                ];
                const weeklyData = new Array(5).fill(0);

                // Only use current month orders for the weekly chart
                currentMonthOrders.forEach((order) => {
                    const date = new Date(order.history_order_date);
                    const revenue =
                        order.history_product_price *
                        order.history_order_quantity;

                    // Group by week of the month
                    const weekIndex = getWeekOfMonth(date) - 1; // Subtract 1 to make it zero-based
                    if (weekIndex >= 0 && weekIndex < 5) {
                        weeklyData[weekIndex] += revenue;
                    }
                });

                // Render the weekly income chart (current month)
                const weeklyCtx = document
                    .getElementById("weeklyIncomeChart")
                    .getContext("2d");
                new Chart(weeklyCtx, {
                    type: "line",
                    data: {
                        labels: weeklyLabels,
                        datasets: [
                            {
                                label: "Weekly Income (Current Month)",
                                data: weeklyData,
                                backgroundColor: "rgba(255, 159, 64, 0.2)",
                                borderColor: "rgba(255, 159, 64, 1)",
                                borderWidth: 2,
                                tension: 0.3,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: "Revenue (₱)",
                                },
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: "Week of the Month",
                                },
                            },
                        },
                    },
                });

                // Prepare data for the monthly chart (current year only)
                const monthlyLabels = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                ];
                const monthlyData = new Array(12).fill(0);

                // Only use current year orders for the monthly chart
                orderHistory.forEach((order) => {
                    const date = new Date(order.history_order_date);
                    if (date.getFullYear() === currentYear) {
                        const monthIndex = date.getMonth();
                        const revenue =
                            order.history_product_price *
                            order.history_order_quantity;
                        monthlyData[monthIndex] += revenue;
                    }
                });

                // Render the monthly income chart (current year)
                const monthlyCtx = document
                    .getElementById("monthlyIncomeChart")
                    .getContext("2d");
                new Chart(monthlyCtx, {
                    type: "line",
                    data: {
                        labels: monthlyLabels,
                        datasets: [
                            {
                                label: "Monthly Income (Current Year)",
                                data: monthlyData,
                                backgroundColor: "rgba(54, 162, 235, 0.2)",
                                borderColor: "rgba(54, 162, 235, 1)",
                                borderWidth: 2,
                                tension: 0.3,
                                fill: true,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: "Revenue (₱)",
                                },
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: "Month",
                                },
                            },
                        },
                    },
                });

                // Prepare data for annual chart (all years in data)
                const years = [
                    ...new Set(
                        orderHistory.map((order) =>
                            new Date(order.history_order_date).getFullYear()
                        )
                    ),
                ].sort();
                const annualData = years.map((year) => {
                    return orderHistory
                        .filter(
                            (order) =>
                                new Date(
                                    order.history_order_date
                                ).getFullYear() === year
                        )
                        .reduce(
                            (sum, order) =>
                                sum +
                                order.history_product_price *
                                    order.history_order_quantity,
                            0
                        );
                });

                // Render the annual income chart as a line chart
                const annualCtx = document
                    .getElementById("annualIncomeChart")
                    .getContext("2d");
                new Chart(annualCtx, {
                    type: "line", // Ensure the chart type is "line"
                    data: {
                        labels: years,
                        datasets: [
                            {
                                label: "Annual Income",
                                data: annualData,
                                backgroundColor: "rgba(153, 102, 255, 0.2)",
                                borderColor: "rgba(153, 102, 255, 1)",
                                borderWidth: 2,
                                tension: 0.3,
                                fill: true,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: "Revenue (₱)",
                                },
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: "Year",
                                },
                            },
                        },
                    },
                });

                // Optionally, update total revenue for current month
                const totalRevenue = currentMonthOrders.reduce(
                    (sum, order) =>
                        sum +
                        order.history_product_price *
                            order.history_order_quantity,
                    0
                );
                $("#total-revenue").text(`₱${totalRevenue.toFixed(2)}`);
            } else {
                console.error(
                    "Failed to fetch order history:",
                    response.message
                );
            }
        },
        error: function (xhr) {
            console.error("Error fetching order history:", xhr.responseText);
        },
    });

    $.ajax({
        url: "/api/orderHistory",
        method: "GET",
        success: function (response) {
            if (response.success) {
                const orderHistory = response.orderHistory;
                const totalRevenue = response.totalRevenue;

                // Update total revenue in the UI
                $("#total-revenue").text(`₱${totalRevenue.toFixed(2)}`);

                // Clear the container before appending new data
                const $orderHistoryContainer = $("#order-history-container");
                $orderHistoryContainer.empty();

                // Loop through the order history and display it
                orderHistory.forEach((order) => {
                    const {
                        history_id,
                        history_product_name,
                        history_product_price,
                        history_order_quantity,
                        history_order_date,
                        user_name,
                        seller_name,
                        actual_price,
                    } = order;

                    // Format the date
                    const formattedDate = new Date(
                        history_order_date
                    ).toLocaleDateString();

                    // Append the order details to the container
                    $orderHistoryContainer.append(`
                        <div class="order-history-item">
                            <div><strong>Order ID:</strong> ${history_id}</div>
                            <div><strong>Product Name:</strong> ${history_product_name}</div>
                            <div><strong>Price:</strong> ₱${history_product_price.toFixed(
                                2
                            )}</div>
                            <div><strong>Quantity:</strong> ${history_order_quantity}</div>
                            <div><strong>Total:</strong> ₱${actual_price.toFixed(
                                2
                            )}</div>
                            <div><strong>Date:</strong> ${formattedDate}</div>
                            <div><strong>User:</strong> ${
                                user_name || "N/A"
                            }</div>
                            <div><strong>Seller:</strong> ${
                                seller_name || "N/A"
                            }</div>
                        </div>
                    `);
                });
            } else {
                console.error(
                    "Failed to fetch order history:",
                    response.message
                );
            }
        },
        error: function (xhr) {
            console.error("Error fetching order history:", xhr.responseText);
        },
    });

    // Handle stock updates
    $(document).on("click", ".update-stock-btn", function () {
        const $row = $(this).closest("tr");
        const productId = $row.data("id");
        const newStock = parseInt($row.find(".product-stock").val(), 10);

        if (isNaN(newStock) || newStock < 0) {
            showAlert({
                message: "Invalid stock value."
            });
            return;
        }

        $.ajax({
            url: "/api/updateStock", // Backend endpoint to update stock
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                product_id: productId,
                product_stock: newStock,
            }),
            success: function (response) {
                showAlert({
                    message: response.message
                });
            },
            error: function (xhr) {
                showAlert({
                    message: "Error updating stock: " + xhr.responseText
                });
            },
        });
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

// Helper function to calculate the week of the month
function getWeekOfMonth(date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const adjustedDate = dayOfMonth + firstDayOfMonth.getDay(); // Adjust for the first day of the week
    return Math.ceil(adjustedDate / 7); // Divide by 7 to get the week number
}
