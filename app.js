document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // STATE DEFINITIONS
  // ==========================================================================
  
  let chaptersData = [];
  let currentChapterIdx = 0;   // 0 = Ch 1, 1 = Ch 2, 2 = Ch 3
  let showInfo = false;
  
  // User Preferences
  let activeTheme = localStorage.getItem('ares-reader-theme') || 'obsidian';
  let fontSizePercent = parseInt(localStorage.getItem('ares-reader-fontsize')) || 100;
  
  // ==========================================================================
  // DOM ELEMENT REFERENCES
  // ==========================================================================
  
  // Navigation & Dossier Tabs
  const navLinks = document.querySelectorAll('#navLinks .nav-link');
  const dossierCard = document.getElementById('dossier');
  const tabs = document.querySelectorAll('.dossier-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Animated Portrait Modal
  const portraitModal = document.getElementById('portraitModal');
  const animatedPortrait = document.getElementById('animatedPortrait');
  const portraitCloseBtn = document.getElementById('portraitCloseBtn');
  const portraitModalBackdrop = document.getElementById('portraitModalBackdrop');
  
  // Reader Overlay Ctrls
  const readerOverlay = document.getElementById('readerOverlay');
  const headerReadBtn = document.getElementById('headerReadBtn');
  const mainReadBtn = document.getElementById('mainReadBtn');
  const closeReaderBtn = document.getElementById('closeReaderBtn');
  const chapterSelect = document.getElementById('chapterSelect');
  
  // Reader Adjustments
  const fontDecrease = document.getElementById('fontDecrease');
  const fontIncrease = document.getElementById('fontIncrease');
  const fontSizeIndicator = document.getElementById('fontSizeIndicator');
  const themeSwatches = document.querySelectorAll('.theme-swatch');
  
  // Ebook Core Reading Content
  const readerViewport = document.getElementById('readerViewport');
  const readerArticle = document.getElementById('readerArticle');
  const bookInfoPanel = document.getElementById('bookInfoPanel');
  const infoToggleBtn = document.getElementById('infoToggleBtn');
  
  // Docked Navigation Bar (Footer)
  const prevChapterBtn = document.getElementById('prevChapterBtn');
  const nextChapterBtn = document.getElementById('nextChapterBtn');
  const chapterIndicator = document.getElementById('chapterIndicator');

  // ==========================================================================
  // DOSSIER TAB NAVIGATION & NAVBAR SYNC
  // ==========================================================================
  
  // Handle dossier tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      activateTab(targetTab);
    });
  });

  // Handle navbar clicks mapping to tabs
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetTab = link.getAttribute('data-target-tab');
      activateTab(targetTab);
      
      // Smooth scroll to the dossier container
      dossierCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Activate a specific tab pane and sync navbar link highlights
  function activateTab(tabId) {
    // 1. Update tab button state
    tabs.forEach(t => {
      t.classList.remove('active');
      if (t.getAttribute('data-tab') === tabId) {
        t.classList.add('active');
      }
    });
    
    // 2. Update visible panes
    tabPanes.forEach(pane => {
      pane.classList.remove('active');
      if (pane.id === `pane${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`) {
        pane.classList.add('active');
      }
    });

    // 3. Update navbar active link highlight
    navLinks.forEach(nl => {
      nl.classList.remove('active');
      if (nl.getAttribute('data-target-tab') === tabId) {
        nl.classList.add('active');
      }
    });
  }

  // ==========================================================================
  // FETCH BOOK CONTENT
  // ==========================================================================
  
  async function loadChapters() {
    try {
      const response = await fetch('chapters.json');
      if (!response.ok) {
        throw new Error('Failed to load chapters JSON data');
      }
      chaptersData = await response.json();
      
      // Initialize Ebook UI elements
      initializeChapterSelector();
      loadReaderState();
      renderActiveChapter();
    } catch (error) {
      console.error('Error loading book preview chapters:', error);
      // Fallback preview text
      chaptersData = [
        {
          id: 1,
          title: "Chapter One: The Red Dust",
          pages: ["Failed to load chapters.json preview. Please ensure the website is running on a local HTTP server."]
        }
      ];
      renderActiveChapter();
    }
  }

  // Populate Chapter dropdown selector
  function initializeChapterSelector() {
    chapterSelect.innerHTML = '';
    chaptersData.forEach((ch, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = ch.title;
      chapterSelect.appendChild(option);
    });
    
    chapterSelect.addEventListener('change', (e) => {
      currentChapterIdx = parseInt(e.target.value);
      renderActiveChapter();
      saveReaderState();
    });
  }

  // ==========================================================================
  // EBOOK READER RENDER ENGINE
  // ==========================================================================
  
  function renderActiveChapter() {
    if (!chaptersData || chaptersData.length === 0) return;
    
    const activeChapter = chaptersData[currentChapterIdx];
    
    // Combine all pages of the chapter together to make it one long scrollable page
    const joinedText = activeChapter.pages.join('\n\n');
    readerArticle.innerHTML = formatParagraphs(joinedText);
    
    // Reset reading scroll position to top
    readerViewport.scrollTop = 0;
    
    // Sync header dropdown selector
    chapterSelect.value = currentChapterIdx;

    // Update bottom docked navbar controls
    chapterIndicator.textContent = `Chapter ${currentChapterIdx + 1} of ${chaptersData.length}`;
    
    // Disable buttons at boundaries
    prevChapterBtn.disabled = (currentChapterIdx === 0);
    nextChapterBtn.disabled = (currentChapterIdx === chaptersData.length - 1);
  }

  // Split lines into HTML paragraph elements
  function formatParagraphs(text) {
    if (!text) return "";
    
    // Split by single or double newlines and filter out empty items
    return text.split(/\n\n+/)
               .map(para => para.trim())
               .filter(para => para.length > 0)
               // Strip trailing/leading extra carriage returns inside paragraphs
               .map(para => para.replace(/\n/g, ' '))
               .map(para => `<p>${para}</p>`)
               .join('');
  }

  // ==========================================================================
  // CHAPTER NAVIGATION CONTROLS (FOOTER BAR)
  // ==========================================================================
  
  function goToPrevChapter() {
    if (currentChapterIdx > 0) {
      currentChapterIdx -= 1;
      renderActiveChapter();
      saveReaderState();
    }
  }

  function goToNextChapter() {
    if (currentChapterIdx < chaptersData.length - 1) {
      currentChapterIdx += 1;
      renderActiveChapter();
      saveReaderState();
    }
  }

  // Bind footer buttons
  prevChapterBtn.addEventListener('click', goToPrevChapter);
  nextChapterBtn.addEventListener('click', goToNextChapter);

  // Toggle info panel
  infoToggleBtn.addEventListener('click', () => {
    showInfo = !showInfo;
    toggleInfoPanel();
  });

  // Toggle info panel visibility
  function toggleInfoPanel() {
    if (showInfo) {
      bookInfoPanel.classList.remove('hidden');
      infoToggleBtn.classList.add('active');
    } else {
      bookInfoPanel.classList.add('hidden');
      infoToggleBtn.classList.remove('active');
    }
    localStorage.setItem('ares-reader-showinfo', showInfo);
  }

  // Keyboard pagination controls
  document.addEventListener('keydown', (e) => {
    if (readerOverlay.classList.contains('active')) {
      if (e.key === 'ArrowRight') {
        goToNextChapter();
      } else if (e.key === 'ArrowLeft') {
        goToPrevChapter();
      } else if (e.key === 'Escape') {
        closeReader();
      }
    }
    
  });

  // ==========================================================================
  // EBOOK UTILITY PREFERENCES (FONT SIZE & THEMES)
  // ==========================================================================
  
  // Font scale buttons
  fontDecrease.addEventListener('click', () => {
    if (fontSizePercent > 70) {
      fontSizePercent -= 10;
      updateFontSize();
    }
  });

  fontIncrease.addEventListener('click', () => {
    if (fontSizePercent < 150) {
      fontSizePercent += 10;
      updateFontSize();
    }
  });

  function updateFontSize() {
    fontSizeIndicator.textContent = `${fontSizePercent}%`;
    readerOverlay.style.setProperty('--reader-font-size', `${(fontSizePercent / 100) * 1.125}rem`);
    localStorage.setItem('ares-reader-fontsize', fontSizePercent);
  }

  // Themes swatches click handler
  themeSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      // Active styling updates
      themeSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      
      // Update theme classes
      const targetTheme = swatch.getAttribute('data-theme');
      applyTheme(targetTheme);
    });
  });

  function applyTheme(themeName) {
    // Remove all theme classes
    readerOverlay.classList.remove('theme-obsidian', 'theme-laser', 'theme-sepia', 'theme-light');
    readerOverlay.classList.add(`theme-${themeName}`);
    activeTheme = themeName;
    localStorage.setItem('ares-reader-theme', themeName);
  }

  // ==========================================================================
  // OVERLAY CONTROLLER
  // ==========================================================================
  
  function openReader() {
    readerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Stop background scrolling
    renderActiveChapter();
  }

  function closeReader() {
    readerOverlay.classList.remove('active');
    document.body.style.overflow = 'auto'; // Restore background scrolling
  }

  // Bind trigger buttons
  headerReadBtn.addEventListener('click', openReader);
  mainReadBtn.addEventListener('click', openReader);
  closeReaderBtn.addEventListener('click', closeReader);

  // ==========================================================================
  // LOCALSTORAGE CACHE ENGINE (PERSISTENCE)
  // ==========================================================================
  
  function saveReaderState() {
    localStorage.setItem('ares-reader-chapter', currentChapterIdx);
  }

  function loadReaderState() {
    // Load position
    const savedCh = localStorage.getItem('ares-reader-chapter');
    const savedShowInfo = localStorage.getItem('ares-reader-showinfo');
    
    if (savedCh !== null) {
      currentChapterIdx = parseInt(savedCh);
    }
    
    if (savedShowInfo !== null) {
      showInfo = (savedShowInfo === 'true');
      toggleInfoPanel();
    }
    
    // Apply configurations
    updateFontSize();
    applyTheme(activeTheme);
    
    // Update theme swatch active state
    themeSwatches.forEach(s => {
      s.classList.remove('active');
      if (s.getAttribute('data-theme') === activeTheme) {
        s.classList.add('active');
      }
    });
  }

  // ==========================================================================
  // MARS VIEWER MODE (HIDE UI)
  // ==========================================================================
  const marsViewerBtn = document.getElementById('marsViewerBtn');
  if (marsViewerBtn) {
    const marsBtnText = marsViewerBtn.querySelector('.mars-btn-text');
    const marsBtnIcon = marsViewerBtn.querySelector('.mars-btn-icon');

    marsViewerBtn.addEventListener('click', () => {
      const isViewing = document.body.classList.toggle('viewing-mars');
      
      if (isViewing) {
        marsBtnText.textContent = 'RESTORE INTERFACE';
        // Change icon to eye-off (closed/crossed eye)
        marsBtnIcon.innerHTML = `
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
      } else {
        marsBtnText.textContent = "LET'S SEE MARS";
        // Restore to normal open eye icon
        marsBtnIcon.innerHTML = `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        `;
      }
    });
  }

  // ==========================================================================
  // INTERACTIVE ANIMATED PORTRAITS (CLICK AVATARS)
  // ==========================================================================
  const avatarJax = document.querySelector('.profile-avatar.avatar-jax');
  const avatarElara = document.querySelector('.profile-avatar.avatar-elara');

  if (avatarJax && portraitModal) {
    avatarJax.addEventListener('click', () => {
      animatedPortrait.src = 'jax.gif';
      animatedPortrait.alt = 'Detective Jax Animated Portrait';
      portraitModal.classList.add('active');
    });
  }

  if (avatarElara && portraitModal) {
    avatarElara.addEventListener('click', () => {
      animatedPortrait.src = 'elara.gif';
      animatedPortrait.alt = 'CEO Elara Vance Animated Portrait';
      portraitModal.classList.add('active');
    });
  }

  function closePortraitModal() {
    if (portraitModal) {
      portraitModal.classList.remove('active');
      animatedPortrait.src = ''; // Stop the GIF animation
    }
  }

  if (portraitCloseBtn) {
    portraitCloseBtn.addEventListener('click', closePortraitModal);
  }
  if (portraitModalBackdrop) {
    portraitModalBackdrop.addEventListener('click', closePortraitModal);
  }

  // ==========================================================================
  // BOOTSTRAP INITIALIZATION
  // ==========================================================================
  
  loadChapters();

});
