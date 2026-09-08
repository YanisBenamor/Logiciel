const resources = {
  projets: {
    title: 'Projets',
    subtitle: 'Nom du projet, manager, budget et date de début',
    endpoint: '/api/projets',
    fields: [
      { name: 'nomProj', label: 'Nom projet', type: 'text', required: true, primary: true },
      { name: 'mgrProj', label: 'Manager', type: 'text', required: true },
      { name: 'budget', label: 'Budget', type: 'number', required: true },
      { name: 'dateDebut', label: 'Date de début', type: 'text', required: true, placeholder: 'JJ/MM/AAAA' },
    ],
    columns: [
      { key: 'nomProj', label: 'nomProj', className: 'pk' },
      { key: 'mgrProj', label: 'mgrProj' },
      { key: 'budget', label: 'budget' },
      { key: 'dateDebut', label: 'dateDebut' },
    ],
    idFromRow: (row) => [row.nomProj],
    formFromRow: (row) => ({ ...row }),
  },
  employes: {
    title: 'Employés',
    subtitle: 'Employés avec département référencé',
    endpoint: '/api/employes',
    fields: [
      { name: 'idEmp', label: 'ID employé', type: 'text', required: true, primary: true },
      { name: 'nomEmp', label: 'Nom', type: 'text', required: true },
      { name: 'salaire', label: 'Salaire', type: 'number', required: true },
      { name: 'deptEmp', label: 'Département', type: 'select', required: true, source: 'departements', sourceKey: 'deptEmp', sourceLabel: 'deptEmp' },
    ],
    columns: [
      { key: 'idEmp', label: 'idEmp', className: 'pk' },
      { key: 'nomEmp', label: 'nomEmp' },
      { key: 'salaire', label: 'salaire' },
      { key: 'deptEmp', label: 'deptEmp', className: 'fk', linkedResource: 'departements', linkedKey: 'deptEmp' },
    ],
    idFromRow: (row) => [row.idEmp],
    formFromRow: (row) => ({ ...row }),
  },
  departements: {
    title: 'Départements',
    subtitle: 'Départements avec leur manager',
    endpoint: '/api/departements',
    fields: [
      { name: 'deptEmp', label: 'Code département', type: 'text', required: true, primary: true },
      { name: 'mgrEmp', label: 'Manager', type: 'text', required: true },
    ],
    columns: [
      { key: 'deptEmp', label: 'deptEmp', className: 'pk' },
      { key: 'mgrEmp', label: 'mgrEmp' },
    ],
    idFromRow: (row) => [row.deptEmp],
    formFromRow: (row) => ({ ...row }),
  },
  affectations: {
    title: 'Affectations',
    subtitle: 'Affectations projet/employé, heures et évaluation',
    endpoint: '/api/affectations',
    fields: [
      { name: 'nomProj', label: 'Projet', type: 'select', required: true, source: 'projets', sourceKey: 'nomProj', sourceLabel: 'nomProj', primary: true },
      { name: 'idEmp', label: 'Employé', type: 'select', required: true, source: 'employes', sourceKey: 'idEmp', sourceLabel: 'idEmp', primary: true },
      { name: 'heures', label: 'Heures', type: 'number', required: true },
      { name: 'evalEmp', label: 'Evaluation', type: 'number', required: false, placeholder: 'Optionnel' },
    ],
    columns: [
      { key: 'nomProj', label: 'nomProj', className: 'pk' },
      { key: 'idEmp', label: 'idEmp', className: 'pk' },
      { key: 'heures', label: 'heures' },
      { key: 'evalEmp', label: 'evalEmp' },
    ],
    idFromRow: (row) => [row.nomProj, row.idEmp],
    formFromRow: (row) => ({ ...row }),
  },
};

const state = {
  currentResource: 'projets',
  cache: {
    projets: [],
    employes: [],
    departements: [],
    affectations: [],
  },
  modalMode: 'create',
  editingKey: null,
};

const panel = document.getElementById('resourcePanel');
const template = document.getElementById('resourceTemplate');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalTitle');
const modalError = document.getElementById('modalError');
const form = document.getElementById('resourceForm');
const apiStatus = document.getElementById('apiStatus');
const closeModalButton = document.getElementById('closeModalButton');

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => setActiveResource(button.dataset.resource));
});

closeModalButton.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (event) => {
  if (event.target === modalBackdrop) {
    closeModal();
  }
});

