$(document).ready(function () {
    $(".brand").on("click", function () {
        window.location.href = "/";
    });

    // Handle click on cart-product-card
    $(".cart-product-card").on("click", function () {
        const productId = $(this).data("id");
        const productName = $(this).find(".cart-product-name").text();
        const productPrice = parseFloat($(this).find(".cart-product-price").text().replace("₱", ""));
        const existingRow = $(`#cart-checkout-items tr[data-id="${productId}"]`);

        if (existingRow.length > 0) {
            // If the product is already in the checkout list, remove it
            existingRow.remove();
            $(this).removeClass("in-checkout");
            updateTotal();
        } else {
            // If the product is not in the checkout list, add it
            $(this).addClass("in-checkout");

            $("#cart-checkout-items").append(`
                <tr data-id="${productId}">
                    <td>${productName}</td>
                    <td>
                        <button class="decrease-qty">-</button>
                        <span class="quantity">1</span>
                        <button class="increase-qty">+</button>
                    </td>
                    <td>₱${productPrice.toFixed(2)}</td>
                    <td class="total-price">₱${productPrice.toFixed(2)}</td>
                    <td><button class="remove-item">Remove</button></td>
                </tr>
            `);

            updateTotal();
        }
    });

    // Handle quantity increase
    $(document).on("click", ".increase-qty", function () {
        const row = $(this).closest("tr");
        const quantityElem = row.find(".quantity");
        const quantity = parseInt(quantityElem.text()) + 1;
        const price = parseFloat(row.find("td:nth-child(3)").text().replace("₱", ""));
        quantityElem.text(quantity);
        row.find(".total-price").text(`₱${(quantity * price).toFixed(2)}`);
        updateTotal();
    });

    // Handle quantity decrease
    $(document).on("click", ".decrease-qty", function () {
        const row = $(this).closest("tr");
        const quantityElem = row.find(".quantity");
        let quantity = parseInt(quantityElem.text());
        if (quantity > 1) {
            quantity -= 1;
            const price = parseFloat(row.find("td:nth-child(3)").text().replace("₱", ""));
            quantityElem.text(quantity);
            row.find(".total-price").text(`₱${(quantity * price).toFixed(2)}`);
            updateTotal();
        }
    });

    // Handle item removal from checkout and cart
    $(document).on("click", ".remove-item", function () {
        const row = $(this).closest("tr");
        const productId = row.data("id");
        row.remove();

        // Remove the highlight from the card
        $(`.cart-product-card[data-id="${productId}"]`).removeClass("in-checkout");

        // Remove the item from the cart in the backend
        $.ajax({
            url: "/cart/remove",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ product_id: productId }),
            success: function (response) {
                // Optionally, remove the product card from the cart UI
                $(`.cart-product-card[data-id="${productId}"]`).remove();
                updateTotal();
                // Optionally update cart badge
                if (window.updateCartBadge) updateCartBadge();
            },
            error: function (xhr) {
                alert(xhr.responseJSON?.message || "Failed to remove item from cart.");
            }
        });

        updateTotal();
    });

    // Handle checkout button click
    $("#order-checkout-btn").on("click", function () {
        const orders = [];
        $("#cart-checkout-items tr").each(function () {
            const productId = $(this).data("id");
            const quantity = parseInt($(this).find(".quantity").text());
            const price = parseFloat($(this).find("td:nth-child(3)").text().replace("₱", ""));
            const totalPrice = parseFloat($(this).find(".total-price").text().replace("₱", ""));

            orders.push({
                product_id: productId,
                quantity: quantity,
                price: price,
                total_price: totalPrice,
            });
        });

        if (orders.length === 0) {
            alert("Your checkout list is empty.");
            return;
        }

        // Send the orders to the server
        $.ajax({
            url: "/cart/checkout",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ orders }),
            success: function (response) {
                alert(response.message);
                // Clear the checkout list and remove highlights
                $("#cart-checkout-items").empty();
                $(".cart-product-card").removeClass("in-checkout");
                updateTotal();
            },
            error: function (xhr) {
                alert(xhr.responseJSON?.message || "An error occurred during checkout.");
            },
        });
        location.reload();
    });

    // Update total price
    function updateTotal() {
        let total = 0;
        $("#cart-checkout-items .total-price").each(function () {
            total += parseFloat($(this).text().replace("₱", ""));
        });
        $("#cart-checkout-total").text(total.toFixed(2));
    }
});