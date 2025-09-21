declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
    interface User {
      id: string;
    }
  }
}

export {};
