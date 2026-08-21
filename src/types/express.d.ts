declare namespace Express {
    export interface Request {
        userId?: string;
        sessionToken?: string;
    }
}
