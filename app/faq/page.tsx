import React from "react";
import { ChatSupport } from "@/components/ui/ChatSupport";

const FAQS = [
  {
    question: "How do I use my location?",
    answer: "Click the 'Use my location' button on the sign-in page to allow the app to access your GPS coordinates."
  },
  {
    question: "How do I record a video?",
    answer: "Use the 'Record' button to start your camera and microphone."
  },
  {
    question: "How do I share my report?",
    answer: "Click the Share icon on the report page and select a contact to share with."
  },
  // Add more FAQs as needed
];

export default function FAQPage() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Frequently Asked Questions</h1>
      <div>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 18 }}>{faq.question}</div>
            <div style={{ marginTop: 4, color: '#444' }}>{faq.answer}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Need more help?</h2>
        <ChatSupport />
      </div>
    </div>
  );
}
