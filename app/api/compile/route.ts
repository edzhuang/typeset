import { NextRequest } from "next/server";
import { spawn } from "node:child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir, platform } from "os";

export async function POST(request: NextRequest) {
  const baseDir = process.env.VERCEL ? "/tmp" : tmpdir();

  const body = await request.json();
  const content = Buffer.from(body.content);
  const srcPath = join(baseDir, "input.tex");
  await fs.writeFile(srcPath, content);

  const outDir = join(baseDir, "out");
  await fs.mkdir(outDir, { recursive: true });

  const cacheDir = join(baseDir, "cache");
  await fs.mkdir(cacheDir, { recursive: true });

  let tectonicName: string;
  if (platform() === "win32") {
    tectonicName = "tectonic-windows.exe";
  } else {
    tectonicName = "tectonic-linux";
  }
  const tectonicPath = join(process.cwd(), "bin", tectonicName);
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
      "Content-Disposition": 'inline; filename="output.pdf"',
    },
  });
}
