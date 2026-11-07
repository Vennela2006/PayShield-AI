'use client';

const reportingChecklist = [
  'Transaction ID or UTR number',
  'Transaction date and approximate incident time',
  'Payment amount and currency',
  'Bank, wallet or merchant name',
  'Original receipt or payment screenshot',
  'Relevant emails, messages or account alerts',
];

export default function ReportingGuide() {
  return (
    <div className="reporting-guide" style={{ display: 'grid', gap: 18, marginTop: 20 }}>
      <section className="panel">
        <div className="eyebrow">REPORT THROUGH PAYPAL</div>
        <h3>PayPal Resolution Centre</h3>
        <p className="panel-sub">
          Use this route for payments you do not recognise, purchase problems,
          duplicate charges, billing errors or seller disputes.
        </p>
        <ol>
          <li>Sign in to your PayPal account.</li>
          <li>Open the Resolution Centre.</li>
          <li>Select the relevant transaction.</li>
          <li>Choose the issue that accurately describes what happened.</li>
          <li>Follow PayPal's instructions and retain the case reference.</li>
        </ol>
        <a
          className="primary-btn"
          href="https://www.paypal.com/disputes"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open PayPal Resolution Centre ↗
        </a>
        <p className="panel-sub">
          <a
            href="https://www.paypal.com/in/cshelp/article/how-do-i-open-a-dispute-with-a-seller-help160"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read PayPal's official dispute instructions
          </a>
        </p>
      </section>

      <section className="panel">
        <div className="eyebrow">INDIA · FINANCIAL CYBER FRAUD</div>
        <h3>National Cyber Crime Reporting Portal</h3>
        <p className="panel-sub">
          If you suspect financial cyber fraud and money has been lost,
          contact the national helpline 1930 promptly and use the official
          government portal to register your complaint.
        </p>
        <div style={{ fontSize: 28, fontWeight: 700, margin: '12px 0' }}>
          1930
        </div>
        <a
          className="primary-btn"
          href="https://cybercrime.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Government Cyber Crime Portal ↗
        </a>
        <p className="panel-sub">
          Keep the acknowledgement or complaint reference for future follow-up.
        </p>
      </section>

      <section className="panel">
        <div className="eyebrow">BEFORE YOU REPORT</div>
        <h3>Evidence preparation checklist</h3>
        <p className="panel-sub">
          Keep these details ready. Do not upload passwords, PINs, OTPs or
          complete card credentials into PayShield.
        </p>
        <ul style={{ display: 'grid', gap: 10, paddingLeft: 22 }}>
          {reportingChecklist.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="panel-sub">
          The government portal may request identity information and supporting
          documents through its own secure complaint process.
        </p>
        <a
          href="https://www.cybercrime.gov.in/webform/Crime_AuthoLogin.aspx"
          target="_blank"
          rel="noopener noreferrer"
        >
          View official complaint preparation checklist ↗
        </a>
      </section>

      <section className="panel">
        <div className="eyebrow">IMPORTANT</div>
        <h3>Understand the limits</h3>
        <p className="panel-sub">
          PayShield AI prepares evidence and provides reporting guidance.
          It does not submit complaints, contact banks or authorities,
          reverse payments, guarantee reimbursement or provide legal advice.
          Reporting channels and eligibility depend on the incident and
          the relevant institution's rules.
        </p>
      </section>
    </div>
  );
}

