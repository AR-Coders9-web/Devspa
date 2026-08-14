const words = [
    "Organized.",
    "Productive.",
    "Focused.",
    "Successful."
];

let wordIndex = 0;
let charIndex = 0;
let currentWord = "";
let isDeleting = false;

const typingElement = document.getElementById("typing");

function type() {
    currentWord = words[wordIndex];

    if (!isDeleting) {
        typingElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === currentWord.length) {
            isDeleting = true;
            setTimeout(type, 1500); // Pause after typing
            return;
        }
    } else {
        typingElement.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
        }
    }

    setTimeout(type, isDeleting ? 70 : 120);
}

type();

let login = document.querySelector(".login")
let signup = document.querySelector(".signup")
let start = document.querySelector(".cssbuttons-io-button")


login.addEventListener('click', ()=>{
    window.location.href="./components/html/Login.html"
})

signup.addEventListener('click', ()=>{
    window.location.href="./components/html/sign.html"
})

start.addEventListener('click', ()=>{
    window.location.href="./components/html/sign.html"
})