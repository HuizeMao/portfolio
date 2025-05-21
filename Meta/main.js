import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale, yScale;
let commits = [], filteredCommits = [];
let commitMinTime, commitMaxTime;
let commitProgress = 15;
let timeScale;
const localeOpts = { dateStyle: 'long', timeStyle: 'short' };
let data; 

async function loadData() {
  return await d3.csv('loc.csv', row => ({
    ...row,
    line:     +row.line,
    depth:    +row.depth,
    length:   +row.length,
    datetime: new Date(row.datetime),
    file:     row.file,
    commit:   row.commit,
    author:   row.author,
    type:     row.type    // ← make sure this matches your CSV
  }));
}

function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([id, lines]) => {
    const first = lines[0];
    return {
      id,
      url:        `https://github.com/vis-society/lab-7/commit/${id}`,
      author:     first.author,
      datetime:   first.datetime,
      hourFrac:   first.datetime.getHours() + first.datetime.getMinutes()/60,
      totalLines: lines.length,
      lines
    };
  });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').classed('stats', true);
  const numFiles       = d3.groups(data, d => d.file).length;
  const maxDepth       = d3.max(data, d => d.depth);
  const longestLine    = d3.max(data, d => d.length);
  const maxLinesInFile = d3.max(
    d3.rollups(data, v => d3.max(v, d => d.line), d => d.file),
    d => d[1]
  );
  const dayCounts      = d3.rollups(
    data,
    v => v.length,
    d => d.datetime.toLocaleDateString('en-US', { weekday: 'long' })
  );
  const mostActiveDay  = d3.greatest(dayCounts, d => d[1])?.[0] || 'Unknown';

  [
    ['Commits', commits.length],
    ['Files', numFiles],
    ['Total LOC', data.length],
    ['Max Depth', maxDepth],
    ['Longest Line', longestLine],
    ['Max Lines', maxLinesInFile],
    ['Most Active Day', mostActiveDay]
  ].forEach(([label, value]) => {
    dl.append('dt').text(label);
    dl.append('dd').html(value);
  });
}

function renderTooltipContent(commit) {
  if (!commit) return;
  document.getElementById('commit-link').href        = commit.url;
  document.getElementById('commit-link').textContent = commit.id;
  document.getElementById('commit-date').textContent = commit.datetime
    .toLocaleString({ dateStyle: 'full', timeStyle: 'short' });
}
function updateTooltipVisibility(v) {
  document.getElementById('commit-tooltip').hidden = !v;
}
function updateTooltipPosition(e) {
  const tip = document.getElementById('commit-tooltip');
  tip.style.left = `${e.clientX + 10}px`;
  tip.style.top  = `${e.clientY + 10}px`;
}

