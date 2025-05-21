$(document).ready(function () {
    // Optionally fetch order history dynamically if needed
    // Example: AJAX call to update #order-history-list
    //
    // $.get('/api/orderHistory', function(data) {
    //     // Render data into #order-history-list
    // });

    // Scroll to top of history on section show (if using tabbed nav)
    $(document).on('show.history', function () {
        $(".history-container").scrollTop(0);
    });

    // Show receipt modal on history card click
    $(document).on("click", ".history-card", function () {
        const $info = $(this).find(".history-info").clone();
        let $modal = $("#history-receipt-modal");
        if ($modal.length === 0) {
            $modal = $(`
                <div id="history-receipt-modal" class="history-receipt-modal">
                    <div class="modal-backdrop"></div>
                    <div class="modal-content">
                        <h2>Order Receipt</h2>
                        <div class="receipt-details"></div>
                        <button class="close-btn">Close</button>
                    </div>
                </div>
            `).appendTo("body");
        }
        $modal.find(".receipt-details").html($info);
        $modal.show();
    });

    // Close modal on close button or backdrop click
    $(document).on("click", ".history-receipt-modal .close-btn, .history-receipt-modal .modal-backdrop", function () {
        $("#history-receipt-modal").hide();
    });
});
