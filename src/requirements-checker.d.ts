export declare class RequirementsChecker {
    private requirements;
    constructor();
    checkAllRequirements(): Promise<{
        passed: boolean;
        results: any[];
    }>;
    private checkRequirement;
    private runWithSudo;
    installMissingRequirements(results: any[]): Promise<boolean>;
    private installEidreader;
    checkPythonVersion(): Promise<{
        version: string;
        major: number;
        minor: number;
    } | null>;
    checkEidreaderVersion(): Promise<string | null>;
    getPlatformSpecificInstallCommands(): {
        [key: string]: string;
    };
}
//# sourceMappingURL=requirements-checker.d.ts.map