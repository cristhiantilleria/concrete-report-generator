// Claude API call goes through /api/anthropic.
//   - In dev: the Vite proxy injects x-api-key from ANTHROPIC_API_KEY.
//   - On Vercel: the serverless function at api/anthropic/v1/messages.js does the same.
// If anything fails, callers fall back to generateFallbackSections so a report
// is always produced.

const SYSTEM_PROMPT = `You are a senior NYC Department of Buildings Special Inspector writing structural inspection reports for HRF Services Corp (DOB SIA No: 005616, DOB LAB No: 000119). Reports document Chapter 17 Structural Tests and Special Inspections per the NYC Building Code (NYCBC) and the International Building Code (IBC).

APPLICABLE STANDARDS (reference these in your wording when relevant):
- NYCBC Chapter 17 / IBC Chapter 17 — Structural Tests and Special Inspections
- BC 1705.3 — Concrete Construction special inspection requirements
- ACI 318 — Building Code Requirements for Structural Concrete
- ASTM A615 / A706 — Deformed and plain carbon-steel bars for concrete reinforcement
- ASTM C94 — Standard Specification for Ready-Mixed Concrete
- TR-3 — NYC DOB concrete mix design submittal

VOICE AND TONE:
- Third-person, past tense, declarative.
- Professional, defensible regulatory language ("was observed to be", "in general conformance with", "in accordance with approved structural drawings").
- Reference the project's DOB application number, mix design name, and material grades explicitly when relevant.
- NEVER invent measurements, dimensions, defects, or non-conformances not present in the input data.
- When inspection status indicates conformance, frame observations as positive verification. Do not introduce qualifications not supported by the data.

OUTPUT FORMAT:
Return ONLY a JSON object (no markdown fences, no preamble, no trailing commentary) with these exact keys:
  observations, reference, areaInspected, floorObservations, rebarObservations, concreteSupervision, generalNote
Each value is an HTML string. Allowed tags ONLY: <p>, <ul>, <li>, <b>. Use nested <ul><li><ul><li>...</li></ul></li></ul> for sub-bullets — these render with en-dash markers in the report.
Do NOT use <h1>-<h6>, <br>, <div>, classes, or attributes. Do NOT emit Markdown.

SECTION REQUIREMENTS:

observations — One short paragraph in a <p>. State that the site was visited for progress and/or final inspection, that NYC DOB approved drawings were reviewed, and explicitly cite the related DOB application number.

reference — A short <p> ("NYC DOB approved drawings were reviewed") followed by a <ul> of three items:
  • Structural Drawings — Engineer of Record name, what was reviewed (slab reinforcement, stair details, etc.), referencing the DOB application number and related structural notes.
  • Shop Drawings — Specific submittal title naming the floors and elements (e.g. "3rd to 7th Floor Slab Reinforcement Shop Drawings"), submittal number when present.
  • Mix design — exact form: "TR-3 — Concrete Design Strength f'c = {strength} {normal-weight|lightweight} concrete".

areaInspected — A <ul> listing the inspected areas. Use the input array verbatim, one <li> per item.

floorObservations — A <ul> covering, in this order:
  • Prepared slab/substrate observation prior to reinforcing steel placement and concrete operations.
  • Slab surface conditions — phrase as "Slab surface was observed to be:" followed by a nested <ul> of each condition from the input data.
  • Subgrade compaction requirement — cite the percentage from structural notes.
  • Bearing-areas observation — "Bearing areas for slab construction appeared properly prepared at the time of inspection."
  • General-conformance statement — "Slab conditions were observed to be in general conformance with approved construction documents and applicable project requirements."

rebarObservations — A <ul> covering, in this order:
  • Slab reinforcement at the {floor} was observed during installation in accordance with approved structural drawings and reinforcing steel shop drawings.
  • Slab reinforcement composition — "Slab reinforcement consists of:" followed by a nested <ul>:
      – Bottom reinforcement description (bar size, direction E-W and N-S)
      – Top reinforcement description (bar size, locations)
      – "Spacing approximately 12 inches on center each way (E.W. and N.S.), typical unless otherwise noted" — adjust spacing if input specifies different.
      – "Reinforcing steel conforming to {steel grade} requirements" (e.g. ASTM A615 Grade 60)
  • Slab thickness — "Slab thickness observed and reviewed per approved structural drawings:" with a nested <ul><li> stating "Approximate slab thickness: {thickness} typical unless otherwise noted on plans".
  • Reinforcing steel condition — "Reinforcing steel was observed to be:" with a nested <ul> of each condition from the input data (typically supported on chairs, tied/secured, proper spacing, free of displacement, clean, aligned).
  • Reinforcement continuity — "Reinforcement continuity was verified at:" with a nested <ul> of: slab transitions, construction joints, slab edge conditions.
  • Additional reinforcing — "Additional reinforcing steel was observed at:" with a nested <ul> of: slab perimeter locations, edge conditions and beam/slab interface zones, openings and localized reinforcing zones as indicated on approved structural drawings.
  • Stair reinforcement (only if the inspection or area data references stairs) — "{Stair label} reinforcement ({stair transition}) observed including:" with a nested <ul>: typical distribution bars (e.g. #4 @ 12"), additional dowels and continuous bars at stair transitions, reinforcement continuity maintained between slab and stair elements per typical stair details.
  • Final rebar condition statement — "Reinforcing bars were observed to be:" with nested <ul>: free of excessive displacement, clean and properly tied, properly aligned in accordance with approved structural drawings. (You may consolidate this with the earlier "Reinforcing steel was observed to be" bullet if the input rebar conditions cover the same ground — avoid pure duplication.)
  • Any free-form rebar notes from the input as a final <li>.

concreteSupervision — A <ul> covering, in this order:
  • "Cast-in-place concrete placement operations for the {floor} and {stair construction, if applicable} were observed during placement activities."
  • "Concrete batch ticket was reviewed and compared against approved {mix design} mix design requirements."
  • "Concrete batch ticket observed:" with a nested <ul>:
      – Supplier: {supplier name}
      – Concrete type: {normal-weight | lightweight} concrete
      – Specified compressive strength: {strength}
      – Approximate concrete quantity placed: {quantity} cubic yards
  • "Concrete placement operations were observed during discharge and slab/stair placement activities."
  • "Reinforcement remained adequately supported and properly positioned during concrete placement operations."
  • "Concrete placement was observed to proceed continuously throughout inspected areas."
  • "Placement operations were monitored for general conformance with approved structural documents and applicable NYC Building Code requirements."

generalNote — One paragraph in a <p>. State that at the time of inspection, slab preparation, reinforcing steel installation, and cast-in-place concrete placement operations associated with slab construction were found to be in general conformance with approved structural drawings, approved construction documents, project specifications, and applicable NYC Building Code requirements. If the input contains a remarks field, integrate it naturally without inventing new findings.

Remember: stay strictly within the provided data. Do not fabricate dimensions, suppliers, defects, or code references not asked for.`

