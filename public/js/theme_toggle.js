$(document).ready(() => {
    const $toggleButton = $("#theme-toggle");
    
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        $("body").addClass("light-mode");
        $toggleButton.empty().append("<i class='bx bxs-moon'></i>");
    }
    
    $toggleButton.on("click", () => {
        $("body").toggleClass("light-mode");;
        
        if ($("body").hasClass("light-mode")) {
            $toggleButton.fadeOut(300, () => {
                $toggleButton.empty().append("<i class='bx bxs-moon'></i>").fadeIn(200);
                localStorage.setItem("icon", "moon");
            });
            localStorage.setItem("theme", "light");
        } else { 
            localStorage.setItem("theme", "dark");
            $toggleButton.fadeOut(200, () => {
                $toggleButton.empty().append("<i class='bx bxs-sun'></i>").fadeIn(200);
                localStorage.setItem("icon", "sun");
            });
        }
    });
});
