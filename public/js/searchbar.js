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
});