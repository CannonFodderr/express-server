export type ProcessConfig = {
    ENV: "development" | "production" | "test",
    SERVER_PORT: number,
    SERVER_TEST_PORT: number,
    LOG_LEVEL: "info"
    [key: string]: ConfigSupportedType; // Index signature
}
export type ConfigSupportedType = string | number | boolean | Array<any> | object
