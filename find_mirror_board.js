
import fs from 'fs';
import path from 'path';

// Manual .env parser
const envPath = path.resolve(process.cwd(), '.env');
let token = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_MONDAY_API_TOKEN=(.+)/);
    if (match) token = match[1].trim();
} catch (e) {
    console.error("Could not read .env", e);
}

if (!token) {
    console.error("No token found!");
    process.exit(1);
}

const query = `query {
    boards (limit: 50) {
        id
        name
        columns {
            id
            title
            type
        }
    }
}`;

console.log("Fetching boards schema...");

fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": token,
    },
    body: JSON.stringify({ query })
})
    .then(res => res.json())
    .then(data => {
        if (!data.data || !data.data.boards) {
            console.error("Error/No Data", data);
            return;
        }

        const boards = data.data.boards;
        console.log(`Scanned ${boards.length} boards.`);

        const matches = boards.filter(b =>
            b.columns.some(c =>
                (c.type === 'mirror' || c.type === 'lookup') &&
                (c.title.toLowerCase().includes('submission') || c.title.toLowerCase().includes('file') || c.title.toLowerCase().includes('preview'))
            )
        );

        if (matches.length === 0) {
            console.log("No exact match found. Listing ALL boards with ANY mirror columns:");
            const anyMirror = boards.filter(b => b.columns.some(c => c.type === 'mirror' || c.type === 'lookup'));
            anyMirror.forEach(b => {
                const mirrors = b.columns.filter(c => c.type === 'mirror' || c.type === 'lookup').map(c => c.title);
                console.log(`- [${b.id}] ${b.name}: Mirrors: ${mirrors.join(', ')}`);
            });
        } else {
            console.log("Found Candidates:");
            matches.forEach(b => {
                const targetCol = b.columns.find(c => (c.type === 'mirror' || c.type === 'lookup'));
                console.log(`- [${b.id}] ${b.name}: Found '${targetCol.title}' (${targetCol.type})`);
            });
        }
    })
    .catch(err => console.error(err));
