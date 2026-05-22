import { useRef, useState } from 'react'
import { processImageFiles, formatBytes } from '../lib/imageUtils.js'

const STEP_LABELS = [
  'Step 1 of 5 — Project Info',
  'Step 2 of 5 — Areas & Slab',
  'Step 3 of 5 — Rebar Details',
  'Step 4 of 5 — Concrete & Status',
  'Step 5 of 5 — Site Photos',
]

const AREA_OPTIONS = [
  '6th Floor slab',
  'Stair A & Stair B (3rd to 4th Floor transition)',
  'Prepared slab floor and supporting surfaces',
  'Reinforcing steel installation',
  'Concrete placement operations associated with slab and stair construction',
]

const AREA_LABELS = [
  'Floor Slab',
  'Stair A & B (transition)',
  'Prepared slab floor and supporting surfaces',
  'Reinforcing steel installation',
  'Concrete placement operations',
]

const SLAB_CONDITIONS = [
  ['Properly graded', 'Properly graded'],
  ['Uniformly compacted', 'Uniformly compacted'],
  ['Free of visibly unsuitable material, excessive loose soil, and standing water', 'Free of unsuitable material and water'],
]

const REBAR_CONDITIONS = [
  ['Properly supported on chairs prior to concrete placement', 'Properly supported on chairs'],
  ['Adequately tied and secured', 'Adequately tied and secured'],
  ['Maintained at proper spacing during placement operations', 'Maintained at proper spacing'],
  ['Free of excessive displacement', 'Free of excessive displacement'],
  ['Clean and properly tied', 'Clean and properly tied'],
  ['Properly aligned in accordance with approved structural drawings', 'Properly aligned with drawings'],
]

const INSPECTION_TYPES = [
  'REBAR INSPECTION AND CONCRETE PLACEMENT SUPERVISION',
  'REBAR INSPECTION',
  'CONCRETE PLACEMENT SUPERVISION',
  'STRUCTURAL STEEL INSPECTION',
  'FOUNDATION INSPECTION',
  'WELDING INSPECTION',
]

const INSPECTION_STATUSES = [
  'WORK IN CONFORMANCE',
  'WORK IN PROGRESS',
  'NON-CONFORMANCE',
  'FINAL INSPECTION',
]

