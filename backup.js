
let inventory = [];

document.addEventListener('DOMContentLoaded', () => {
  refreshList();

  document.getElementById('btn-refresh').addEventListener('click', refreshList);
  document.getElementById('btn-select-all').addEventListener('click', () => toggleAll(true));
  document.getElementById('btn-deselect-all').addEventListener('click', () => toggleAll(false));
  
  document.getElementById('btn-export').addEventListener('click', async () => {
    try {
      await BackupManager.exportBackup(inventory);
    } catch (err) {
      alert(err.message);
    }
  });

document.getElementById('input-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await BackupManager.importFromFile(file);
      if (!result.canceled) {
        // Notifica o background/popup e os content scripts abertos para atualizarem a tela
        chrome.runtime.sendMessage({ action: 'predefinedTagsUpdated' }).catch(() => {});
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {});
            }
          });
        });

        alert(`Restauração concluída! ${result.count} registros restaurados.`);
        await refreshList();
      }
    } catch (err) {
      alert('Erro ao importar: ' + err.message);
    } finally {
      e.target.value = '';
    }
  });

  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('modal-inspect').close();
  });
});

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getPreview(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `Array (${value.length} itens)`;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `Objeto { ${keys.slice(0, 4).join(', ')}${keys.length > 4 ? '...' : ''} }`;
  }
  const str = String(value);
  return str.length > 80 ? str.slice(0, 80) + '...' : str;
}

async function refreshList() {
  inventory = await BackupManager.scanAll();
  renderGroups();
  updateSummary();
}

function renderGroups() {
  const container = document.getElementById('groups-container');
  container.innerHTML = '';

  BackupManager.STORAGE_TYPES.forEach(type => {
    const items = inventory.filter(item => item.storage === type.id);
    if (items.length === 0) return;

    const groupEl = document.createElement('div');
    groupEl.className = 'group';
    const allChecked = items.every(i => i.selected);

    groupEl.innerHTML = `
      <div class="group-header">
        <div class="group-title">
          <input type="checkbox" class="group-check" data-storage="${type.id}" ${allChecked ? 'checked' : ''} />
          <span>${type.label}</span>
          <span class="badge">${items.length} ${items.length === 1 ? 'item' : 'itens'}</span>
        </div>
        <span class="size">${formatBytes(items.reduce((acc, i) => acc + i.size, 0))}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:40px;"></th>
            <th>Chave / Identificador</th>
            <th>Prévia do Conteúdo</th>
            <th>Tamanho</th>
            <th style="width:90px;">Ação</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;

    const tbody = groupEl.querySelector('tbody');

    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="item-check" data-uid="${item.uid}" ${item.selected ? 'checked' : ''} /></td>
        <td class="key-name">${item.key}</td>
        <td class="preview" title="${getPreview(item.value)}">${getPreview(item.value)}</td>
        <td class="size">${formatBytes(item.size)}</td>
        <td><button class="btn-inspect" data-uid="${item.uid}">Ver JSON</button></td>
      `;
      tbody.appendChild(tr);
    });

    container.appendChild(groupEl);
  });

  // Marca/desmarca item individual e salva preferência
  container.querySelectorAll('.item-check').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const item = inventory.find(i => i.uid === e.target.dataset.uid);
      if (item) item.selected = e.target.checked;
      await BackupManager.savePreferences(inventory);
      renderGroups();
      updateSummary();
    });
  });

  // Marca/desmarca grupo inteiro e salva preferência
  container.querySelectorAll('.group-check').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const storage = e.target.dataset.storage;
      inventory.forEach(i => {
        if (i.storage === storage) i.selected = e.target.checked;
      });
      await BackupManager.savePreferences(inventory);
      renderGroups();
      updateSummary();
    });
  });

  container.querySelectorAll('.btn-inspect').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const item = inventory.find(i => i.uid === e.target.dataset.uid);
      if (!item) return;
      document.getElementById('modal-title').textContent = `[${item.storage}] ${item.key}`;
      document.getElementById('modal-content').textContent = JSON.stringify(item.value, null, 2);
      document.getElementById('modal-inspect').showModal();
    });
  });
}

async function toggleAll(state) {
  inventory.forEach(item => item.selected = state);
  await BackupManager.savePreferences(inventory);
  renderGroups();
  updateSummary();
}

function updateSummary() {
  const selected = inventory.filter(i => i.selected);
  const totalBytes = selected.reduce((acc, i) => acc + i.size, 0);

  document.getElementById('summary-count').textContent =
    `${selected.length} de ${inventory.length} registros selecionados (salvo automaticamente)`;
  document.getElementById('summary-size').textContent =
    `Tamanho estimado do backup: ${formatBytes(totalBytes)}`;
}