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
                            <div class="pos-quantity" contenteditable="true">${order.quantity}</div>
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
            const $newFocusedElement = $orderItems.find(`[data-id="${$focusedElement.closest("tr").data("id")}"] .pos-quantity`);
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
            alert("No items in the order.");
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

    let discountApplied = false;

    $("#apply-discount-btn").on("click", function () {
        const total = parseFloat($("#pos-order-total").text());
        if (isNaN(total) || total <= 0) return alert("No items in the order to apply a discount.");
    
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
                    alert(response.message);
                    $(`.order-card[data-order-id="${orderId}"]`).remove();
                },
                error: function (xhr) {
                    alert("Error archiving order: " + xhr.responseText);
                },
            });
        }
    });

    $(document).on("click", ".confirm-order-btn", function (event) {
        event.stopPropagation();
        const orderId = $(this).data("order-id");

        if (confirm(`Are you sure you want to confirm order ${orderId}?`)) {
            $.ajax({
                url: "/confirmOrder",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ order_id: orderId }),
                success: function (response) {
                    alert(response.message);
                    $(`.order-card[data-order-id="${orderId}"]`).remove();
                },
                error: function (xhr) {
                    alert("Error confirming order: " + xhr.responseText);
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

    socket.on("orderAlreadyLocked", (orderId) => {
        alert(`Order ${orderId} is already locked by another seller.`);
    });

    socket.on("orderCompleted", (orderId) => {
        $(`.order-card[data-order-id="${orderId}"]`).remove();
        alert(`Order ${orderId} has been completed.`);
    });

    // Fetch order history data via AJAX
    $.ajax({
        url: '/api/orderHistory',
        method: 'GET',
        success: function (response) {
            if (response.success) {
                const orderHistory = response.orderHistory;

                // Prepare data for the chart
                const dailyLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const dailyData = new Array(7).fill(0); // Initialize data for 7 days
                const monthlyLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const monthlyData = new Array(12).fill(0); // Initialize data for 12 months
                const annualData = {};
                let totalRevenue = 0;

                orderHistory.forEach((order) => {
                    const date = new Date(order.order_date);
                    const revenue = order.order_final_price * order.order_quantity;

                    // Add to total revenue
                    totalRevenue += revenue;

                    // Group by day of the week
                    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                    dailyData[dayIndex] += revenue;

                    // Group by month
                    const monthIndex = date.getMonth(); // 0 = January, 1 = February, ..., 11 = December
                    monthlyData[monthIndex] += revenue;

                    // Group by year
                    const yearLabel = `${date.getFullYear()}`; // Format: YYYY
                    if (!annualData[yearLabel]) {
                        annualData[yearLabel] = 0;
                    }
                    annualData[yearLabel] += revenue;
                });

                // Update total revenue in the UI
                $("#total-revenue").text(totalRevenue.toFixed(2));

                // Calculate annual totals
                const annualLabels = Object.keys(annualData).sort();
                const annualValues = annualLabels.map((label) => annualData[label]);

                // Render the daily income chart as a line chart
                const dailyCtx = document.getElementById("dailyIncomeChart").getContext("2d");
                new Chart(dailyCtx, {
                    type: "line",
                    data: {
                        labels: dailyLabels, // Weekdays only
                        datasets: [
                            {
                                label: "Daily Income",
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

                // Render the monthly income chart as a line chart
                const monthlyCtx = document.getElementById("monthlyIncomeChart").getContext("2d");
                new Chart(monthlyCtx, {
                    type: "line",
                    data: {
                        labels: monthlyLabels, // 12 months only
                        datasets: [
                            {
                                label: "Monthly Income",
                                data: monthlyData,
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
                                    text: "Month",
                                },
                            },
                        },
                    },
                });

                // Render the annual income chart as a line chart
                const annualCtx = document.getElementById("annualIncomeChart").getContext("2d");
                new Chart(annualCtx, {
                    type: "line",
                    data: {
                        labels: annualLabels,
                        datasets: [
                            {
                                label: "Annual Income",
                                data: annualValues,
                                backgroundColor: "rgba(54, 162, 235, 0.2)",
                                borderColor: "rgba(54, 162, 235, 1)",
                                borderWidth: 2,
                                tension: 0.4,
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
            } else {
                console.error("Failed to fetch order history:", response.message);
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
            alert("Invalid stock value.");
            return;
        }

        $.ajax({
            url: '/api/updateStock', // Backend endpoint to update stock
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ product_id: productId, product_stock: newStock }),
            success: function (response) {
                alert(response.message);
            },
            error: function (xhr) {
                alert("Error updating stock: " + xhr.responseText);
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
