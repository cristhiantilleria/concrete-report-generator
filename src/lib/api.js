// Claude API call goes through the Vite dev proxy at /api/anthropic.
// The proxy injects x-api-key from VITE_ANTHROPIC_API_KEY.
// If anything fails, callers should fall back to generateFallbackSections.

export async function callClaudeAPI(formData) {
  const prompt = `You are a NYC structural inspection report writer for HRF Services Corp. Output ONLY a JSON object (no markdown, no preamble) with these keys: observations, reference, areaInspected, floorObservations, rebarObservations, concreteSupervision, generalNote.

Each value is HTML using <p>, <ul><li>, and <ul><ul><li> tags only. Write third-person past tense, professional NYC DOB inspection tone. Use specific values from the data. The observations section should reference DOB number ${formData.dobNo}.

DATA:
${JSON.stringify(formData, null, 2)}`

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
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
      <li>Slab conditions were observed to be in general conformance with approved construction documents.</li>
    </ul>`,
    rebarObservations: `<ul>
      <li>Slab reinforcement at the ${d.floorLocation.toLowerCase()} was observed during installation in accordance with approved structural drawings.</li>
      <li>Slab reinforcement consists of:
        <ul>
          <li>${d.bottomRebar} (bottom reinforcement)</li>
          <li>${d.topRebar}</li>
          <li>Reinforcing steel conforming to ${d.steelGrade} requirements</li>
        </ul>
      </li>
      <li>Approximate slab thickness: ${d.slabThickness}</li>
      <li>Reinforcing steel was observed to be:${rebarSub}</li>
      ${d.rebarNotes ? `<li>${d.rebarNotes}</li>` : ''}
    </ul>`,
    concreteSupervision: `<ul>
      <li>Cast-in-place concrete placement operations were observed during placement activities.</li>
      <li>Concrete batch ticket was reviewed and compared against approved ${d.mixDesign} mix design requirements.</li>
      <li>Supplier: ${d.supplier}</li>
      <li>Specified compressive strength: ${d.concStrength}</li>
      <li>Approximate quantity placed: ${d.quantity} cubic yards</li>
      <li>Reinforcement remained adequately supported and properly positioned during placement.</li>
      <li>Placement operations were monitored for general conformance with approved structural documents and applicable NYC Building Code requirements.</li>
    </ul>`,
    generalNote: `<p>At the time of inspection, slab preparation, reinforcing steel installation, and cast-in-place concrete placement operations were found to be in general conformance with approved structural drawings, approved construction documents, project specifications, and applicable NYC Building Code requirements. ${d.remarks}</p>`,
  }
}
