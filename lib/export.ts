export async function exportPoster(element: HTMLElement, filename: string) {
  const h2c = (await import('html2canvas')).default;
  const canvas = await h2c(element, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/jpeg', 0.95);
  link.click();
}
