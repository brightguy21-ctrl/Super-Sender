// Background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startBulkSend') {
        handleBulkSend(request.contacts, request.message)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

async function handleBulkSend(contacts, message) {
    const results = {
        sent: 0,
        failed: 0,
        skipped: 0
    };

    for (const contact of contacts) {
        try {
            // Personalize message
            const personalizedMessage = message.replace('{name}', contact.name || contact.phone);

            // Send via content script
            const response = await chrome.tabs.sendMessage(
                (await getCurrentTabId()),
                {
                    action: 'sendMessage',
                    phoneNumber: contact.phone,
                    message: personalizedMessage
                }
            );

            if (response.success) {
                results.sent++;
            } else {
                results.failed++;
            }

            // Apply delay between messages
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        } catch (error) {
            console.error('Error sending to', contact.phone, error);
            results.failed++;
        }
    }

    return results;
}

async function getCurrentTabId() {
    const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
    return tabs[0]?.id;
}

// Reset daily counter at midnight
chrome.alarms.create('resetDailyCounter', { periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'resetDailyCounter') {
        chrome.storage.local.set({ sentToday: 0 });
    }
});
