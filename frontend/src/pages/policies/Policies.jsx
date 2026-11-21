import { Link } from "react-router-dom";

const business = {
  name: "The Virtual Campus",
  website: "https://thevirtualcampus.me",
  email: "thevirtualcampus.support@gmail.com",
  address: "Temghar, Kalyan–Bhiwandi Road, Thane District, Maharashtra, India",
};

function PolicyPage({ title, children }) {
  return (
    <div className="flex-1 bg-gradient-to-br from-[#f5f2ff] to-white px-5 py-[60px] text-[#17152b]">
      <article className="mx-auto max-w-[820px] rounded-xl bg-white p-[38px] leading-7 shadow-[0_10px_30px_rgba(23,21,43,0.08)] [&_a]:text-[#7b68ee] [&_h1]:mt-0 [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-bold">
        <h1>{title}</h1>
        <p className="text-sm text-[#687087]">
          Last updated: November 19, 2026
        </p>
        {children}
        <p className="mt-[34px] text-sm text-[#687087]">
          <Link to="/">Return to home</Link>
        </p>
      </article>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <PolicyPage title="Privacy Policy">
      <p>
        {business.name} operates this e-learning website and respects your
        privacy.
      </p>
      <h2>Information we collect</h2>
      <p>
        We may collect your name, email address, password, course purchases,
        course progress, device and browser information, and support messages.
      </p>
      <h2>How we use information</h2>
      <p>
        We use information to create accounts, process course purchases, provide
        enrolled courses, send verification or reset emails, prevent fraud, and
        provide support.
      </p>
      <h2>Payments</h2>
      <p>
        Payments are processed by Razorpay. We do not receive or store your
        card, UPI, or bank credentials. Razorpay may process and retain payment
        information according to its own privacy policy.
      </p>
      <h2>Data storage and security</h2>
      <p>
        Passwords are encrypted, and authentication uses secure tokens. Course
        videos are stored in private AWS S3 storage and use short-lived viewing
        links. Reasonable measures are used to protect data, but no internet
        service is completely secure.
      </p>
      <h2>Cookies and third-party services</h2>
      <p>
        The website may use essential browser storage for authentication. Email,
        payment, database, and media providers may receive information needed to
        provide their services.
      </p>
      <h2>Your choices</h2>
      <p>
        You may request account, data, or privacy questions through{" "}
        {business.email}. We may retain records where required for payment,
        fraud prevention, or legal compliance.
      </p>
      <h2>Contact</h2>
      <p>
        {business.name}
        <br />
        {business.address}
        <br />
        <a href={`mailto:${business.email.replace(/^\[|\]$/g, "")}`}>
          {business.email}
        </a>
      </p>
    </PolicyPage>
  );
}

export function Terms() {
  return (
    <PolicyPage title="Terms and Conditions">
      <p>
        By registering for or using {business.name}, you agree to these terms.
      </p>
      <h2>Accounts</h2>
      <p>
        You must provide accurate information and keep your login credentials
        confidential. We may suspend accounts involved in unauthorized access or
        misuse.
      </p>
      <h2>Course access</h2>
      <p>
        Purchased access is limited to the account that completed the purchase.
        Courses, videos, and course materials may not be redistributed, copied,
        resold, or shared publicly.
      </p>
      <h2>Payments</h2>
      <p>
        Prices are shown before checkout. Payments are processed securely
        through Razorpay. A course is activated after successful
        captured-payment verification.
      </p>
      <h2>Acceptable use</h2>
      <p>
        You may not attempt to bypass access controls, disrupt the service,
        upload unlawful content, or use the platform for fraud or abuse.
      </p>
      <h2>Availability</h2>
      <p>
        Course availability and platform features may change. We do not
        guarantee uninterrupted access or that every course will remain
        available indefinitely.
      </p>
      <h2>Contact</h2>
      <p>Questions or complaints can be sent to {business.email}.</p>
    </PolicyPage>
  );
}

export function RefundPolicy() {
  return (
    <PolicyPage title="Refund and Cancellation Policy">
      <p>
        Refund requests for purchases made through {business.name} must follow
        this policy.
      </p>
      <h2>Cancellation</h2>
      <p>
        You may cancel a purchase before it is completed in Razorpay checkout.
        Once payment is captured, the course may be activated automatically.
      </p>
      <h2>Refund requests</h2>
      <p>
        Requests must be sent to {business.email} within 7 days of payment and
        include the payment ID, account email, course name, and reason.
      </p>
      <h2>Eligibility</h2>
      <p>
        Refund approval depends on course access already used, misuse or policy
        violations, duplicate or accidental payments, or a service failure.
        Completed or substantially consumed digital courses may not be eligible.
      </p>
      <h2>Processing</h2>
      <p>
        If approved, Razorpay initiates the refund to the original payment
        method. Processing time can vary by bank or payment method and is not
        guaranteed by {business.name}.
      </p>
      <h2>Course access after refund</h2>
      <p>
        Approved refunds may result in course access being revoked. Processing
        and access changes will be confirmed by support.
      </p>
    </PolicyPage>
  );
}

export function Contact() {
  return (
    <PolicyPage title="Contact Us">
      <p>
        For account, course, payment, refund, or privacy assistance, contact:
      </p>
      <h2>{business.name}</h2>
      <p>
        <strong>Email:</strong>{" "}
        <a href={`mailto:${business.email.replace(/^\[|\]$/g, "")}`}>
          {business.email}
        </a>
      </p>
      <p>
        <strong>Website:</strong> {business.website}
      </p>
      <p>
        <strong>Address:</strong> {business.address}
      </p>
      <p>
        Support requests should include the account email, course name, and
        Razorpay payment ID if the inquiry is about a purchase.
      </p>
    </PolicyPage>
  );
}
