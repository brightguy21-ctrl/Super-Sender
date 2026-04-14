// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadDashboardStats();
    initializeEventListeners();
    loadContacts();
    loadTemplates();
});

// Tab switching
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        goToTab(tabName);
    });
});

function goToTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active to button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// File import
document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const contacts = await parseFile(file);
        await addContactsToStorage(contacts);
        displaySuccessMessage(`✅ Imported ${contacts.length} contacts`);
        loadContacts();
    } catch (error) {
        displayErrorMessage('❌ Error importing file: ' + error.message);
    }
});

// Character counter for messages
document.getElementById('messageContent').addEventListener('input', (e) => {
    const count = e.target.value.length;
    document.getElementById('charCount').textContent = count;
});

// Delay slider
document.getElementById('delaySlider').addEventListener('input', (e) => {
    document.getElementById('delayValue').textContent = e.target.value;
});

// Save template
async function saveTemplate() {
    const content = document.getElementById('messageContent').value.trim();
    
    if (!content) {
        displayErrorMessage('❌ Please enter a message to save');
        return;
    }

    const templateName = prompt('Enter template name:');
    if (!templateName) return;

    const template = {
        id: Date.now(),
        name: templateName,
        content: content,
        createdAt: new Date().toISOString()
    };

    const templates = await getFromStorage('templates') || [];
    templates.push(template);
    await saveToStorage('templates', templates);

    displaySuccessMessage('✅ Template saved successfully');
    document.getElementById('messageContent').value = '';
    document.getElementById('charCount').textContent = '0';
    loadTemplates();
}

// Load templates
async function loadTemplates() {
    const templates = await getFromStorage('templates') || [];
    const templatesList = document.getElementById('templatesList');

    if (templates.length === 0) {
        templatesList.innerHTML = '<p class="empty-state">No templates saved yet</p>';
        return;
    }

    templatesList.innerHTML = templates.map(template => `
        <div class="template-card">
            <div class="title">${template.name}</div>
            <div class="content">${template.content}</div>
            <div class="template-actions">
                <button class="btn btn-primary" onclick="loadTemplate(${template.id})" style="flex:1; padding:5px; font-size:11px;">Use</button>
                <button class="btn btn-danger" onclick="deleteTemplate(${template.id})" style="flex:1; padding:5px; font-size:11px;">Delete</button>
            </div>
        </div>
    `).join('');
}

// Load template into message box
async function loadTemplate(id) {
    const templates = await getFromStorage('templates') || [];
    const template = templates.find(t => t.id === id);
    if (template) {
        document.getElementById('messageContent').value = template.content;
        document.getElementById('charCount').textContent = template.content.length;
    }
}

// Delete template
async function deleteTemplate(id) {
    if (!confirm('Delete this template?')) return;

    const templates = await getFromStorage('templates') || [];
    const filtered = templates.filter(t => t.id !== id);
    await saveToStorage('templates', filtered);
    loadTemplates();
}

// Load contacts
async function loadContacts() {
    const contacts = await getFromStorage('contacts') || [];
    const contactsList = document.getElementById('contactsList');

    if (contacts.length === 0) {
        contactsList.innerHTML = '<p class="empty-state">No contacts imported yet</p>';
        return;
    }

    contactsList.innerHTML = contacts.map((contact, index) => `
        <div class="contact-item">
            <span class="phone">${contact.phone}</span>
            <span class="name">${contact.name || 'N/A'}</span>
            <button class="delete-btn" onclick="deleteContact(${index})">✕</button>
        </div>
    `).join('');
}

// Delete contact
async function deleteContact(index) {
    const contacts = await getFromStorage('contacts') || [];
    contacts.splice(index, 1);
    await saveToStorage('contacts', contacts);
    loadContacts();
}

// Load dashboard stats
async function loadDashboardStats() {
    const contacts = await getFromStorage('contacts') || [];
    const templates = await getFromStorage('templates') || [];
    const sentToday = await getFromStorage('sentToday') || 0;
    const settings = await getFromStorage('settings') || {};

    document.getElementById('totalContacts').textContent = contacts.length;
    document.getElementById('totalTemplates').textContent = templates.length;
    document.getElementById('messagesToday').textContent = sentToday;
    document.getElementById('dailyLimit').textContent = settings.dailyLimit || 150;
}

// Manual contact input
function showManualInput() {
    document.getElementById('manualInputModal').style.display = 'block';
}

function closeManualInput() {
    document.getElementById('manualInputModal').style.display = 'none';
}

async function addManualContacts() {
    const input = document.getElementById('manualContactsInput').value.trim();
    if (!input) {
        displayErrorMessage('❌ Please enter at least one phone number');
        return;
    }

    const phoneNumbers = input.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.match(/^\+\d{1,3}\s?\d+/));

    if (phoneNumbers.length === 0) {
        displayErrorMessage('❌ No valid phone numbers found');
        return;
    }

    const newContacts = phoneNumbers.map(phone => ({
        phone: phone,
        name: '',
        addedAt: new Date().toISOString()
    }));

    await addContactsToStorage(newContacts);
    displaySuccessMessage(`✅ Added ${newContacts.length} contacts`);
    document.getElementById('manualContactsInput').value = '';
    closeManualInput();
    loadContacts();
}

