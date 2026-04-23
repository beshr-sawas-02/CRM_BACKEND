import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  async exportVisitsToExcel(visits: any[], agentName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CRM Exhibitions';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('الزيارات', {
      properties: { tabColor: { argb: '2563EB' } },
      views: [{ rightToLeft: true }],
    });

    // Header styling
    const headerFill: ExcelJS.FillPattern = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A5F' },
    };
    const headerFont: Partial<ExcelJS.Font> = {
      color: { argb: 'FFFFFF' },
      bold: true,
      size: 12,
    };

    sheet.columns = [
      { header: 'اسم الشركة', key: 'companyName', width: 25 },
      { header: 'المسؤول', key: 'contactPerson', width: 20 },
      { header: 'الهاتف', key: 'phone', width: 15 },
      { header: 'المدينة', key: 'city', width: 15 },
      { header: 'نوع النشاط', key: 'businessType', width: 20 },
      { header: 'الحالة', key: 'status', width: 15 },
      { header: 'ملخص الزيارة', key: 'summary', width: 40 },
      { header: 'المندوب', key: 'agentName', width: 20 },
      { header: 'تاريخ الزيارة', key: 'visitDate', width: 15 },
      { header: 'وقت الزيارة', key: 'visitTime', width: 12 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: '2563EB' } },
      };
    });
    headerRow.height = 30;

    const statusMap: Record<string, string> = {
      interested: '✅ مهتم',
      follow_up: '🔄 متابعة لاحقاً',
      not_interested: '❌ غير مهتم',
    };

    const statusColors: Record<string, string> = {
      interested: 'D1FAE5',
      follow_up: 'FEF3C7',
      not_interested: 'FEE2E2',
    };

    visits.forEach((visit, idx) => {
      const row = sheet.addRow({
        companyName: visit.companyName,
        contactPerson: visit.contactPerson,
        phone: visit.phone,
        city: visit.city,
        businessType: visit.businessType,
        status: statusMap[visit.status] || visit.status,
        summary: visit.summary,
        agentName: visit.agentName,
        visitDate: visit.visitDate ? new Date(visit.visitDate).toLocaleDateString('ar-SA') : '',
        visitTime: visit.visitTime,
      });

      // Alternate row colors
      const bgColor = idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
      });

      // Status cell special color
      const statusCell = row.getCell('status');
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusColors[visit.status] || 'FFFFFF' },
      };
      statusCell.alignment = { horizontal: 'center', vertical: 'middle' };

      row.height = 25;
    });

    // Summary row
    sheet.addRow([]);
    const summaryRow = sheet.addRow([
      `إجمالي الزيارات: ${visits.length}`,
      '',
      '',
      '',
      '',
      `مهتم: ${visits.filter(v => v.status === 'interested').length}`,
      `متابعة: ${visits.filter(v => v.status === 'follow_up').length}`,
      `غير مهتم: ${visits.filter(v => v.status === 'not_interested').length}`,
      '',
      '',
    ]);
    summaryRow.font = { bold: true };
    summaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } };

    // Title above table
    sheet.spliceRows(1, 0, []);
    const titleRow = sheet.getRow(1);
    sheet.mergeCells('A1:J1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `تقرير زيارات - ${agentName}  |  تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`;
    titleCell.font = { bold: true, size: 14, color: { argb: '1E3A5F' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
    titleRow.height = 35;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
