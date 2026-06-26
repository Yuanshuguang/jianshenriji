import { createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const sourceJsonUrl = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
const sourceAssetBaseUrl = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
const sharedLibraryDir = path.join(repoRoot, "shared/data/exercise-library");
const publicLibraryDir = path.join(repoRoot, "apps/mobile/public/exercise-library");
const publicVideoDir = path.join(publicLibraryDir, "videos");
const manifestPath = path.join(sharedLibraryDir, "manifest.json");
const publicManifestPath = path.join(publicLibraryDir, "manifest.json");
const reportPath = path.join(sharedLibraryDir, "sync-report.json");
const concurrency = Number(process.env.EXERCISE_SYNC_CONCURRENCY ?? 8);

async function main() {
  await mkdir(sharedLibraryDir, { recursive: true });
  await mkdir(publicVideoDir, { recursive: true });

  const sourceItems = await fetchJson(sourceJsonUrl);
  const manifestItems = sourceItems.map((item, index) => normalizeItem(item, index));

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  await runPool(manifestItems, concurrency, async (item) => {
    if (!item.gif_url || !item.remote_gif_url) return;
    const outputPath = path.join(publicVideoDir, path.basename(item.gif_url));
    if (await existsWithContent(outputPath)) {
      skipped += 1;
      return;
    }
    try {
      await downloadFile(item.remote_gif_url, outputPath);
      downloaded += 1;
    } catch (error) {
      failed += 1;
      console.warn(`[exercise-library] failed ${item.id}: ${error.message}`);
    }
  });

  const manifest = {
    source: "hasaneyldrm/exercises-dataset",
    sourceUrl: "https://github.com/hasaneyldrm/exercises-dataset",
    usage: "internal-test-non-commercial",
    syncedAt: new Date().toISOString(),
    itemCount: manifestItems.length,
    items: manifestItems.map(({ remote_gif_url, ...item }) => item)
  };
  const report = {
    ...manifest,
    items: undefined,
    downloaded,
    skipped,
    failed,
    publicVideoDir
  };

  await writeJson(manifestPath, manifest);
  await writeJson(publicManifestPath, manifest);
  await writeJson(reportPath, report);
  console.log(`[exercise-library] items=${manifestItems.length} downloaded=${downloaded} skipped=${skipped} failed=${failed}`);
  console.log(`[exercise-library] manifest=${manifestPath}`);
  console.log(`[exercise-library] public=${publicManifestPath}`);
}

function normalizeItem(item, index) {
  const sourceId = String(item.id ?? `research-gif-${index}`);
  const gifFile = item.gif_url ? path.basename(item.gif_url) : "";
  return {
    id: sourceId,
    name: item.name ?? "Unnamed Exercise",
    category: item.category ?? null,
    body_part: item.body_part ?? null,
    equipment: item.equipment ?? null,
    target: item.target ?? null,
    muscle_group: item.muscle_group ?? null,
    secondary_muscles: Array.isArray(item.secondary_muscles) ? item.secondary_muscles : [],
    gif_url: gifFile ? `/exercise-library/videos/${gifFile}` : null,
    remote_gif_url: item.gif_url ? `${sourceAssetBaseUrl}${item.gif_url}` : null,
    instruction_steps: item.instruction_steps?.en ? { en: item.instruction_steps.en } : undefined,
    instructions: item.instructions?.en ? { en: item.instructions.en } : undefined
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.json();
}

async function existsWithContent(filePath) {
  try {
    const info = await stat(filePath);
    return info.size > 0;
  } catch {
    return false;
  }
}

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status} ${url}`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await pipeline(response.body, createWriteStream(outputPath));
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function runPool(items, limit, worker) {
  let index = 0;
  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

main().catch(async (error) => {
  console.error(error);
  try {
    const existing = await readFile(reportPath, "utf8");
    console.error(existing);
  } catch {
    // no previous report
  }
  process.exitCode = 1;
});