// Add contacts to storage
async function addContactsToStorage(contacts) {
    const existing = await getFromStorage('contacts') || [];
    const combined = [...existing, ...contacts];
    // Remove duplicates
    const unique = Array.from(new Map(
        combined.map(c => [c.phone, c])
    ).values());
    await saveToStorage('contacts', unique);
}

// Clear all contacts
async function clearAllContacts() {
    if (!confirm('Are you sure? This will delete all contacts.')) return;
    await saveToStorage('contacts', []);
    loadContacts();
}

// Save settings
async function saveSettings() {
    const settings = {
        dailyLimit: parseInt(document.getElementById('dailyLimitInput').value),
        delayBetweenMessages: parseInt(document.getElementById('delaySlider').value),
        batchSize: parseInt(document.getElementById('batchSize').value),
        breakDuration: parseInt(document.getElementById('breakDuration').value),
        encryptData: document.getElementById('encryptData').checked,
        clearHistoryDaily: document.getElementById('clearHistoryDaily').checked,
        theme: document.getElementById('themeSelect').value,
        notificationsEnabled: document.getElementById('notificationsEnabled').checked,
        businessName: document.getElementById('businessName').value,
        businessEmail: document.getElementById('businessEmail').value,
        businessWebsite: document.getElementById('businessWebsite').value,
        addSignature: document.getElementById('addSignature').checked,
        respectDoNotDisturb: document.getElementById('respectDoNotDisturb').checked,
        trackResponses: document.getElementById('trackResponses').checked,
        maxPerContact: parseInt(document.getElementById('maxPerContact').value)
    };

    await saveToStorage('settings', settings);
    displaySuccessMessage('✅ Settings saved successfully');
}

// Load settings
async function loadSettings() {
    const settings = await getFromStorage('settings') || {};

    document.getElementById('dailyLimitInput').value = settings.dailyLimit || 150;
    document.getElementById('delaySlider').value = settings.delayBetweenMessages || 3;
    document.getElementById('delayValue').textContent = settings.delayBetweenMessages || 3;
    document.getElementById('batchSize').value = settings.batchSize || 10;
    document.getElementById('breakDuration').value = settings.breakDuration || 5;
    document.getElementById('encryptData').checked = settings.encryptData !== false;
    document.getElementById('clearHistoryDaily').checked = settings.clearHistoryDaily !== false;
    document.getElementById('themeSelect').value = settings.theme || 'light';
    document.getElementById('notificationsEnabled').checked = settings.notificationsEnabled !== false;
    document.getElementById('businessName').value = settings.businessName || '';
    document.getElementById('businessEmail').value = settings.businessEmail || '';
    document.getElementById('businessWebsite').value = settings.businessWebsite || '';
    document.getElementById('addSignature').checked = settings.addSignature || false;
    document.getElementById('respectDoNotDisturb').checked = settings.respectDoNotDisturb !== false;
    document.getElementById('trackResponses').checked = settings.trackResponses || false;
    document.getElementById('maxPerContact').value = settings.maxPerContact || 5;
}

// Reset settings
function resetSettings() {
    if (!confirm('Reset all settings to defaults?')) return;
    document.getElementById('dailyLimitInput').value = 150;
    document.getElementById('delaySlider').value = 3;
    document.getElementById('delayValue').textContent = 3;
    document.getElementById('batchSize').value = 10;
    document.getElementById('breakDuration').value = 5;
    document.getElementById('encryptData').checked = true;
    document.getElementById('clearHistoryDaily').checked = true;
    document.getElementById('themeSelect').value = 'light';
    document.getElementById('notificationsEnabled').checked = true;
    document.getElementById('businessName').value = '';
    document.getElementById('businessEmail').value = '';
    document.getElementById('businessWebsite').value = '';
    document.getElementById('addSignature').checked = false;
    document.getElementById('respectDoNotDisturb').checked = true;
    document.getElementById('trackResponses').checked = false;
    document.getElementById('maxPerContact').value = 5;
    saveSettings();
}

// Start bulk send
async function startBulkSend() {
    const contacts = await getFromStorage('contacts') || [];
    const message = document.getElementById('messageContent').value.trim();

    if (contacts.length === 0) {
        displayErrorMessage('❌ No contacts to send to');
        return;
    }

    if (!message) {
        displayErrorMessage('❌ Please compose a message first');
        return;
    }

    if (!confirm(`Send message to ${contacts.length} contacts?`)) return;

    // Send to background script
    chrome.runtime.sendMessage({
        action: 'startBulkSend',
        contacts: contacts,
        message: message
    }, response => {
        if (response.success) {
            displaySuccessMessage('🚀 Bulk send started');
        } else {
            displayErrorMessage('❌ Error: ' + response.error);
        }
    });
}

// UI Helpers
function displaySuccessMessage(msg) {
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #27AE60;
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function displayErrorMessage(msg) {
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #E74C3C;
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function initializeEventListeners() {
    // Additional listeners can be added here
}

// Google Sheets import (placeholder - requires OAuth)
function importGoogleSheets() {
    alert('🔗 Google Sheets integration requires authentication setup. Please refer to the documentation.');
}
