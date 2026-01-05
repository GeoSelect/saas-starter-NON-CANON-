"use client";
import React, { useRef, useState } from "react";

export type Contact = {
  name: string;
  email: string;
  phone?: string;
  [key: string]: string | undefined;
};

export function ContactsCsvImport({ onImport }: { onImport: (contacts: Contact[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Contact[]>([]);

  function parseCsv(text: string): Contact[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",");
      // Ensure required fields are present
      const contact: Contact = { name: "", email: "" };
      headers.forEach((header, i) => {
        contact[header] = values[i]?.trim();
      });
      return contact;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsv(text);
        if (parsed.length === 0) throw new Error("No contacts found in CSV");
        setPreview(parsed.slice(0, 5));
        setContacts(parsed);
      } catch (err: any) {
        setError(err.message || "Failed to parse CSV");
      }
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (contacts.length === 0) {
      setError("No contacts to import");
      return;
    }
    onImport(contacts);
  }

  return (
    <div className="contacts-csv-import border rounded p-4 max-w-md mx-auto">
      <h2 className="font-bold mb-2">Import Contacts (.csv)</h2>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="mb-2"
      />
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {preview.length > 0 && (
        <div className="mb-2">
          <div className="font-semibold">Preview (first 5):</div>
          <table className="w-full text-sm border">
            <thead>
              <tr>
                {Object.keys(preview[0]).map((header) => (
                  <th key={header} className="border px-2 py-1">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((contact, i) => (
                <tr key={i}>
                  {Object.values(contact).map((val, j) => (
                    <td key={j} className="border px-2 py-1">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleImport}
        disabled={contacts.length === 0}
      >
        Import {contacts.length > 0 ? `(${contacts.length})` : ""}
      </button>
    </div>
  );
}
