
import { ObjectId } from "mongodb";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: ObjectId;
                name: string;
                email: string;
                role: string;
                isBlocked: boolean;
            };
        }
    }
}

export {};
