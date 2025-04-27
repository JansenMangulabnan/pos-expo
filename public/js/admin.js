$(document).ready(function () {
    $(document).on("keydown", function (event) {
        if (event.key === "Escape") {
            $(".add-modal").css("display", "none");
        }
    });
        

    $(".modal-backdrop, .close-btn").on("click", function () {
        $(".add-modal").css("display", "none");
    });

    $(".add-product-btn").on("click", function () {
        $(".add-modal").css("display", "flex");
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
