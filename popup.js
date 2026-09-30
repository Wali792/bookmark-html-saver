

const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettings');
const themeToggle = document.getElementById('themeToggle');
const increaseWidthBtn = document.getElementById('increaseWidth');
const decreaseWidthBtn = document.getElementById('decreaseWidth');
const widthValue = document.getElementById('widthValue');
const increaseHeightBtn = document.getElementById('increaseHeight');
const decreaseHeightBtn = document.getElementById('decreaseHeight');
const heightValue = document.getElementById('heightValue');
const increaseTextBtn = document.getElementById('increaseText');
const decreaseTextBtn = document.getElementById('decreaseText');
const textValue = document.getElementById('textValue');
const resetSettingsBtn = document.getElementById('resetSettings');
const mainView = document.getElementById('mainView');
const bookmarkForm = document.getElementById('bookmarkForm');
const bookmarkTitle = document.getElementById('bookmarkTitle');
const bookmarkUrl = document.getElementById('bookmarkUrl');
const bookmarkFolder = document.getElementById('bookmarkFolder');
const bookmarkPosition = document.getElementById('bookmarkPosition');
const pasteHtmlBtn = document.getElementById('pasteHtml');
const updateLastHtmlBtn = document.getElementById('updateLastHtml');
const bookmarkList = document.getElementById('bookmarkList');
const emptyState = document.getElementById('emptyState');
const statusMessage = document.getElementById('statusMessage');
const refreshBookmarksBtn = document.getElementById('refreshBookmarks');
const htmlBookmarkPrefix = 'data:text/html, ';

// Default settings are used when the user has not changed anything yet.
const defaultSettings = {
  theme: 'dark',
  popupWidth: 500,
  popupHeight: 420,
  baseFontSize: 14
};

// `settings` holds the current values and is updated by the settings controls.
let settings = { ...defaultSettings };
let lastBookmarkId = null;
let htmlUpdateTarget = null;

function loadSettingsFromStorage() {
  chrome.storage.local.get(['settings', 'lastBookmarkId'], (result) => {
    if (result.settings) {
      settings = Object.assign({}, defaultSettings, result.settings);
    }
    lastBookmarkId = result.lastBookmarkId || null;
    applySettings(settings); // apply the loaded settings to the UI
  });
}

function saveSettings() {
  chrome.storage.local.set({ settings }, () => {
    console.log('Settings saved', settings);
  });
}

function applySettings(s) {
  const width = `${s.popupWidth}px`;
  const height = `${s.popupHeight}px`;
  document.documentElement.style.setProperty('--popup-width', width);
  document.documentElement.style.setProperty('--popup-height', height);
  document.documentElement.style.setProperty('--base-font-size', s.baseFontSize + 'px');
  document.documentElement.style.width = width;
  document.documentElement.style.height = height;
  document.body.style.width = width;
  document.body.style.height = height;

  if (s.theme === 'light') {
    document.documentElement.style.setProperty('--bg-gradient-start', '#ffffff');
    document.documentElement.style.setProperty('--bg-gradient-end', '#f2f2f2');
    document.documentElement.style.setProperty('--card-bg', '#ffffff');
    document.documentElement.style.setProperty('--text-color', '#111111');
    document.documentElement.style.setProperty('--border-color', '#d0d0d0');
    document.documentElement.style.setProperty('--muted', '#666666');
  } else {
    document.documentElement.style.setProperty('--bg-gradient-start', '#1a1a1a');
    document.documentElement.style.setProperty('--bg-gradient-end', '#2d2d2d');
    document.documentElement.style.setProperty('--card-bg', '#2d2d2d');
    document.documentElement.style.setProperty('--text-color', '#ffffff');
    document.documentElement.style.setProperty('--border-color', '#404040');
    document.documentElement.style.setProperty('--muted', '#888888');
  }

  widthValue.textContent = `${s.popupWidth}px`;
  heightValue.textContent = `${s.popupHeight}px`;
  textValue.textContent = `${s.baseFontSize}px`;
}

