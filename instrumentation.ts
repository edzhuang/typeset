export function register() {
  // Node.js 22+ provides a built-in localStorage global via --localstorage-file.
  // When Turbopack passes this flag without a valid path, it creates a broken
  // localStorage object where methods like getItem are not functions.
  // This crashes any library that accesses localStorage on the server (e.g. next-themes).
  if (
    typeof globalThis.localStorage !== "undefined" &&
    typeof globalThis.localStorage.getItem !== "function"
  ) {
    // @ts-expect-error — removing the broken global so libraries fall back to their server-side guards
    globalThis.localStorage = undefined;
  }
}