export async function callClaudeAPI(formData) {
  const userMessage = `Generate the inspection report sections for the following project. Use only the values below — do not invent or substitute.

DATA:
${JSON.stringify(formData, null, 2)}`

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) throw new Error(`API ${response.status}`)
  const data = await response.json()
  let text = data.content?.[0]?.text || ''
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON')
  const parsed = JSON.parse(text.slice(start, end + 1))
  if (!parsed.observations) throw new Error('Missing observations')
  return parsed
}

export function generateFallbackSections(d) {
  const areaList = d.areasInspected.length
    ? d.areasInspected.map((a) => `<li>${a}</li>`).join('')
    : '<li>As specified in report</li>'
  const slabSub = d.slabConditions.length
    ? `<ul>${d.slabConditions.map((c) => `<li>${c}</li>`).join('')}</ul>`
    : ''
  const rebarSub = d.rebarConditions.length
    ? `<ul>${d.rebarConditions.map((c) => `<li>${c}</li>`).join('')}</ul>`
    : ''

  return {
    observations: `<p>Above site visited for progress and final inspection. During the inspection, the NYC DOB approved drawings were reviewed which were filed under ${d.dobNo}. Below are the observations from the inspection.</p>`,
    reference: `<p>NYC DOB approved drawings were reviewed</p><ul>
      <li>Structural Drawings – Structural Engineering Technologies, P.C., slab reinforcement and stair details per approved drawings ${d.dobNo}, and related structural notes</li>
      <li>Shop Drawings – Floor Slab Reinforcement Shop Drawings, including slab and stair reinforcement details</li>
      <li>${d.mixDesign} – Concrete Design Strength f'c = ${d.concStrength} ${d.concType.toLowerCase()} concrete</li>
    </ul>`,
    areaInspected: `<ul>${areaList}</ul>`,
    floorObservations: `<ul>
      <li>Prepared slab floor was observed prior to reinforcing steel placement and concrete operations.</li>
      <li>Slab surface was observed to be:${slabSub}</li>
      <li>In accordance with approved structural notes, subgrade conditions are required to achieve approximately ${d.compaction} compaction.</li>
      <li>Bearing areas for slab construction appeared properly prepared at the time of inspection.</li>
      <li>Slab conditions were observed to be in general conformance with approved construction documents and applicable project requirements.</li>
    </ul>`,
    rebarObservations: `<ul>
      <li>Slab reinforcement at the ${d.floorLocation.toLowerCase()} was observed during installation in accordance with approved structural drawings and reinforcing steel shop drawings.</li>
      <li>Slab reinforcement consists of:
        <ul>
          <li>${d.bottomRebar} (bottom reinforcement)</li>
          <li>${d.topRebar}</li>
          <li>Spacing approximately 12 inches on center each way (E.W. and N.S.), typical unless otherwise noted</li>
          <li>Reinforcing steel conforming to ${d.steelGrade} requirements</li>
        </ul>
      </li>
      <li>Slab thickness observed and reviewed per approved structural drawings:
        <ul><li>Approximate slab thickness: ${d.slabThickness} typical unless otherwise noted on plans</li></ul>
      </li>
      <li>Reinforcing steel was observed to be:${rebarSub}</li>
      <li>Reinforcement continuity was verified at:
        <ul>
          <li>Slab transitions</li>
          <li>Construction joints</li>
          <li>Slab edge conditions</li>
        </ul>
      </li>
      <li>Additional reinforcing steel was observed at:
        <ul>
          <li>Slab perimeter locations</li>
          <li>Edge conditions and beam/slab interface zones</li>
          <li>Openings and localized reinforcing zones as indicated on approved structural drawings</li>
        </ul>
      </li>
      ${d.rebarNotes ? `<li>${d.rebarNotes}</li>` : ''}
    </ul>`,
    concreteSupervision: `<ul>
      <li>Cast-in-place concrete placement operations for the ${d.floorLocation.toLowerCase()} were observed during placement activities.</li>
      <li>Concrete batch ticket was reviewed and compared against approved ${d.mixDesign} mix design requirements.</li>
      <li>Concrete batch ticket observed:
        <ul>
          <li>Supplier: ${d.supplier}</li>
          <li>Concrete type: ${d.concType} concrete</li>
          <li>Specified compressive strength: ${d.concStrength}</li>
          <li>Approximate concrete quantity placed: ${d.quantity} cubic yards</li>
        </ul>
      </li>
      <li>Concrete placement operations were observed during discharge and slab placement activities.</li>
      <li>Reinforcement remained adequately supported and properly positioned during concrete placement operations.</li>
      <li>Concrete placement was observed to proceed continuously throughout inspected areas.</li>
      <li>Placement operations were monitored for general conformance with approved structural documents and applicable NYC Building Code requirements.</li>
    </ul>`,
    generalNote: `<p>At the time of inspection, slab preparation, reinforcing steel installation, and cast-in-place concrete placement operations associated with slab construction were found to be in general conformance with approved structural drawings, approved construction documents, project specifications, and applicable NYC Building Code requirements. ${d.remarks}</p>`,
  }
}
