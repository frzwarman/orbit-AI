export function supportsWebGL(documentRef: Document = document): boolean {
  try {
    const view = documentRef.defaultView;
    if (!view || !("WebGLRenderingContext" in view)) return false;
    const canvas = documentRef.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
