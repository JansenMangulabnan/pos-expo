function showAddProductModal() {
    $('#addProductModal').modal('show');
}

$(document).ready(function () {
    $('#addProductForm').on('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(this);
        formData.append('product_shop_id', adminShopId); // Use the admin's shop ID

        $.ajax({
            url: '/admin/products/add',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
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