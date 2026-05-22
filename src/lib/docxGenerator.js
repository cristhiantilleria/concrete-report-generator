import {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, Header, Footer,
  PageNumber, ExternalHyperlink, VerticalAlign,
} from 'docx'
import { saveAs } from 'file-saver'
import { getHrfLogoArrayBuffer } from '../logo.js'

function htmlToDocxParagraphs(html) {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  const paragraphs = []

  function processList(ul, level = 0) {
    Array.from(ul.children).forEach((li) => {
      if (li.tagName !== 'LI') return
      const textNodes = []
      const subLists = []
      Array.from(li.childNodes).forEach((c) => {
        if (c.tagName === 'UL') subLists.push(c)
        else textNodes.push(c.textContent || '')
      })
      const text = textNodes.join('').trim()
      if (text) {
        paragraphs.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 360 + level * 360 },
          children: [
            new TextRun({ text: (level === 0 ? '• ' : '– ') + text, size: 22, font: 'Times New Roman' }),
          ],
        }))
      }
      subLists.forEach((sub) => processList(sub, level + 1))
    })
  }

  Array.from(wrapper.children).forEach((node) => {
    if (node.tagName === 'P') {
      paragraphs.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: node.textContent, size: 22, font: 'Times New Roman' })],
      }))
    } else if (node.tagName === 'UL') {
      processList(node)
    }
  })
  return paragraphs
}

