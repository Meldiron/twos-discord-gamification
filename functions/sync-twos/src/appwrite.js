import { Client, ID, Storage, Users, Databases } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

export class AppwriteService {
    storage;
    databases;
    users;

    constructor(dynamicKey) {
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(dynamicKey);

        this.storage = new Storage(client);
        this.databases = new Databases(client);
        this.users = new Users(client);
    }

    async getVoucher(code) {
        const response = await this.databases.getDocument('main', 'vouchers', code);

        if(response.used) {
            return null;
        }

        return response;
    }

    async useVoucher(code) {
        await this.databases.updateDocument('main', 'vouchers', code, { used: true });
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
        const user = await this.getUser(userId);
        await this.users.updatePrefs(userId, {
            ...user.prefs,
            finishes
        });
    }

    async updateUserAttempt(userId, attempt) {
        const user = await this.getUser(userId);
        await this.users.updatePrefs(userId, {
            ...user.prefs,
            attempt
        });
    }
}