function openSettings() {
  if (mainView) {
    mainView.hidden = true;
    mainView.style.display = 'none';
  }
  if (settingsPanel) {
    settingsPanel.hidden = false;
    settingsPanel.style.display = 'block';
  }
}

function closeSettings() {
  if (settingsPanel) {
    settingsPanel.hidden = true;
    settingsPanel.style.display = 'none';
  }
  if (mainView) {
    mainView.hidden = false;
    mainView.style.display = 'flex';
  }
}

if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
if (themeToggle) themeToggle.addEventListener('click', () => {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  applySettings(settings);
  saveSettings();
});
if (increaseWidthBtn) increaseWidthBtn.addEventListener('click', () => {
  settings.popupWidth = Math.min(800, settings.popupWidth + 40);
  applySettings(settings);
  saveSettings();
});
if (decreaseWidthBtn) decreaseWidthBtn.addEventListener('click', () => {
  settings.popupWidth = Math.max(300, settings.popupWidth - 40);
  applySettings(settings);
  saveSettings();
});
if (increaseHeightBtn) increaseHeightBtn.addEventListener('click', () => {
  settings.popupHeight = Math.min(800, settings.popupHeight + 40);
  applySettings(settings);
  saveSettings();
});
if (decreaseHeightBtn) decreaseHeightBtn.addEventListener('click', () => {
  settings.popupHeight = Math.max(200, settings.popupHeight - 40);
  applySettings(settings);
  saveSettings();
});
if (increaseTextBtn) increaseTextBtn.addEventListener('click', () => {
  settings.baseFontSize = Math.min(22, settings.baseFontSize + 1);
  applySettings(settings);
  saveSettings();
});
if (decreaseTextBtn) decreaseTextBtn.addEventListener('click', () => {
  settings.baseFontSize = Math.max(10, settings.baseFontSize - 1);
  applySettings(settings);
  saveSettings();
});
if (resetSettingsBtn) resetSettingsBtn.addEventListener('click', () => {
  settings = Object.assign({}, defaultSettings);
  applySettings(settings);
  saveSettings();
});

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
}

function getBookmarkErrorMessage() {
  return chrome.runtime.lastError ? chrome.runtime.lastError.message : '';
}

function setHtmlInput(html) {
  bookmarkUrl.value = `${htmlBookmarkPrefix}${html}`;
  setStatus('Current page HTML pasted into the URL field.');
}

function saveLastBookmarkId(id) {
  lastBookmarkId = id;
  chrome.storage.local.set({ lastBookmarkId: id });
}

function clearLastBookmarkId() {
  lastBookmarkId = null;
  chrome.storage.local.remove('lastBookmarkId');
}

function updateHtmlButtonTarget(bookmarks) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const matchingBookmark = tab && tab.title
      ? bookmarks.find((bookmark) => bookmark.title === tab.title)
      : null;

    if (matchingBookmark) {
      htmlUpdateTarget = { id: matchingBookmark.id, title: matchingBookmark.title, usesTabTitle: true };
      updateLastHtmlBtn.textContent = `Update HTML: ${matchingBookmark.title}`;
      return;
    }

    const lastBookmark = lastBookmarkId
      ? bookmarks.find((bookmark) => bookmark.id === lastBookmarkId
        && bookmark.url
        && bookmark.url.startsWith(htmlBookmarkPrefix))
      : null;
    htmlUpdateTarget = lastBookmark
      ? { id: lastBookmark.id, title: lastBookmark.title, usesTabTitle: false }
      : null;
    updateLastHtmlBtn.textContent = lastBookmark
      ? `Update Last HTML: ${lastBookmark.title || '(untitled)'}`
      : 'Update Last HTML: None';
  });
}

function rememberHtmlBookmark(bookmark) {
  if (bookmark.url && bookmark.url.startsWith(htmlBookmarkPrefix)) {
    saveLastBookmarkId(bookmark.id);
  } else if (bookmark.id === lastBookmarkId) {
    clearLastBookmarkId();
  }
}

