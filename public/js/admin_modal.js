$(document).ready(function () {

    //hide modal on escape key press
    $(".modal-backdrop, .close-btn").on("click", function () {
        $("#addProductModal").css("display", "none");
        $("#editProductModal").css("display", "none");
        $("#deleteModal").css("display", "none");
    });





    // Discard changes in modal
    $("#discardChanges").on("click", function () {
        location.reload();
    });

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
