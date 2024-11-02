import { Client, ID, Storage, Users } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

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
        const response = await this.storage.createFile('games', ID.unique(), InputFile.fromBuffer(buffer, `game_${Date.now()}.png`));
        return response;
    }

    async getUser(userId) {
        try {
            return await this.users.get(userId);
        } catch (err) {
            return await this.users.create(userId);
        }
    }

    async updateUserFinishes(userId, finishes) {
        await this.users.updatePrefs(userId, {
            finishes
        });
    }
}
