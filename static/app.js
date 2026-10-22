'use strict';

const STORAGE_KEY = 'nasmah-progress-v1';
const COMPANIES_URL = '/api/companies';
const SUGGEST_URL = '/api/suggest';
const PAGE_SIZE = 12;

const SECTOR_STYLES = {
    technology: 'bg-purple-100 text-purple-800 border-purple-200',
    government: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'banking & finance': 'bg-violet-100 text-violet-800 border-violet-200',
    banking: 'bg-violet-100 text-violet-800 border-violet-200',
    finance: 'bg-violet-100 text-violet-800 border-violet-200',
    telecom: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    energy: 'bg-pink-100 text-pink-800 border-pink-200',
    consulting: 'bg-sky-100 text-sky-800 border-sky-200',
    defense: 'bg-rose-100 text-rose-800 border-rose-200',
    entertainment: 'bg-amber-100 text-amber-800 border-amber-200',
    'real estate': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    automotive: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    aviation: 'bg-blue-100 text-blue-800 border-blue-200',
    transportation: 'bg-teal-100 text-teal-800 border-teal-200',
    healthcare: 'bg-red-100 text-red-800 border-red-200',
    education: 'bg-lime-100 text-lime-800 border-lime-200',
};

const state = {
    companies: [],
    progress: loadProgress(),
    loaded: false,
    page: 1,
    pageSize: PAGE_SIZE,
};

const UI = {};
const dropdowns = new Map();
let searchTimeout = null;

function init() {
    UI.companyList = document.getElementById('company-list');
    UI.searchInput = document.getElementById('search-input');
    UI.sectorFilter = document.getElementById('sector-filter');
    UI.statusFilter = document.getElementById('status-filter');
    UI.appliedCount = document.getElementById('applied-count');
    UI.totalCount = document.getElementById('total-count');
    UI.progressBar = document.getElementById('progress-bar');
    UI.visibleCount = document.getElementById('visible-count');
    UI.rangeStart = document.getElementById('range-start');
    UI.rangeEnd = document.getElementById('range-end');
    UI.pagination = document.getElementById('pagination');
    UI.suggestionForm = document.getElementById('suggestion-form');
    UI.suggestionFeedback = document.getElementById('suggestion-feedback');
    UI.suggestNameEn = document.getElementById('suggest-name-en');
    UI.suggestNameAr = document.getElementById('suggest-name-ar');
    UI.suggestCareerUrl = document.getElementById('suggest-career-url');
    UI.suggestLinkedinUrl = document.getElementById('suggest-linkedin-url');
    UI.suggestSector = document.getElementById('suggest-sector');
    UI.suggestLocation = document.getElementById('suggest-location');
    UI.suggestNotes = document.getElementById('suggest-notes');

    initDropdowns();

    if (!UI.companyList) {
        return;
    }

    UI.searchInput?.addEventListener('input', handleSearchInput);
    UI.sectorFilter?.addEventListener('change', handleFilterChange);
    UI.statusFilter?.addEventListener('change', handleFilterChange);
    UI.suggestionForm?.addEventListener('submit', submitSuggestion);
    window.addEventListener('storage', handleStorageChange);

    syncDropdownLabel(UI.sectorFilter);
    syncDropdownLabel(UI.statusFilter);

    updateProgress();
    loadCompanies();
}