form.addEventListener('submit', handleFormSubmit);

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Erreur ${response.status}`);
  }

  return payload;
}

async function loadAllResources() {
  const [projets, employes, departements, affectations] = await Promise.all([
    apiFetch('/api/projets'),
    apiFetch('/api/employes'),
    apiFetch('/api/departements'),
    apiFetch('/api/affectations'),
  ]);

  state.cache.projets = projets;
  state.cache.employes = employes;
  state.cache.departements = departements;
  state.cache.affectations = affectations;
}

async function renderActiveResource() {
  const resource = resources[state.currentResource];
  const card = template.content.firstElementChild.cloneNode(true);
  card.querySelector('h2').textContent = resource.title;
  card.querySelector('p').textContent = resource.subtitle;

  const addButton = card.querySelector('.add-button');
  addButton.addEventListener('click', () => openForm('create', state.currentResource));

  const thead = card.querySelector('thead');
  const tbody = card.querySelector('tbody');

  const headerRow = document.createElement('tr');
  resource.columns.forEach((column) => {
    const th = document.createElement('th');
    th.textContent = column.label;
    headerRow.appendChild(th);
  });
  const actionTh = document.createElement('th');
  actionTh.textContent = 'actions';
  headerRow.appendChild(actionTh);
  thead.appendChild(headerRow);

  const rows = state.cache[state.currentResource];
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    resource.columns.forEach((column) => {
      const td = document.createElement('td');
      const value = row[column.key];
      const cellValue = value === null || value === undefined ? '' : value;

      if (column.className === 'fk' && column.linkedResource) {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'fk-link';
        link.textContent = cellValue;
        link.addEventListener('click', (event) => {
          event.preventDefault();
          setActiveResource(column.linkedResource);
          if (column.linkedKey) {
            focusRow(column.linkedResource, column.linkedKey, cellValue);
          }
        });
        td.appendChild(link);
      } else {
        td.textContent = cellValue;
      }

      if (column.className) {
        td.classList.add(column.className);
      }
      tr.appendChild(td);
    });

    const actionsTd = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'row-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary-button';
    editButton.textContent = 'Modifier';
    editButton.addEventListener('click', () => openForm('edit', state.currentResource, row));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger-button';
    deleteButton.textContent = 'Supprimer';
    deleteButton.addEventListener('click', () => confirmDelete(state.currentResource, row));

    actions.append(editButton, deleteButton);
    actionsTd.appendChild(actions);
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  });

  panel.innerHTML = '';
  panel.appendChild(card);
}

function setActiveResource(resourceName) {
  state.currentResource = resourceName;
  document.querySelectorAll('.tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.resource === resourceName);
  });
  renderActiveResource().catch(showStatusError);
}

function focusRow(resourceName, key, value) {
  window.requestAnimationFrame(() => {
    const card = document.querySelector('.resource-card');
    if (!card) {
      return;
    }
    const index = state.cache[resourceName].findIndex((row) => String(row[key]) === String(value));
    if (index >= 0) {
      const row = card.querySelectorAll('tbody tr')[index];
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.animate([{ backgroundColor: 'rgba(47, 111, 107, 0.18)' }, { backgroundColor: 'transparent' }], { duration: 1600 });
      }
    }
  });
}

function openForm(mode, resourceName, row = null) {
  state.modalMode = mode;
  state.editingKey = row ? resources[resourceName].idFromRow(row) : null;
  const resource = resources[resourceName];
  modalTitle.textContent = mode === 'create' ? `Ajouter ${resource.title.slice(0, -1)}` : `Modifier ${resource.title.slice(0, -1)}`;
  modalError.classList.add('hidden');
  modalError.textContent = '';
  form.innerHTML = '';

  const formData = row ? resource.formFromRow(row) : {};

  resource.fields.forEach((field) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'field';
    if (field.fullWidth) {
      wrapper.classList.add('full');
    }

    const label = document.createElement('label');
    label.setAttribute('for', field.name);
    label.textContent = field.label + (field.required ? ' *' : '');
    wrapper.appendChild(label);

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.name = field.name;
      input.id = field.name;
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = field.required ? 'Choisir...' : 'Aucune valeur';
      input.appendChild(emptyOption);

      const sourceRows = state.cache[field.source] || [];
      sourceRows.forEach((optionRow) => {
        const option = document.createElement('option');
        option.value = optionRow[field.sourceKey];
        option.textContent = optionRow[field.sourceLabel];
        input.appendChild(option);
      });
    } else {
      input = document.createElement('input');
      input.type = field.type;
      input.name = field.name;
      input.id = field.name;
      if (field.placeholder) {
        input.placeholder = field.placeholder;
      }
      if (field.primary && mode === 'edit') {
        input.readOnly = false;
      }
    }

    if (field.type !== 'select') {
      if (field.type === 'number') {
        input.step = '1';
      }
    }

    input.value = formData[field.name] ?? '';
    if (mode === 'edit' && field.primary) {
      input.value = formData[field.name] ?? '';
    }
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'icon-button';
  cancelButton.textContent = 'Annuler';
  cancelButton.addEventListener('click', closeModal);

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'primary-button';
  submitButton.textContent = mode === 'create' ? 'Créer' : 'Enregistrer';

  actions.append(cancelButton, submitButton);
  form.appendChild(actions);

  modalBackdrop.classList.remove('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modalBackdrop.classList.add('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  form.innerHTML = '';
  modalError.classList.add('hidden');
  modalError.textContent = '';
}

function showFormError(message) {
  modalError.textContent = message;
  modalError.classList.remove('hidden');
}

function showStatusError(error) {
  apiStatus.textContent = error.message;
  apiStatus.style.color = '#8d4510';
}

function clearStatus() {
  apiStatus.textContent = 'Connecté';
  apiStatus.style.color = '';
}

function collectFormData() {
  const data = {};
  const elements = Array.from(form.elements).filter((element) => element.name);
  elements.forEach((element) => {
    if (element.tagName === 'BUTTON') {
      return;
    }
    data[element.name] = element.value;
  });
  return data;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  modalError.classList.add('hidden');
  modalError.textContent = '';

  const resource = resources[state.currentResource];
  const payload = collectFormData();
  const method = state.modalMode === 'create' ? 'POST' : 'PUT';
  const url = state.modalMode === 'create'
    ? resource.endpoint
    : buildUpdateUrl(resource, state.editingKey);

  try {
    const body = buildPayload(resource, payload, state.modalMode === 'edit');
    await apiFetch(url, {
      method,
      body: JSON.stringify(body),
    });
    closeModal();
    await refreshAfterMutation();
  } catch (error) {
    showFormError(error.message);
  }
}

function buildUpdateUrl(resource, editingKey) {
  if (resource === resources.affectations) {
    return `${resource.endpoint}/${encodeURIComponent(editingKey[0])}/${encodeURIComponent(editingKey[1])}`;
  }
  return `${resource.endpoint}/${encodeURIComponent(editingKey[0])}`;
}

function buildPayload(resource, payload, isEdit) {
  const body = {};
  resource.fields.forEach((field) => {
    if (payload[field.name] === '') {
      if (field.required) {
        body[field.name] = '';
      } else {
        body[field.name] = null;
      }
      return;
    }

    if (field.type === 'number') {
      body[field.name] = Number(payload[field.name]);
    } else {
      body[field.name] = payload[field.name];
    }
  });

  if (isEdit) {
    resource.fields.forEach((field, index) => {
      if (field.primary && payload[field.name] === '' && state.editingKey) {
        body[field.name] = state.editingKey[index] ?? state.editingKey[0];
      }
    });
  }

  return body;
}

async function confirmDelete(resourceName, row) {
  const resource = resources[resourceName];
  const label = resource.title.slice(0, -1);
  const confirmed = window.confirm(`Supprimer ${label} ?`);
  if (!confirmed) {
    return;
  }

  const id = resource.idFromRow(row);
  const url = resourceName === 'affectations'
    ? `${resource.endpoint}/${encodeURIComponent(id[0])}/${encodeURIComponent(id[1])}`
    : `${resource.endpoint}/${encodeURIComponent(id[0])}`;

  try {
    await apiFetch(url, { method: 'DELETE' });
    await refreshAfterMutation();
  } catch (error) {
    showStatusError(error);
  }
}

async function refreshAfterMutation() {
  await loadAllResources();
  await renderActiveResource();
  clearStatus();
}

async function bootstrap() {
  try {
    await loadAllResources();
    await renderActiveResource();
    clearStatus();
  } catch (error) {
    showStatusError(error);
  }
}

bootstrap();