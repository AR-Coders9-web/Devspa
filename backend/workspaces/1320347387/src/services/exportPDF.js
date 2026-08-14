import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export async function exportReportPDF(
  elementId,
  startupName = "Startup"
) {
  try {
    const element = document.getElementById(elementId);

    if (!element) {
      alert("Report not found.");
      return;
    }

    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#030712",
      skipFonts: false,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const img = new Image();

    img.src = dataUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const imgWidth = pdfWidth;
    const imgHeight = (img.height * imgWidth) / img.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(
      dataUrl,
      "PNG",
      0,
      position,
      imgWidth,
      imgHeight,
      "",
      "FAST"
    );

    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;

      pdf.addPage();

      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight,
        "",
        "FAST"
      );

      heightLeft -= pdfHeight;
    }

    pdf.save(`${startupName}-AI-Report.pdf`);
  } catch (err) {
    console.error(err);
    alert("Failed to export PDF.");
  }
}