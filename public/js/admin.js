$(document).ready(function () {
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
            url: "adminAdd",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                alert("Product added successfully!");
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

    let currentProductCard = null;

    $(".delete-btn").on("click", function () {
        currentProductCard = $(this).closest(".product-card");
        const productId = currentProductCard
            .find(".product-id")
            .text()
            .replace("#", "");

        $("#deleteModal").css("display", "flex").data("productId", productId);
    });

    // Edit button click
    $(".edit-btn").on("click", function () {
        currentProductCard = $(this).closest(".product-card");

        // Replace elements with input fields
        const imgDisplay = currentProductCard.find(".img-display img");
        const productName = currentProductCard.find(".product-name");
        const productDesc = currentProductCard.find(".product-desc");
        const productQty = currentProductCard.find(".product-qty");
        const productCategory = currentProductCard.find(".product-category");
        const productPrice = currentProductCard.find(".product-price");

        imgDisplay.replaceWith(
            `<input type="text" class="product-img-input" value="${imgDisplay.attr(
                "src"
            )}" />`
        );
        productName.replaceWith(
            `<input type="text" class="product-name-input" value="${productName.text()}" />`
        );
        productDesc.replaceWith(
            `<input type="text" class="product-desc-input" value="${productDesc.text()}" />`
        );
        productQty.replaceWith(
            `<input type="number" class="product-qty-input" value="${parseInt(
                productQty.text()
            )}" />`
        );
        productCategory.replaceWith(
            `<input type="text" class="product-category-input" value="${productCategory.text()}" />`
        );
        productPrice.replaceWith(
            `<input type="number" class="product-price-input" value="${parseFloat(
                productPrice.text().replace("$", "")
            )}" />`
        );

        // Change edit button to confirm button
        $(this)
            .html("<i class='bx bx-check' ></i>")
            .addClass("save-btn")
            .removeClass("edit-btn");
    });

    // Confirm button click
    $(document).on("click", ".save-btn", function () {
        currentProductCard = $(this).closest(".product-card");
        const productId = currentProductCard
        .find(".product-id").text().replace("#", "");
        $(".save-modal").css("display", "flex");
    });
});