export async function downloadDocx(data, sections, uploadedImages) {
  const logoBuffer = await getHrfLogoArrayBuffer()

  const blackBorder = { style: BorderStyle.SINGLE, size: 8, color: '000000' }
  const blackBorders = { top: blackBorder, bottom: blackBorder, left: blackBorder, right: blackBorder }
  const noneBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const noBorders = { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder }
  const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 }

  const dateObj = new Date(data.inspDate + 'T12:00:00')
  const dateStr = dateObj
    .toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    .replace(/\//g, '.')

  const header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({
          data: logoBuffer,
          transformation: { width: 720, height: 113 },
          type: 'jpg',
        })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({ text: '1766 BROADWAY, HEWLETT, NY 11557', bold: true, color: '002060', size: 18, font: 'Times New Roman' }),
          new TextRun({ text: '         TEL: 718-593-9460         FAX: 914-227-2414         E: ', bold: true, color: '002060', size: 18, font: 'Times New Roman' }),
          new ExternalHyperlink({
            link: 'mailto:sialab@hrf.nyc',
            children: [new TextRun({ text: 'SIALAB@HRF.NYC', bold: true, color: '0000FF', underline: {}, size: 18, font: 'Times New Roman' })],
          }),
          new TextRun({ text: '         W: ', bold: true, color: '002060', size: 18, font: 'Times New Roman' }),
          new ExternalHyperlink({
            link: 'http://www.hrf.nyc',
            children: [new TextRun({ text: 'WWW.HRF.NYC', bold: true, color: '0000FF', underline: {}, size: 18, font: 'Times New Roman' })],
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 120 },
        children: [new TextRun({ text: 'DOB SIA NO: 005616 & DOB LAB NO: 000119', bold: true, color: '002060', size: 18, font: 'Times New Roman' })],
      }),
    ],
  })

  const footer = new Footer({
    children: [
      new Paragraph({
        spacing: { before: 0, after: 120 },
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({
          text: 'HRF Services Corp is on the site solely to observe/identify operations, observe conformance with contract documents/specifications and report those daily findings to the client. This report relates only to the items and/or exact test and/or inspected located and is confidential property of HRF services and its client(s). Information contained in this report may NOT be published or reproduced without written permission from the HRF Services.',
          bold: true, size: 14, font: 'Times New Roman',
        })],
      }),
      new Table({
        width: { size: 10800, type: WidthType.DXA },
        columnWidths: [5400, 5400],
        borders: noBorders,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 5400, type: WidthType.DXA },
                borders: noBorders,
                children: [new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: 'Revision No. 1: 6/13/2019', italics: true, size: 18, font: 'Times New Roman' })],
                })],
              }),
              new TableCell({
                width: { size: 5400, type: WidthType.DXA },
                borders: noBorders,
                children: [new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: 'Page | ', italics: true, size: 18, font: 'Times New Roman' }),
                    new TextRun({ children: [PageNumber.CURRENT], italics: true, size: 18, font: 'Times New Roman' }),
                  ],
                })],
              }),
            ],
          }),
        ],
      }),
    ],
  })

  const infoRows = [
    ['Project Address:', data.projectAddress + '.'],
    ['Inspection type:', data.inspType],
    ['Date:', dateStr],
    ['Weather Condition:', data.weather, '2E74D9'],
    ['Reference Drawing:', 'APPROVED STRUCTURAL DRAWING'],
    ['Reference Detail:', data.refDrawings + '.'],
    ['Inspected Locations:', data.floorLocation + '.'],
    ['Related DOB No:', data.dobNo],
    ['Inspection Status:', data.inspStatus],
  ]

  const infoTable = new Table({
    width: { size: 10800, type: WidthType.DXA },
    columnWidths: [3600, 7200],
    rows: infoRows.map((row) => new TableRow({
      children: [
        new TableCell({
          width: { size: 3600, type: WidthType.DXA },
          borders: blackBorders,
          margins: cellMargins,
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: row[0], bold: true, size: 22, font: 'Arial' })],
          })],
        }),
        new TableCell({
          width: { size: 7200, type: WidthType.DXA },
          borders: blackBorders,
          margins: cellMargins,
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            children: [new TextRun({ text: row[1] || '', size: 22, font: 'Arial', color: row[2] || '000000' })],
          })],
        }),
      ],
    })),
  })

  function sectionHeading(text) {
    return new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text, bold: true, size: 22, font: 'Times New Roman' })],
    })
  }

  const chapterBar = new Table({
    width: { size: 10800, type: WidthType.DXA },
    columnWidths: [3600, 7200],
    borders: {
      top: blackBorder, bottom: blackBorder, left: blackBorder, right: blackBorder,
      insideHorizontal: noneBorder, insideVertical: noneBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3600, type: WidthType.DXA },
            shading: { fill: 'FFFFCC', type: ShadingType.CLEAR },
            borders: { top: blackBorder, bottom: blackBorder, left: blackBorder, right: noneBorder },
            margins: cellMargins,
            children: [new Paragraph({
              children: [new TextRun({ text: 'NYCBC & IBC', bold: true, size: 22, font: 'Arial' })],
            })],
          }),
          new TableCell({
            width: { size: 7200, type: WidthType.DXA },
            shading: { fill: 'FFFFCC', type: ShadingType.CLEAR },
            borders: { top: blackBorder, bottom: blackBorder, left: noneBorder, right: blackBorder },
            margins: cellMargins,
            children: [new Paragraph({
              children: [new TextRun({ text: 'Chapter 17 Structural Tests and Special Inspections', bold: true, size: 22, font: 'Arial' })],
            })],
          }),
        ],
      }),
    ],
  })

  const children = [
    chapterBar,
    new Paragraph({ children: [], spacing: { after: 120 } }),
    infoTable,
    sectionHeading('OBSERVATIONS:'),
    ...htmlToDocxParagraphs(sections.observations),
    sectionHeading('REFERENCE:'),
    ...htmlToDocxParagraphs(sections.reference),
    sectionHeading('AREA INSPECTED:'),
    ...htmlToDocxParagraphs(sections.areaInspected),
    sectionHeading(data.floorLocation + ' INSPECTION OBSERVATIONS:'),
    ...htmlToDocxParagraphs(sections.floorObservations),
    sectionHeading('REBAR INSPECTION OBSERVATIONS:'),
    ...htmlToDocxParagraphs(sections.rebarObservations),
    sectionHeading('CONCRETE PLACEMENT SUPERVISION:'),
    ...htmlToDocxParagraphs(sections.concreteSupervision),
    sectionHeading('GENERAL NOTE:'),
    ...htmlToDocxParagraphs(sections.generalNote),
  ]

  const statusChecks = {
    'WORK IN CONFORMANCE': [true, false, false, false],
    'WORK IN PROGRESS': [false, true, false, false],
    'NON-CONFORMANCE': [false, false, true, false],
    'FINAL INSPECTION': [false, false, false, true],
  }
  const checks = statusChecks[data.inspStatus] || [false, false, false, false]

  function remarkPara(checked, label, text) {
    return new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: (checked ? '☒ ' : '☐ '), size: 22, font: 'Arial' }),
        new TextRun({ text: label, bold: true, italics: true, size: 20, font: 'Times New Roman' }),
        new TextRun({ text: ' ' + text, size: 20, font: 'Times New Roman' }),
      ],
    })
  }

  children.push(
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: 'REMARKS (For locations noted above):', bold: true, italics: true, size: 22, font: 'Times New Roman' })],
    }),
    remarkPara(checks[0], 'Work in Conformance:', 'The inspected area was in conformance with the approved project drawings, specifications and building code requirements.'),
    remarkPara(checks[1], 'Work in progress:', 'The area under inspection was not completed during the time of visit – re-inspection is required.'),
    remarkPara(checks[2], 'Non-conformance:', 'The inspected area was found NOT in conformance with the approved project drawings, specifications and building code requirements – after correction of the work is performed a re-inspection is required.'),
    remarkPara(checks[3], 'Final Inspection:', 'For all items listed in the above composed report the inspected area(s) are in conformance with the approved project drawings and specifications.'),
    new Paragraph({
      spacing: { before: 120, after: 80 },
      children: [new TextRun({ text: '* To the best of my knowledge, work inspected was in accordance with the building department approved plans, specifications and applicable workmanship provisions of the NYC Building Code except as noted above.', italics: true, size: 20, font: 'Times New Roman' })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: '** My performance of this inspection is in accordance with HRF Services Corp conflict of interest requirements as defined in the Employee Policy. By signing this report, I certify that I have no affiliation which can cause any conflict of interest or impartiality regarding this project.', italics: true, size: 20, font: 'Times New Roman' })],
    }),
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({ text: 'Inspector Print Name: ', size: 22, font: 'Times New Roman' }),
        new TextRun({ text: data.inspectorName, bold: true, size: 22, font: 'Times New Roman' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Lead Inspector Name: ', size: 22, font: 'Times New Roman' }),
        new TextRun({ text: data.leadInspector, bold: true, size: 22, font: 'Times New Roman' }),
      ],
    }),
  )

  for (const img of uploadedImages) {
    children.push(new Paragraph({ children: [], pageBreakBefore: true }))
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [new ImageRun({
        data: img.arrayBuffer,
        transformation: { width: 480, height: Math.round((480 * img.height) / img.width) },
        type: 'jpg',
      })],
    }))
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Figure', bold: true, size: 20, font: 'Times New Roman' }),
        new TextRun({ text: ': ' + img.caption + '.', size: 20, font: 'Times New Roman' }),
      ],
    }))
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 22 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 2880, right: 720, bottom: 1440, left: 720, header: 720, footer: 720 },
        },
      },
      headers: { default: header },
      footers: { default: footer },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const filename = `HRF_Inspection_${data.inspDate}_${data.floorLocation.replace(/\s+/g, '_')}.docx`
  saveAs(blob, filename)
}
