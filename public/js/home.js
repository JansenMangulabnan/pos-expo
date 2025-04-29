$(document).ready(function () {
    $(document).on("keydown", function (e) {
        if (e.ctrlKey && e.key === "k") {
            e.preventDefault();
            $("#searchBar").focus();
        }
    });

    $("#searchBar").on("keyup", function () {
        const query = $(this).val().trim().toLowerCase();

        $(".product").each(function () {
            const name = $(this).find(".product-name").text().toLowerCase();
            const desc = $(this)
                .find(".product-description")
                .text()
                .toLowerCase();

            if (name.includes(query) || desc.includes(query)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });

        if (!query) {
            $(".product").show(); // Show all if input is cleared
        }
    });

    const profileImage = $("#profileImage");
    const profilePlaceholder = $("#profilePlaceholder");

    // Check if the profile image is empty or fails to load
    if (!profileImage.attr("src") || profileImage.attr("src").trim() === "") {
        profileImage.hide(); // Hide the image
        profilePlaceholder.css("display", "flex"); // Show the placeholder
    }

    // Handle image load error
    profileImage.on("error", function () {
        $(this).hide(); // Hide the image
        profilePlaceholder.css("display", "flex"); // Show the placeholder
    });
});