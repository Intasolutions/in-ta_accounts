import api from '../api';

/**
 * Downloads or shares an invoice PDF reliably across desktop and mobile devices.
 * Solves iOS Safari and Android Chrome popup blocker issues and blob viewing failures.
 *
 * @param {number|string} invoiceId - Invoice ID
 * @param {object} meta - { client_name, project_name } for filename and share text
 * @param {object} options - { share: boolean }
 */
export const downloadInvoicePdf = async (invoiceId, meta = {}, { share = false } = {}) => {
  try {
    const response = await api.get(`invoices/${invoiceId}/download_pdf/?download=1`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const formattedId = meta.invoice_no || `INV-${String(invoiceId).padStart(3, '0')}`;
    const companyOrClient = meta.company_name || meta.client_name || meta.project_name || 'Invoice';
    const safeClient = companyOrClient.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
    const filename = `${formattedId}_${safeClient}.pdf`;

    // 1. Mobile Native Share Sheet (WhatsApp, Save to Files, AirDrop, etc.)
    if (share && typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Invoice ${formattedId}`,
            text: `Invoice ${formattedId} for ${meta.company_name || meta.client_name || meta.project_name || 'Client'}`
          });
          return { success: true, method: 'share' };
        }
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          return { success: true, method: 'cancelled' };
        }
        console.warn("Native share failed, falling back to direct download:", shareErr);
      }
    }

    // 2. Direct anchor download (works reliably on mobile browsers without popup blocker interference)
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    }, 60000);

    return { success: true, method: 'download' };
  } catch (error) {
    console.error('Error generating or downloading invoice PDF:', error);
    throw error;
  }
};

/**
 * Downloads or shares a Quotation PDF reliably across desktop and mobile devices.
 *
 * @param {number|string} quotationId - Quotation ID
 * @param {object} meta - { quote_no, client_name }
 * @param {object} options - { share: boolean }
 */
export const downloadQuotationPdf = async (quotationId, meta = {}, { share = false } = {}) => {
  try {
    const response = await api.get(`quotations/${quotationId}/download_pdf/?download=1`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const quoteNo = meta.quote_no || `QT-${quotationId}`;
    const safeClient = meta.client_name ? meta.client_name.replace(/[^a-zA-Z0-9]/g, '_') : 'Client';
    const filename = `${quoteNo}_${safeClient}.pdf`;

    // 1. Mobile Native Share Sheet (WhatsApp, Save to Files, AirDrop, etc.)
    if (share && typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Quotation ${quoteNo}`,
            text: `Quotation ${quoteNo} for ${meta.client_name || 'Client'}`
          });
          return { success: true, method: 'share' };
        }
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          return { success: true, method: 'cancelled' };
        }
        console.warn("Native share failed, falling back to direct download:", shareErr);
      }
    }

    // 2. Direct anchor download (works reliably on mobile without popup blockers)
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    }, 60000);

    return { success: true, method: 'download' };
  } catch (error) {
    console.error('Error generating or downloading quotation PDF:', error);
    throw error;
  }
};
