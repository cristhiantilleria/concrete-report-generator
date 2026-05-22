import { useEffect, useRef, useState } from 'react'
import FormPanel from './components/FormPanel.jsx'
import HrfReport from './components/HrfReport.jsx'
import { callClaudeAPI, generateFallbackSections } from './lib/api.js'
import { downloadDocx } from './lib/docxGenerator.js'

const DEFAULT_FORM = {
  projectAddress: '623 EAST 178th ST, BRONX, NY 10457',
  inspDate: '2026-05-12',
  weather: 'CLOUDY 60°F',
  dobNo: 'X01273665-S4',
  floorLocation: '6TH FLOOR SLAB',
  inspType: 'REBAR INSPECTION AND CONCRETE PLACEMENT SUPERVISION',
  refDrawings: 'RS03-1 – RS03-2 – RS03-3 – RS03-4',
  inspectorName: 'Marcos Machuca',
  leadInspector: 'Fahad Fateh, PE',
  areasInspected: [
    '6th Floor slab',
    'Stair A & Stair B (3rd to 4th Floor transition)',
    'Prepared slab floor and supporting surfaces',
    'Reinforcing steel installation',
    'Concrete placement operations associated with slab and stair construction',
  ],
  stairDetails: '3rd to 4th Floor transition',
  slabConditions: [
    'Properly graded',
    'Uniformly compacted',
    'Free of visibly unsuitable material, excessive loose soil, and standing water',
  ],
  compaction: '95%',
  slabThickness: '8 inches',
  bottomRebar: '#4 reinforcing bars @ 12" o.c. E-W and N-S',
  topRebar: '#5 reinforcing bars at top reinforcement and additional reinforcing zones',
  steelGrade: 'ASTM A615 Grade 60',
  concStrength: '5,000 psi',
  rebarConditions: [
    'Properly supported on chairs prior to concrete placement',
    'Adequately tied and secured',
    'Maintained at proper spacing during placement operations',
    'Free of excessive displacement',
    'Clean and properly tied',
    'Properly aligned in accordance with approved structural drawings',
  ],
  rebarNotes: 'Additional reinforcing observed at slab perimeter, openings, and beam/slab interface zones per approved drawings.',
  supplier: 'Gotham Ready Mix',
  concType: 'Normal-weight',
  quantity: '170+',
  mixDesign: 'TR-3',
  inspStatus: 'WORK IN CONFORMANCE',
  remarks: 'All work observed to be in general conformance with approved structural drawings and NYC Building Code requirements.',
}

const LOADING_MSGS = [
  'Analyzing data...',
  'Composing observations...',
  'Formatting...',
  'Embedding photos...',
]

export default function App() {
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [uploadedImages, setUploadedImages] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingText, setLoadingText] = useState(LOADING_MSGS[0])
  const [report, setReport] = useState(null) // { data, sections, apiError }
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState('📄 Download .docx')
  const previewRef = useRef(null)

  // Cycle loading messages
  useEffect(() => {
    if (!isGenerating) return
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length
      setLoadingText(LOADING_MSGS[i])
    }, 1500)
    return () => clearInterval(interval)
  }, [isGenerating])

  // Scroll preview into view after report renders
  useEffect(() => {
    if (report && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [report])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setReport(null)
    setLoadingText(LOADING_MSGS[0])

    const snapshot = { ...formData }
    let sections
    let apiError = null
    try {
      sections = await callClaudeAPI(snapshot)
    } catch (err) {
      console.warn('API failed, using fallback:', err)
      apiError = err.message
      sections = generateFallbackSections(snapshot)
    }

    setReport({ data: snapshot, sections, apiError })
    setIsGenerating(false)
  }

  const handleSectionChange = (key, html) => {
    setReport((prev) => (prev ? { ...prev, sections: { ...prev.sections, [key]: html } } : prev))
  }

  const handleDownload = async () => {
    if (!report) return
    setIsDownloading(true)
    setDownloadStatus('Building .docx...')
    try {
      await downloadDocx(report.data, report.sections, uploadedImages)
      setDownloadStatus('✓ Downloaded!')
      setTimeout(() => setDownloadStatus('📄 Download .docx'), 2000)
    } catch (err) {
      console.error(err)
      alert('Error generating .docx: ' + err.message)
      setDownloadStatus('📄 Download .docx')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="logo">
          <div className="logo-dot" />
          INSPECTION REPORT GENERATOR
        </div>
        <div className="header-right">
          <span>HRF Services Corp · v0.2</span>
          <span className="status-badge ready">READY</span>
        </div>
      </header>

      <div className="app-body">
        <FormPanel
          formData={formData}
          setFormData={setFormData}
          uploadedImages={uploadedImages}
          setUploadedImages={setUploadedImages}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        <div className="preview-panel">
          <div className="preview-header">
            <span className="panel-title">HRF Template Preview</span>
            <div className="preview-actions">
              <button
                className="btn-sm primary"
                onClick={handleDownload}
                disabled={!report || isDownloading}
              >
                {downloadStatus}
              </button>
              <button className="btn-sm" onClick={() => window.print()}>Print PDF</button>
            </div>
          </div>

          <div className="preview-scroll" ref={previewRef}>
            {!isGenerating && !report && (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-text">Complete the form to generate report</div>
              </div>
            )}

            {isGenerating && (
              <div className="loading-state visible">
                <div className="loader">
                  <div className="loader-bar" />
                  <div className="loader-bar" />
                  <div className="loader-bar" />
                  <div className="loader-bar" />
                  <div className="loader-bar" />
                </div>
                <div className="loading-text">{loadingText}</div>
              </div>
            )}

            {report && !isGenerating && (
              <div id="reportContainer" className="visible">
                <div className="edit-hint">
                  ✎ Click any section below to edit. Changes are included in the PDF and .docx exports.
                </div>
                <HrfReport
                  data={report.data}
                  sections={report.sections}
                  uploadedImages={uploadedImages}
                  apiError={report.apiError}
                  onSectionChange={handleSectionChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
