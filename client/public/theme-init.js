// Runs before the app and stylesheet paint, including on direct page visits.
(function () {
  var preference;
  try {
    preference = localStorage.getItem("marketplace-theme");
  } catch (_) {
    // Browsing with storage disabled still supports a session-only theme.
  }
  var dark = preference === "dark" ||
    (preference !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#111522" : "#f8f9fc");
})();
