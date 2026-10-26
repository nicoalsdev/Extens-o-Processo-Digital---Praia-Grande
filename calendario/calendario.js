(() => {
  "use strict";

  const STORAGE_KEY = "gpd_calendario_eventos_v1";
  const HOLIDAY_CACHE_KEY = "gpd_calendario_feriados_cache_v1";
  const MUNICIPAL_KEY = "gpd_calendario_feriados_municipais_v1";
  const API_BASE = "https://brasilapi.com.br/api/feriados/v1/";
  const $ = (selector) => document.querySelector(selector);
  const calendarEl = $("#calendar");
  const state = {
    date: startOfDay(new Date()),
    view: "month",
    selectedDate: dateKey(new Date()),
    filter: "todas",
    events: [],
    holidayCache: {},
    municipalEvents: []
  };
  const weekdayShort = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const monthLong = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
  const dateLong = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dateShort = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function parseDate(key) {
    const [y,m,d] = String(key).split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function addDays(d, n) { const out = new Date(d); out.setDate(out.getDate()+n); return out; }
  function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth()+n, Math.min(d.getDate(), new Date(d.getFullYear(), d.getMonth()+n+1, 0).getDate())); }
  function sameDay(a,b) { return dateKey(a) === dateKey(b); }
  function uid() { return `evt-${Date.now()}-${Math.random().toString(36).slice(2,9)}`; }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function categoryLabel(cat) {
    return ({
      pessoal: "Pessoal", trabalho: "Trabalho", lembrete: "Lembrete",
      feriado: "Feriado", ponto_facultativo: "Ponto facultativo", falta_abonada: "Falta Abonada",
      licenca_medica: "Licença Médica", licenca_premio: "Licença Prêmio", outras_licencas: "Outras Licenças", ferias: "Férias"
    })[cat] || "Evento";
  }

  function eventColor(evt) {
    return ({
      pessoal: "#34a853", 
      trabalho: "#1a73e8", 
      lembrete: "#f9ab00",
      feriado: "#d93025", 
      ponto_facultativo: "#9334e6", 
      falta_abonada: "#2e7d32", 
      licenca_medica: "#e53935", 
      licenca_premio: "#8e24aa", 
      outras_licencas: "#fb8c00", 
      ferias: "#00acc1"
    })[evt.category] || "#1a73e8";
  }

  function eventClass(evt) { return `cat-${evt.category || "trabalho"}`; }

  function isAllDay(evt) { return evt.allDay !== false; }

  function eventDateLabel(evt) {
    if (evt.endDate && evt.endDate !== evt.date) {
      return `${dateShort.format(parseDate(evt.date))} até ${dateShort.format(parseDate(evt.endDate))}`;
    }
    if (isAllDay(evt)) return "Dia inteiro";
    return `${evt.startTime || "09:00"}${evt.endTime ? " – " + evt.endTime : ""}`;
  }

  function sortedEvents(events) {
    return [...events].sort((a,b) => (a.date || "").localeCompare(b.date || "") ||
      (a.startTime || "00:00").localeCompare(b.startTime || "00:00") ||
      String(a.title).localeCompare(String(b.title), "pt-BR"));
  }
  function visibleEvents() {
    return sortedEvents(state.events.filter(e => state.filter === "todas" || e.category === state.filter));
  }
  async function storageGet(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  }
  async function storageSet(values) {
    return new Promise((resolve, reject) => chrome.storage.local.set(values, () => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message)); else resolve();
    }));
  }
  async function loadData() {
    // Removemos o MUNICIPAL_KEY do get para não puxar o cache antigo
    const data = await storageGet([STORAGE_KEY, HOLIDAY_CACHE_KEY]);
    state.events = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    state.holidayCache = data[HOLIDAY_CACHE_KEY] || {};
    
    // Força o carregamento da lista atualizada direto do código
    state.municipalEvents = getBundledMunicipalEvents();
    await storageSet({[MUNICIPAL_KEY]: state.municipalEvents});
    
    const years = new Set([state.date.getFullYear(), new Date().getFullYear()]);
    for (const y of years) await loadApiHolidays(y, false);
      mergeHolidayEvents();
    render();
  }
  function getBundledMunicipalEvents() {
    const source = "https://www2.praiagrande.sp.gov.br/";
    return [
      // Feriados Estaduais (São Paulo) - Garantia caso a BrasilAPI falhe
      {date:"2026-07-09",title:"Revolução Constitucionalista",category:"feriado",source:"https://www.al.sp.gov.br/",sourceLabel:"Feriado Estadual SP",sourceType:"municipal"},
      {date:"2027-07-09",title:"Revolução Constitucionalista",category:"feriado",source:"https://www.al.sp.gov.br/",sourceLabel:"Feriado Estadual SP",sourceType:"municipal"},

      // Pontos Facultativos - 2026
      {date:"2026-01-02",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},
      {date:"2026-01-19",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},
      {date:"2026-02-16",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},
      {date:"2026-02-17",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},
      {date:"2026-02-18",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},
      {date:"2026-04-02",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},
      {date:"2026-04-20",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},
      {date:"2026-06-05",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},
      {date:"2026-07-10",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},
      {date:"2026-10-30",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},
      {date:"2026-12-24",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},
      {date:"2026-12-31",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2026"},

      // Pontos Facultativos - 2027[cite: 3]
      {date:"2027-01-18",title:"Ponto facultativo — Emancipação Político-Administrativa",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2027"},
      {date:"2027-02-08",title:"Carnaval — ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Carnaval 2027"},
      {date:"2027-02-09",title:"Carnaval — ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Carnaval 2027"},
      {date:"2027-02-10",title:"Quarta-feira de Cinzas — ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Carnaval 2027"},
      {date:"2027-03-25",title:"Ponto facultativo — Quinta-feira Santa",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Semana Santa 2027"},
      {date:"2027-05-28",title:"Ponto facultativo após Corpus Christi",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Corpus Christi 2027"},
      {date:"2027-06-28",title:"Ponto facultativo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Ponto Facultativo 2027"},
      {date:"2027-09-06",title:"Ponto facultativo — Independência do Brasil",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Independência do Brasil 2027"},
      {date:"2027-10-11",title:"Ponto facultativo — Nossa Senhora Aparecida",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Nossa Senhora Aparecida 2027"},
      {date:"2027-10-29",title:"Ponto facultativo — Dia do Servidor Público",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Dia do Servidor Público 2027"},
      {date:"2027-11-01",title:"Ponto facultativo — Finados",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Finados 2027"},
      {date:"2027-12-24",title:"Ponto facultativo — Véspera de Natal",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Véspera de Natal 2027"},
      {date:"2027-12-31",title:"Ponto facultativo — Véspera de Ano Novo",category:"ponto_facultativo",source,sourceLabel:"Prefeitura de Praia Grande — Véspera de Ano Novo 2027"}
    ].map((e, i) => ({...e, id:`municipal-${e.date}-${i}`, allDay:true, readOnly:true, sourceType:"municipal"}));
  }
  async function loadApiHolidays(year, notify = true) {
    try {
      const response = await fetch(`${API_BASE}${year}?uf=SP`, { cache:"no-store" });
      if (!response.ok) throw new Error(`BrasilAPI respondeu HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error("Formato inesperado retornado pela BrasilAPI.");
      state.holidayCache[String(year)] = payload.map((h, i) => ({
        id:`brasilapi-${year}-${h.date}-${i}`,
        date:h.date,
        title:h.name,
        category: h.type === "state" ? "feriado" : "feriado",
        allDay:true, readOnly:true, sourceType:"api",
        source:"https://brasilapi.com.br/docs",
        sourceLabel: h.type === "state" ? "BrasilAPI — feriado estadual/SP" : "BrasilAPI — feriado nacional"
      }));
      await storageSet({[HOLIDAY_CACHE_KEY]:state.holidayCache});
      if (notify) setHolidayStatus(`Feriados de ${year} atualizados pela BrasilAPI.`);
      return true;
    } catch (error) {
      console.warn("[Calendário] Não foi possível atualizar feriados da API:", error);
      if (notify) setHolidayStatus(`Falha ao atualizar a API. Exibindo dados salvos quando disponíveis.`);
      return false;
    }
  }
  function mergeHolidayEvents() {
    const apiEvents = Object.values(state.holidayCache).flat();
    const municipal = state.municipalEvents || [];
    const holidays = [...apiEvents, ...municipal];
    const userEvents = state.events.filter(e => !e.readOnly);
    // Preserve personal events; don't persist API-derived events into user event array.
    state.events = [...userEvents, ...holidays];
    const years = Object.keys(state.holidayCache).sort().join(", ");
    setHolidayStatus(years ? `Feriados API em cache: ${years}. Datas municipais locais: ${municipal.length}.` : "Sem cache de feriados; tente atualizar.");
  }
  function setHolidayStatus(text) { $("#statusFeriados").textContent = text; }
  async function saveUserEvents() {
    const users = state.events.filter(e => !e.readOnly);
    await storageSet({[STORAGE_KEY]:users});
  }
  
  function dateEvents(key) { 
    return visibleEvents().filter(e => {
      if (!e.endDate) return e.date === key;
      return key >= e.date && key <= e.endDate;
    }); 
  }

  function render() {
    $("#periodoAtual").textContent = state.view === "day" ? dateLong.format(state.date) :
    state.view === "week" ? `${dateShort.format(startOfWeek(state.date))} – ${dateShort.format(addDays(startOfWeek(state.date),6))}` :
    state.view === "list" ? monthLong.format(state.date) : monthLong.format(state.date);
    document.querySelectorAll(".view-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.view === state.view));
    
    if (state.view === "month") renderMonth();
    else if (state.view === "week") renderTimeGrid(false);
    else if (state.view === "day") renderTimeGrid(true);
    else renderList();
    
    renderMiniCalendar();
    renderUpcoming();
    renderFaltasAbonadas(); // A contagem é atualizada aqui
  }
  function startOfWeek(d) { const out = startOfDay(d); out.setDate(out.getDate() - out.getDay()); return out; }
  function renderMonth() {
    const first = new Date(state.date.getFullYear(), state.date.getMonth(), 1);
    const gridStart = startOfWeek(first);
    let html = weekdayShort.map(d => `<div class="weekday-heading">${d.toUpperCase()}</div>`).join("");
    for (let i=0; i<42; i++) {
      const day = addDays(gridStart, i), key = dateKey(day), events = dateEvents(key);
      const classes = ["day-cell", day.getMonth() !== state.date.getMonth() ? "outside-month" : "",
        sameDay(day, new Date()) ? "is-today" : "", key === state.selectedDate ? "selected-day" : ""].filter(Boolean).join(" ");
        const chips = events.slice(0,3).map(e => `<button class="event-chip ${eventClass(e)}" data-event="${escapeHtml(e.id)}" title="${escapeHtml(e.title)}">${!isAllDay(e) && e.startTime ? escapeHtml(e.startTime)+" " : ""}${escapeHtml(e.title)}</button>`).join("");
        const more = events.length > 3 ? `<div class="more-events" data-date="${key}">+${events.length-3} mais</div>` : "";
        html += `<div class="${classes}" data-date="${key}" role="button" tabindex="0" aria-label="${escapeHtml(dateLong.format(day))}">
        <div class="day-number">${day.getDate()}</div><div class="day-events">${chips}${more}</div></div>`;
      }
      calendarEl.className = "calendar-grid";
      calendarEl.innerHTML = html;
    }
    function renderTimeGrid(dayOnly) {
      const days = dayOnly ? [state.date] : Array.from({length:7},(_,i)=>addDays(startOfWeek(state.date),i));
      let html = `<div class="${dayOnly ? "day-grid" : "week-grid"}"><div class="time-label"></div>`;
      for (const day of days) html += `<div class="time-day-header ${sameDay(day,new Date())?"today":""}">${weekdayShort[day.getDay()]}<strong>${day.getDate()}</strong></div>`;
        for (let hour=0; hour<24; hour++) {
          html += `<div class="time-label">${String(hour).padStart(2,"0")}:00</div>`;
          for (const day of days) {
            const key = dateKey(day);
            html += `<div class="time-day" data-date="${key}" style="height:54px"><div class="time-slot"></div>`;
            if (hour === 0) {
              const allDay = dateEvents(key).filter(isAllDay);
              if (allDay.length) html += `<div class="timed-event" style="top:2px;height:46px" data-event="${escapeHtml(allDay[0].id)}">${escapeHtml(allDay[0].title)}</div>`;
            }
            const timed = dateEvents(key).filter(e => !isAllDay(e) && Number((e.startTime||"00:00").slice(0,2)) === hour);
            for (const e of timed) {
              const min = Number((e.startTime||"00:00").slice(3,5));
              const endHour = Number((e.endTime||`${String(hour+1).padStart(2,"0")}:00`).slice(0,2));
              const endMin = Number((e.endTime||`${String(hour+1).padStart(2,"0")}:00`).slice(3,5));
              const duration = Math.max(20, (endHour*60+endMin) - (hour*60+min));
              html += `<div class="timed-event ${eventClass(e)}" data-event="${escapeHtml(e.id)}" style="top:${min/60*54+2}px;height:${Math.max(22,duration/60*54-3)}px">${escapeHtml(e.startTime||"")} ${escapeHtml(e.title)}</div>`;
            }
            html += `</div>`;
          }
        }
        html += "</div>";
        calendarEl.className = "calendar-main";
        calendarEl.innerHTML = html;
      }
      function renderList() {
        const start = new Date(state.date.getFullYear(), state.date.getMonth(), 1);
        const end = new Date(state.date.getFullYear(), state.date.getMonth()+1, 0);
        const events = visibleEvents().filter(e => e.date >= dateKey(start) && e.date <= dateKey(end));
        if (!events.length) {
          calendarEl.className = "calendar-main list-view";
          calendarEl.innerHTML = `<div class="empty-state">Nenhum evento neste mês. Clique em uma data ou em “Criar”.</div>`;
          return;
        }
        let html = "";
        let last = "";
        for (const e of events) {
          if (last !== e.date) {
            html += `<div class="list-date-heading">${escapeHtml(dateLong.format(parseDate(e.date)))}</div>`;
            last = e.date;
          }
          html += `<div class="list-event" data-event="${escapeHtml(e.id)}"><div class="list-color" style="background:${eventColor(e)}"></div><div><div class="list-event-title">${escapeHtml(e.title)}</div><div class="list-event-meta">${escapeHtml(eventDateLabel(e))} · ${escapeHtml(categoryLabel(e.category))}</div>${e.description?`<div class="small mt-1">${escapeHtml(e.description)}</div>`:""}${e.source?`<div class="small"><a href="${escapeHtml(e.source)}" target="_blank" rel="noopener noreferrer">Fonte: ${escapeHtml(e.sourceLabel||"consultar")}</a></div>`:""}</div></div>`;
        }
        calendarEl.className = "calendar-main list-view";
        calendarEl.innerHTML = html;
      }
      function renderMiniCalendar() {
        const first = new Date(state.date.getFullYear(), state.date.getMonth(), 1);
        const gridStart = startOfWeek(first);
        let html = `<div class="mini-title"><strong>${escapeHtml(monthLong.format(state.date))}</strong><div class="btn-group btn-group-sm"><button class="btn btn-light" id="miniPrev" aria-label="Mês anterior">‹</button><button class="btn btn-light" id="miniNext" aria-label="Próximo mês">›</button></div></div><div class="mini-grid">`;
        for (const d of weekdayShort) html += `<div class="mini-weekday">${d[0]}</div>`;
          for (let i=0;i<42;i++) {
            const d=addDays(gridStart,i), key=dateKey(d);
            html += `<button class="mini-day ${d.getMonth()!==state.date.getMonth()?"mini-outside":""} ${sameDay(d,new Date())?"mini-today":""} ${key===state.selectedDate?"mini-selected":""}" data-mini-date="${key}">${d.getDate()}</button>`;
          }
          html += "</div>";
          $("#miniCalendar").innerHTML = html;
        }
        function renderUpcoming() {
          const todayKey = dateKey(new Date());
          const events = visibleEvents().filter(e => (e.endDate || e.date) >= todayKey).slice(0,7);
          $("#proximosEventos").innerHTML = events.length ? events.map(e => {
            const d = parseDate(e.date);
            return `<div class="upcoming-item" data-event="${escapeHtml(e.id)}"><div class="upcoming-date" style="margin-right: 15px;">${d.getDate()}/${new Intl.DateTimeFormat("pt-BR",{month:"short"}).format(d).replace(".","")}</div><div><div class="upcoming-name">${escapeHtml(e.title)}</div><div class="upcoming-meta">${escapeHtml(categoryLabel(e.category))}${!isAllDay(e)?" · "+escapeHtml(eventDateLabel(e)):""}</div></div></div>`;
          }).join("") : `<div class="small text-secondary">Nenhum evento futuro.</div>`;
        }
        function openSwal(options) {
          if (window.Swal && typeof Swal.fire === "function") {
      // Adiciona scrollbarPadding: false em todas as chamadas do SweetAlert
            return Swal.fire({ ...options, scrollbarPadding: false, heightAuto: false });
          }
          alert(options.text || options.title || "Ação indisponível");
          return Promise.resolve({isConfirmed:false});
        }
        async function createOrEditEvent(existing = null, date = state.selectedDate) {
          if (existing && existing.readOnly) {
            const sourceHtml = existing.source ? `<p class="small"><a href="${escapeHtml(existing.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(existing.sourceLabel || "Consultar fonte oficial")}</a></p>` : "";
            await openSwal({title:existing.title, html:`<p>${escapeHtml(dateLong.format(parseDate(existing.date)))}</p><p>${escapeHtml(categoryLabel(existing.category))}</p>${sourceHtml}`, confirmButtonText:"Fechar", showCancelButton:false});
            return;
          }
          const e = existing || {};
          const result = await openSwal({
            title: existing ? "Editar evento" : "Novo evento",
            confirmButtonText: existing ? "Salvar alterações" : "Salvar evento",
            cancelButtonText: "Cancelar",
            showCancelButton: true,
            focusConfirm: false,
            html: `
        <div class="text-start">
          <label class="form-label" for="swal-event-title">Título *</label>
          <input id="swal-event-title" class="form-control mb-3" maxlength="140" value="${escapeHtml(e.title||"")}" placeholder="Ex.: Reunião de equipe">
              
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label" for="swal-event-date">Data (Início) *</label>
              <input id="swal-event-date" type="date" class="form-control" value="${escapeHtml(e.date||date)}">
            </div>
            <div class="col-6">
              <label class="form-label" for="swal-event-end-date">Data Fim (Período)</label>
              <input id="swal-event-end-date" type="date" class="form-control" value="${escapeHtml(e.endDate||"")}">
            </div>
          </div>

          <label class="form-label" for="swal-event-category">Categoria</label>
          <select id="swal-event-category" class="form-select mb-3">
              ${["pessoal","trabalho","lembrete","falta_abonada","licenca_medica","licenca_premio","outras_licencas","ferias"].map(c=>`<option value="${c}" ${(e.category||"trabalho")===c?"selected":""}>${categoryLabel(c)}</option>`).join("")}
          </select>
          <div class="form-check mb-3"><input id="swal-event-allday" type="checkbox" class="form-check-input" ${isAllDay(e)?"checked":""}><label class="form-check-label" for="swal-event-allday">Dia inteiro</label></div>
          <div class="row g-2 mb-3" id="swal-times">
            <div class="col-6"><label class="form-label" for="swal-event-start">Início</label><input id="swal-event-start" type="time" class="form-control" value="${escapeHtml(e.startTime||"09:00")}"></div>
            <div class="col-6"><label class="form-label" for="swal-event-end">Fim</label><input id="swal-event-end" type="time" class="form-control" value="${escapeHtml(e.endTime||"10:00")}"></div>
          </div>
          <label class="form-label" for="swal-event-description">Descrição (opcional)</label>
          <textarea id="swal-event-description" class="form-control" rows="3" maxlength="2000" placeholder="Detalhes do compromisso">${escapeHtml(e.description||"")}</textarea>
              </div>`,
              didOpen: () => {
                const cb = $("#swal-event-allday"), times = $("#swal-times");
                const toggle = () => { times.style.display = cb.checked ? "none" : "flex"; };
                cb.addEventListener("change",toggle); toggle();
              },
              preConfirm: () => {
                let title = $("#swal-event-title").value.trim();
                const eventDate = $("#swal-event-date").value;
                const endDate = $("#swal-event-end-date").value;
                const category = $("#swal-event-category").value;
                const allDay = $("#swal-event-allday").checked;
                const startTime = $("#swal-event-start").value;
                const endTime = $("#swal-event-end").value;

                const autoTitles = {
                  "falta_abonada": "Falta Abonada",
                  "licenca_medica": "Licença Médica",
                  "licenca_premio": "Licença Prêmio",
                  "outras_licencas": "Outras Licenças",
                  "ferias": "Férias"
                };

                if (autoTitles[category] && !title) {
                  title = autoTitles[category];
                }

                if (!title) { Swal.showValidationMessage("Informe o título do evento."); return false; }
                if (!eventDate) { Swal.showValidationMessage("Informe a data."); return false; }
                if (endDate && endDate < eventDate) { Swal.showValidationMessage("A data final não pode ser anterior à data de início."); return false; }
                
                if (!allDay && (!startTime || !endTime || endTime <= startTime)) {
                  Swal.showValidationMessage("Informe horários válidos; o fim deve ser posterior ao início."); return false;
                }

                if (category === "falta_abonada") {
                  const selectedYear = eventDate.split("-")[0];
                  const selectedMonth = eventDate.split("-")[1];
                  const faltasAno = state.events.filter(evt => evt.category === "falta_abonada" && evt.date.startsWith(selectedYear) && evt.id !== (e ? e.id : null));
                  
                  if (faltasAno.length >= 6) {
                    Swal.showValidationMessage("Limite de 6 faltas abonadas por ano atingido."); return false;
                  }
                  if (faltasAno.some(evt => evt.date.split("-")[1] === selectedMonth)) {
                    Swal.showValidationMessage("Apenas 1 falta abonada permitida por mês."); return false;
                  }
                }

                return {title, date:eventDate, endDate, category, allDay, startTime:allDay?"":startTime, endTime:allDay?"":endTime, description:$("#swal-event-description").value.trim()};
              }
            });
if (!result.isConfirmed || !result.value) return;
const payload = {...result.value, id:e.id||uid(), createdAt:e.createdAt||new Date().toISOString(), updatedAt:new Date().toISOString(), readOnly:false};
if (existing) state.events = state.events.map(item => item.id === existing.id ? payload : item);
else state.events.push(payload);
state.selectedDate = payload.date;
state.date = parseDate(payload.date);
await saveUserEvents();
render();
}
function gerarLinkGoogleAgenda(e) {
  const title = encodeURIComponent(e.title || "");
  const desc = encodeURIComponent(e.description || "");
  const dateStr = String(e.date || "").replace(/-/g, "");
  let dates = `${dateStr}/${dateStr}`;

  if (!isAllDay(e) && e.startTime && e.endTime) {
    const startStr = dateStr + "T" + e.startTime.replace(/:/g, "") + "00";
    const endStr = dateStr + "T" + e.endTime.replace(/:/g, "") + "00";
    dates = `${startStr}/${endStr}`;
  }
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${desc}&dates=${dates}`;
}

async function eventActions(id) {
  const e = state.events.find(item=>item.id===id);
  if (!e) return;
  if (e.readOnly) return createOrEditEvent(e);

    // Injetamos o link gerado diretamente no 'href' do botão
  const conteudoHtml = `
      <div class="mb-3">${dateLong.format(parseDate(e.date))} · ${eventDateLabel(e)} · ${categoryLabel(e.category)}</div>
      <div class="border-top pt-3">
        <a href="${gerarLinkGoogleAgenda(e)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm w-100" style="text-decoration: none;">
          📅 Adicionar ao Google Agenda
        </a>
      </div>
  `;

  const result = await openSwal({
    title: e.title, 
    html: conteudoHtml,
    showCancelButton: true, showDenyButton: true,
    confirmButtonText: "Editar", denyButtonText: "Excluir", cancelButtonText: "Fechar"
  });

  if (result.isConfirmed) await createOrEditEvent(e);
  else if (result.isDenied) {
    const confirm = await openSwal({title:"Excluir este evento?", text:"Esta ação não pode ser desfeita.", icon:"warning", showCancelButton:true, confirmButtonText:"Excluir", cancelButtonText:"Cancelar", confirmButtonColor:"#d33"});
    if (confirm.isConfirmed) {
      state.events = state.events.filter(item=>item.id!==id);
      await saveUserEvents(); render();
    }
  }
}

async function ensureYearLoaded(year) {
  if (!Array.isArray(state.holidayCache[String(year)])) {
    await loadApiHolidays(year, false);
    mergeHolidayEvents();
  }
}
async function selectDate(key) {
  state.selectedDate = key;
  state.date = parseDate(key);
  await ensureYearLoaded(state.date.getFullYear());
  render();
}
async function movePeriod(direction) {
  if (state.view === "month" || state.view === "list") state.date = addMonths(state.date,direction);
  else if (state.view === "week") state.date = addDays(state.date,direction*7);
  else state.date = addDays(state.date,direction);
  state.selectedDate = dateKey(state.date);
  await ensureYearLoaded(state.date.getFullYear());
  render();
}
function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function exportData() {
  const data = await storageGet([STORAGE_KEY,MUNICIPAL_KEY]);
  downloadJson(`calendario-gpd-${dateKey(new Date())}.json`, {
    schemaVersion:1, exportedAt:new Date().toISOString(),
    events:Array.isArray(data[STORAGE_KEY])?data[STORAGE_KEY]:[],
    municipalEvents:Array.isArray(data[MUNICIPAL_KEY])?data[MUNICIPAL_KEY]:[]
  });
}
async function importData(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || !Array.isArray(parsed.events)) throw new Error("O arquivo não contém uma lista 'events' válida.");
    const valid = parsed.events.filter(e => e && typeof e.title==="string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && !e.readOnly)
    .map(e=>({...e,id:typeof e.id==="string"?e.id:uid(),readOnly:false}));
    const result = await openSwal({title:"Importar eventos?",text:`Serão importados ${valid.length} evento(s). Os eventos existentes serão mantidos e possíveis IDs duplicados serão substituídos.`,icon:"question",showCancelButton:true,confirmButtonText:"Importar",cancelButtonText:"Cancelar"});
    if (!result.isConfirmed) return;
    const map = new Map(state.events.filter(e=>!e.readOnly).map(e=>[e.id,e]));
    valid.forEach(e=>map.set(e.id,e));
    state.events = [...map.values(), ...state.events.filter(e=>e.readOnly)];
    await saveUserEvents();
    if (Array.isArray(parsed.municipalEvents)) {
      const municipal = parsed.municipalEvents.filter(e=>e && e.sourceType==="municipal" && /^\d{4}-\d{2}-\d{2}$/.test(e.date));
      state.municipalEvents = municipal;
      await storageSet({[MUNICIPAL_KEY]:municipal});
      mergeHolidayEvents();
    }
    render();
    await openSwal({title:"Importação concluída",text:`${valid.length} evento(s) processado(s).`,icon:"success"});
  } catch(error) {
    await openSwal({title:"Não foi possível importar",text:error.message,icon:"error"});
  } finally { $("#arquivoImportacao").value=""; }
}
function bindEvents() {
  $("#btnHoje").addEventListener("click",()=>{state.date=startOfDay(new Date());state.selectedDate=dateKey(state.date);ensureYearLoaded(state.date.getFullYear()).then(render);});
  $("#btnAnterior").addEventListener("click",()=>movePeriod(-1));
  $("#btnProximo").addEventListener("click",()=>movePeriod(1));
  $("#btnNovoEvento").addEventListener("click",()=>createOrEditEvent(null,state.selectedDate));
  $("#filtroCategoria").addEventListener("change",e=>{state.filter=e.target.value;render();});
  document.querySelectorAll(".view-btn").forEach(btn=>btn.addEventListener("click",()=>{state.view=btn.dataset.view;render();}));
  $("#btnAtualizarFeriados").addEventListener("click",async()=>{
    $("#btnAtualizarFeriados").disabled=true; setHolidayStatus("Consultando BrasilAPI…");
    const year=state.date.getFullYear();
    const ok=await loadApiHolidays(year,true);
    if (ok) { mergeHolidayEvents(); render(); }
    $("#btnAtualizarFeriados").disabled=false;
  });
  $("#btnExportar").addEventListener("click",exportData);
  $("#btnImportar").addEventListener("click",()=>$("#arquivoImportacao").click());
  $("#arquivoImportacao").addEventListener("change",e=>{const file=e.target.files && e.target.files[0];if(file)importData(file);});
  calendarEl.addEventListener("click",e=>{
    const eventEl=e.target.closest("[data-event]");
    if (eventEl) { e.stopPropagation(); eventActions(eventEl.dataset.event); return; }
    const more=e.target.closest("[data-date]");
    if (more && e.target.closest(".more-events")) { selectDate(more.dataset.date).then(()=>{state.view="day";render();});return; }
    const cell=e.target.closest(".day-cell");
    if (cell) {
      const key=cell.dataset.date;
      if (key===state.selectedDate) createOrEditEvent(null,key);
      else selectDate(key);
      return;
    }
    const timeCell=e.target.closest(".time-day[data-date]");
    if (timeCell) {
      const key=timeCell.dataset.date;
      state.selectedDate=key;
      state.date=parseDate(key);
      createOrEditEvent(null,key);
    }
  });
  calendarEl.addEventListener("dblclick",e=>{
    const cell=e.target.closest(".day-cell"); if(cell) createOrEditEvent(null,cell.dataset.date);
  });
  calendarEl.addEventListener("keydown",e=>{
    const cell=e.target.closest(".day-cell");
    if(cell && (e.key==="Enter" || e.key===" ")) { e.preventDefault(); selectDate(cell.dataset.date); }
  });
  $("#miniCalendar").addEventListener("click",e=>{
    if(e.target.id==="miniPrev"){state.date=addMonths(state.date,-1);ensureYearLoaded(state.date.getFullYear()).then(render);return;}
    if(e.target.id==="miniNext"){state.date=addMonths(state.date,1);ensureYearLoaded(state.date.getFullYear()).then(render);return;}
    const btn=e.target.closest("[data-mini-date]");if(btn)selectDate(btn.dataset.miniDate);
  });
  $("#proximosEventos").addEventListener("click",e=>{
    const item=e.target.closest("[data-event]");if(item)eventActions(item.dataset.event);
  });
}


async function exportData() {
  const data = await storageGet([STORAGE_KEY]);
  const eventos = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];

  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Sua Extensão//Gerenciador Processo Digital//PT\n";

  eventos.forEach(e => {
    if (e.readOnly) return; // Ignora feriados da API
    
    const dataLimpa = e.date.replace(/-/g, "");
    
    icsContent += "BEGIN:VEVENT\n";
    icsContent += `UID:${e.id}@suaextensao.com\n`;
    icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
    icsContent += `DTSTART;VALUE=DATE:${dataLimpa}\n`;
    icsContent += `SUMMARY:${e.title}\n`;
    if (e.description) icsContent += `DESCRIPTION:${e.description}\n`;
    icsContent += "END:VEVENT\n";
  });

  icsContent += "END:VCALENDAR";

  const blob = new Blob([icsContent], {type: "text/calendar"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); 
  a.href = url; 
  a.download = `agenda-gpd-${dateKey(new Date())}.ics`; 
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderFaltasAbonadas() {
  const currentYear = String(state.date.getFullYear());
  const faltas = sortedEvents(state.events.filter(e => e.category === "falta_abonada" && e.date.startsWith(currentYear)));

  const elContagem = $("#contagemFaltas");
  const elLista = $("#listaFaltasAbonadas");

  if (elContagem) elContagem.textContent = faltas.length;
  if (elLista) {
    elLista.innerHTML = faltas.length ? faltas.map(f => `<div>• ${dateShort.format(parseDate(f.date))}</div>`).join("") : "Nenhuma falta no ano.";
  }
}


async function initialize() {
  if (!globalThis.chrome || !chrome.storage || !chrome.storage.local) {
    calendarEl.innerHTML = `<div class="empty-state">Esta página precisa ser aberta como parte da extensão Chrome.</div>`;
    return;
  }

    // Atualiza o logo (ícone) com o número do dia de hoje
  const logoEl = $(".calendar-logo");
  if (logoEl) logoEl.textContent = new Date().getDate();

  bindEvents();
  try { await loadData(); }
  catch(error) {
    console.error("[Calendário] Erro ao carregar:",error);
    setHolidayStatus("Erro ao carregar os dados locais.");
    render();
  }
}
initialize();
})();