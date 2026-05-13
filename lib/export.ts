export async function exportPoster(element: HTMLElement, filename: string, scale = 3) {
  const h2c = (await import('html2canvas')).default;

  // Temporarily strip zoom transform so html2canvas captures native CSS pixels
  const parent = element.parentElement as HTMLElement | null;
  const origTransform = parent?.style.transform || '';
  const origTransformOrigin = parent?.style.transformOrigin || '';
  if (parent) {
    parent.style.transform = 'none';
    parent.style.transformOrigin = 'top left';
  }

  // Force render at actual CSS size (360px wide, not zoomed)
  const canvas = await h2c(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    imageTimeout: 15000,
    onclone: (doc, cloned) => {
      // Remove any studio UI overlays from the clone
      cloned.querySelectorAll('[data-studio-ui]').forEach(el => el.remove());
    },
  });

  // Restore zoom transform
  if (parent) {
    parent.style.transform = origTransform;
    parent.style.transformOrigin = origTransformOrigin;
  }

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/jpeg', 0.97);
  link.click();
}