function initDropdowns() {
    document.querySelectorAll('[data-dropdown]').forEach((root) => {
        const trigger = root.querySelector('[data-dropdown-trigger]');
        const menu = root.querySelector('[data-dropdown-menu]');
        const label = root.querySelector('[data-dropdown-label]');
        const input = root.querySelector('input[type="hidden"]');

        if (!trigger || !menu || !input) {
            return;
        }

        dropdowns.set(root, { trigger, menu, label, input });

        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            if (menu.classList.contains('hidden')) {
                openDropdown(root);
            } else {
                closeDropdown(root);
            }
        });

        trigger.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
                return;
            }
            event.preventDefault();
            if (menu.classList.contains('hidden')) {
                openDropdown(root);
            }
            const options = [...menu.querySelectorAll('[data-value]')];
            const target = event.key === 'ArrowUp'
                ? options[options.length - 1]
                : options[0];
            target?.focus();
        });

        menu.addEventListener('click', (event) => {
            const option = event.target.closest('[data-value]');
            if (!option || !menu.contains(option)) {
                return;
            }
            event.stopPropagation();
            selectDropdownValue(root, option.dataset.value, option.textContent.trim());
        });

        menu.addEventListener('keydown', (event) => {
            const options = [...menu.querySelectorAll('[data-value]')];
            if (!options.length) {
                return;
            }
            const currentIndex = options.indexOf(document.activeElement);

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                const nextIndex = (currentIndex + direction + options.length) % options.length;
                options[nextIndex].focus();
            } else if (event.key === 'Home') {
                event.preventDefault();
                options[0].focus();
            } else if (event.key === 'End') {
                event.preventDefault();
                options[options.length - 1].focus();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                closeDropdown(root);
                trigger.focus();
            }
        });
    });

    document.addEventListener('click', () => closeAllDropdowns());
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllDropdowns();
        }
    });
}

function openDropdown(root) {
    closeAllDropdowns(root);
    const dropdown = dropdowns.get(root);
    if (!dropdown) {
        return;
    }
    dropdown.menu.hidden = false;
    dropdown.menu.classList.remove('hidden');
    dropdown.trigger.setAttribute('aria-expanded', 'true');
    root.classList.add('is-open');
}

function closeDropdown(root) {
    const dropdown = dropdowns.get(root);
    if (!dropdown) {
        return;
    }
    dropdown.menu.hidden = true;
    dropdown.menu.classList.add('hidden');
    dropdown.trigger.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-open');
}

function closeAllDropdowns(exceptRoot) {
    dropdowns.forEach((_dropdown, root) => {
        if (root !== exceptRoot) {
            closeDropdown(root);
        }
    });
}

function selectDropdownValue(root, value, labelText) {
    setDropdownValue(root, value, labelText, true);
    closeDropdown(root);
}

function setDropdownValue(root, value, labelText, dispatchChange) {
    const dropdown = dropdowns.get(root);
    if (!dropdown) {
        return;
    }

    dropdown.input.value = value;
    if (dropdown.label) {
        dropdown.label.textContent = labelText || value;
    }
    dropdown.menu.querySelectorAll('[data-value]').forEach((option) => {
        option.setAttribute('aria-selected', String(option.dataset.value === value));
    });

    if (dispatchChange) {
        dropdown.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function syncDropdownLabel(input) {
    const root = input?.closest('[data-dropdown]');
    const dropdown = root ? dropdowns.get(root) : null;
    if (!dropdown) {
        return;
    }
    const selected = [...dropdown.menu.querySelectorAll('[data-value]')]
        .find((option) => option.dataset.value === input.value);
    if (selected && dropdown.label) {
        dropdown.label.textContent = selected.textContent.trim();
    }
}

function handleSearchInput() {
    window.clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
        state.page = 1;
        renderCompanies();
    }, 140);
}

