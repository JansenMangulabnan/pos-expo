$(document).ready(function () {
    let searchTimeout;

    $(document).on("keydown", function (e) {
        if (e.ctrlKey && e.key === "k") {
            e.preventDefault();
            $("#searchBar").focus();
        }
    });

    $("#searchBar").on("keyup", function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = $("#searchBar").val().trim().toLowerCase();
            let matchCount = 0;

            $(".product").each(function () {
                const name = $(this).find(".product-name").text().toLowerCase();
                const desc = $(this)
                    .find(".product-description")
                    .text()
                    .toLowerCase();

                if (name.includes(query) || desc.includes(query)) {
                    $(this).css({ display: "block", opacity: 1 });
                    matchCount++;
                } else {
                    $(this).css({ display: "none", opacity: 0 });
                }
            });

            $("#no-items-matched").remove();

            if (!query) {
                $(".product").css({ display: "block", opacity: 1 });
            } else if (matchCount === 0) {
                $("<div id='no-items-matched'>No Items Found</div>")
                    .css({ display: "block", opacity: 1 })
                    .insertAfter(".product-container");
            }
        }, 500);
    });

    // Add to Cart functionality
    $(".add-cart").on("click", function () {
        const product_id = $(this).closest(".product").attr("id");
        const quantity = 1;

        $.ajax({
            url: "/cart/add",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ product_id, quantity }),
            success: function (response) {
                if (response.alreadyInCart) {
                    showAlert({
                        message: "This item is already in your cart.",
                    });
                    return; // Prevents further UI updates if alert is shown
                }
                // Use the count from the response for instant badge update
                if (typeof response.count !== 'undefined') {
                    $("#cartCount").text(response.count);
                    if (response.count > 0) {
                        $("#cartCount").show();
                    } else {
                        $("#cartCount").hide();
                    }
                }
            },
            error: function (xhr) {
                showAlert({
                    message: xhr.responseJSON?.message || "Failed to add product to cart."
                });
            },
        });
    });
    
    $(".cart-icon").on("click", function () {
        window.location.href = "/cart";
    });
    
    $(".brand").on("click", function () {
        window.location.href = "/";
    });
});
