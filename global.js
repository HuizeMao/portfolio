// // Step 2.1: Get all nav links
// const navLinks = $$("nav a");

// // Step 2.2: Find the link to the current page
// const currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );

// // Step 2.3: Add the class "current" to that link
// currentLink?.classList.add("current");

console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/" 
  : "/portfolio/";

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'Meta/', title: 'Meta' },
  { url: 'https://github.com/HuizeMao', title: 'GitHub' }
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  url = !url.startsWith('http') ? BASE_PATH + url : url;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

// Step 4: Add dark mode theme switcher
document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );
  
  // Get reference to <select>
  const select = document.querySelector('.color-scheme select');
  
  // Optional: centralize this logic
  function setColorScheme(scheme) {
    const html = document.documentElement;
    html.classList.remove("dark-theme", "light-theme");
  
    if (scheme === "dark") html.classList.add("dark-theme");
    else if (scheme === "light") html.classList.add("light-theme");
  
    html.style.setProperty("color-scheme", scheme);
  }
  
  
  // On load: check localStorage
  if ("colorScheme" in localStorage) {
    const saved = localStorage.colorScheme;
    setColorScheme(saved);
    select.value = saved;
  }
  
  // Listen for user changes
  select.addEventListener('input', (event) => {
    const newScheme = event.target.value;
    setColorScheme(newScheme);
    localStorage.colorScheme = newScheme;
    console.log('Color scheme changed to', newScheme);
  });
  
// Enhance contact form
const form = document.querySelector('form[action^="mailto:"]');

form?.addEventListener("submit", function (event) {
  event.preventDefault(); // Stop default submission

  const data = new FormData(form);
  const params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  const url = `${form.action}?${params.join("&")}`;
  location.href = url; // Open in email client
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    console.log(response);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';
  
  project.forEach(item => {
    const article = document.createElement('article');
    article.classList.add('project');
    
    const heading = document.createElement(headingLevel);
    heading.textContent = item.title;
    article.appendChild(heading);

    // Add image and description
    article.innerHTML += `
      <img src="${item.image}" alt="${item.title}">
      <p>${item.description}</p>
    `;

    // Add PDF button if available
    if (item.pdf) {
      const link = document.createElement('a');
      link.href = item.pdf;
      link.target = '_blank';
      link.textContent = 'View Work Sample (PDF)';
      link.classList.add('button'); // optional: style it like a button
      article.appendChild(link);
    }
    // Add year if available
    if (item.year) {
      const yearSpan = document.createElement('span');
      yearSpan.textContent = item.year;
      yearSpan.classList.add('project-year');
      article.appendChild(yearSpan);
    }
    containerElement.appendChild(article);
  });
}


export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
