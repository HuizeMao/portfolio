import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

async function loadGitHubStats() {
    try {
        const username = 'HuizeMao';
        const stats = await fetchGitHubData(username);
        const statsContainer = document.getElementById('profile-stats');
        
        if (stats && statsContainer) {
            statsContainer.innerHTML = `
                <div class="github-stats-card">
                    <img src="${stats.avatar_url}" alt="${username}'s GitHub avatar" class="github-avatar">
                    <div class="github-info">
                        <h3>${stats.name || username}</h3>
                        <p>${stats.bio || 'GitHub User'}</p>
                        <div class="github-metrics">
                            <span>Repositories: ${stats.public_repos}</span>
                            <span>Followers: ${stats.followers}</span>
                            <span>Following: ${stats.following}</span>
                        </div>
                        <a href="${stats.html_url}" target="_blank" class="github-link">View Profile</a>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading GitHub stats:', error);
        const statsContainer = document.getElementById('profile-stats');
        if (statsContainer) {
            statsContainer.innerHTML = '<p>Unable to load GitHub stats at this time.</p>';
        }
    }
}

async function loadProjects() {
    try {
        const projects = await fetchJSON('./lib/projects.json');
        const latestProjects = projects.slice(0, 3);
        const projectsContainer = document.getElementById('projects-container');
        if (projectsContainer) {
            renderProjects(latestProjects, projectsContainer, 'h3');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        const projectsContainer = document.getElementById('projects-container');
        if (projectsContainer) {
            projectsContainer.innerHTML = '<p>Unable to load projects at this time.</p>';
        }
    }
}

// Load both GitHub stats and projects when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadGitHubStats();
    loadProjects();
});

const githubData = await fetchGitHubData('HuizeMao');

const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
    profileStats.innerHTML = `
          <dl>
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
          </dl>
      `;
  }
  