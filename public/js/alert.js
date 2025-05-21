$(document).ready(function () {
    function showAlert({ message, secondaryButton, onOk, onSecondary }) {
      console.log("showAlert called with message:", message);
      var $alertEl = $("#custom-alert");
      var $messageEl = $("#custom-alert-message");
      var $okEl = $("#custom-alert-ok");
      var $secondaryEl = $("#custom-alert-secondary");
      var $backdrop = $alertEl.find('.modal-backdrop');
      var $content = $alertEl.find('.modal-content');

      $messageEl.text(message || "");
      $alertEl.css("display", "block");
      $okEl.show();
      $secondaryEl.css("display", "none");

      // Remove previous handlers
      $okEl.off("click");
      $secondaryEl.off("click");
      $backdrop.off("click");
      $content.off("keydown");

      $okEl.on("click", function () {
        $alertEl.css("display", "none");
        if (typeof onOk === "function") onOk();
      });

      if (secondaryButton && secondaryButton.text) {
        $secondaryEl.text(secondaryButton.text).show();
        $secondaryEl.on("click", function () {
          $alertEl.css("display", "none");
          if (typeof onSecondary === "function") onSecondary();
        });
      }

      // Close on backdrop click
      $backdrop.on("click", function () {
        $alertEl.css("display", "none");
      });

      // Close on Escape key
      $(document).on("keydown.customAlert", function (e) {
        if (e.key === "Escape") {
          $alertEl.css("display", "none");
          $(document).off("keydown.customAlert");
        }
      });
    }

    // Expose globally
    window.showAlert = showAlert;
  });
