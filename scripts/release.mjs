#!/usr/bin/env node
/**
 * @file release.mjs
 * Automated release pipeline for bas71.
 *
 * Usage:
 *   node scripts/release.mjs [patch | minor | major | <explicit-version>] [options]
 *
 * Options:
 *   --dry-run       Calculate new version and simulate without modifying files
 *   --no-test       Skip running typecheck and unit tests
 *   --no-build      Skip compiling TypeScript
 *   --no-sync       Skip syncing to sibling repositories or client bundles
 *   --message <msg> Custom release note to include in CHANGELOG.md
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BAS_ROOT = path.resolve(__dirname, "..");

// Known sibling consumer paths
const MOCKAPIX_ROOT = "/media/express/WORK1/project/mockapix";
const VIAFACTORY_ROOT = "/media/express/WORK1/project/viafactory";

function parseSemver(version) {
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?$/);
  if (!match) {
    throw new Error(`Invalid semver version: "${version}"`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
  };
}

function calculateNextVersion(currentVersion, bumpType) {
  const parsed = parseSemver(currentVersion);
  switch (bumpType.toLowerCase()) {
    case "patch":
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    case "minor":
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case "major":
      return `${parsed.major + 1}.0.0`;
    default:
      if (/^\d+\.\d+\.\d+/.test(bumpType)) {
        return bumpType;
      }
      throw new Error(
        `Unknown bump type: "${bumpType}". Must be 'patch', 'minor', 'major', or explicit 'X.Y.Z'.`
      );
  }
}

function updateChangelog(changelogPath, nextVersion, bumpType, message, isDryRun) {
  const today = new Date().toISOString().split("T")[0];
  const header = `## [${nextVersion}] - ${today}\n\n`;
  const defaultMsg =
    bumpType === "major"
      ? "- Breaking changes to public API or extension stand harness."
      : bumpType === "minor"
        ? "- New features, viewport presets, or extension runtime polyfills."
        : "- Bug fixes, styling refinements, and stability improvements.";
  const entry = `${header}${message ? `- ${message}\n` : `${defaultMsg}\n`}\n`;

  if (!fs.existsSync(changelogPath)) {
    if (!isDryRun) {
      fs.writeFileSync(changelogPath, `# Changelog\n\n${entry}`, "utf-8");
    }
    return;
  }

  const content = fs.readFileSync(changelogPath, "utf-8");
  const marker = "# Changelog\n\n";
  const newContent = content.startsWith(marker)
    ? `${marker}${entry}${content.slice(marker.length)}`
    : `# Changelog\n\n${entry}${content}`;

  if (!isDryRun) {
    fs.writeFileSync(changelogPath, newContent, "utf-8");
  }
}

function runCommand(command, cwd) {
  console.log(`> [${path.basename(cwd)}] ${command}`);
  execSync(command, { cwd, stdio: "inherit" });
}

async function main() {
  const args = process.argv.slice(2);
  let bumpType = "patch";
  let isDryRun = false;
  let skipTest = false;
  let skipBuild = false;
  let skipSync = false;
  let customMessage = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") isDryRun = true;
    else if (arg === "--no-test") skipTest = true;
    else if (arg === "--no-build") skipBuild = true;
    else if (arg === "--no-sync") skipSync = true;
    else if (arg === "--message" || arg === "-m") {
      customMessage = args[++i] || "";
    } else if (!arg.startsWith("-")) {
      bumpType = arg;
    }
  }

  const pkgJsonPath = path.join(BAS_ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
  const currentVersion = pkg.version;
  const nextVersion = calculateNextVersion(currentVersion, bumpType);

  console.log(`\n=======================================================`);
  console.log(`🚀 bas71 Release Pipeline: v${currentVersion} -> v${nextVersion} (${bumpType})`);
  console.log(`=======================================================\n`);

  if (isDryRun) {
    console.log(`[DRY RUN] Would update version in package.json to ${nextVersion}`);
    return;
  }

  // 1. Update package.json
  pkg.version = nextVersion;
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  console.log(`✅ Updated ${path.relative(BAS_ROOT, pkgJsonPath)} to ${nextVersion}`);

  // 2. Update CHANGELOG.md
  const changelogPath = path.join(BAS_ROOT, "CHANGELOG.md");
  updateChangelog(changelogPath, nextVersion, bumpType, customMessage, isDryRun);
  console.log(`✅ Updated ${path.relative(BAS_ROOT, changelogPath)}`);

  // 3. Verification (typecheck and tests)
  if (!skipTest) {
    console.log(`\n🔍 Verifying codebase integrity...`);
    try {
      runCommand("npm run typecheck", BAS_ROOT);
      runCommand("npm test", BAS_ROOT);
      runCommand("npm run check:line-budgets", BAS_ROOT);
      runCommand("npm run project-check", BAS_ROOT);
      console.log(`✅ Codebase verification passed.`);
    } catch {
      console.error(`\n❌ Validation failed! Reverting package.json...`);
      pkg.version = currentVersion;
      fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
      process.exit(1);
    }
  }

  // 4. Build
  if (!skipBuild) {
    console.log(`\n🔨 Building bundles...`);
    runCommand("npm run build", BAS_ROOT);
    console.log(`✅ Distribution bundles generated.`);
  }

  // 5. Client consumer update & cross-repo sync
  if (!skipSync) {
    // Pack and update mockapix vendor tgz
    if (fs.existsSync(MOCKAPIX_ROOT)) {
      try {
        console.log(`📦 Packing bas71 for mockapix...`);
        const vendorDir = path.join(MOCKAPIX_ROOT, "vendor");
        if (fs.existsSync(vendorDir)) {
          for (const f of fs.readdirSync(vendorDir)) {
            if (f.startsWith("viafactory-browser-addon-stand-") && f.endsWith(".tgz")) {
              fs.unlinkSync(path.join(vendorDir, f));
            }
            if (f.startsWith("bas71-") && f.endsWith(".tgz")) {
              fs.unlinkSync(path.join(vendorDir, f));
            }
          }
        }
        runCommand(`npm pack ${BAS_ROOT} --pack-destination ${vendorDir}`, BAS_ROOT);
        console.log(`✅ Packed bas71 into ${vendorDir}`);
      } catch (err) {
        console.warn(`⚠️ Warning: Failed to pack for mockapix:`, err.message);
      }
    }
  }

  console.log(`\n=======================================================`);
  console.log(`🎉 RELEASE SUCCESSFUL: bas71 v${nextVersion}`);
  console.log(`=======================================================`);
  console.log(`Next step to commit:`);
  console.log(`  git add .`);
  console.log(`  git commit -m "chore(bas71): release v${nextVersion}"`);
  console.log(`=======================================================\n`);
}

main().catch((err) => {
  console.error("Release script fatal error:", err);
  process.exit(1);
});
