import { SHARE_FORMATS } from "./brand.js";

/**
 * Capture a DOM node as PNG and trigger download (for screenshots / stories).
 * @param {HTMLElement} element
 * @param {{ formatId?: string, filename?: string }} [options]
 */
export async function downloadShareCardImage(element, options = {}) {
  const format = SHARE_FORMATS[options.formatId] || SHARE_FORMATS.feed;
  const filename = options.filename || `halal-kitchen-${format.id}.png`;

  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "position:fixed;left:-9999px;top:0;z-index:-1;pointer-events:none;";
  document.body.appendChild(wrapper);

  const clone = element.cloneNode(true);
  clone.style.width = `${format.width}px`;
  clone.style.height = `${format.height}px`;
  clone.style.maxWidth = "none";
  clone.style.aspectRatio = "unset";
  wrapper.appendChild(clone);

  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(clone, {
      width: format.width,
      height: format.height,
      scale: 1,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
    if (!blob) throw new Error("Could not create image");

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } finally {
    document.body.removeChild(wrapper);
  }
}

/**
 * Copy canvas to clipboard when supported (mobile varies).
 */
export async function copyShareCardImage(element, options = {}) {
  const format = SHARE_FORMATS[options.formatId] || SHARE_FORMATS.square;
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:-9999px;top:0;";
  document.body.appendChild(wrapper);
  const clone = element.cloneNode(true);
  clone.style.width = `${format.width}px`;
  clone.style.height = `${format.height}px`;
  wrapper.appendChild(clone);

  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(clone, {
      width: format.width,
      height: format.height,
      scale: 1,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
    if (!blob || !navigator.clipboard?.write) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(wrapper);
  }
}
