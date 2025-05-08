$(document).ready(function () {
    $(".brand").on("click", function () {
        window.location.href = "/";
    });

    const cartOrders = {};

    // Add product to cartOrders
    $(document).on("click", ".cart-product-card", function () {
        const $card = $(this);
        const productId = $card.data("id");
        const productName = $card.find(".cart-product-name").text();
        const productPrice = parseFloat($card.data("price"));

        if (!cartOrders[productId]) {
            cartOrders[productId] = {
                name: productName,
                price: productPrice,
                quantity: 1,
            };
        } else {
            cartOrders[productId].quantity++;
        }

        updateCartOrders();
    });

    // Update the cart orders table and summary
    function updateCartOrders() {
        const $cartItems = $("#cart-checkout-items");

        $cartItems.empty(); // Clear the table

        let total = 0;

        // Calculate the total price and render the cart items
        Object.keys(cartOrders).forEach((productId) => {
            const order = cartOrders[productId];
            const orderTotal = order.price * order.quantity;
            total += orderTotal;

            const $row = $(`
                <tr data-id="${productId}">
                    <td>${order.name}</td>
                    <td>
                        <div class="cart-quantity-container">
                            <button class="cart-decrease-qty">-</button>
                            <div class="cart-quantity" contenteditable="true">${order.quantity}</div>
                            <button class="cart-increase-qty">+</button>
                        </div>
                    </td>
                    <td>₱${order.price.toFixed(2)}</td>
                    <td>₱${orderTotal.toFixed(2)}</td>
                    <td><button class="cart-remove-item">Remove</button></td>
                </tr>
            `);

            $cartItems.append($row);
        });

        // Update the total price
        $("#cart-checkout-total").text(total.toFixed(2));
    }

    // Handle quantity changes in the editable div
    $(document).on("input", ".cart-quantity", function () {
        const $quantityDiv = $(this);
        const productId = $quantityDiv.closest("tr").data("id");

        // Get the current value and validate it
        let quantity = parseInt($quantityDiv.text(), 10);

        if (isNaN(quantity) || quantity <= 0) {
            quantity = 1; // Default to 1 if invalid
        }

        // Update the quantity in the cartOrders object
        if (cartOrders[productId]) {
            cartOrders[productId].quantity = quantity;
            updateCartOrders(); // Recalculate totals and update the UI
        }

        // Set the validated quantity back to the div
        $quantityDiv.text(quantity);
    });

    // Prevent non-numeric input
    $(document).on("keypress", ".cart-quantity", function (e) {
        const charCode = e.which ? e.which : e.keyCode;
        if (charCode < 48 || charCode > 57) {
            e.preventDefault(); // Allow only numeric input
        }
    });

    // Increase quantity
    $(document).on("click", ".cart-increase-qty", function () {
        const $row = $(this).closest("tr");
        const productId = $row.data("id");

        if (cartOrders[productId]) {
            cartOrders[productId].quantity++;
            updateCartOrders();
        }
    });

    // Decrease quantity
    $(document).on("click", ".cart-decrease-qty", function () {
        const $row = $(this).closest("tr");
        const productId = $row.data("id");

        if (cartOrders[productId] && cartOrders[productId].quantity > 1) {
            cartOrders[productId].quantity--;
        } else {
            delete cartOrders[productId];
        }

        updateCartOrders();
    });

    // Remove item from cartOrders
    $(document).on("click", ".cart-remove-item", function () {
        const $row = $(this).closest("tr");
        const productId = $row.data("id");

        if (cartOrders[productId]) {
            delete cartOrders[productId];
            updateCartOrders();
        }
    });

    // Checkout button
    $("#cart-checkout-btn").on("click", function () {
        if (!Object.keys(cartOrders).length) {
            alert("No items in the cart.");
            return;
        }

        // Prepare the cart orders array
        const cartOrdersArray = Object.keys(cartOrders).map((productId) => {
            const order = cartOrders[productId];
            return {
                id: productId,
                name: order.name,
                price: order.price.toFixed(2),
                quantity: order.quantity,
            };
        });

        // Log the cart orders array for debugging
        console.log("Checkout cart orders:", cartOrdersArray);

        // Send the cart orders to the server
        $.ajax({
            url: "/cart/checkout", // Endpoint to handle saving the cart order
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ orders: cartOrdersArray }),
            success: function (response) {
                alert(response.message);

                // Clear the cartOrders object
                for (let key in cartOrders) {
                    if (cartOrders.hasOwnProperty(key)) delete cartOrders[key];
                }

                // Update the UI
                updateCartOrders();
            },
            error: function (xhr) {
                alert("Error processing checkout: " + xhr.responseText);
            },
        });
    });
});