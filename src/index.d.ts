/**
 * Interface representing Belgian eID card data
 */
export interface EidData {
    cardNumber: string;
    chipNumber: string;
    validityDateBegin: string;
    validityDateEnd: string;
    municipality: string;
    nationality: string;
    birthLocation: string;
    birthDate: string;
    name: string;
    firstName: string;
    sex: string;
    documentType: string;
    address: {
        streetAndNumber: string;
        zip: string;
        municipality: string;
    };
    photo: string;
}
/**
 * Structured result for all API calls
 */
export interface ReaderResult<T> {
    success: boolean;
    info: string[];
    error?: {
        message: string;
        code?: string;
    };
    data?: T;
}
export interface EidReaderOptions {
    verbose?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    pythonPath?: string;
    pkcs11LibPath?: string;
}
export declare class EidReaderError extends Error {
    readonly code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare class EidReader {
    private options;
    private requirementsChecker;
    private info;
    constructor(options?: EidReaderOptions);
    private addInfo;
    checkRequirements(): Promise<ReaderResult<{
        passed: boolean;
        results: any;
    }>>;
    installRequirements(): Promise<ReaderResult<{
        installed: boolean;
    }>>;
    readEidData(): Promise<ReaderResult<EidData>>;
    private findPythonWithEidreader;
    private tryPythonCommand;
    private setupEnvironment;
    private runEidReader;
    private parseEidreaderOutput;
}
export declare function readEidData(options?: EidReaderOptions): Promise<ReaderResult<EidData>>;
export declare function checkRequirements(): Promise<ReaderResult<{
    passed: boolean;
    results: any;
}>>;
export declare function installRequirements(): Promise<ReaderResult<{
    installed: boolean;
}>>;
export type { RequirementsChecker } from './requirements-checker';
//# sourceMappingURL=index.d.ts.map