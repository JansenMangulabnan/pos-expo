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
        imgDisplay.replaceWith(`
            <div class="edit-img-dropzone">
                <p>Drag and drop an image here, or click to select a file</p>
                <input type="file" class="edit-img-input" accept="image/*" hidden value="${imgDisplay.attr(
                    "src"
                )}" />
            </div>
        `);

        const dz = $(".edit-img-dropzone");
        const fileInput = $(".edit-img-input");

        $(document).on("click", ".edit-img-dropzone", function (e) {
            console.log("clicked edit img");
            e.stopPropagation(); // Important: stop bubbling up
            fileInput[0].click(); // trigger file input click
        });
        dz.on("dragover", function (e) {
            e.preventDefault();
            dz.addClass("dragover");
        });
        dz.on("dragleave", function (e) {
            e.preventDefault();
            dz.removeClass("dragover");
        });
        dz.on("drop", function (e) {
            e.preventDefault();
            dz.removeClass("dragover");
            let files = e.originalEvent.dataTransfer.files;
            if (files.length) {
                fileInput[0].files = files;
                fileInput.trigger("change");
            }
        });
        fileInput.on("change", function () {
            if (this.files.length > 0) {
                dz.find("p").text(this.files[0].name);
            }
        });

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
        const productId = currentProductCard.find(".product-id").text().replace("#", "");

        // Get the current image src
        const imgDisplay = currentProductCard.find(".img-display").attr("src");

        // Create FormData to include file and other product details
        const formData = new FormData();
        const fileInput = currentProductCard.find(".edit-img-input")[0];

        // Check if a new file is selected; if not, use the existing image src
        if (fileInput.files.length > 0) {
            formData.append("product_img", fileInput.files[0]); // Add the new file
        } else {
            formData.append("product_img", imgDisplay); // Use the old image path
        }

        formData.append("product_id", productId);
        formData.append("product_name", currentProductCard.find(".product-name").text().trim());
        formData.append("product_description", currentProductCard.find(".product-desc").text().trim());
        formData.append("product_stock", currentProductCard.find(".qty-edit-lable").text().trim());
        formData.append("product_category", currentProductCard.find(".category-edit-lable").text().trim());
        formData.append("product_price", currentProductCard.find(".price-edit-lable").text().trim());

        // Send the FormData via AJAX
        $.ajax({
            url: "/adminUpdateWithImage", // Endpoint to handle both file upload and update
            method: "POST",
            data: formData,
            processData: false, // Prevent jQuery from processing the data
            contentType: false, // Prevent jQuery from setting the content type
            success: function (response) {
                location.reload(); 
            },
            error: function (xhr) {
                alert("Error updating product: " + xhr.responseText);
            },
        });
    });
});
