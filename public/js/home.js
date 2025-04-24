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
            const name = $(this).find(".product_name").text().toLowerCase();
            const desc = $(this)
                .find(".product_description")
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
});
