// Insights Academy public website interactions.
// IMPORTANT: replace the placeholder WhatsApp number below before publishing.
// Use international format with digits only, e.g. Pakistan: 923001234567 (no + or spaces).
const ACADEMY_WHATSAPP_NUMBER = "923224103315";

document.getElementById("year").textContent = new Date().getFullYear();

const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
menuButton.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.textContent = isOpen ? "×" : "☰";
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.textContent = "☰";
}));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

document.getElementById("admission-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = document.getElementById("student-name").value.trim();
  const contact = document.getElementById("student-contact").value.trim();
  const interest = document.getElementById("interest").value;
  const message = document.getElementById("message").value.trim();
  const text = [
    "Hello Insights Academy, I would like to ask about admissions.",
    "",
    "Name: " + name,
    "Phone/email: " + contact,
    "Interested in: " + interest,
    message ? "Message: " + message : ""
  ].filter(Boolean).join("\n");

  if (ACADEMY_WHATSAPP_NUMBER.includes("X")) {
    const help = document.getElementById("form-help");
    help.textContent = "Before this form can open WhatsApp, replace ACADEMY_WHATSAPP_NUMBER in script.js with the academy's WhatsApp number in international format (digits only).";
    help.style.color = "#ffc58c";
    return;
  }
  const url = "https://wa.me/" + ACADEMY_WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
  window.open(url, "_blank", "noopener,noreferrer");
});