function isSelected(sel, d) {
  if (!sel) return false;
  const [[x0,y0],[x1,y1]] = sel;
  const x = xScale(d.datetime), y = yScale(d.hourFrac);
  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderSelectionCount(sel) {
  const count = sel ? commits.filter(d => isSelected(sel, d)).length : 0;
  document.querySelector('#selection-count').textContent =
    count ? `${count} commits selected` : 'No commits selected';
}

function renderLanguageBreakdown(sel) {
  const container = document.getElementById('language-breakdown');
  if (!sel) { container.innerHTML = ''; return; }
  const chosen = commits.filter(d => isSelected(sel, d));
  if (!chosen.length) { container.innerHTML = ''; return; }

  const lines  = chosen.flatMap(d => d.lines);
  const byType = d3.rollup(lines, v => v.length, d => d.type);
  container.innerHTML = '';
  for (const [lang, cnt] of byType) {
    const pct = d3.format('.1~%')(cnt / lines.length);
    container.innerHTML += `<dt>${lang}</dt><dd>${cnt} lines (${pct})</dd>`;
  }
}

function brushed(event) {
  const sel = event.selection;
  d3.selectAll('circle').classed('selected', d => isSelected(sel, d));
  renderSelectionCount(sel);
  renderLanguageBreakdown(sel);
}

function updateScatterPlot(data, pts) {
  d3.select('#chart').selectAll('svg').remove();

  const width = 1000, height = 600;
  const margin = { top: 10, right: 10, bottom: 300, left: 40 };
  const area = {
    left:   margin.left,
    top:    margin.top,
    right:  width - margin.right,
    bottom: height - margin.bottom,
    width:  width  - margin.left - margin.right,
    height: height - margin.top  - margin.bottom
  };

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow','visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(pts, d => d.datetime))
    .range([area.left, area.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0,24])
    .range([area.bottom, area.top]);

  const [minL, maxL] = d3.extent(pts, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minL, maxL]).range([2,30]);

  svg.append('g')
    .attr('class','gridlines')
    .attr('transform', `translate(${area.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .tickSize(-area.width)
        .tickFormat('')
    );

  const dots = svg.append('g').classed('dots', true);
  dots.selectAll('circle')
    .data(pts, d => d.id)
    .join(
      enter => enter.append('circle')
        .attr('r',   d => rScale(d.totalLines))
        .attr('cx',  d => xScale(d.datetime))
        .attr('cy',  d => yScale(d.hourFrac))
        .style('fill','steelblue')
        .style('fill-opacity',0.7)
        .on('mouseenter', (e,d)=> {
          d3.select(e.currentTarget).style('fill-opacity',1);
          renderTooltipContent(d);
          updateTooltipVisibility(true);
          updateTooltipPosition(e);
        })
        .on('mousemove', updateTooltipPosition)
        .on('mouseleave', e=> {
          d3.select(e.currentTarget).style('fill-opacity',0.7);
          updateTooltipVisibility(false);
        }),
      update => update
        .transition().duration(200)
        .attr('r',  d => rScale(d.totalLines))
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac)),
      exit => exit.remove()
    );

  svg.append('g')
    .attr('transform', `translate(0,${area.bottom})`)
    .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.timeFormat('%a %d')));
  svg.append('g')
    .attr('transform', `translate(${area.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat(d =>
      String(d % 24).padStart(2,'0') + ':00'
    ));

  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function updateFileUnits(filteredCommits) {
  // 2.1: collect & group lines by file
  const lines = filteredCommits.flatMap(d => d.lines);

  // 2.1 check:
  // console.log('all lines:', lines.length, lines);

  let files = d3.groups(lines, d => d.file)
                .map(([name, lines]) => ({ name, lines }));

  // 2.3: sort descending by # lines
  files = d3.sort(files, d => -d.lines.length);

  // 2.4: color scale
  const fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

  // clear out old
  const container = d3.select('.files');
  container.selectAll('div').remove();

  // bind + enter
  const fileDivs = container.selectAll('div')
    .data(files)
    .enter().append('div');

  // filename + count
  const dt = fileDivs.append('dt');
  dt.append('code').text(d => d.name);
  dt.append('small').text(d => `${d.lines.length} lines`);

  // unit-vis: one dot per line
  fileDivs.append('dd')
    .selectAll('div')
    .data(d => d.lines)
    .enter().append('div')
      .attr('class', 'line')
      .style('background-color', d => fileTypeColors(d.type));  // ← use .type, not .tech
}

async function init() {
  data = await loadData();
  commits         = processCommits(data);
  filteredCommits = [...commits];

  renderCommitInfo(data, commits);

  commitMinTime = d3.min(commits, d => d.datetime);
  commitMaxTime = d3.max(commits, d => d.datetime);
  timeScale     = d3.scaleTime([commitMinTime, commitMaxTime], [0, 100]);

  const slider = document.getElementById('filter-slider');
  const timeEl = document.getElementById('filter-time');

  slider.min   = 0;
  slider.max   = 100;
  slider.value = commitProgress;
  timeEl.textContent = timeScale
    .invert(commitProgress)
    .toLocaleString(localeOpts);

  slider.addEventListener('input', () => {
    commitProgress = +slider.value;
    const cutoff   = timeScale.invert(commitProgress);
    timeEl.textContent = cutoff.toLocaleString(localeOpts);

    filteredCommits = commits.filter(d => d.datetime <= cutoff);
    updateScatterPlot(data, filteredCommits);
    updateFileUnits(filteredCommits);
    setupFileScrolly();

  });

  // **initial** draw of both chart & units
  updateScatterPlot(data, filteredCommits);
  updateFileUnits(filteredCommits);
  setupFileScrolly();
  renderItems(0);

}

init();


function displayCommitFiles(commitSlice) {
  // flatten all the lines from that slice
  const lines = commitSlice.flatMap(d => d.lines);

  // same grouping + sorting logic
  let files = d3.groups(lines, d => d.file)
                .map(([name, lines]) => ({ name, lines }));
  files = d3.sort(files, d => -d.lines.length);

  // reuse the same color scale
  const fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

  // clear + rebind
  const container = d3.select('.files');
  container.selectAll('div').remove();

  const filesContainer = container.selectAll('div')
    .data(files)
    .enter()
    .append('div');

  filesContainer.append('dt')
    .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);

  filesContainer.append('dd')
    .selectAll('div')
    .data(d => d.lines)
    .enter()
    .append('div')
      .attr('class','line')
      .style('background', d => fileTypeColors(d.type));
}


function renderItems(startIndex) {
  // 1) clear out old
  itemsContainer.selectAll('.item').remove();

  // 2) figure out which commits should be visible
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  const newCommitSlice = commits.slice(startIndex, endIndex);

  // 3) update the chart to show only those dots
  //    (instead of: updateScatterPlot(data, …) or updateScatterPlot(data, filteredCommits))
  updateScatterPlot(data, newCommitSlice);

  // 4) update the little per-file dot‐plots:
  displayCommitFiles(newCommitSlice);

  // 5) (opt) recompute summary stats over newCommitSlice
  //    e.g. renderCommitInfo(newCommitSlice, newCommitSlice)
  //    or write a smaller function that just recomputes the six numbers

  // 6) render each commit’s narrative
  itemsContainer.selectAll('.item')
    .data(newCommitSlice)
    .enter()
    .append('div')
      .attr('class','item')
      .html((commit, i) => `
        <p>
          On ${commit.datetime.toLocaleString('en', localeOpts)},
          I made <a href="${commit.url}" target="_blank">
            ${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
          </a>.
          I edited ${commit.totalLines} lines across
          ${d3.rollups(commit.lines, v => v.length, d => d.file).length} files.
          Then I looked over all I had made, and I saw that it was very good.
        </p>
      `)
      .style('position','absolute')
      .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`);
}



const NUM_ITEMS = 20;
const VISIBLE_COUNT = 5;        // show one commit at a time
const ITEM_HEIGHT   = 200;      // whatever feels good
const totalHeight   = (NUM_ITEMS - VISIBLE_COUNT + 1) * ITEM_HEIGHT;
const scrollContainer = d3.select('#scroll-container');
const spacer = d3.select('#spacer');
spacer.style('height', `${totalHeight}px`);
const itemsContainer = d3.select('#items-container');
scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(
    0,
    Math.min(startIndex, commits.length - VISIBLE_COUNT),
  );
  renderItems(startIndex);
});


// 11) Second scrolly (file‐sizes scrolly)
function setupFileScrolly(){
  const V=5, H=200;
  const scroll = d3.select('#file-scroll-container');
  const spacer = d3.select('#file-spacer');
  const items  = d3.select('#file-items-container');
  spacer.style('height',`${(commits.length - V +1)*H}px`);

  scroll.on('scroll',()=>{
    const top = scroll.property('scrollTop');
    let i = Math.floor(top/H);
    i = Math.max(0, Math.min(i, commits.length - V));
    renderFileItems(i,V,H,items);
  });
  renderFileItems(0,5,200,items);
}
function renderFileItems(start, V, H, container){
  container.selectAll('.item').remove();
  const slice = commits.slice(start, start+V);
  slice.forEach(d=>displayCommitFiles([d]));
  container.selectAll('.item')
    .data(slice).join('div')
      .attr('class','item')
      .html(c=>`
        <p>
          <strong>${c.datetime.toLocaleDateString()}</strong>:
          touched <strong>${c.totalLines}</strong> lines across
          <strong>${d3.rollup(c.lines,v=>v.length,d=>d.file).size}</strong> files.
        </p>`)
      .style('top',(d,i)=>`${i*H}px`);
}
