export type BackgroundConfig = {
  redis: {
    family: number;
    host: string;
    port: number;
    password: string;
    tls: {
      ca: string;
      key: string;
      rejectUnauthorized: boolean;
    };
  };
};
