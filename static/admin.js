'use strict';

(function () {
    const THEME_KEY = 'nasmah-theme';
    const PALETTE_KEY = 'nasmah-palette';
    const PALETTES = ['purple-soft', 'ocean-indigo'];
    const PALETTE_LABELS = {
        'purple-soft': 'Soft Purple',
        'ocean-indigo': 'Ocean Indigo',
    };
    const root = document.documentElement;

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        try {
            window.localStorage.setItem(THEME_KEY, theme);
        } catch (error) {
            /* storage may be unavailable */
        }
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.setAttribute(
                'aria-label',
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            );
        }
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', theme === 'dark' ? '#08050a' : '#f8f6fa');
        }
    }

    function applyPalette(palette) {
        root.setAttribute('data-palette', palette);
        try {
            window.localStorage.setItem(PALETTE_KEY, palette);
        } catch (error) {
            /* storage may be unavailable */
        }
        const label = document.getElementById('palette-toggle-label');
        if (label) {
            label.textContent = PALETTE_LABELS[palette] || palette;
        }
    }

    function init() {
        let theme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        let palette = root.getAttribute('data-palette');
        if (!PALETTES.includes(palette)) {
            palette = PALETTES[0];
        }
        applyTheme(theme);
        applyPalette(palette);

        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            theme = theme === 'dark' ? 'light' : 'dark';
            applyTheme(theme);
        });

        document.getElementById('palette-toggle')?.addEventListener('click', () => {
            const index = PALETTES.indexOf(palette);
            palette = PALETTES[(index + 1) % PALETTES.length];
            applyPalette(palette);
        });

        document.querySelectorAll('form[data-confirm]').forEach((form) => {
            form.addEventListener('submit', (event) => {
                const message = form.getAttribute('data-confirm');
                if (message && !window.confirm(message)) {
                    event.preventDefault();
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
