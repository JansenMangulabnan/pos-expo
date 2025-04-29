$(document).ready(function () {
    // Initially show only the "Menu" content
    $(".shop-content .content-menu").show();
    $(".shop-content .content-sales, .shop-content .content-inventory, .shop-content .content-reports, .shop-content .content-order").hide();

    // Handle sidebar navigation clicks
    $(".sidebar-item").on("click", function () {
        // Remove 'active' class from all sidebar items
        $(".sidebar-item").removeClass("active");

        // Add 'active' class to the clicked item
        $(this).addClass("active");

        // Hide all content sections inside .shop-content
        $(".shop-content > div").hide();

        // Show the corresponding content section based on the clicked item
        if ($(this).text().trim() === "Menu") {
            $(".shop-content .content-menu").show();
        } else if ($(this).text().trim() === "Sales") {
            $(".shop-content .content-sales").show();
        } else if ($(this).text().trim() === "Inventory") {
            $(".shop-content .content-inventory").show();
        } else if ($(this).text().trim() === "Reports") {
            $(".shop-content .content-reports").show();
        } else if ($(this).text().trim() === "Orders") {
            $(".shop-content .content-order").show();
        }
    });

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
            url: "sellerAdd",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
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

});

function showPopup(message) {
    const $popup = $('#popup');
    $popup.text(message)
        .css({
            display: 'block',
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#f44336',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '5px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
            zIndex: 2
        });

    setTimeout(() => {
        $popup.fadeOut();
    }, 3000);
}
