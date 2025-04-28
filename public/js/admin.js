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
    $(document).on("click", ".edit-btn", function () {
        console.log(this);
        currentProductCard = $(this).closest(".product-card");
        console.log(currentProductCard);

        const imgDisplay = currentProductCard.find(".img-display img");
        const productName = currentProductCard.find(".product-name");
        const productDesc = currentProductCard.find(".product-desc");
        const productQty = currentProductCard.find(".qty-edit-lable");
        const productCategory = currentProductCard.find(".category-edit-lable");
        const productPrice = currentProductCard.find(".price-edit-lable");

        // Replace elements with contenteditable divs
        imgDisplay.replaceWith(
            `<input type="text" class="product-img-input" value="${imgDisplay.attr(
                "src"
            )}" />`
        );
        productName.replaceWith(
            `<div class="product-name" contenteditable="true">${currentProductCard
                .find(".product-name")
                .text()}</div>`
        );
        productDesc.replaceWith(
            `<div class="product-desc" contenteditable="true">${currentProductCard
                .find(".product-desc")
                .text()}</div>`
        );
        productQty.replaceWith(
            `<div class="qty-edit-lable" contenteditable="true">${parseInt(
                currentProductCard.find(".qty-edit-lable").text()
            )}</div>`
        );
        productCategory.replaceWith(
            `<div class="category-edit-lable" contenteditable="true">${currentProductCard
                .find(".category-edit-lable")
                .text()
                .trim()}</div>`
        );
        productPrice.replaceWith(
            `<div class="price-edit-lable" contenteditable="true">${parseFloat(
                currentProductCard
                    .find(".price-edit-lable")
                    .text()
                    .replace("$", "")
            )}</div>`
        );

        // Change edit button to confirm button
        $(this)
            .empty() // clear existing content
            .append("<i class='bx bx-save' ></i>") // append icon
            .addClass("save-btn")
            .removeClass("edit-btn");
    });

    // Confirm button click

    $(document).on("click", ".save-btn", function () {
        currentProductCard = $(".save-btn").closest(".product-card");
        const productId = currentProductCard
            .find(".product-id")
            .text()
            .replace("#", "");
        $(".save-modal").css("display", "flex").data("productId", productId);
    });


    $("#saveChanges").on("click", function () {
        const productId = currentProductCard
            .find(".product-id")
            .text()
            .replace("#", "");

        // Get updated values from contenteditable divs
        const imgSrc = currentProductCard.find(".product-img-input").val();
        const name = currentProductCard.find(".product-name").text();
        const desc = currentProductCard.find(".product-desc").text();
        const qty = currentProductCard.find(".product-qty").text();
        const category = currentProductCard.find(".product-category").text();
        const price = currentProductCard.find(".product-price").text();

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
                location.reload();
            },
            error: function (xhr) {
                alert("Error updating product: " + xhr.responseText);
            },
        });
    });
});
