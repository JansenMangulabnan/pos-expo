function showAddProductModal() {
    $("#addProductModal").modal("show");
}

$(document).ready(function () {
    $("#searchBar").on("keyup", function () {
        const query = $(this).val().trim().toLowerCase();

        $(".product-card").each(function () {
            const name = $(this).find(".product-name").text().toLowerCase();
            const desc = $(this)
                .find(".product-desc")
                .text()
                .toLowerCase();
            const id = $(this).find(".product-id").text().toLowerCase();
            const price = $(this).find(".product-price").text().toLowerCase();
            const category = $(this).find(".product-category").text().toLowerCase();

            if (name.includes(query) || desc.includes(query) || id.includes(query) || price.includes(query) || category.includes(query)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });

        if (!query) {
            $(".product-card").show();
        }
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
            transition: "all 0.3s"
        });
        
        $(".toggle-icon").css({
            transform: moved ? "scaleX(1)" : "scaleX(-1)",
            transition: "all 0.3s"
        });
        moved = !moved;
    });
});