function readDataPageHtml(tabId, callback) {
  const target = { tabId };
  chrome.debugger.attach(target, '1.3', () => {
    const attachError = getBookmarkErrorMessage();
    if (attachError) {
      callback(attachError);
      return;
    }

    chrome.debugger.sendCommand(
      target,
      'Runtime.evaluate',
      {
        expression: 'document.documentElement.outerHTML',
        returnByValue: true
      },
      (result) => {
        const evaluateError = getBookmarkErrorMessage();
        const html = result && result.result && result.result.value;

        chrome.debugger.detach(target, () => {
          const detachError = getBookmarkErrorMessage();
          if (evaluateError || detachError || typeof html !== 'string') {
            callback(evaluateError || detachError || 'HTML could not be read from this page.');
            return;
          }
          callback(null, html);
        });
      }
    );
  });
}

function readCurrentPageHtml(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const error = getBookmarkErrorMessage();
    if (error || !tabs[0] || typeof tabs[0].id !== 'number') {
      callback(error || 'The current Chrome page could not be found.');
      return;
    }

    if (tabs[0].url && tabs[0].url.startsWith('data:')) {
      readDataPageHtml(tabs[0].id, callback);
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => document.documentElement.outerHTML
      },
      (results) => {
        const scriptError = getBookmarkErrorMessage();
        if (scriptError || !results || !results[0] || typeof results[0].result !== 'string') {
          callback(scriptError || 'HTML could not be read from this page.');
          return;
        }

        callback(null, results[0].result);
      }
    );
  });
}

function pasteCurrentPageHtml() {
  readCurrentPageHtml((error, html) => {
    if (error) {
      setStatus(error, true);
      return;
    }
    setHtmlInput(html);
  });
}

function updateLastBookmarkHtml() {
  if (!htmlUpdateTarget) {
    setStatus('No bookmark is available to update.', true);
    return;
  }

  chrome.bookmarks.get(htmlUpdateTarget.id, (bookmarks) => {
    const getError = getBookmarkErrorMessage();
    if (getError || !bookmarks || !bookmarks[0]) {
      setStatus(getError || 'The bookmark could not be found.', true);
      return;
    }
    if (!htmlUpdateTarget.usesTabTitle
      && (!bookmarks[0].url || !bookmarks[0].url.startsWith(htmlBookmarkPrefix))) {
      setStatus('The last added or edited bookmark does not contain HTML.', true);
      return;
    }

    readCurrentPageHtml((error, html) => {
      if (error) {
        setStatus(error, true);
        return;
      }

      chrome.bookmarks.update(htmlUpdateTarget.id, { url: `${htmlBookmarkPrefix}${html}` }, () => {
        const updateError = getBookmarkErrorMessage();
        if (updateError) {
          setStatus(updateError, true);
          return;
        }
        setStatus(`Bookmark "${bookmarks[0].title}" updated with the current page HTML.`);
        loadBookmarks();
      });
    });
  });
}

function flattenBookmarkTree(nodes, bookmarks = []) {
  nodes.forEach((node) => {
    if (node.url) {
      bookmarks.push(node);
    }
    if (node.children) {
      flattenBookmarkTree(node.children, bookmarks);
    }
  });
  return bookmarks;
}

function addFolderOptions(folder, depth = 0, options = []) {
  if (!folder.children) {
    return options;
  }

  options.push({
    id: folder.id,
    title: `${'— '.repeat(depth)}${folder.title || 'Bookmark Bar'}`
  });
  folder.children
    .filter((child) => child.children && !child.url)
    .forEach((child) => addFolderOptions(child, depth + 1, options));
  return options;
}

