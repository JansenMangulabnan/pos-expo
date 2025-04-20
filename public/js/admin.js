function showAddProductModal() {
    $('#addProductModal').modal('show');
}

$(document).ready(function () {
    $('#addProductForm').on('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(this); // Use FormData to handle file uploads

        $.ajax({
            url: 'adminAdd',
            method: 'POST', // Change to PUT
            data: formData,
            processData: false, // Prevent jQuery from processing the data
            contentType: false, // Prevent jQuery from setting the Content-Type header
            success: function (response) {
                alert('Product added successfully!');
                location.reload(); // Reload the page to show the new product
            },
            error: function (xhr) {
                alert('Error adding product: ' + xhr.responseText);
            }
        });
    });
});