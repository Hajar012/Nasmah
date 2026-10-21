'use strict';

const STORAGE_KEY = 'nasmah-progress-v1';
const COMPANIES_URL = '/api/companies';
const SUGGEST_URL = '/api/suggest';

const state = {
    companies: [],
    progress: loadProgress(),
    loaded: false,
};

const UI = {};

function init() {
    UI.companyList = document.getElementById('company-list');
    UI.searchInput = document.getElementById('search-input');
    UI.sectorFilter = document.getElementById('sector-filter');
    UI.statusFilter = document.getElementById('status-filter');
    UI.appliedCount = document.getElementById('applied-count');
    UI.totalCount = document.getElementById('total-count');
    UI.progressBar = document.getElementById('progress-bar');
    UI.exportButton = document.getElementById('export-progress');
    UI.importButton = document.getElementById('import-progress');
    UI.importInput = document.getElementById('import-progress-input');
    UI.progressFeedback = document.getElementById('progress-feedback');
    UI.suggestionForm = document.getElementById('suggestion-form');
    UI.suggestionFeedback = document.getElementById('suggestion-feedback');
    UI.suggestCompanyName = document.getElementById('suggest-company-name');
    UI.suggestCareerUrl = document.getElementById('suggest-career-url');
    UI.suggestSector = document.getElementById('suggest-sector');
    UI.suggestNotes = document.getElementById('suggest-notes');

    if (!UI.companyList) {
        return;
    }

    UI.searchInput?.addEventListener('input', renderCompanies);
    UI.sectorFilter?.addEventListener('change', renderCompanies);
    UI.statusFilter?.addEventListener('change', renderCompanies);
    UI.exportButton?.addEventListener('click', exportProgress);
    UI.importButton?.addEventListener('click', () => UI.importInput?.click());
    UI.importInput?.addEventListener('change', importProgress);
    UI.suggestionForm?.addEventListener('submit', submitSuggestion);
    window.addEventListener('storage', handleStorageChange);

    updateProgress();
    loadCompanies();
}

function loadProgress() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {};
        }
        return normalizeProgress(JSON.parse(raw));
    } catch (error) {
        return {};
    }
}

function normalizeProgress(data) {
    const progress = {};

    if (Array.isArray(data)) {
        data.forEach((id) => addProgressId(progress, id));
        return progress;
    }

    if (data && typeof data === 'object') {
        const hasAppliedList = Array.isArray(data.applied);
        const ids = hasAppliedList ? data.applied : Object.keys(data);
        ids.forEach((id) => {
            if (hasAppliedList || data[id] === true) {
                addProgressId(progress, id);
            }
        });
    }

    return progress;
}

function addProgressId(progress, id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        return;
    }
    const value = String(id).trim();
    if (value) {
        progress[value] = true;
    }
}

function saveProgress() {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch (error) {
        showProgressFeedback('Progress could not be saved in this browser.', 'error');
    }
}

function isApplied(companyId) {
    return state.progress[String(companyId)] === true;
}

function handleStorageChange(event) {
    if (event.key !== STORAGE_KEY) {
        return;
    }
    state.progress = loadProgress();
    renderCompanies();
    updateProgress();
}