function handleFilterChange() {
    state.page = 1;
    renderCompanies();
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
    const root = UI.sectorFilter?.closest('[data-dropdown]');
    const menu = root?.querySelector('[data-dropdown-menu]');
    if (!root || !menu) {
        return;
    }

    const current = UI.sectorFilter.value;
    const sectors = [...new Set(
        state.companies
            .map((company) => String(company.sector || '').trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    const values = [
        { value: 'all', label: 'All Sectors' },
        ...sectors.map((sector) => ({ value: sector, label: sector })),
    ];
    const selected = values.some((item) => item.value === current) ? current : 'all';

    menu.replaceChildren(
        ...values.map((item) => createDropdownOption(item.value, item.label, item.value === selected))
    );

    const selectedItem = values.find((item) => item.value === selected);
    setDropdownValue(root, selected, selectedItem?.label || 'All Sectors', false);
}

function createDropdownOption(value, label, selected) {
    const option = document.createElement('button');
    option.type = 'button';
    option.setAttribute('role', 'option');
    option.dataset.value = value;
    option.setAttribute('aria-selected', String(Boolean(selected)));
    option.className = 'dropdown-option';
    option.textContent = label;
    return option;
}

function renderCompanies() {
    if (!state.loaded || !UI.companyList) {
        return;
    }

    const filtered = getFilteredCompanies();
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    state.page = Math.min(Math.max(1, state.page), totalPages);

    const startIndex = (state.page - 1) * state.pageSize;
    const visible = filtered.slice(startIndex, startIndex + state.pageSize);

    if (UI.visibleCount) {
        UI.visibleCount.textContent = String(total);
    }
    if (UI.rangeStart) {
        UI.rangeStart.textContent = String(total ? startIndex + 1 : 0);
    }
    if (UI.rangeEnd) {
        UI.rangeEnd.textContent = String(total ? startIndex + visible.length : 0);
    }

    if (!total) {
        setListMessage(
            state.companies.length
                ? 'No companies match your search or filters.'
                : 'No companies are available right now.'
        );
        renderPagination(0);
        return;
    }

    const fragment = document.createDocumentFragment();
    visible.forEach((company, index) => {
        fragment.appendChild(createCompanyRow(company, index));
    });
    UI.companyList.replaceChildren(fragment);
    renderPagination(total);
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

function sectorBadgeClasses(sector) {
    return SECTOR_STYLES[normalizeText(sector)] || 'bg-slate-100 text-slate-700 border-slate-200';
}

function createCompanyRow(company, index) {
    const applied = isApplied(company.id);
    const companyName = company.name_en || 'this company';
    const row = document.createElement('tr');
    row.className = 'company-row';
    row.dataset.companyId = company.id;
    row.style.animationDelay = `${Math.min(index, 8) * 20}ms`;

    const statusCell = document.createElement('td');
    statusCell.className = 'px-5 py-3.5';

    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = 'inline-flex cursor-pointer items-center justify-center';
    checkboxLabel.title = applied ? 'Marked as applied' : 'Mark as applied';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox-input sr-only';
    checkbox.checked = applied;
    checkbox.setAttribute(
        'aria-label',
        applied ? `Unmark ${companyName} as applied` : `Mark ${companyName} as applied`
    );

    const checkboxBox = document.createElement('span');
    checkboxBox.className = 'checkbox-box';
    checkboxBox.innerHTML = '<svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>';

    checkbox.addEventListener('change', () => {
        const id = String(company.id);
        const nextApplied = checkbox.checked;

        if (nextApplied) {
            state.progress[id] = true;
        } else {
            delete state.progress[id];
        }

        saveProgress();
        checkbox.setAttribute(
            'aria-label',
            nextApplied ? `Unmark ${companyName} as applied` : `Mark ${companyName} as applied`
        );
        checkboxLabel.title = nextApplied ? 'Marked as applied' : 'Mark as applied';
        updateProgress();

        if (UI.statusFilter?.value !== 'all') {
            renderCompanies();
        }
    });

    checkboxLabel.append(checkbox, checkboxBox);
    statusCell.appendChild(checkboxLabel);

    const nameCell = document.createElement('th');
    nameCell.scope = 'row';
    nameCell.className = 'px-5 py-3.5 font-semibold text-slate-900';

    const nameEn = document.createElement('span');
    nameEn.className = 'block';
    nameEn.textContent = company.name_en || 'Unnamed company';
    nameCell.appendChild(nameEn);

    if (company.name_ar) {
        const nameAr = document.createElement('span');
        nameAr.className = 'mt-0.5 block font-arabic text-xs font-normal text-slate-500';
        nameAr.lang = 'ar';
        nameAr.dir = 'auto';
        nameAr.textContent = company.name_ar;
        nameCell.appendChild(nameAr);
    }

    const sectorCell = document.createElement('td');
    sectorCell.className = 'px-5 py-3.5';

    const sector = document.createElement('span');
    sector.className = `inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${sectorBadgeClasses(company.sector)}`;
    sector.textContent = company.sector || 'Uncategorized';
    sectorCell.appendChild(sector);

    const locationCell = document.createElement('td');
    locationCell.className = 'whitespace-nowrap px-5 py-3.5 text-slate-500';
    locationCell.textContent = company.location || '—';

    const linksCell = document.createElement('td');
    linksCell.className = 'px-5 py-3.5';

    const links = document.createElement('div');
    links.className = 'flex items-center justify-end gap-2';

    const careerUrl = safeUrl(company.career_url);
    if (careerUrl) {
        links.appendChild(createCompanyLink('Careers Page', careerUrl, company.name_en, true));
    }

    const linkedinUrl = safeUrl(company.linkedin_url);
    if (linkedinUrl) {
        links.appendChild(createCompanyLink('LinkedIn', linkedinUrl, company.name_en, false));
    }

    if (!links.children.length) {
        const noLinks = document.createElement('span');
        noLinks.className = 'text-xs font-medium text-slate-400';
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
        ? 'inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-violet-600/20 transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2'
        : 'inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2';
    link.innerHTML = `${label}<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5M6 8.25v9A.75.75 0 0 0 6.75 18h9" /></svg>`;
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

function renderPagination(total) {
    if (!UI.pagination) {
        return;
    }

    UI.pagination.replaceChildren();
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));

    if (total <= state.pageSize) {
        UI.pagination.hidden = true;
        return;
    }

    UI.pagination.hidden = false;

    const previous = createPageButton('Previous', state.page - 1, state.page === 1, 'Previous page');
    UI.pagination.appendChild(previous);

    buildPageItems(totalPages, state.page).forEach((item) => {
        if (item === 'ellipsis') {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.setAttribute('aria-hidden', 'true');
            ellipsis.textContent = '…';
            UI.pagination.appendChild(ellipsis);
            return;
        }

        const button = createPageButton(String(item), item, false, `Page ${item}`);
        if (item === state.page) {
            button.setAttribute('aria-current', 'page');
        }
        UI.pagination.appendChild(button);
    });

    UI.pagination.appendChild(
        createPageButton('Next', state.page + 1, state.page === totalPages, 'Next page')
    );
}

function buildPageItems(totalPages, currentPage) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_value, index) => index + 1);
    }

    const items = [1];
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
        start = 2;
        end = 4;
    }
    if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
    }

    if (start > 2) {
        items.push('ellipsis');
    }
    for (let page = start; page <= end; page += 1) {
        items.push(page);
    }
    if (end < totalPages - 1) {
        items.push('ellipsis');
    }
    items.push(totalPages);

    return items;
}

