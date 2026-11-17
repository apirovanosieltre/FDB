import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./execution-profile.mjs";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");
const managedLinux = readExecutionProfile() === "managed-linux";

if (managedLinux && command === "build") {
  const result = spawnSync("bash", [
    fileURLToPath(new URL("./build-verified.sh", import.meta.url)), ...args,
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

// Remote builds must finish or fail, even if a build tool leaves handles open.
if (command === "build") {
  const started = Date.now();
  console.log("Building production Worker (maximum 180 seconds)...");
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL("../node_modules/vinext/dist/cli.js", import.meta.url)),
    "build", ...args,
  ], { stdio: "inherit", timeout: 180_000, killSignal: "SIGKILL" });
  if (result.error?.code === "ETIMEDOUT") {
    console.error("Build exceeded 180 seconds and was stopped. Deployment has not started.");
    process.exit(124);
  }
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  for (const artifact of ["dist/server/index.js", "dist/server/wrangler.json", "dist/client/manifest.webmanifest"]) {
    if (!existsSync(new URL(`../${artifact}`, import.meta.url))) {
      throw new Error(`Build did not produce required artifact: ${artifact}`);
    }
  }
  console.log(`Production build finished in ${Math.round((Date.now() - started) / 1000)}s; Worker and deployment configuration verified.`);
  process.exit(0);
}

// Import in this process so the preview owner retains its PID and signals.
const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);
process.argv = [process.execPath, fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" ? ["--port", "5173"] : []), ...args];
await import(cli.href);
