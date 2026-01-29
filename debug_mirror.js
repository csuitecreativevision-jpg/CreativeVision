
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

// Hardcoded target based on "Maria Alejandra - Fulfillment Board"
const targetBoardId = 8694659440;
console.log("Fetching Board ID:", targetBoardId);

const detailQuery = `query {
        boards (ids: [${targetBoardId}]) {
            id
            name
            items_page (limit: 5) {
                items {
                    id
                    name
                    column_values {
                        id
                        text
                        value
                        type
                        ... on MirrorValue {
                            display_value
                        }
                    }
                }
            }
        }
    }`;

fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": token,
    },
    body: JSON.stringify({ query: detailQuery })
})
    .then(res => res.json())
    .then(async detailJson => {
        fs.writeFileSync('debug_mirror_output.json', JSON.stringify(detailJson, null, 2));
        console.log("Done. Wrote details to debug_mirror_output.json");
    })
    .catch(err => console.error(err));
