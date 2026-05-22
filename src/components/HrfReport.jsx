import { HRF_LOGO_URL } from '../logo.js';

const STATUS_CHECKS = {
  'WORK IN CONFORMANCE': [true, false, false, false],
  'WORK IN PROGRESS': [false, true, false, false],
  'NON-CONFORMANCE': [false, false, true, false],
  'FINAL INSPECTION': [false, false, false, true]
};

function HeaderBlock({ pageNum }) {
  return (
    <div className="hrf-header-block">
      <img className="hrf-logo-img" src={HRF_LOGO_URL} alt="HRF Services Corp" />
      <div className="hrf-contact-line">
        <span>1766 BROADWAY, HEWLETT, NY 11557</span>
        <span>TEL: 718-593-9460</span>
        <span>FAX: 914-227-2414</span>
        <span>E: <a href="mailto:sialab@hrf.nyc">SIALAB@HRF.NYC</a></span>
        <span>W: <a href="http://www.hrf.nyc">WWW.HRF.NYC</a></span>
      </div>
      <div className="hrf-dob-line">DOB SIA NO: 005616 &amp; DOB LAB NO: 000119</div>
      {pageNum === 1 && (
        <div className="hrf-chapter-row">
          <div>NYCBC &amp; IBC</div>
          <div>Chapter 17 Structural Tests and Special Inspections</div>
        </div>
      )}
    </div>
  );
}

function FooterBlock({ pageNum }) {
  return (
    <div className="hrf-footer">
      <div className="hrf-footer-disclaimer">
        HRF Services Corp is on the site solely to observe/identify operations, observe conformance with contract
        documents/specifications and report those daily findings to the client. This report relates only to the items
        and/or exact test and/or inspected located and is confidential property of HRF services and its client(s).
        Information contained in this report may NOT be published or reproduced without written permission from the HRF
        Services.
      </div>
      <div className="hrf-footer-row">
        <span>Revision No. 1: 6/13/2019</span>
        <span>Page | {pageNum}</span>
      </div>
    </div>
  );
}

function Page({ pageNum, children }) {
  return (
    <div className="hrf-page">
      <HeaderBlock pageNum={pageNum} />
      {children}
      <FooterBlock pageNum={pageNum} />
    </div>
  );
}

// Render section HTML safely — sections originate from API or local template.
function HtmlSection({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function HrfReport({ data, sections, uploadedImages, apiError }) {
  const dateObj = new Date(data.inspDate + 'T12:00:00');
  const dateStr = dateObj
    .toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    .replace(/\//g, '.');
  const checks = STATUS_CHECKS[data.inspStatus] || [false, false, false, false];

  let pageCounter = 0;
  const nextPage = () => ++pageCounter;

  return (
    <>
      {apiError && (
        <div className="error-banner">⚠ AI generation unavailable ({apiError}). Using template fallback.</div>
      )}

      <Page pageNum={nextPage()}>
        <table className="hrf-info-table">
          <tbody>
            <tr>
              <td>Project Address:</td>
              <td>{data.projectAddress}.</td>
            </tr>
            <tr>
              <td>Inspection type:</td>
              <td>{data.inspType}</td>
            </tr>
            <tr>
              <td>Date:</td>
              <td>{dateStr}</td>
            </tr>
            <tr>
              <td>Weather Condition:</td>
              <td className="blue">{data.weather}</td>
            </tr>
            <tr>
              <td>Reference Drawing:</td>
              <td>APPROVED STRUCTURAL DRAWING</td>
            </tr>
            <tr>
              <td>Reference Detail:</td>
              <td>{data.refDrawings}.</td>
            </tr>
            <tr>
              <td>Inspected Locations:</td>
              <td>{data.floorLocation}.</td>
            </tr>
            <tr>
              <td>Related DOB No:</td>
              <td>{data.dobNo}</td>
            </tr>
            <tr>
              <td>Inspection Status:</td>
              <td>{data.inspStatus}</td>
            </tr>
          </tbody>
        </table>
        <div className="hrf-body">
          <h3>OBSERVATIONS:</h3>
          <HtmlSection html={sections.observations} />
          <h3>REFERENCE:</h3>
          <HtmlSection html={sections.reference} />
        </div>
      </Page>

      <Page pageNum={nextPage()}>
        <div className="hrf-body">
          <h3>AREA INSPECTED:</h3>
          <HtmlSection html={sections.areaInspected} />
          <h3>{data.floorLocation} INSPECTION OBSERVATIONS:</h3>
          <HtmlSection html={sections.floorObservations} />
          <h3>REBAR INSPECTION OBSERVATIONS:</h3>
          <HtmlSection html={sections.rebarObservations} />
        </div>
      </Page>

      <Page pageNum={nextPage()}>
        <div className="hrf-body">
          <h3>CONCRETE PLACEMENT SUPERVISION:</h3>
          <HtmlSection html={sections.concreteSupervision} />
          <h3>GENERAL NOTE:</h3>
          <HtmlSection html={sections.generalNote} />
        </div>
      </Page>

      <Page pageNum={nextPage()}>
        <div className="hrf-remarks">
          <div className="hrf-remarks-title">REMARKS (For locations noted above):</div>
          <div className="hrf-remark-row">
            <span className="hrf-remark-label">Work in Conformance:</span>
            <span>
              <span className="hrf-checkbox">{checks[0] ? '✕' : ''}</span>
              The inspected area was in conformance with the approved project drawings, specifications and building code
              requirements.
            </span>
          </div>
          <div className="hrf-remark-row">
            <span className="hrf-remark-label">Work in progress:</span>
            <span>
              <span className="hrf-checkbox">{checks[1] ? '✕' : ''}</span>
              The area under inspection was not completed during the time of visit – re-inspection is required.
            </span>
          </div>
          <div className="hrf-remark-row">
            <span className="hrf-remark-label">Non-conformance:</span>
            <span>
              <span className="hrf-checkbox">{checks[2] ? '✕' : ''}</span>
              The inspected area was found <b>NOT</b> in conformance with the approved project drawings, specifications
              and building code requirements – after correction of the work is performed a re-inspection is required.
            </span>
          </div>
          <div className="hrf-remark-row">
            <span className="hrf-remark-label">Final Inspection:</span>
            <span>
              <span className="hrf-checkbox">{checks[3] ? '✕' : ''}</span>
              For all items listed in the above composed report the inspected area (s) are in conformance with the
              approved project drawings and specifications.
            </span>
          </div>
          <div className="hrf-disclaimer-italic">
            * To the best of my knowledge, work inspected was in accordance with the building department approved plans,
            specifications and applicable workmanship provisions of the NYC Building Code except as noted above.
          </div>
          <div className="hrf-disclaimer-italic">
            ** My performance of this inspection is in accordance with HRF Services Corp conflict of interest
            requirements as defined in the Employee Policy.
          </div>
          <div className="hrf-sig-lines">
            <div>
              Inspector Print Name: <b>{data.inspectorName}</b>
            </div>
            <div>
              Lead Inspector Name: <b>{data.leadInspector}</b>
            </div>
          </div>
        </div>
      </Page>

      {uploadedImages.map((img) => (
        <Page key={img.id} pageNum={nextPage()}>
          <div className="hrf-figure">
            <div className="hrf-figure-img-wrap">
              <img src={img.dataUrl} alt={img.caption} />
            </div>
            <div className="hrf-figure-caption">
              <b>Figure</b>: {img.caption}.
            </div>
          </div>
        </Page>
      ))}
    </>
  );
}
