const projectForm = document.getElementById('projectForm');
const projectList = document.getElementById('projectList');
const projectCount = document.getElementById('projectCount');
const refreshBtn = document.getElementById('refreshBtn');

async function loadProjects() {
  const response = await fetch('/api/projects');

  if (!response.ok) {
    throw new Error('Unable to load projects.');
  }

  const { projects } = await response.json();

  projectList.innerHTML = '';
  projectCount.textContent = String(projects.length);

  if (projects.length === 0) {
    projectList.innerHTML = '<div class="empty-state">No projects yet. Create one to get started.</div>';
    return;
  }

  projects.forEach(project => {
    const card = document.createElement('article');
    card.className = 'project-card';

    const updated = new Date(project.updatedAt).toLocaleString();

    card.innerHTML = `
      <div class="project-card-header">
        <h3>${project.name}</h3>
        <span class="project-status">${project.status}</span>
      </div>
      <div class="project-meta">Updated ${updated}</div>
    `;

    projectList.appendChild(card);
  });
}

projectForm.addEventListener('submit', async event => {
  event.preventDefault();

  const formData = new FormData(projectForm);
  const name = formData.get('projectName').toString().trim();

  if (!name) {
    return;
  }

  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    const { error = 'Unable to create project.' } = await response.json().catch(() => ({}));
    alert(error);
    return;
  }

  projectForm.reset();
  await loadProjects();
});

refreshBtn.addEventListener('click', loadProjects);

loadProjects().catch(error => {
  projectList.innerHTML = `<div class="empty-state">${error.message}</div>`;
});
