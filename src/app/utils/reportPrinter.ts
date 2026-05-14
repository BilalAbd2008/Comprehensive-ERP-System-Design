/**
 * Print/Download Utility Functions
 * Untuk laporan BalanceSheet, ProfitLoss, TrialBalance
 */

export const printReport = (elementId: string, reportTitle: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Elemen laporan tidak ditemukan");
    return;
  }

  const originalContent = document.body.innerHTML;
  const printContent = element.innerHTML;

  document.body.innerHTML = `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #212529;
            background-color: white;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            table { page-break-inside: avoid; }
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #DEE2E6;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #F8F9FA;
            font-weight: 600;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .print-header h1 {
            margin: 0 0 5px 0;
            font-size: 18px;
            color: #1B4332;
          }
          .print-header p {
            margin: 0;
            font-size: 12px;
            color: #6C757D;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>${reportTitle}</h1>
          <p>Printed: ${new Date().toLocaleString("id-ID")}</p>
        </div>
        ${printContent}
      </body>
    </html>
  `;

  window.print();
  document.body.innerHTML = originalContent;
};

export const downloadPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Elemen laporan tidak ditemukan");
    return;
  }

  try {
    // Import libraries (use explicit ESM builds so Vite resolves them)
    const html2canvas = (await import("html2canvas/dist/html2canvas.esm.js"))
      .default;
    const { jsPDF } = await import("jspdf/dist/jspdf.es.js");

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF("p", "mm", "A4");
    let position = 0;

    const imgData = canvas.toDataURL("image/png");

    while (heightLeft >= 0) {
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;
      if (heightLeft >= 0) {
        pdf.addPage();
      }
    }

    pdf.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Gagal membuat PDF. Silakan coba lagi.");
  }
};

export const previewPDF = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Elemen laporan tidak ditemukan");
    return;
  }

  try {
    const html2canvas = (await import("html2canvas/dist/html2canvas.esm.js"))
      .default;
    const { jsPDF } = await import("jspdf/dist/jspdf.es.js");

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF("p", "mm", "A4");
    let position = 0;

    const imgData = canvas.toDataURL("image/png");

    while (heightLeft >= 0) {
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;
      if (heightLeft >= 0) {
        pdf.addPage();
      }
    }

    // Open PDF in new tab
    const pdfDataUrl = pdf.output("datauristring");
    window.open(pdfDataUrl);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Gagal membuat PDF. Silakan coba lagi.");
  }
};

export const copyToClipboard = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const text = element.innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert("Laporan disalin ke clipboard");
  });
};
