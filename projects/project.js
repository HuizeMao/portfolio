import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let allProjects = [];
let query = '';
let selectedIndex = -1;
let selectedYear = null;

function getFilteredProjects() {
  return allProjects.filter(project => {
    const matchesSearch = Object.values(project).join('\n').toLowerCase().includes(query.toLowerCase());
    const matchesYear = selectedYear === null || project.year === selectedYear;
    return matchesSearch && matchesYear;
  });
}

function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    v => v.length,
    d => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    label: year,
    value: count
  }));

  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcData = sliceGenerator(data);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // Clear previous slices and legend
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('*').remove();

  const handleSelection = (year, idx) => {
    selectedYear = selectedYear === year ? null : year;
    selectedIndex = selectedYear === year ? idx : -1;
    updateView();
  };

  // Add clear filter button if a year is selected
  if (selectedYear !== null) {
    const clearButton = d3.select('.pie-layout')
      .append('button')
      .attr('class', 'clear-filter')
      .text('Clear Year Filter')
      .on('click', () => {
        selectedYear = null;
        selectedIndex = -1;
        updateView();
      });
  }

  arcData.forEach((d, idx) => {
    const year = data[idx].label;
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(idx))
      .attr('title', `Click to ${selectedYear === year ? 'clear' : 'filter by'} ${year}`)
      .on('click', () => handleSelection(year, idx));
  });

  const legend = d3.select('.legend');
  legend.selectAll('*').remove();

  data.forEach((d, idx) => {
    const year = d.label;
    legend.append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(idx)}`)
      .attr('title', `Click to ${selectedYear === year ? 'clear' : 'filter by'} ${year}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => handleSelection(year, idx));
  });
}

function createProjectCard(project) {
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

  return article;
}

function updateView() {
  const filtered = getFilteredProjects();
  const container = document.querySelector('.projects-grid');
  container.innerHTML = '';
  filtered.forEach(project => {
    container.appendChild(createProjectCard(project));
  });
  renderPieChart(filtered);
  document.getElementById('project-count').textContent = filtered.length;
}

document.addEventListener('DOMContentLoaded', async () => {
  allProjects = await fetchJSON('../lib/projects.json');
  updateView(); // initial render

  const searchInput = document.querySelector('.searchBar');
  searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    updateView(); // re-render filtered projects + chart
  });
});
