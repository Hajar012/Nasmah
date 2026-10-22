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
    UI.visibleCount = document.getElementById('visible-count');
    UI.companyCount = document.getElementById('company-count');
    UI.suggestionForm = document.getElementById('suggestion-form');
    UI.suggestionFeedback = document.getElementById('suggestion-feedback');
    UI.suggestNameEn = document.getElementById('suggest-name-en');
    UI.suggestNameAr = document.getElementById('suggest-name-ar');
    UI.suggestCareerUrl = document.getElementById('suggest-career-url');
    UI.suggestLinkedinUrl = document.getElementById('suggest-linkedin-url');
    UI.suggestSector = document.getElementById('suggest-sector');
    UI.suggestLocation = document.getElementById('suggest-location');
    UI.suggestNotes = document.getElementById('suggest-notes');

    if (!UI.companyList) {
        return;
    }

    UI.searchInput?.addEventListener('input', renderCompanies);
    UI.sectorFilter?.addEventListener('change', renderCompanies);
    UI.statusFilter?.addEventListener('change', renderCompanies);
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
        console.warn('Unable to save application progress.', error);
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
    if (UI.visibleCount) {
        UI.visibleCount.textContent = String(filtered.length);
    }

    if (!filtered.length) {
        setListMessage(
            state.companies.length
                ? 'No companies match your search or filters.'
                : 'No companies are available right now.'
        );
        return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach((company) => {
        fragment.appendChild(createCompanyRow(company));
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

function createCompanyRow(company) {
    const applied = isApplied(company.id);
    const row = document.createElement('tr');
    row.className = 'company-row border-b dark:border-gray-700';
    row.dataset.companyId = company.id;
    row.classList.toggle('is-applied', applied);

    const statusCell = document.createElement('td');
    statusCell.className = 'px-4 py-3';

    const statusSelect = document.createElement('select');
    statusSelect.className = 'status-select rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-500';
    statusSelect.setAttribute('aria-label', `Application status for ${company.name_en || 'this company'}`);
    statusSelect.append(
        new Option('Applied', 'applied'),
        new Option('Not Applied', 'not-applied')
    );
    statusSelect.value = applied ? 'applied' : 'not-applied';

    statusSelect.addEventListener('change', () => {
        const id = String(company.id);
        const nextApplied = statusSelect.value === 'applied';

        if (nextApplied) {
            state.progress[id] = true;
        } else {
            delete state.progress[id];
        }

        saveProgress();
        row.classList.toggle('is-applied', nextApplied);
        updateProgress();

        if (UI.statusFilter?.value !== 'all') {
            renderCompanies();
        }
    });

    statusCell.appendChild(statusSelect);

    const nameCell = document.createElement('th');
    nameCell.scope = 'row';
    nameCell.className = 'px-4 py-3 font-medium text-gray-900 dark:text-white';

    const nameEn = document.createElement('span');
    nameEn.className = 'block';
    nameEn.textContent = company.name_en || 'Unnamed company';
    nameCell.appendChild(nameEn);

    if (company.name_ar) {
        const nameAr = document.createElement('span');
        nameAr.className = 'mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400';
        nameAr.lang = 'ar';
        nameAr.dir = 'auto';
        nameAr.textContent = company.name_ar;
        nameCell.appendChild(nameAr);
    }

    const sectorCell = document.createElement('td');
    sectorCell.className = 'px-4 py-3';

    const sector = document.createElement('span');
    sector.className = 'sector-badge';
    sector.textContent = company.sector || 'Uncategorized';
    sectorCell.appendChild(sector);

    const locationCell = document.createElement('td');
    locationCell.className = 'whitespace-nowrap px-4 py-3';
    locationCell.textContent = company.location || '—';

    const linksCell = document.createElement('td');
    linksCell.className = 'px-4 py-3';

    const links = document.createElement('div');
    links.className = 'flex items-center justify-end gap-2';

    const careerUrl = safeUrl(company.career_url);
    if (careerUrl) {
        links.appendChild(createCompanyLink('Careers', careerUrl, company.name_en, true));
    }

    const linkedinUrl = safeUrl(company.linkedin_url);
    if (linkedinUrl) {
        links.appendChild(createCompanyLink('LinkedIn', linkedinUrl, company.name_en, false));
    }

    if (!links.children.length) {
        const noLinks = document.createElement('span');
        noLinks.className = 'text-xs font-medium text-gray-400 dark:text-gray-500';
        noLinks.textContent = 'No links listed';
        links.appendChild(noLinks);
    }

    linksCell.appendChild(links);
    row.append(statusCell, nameCell, sectorCell, locationCell, linksCell);

    return row;
}

function createCompanyLink(label, url, companyName, primary) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = primary
        ? 'inline-flex items-center justify-center rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-offset-gray-800'
        : 'inline-flex items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/40 dark:focus:ring-offset-gray-800';
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

    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400';
    cell.setAttribute('role', 'status');

    const text = document.createElement('p');
    text.textContent = message;
    cell.appendChild(text);

    if (options.retry) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mt-3 inline-flex items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/40 dark:focus:ring-offset-gray-800';
        button.textContent = 'Try again';
        button.addEventListener('click', loadCompanies);
        cell.appendChild(button);
    }

    row.appendChild(cell);
    UI.companyList.replaceChildren(row);

    if (UI.visibleCount) {
        UI.visibleCount.textContent = '0';
    }
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
    if (UI.companyCount) {
        UI.companyCount.textContent = String(total);
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

async function submitSuggestion(event) {
    event.preventDefault();

    if (!UI.suggestionForm.checkValidity()) {
        UI.suggestionForm.reportValidity();
        return;
    }

    const nameEn = UI.suggestNameEn?.value.trim() || '';
    const nameAr = UI.suggestNameAr?.value.trim() || '';
    const rawCareerUrl = UI.suggestCareerUrl?.value.trim() || '';
    const rawLinkedinUrl = UI.suggestLinkedinUrl?.value.trim() || '';
    const sector = UI.suggestSector?.value.trim() || '';
    const location = UI.suggestLocation?.value.trim() || '';
    const notes = UI.suggestNotes?.value.trim() || '';
    const careerUrl = safeUrl(rawCareerUrl);
    const linkedinUrl = rawLinkedinUrl ? safeUrl(rawLinkedinUrl) : null;

    if (!nameEn || !careerUrl || !sector || !location || (rawLinkedinUrl && !linkedinUrl)) {
        setSuggestionFeedback(
            'Please provide a company name, a valid careers URL, a sector, and a location.',
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
                company_name: nameEn,
                career_url: careerUrl,
                sector,
                notes: notes || null,
                name_en: nameEn,
                name_ar: nameAr || null,
                linkedin_url: linkedinUrl,
                location,
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
    UI.suggestionFeedback.className = `text-sm font-medium ${tone === 'error' ? 'text-red-600 dark:text-red-400' : 'text-purple-700 dark:text-purple-300'}`;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
