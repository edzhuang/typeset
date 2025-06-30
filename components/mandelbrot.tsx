// Mandelbrot set React component
import React, { useRef, useEffect } from "react";

// Canvas dimensions and Mandelbrot parameters
const WIDTH = 600;
const HEIGHT = 400;
const MAX_ITER = 100;

// Helper: Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number, k = (n + h / 60) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255].map(Math.round) as [
    number,
    number,
    number
  ];
}

// Helper function to determine the color for each point based on iteration count
function mandelbrotColor(iter: number, maxIter: number) {
  if (iter === maxIter) return "#000"; // Points inside the set are black
  // Use hue cycling for vibrant colors
  const hue = (360 * iter) / maxIter;
  const sat = 1.0;
  const val = iter < maxIter ? 1.0 : 0;
  const [r, g, b] = hsvToRgb(hue, sat, val);
  return `rgb(${r},${g},${b})`;
}

// Main Mandelbrot component
export const Mandelbrot: React.FC = () => {
  // Reference to the canvas DOM element
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Create an ImageData object to manipulate pixel data directly
    const img = ctx.createImageData(WIDTH, HEIGHT);
    // Loop over every pixel in the canvas
    for (let x = 0; x < WIDTH; x++) {
      for (let y = 0; y < HEIGHT; y++) {
        // Map pixel coordinates to the complex plane
        const cx = ((x - WIDTH / 2) * 4) / WIDTH;
        const cy = ((y - HEIGHT / 2) * 4) / WIDTH;
        let zx = 0,
          zy = 0,
          iter = 0;
        // Iterate the Mandelbrot formula: z = z^2 + c
        while (zx * zx + zy * zy < 4 && iter < MAX_ITER) {
          const xt = zx * zx - zy * zy + cx;
          zy = 2 * zx * zy + cy;
          zx = xt;
          iter++;
        }
        // Get the color for this pixel
        const color = mandelbrotColor(iter, MAX_ITER);
        // Parse the rgb color string into components
        const [r, g, b] = color.match(/\d+/g)!.map(Number);
        // Set the pixel data in the ImageData object
        const idx = 4 * (y * WIDTH + x);
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255; // Alpha channel (fully opaque)
      }
    }
    // Draw the computed image to the canvas
    ctx.putImageData(img, 0, 0);
  }, []); // Run once on mount

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Mandelbrot Set</h2>
      {/* Canvas for rendering the Mandelbrot set */}
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: "1px solid #ccc" }}
      />
    </div>
  );
};