function createPageButton(label, page, disabled, ariaLabel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pagination-btn';
    button.textContent = label;
    button.dataset.page = String(page);

    if (ariaLabel) {
        button.setAttribute('aria-label', ariaLabel);
    }
    if (disabled) {
        button.disabled = true;
    } else {
        button.addEventListener('click', () => goToPage(page));
    }

    return button;
}

function goToPage(page) {
    const totalPages = Math.max(1, Math.ceil(getFilteredCompanies().length / state.pageSize));
    if (page < 1 || page > totalPages) {
        return;
    }
    state.page = page;
    renderCompanies();
}

function setListMessage(message, options = {}) {
    if (!UI.companyList) {
        return;
    }

    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'px-5 py-12 text-center text-sm text-slate-500';
    cell.setAttribute('role', 'status');

    const text = document.createElement('p');
    text.textContent = message;
    cell.appendChild(text);

    if (options.retry) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mt-3 inline-flex items-center justify-center rounded-lg border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2';
        button.textContent = 'Try again';
        button.addEventListener('click', loadCompanies);
        cell.appendChild(button);
    }

    row.appendChild(cell);
    UI.companyList.replaceChildren(row);
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
    const originalLabel = submitButton ? submitButton.innerHTML : '';

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting…';
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
        setSuggestionFeedback('Thanks! Your suggestion has been submitted for review.', 'success');
    } catch (error) {
        console.error('Unable to submit suggestion:', error);
        setSuggestionFeedback(
            'Sorry, your suggestion could not be submitted. Please try again.',
            'error'
        );
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalLabel;
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

    const toneClasses = {
        success: 'text-emerald-600',
        error: 'text-rose-600',
        neutral: 'text-slate-600',
    };
    UI.suggestionFeedback.className = `text-sm font-semibold ${toneClasses[tone] || toneClasses.neutral}`;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
