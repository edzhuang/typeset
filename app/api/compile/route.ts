import { NextRequest } from "next/server";
import { spawn } from "node:child_process";
import { promises as fs } from "fs";
import { join } from "path";
import os from "os";

export async function POST(request: NextRequest) {
  const baseDir = os.tmpdir();

  try {
    const body = await request.json();
    const content = Buffer.from(body.content);
    const srcPath = join(baseDir, "input.tex");
    await fs.writeFile(srcPath, content);

    const outDir = join(baseDir, "out");
    await fs.mkdir(outDir, { recursive: true });

    const cacheDir = join(baseDir, "cache");
    await fs.mkdir(cacheDir, { recursive: true });

    const linuxTectonicPath = join(process.cwd(), "bin", "tectonic");
    const windowsTectonicPath = join(process.cwd(), "bin", "tectonic.exe");
    const tectonicPath =
      process.platform === "win32" ? windowsTectonicPath : linuxTectonicPath;
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
      // Return structured error response
      return new Response(
        JSON.stringify({
          error: true,
          message: stderr || "Unknown compilation error",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const pdf = await fs.readFile(join(outDir, "input.pdf"));
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="output.pdf"',
      },
    });
  } catch (error) {
    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
