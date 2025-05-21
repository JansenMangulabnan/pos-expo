$(document).ready(() => {
    const $toggleButton = $("#theme-toggle");

    // Set theme on load
    function applyTheme(theme) {
        if (theme === "light") {
            $("body").addClass("light-mode");
            $toggleButton.empty().append("<i class='bx bxs-moon'></i>");
        } else {
            $("body").removeClass("light-mode");
            $toggleButton.empty().append("<i class='bx bxs-sun'></i>");
        }
    }

    // On load, apply saved theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);

    // Remove any previous click handlers to avoid duplicates
    $toggleButton.off("click");
    $toggleButton.on("click", () => {
        const isLight = $("body").toggleClass("light-mode").hasClass("light-mode");
        if (isLight) {
            $toggleButton.fadeOut(300, () => {
                $toggleButton.empty().append("<i class='bx bxs-moon'></i>").fadeIn(200);
                localStorage.setItem("icon", "moon");
            });
            localStorage.setItem("theme", "light");
        } else {
            $toggleButton.fadeOut(200, () => {
                $toggleButton.empty().append("<i class='bx bxs-sun'></i>").fadeIn(200);
                localStorage.setItem("icon", "sun");
            });
            localStorage.setItem("theme", "dark");
        }
    });
});
