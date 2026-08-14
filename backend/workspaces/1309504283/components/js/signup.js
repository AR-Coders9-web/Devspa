// Select Elements
const btn = document.querySelector(".create");

const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#emailbox");
const passwordInput = document.querySelector("#pass");
const confirmPasswordInput = document.querySelector("#passConform");

btn.addEventListener("click", function (e) {

    e.preventDefault();

    // Get Input Values
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // Validation
    if (name === "" || email === "" || password === "" || confirmPassword === "") {
        alert("Please fill all fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Get Existing Users
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Check Duplicate Email
    const alreadyExists = users.some(user => user.email === email);

    if (alreadyExists) {
        alert("Account already exists with this email.");
        return;
    }

    // Create User Object
    const user = {
        name: name,
        email: email,
        password: password
    };

    // Push New User
    users.push(user);

    // Save to Local Storage
    localStorage.setItem("users", JSON.stringify(users));

    alert("Account Created Successfully!");

    // Redirect
    window.location.href = "./Login.html";

});