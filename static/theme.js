// Theme management
function initializeTheme() {
  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (systemPrefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Create theme toggle button
  function createThemeToggle() {
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Toggle theme');
    button.innerHTML = `<i class="fas ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
    
    button.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Update icon
      button.innerHTML = `<i class="fas ${newTheme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
    });

    return button;
  }

  // Add theme toggle to navbar
  const navActions = document.querySelector('.nav-actions');
  if (navActions) {
    navActions.insertBefore(createThemeToggle(), navActions.firstChild);
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme); 