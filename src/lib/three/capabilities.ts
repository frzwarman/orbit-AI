export function supportsWebGL(documentRef: Document = document): boolean {
  try {
    const view = documentRef.defaultView;
    return Boolean(view && ("WebGL2RenderingContext" in view || "WebGLRenderingContext" in view));
  } catch {
    return false;
  }
}
