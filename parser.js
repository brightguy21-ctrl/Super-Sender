// File parsing utilities
async function parseFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
        return await parseCSV(file);
    } else if (['xlsx', 'xls'].includes(extension)) {
        return await parseExcel(file);
    } else {
        throw new Error('Unsupported file format');
    }
}

async function parseCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n').filter(line => line.trim());
                const contacts = [];

                lines.forEach((line, index) => {
                    if (index === 0) return; // Skip header
                    const [phone, name] = line.split(',').map(col => col.trim());
                    if (phone && phone.match(/^\+?\d+/)) {
                        contacts.push({
                            phone: phone.startsWith('+') ? phone : '+' + phone,
                            name: name || ''
                        });
                    }
                });

                resolve(contacts);
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsText(file);
    });
}

async function parseExcel(file) {
    // For Excel parsing, you'd need to use a library like xlsx.js
    // This is a simplified version
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // Using a simple approach - in production, use xlsx library
                resolve([]);
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}