function populateBookmarkFolders(tree) {
  const bookmarkBar = tree
    .flatMap((node) => node.children || [])
    .find((node) => node.id === '1' || node.title === 'Bookmarks bar');
  if (!bookmarkBar) {
    setStatus('Chrome bookmark bar was not found.', true);
    return;
  }

  const currentFolder = bookmarkFolder.value;
  bookmarkFolder.replaceChildren();
  addFolderOptions(bookmarkBar).forEach((folder) => {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.title;
    bookmarkFolder.appendChild(option);
  });
  if (Array.from(bookmarkFolder.options).some((option) => option.value === currentFolder)) {
    bookmarkFolder.value = currentFolder;
  }
}

function createBookmarkRow(bookmark) {
  const item = document.createElement('li');
  item.className = 'bookmark-item';

  const titleInput = document.createElement('input');
  titleInput.className = 'bookmark-edit-input';
  titleInput.type = 'text';
  titleInput.value = bookmark.title;
  titleInput.setAttribute('aria-label', `Title for ${bookmark.title}`);

  const urlInput = document.createElement('input');
  urlInput.className = 'bookmark-edit-input';
  urlInput.type = 'text';
  urlInput.value = bookmark.url;
  urlInput.setAttribute('aria-label', `URL for ${bookmark.title}`);

  const actions = document.createElement('div');
  actions.className = 'bookmark-actions';

  const saveButton = document.createElement('button');
  saveButton.className = 'small-btn';
  saveButton.type = 'button';
  saveButton.textContent = 'Save';
  saveButton.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    if (!title || !url) {
      setStatus('Enter a title and URL.', true);
      return;
    }
    chrome.bookmarks.update(bookmark.id, { title, url }, () => {
      const error = getBookmarkErrorMessage();
      if (error) {
        setStatus(error, true);
        return;
      }
      setStatus(`Bookmark "${title}" updated.`);
      rememberHtmlBookmark({ id: bookmark.id, url });
      loadBookmarks();
    });
  });

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-btn';
  deleteButton.type = 'button';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => {
    chrome.bookmarks.remove(bookmark.id, () => {
      const error = getBookmarkErrorMessage();
      if (error) {
        setStatus(error, true);
        return;
      }
      setStatus(`Bookmark "${bookmark.title}" deleted.`);
      if (bookmark.id === lastBookmarkId) {
        clearLastBookmarkId();
      }
      loadBookmarks();
    });
  });

  actions.append(saveButton, deleteButton);
  item.append(titleInput, urlInput, actions);
  return item;
}

function loadBookmarks() {
  chrome.bookmarks.getTree((tree) => {
    const error = getBookmarkErrorMessage();
    if (error) {
      setStatus(error, true);
      return;
    }

    populateBookmarkFolders(tree);
    bookmarkList.replaceChildren();
    const bookmarks = flattenBookmarkTree(tree).reverse();
    bookmarks.forEach((bookmark) => bookmarkList.appendChild(createBookmarkRow(bookmark)));
    emptyState.hidden = bookmarks.length > 0;
    updateHtmlButtonTarget(bookmarks);
  });
}

bookmarkForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = bookmarkTitle.value.trim();
  const url = bookmarkUrl.value.trim();
  if (!title || !url) {
    setStatus('Enter a title and URL.', true);
    return;
  }

  const bookmarkDetails = {
    title,
    url,
    parentId: bookmarkFolder.value
  };
  if (bookmarkPosition.value === 'beginning') {
    bookmarkDetails.index = 0;
  }

  chrome.bookmarks.create(bookmarkDetails, (bookmark) => {
    const error = getBookmarkErrorMessage();
    if (error) {
      setStatus(error, true);
      return;
    }
    bookmarkForm.reset();
    rememberHtmlBookmark(bookmark);
    setStatus(`Bookmark "${bookmark.title}" added.`);
    loadBookmarks();
  });
});

refreshBookmarksBtn.addEventListener('click', loadBookmarks);
pasteHtmlBtn.addEventListener('click', pasteCurrentPageHtml);
updateLastHtmlBtn.addEventListener('click', updateLastBookmarkHtml);
loadSettingsFromStorage();
loadBookmarks();