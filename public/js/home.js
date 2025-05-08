$(document).ready(function () {
    $(document).on("keydown", function (e) {
        if (e.ctrlKey && e.key === "k") {
            e.preventDefault();
            $("#searchBar").focus();
        }
    });

    $("#searchBar").on("keyup", function () {
        const query = $(this).val().trim().toLowerCase();

        $(".product").each(function () {
            const name = $(this).find(".product-name").text().toLowerCase();
            const desc = $(this)
                .find(".product-description")
                .text()
                .toLowerCase();

            if (name.includes(query) || desc.includes(query)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });

        if (!query) {
            $(".product").show(); // Show all if input is cleared
        }
    });

    // Add to Cart functionality
    $(".add-cart").on("click", function () {
        const product_id = $(this).closest(".product").attr("id");
        const quantity = 1; // Default quantity, can be adjusted

        $.ajax({
            url: "/cart/add",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ product_id, quantity }),
            success: function (response) {
                alert(response.message);
            },
            error: function (xhr) {
                alert(xhr.responseJSON?.message || "Failed to add product to cart.");
            },
        });
    });

    $(".cart-icon").on("click", function () {
        window.location.href = "/cart";
    });

    $(".brand").on("click", function () {
        window.location.heref = "/"
    });
});