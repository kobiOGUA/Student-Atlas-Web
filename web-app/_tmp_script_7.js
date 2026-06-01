
        // Load theme immediately
        const savedTheme = localStorage.getItem('kobi_atlas_theme') || 'default';
        document.documentElement.setAttribute('data-theme', savedTheme);
    