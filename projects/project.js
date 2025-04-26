import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
    try {
        const projects = await fetchJSON('../lib/projects.json');
        const projectsContainer = document.querySelector('.projects-grid');
        if (projectsContainer) {
            renderProjects(projects, projectsContainer, 'h3');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        const projectsContainer = document.querySelector('.projects-grid');
        if (projectsContainer) {
            projectsContainer.innerHTML = '<p class="error">Unable to load projects at this time.</p>';
        }
    }
}

// Load projects when the DOM is ready
document.addEventListener('DOMContentLoaded', loadProjects);
