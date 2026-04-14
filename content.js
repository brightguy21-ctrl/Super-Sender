// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sendMessage') {
        sendMessageToWhatsApp(request.phoneNumber, request.message)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

async function sendMessageToWhatsApp(phoneNumber, message) {
    try {
        // Open WhatsApp Web with phone number
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;

        // Open in new tab
        window.open(whatsappUrl, '_blank');

        // Wait for WhatsApp to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Find and click send button
        const sendButton = document.querySelector('[data-testid="send"]');
        if (sendButton) {
            sendButton.click();
            return true;
        } else {
            throw new Error('Send button not found');
        }
    } catch (error) {
        throw new Error('Failed to send message: ' + error.message);
    }
}
