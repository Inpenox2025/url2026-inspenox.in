// === GLOBAL THEME FUNCTIONS ===
function updateLogo(theme) {
  const logo = document.getElementById("siteLogo");
  if (!logo) return;

  logo.src = theme === "dark"
    ? logo.dataset.dark
    : logo.dataset.light;
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  // Also set data-theme so the new index.html design stays in sync
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  updateThemeIcon();
  updateNavbarTheme();
  updateLogo(theme); 
}
function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";
  const iconClass = isDark ? "bi-sun-fill text-warning" : "bi-moon-fill text-dark";

  const desktopIcon = document.getElementById("themeToggleIconDesktop");
  const mobileIcon = document.getElementById("themeToggleIconMobile");

  if (desktopIcon) desktopIcon.className = `bi ${iconClass}`;
  if (mobileIcon) mobileIcon.className = `bi ${iconClass}`;
}

function updateNavbarTheme() {
  const navbar = document.getElementById("navbar");
  const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";

  if (navbar) {
    navbar.classList.toggle("navbar-dark", isDark);
    navbar.classList.toggle("navbar-light", !isDark);
  }
}

// ✅ Global Theme Toggle Function (accessible from HTML onclick)
window.toggleTheme = function () {
  const currentTheme = document.documentElement.getAttribute('data-bs-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
};

// === DOM READY SECTION ===
document.addEventListener("DOMContentLoaded", () => {
  // Theme Setup
  function getPreferredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply Initial Theme
  setTheme(getPreferredTheme());

  // Listen to system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const systemTheme = e.matches ? 'dark' : 'light';
      setTheme(systemTheme);
    }
  });

  // Navbar logic
  const navbar = document.getElementById("navbar");
  const navMenu = document.getElementById("navMenu");
  const toggler = document.querySelector(".custom-toggler");

  function collapseNavbar(navbarCollapse, toggler) {
    const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse) || new bootstrap.Collapse(navbarCollapse);
    bsCollapse.hide();
    if (toggler) toggler.classList.remove("active");
  }

  // Toggle toggler active class
  if (toggler) {
    toggler.addEventListener("click", () => {
      toggler.classList.toggle("active");
    });
  }

  // Collapse nav on nav-link click
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992 && navMenu?.classList.contains("show")) {
        collapseNavbar(navMenu, toggler);
      }
    });
  });

  // Collapse on outside click
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth < 992 &&
      navMenu?.classList.contains("show") &&
      !navMenu.contains(e.target) &&
      !toggler.contains(e.target)
    ) {
      collapseNavbar(navMenu, toggler);
    }
  });

  // Collapse and style navbar on scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar?.classList.add("scrolled");
    } else {
      navbar?.classList.remove("scrolled");
    }

    if (window.innerWidth < 992 && navMenu?.classList.contains("show")) {
      collapseNavbar(navMenu, toggler);
    }

    updateNavbarTheme();
  });

  // Fade-in Elements on Scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll(".fade-in").forEach(el => io.observe(el));

  // Mobile menu background toggle
  if (navMenu) {
    navMenu.addEventListener("shown.bs.collapse", () => {
      navbar?.classList.add("bg-body");
      navbar?.classList.remove("transparent");
    });

    navMenu.addEventListener("hidden.bs.collapse", () => {
      navbar?.classList.remove("bg-body");
      navbar?.classList.add("transparent");
    });
  }
});


// cache control

// window.addEventListener("beforeunload", function () {
//   // Clear cache-related data before leaving page
//   if ('caches' in window) {
//     caches.keys().then(function (names) {
//       for (let name of names) caches.delete(name);
//     });
//   }
// });

// document.querySelectorAll('link[rel="stylesheet"], script[src]').forEach(el => {
//   const srcAttr = el.tagName === 'LINK' ? 'href' : 'src';
//   const url = new URL(el[srcAttr], location.href);
//   url.searchParams.set('_v', Date.now()); // Append timestamp
//   el[srcAttr] = url.href;
// });
