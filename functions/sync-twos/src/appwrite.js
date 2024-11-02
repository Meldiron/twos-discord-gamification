import { Client, ID, Storage, Users } from 'node-appwrite';

export class AppwriteService {
    storage;
    users;

    constructor(dynamicKey) {
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(dynamicKey);

        this.storage = new Storage(client);
        this.users = new Users(client);
    }

    async saveFile(buffer) {
        const blob = new Blob([buffer]);
        const file = new File([blob], `game_${Date.now()}.png`, { type: 'image/png' });

        const response = await storage.createFile('games', ID.unique(), file);
        return response;
    }

    async getUser(userId) {
        try {
            return await users.get(userId);
        } catch (err) {
            return await users.create(userId);
        }
    }

    async updateUserFinishes(userId, finishes) {
        await users.updatePrefs(userId, {
            finishes
        });
    }
}
