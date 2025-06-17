import { NextRequest } from "next/server";
import { spawn } from "node:child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return new Response("No file provided", { status: 400 });
  }

  const baseDir = process.env.VERCEL ? "/tmp" : tmpdir();

  const srcPath = join(baseDir, "input.tex");
  await fs.writeFile(srcPath, Buffer.from(await file.arrayBuffer()));

  const outDir = join(baseDir, "out");
  await fs.mkdir(outDir, { recursive: true });

  const cacheDir = join(baseDir, "cache");
  await fs.mkdir(cacheDir, { recursive: true });

  const tectonicPath = join(process.cwd(), "bin", "tectonic");
  const proc = spawn(
    tectonicPath,
    ["-X", "compile", srcPath, "--outdir", outDir, "--synctex=false"],
    {
      env: {
        ...process.env,
        HOME: baseDir,
        XDG_CACHE_HOME: cacheDir,
        TECTONIC_CACHE_DIR: cacheDir,
        TEXMFVAR: cacheDir,
      },
    }
  );

  let stderr = "";
  proc.stderr.on("data", (d) => (stderr += d));
  const exitCode: number = await new Promise((res) => proc.on("close", res));
  if (exitCode !== 0) {
    return new Response(stderr || "Compilation failed.", { status: 500 });
  }

  const pdf = await fs.readFile(join(outDir, "input.pdf"));
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="output.pdf"',
    },
  });
}
