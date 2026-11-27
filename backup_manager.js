const BackupManager = (() => {
  const PREFS_KEY = '__backup_preferences__';

  const STORAGE_TYPES = [
    { id: 'chrome_local', label: 'chrome.storage.local (Principal / Kanban / Configurações)', defaultSelected: true },
    { id: 'chrome_sync', label: 'chrome.storage.sync (Sincronizado na Conta)', defaultSelected: true },
    { id: 'local_storage', label: 'localStorage (Dados locais da extensão)', defaultSelected: true },
    { id: 'session_storage', label: 'sessionStorage (Dados temporários de sessão)', defaultSelected: false },
    { id: 'cache_api', label: 'Cache API (Arquivos / Respostas em Cache)', defaultSelected: false }
  ];

  function getByteSize(value) {
    const str = typeof value === 'string' ? value : JSON.stringify(value) || '';
    return new Blob([str]).size;
  }

  async function savePreferences(inventory) {
    const prefs = {};
    inventory.forEach(item => {
      prefs[item.uid] = item.selected;
    });
    await chrome.storage.local.set({ [PREFS_KEY]: prefs });
  }

  async function loadPreferences() {
    const res = await chrome.storage.local.get(PREFS_KEY);
    return res[PREFS_KEY] || null;
  }

  async function scanAll() {
    const savedPrefs = await loadPreferences();
    const inventory = [];

    const isSelected = (uid, storageType) => {
      if (uid === `chrome_local::${PREFS_KEY}`) {
        return savedPrefs && uid in savedPrefs ? savedPrefs[uid] : false;
      }
      if (savedPrefs && uid in savedPrefs) {
        return savedPrefs[uid];
      }
      const typeConfig = STORAGE_TYPES.find(t => t.id === storageType);
      return typeConfig ? typeConfig.defaultSelected : true;
    };

    if (chrome?.storage?.local) {
      const localData = await chrome.storage.local.get(null);
      for (const [key, value] of Object.entries(localData)) {
        const uid = `chrome_local::${key}`;
        inventory.push({
          uid,
          storage: 'chrome_local',
          key,
          value,
          size: getByteSize(value),
          selected: isSelected(uid, 'chrome_local')
        });
      }
    }

    if (chrome?.storage?.sync) {
      const syncData = await chrome.storage.sync.get(null);
      for (const [key, value] of Object.entries(syncData)) {
        const uid = `chrome_sync::${key}`;
        inventory.push({
          uid,
          storage: 'chrome_sync',
          key,
          value,
          size: getByteSize(value),
          selected: isSelected(uid, 'chrome_sync')
        });
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const raw = localStorage.getItem(key);
      let parsed = raw;
      try { parsed = JSON.parse(raw); } catch (_) {}
      const uid = `local_storage::${key}`;
      inventory.push({
        uid,
        storage: 'local_storage',
        key,
        value: parsed,
        rawValue: raw,
        size: getByteSize(raw),
        selected: isSelected(uid, 'local_storage')
      });
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const raw = sessionStorage.getItem(key);
      let parsed = raw;
      try { parsed = JSON.parse(raw); } catch (_) {}
      const uid = `session_storage::${key}`;
      inventory.push({
        uid,
        storage: 'session_storage',
        key,
        value: parsed,
        rawValue: raw,
        size: getByteSize(raw),
        selected: isSelected(uid, 'session_storage')
      });
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        const entries = [];
        let totalCacheSize = 0;

        for (const req of requests) {
          const res = await cache.match(req);
          const text = res ? await res.text() : '';
          totalCacheSize += getByteSize(text);
          entries.push({ url: req.url, body: text });
        }

        const uid = `cache_api::${cacheName}`;
        inventory.push({
          uid,
          storage: 'cache_api',
          key: cacheName,
          value: entries,
          size: totalCacheSize,
          selected: isSelected(uid, 'cache_api')
        });
      }
    }

    return inventory;
  }

  async function buildBackupPayload(currentInventory = null) {
    const inventory = currentInventory || await scanAll();
    const selected = inventory.filter(i => i.selected);

    if (selected.length === 0) {
      throw new Error('Nenhum item está selecionado para backup. Verifique as opções em Gerenciar Backup.');
    }

    const backupPayload = {
      versaoBackup: "3.0",
      dataExportacao: new Date().toISOString(),
      meta: {
        extension: chrome.runtime?.getManifest?.().name || 'Extensão Processo Digital',
        version: chrome.runtime?.getManifest?.().version || '3.0',
        exportedAt: new Date().toISOString(),
        totalItems: selected.length
      },
      data: {
        chrome_local: {},
        chrome_sync: {},
        local_storage: {},
        session_storage: {},
        cache_api: {}
      }
    };

    selected.forEach(item => {
      if (item.storage === 'local_storage' || item.storage === 'session_storage') {
        backupPayload.data[item.storage][item.key] = item.rawValue;
      } else {
        backupPayload.data[item.storage][item.key] = item.value;
      }
    });

    return { payload: backupPayload, count: selected.length };
  }

  async function exportBackup(currentInventory = null) {
    const { payload, count } = await buildBackupPayload(currentInventory);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gerenciador_processo_digital_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return count;
  }

  async function importFromFile(file) {
    const text = await file.text();
    const json = JSON.parse(text);

    const isLegacyFormat = !json.data && typeof json === 'object';
    const data = isLegacyFormat ? { chrome_local: json } : json.data;

    if (!data) {
      throw new Error('Formato de arquivo de backup inválido.');
    }

    const keysCount = Object.values(data).reduce((acc, obj) => acc + Object.keys(obj || {}).length, 0);
    const dateInfo = json.meta?.exportedAt ? ` gerado em ${new Date(json.meta.exportedAt).toLocaleString('pt-BR')}` : '';

    if (!confirm(`Deseja restaurar ${keysCount} registros do backup${dateInfo}? Isso sobrescreverá os dados atuais correspondentes.`)) {
      return { canceled: true };
    }

    if (data.chrome_local && Object.keys(data.chrome_local).length > 0) {
      await chrome.storage.local.set(data.chrome_local);
    }

    if (data.chrome_sync && Object.keys(data.chrome_sync).length > 0) {
      await chrome.storage.sync.set(data.chrome_sync);
    }

    if (data.local_storage) {
      for (const [k, v] of Object.entries(data.local_storage)) {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
    }

    if (data.session_storage) {
      for (const [k, v] of Object.entries(data.session_storage)) {
        sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
    }

    if (data.cache_api && 'caches' in window) {
      for (const [cacheName, entries] of Object.entries(data.cache_api)) {
        const cache = await caches.open(cacheName);
        for (const entry of entries) {
          await cache.put(entry.url, new Response(entry.body));
        }
      }
    }

    return { canceled: false, count: keysCount };
  }

  return {
    STORAGE_TYPES,
    scanAll,
    savePreferences,
    buildBackupPayload,
    exportBackup,
    importFromFile
  };
})();