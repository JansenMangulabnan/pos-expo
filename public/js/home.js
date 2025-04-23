$(document).ready(function () {
    $(document).on("keydown", function (e) {
        if (e.ctrlKey && e.key === "k") {
            e.preventDefault();
            $("#searchBar").focus();
        }
    });

    $("#searchContainer").on("keyup", function (e) {
        
    });

});