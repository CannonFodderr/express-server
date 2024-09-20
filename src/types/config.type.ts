export type ProcessConfig = {
    ENV: "development" | "production" | "test",
    SERVER_PORT: number,
    SERVER_TEST_PORT: number,
    LOG_LEVEL: "info",
    CLUSTER_CPUS: number,
    PROXY_SERVICE_TARGETS: { [key: string]: string }
    [key: string]: ConfigSupportedType; // Index signature
}
export type ConfigSupportedType = string | number | boolean | Array<any> | object