async function loadCompanies() {
    state.loaded = false;
    setListMessage('Loading companies...');

    try {
        const response = await fetch(COMPANIES_URL, {
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Unexpected response format');
        }

        state.companies = data;
        state.loaded = true;
        populateSectors();
        renderCompanies();
        updateProgress();
    } catch (error) {
        console.error('Unable to load companies:', error);
        setListMessage('We could not load the company directory.', { retry: true });
    }
}

function populateSectors() {
    if (!UI.sectorFilter) {
        return;
    }

    const current = UI.sectorFilter.value;
    const sectors = [...new Set(
        state.companies
            .map((company) => String(company.sector || '').trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    const options = [new Option('All Sectors', 'all')];
    sectors.forEach((sector) => options.push(new Option(sector, sector)));
    UI.sectorFilter.replaceChildren(...options);

    if (sectors.includes(current)) {
        UI.sectorFilter.value = current;
    }
}

function renderCompanies() {
    if (!state.loaded || !UI.companyList) {
        return;
    }

    const filtered = getFilteredCompanies();
    if (!filtered.length) {
        setListMessage(
            state.companies.length
                ? 'No companies match your search or filters.'
                : 'No companies are available right now.'
        );
        return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach((company, index) => {
        fragment.appendChild(createCompanyRow(company, index));
    });
    UI.companyList.replaceChildren(fragment);
}

function getFilteredCompanies() {
    const query = normalizeText(UI.searchInput?.value);
    const sector = UI.sectorFilter?.value || 'all';
    const status = UI.statusFilter?.value || 'all';

    return state.companies.filter((company) => {
        const matchesQuery = !query
            || normalizeText(company.name_en).includes(query)
            || normalizeText(company.name_ar).includes(query);
        const matchesSector = sector === 'all' || company.sector === sector;

        let matchesStatus = true;
        if (status === 'applied') {
            matchesStatus = isApplied(company.id);
        } else if (status === 'not-applied') {
            matchesStatus = !isApplied(company.id);
        }

        return matchesQuery && matchesSector && matchesStatus;
    });
}

function normalizeText(value) {
    return String(value || '')
        .normalize('NFKC')
        .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
        .trim()
        .toLocaleLowerCase();
}

function createCompanyRow(company, index) {
    const applied = isApplied(company.id);
    const row = document.createElement('article');
    row.className = 'company-row flex flex-col gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6';
    row.dataset.companyId = company.id;
    row.classList.toggle('is-applied', applied);

    const main = document.createElement('div');
    main.className = 'flex min-w-0 items-start gap-3';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `company-checkbox-${index}`;
    checkbox.checked = applied;
    checkbox.className = 'mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500';
    checkbox.setAttribute('aria-label', `Mark ${company.name_en || 'this company'} as applied`);

    const details = document.createElement('div');
    details.className = 'min-w-0';

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.className = 'block cursor-pointer';

    const nameEn = document.createElement('span');
    nameEn.className = 'block break-words text-sm font-semibold text-slate-900';
    nameEn.textContent = company.name_en || 'Unnamed company';
    label.appendChild(nameEn);

    if (company.name_ar) {
        const nameAr = document.createElement('span');
        nameAr.className = 'mt-0.5 block break-words text-sm text-slate-500';
        nameAr.lang = 'ar';
        nameAr.dir = 'auto';
        nameAr.textContent = company.name_ar;
        label.appendChild(nameAr);
    }

    details.appendChild(label);

    const meta = document.createElement('div');
    meta.className = 'mt-2 flex flex-wrap items-center gap-2';

    const sector = document.createElement('span');
    sector.className = 'sector-badge';
    sector.textContent = company.sector || 'Uncategorized';
    meta.appendChild(sector);

    const status = document.createElement('span');
    updateStatusBadge(status, applied);
    meta.appendChild(status);

    if (company.location) {
        const location = document.createElement('span');
        location.className = 'text-xs font-medium text-slate-500';
        location.textContent = company.location;
        meta.appendChild(location);
    }

    details.appendChild(meta);
    main.append(checkbox, details);

    const actions = document.createElement('div');
    actions.className = 'flex shrink-0 flex-wrap items-center gap-2 pl-7 sm:pl-0';

    const careerUrl = safeUrl(company.career_url);
    if (careerUrl) {
        actions.appendChild(createCompanyLink('Careers', careerUrl, company.name_en, true));
    }

    const linkedinUrl = safeUrl(company.linkedin_url);
    if (linkedinUrl) {
        actions.appendChild(createCompanyLink('LinkedIn', linkedinUrl, company.name_en, false));
    }

    if (!actions.children.length) {
        const noLinks = document.createElement('span');
        noLinks.className = 'text-xs font-medium text-slate-400';
        noLinks.textContent = 'No links listed';
        actions.appendChild(noLinks);
    }

    row.append(main, actions);

    checkbox.addEventListener('change', () => {
        const id = String(company.id);
        if (checkbox.checked) {
            state.progress[id] = true;
        } else {
            delete state.progress[id];
        }

        saveProgress();
        updateStatusBadge(status, checkbox.checked);
        row.classList.toggle('is-applied', checkbox.checked);
        updateProgress();

        if (UI.statusFilter?.value !== 'all') {
            renderCompanies();
        }
    });

    return row;
}

function updateStatusBadge(element, applied) {
    element.className = `status-badge ${applied ? 'status-applied' : 'status-not-applied'}`;
    element.textContent = applied ? 'Applied' : 'Not Applied';
}

function createCompanyLink(label, url, companyName, primary) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = primary
        ? 'inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
        : 'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2';
    link.textContent = label;
    link.setAttribute('aria-label', `${label} for ${companyName || 'this company'} (opens in a new tab)`);
    return link;
}

function safeUrl(value) {
    if (!value) {
        return null;
    }
    try {
        const url = new URL(String(value), window.location.origin);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch (error) {
        return null;
    }
}

function setListMessage(message, options = {}) {
    if (!UI.companyList) {
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'p-8 text-center text-sm text-slate-500';
    wrapper.setAttribute('role', 'status');

    const text = document.createElement('p');
    text.textContent = message;
    wrapper.appendChild(text);

    if (options.retry) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mt-3 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2';
        button.textContent = 'Try again';
        button.addEventListener('click', loadCompanies);
        wrapper.appendChild(button);
    }

    UI.companyList.replaceChildren(wrapper);
}

function updateProgress() {
    if (!UI.companyList) {
        return;
    }

    const total = state.companies.length;
    const applied = state.companies.reduce(
        (count, company) => count + (isApplied(company.id) ? 1 : 0),
        0
    );

    if (UI.appliedCount) {
        UI.appliedCount.textContent = String(applied);
    }
    if (UI.totalCount) {
        UI.totalCount.textContent = String(total);
    }
    if (UI.progressBar) {
        const percentage = total ? Math.round((applied / total) * 100) : 0;
        UI.progressBar.style.width = `${percentage}%`;

        const track = UI.progressBar.parentElement;
        if (track) {
            track.setAttribute('aria-valuenow', String(percentage));
            track.setAttribute('aria-valuetext', `${applied} of ${total} companies applied`);
        }
    }
}

function exportProgress() {
    const applied = Object.keys(state.progress)
        .filter((id) => state.progress[id])
        .sort();
    const payload = {
        version: 1,
        exported_at: new Date().toISOString(),
        applied,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nasmah-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    showProgressFeedback(
        `Exported ${applied.length} applied ${applied.length === 1 ? 'company' : 'companies'}.`,
        'success'
    );
}

async function importProgress(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
        return;
    }

    try {
        const parsed = JSON.parse(await file.text());
        const imported = normalizeProgress(parsed);
        const count = Object.keys(imported).length;

        if (!count) {
            showProgressFeedback('No applied companies were found in that file.', 'error');
            return;
        }

        state.progress = imported;
        saveProgress();
        renderCompanies();
        updateProgress();
        showProgressFeedback(
            `Imported ${count} applied ${count === 1 ? 'company' : 'companies'} from the backup.`,
            'success'
        );
    } catch (error) {
        showProgressFeedback(
            'Could not import progress. Please choose a valid Nasmah JSON backup.',
            'error'
        );
    } finally {
        input.value = '';
    }
}

function showProgressFeedback(message, tone) {
    if (!UI.progressFeedback) {
        return;
    }
    UI.progressFeedback.hidden = false;
    UI.progressFeedback.textContent = message;
    UI.progressFeedback.className = `mt-2 text-xs ${tone === 'error' ? 'text-red-600' : 'text-emerald-700'}`;
}

async function submitSuggestion(event) {
    event.preventDefault();

    if (!UI.suggestionForm.checkValidity()) {
        UI.suggestionForm.reportValidity();
        return;
    }

    const companyName = UI.suggestCompanyName?.value.trim() || '';
    const rawCareerUrl = UI.suggestCareerUrl?.value.trim() || '';
    const sector = UI.suggestSector?.value.trim() || '';
    const notes = UI.suggestNotes?.value.trim() || '';
    const careerUrl = safeUrl(rawCareerUrl);

    if (!companyName || !sector || !careerUrl) {
        setSuggestionFeedback(
            'Please provide a company name, a valid careers URL, and a sector.',
            'error'
        );
        return;
    }

    const submitButton = UI.suggestionForm.querySelector('button[type="submit"]');
    const originalLabel = submitButton ? submitButton.textContent : '';

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
    }
    setSuggestionFeedback('', 'neutral');

    try {
        const response = await fetch(SUGGEST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                company_name: companyName,
                career_url: careerUrl,
                sector,
                notes: notes || null,
            }),
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        UI.suggestionForm.reset();
        setSuggestionFeedback('Thanks! Your suggestion has been submitted.', 'success');
    } catch (error) {
        console.error('Unable to submit suggestion:', error);
        setSuggestionFeedback(
            'Sorry, your suggestion could not be submitted. Please try again.',
            'error'
        );
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalLabel;
        }
    }
}

function setSuggestionFeedback(message, tone) {
    if (!UI.suggestionFeedback) {
        return;
    }

    if (!message) {
        UI.suggestionFeedback.hidden = true;
        UI.suggestionFeedback.textContent = '';
        return;
    }

    UI.suggestionFeedback.hidden = false;
    UI.suggestionFeedback.textContent = message;
    UI.suggestionFeedback.className = `text-sm font-medium ${tone === 'error' ? 'text-red-600' : 'text-emerald-700'}`;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
