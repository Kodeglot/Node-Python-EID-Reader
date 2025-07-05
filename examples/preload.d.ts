import type { EidReaderOptions, EidData } from '@kodeglot/node-python-eid-reader';
interface EidAPI {
    readEidData: (options?: EidReaderOptions) => Promise<{
        success: boolean;
        data?: EidData;
        error?: string;
        code?: string;
    }>;
    checkRequirements: () => Promise<{
        success: boolean;
        passed?: boolean;
        results?: any;
        error?: string;
    }>;
    installRequirements: () => Promise<{
        success: boolean;
        installed?: boolean;
        error?: string;
    }>;
    setEidEnabled: (enabled: boolean) => Promise<{
        success: boolean;
        enabled?: boolean;
        error?: string;
    }>;
    getEidStatus: () => Promise<{
        success: boolean;
        enabled?: boolean;
        error?: string;
    }>;
}
declare global {
    interface Window {
        eidAPI: EidAPI;
    }
}
export {};
//# sourceMappingURL=preload.d.ts.map