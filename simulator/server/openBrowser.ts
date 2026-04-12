import { execSync } from "child_process";
import spawn from "cross-spawn";

const OSX_CHROME = "google chrome";

const Actions = Object.freeze({
    NONE: 0,
    BROWSER: 1,
    SCRIPT: 2,
});

interface BrowserEnv {
    action: number;
    value: string | undefined;
    args: string[];
}

async function getBrowserEnv(): Promise<BrowserEnv> {
    const value = process.env.BROWSER;
    const args = process.env.BROWSER_ARGS ? process.env.BROWSER_ARGS.split(" ") : [];
    let action: number;

    if (!value) {
        action = Actions.BROWSER;
    } else if (value.toLowerCase().endsWith(".js")) {
        action = Actions.SCRIPT;
    } else if (value.toLowerCase() === "none") {
        action = Actions.NONE;
    } else {
        action = Actions.BROWSER;
    }
    return { action, value, args };
}

async function executeNodeScript(scriptPath: string, url: string): Promise<boolean> {
    const extraArgs = process.argv.slice(2);
    const child = spawn(process.execPath, [scriptPath, ...extraArgs, url], { stdio: "inherit" });
    const chalk = (await import("chalk")).default;
    child.on("close", (code) => {
        if (code !== 0) {
            console.log();
            console.log("The script specified as BROWSER environment variable failed.");
            console.log(scriptPath + " exited with code " + code + ".");
            console.log();
        }
    });
    return true;
}

async function startBrowserProcess(
    browser: string | string[] | undefined,
    url: string,
    args: string[]
): Promise<boolean> {
    const shouldTryOpenChromiumWithAppleScript =
        process.platform === "darwin" &&
        (typeof browser !== "string" || browser === OSX_CHROME);

    if (shouldTryOpenChromiumWithAppleScript) {
        const supportedChromiumBrowsers = [
            "Google Chrome Canary", "Google Chrome Dev", "Google Chrome Beta",
            "Google Chrome", "Microsoft Edge", "Brave Browser", "Vivaldi", "Chromium",
        ];

        for (const chromiumBrowser of supportedChromiumBrowsers) {
            try {
                execSync('ps cax | grep "' + chromiumBrowser + '"');
                execSync(
                    'osascript openChrome.applescript "' + encodeURI(url) + '" "' + chromiumBrowser + '"',
                    { cwd: __dirname, stdio: "ignore" }
                );
                return true;
            } catch {
                // ignore
            }
        }
    }

    if (process.platform === "darwin" && browser === "open") {
        browser = undefined;
    }

    if (typeof browser === "string" && args.length > 0) {
        browser = [browser, ...args];
    }

    try {
        const open = (await import("open")).default;
        const options: any = { app: browser, wait: false, url: true };
        open(url, options).catch((e) => { console.error(e); });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function openBrowser(url: string): Promise<boolean> {
    const { action, value, args } = await getBrowserEnv();
    switch (action) {
        case Actions.NONE:
            return false;
        case Actions.SCRIPT:
            return await executeNodeScript(value!, url);
        case Actions.BROWSER:
            return await startBrowserProcess(value, url, args);
        default:
            throw new Error("Not implemented.");
    }
}
