import React from "react";

export function TermsPage({ onBack }) {
  const sections = [
    ["1. Acceptance of Terms", "By accessing or using Ravlin, you agree to be bound by these Terms and Conditions. Ravlin reserves the right to update these terms at any time, and continued use constitutes acceptance of any changes. You must be at least 13 years of age to use Ravlin. By using this service you represent that you are 13 years of age or older."],
    ["2. Nature of Service", "Ravlin is an AI-powered informational assistant for hunters and anglers. It is not a licensed guide, outfitter, or wildlife agency. All information is for general educational purposes only."],
    ["3. Regulatory Disclaimer", "Hunting and fishing regulations change frequently. Ravlin makes no guarantee that information on seasons, bag limits, or license requirements is current. You are solely responsible for verifying regulations with your state wildlife agency."],
    ["4. Accuracy of Information", "Ravlin strives to provide accurate information but may make errors or provide outdated advice. Always apply your own judgment and consult licensed professionals for decisions involving safety or legality."],
    ["5. Safety and Personal Responsibility", "Hunting and fishing involve inherent risks. Ravlin accepts no liability for any injury, death, or loss resulting from acting on information provided. Users engage in all outdoor activities at their own risk."],
    ["6. Free Tier and Paid Services", "Ravlin offers limited free messages per session. Additional use may require a paid subscription. Ravlin reserves the right to modify or discontinue any tier of service with reasonable notice."],
    ["7. User Conduct", "You agree not to use Ravlin to facilitate illegal hunting or fishing, poaching, or violations of wildlife protection laws. You agree not to post content that is illegal, threatening, harassing, defamatory, obscene, or otherwise objectionable. Ravlin may remove content and terminate access for users who violate these terms without prior notice."],
    ["8. User-Generated Content", "Ravlin hosts user-generated content including posts, photos, messages, and location pins. Ravlin is not responsible for the accuracy, legality, or appropriateness of user-generated content. By posting content, you grant Ravlin a non-exclusive license to display and distribute that content within the platform. You represent that you own or have the right to share any content you post. Ravlin reserves the right to remove any content at its sole discretion."],
    ["9. Community Guidelines", "Users must not post content depicting illegal take of wildlife, trespassing on private property, animal cruelty, or any activity that violates federal, state, or local law. Users must not impersonate other individuals or post private information about others without consent. Violation of community guidelines may result in immediate account termination."],
    ["10. Reporting and Moderation", "Ravlin provides a reporting mechanism for users to flag content that violates these terms. Ravlin reviews reported content and takes action at its discretion. Ravlin is not obligated to monitor all content but will act in good faith upon receiving reports. To report content, use the report button available on each post."],
    ["11. Private Messaging", "Ravlin provides a private messaging feature between users. Messages are stored securely and are not reviewed by Ravlin unless reported. Users are solely responsible for the content of their messages. Ravlin may access message content if required by law or to investigate reports of abuse."],
    ["12. Location Data", "Ravlin may request access to your device location to provide location-based features. Location data is used solely within the app and is not sold to third parties. Location pins you share publicly are visible to other users."],
    ["13. Intellectual Property", "All content, design, and functionality of Ravlin is protected by applicable intellectual property laws. Reproduction without express written permission is prohibited."],
    ["14. Limitation of Liability", "To the fullest extent permitted by law, Ravlin and its affiliates shall not be liable for any direct, indirect, or consequential damages arising from use of the service, including damages arising from user-generated content posted by third parties."],
    ["15. Indemnification", "You agree to indemnify and hold harmless Ravlin and its affiliates from any claims, damages, or expenses arising from your use of the service, your violation of these terms, or your violation of any third-party rights."],
    ["16. Contact", "Questions about these Terms or to report content violations may be directed to Ravlin through the website. We respond to reasonable inquiries in a timely manner."],
  ];
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid var(--border)" }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }}>← Back</button>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)" }}>Ravlin · Terms & Conditions</span>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Terms & Conditions</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 40 }}>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        {sections.map(([title, body], i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>{title}</h2>
            <p style={{ color: "var(--text2)", fontSize: 15, lineHeight: 1.8 }}>{body}</p>
          </div>
        ))}
        <div style={{ marginTop: 40, padding: "20px 24px", background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)" }}>
          <p style={{ color: "var(--green)", fontSize: 14, lineHeight: 1.7 }}>🦌 Always check your state's current hunting and fishing regulations before heading out. Your state wildlife agency is the definitive source.</p>
        </div>
        <button onClick={onBack} className="btn-primary" style={{ marginTop: 36, padding: "14px 32px", fontSize: 15 }}>← Back to Ravlin</button>
      </div>
    </div>
  );
}
