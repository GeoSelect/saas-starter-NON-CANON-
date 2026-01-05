import React, { useRef, useState } from "react";
import { Paperclip } from "lucide-react";

function GeneralSettingsLogoUpload() {
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="mt-8">
      <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={fileName}
          readOnly
          placeholder="No file selected"
          className="flex-1 px-3 py-2 border rounded bg-gray-50 text-gray-700 text-sm"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-2 border rounded bg-white hover:bg-gray-100 text-sm font-medium"
        >
          <Paperclip className="w-4 h-4 mr-1" />
          Upload Logo
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
        <p className="mt-1 text-sm text-gray-600">Manage your organization’s general preferences and branding.</p>
      </div>
      <GeneralSettingsLogoUpload />
    </div>
  );
}
