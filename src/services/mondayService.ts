const MONDAY_API_URL = "https://api.monday.com/v2";
const MONDAY_API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjYxMjU0OTQwNSwiYWFpIjoxMSwidWlkIjo5ODc3ODIxNCwiaWFkIjoiMjAyNi0wMS0yN1QwMDo1Mjo0My4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MzM0NTU2MDksInJnbiI6InVzZTEifQ.pTRaasIgMFRcIcpZY_-vZIGmzhkKBXBiSC9NtxGEBhI"; // TODO: Replace with your actual API Token

export interface ApplicationData {
    fullName: string;
    email: string;
    specialization: string;
    portfolioLink: string;
    message: string;
    resumeFile?: File;
    [key: string]: any;
}

const BOARD_NAME = "Job Applications";

async function mondayRequest(query: string, variables?: any) {
    try {
        const response = await fetch(MONDAY_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": MONDAY_API_TOKEN,
            },
            body: JSON.stringify({ query, variables }),
        });

        const data = await response.json();
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }
        return data.data;
    } catch (error) {
        console.error("Monday API Error:", error);
        throw error;
    }
}

async function getOrCreateBoard(): Promise<string> {
    // 1. Check if board exists
    const query = `query {
    boards(limit: 50) {
      id
      name
    }
  }`;

    const data = await mondayRequest(query);
    const existingBoard = data.boards?.find((b: any) => b.name === BOARD_NAME);

    if (existingBoard) {
        return existingBoard.id;
    }

    // 2. Create board if not found
    const createBoardQuery = `mutation {
    create_board (board_name: "${BOARD_NAME}", board_kind: public) {
      id
    }
  }`;

    const createData = await mondayRequest(createBoardQuery);
    const boardId = createData.create_board.id;

    // 3. Create Columns
    await createColumn(boardId, "email", "text", "Email");
    await createColumn(boardId, "specialization", "text", "Specialization");
    await createColumn(boardId, "portfolio", "link", "Portfolio");
    await createColumn(boardId, "file", "file", "Resume");
    await createColumn(boardId, "message", "long_text", "Message"); // Add Message column

    return boardId;
}

async function getOrCreateGroup(boardId: string, groupName: string): Promise<string> {
    const query = `query {
        boards (ids: [${boardId}]) {
            groups {
                id
                title
            }
        }
    }`;
    const data = await mondayRequest(query);
    const groups = data.boards[0]?.groups || [];
    const existingGroup = groups.find((g: any) => g.title.toLowerCase() === groupName.toLowerCase());

    if (existingGroup) return existingGroup.id;

    const createGroupQuery = `mutation {
        create_group (board_id: ${boardId}, group_name: "${groupName}") {
            id
        }
    }`;
    const createData = await mondayRequest(createGroupQuery);
    return createData.create_group.id;
}

async function createColumn(boardId: string, title: string, type: string, label?: string) {
    const query = `mutation {
        create_column (board_id: ${boardId}, title: "${label || title}", column_type: ${type}) {
            id
        }
    }`;
    await mondayRequest(query).catch(() => { });
}

export async function submitApplicationToMonday(data: ApplicationData) {
    if (MONDAY_API_TOKEN === "YOUR_MONDAY_API_TOKEN" || !MONDAY_API_TOKEN) {
        console.warn("Monday.com API Token not set.");
        alert("Monday.com integration demo mode.");
        return;
    }

    try {
        const boardId = await getOrCreateBoard();

        // Get or Create Group for Specialization
        const groupId = await getOrCreateGroup(boardId, data.specialization || "General");

        // Fetch columns to map data
        const columnsQuery = `query {
            boards (ids: [${boardId}]) {
                columns {
                    id
                    title
                    type
                }
            }
        }`;

        const columnsData = await mondayRequest(columnsQuery);
        const columns = columnsData.boards[0]?.columns || [];

        const getColId = (title: string) => columns.find((c: any) => c.title.toLowerCase().includes(title.toLowerCase()))?.id;

        const emailColId = getColId("Email");
        const specColId = getColId("Specialization");
        const portfolioColId = getColId("Portfolio");
        const messageColId = getColId("Message");

        // Robust File Column Lookup
        const fileColumn = columns.find((c: any) => c.type === "file" || c.title.toLowerCase() === "resume");
        const resumeColId = getColId("Resume") || fileColumn?.id || "files";

        const columnValues: any = {};
        if (emailColId) columnValues[emailColId] = data.email;
        if (specColId) columnValues[specColId] = data.specialization;
        if (portfolioColId && data.portfolioLink) {
            columnValues[portfolioColId] = { url: data.portfolioLink, text: "Portfolio Link" };
        }
        if (messageColId && data.message) {
            columnValues[messageColId] = { text: data.message };
        }

        // Create Item in specific Group
        const createItemQuery = `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
            create_item (board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues) {
                id
            }
        }`;

        const variables = {
            boardId: Number(boardId),
            groupId: groupId,
            itemName: data.fullName,
            columnValues: JSON.stringify(columnValues)
        };

        const itemData = await mondayRequest(createItemQuery, variables);
        const itemId = itemData.create_item.id;

        // Upload Resume to Column ONLY
        if (data.resumeFile) {
            // console.log(`Uploading resume to column ID: ${resumeColId}`);
            try {
                await uploadFileToMonday(itemId, data.resumeFile, resumeColId);
            } catch (err: any) {
                console.error("Critical: Resume upload failed", err);
                alert(`Application submitted, but Resume failed to upload.\nReason: ${err.message || "Unknown error"}`);
            }
        }

        return itemId;

    } catch (error) {
        console.error("Failed to submit to Monday.com", error);
        throw error;
    }
}

async function uploadFileToMonday(itemId: string, file: File, columnId: string) {
    const query = `mutation ($file: File!) {
        add_file_to_column (item_id: ${itemId}, column_id: "${columnId}", file: $file) {
            id
        }
    }`;
    await performUpload(query, file);
}

async function performUpload(query: string, file: File) {
    const formData = new FormData();
    formData.append("query", query);
    formData.append("map", JSON.stringify({ "image": ["variables.file"] }));
    formData.append("image", file);

    const response = await fetch(MONDAY_API_URL, {
        method: "POST",
        headers: {
            "Authorization": MONDAY_API_TOKEN,
        },
        body: formData,
    });
    const json = await response.json();
    if (json.errors) throw new Error(json.errors[0].message);
    if (json.data && json.data.add_file_to_column) {
        return json.data.add_file_to_column;
    }
    // Fallback if structure is different
    return json;
}
