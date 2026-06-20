import jsPDF from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { Measurement } from '@/types'
import { formatDateShort } from '@/lib/utils'

export function exportToPdf(rows: Measurement[], title: string) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 16)
  doc.setFontSize(10)
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [
      [
        'Code',
        'Customer',
        'Phone',
        'Product',
        'L',
        'W',
        'H',
        'Unit',
        'Qty',
        'Date',
      ],
    ],
    body: rows.map((m) => [
      m.code,
      m.customerName,
      m.phoneNumber,
      m.productType,
      m.length,
      m.width,
      m.height,
      m.unit,
      m.quantity,
      formatDateShort(m.createdAt),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  })

  doc.save(`${slugify(title)}.pdf`)
}

export async function exportToExcel(rows: Measurement[], title: string) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Measurement App'
  wb.created = new Date()

  const ws = wb.addWorksheet('Measurements')
  ws.columns = [
    { header: 'Code', key: 'code', width: 12 },
    { header: 'Customer', key: 'customer', width: 24 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Product', key: 'product', width: 20 },
    { header: 'Length', key: 'length', width: 10 },
    { header: 'Width', key: 'width', width: 10 },
    { header: 'Height', key: 'height', width: 10 },
    { header: 'Unit', key: 'unit', width: 8 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Notes', key: 'notes', width: 32 },
    { header: 'Created', key: 'created', width: 14 },
    { header: 'Updated', key: 'updated', width: 14 },
  ]
  ws.getRow(1).font = { bold: true }

  for (const m of rows) {
    ws.addRow({
      code: m.code,
      customer: m.customerName,
      phone: m.phoneNumber,
      product: m.productType,
      length: m.length,
      width: m.width,
      height: m.height,
      unit: m.unit,
      quantity: m.quantity,
      notes: m.notes ?? '',
      created: formatDateShort(m.createdAt),
      updated: formatDateShort(m.updatedAt),
    })
  }

  const buf = await wb.xlsx.writeBuffer()
  saveAs(
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${slugify(title)}.xlsx`,
  )
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