export default function FormPanel({
  formData, setFormData,
  uploadedImages, setUploadedImages,
  onGenerate, isGenerating,
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [compressProgress, setCompressProgress] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const totalSteps = 5

  const update = (k) => (e) => setFormData((f) => ({ ...f, [k]: e.target.value }))

  const toggleCheck = (key, value) => {
    setFormData((f) => {
      const arr = f[key] || []
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }

  const navigate = (dir) => {
    const next = currentStep + dir
    if (next < 0 || next >= totalSteps) return
    setCurrentStep(next)
  }

  const handleFiles = async (files) => {
    if (!files.length) return
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!imageFiles.length) return
    const newImages = await processImageFiles(imageFiles, setCompressProgress)
    setUploadedImages((prev) => [...prev, ...newImages])
    setCompressProgress('')
  }

  const updateCaption = (id, value) => {
    setUploadedImages((prev) => prev.map((i) => (i.id === id ? { ...i, caption: value } : i)))
  }

  const removeImage = (id) => {
    setUploadedImages((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="form-panel">
      <div className="panel-header">
        <span className="panel-title">{STEP_LABELS[currentStep]}</span>
        <div className="step-indicator">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`step-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="form-scroll">
        {currentStep === 0 && (
          <div className="step-section active">
            <div className="section-label">Project Information</div>
            <div className="field-group">
              <label>Project Address</label>
              <input type="text" value={formData.projectAddress} onChange={update('projectAddress')} />
            </div>
            <div className="row-2">
              <div className="field-group">
                <label>Inspection Date</label>
                <input type="date" value={formData.inspDate} onChange={update('inspDate')} />
              </div>
              <div className="field-group">
                <label>Weather / Temp</label>
                <input type="text" value={formData.weather} onChange={update('weather')} />
              </div>
            </div>
            <div className="row-2">
              <div className="field-group">
                <label>DOB No.</label>
                <input type="text" value={formData.dobNo} onChange={update('dobNo')} />
              </div>
              <div className="field-group">
                <label>Floor / Location</label>
                <input type="text" value={formData.floorLocation} onChange={update('floorLocation')} />
              </div>
            </div>
            <div className="field-group">
              <label>Inspection Type</label>
              <select value={formData.inspType} onChange={update('inspType')}>
                {INSPECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label>Reference Drawings</label>
              <input type="text" value={formData.refDrawings} onChange={update('refDrawings')} />
            </div>
            <div className="row-2">
              <div className="field-group">
                <label>Inspector Name</label>
                <input type="text" value={formData.inspectorName} onChange={update('inspectorName')} />
              </div>
              <div className="field-group">
                <label>Lead Inspector / PE</label>
                <input type="text" value={formData.leadInspector} onChange={update('leadInspector')} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="step-section active">
            <div className="section-label">Areas Inspected & Slab Conditions</div>
            <div className="field-group">
              <label>Areas Inspected</label>
              <div className="checkbox-group">
                {AREA_OPTIONS.map((val, idx) => (
                  <label className="checkbox-item" key={val}>
                    <input
                      type="checkbox"
                      checked={formData.areasInspected.includes(val)}
                      onChange={() => toggleCheck('areasInspected', val)}
                    />
                    <span>{AREA_LABELS[idx]}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field-group">
              <label>Stair Floor Transition (if applicable)</label>
              <input type="text" value={formData.stairDetails} onChange={update('stairDetails')} />
            </div>
            <div className="field-group">
              <label>Slab Surface Conditions</label>
              <div className="checkbox-group">
                {SLAB_CONDITIONS.map(([val, lbl]) => (
                  <label className="checkbox-item" key={val}>
                    <input
                      type="checkbox"
                      checked={formData.slabConditions.includes(val)}
                      onChange={() => toggleCheck('slabConditions', val)}
                    />
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="row-2">
              <div className="field-group">
                <label>Compaction Req.</label>
                <input type="text" value={formData.compaction} onChange={update('compaction')} />
              </div>
              <div className="field-group">
                <label>Slab Thickness</label>
                <input type="text" value={formData.slabThickness} onChange={update('slabThickness')} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="step-section active">
            <div className="section-label">Rebar Inspection Details</div>
            <div className="field-group">
              <label>Bottom Rebar Size & Spacing</label>
              <input type="text" value={formData.bottomRebar} onChange={update('bottomRebar')} />
            </div>
            <div className="field-group">
              <label>Top Rebar Size & Spacing</label>
              <input type="text" value={formData.topRebar} onChange={update('topRebar')} />
            </div>
            <div className="row-2">
              <div className="field-group">
                <label>Steel Grade</label>
                <input type="text" value={formData.steelGrade} onChange={update('steelGrade')} />
              </div>
              <div className="field-group">
                <label>Concrete Strength</label>
                <input type="text" value={formData.concStrength} onChange={update('concStrength')} />
              </div>
            </div>
            <div className="field-group">
              <label>Rebar Conditions Observed</label>
              <div className="checkbox-group">
                {REBAR_CONDITIONS.map(([val, lbl]) => (
                  <label className="checkbox-item" key={val}>
                    <input
                      type="checkbox"
                      checked={formData.rebarConditions.includes(val)}
                      onChange={() => toggleCheck('rebarConditions', val)}
                    />
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field-group">
              <label>Additional Rebar Notes</label>
              <textarea value={formData.rebarNotes} onChange={update('rebarNotes')} />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="step-section active">
            <div className="section-label">Concrete Placement & Status</div>
            <div className="row-2">
              <div className="field-group">
                <label>Concrete Supplier</label>
                <input type="text" value={formData.supplier} onChange={update('supplier')} />
              </div>
              <div className="field-group">
                <label>Concrete Type</label>
                <input type="text" value={formData.concType} onChange={update('concType')} />
              </div>
            </div>
            <div className="row-2">
              <div className="field-group">
                <label>Quantity (CY)</label>
                <input type="text" value={formData.quantity} onChange={update('quantity')} />
              </div>
              <div className="field-group">
                <label>Mix Design No.</label>
                <input type="text" value={formData.mixDesign} onChange={update('mixDesign')} />
              </div>
            </div>
            <div className="field-group">
              <label>Inspection Status</label>
              <select value={formData.inspStatus} onChange={update('inspStatus')}>
                {INSPECTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label>Additional Remarks</label>
              <textarea rows="3" value={formData.remarks} onChange={update('remarks')} />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="step-section active">
            <div className="section-label">Site Photos (Optional)</div>
            <div className="field-group">
              <label>Upload Inspection Photos</label>
              <div
                className={`image-dropzone ${dragOver ? 'dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false) }}
                onDrop={(e) => {
                  e.preventDefault(); e.stopPropagation(); setDragOver(false)
                  handleFiles(e.dataTransfer.files)
                }}
              >
                <div className="image-dropzone-icon">📷</div>
                <div className="image-dropzone-text">Click or drop images here</div>
                <div className="image-dropzone-hint">JPG · PNG · auto-compressed to ~1200px</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  handleFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              {compressProgress && <div className="compress-progress visible">{compressProgress}</div>}
              {uploadedImages.length > 0 && (
                <div className="image-list">
                  {uploadedImages.map((img) => (
                    <div className="image-item" key={img.id}>
                      <img className="image-thumb" src={img.dataUrl} alt="" />
                      <div className="image-meta">
                        <input
                          className="image-caption"
                          type="text"
                          value={img.caption}
                          onChange={(e) => updateCaption(img.id, e.target.value)}
                        />
                        <div className="image-size">
                          {formatBytes(img.originalSize)} →{' '}
                          <span className="reduced">{formatBytes(img.compressedSize)}</span>
                          {' '}({Math.round((1 - img.compressedSize / img.originalSize) * 100)}% smaller)
                        </div>
                      </div>
                      <button className="image-remove" onClick={() => removeImage(img.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="helper-box success">
              <strong>✓ TRUE WORD OUTPUT</strong>
              The &quot;Download .docx&quot; button generates a real Microsoft Word file with the official HRF logo, working hyperlinks, auto page numbering, and embedded photos — identical to the template format.
            </div>
            <div className="helper-box" style={{ marginTop: 10 }}>
              <strong>⚡ READY TO GENERATE</strong>
              AI composes the body text. If the API fails, the template fallback runs — you always get a report.
            </div>
          </div>
        )}
      </div>

      <div className="form-nav">
        {currentStep > 0 && (
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
        )}
        {currentStep < totalSteps - 1 && (
          <button className="btn btn-primary" onClick={() => navigate(1)}>Next →</button>
        )}
        {currentStep === totalSteps - 1 && (
          <button
            className="btn btn-generate"
            disabled={isGenerating}
            onClick={onGenerate}
          >
            {isGenerating ? 'Generating...' : '⚡ Generate Report'}
          </button>
        )}
      </div>
    </div>
  )
}
