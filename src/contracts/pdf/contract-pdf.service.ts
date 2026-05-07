import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';
import { Contract } from '../contract.schema';

@Injectable()
export class ContractPdfService implements OnModuleDestroy {
  private readonly logger = new Logger(ContractPdfService.name);
  private browser: Browser | null = null;

  /// تشغيل الـ browser مرة واحدة وإعادة استخدامه (أسرع بكثير من فتحه كل مرة)
  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.logger.log('🚀 Launching Puppeteer browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--font-render-hinting=none',
        ],
      });
    }
    return this.browser;
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /// توليد PDF لعقد محدد
  async generateContractPdf(contract: Contract): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      const html = this.buildHtml(contract);

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // انتظار تحميل الخطوط
      await page.evaluateHandle('document.fonts.ready');

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 9px; width: 100%; text-align: center; color: #888; padding: 0 15mm;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
            &nbsp;&nbsp;-&nbsp;&nbsp;
            شركة Buildex لتنظيم المعارض
          </div>
        `,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  /// بناء الـ HTML من بيانات العقد
  private buildHtml(contract: Contract): string {
    const formatDate = (date: Date | string) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const formatNumber = (n: number) =>
      n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const currencyLabel = contract.currency === 'USD' ? 'دولار أمريكي' : 'ليرة سورية';
    const currencySymbol = contract.currency === 'USD' ? '$' : 'ل.س';

    const totalPaid = contract.payments
      .filter((p) => p.paid)
      .reduce((sum, p) => sum + p.amount, 0);
    const remaining = contract.totalAmount - totalPaid;

    // صفوف الدفعات
    const paymentsRows = contract.payments
      .map(
        (p, i) => `
        <tr class="${p.paid ? 'paid' : 'unpaid'}">
          <td class="num">${i + 1}</td>
          <td class="amount">${formatNumber(p.amount)} ${currencySymbol}</td>
          <td class="status">
            ${p.paid ? '✅ مدفوعة' : '⏳ غير مدفوعة'}
          </td>
          <td class="date">${p.paid && p.paidAt ? formatDate(p.paidAt) : '—'}</td>
        </tr>
      `,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>عقد رقم ${(contract as any)._id || ''}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Cairo', sans-serif;
    }

    body {
      color: #1F2937;
      background: white;
      direction: rtl;
      text-align: right;
      font-size: 12px;
      line-height: 1.6;
    }

    /* ====== Header ====== */
    .header {
      background: linear-gradient(135deg, #1E3A5F 0%, #2C5580 100%);
      color: white;
      padding: 25px 30px;
      border-radius: 12px;
      margin-bottom: 25px;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -10%;
      width: 200px;
      height: 200px;
      background: rgba(212, 165, 116, 0.15);
      border-radius: 50%;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 20px;
      position: relative;
      z-index: 1;
    }

    .logo {
      width: 70px;
      height: 70px;
      background: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      flex-shrink: 0;
    }

    .header-title {
      flex: 1;
    }

    .header-title h1 {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 4px;
    }

    .header-title p {
      font-size: 13px;
      opacity: 0.9;
    }

    .header-meta {
      text-align: left;
      direction: ltr;
      background: rgba(255, 255, 255, 0.15);
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 11px;
    }

    .header-meta strong {
      display: block;
      font-size: 14px;
      margin-bottom: 2px;
    }

    /* ====== Section ====== */
    .section {
      margin-bottom: 22px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #F8FAFC;
      padding: 10px 16px;
      border-right: 4px solid #D4A574;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #1E3A5F;
      margin-bottom: 12px;
    }

    /* ====== Info Grid ====== */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 20px;
      padding: 14px 16px;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      background: #FFFFFF;
    }

    .info-item {
      display: flex;
      gap: 6px;
      padding: 6px 0;
      border-bottom: 1px dashed #F3F4F6;
    }

    .info-item:nth-last-child(1),
    .info-item:nth-last-child(2) {
      border-bottom: none;
    }

    .info-label {
      color: #6B7280;
      font-weight: 600;
      min-width: 100px;
    }

    .info-value {
      color: #1F2937;
      font-weight: 700;
      flex: 1;
    }

    /* ====== Amount Highlight ====== */
    .amount-card {
      background: linear-gradient(135deg, #D4A574 0%, #E6C49A 100%);
      color: white;
      padding: 20px 24px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .amount-card .label {
      font-size: 13px;
      opacity: 0.95;
      margin-bottom: 4px;
    }

    .amount-card .value {
      font-size: 32px;
      font-weight: 800;
    }

    .amount-card .currency {
      font-size: 14px;
      opacity: 0.9;
    }

    /* ====== Stats Row ====== */
    .stats-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }

    .stat-box {
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid #E5E7EB;
    }

    .stat-box.paid {
      background: #D1FAE5;
      border-color: #10B981;
    }

    .stat-box.remaining {
      background: #FEF3C7;
      border-color: #F59E0B;
    }

    .stat-box .stat-label {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .stat-box.paid .stat-label { color: #065F46; }
    .stat-box.remaining .stat-label { color: #92400E; }

    .stat-box .stat-value {
      font-size: 18px;
      font-weight: 800;
    }

    .stat-box.paid .stat-value { color: #065F46; }
    .stat-box.remaining .stat-value { color: #92400E; }

    /* ====== Payments Table ====== */
    table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #E5E7EB;
    }

    table thead {
      background: #1E3A5F;
      color: white;
    }

    table th {
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
    }

    table td {
      padding: 10px 12px;
      font-size: 12px;
      text-align: center;
      border-bottom: 1px solid #F3F4F6;
    }

    table tbody tr.paid {
      background: #F0FDF4;
    }

    table tbody tr.unpaid {
      background: #FFFFFF;
    }

    table td.num {
      font-weight: 800;
      color: #1E3A5F;
    }

    table td.amount {
      font-weight: 700;
      font-size: 13px;
    }

    table td.status {
      font-weight: 600;
    }

    tr.paid td.status { color: #065F46; }
    tr.unpaid td.status { color: #92400E; }

    /* ====== Notes ====== */
    .notes-box {
      background: #FFFBEB;
      border-right: 4px solid #F59E0B;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.8;
      color: #78350F;
    }

    .notes-box .notes-title {
      font-weight: 700;
      margin-bottom: 4px;
      color: #92400E;
    }

    /* ====== Signature ====== */
    .signatures {
      margin-top: 50px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      page-break-inside: avoid;
    }

    .signature-box {
      text-align: center;
      padding-top: 30px;
    }

    .signature-line {
      border-top: 2px solid #1F2937;
      width: 70%;
      margin: 0 auto 10px;
    }

    .signature-label {
      font-size: 12px;
      font-weight: 700;
      color: #1E3A5F;
      margin-bottom: 4px;
    }

    .signature-name {
      font-size: 11px;
      color: #6B7280;
    }

    /* ====== Stamp Placeholder ====== */
    .stamp-area {
      margin-top: 30px;
      padding: 14px;
      border: 2px dashed #D4A574;
      border-radius: 10px;
      text-align: center;
      color: #92400E;
      font-size: 11px;
      background: #FFFBEB;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="header-content">
      <div class="logo">🏢</div>
      <div class="header-title">
        <h1>عقد مشاركة في المعرض</h1>
        <p>شركة Buildex لتنظيم المعارض</p>
      </div>
      <div class="header-meta">
        <strong>تاريخ العقد</strong>
        ${formatDate(contract.contractDate)}
      </div>
    </div>
  </div>

  <!-- المبلغ الإجمالي -->
  <div class="amount-card">
    <div>
      <div class="label">المبلغ الإجمالي للعقد</div>
      <div class="value">${formatNumber(contract.totalAmount)} <span class="currency">${currencyLabel}</span></div>
    </div>
    <div style="text-align: left; direction: ltr; opacity: 0.95;">
      <div style="font-size: 11px;">عدد الدفعات</div>
      <div style="font-size: 24px; font-weight: 800;">${contract.payments.length}</div>
    </div>
  </div>

  <!-- إحصائيات الدفع -->
  <div class="stats-row">
    <div class="stat-box paid">
      <div class="stat-label">✓ المدفوع</div>
      <div class="stat-value">${formatNumber(totalPaid)} ${currencySymbol}</div>
    </div>
    <div class="stat-box remaining">
      <div class="stat-label">⏳ المتبقي</div>
      <div class="stat-value">${formatNumber(remaining)} ${currencySymbol}</div>
    </div>
  </div>

  <!-- بيانات الشركة -->
  <div class="section">
    <div class="section-title">📋 بيانات الشركة</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">اسم الشركة:</span>
        <span class="info-value">${contract.companyName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">صاحب الشركة:</span>
        <span class="info-value">${contract.ownerName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">رقم الهاتف:</span>
        <span class="info-value">${contract.ownerPhone}</span>
      </div>
      <div class="info-item">
        <span class="info-label">البريد:</span>
        <span class="info-value">${contract.email || '—'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">الرقم التجاري:</span>
        <span class="info-value">${contract.commercialNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">السجل التجاري:</span>
        <span class="info-value">${contract.commercialRegister}</span>
      </div>
      <div class="info-item" style="grid-column: 1 / -1;">
        <span class="info-label">نوع النشاط:</span>
        <span class="info-value">${contract.businessType}</span>
      </div>
    </div>
  </div>

  <!-- جدول الدفعات -->
  <div class="section">
    <div class="section-title">💰 جدول الدفعات</div>
    <table>
      <thead>
        <tr>
          <th style="width: 60px;">#</th>
          <th>المبلغ</th>
          <th>الحالة</th>
          <th>تاريخ الدفع</th>
        </tr>
      </thead>
      <tbody>
        ${paymentsRows}
      </tbody>
    </table>
  </div>

  ${
    contract.notes && contract.notes.trim()
      ? `
    <div class="section">
      <div class="notes-box">
        <div class="notes-title">📝 ملاحظات</div>
        ${contract.notes}
      </div>
    </div>
  `
      : ''
  }

  <!-- منطقة التواقيع -->
  <div class="signatures">
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-label">توقيع الطرف الأول</div>
      <div class="signature-name">شركة Buildex</div>
      <div class="signature-name">المندوب: ${contract.agentName}</div>
    </div>
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-label">توقيع الطرف الثاني</div>
      <div class="signature-name">${contract.companyName}</div>
      <div class="signature-name">${contract.ownerName}</div>
    </div>
  </div>

  <!-- منطقة الختم -->
  <div class="stamp-area">
    🔖 خاص بختم الشركة الرسمي
  </div>

</body>
</html>`;
  }
}