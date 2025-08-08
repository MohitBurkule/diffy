import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportElementToPDF(element: HTMLElement, filename = 'diff-report.pdf') {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background') || '#111827'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Calculate dimensions while preserving aspect ratio
  const imgWidth = pageWidth - 40; // margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let position = 20;
  let heightLeft = imgHeight;

  pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add extra pages as needed
  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 20;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
