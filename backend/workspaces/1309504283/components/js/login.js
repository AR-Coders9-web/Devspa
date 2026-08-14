const login = document.querySelector(".login");
const passwordInput = document.querySelector("#password");
const emailInput = document.querySelector("#email");
const alertBox = document.getElementById("successAlert");


login.addEventListener("click", (e) => {

    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    const findUser = users.find((user) => {
        return user.email === email && user.password === password;
    })

    if (findUser) {
        localStorage.setItem("loggedIn", "true");

        localStorage.setItem("CurrentUser", JSON.stringify(findUser))

        alertBox.classList.add("show");

        setTimeout(() => {
            alertBox.classList.remove("show");
            window.location.href="./Task.html"
        }, 3000);
    }

    else {
        alert("invilade email or password")


    }

});