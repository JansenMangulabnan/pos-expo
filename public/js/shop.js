$(document).ready(function () {
    // Function to show the correct content based on the active nav item
    function showContent(section) {
        $(".shop-content > div").hide(); // Hide all sections
        $(`.shop-content .${section}`).show(); // Show the selected section
    }

    // Check localStorage for the last active section
    const savedSection = localStorage.getItem("activeSection") || "content-menu";
    showContent(savedSection);

    // Set the active class on the corresponding sidebar item
    $(".sidebar-item").removeClass("active");
    $(`.sidebar-item:contains(${savedSection.split('-')[1].charAt(0).toUpperCase() + savedSection.split('-')[1].slice(1)})`).addClass("active");

    // Handle sidebar navigation clicks
    $(".sidebar-item").on("click", function () {
        // Remove 'active' class from all sidebar items
        $(".sidebar-item").removeClass("active");

        // Add 'active' class to the clicked item
        $(this).addClass("active");

        // Determine the section to show based on the clicked item's text
        let section = "content-menu"; // Default section
        if ($(this).text().trim() === "Menu") {
            section = "content-menu";
        } else if ($(this).text().trim() === "Sales") {
            section = "content-sales";
        } else if ($(this).text().trim() === "Inventory") {
            section = "content-inventory";
        } else if ($(this).text().trim() === "Reports") {
            section = "content-reports";
        } else if ($(this).text().trim() === "Orders") {
            section = "content-order";
        }

        // Save the active section to localStorage
        localStorage.setItem("activeSection", section);

        // Show the corresponding content section
        showContent(section);
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
