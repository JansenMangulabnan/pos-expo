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
            .empty() // clear existing content
            .append("<i class='bx bx-check'></i>") // append icon
            .addClass("save-btn")
            .on("click", function () {
                saveevent();
            })
            .removeClass("edit-btn");
    });

    // Confirm button click
    function saveevent() {
        currentProductCard = $(".save-btn").closest(".product-card");
        const productId = currentProductCard
            .find(".product-id")
            .text()
            .replace("#", "");
        $(".save-modal").css("display", "flex").data("productId", productId);
    }

    $("#saveChanges").on("click", function () {
        const productId = currentProductCard
            .find(".product-id")
            .text()
            .replace("#", "");

        // Get updated values from input fields
        const imgSrc = currentProductCard.find(".product-img-input").val();
        const name = currentProductCard.find(".product-name-input").val();
        const desc = currentProductCard.find(".product-desc-input").val();
        const qty = currentProductCard.find(".product-qty-input").val();
        const category = currentProductCard
            .find(".product-category-input")
            .val();
        const price = currentProductCard.find(".product-price-input").val();

        $.ajax({
            url: "/adminUpdate",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                product_id: productId,
                product_img: imgSrc,
                product_name: name,
                product_description: desc,
                product_stock: qty,
                product_category: category,
                product_price: price,
            }),
            success: function () {
                alert("Product updated successfully!");
                location.reload();
            },
            error: function (xhr) {
                alert("Error updating product: " + xhr.responseText);
            },
        });
    });
});
