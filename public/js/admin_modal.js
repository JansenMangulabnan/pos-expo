$(document).ready(function () {
    //hide modal on escape key press
    $(".modal-backdrop, .close-btn").on("click", function () {
        $("#addProductModal").css("display", "none");
        $("#editProductModal").css("display", "none");
        $("#deleteModal").css("display", "none");
        $("input, textarea").val("");
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
                location.reload();
            },
            error: function (xhr) {
                alert("Error deleting product: " + xhr.responseText);
            },
        });
    });
    
    const dz = $('#product_img_dropzone');
    const fileInput = $('#product_img');

    dz.on('click', function(e) {
        e.stopPropagation(); // Important: stop bubbling up
        fileInput[0].click(); // trigger file input click
    });

    dz.on('dragover', function(e) {
        e.preventDefault();
        dz.addClass('dragover');
    });

    dz.on('dragleave', function(e) {
        e.preventDefault();
        dz.removeClass('dragover');
    });

    dz.on('drop', function(e) {
        e.preventDefault();
        dz.removeClass('dragover');
        let files = e.originalEvent.dataTransfer.files;
        if (files.length) {
            fileInput[0].files = files;
            fileInput.trigger('change');
        }
    });

    fileInput.on('change', function() {
        if (this.files.length > 0) {
            dz.find('p').text(this.files[0].name);
        }
    });
});
