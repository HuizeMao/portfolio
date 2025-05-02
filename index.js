import { fetchJSON, fetchGitHubData } from './global.js';

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

async function renderProjects() {
    try {
        const projects = await fetchJSON('../lib/projects.json');
        const container = document.getElementById('projects-container');
        
        if (!container) {
            console.error('Projects container not found');
            return;
        }

        // Sort projects by year (newest first) and take the first 3
        const latestProjects = projects
            .sort((a, b) => b.year - a.year)
            .slice(0, 3);

        latestProjects.forEach(project => {
            const article = document.createElement('article');
            
            // Title
            const title = document.createElement('h3');
            title.textContent = project.title;
            article.appendChild(title);

            // Image container
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';
            const img = document.createElement('img');
            img.src = project.image;
            img.alt = project.title;
            img.onerror = function() {
                this.style.display = 'none';
                this.parentElement.style.height = '0';
            };
            imageContainer.appendChild(img);
            article.appendChild(imageContainer);

            // Description container
            const descriptionContainer = document.createElement('div');
            descriptionContainer.className = 'description-container';
            
            const description = document.createElement('p');
            description.textContent = project.description;
            description.className = 'description-collapsed';
            descriptionContainer.appendChild(description);

            // Expand button
            const expandButton = document.createElement('button');
            expandButton.className = 'expand-button';
            expandButton.textContent = 'Read More';
            expandButton.onclick = function() {
                description.classList.toggle('description-collapsed');
                this.textContent = description.classList.contains('description-collapsed') ? 'Read More' : 'Show Less';
            };
            descriptionContainer.appendChild(expandButton);

            article.appendChild(descriptionContainer);
            container.appendChild(article);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
        const container = document.getElementById('projects-container');
        if (container) {
            container.innerHTML = '<p>Unable to load projects at this time.</p>';
        }
    }
}

// Load both GitHub stats and projects when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadGitHubStats();
    renderProjects();
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
  