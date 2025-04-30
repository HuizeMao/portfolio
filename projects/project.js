import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let allProjects = [];
let query = '';

function getFilteredProjects() {
  return allProjects.filter(project => {
    let text = Object.values(project).join('\n').toLowerCase();
    return text.includes(query.toLowerCase());
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

  arcData.forEach((d, idx) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(idx));
  });

  const legend = d3.select('.legend');
  legend.selectAll('*').remove();

  data.forEach((d, idx) => {
    legend.append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

function updateView() {
  const filtered = getFilteredProjects();
  const container = document.querySelector('.projects-grid');
  renderProjects(filtered, container, 'h3');
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
