$(document).ready(function () {

    //hide modal on escape key press
    $(".modal-backdrop, .close-btn").on("click", function () {
        $("#addProductModal").css("display", "none");
    });

    // Save changes in modal
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

    // Discard changes in modal
    $("#discardChanges").on("click", function () {
        location.reload();
    });

    // Confirm delete in modal
    $("#confirmDelete").on("click", function () {
        const productId = $("#deleteModal").data("productId");

        $.ajax({
            url: "/adminDelete",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ product_id: productId }),
            success: function () {
                alert("Product deleted successfully!");
                location.reload();
            },
            error: function (xhr) {
                alert("Error deleting product: " + xhr.responseText);
            },
        });
    });
});
