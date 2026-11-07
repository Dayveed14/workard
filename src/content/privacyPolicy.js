// ============================================================
// Workard Privacy Policy — the text shown at /privacy.
// To change it: edit the text here, update `lastUpdated`, rebuild.
// Placeholders in the supplied draft (§11, §16) were filled from §1.
// ============================================================

export const PRIVACY = {
  effective: '1 November 2026',
  lastUpdated: '6 November 2026',
  operator: 'Workard Limited',
  address: 'Horizon 2 Extension, Lekki, Lagos',
  email: 'hello@workard.com',
  website: 'https://workard.com',
};

// Each section: heading, then blocks. A block is a paragraph (string),
// { list: [...] }, { sub: 'A. heading' } or { facts: [[label, value], …] }.
export const SECTIONS = [
  {
    heading: '1. Introduction',
    blocks: [
      'Workard (“Workard”, “we”, “our” or “us”) is a business operations and management platform designed to help businesses organise and manage activities such as employee administration, attendance, task management, customer records, invoicing, expenses, reporting and business communications.',
      'We understand that businesses and the people who use them trust us with important information. We are committed to handling personal information responsibly and protecting it in accordance with the Nigeria Data Protection Act 2023, applicable regulations and other relevant privacy laws.',
      'This Privacy Policy explains what information we collect, why we collect it, how we use it, when it may be shared, how long we retain it and the rights available to individuals whose information we process.',
      { facts: [['Platform operator', PRIVACY.operator], ['Business address', PRIVACY.address], ['Privacy contact', PRIVACY.email], ['Website', PRIVACY.website]] },
    ],
  },
  {
    heading: '2. Who this policy applies to',
    blocks: [
      'This policy applies to:',
      {
        list: [
          'Business owners and administrators who create Workard accounts.',
          'Employees and team members whose information is entered into Workard by their employer.',
          'Managers, supervisors and other authorised business users.',
          'Customers and business contacts whose information is stored by a Workard customer.',
          'Individuals who visit our website, contact us or subscribe to our communications.',
        ],
      },
      'If your employer uses Workard, your employer may have its own employee privacy notice explaining how it uses your information. You should review that notice as well.',
    ],
  },
  {
    heading: '3. Information we collect',
    blocks: [
      'The information collected depends on how you use Workard and which features your business activates.',
      { sub: 'A. Account and registration information' },
      'We may collect:',
      { list: ['Full name.', 'Email address.', 'Telephone number.', 'Business name.', 'Business address and business contact information.', 'Job title or role.', 'Login credentials and authentication information.', 'Account preferences and subscription details.'] },
      { sub: 'B. Employee and workforce information' },
      'Where a business uses Workard’s employee-management features, it may enter or generate information such as:',
      {
        list: [
          'Employee names and contact details.',
          'Employee identification or staff numbers.',
          'Department, job title and assigned responsibilities.',
          'Employment start dates and relevant employment records.',
          'Attendance and clock-in/clock-out records.',
          'Working hours and timesheets.',
          'Leave requests and leave records.',
          'Tasks, assignments and completion records.',
          'Performance reviews, work-related feedback and evaluation records.',
          'Work-related documents uploaded by authorised business administrators.',
        ],
      },
      'The business using Workard is responsible for ensuring that it has an appropriate legal basis and authority to enter and process employee information.',
      { sub: 'C. Customer and business information' },
      'Where businesses use Workard’s customer-management features, information may include:',
      { list: ['Customer names and contact details.', 'Customer accounts and transaction references.', 'Enquiries, service requests and complaints.', 'Customer communications and follow-up records.', 'Invoices, payment status and outstanding balances.', 'Business interaction history.'] },
      'Workard customers must ensure that information entered about their customers is relevant, accurate and collected lawfully.',
      { sub: 'D. Financial and invoicing information' },
      'We may process information relating to:',
      { list: ['Invoices and invoice references.', 'Business income and expenditure records.', 'Expense categories.', 'Payment status.', 'Customer balances.', 'Financial summaries and reports.', 'Subscription and billing records.'] },
      'Workard is a business management platform, not a bank. Payment card or bank details required to process subscriptions or other payments may be handled by authorised payment service providers. We do not intend to store complete payment card credentials on our own systems.',
      { sub: 'E. Call and communication information' },
      'If a business activates Workard’s cloud phone or call-management features, the platform may process:',
      {
        list: [
          'Caller and recipient telephone numbers.',
          'Call date, time and duration.',
          'Call routing and assignment information.',
          'Call history and status.',
          'Call recordings, where recording is enabled.',
          'Call-related notes, flags and review comments.',
          'Customer service feedback and follow-up records.',
        ],
      },
      'Call recording and monitoring must only be activated where the business has established an appropriate legal basis and provided the required notices to affected individuals. Businesses must comply with applicable laws and obtain consent where required.',
      'Workard provides technical functionality; it does not authorise businesses to record or monitor communications unlawfully.',
      { sub: 'F. Technical and usage information' },
      'When you access Workard, we may collect:',
      {
        list: [
          'IP address.',
          'Browser type and device information.',
          'Operating system.',
          'Login dates and activity.',
          'Pages and features accessed.',
          'Security and diagnostic logs.',
          'Error reports and performance information.',
          'Cookie and similar technology information, subject to applicable consent requirements.',
        ],
      },
    ],
  },
  {
    heading: '4. How we use information',
    blocks: [
      'We use personal information for legitimate business and platform purposes, including:',
      {
        list: [
          'Creating and administering user accounts.',
          'Providing Workard’s business management features.',
          'Authenticating users and managing permissions.',
          'Processing subscriptions and payments.',
          'Supporting employee, attendance and task-management workflows.',
          'Providing invoicing, customer-management and reporting features.',
          'Supporting call-management functionality where activated.',
          'Providing technical support and responding to enquiries.',
          'Maintaining platform security and preventing fraud or misuse.',
          'Diagnosing errors and improving platform performance.',
          'Sending essential service announcements.',
          'Sending optional product updates and marketing communications where permitted.',
          'Complying with legal and regulatory obligations.',
        ],
      },
      'We will not use personal information for purposes incompatible with the purpose for which it was collected without an appropriate legal basis.',
    ],
  },
  {
    heading: '5. Our role and the role of business customers',
    blocks: [
      'Workard operates in different data-protection capacities depending on the information involved.',
      { facts: [
        ['Workard as a data controller', 'We determine how we process information for our own website, account administration, subscription management, customer support, security and business operations.'],
        ['Workard as a data processor', 'When a business uploads or manages employee, customer, invoice or other operational records using Workard, that business generally determines the purpose of processing. Workard processes the information to provide the service under the business customer’s instructions and our contractual arrangements.'],
      ] },
      'Businesses using Workard must:',
      {
        list: [
          'Have an appropriate legal basis for collecting and using personal information.',
          'Provide employees and customers with relevant privacy information.',
          'Restrict access to authorised personnel.',
          'Ensure that information entered is accurate and relevant.',
          'Avoid uploading unnecessary sensitive personal information.',
          'Respond to requests from individuals whose data they control.',
          'Ensure that any call monitoring or recording is lawful.',
        ],
      },
    ],
  },
  {
    heading: '6. Legal bases for processing',
    blocks: [
      'Depending on the circumstances, we may rely on one or more lawful bases recognised under the Nigeria Data Protection Act, including:',
      { list: ['Performance of a contract or steps requested before entering into a contract.', 'Compliance with a legal obligation.', 'Consent, where required.', 'Legitimate interests, where appropriate and where those interests are not overridden by individuals’ rights.', 'Other lawful grounds recognised by applicable law.'] },
      'Where we rely on consent, you may withdraw it. Withdrawal does not affect processing lawfully carried out before withdrawal.',
    ],
  },
  {
    heading: '7. Sharing personal information',
    blocks: [
      'We do not sell personal information.',
      'We may share information with:',
      {
        list: [
          'Cloud hosting and infrastructure providers.',
          'Payment processors.',
          'Authentication and security service providers.',
          'Email, SMS and communication service providers.',
          'Customer support and technical service providers.',
          'Professional advisers, auditors and legal representatives.',
          'Regulatory authorities, courts or law-enforcement agencies where legally required.',
          'Other parties where you or your authorised business administrator instruct us to do so.',
        ],
      },
      'Service providers who process personal information on our behalf must be subject to appropriate contractual and security obligations.',
      'Where a Workard customer chooses to share information with another person or organisation through the platform, that disclosure is governed by the customer’s instructions and applicable permissions.',
    ],
  },
  {
    heading: '8. International data transfers',
    blocks: [
      'Some service providers may host or process information outside Nigeria.',
      'Where personal information is transferred internationally, we will take steps to ensure that the transfer complies with the Nigeria Data Protection Act and applicable regulatory requirements, including appropriate safeguards where required.',
    ],
  },
  {
    heading: '9. Data security',
    blocks: [
      'We apply appropriate technical and organisational safeguards designed to protect information against unauthorised access, disclosure, alteration, loss or destruction.',
      'Depending on the feature and infrastructure, safeguards may include:',
      { list: ['Access controls and role-based permissions.', 'Authentication and account security measures.', 'Secure data transmission.', 'Encryption where appropriate.', 'System monitoring and security logging.', 'Backups and recovery measures.', 'Restricted administrative access.', 'Security reviews and updates.'] },
      'No internet-based service can guarantee absolute security. Users should protect their login credentials and report suspected unauthorised access promptly.',
    ],
  },
  {
    heading: '10. Data retention',
    blocks: [
      'We retain personal information only for as long as reasonably necessary for the purposes for which it was collected, subject to legal, regulatory, contractual, security and dispute-resolution requirements.',
      'Retention periods may differ for:',
      { list: ['Account and subscription records.', 'Employee and customer records.', 'Invoices and financial records.', 'Call recordings and communication logs.', 'Security and diagnostic logs.', 'Support correspondence.'] },
      'Workard customers remain responsible for deciding how long they need to retain records they control. We will provide applicable account-management and deletion processes in accordance with our service agreements and legal obligations.',
      'Call recordings should not be retained indefinitely. Businesses should configure and apply a documented retention period appropriate to their needs and applicable law.',
    ],
  },
  {
    heading: '11. Your privacy rights',
    blocks: [
      'Subject to applicable law, individuals may have rights to:',
      {
        list: [
          'Request access to personal information.',
          'Request correction of inaccurate or incomplete information.',
          'Request deletion of personal information where legally applicable.',
          'Request restriction of certain processing.',
          'Object to certain processing.',
          'Withdraw consent where consent is the legal basis.',
          'Request information about relevant data processing.',
          'Lodge a complaint with the Nigeria Data Protection Commission.',
        ],
      },
      'If your information is held by your employer or another Workard customer, you should normally direct requests about that information to the relevant business administrator. Workard will provide reasonable assistance where required under applicable law and our contractual arrangements.',
      `Requests relating to information controlled directly by Workard can be sent to ${PRIVACY.email}.`,
    ],
  },
  {
    heading: '12. Cookies and similar technologies',
    blocks: [
      'Workard may use cookies and similar technologies to:',
      { list: ['Keep users signed in.', 'Maintain essential platform functionality.', 'Remember preferences.', 'Protect accounts and detect suspicious activity.', 'Understand website usage and improve performance.'] },
      'Non-essential analytics or marketing cookies will be used in accordance with applicable consent requirements. You may manage available cookie preferences through the website’s cookie settings.',
    ],
  },
  {
    heading: '13. Children’s information',
    blocks: [
      'Workard is a business operations platform and is not designed for independent use by children.',
      'Businesses should not upload children’s personal information unless there is a lawful and necessary reason and all applicable legal safeguards have been met.',
    ],
  },
  {
    heading: '14. Data breaches',
    blocks: [
      'Where a personal data breach occurs, we will assess the incident and take appropriate steps in accordance with applicable legal and regulatory requirements. Where notification to affected individuals or the relevant authority is required, we will make the required notifications within the applicable timelines.',
      'Users and business customers should promptly notify us of suspected security incidents involving their Workard accounts.',
    ],
  },
  {
    heading: '15. Changes to this policy',
    blocks: [
      'We may update this Privacy Policy as Workard’s features, operations or legal obligations change.',
      'The latest version will be published on our website with an updated effective date. Where a change materially affects how personal information is used, we will provide appropriate notice.',
    ],
  },
  {
    heading: '16. Contact us',
    blocks: [
      'For questions, complaints or requests concerning this Privacy Policy or personal information controlled by Workard, contact:',
      { facts: [['', 'Workard Privacy Team'], ['Legal company name', PRIVACY.operator], ['Address', PRIVACY.address], ['Email', PRIVACY.email], ['Website', PRIVACY.website]] },
      'You may also contact the Nigeria Data Protection Commission through its official website: https://ndpc.gov.ng/.',
    ],
  },
];
