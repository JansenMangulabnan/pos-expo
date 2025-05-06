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
        } else if ($(this).text().trim() === "Sales") {
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

    // POS
    $(".pos-add-to-order-btn").on("click", function () {
        const productItem = $(this).closest(".pos-product-item");
        const productId = productItem.data("id");
        const productName = productItem.find(".pos-product-name").text();
        const productPrice = parseFloat(productItem.data("price"));

        if (orders[productId]) {
            orders[productId].quantity += 1;
        } else {
            orders[productId] = {
                name: productName,
                price: productPrice,
                quantity: 1,
            };
        }

        updateOrders();
    });

    function updateOrders() {
        const $orderItems = $("#pos-order-items");
        $orderItems.empty();

        let total = 0;

        Object.keys(orders).forEach((productId) => {
            const item = orders[productId];
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            $orderItems.append(`
                <tr data-id="${productId}">
                    <td>${item.name}</td>
                    <td>
                        <button class="pos-decrease-qty">-</button>
                        <span class="pos-quantity">${item.quantity}</span>
                        <button class="pos-increase-qty">+</button>
                    </td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${itemTotal.toLocaleString()}</td>
                    <td><button class="pos-remove-item">Remove</button></td>
                </tr>
            `);
        });

        $("#pos-order-total").text(total.toLocaleString());
    }

    $(document).on("click", ".pos-increase-qty", function () {
        const productId = $(this).closest("tr").data("id");
        orders[productId].quantity += 1;
        updateOrders();
    });

    $(document).on("click", ".pos-decrease-qty", function () {
        const productId = $(this).closest("tr").data("id");
        if (orders[productId].quantity > 1) {
            orders[productId].quantity -= 1;
        } else {
            delete orders[productId];
        }
        updateOrders();
    });

    $(document).on("click", ".pos-remove-item", function () {
        const productId = $(this).closest("tr").data("id");
        delete orders[productId];
        updateOrders();
    });

    $("#pos-checkout-btn").on("click", function () {
        if (Object.keys(orders).length === 0) {
            alert("Orders are empty!");
            return;
        }

        $.ajax({
            url: "/sellerCheckout",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                orders: Object.entries(orders).map(([id, item]) => ({
                    id: parseInt(id),
                    ...item,
                })),
            }),
            success: function (response) {
                alert("Order placed successfully!");
                location.reload();
            },
            error: function (xhr) {
                alert("Error during checkout: " + xhr.responseText);
            },
        });
    });

    // orders
    $(document).on("click", ".order-card", function () {
        const $orderOptions = $(this).find(".order-options");

        if ($orderOptions.is(":visible")) {
            $orderOptions.hide();
        } else {
            $(".order-options").hide(); 
            $orderOptions.show();
        }
    });

    $(document).on("click", ".delete-order-btn", function (event) {
        event.stopPropagation(); 
        const orderId = $(this).data("order-id");
        if (confirm(`Are you sure you want to delete order ${orderId}?`)) {
            console.log(`Order ${orderId} deleted.`);
        }
    });

    $(document).on("click", ".confirm-order-btn", function (event) {
        event.stopPropagation();
        const orderId = $(this).data("order-id");
        if (confirm(`Are you sure you want to confirm order ${orderId}?`)) {
            console.log(`Order ${orderId} confirmed.`);
        }
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
