"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SignatureCanvas = require("react-signature-canvas").default;
import { toast } from "sonner";

interface LeadData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function SignAgreementPage() {
  const { leadId } = useParams();
  const [lead, setLead] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sigPadRef = useRef<any>(null);

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  const terminationDate = sixMonths.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    if (!leadId) return;
    fetch(`/api/sign-agreement/${leadId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setLead(data);
      })
      .catch(() => setError("Failed to load agreement"))
      .finally(() => setLoading(false));
  }, [leadId]);

  const handleClearSignature = () => {
    sigPadRef.current?.clear();
    setSignatureData(null);
  };

  const handleSignatureEnd = () => {
    if (sigPadRef.current) {
      setSignatureData(sigPadRef.current.getTrimmedCanvas().toDataURL("image/png"));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);

    // Upload to Cloudinary via signed upload
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");
      formData.append("folder", "signed-agreements");
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) setUploadedFileUrl(data.secure_url);
    } catch {
      console.warn("File upload failed, will skip URL");
    }
  };

  const handleSubmit = async () => {
    if (!signatureData) {
      toast.error("Please draw your signature before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sign-agreement/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData, uploadedFileUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
      toast.success("Agreement signed successfully! Check your email for a copy.");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── LOADING STATE ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#c0002a] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading your agreement…</p>
        </div>
      </div>
    );
  }

  // ─── ERROR STATE ───────────────────────────────────────────────────────────
  if (error || !lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Agreement Not Found</h2>
          <p className="text-gray-500">This agreement link is invalid or has expired. Please contact GulfShore Group.</p>
        </div>
      </div>
    );
  }

  // ─── SUCCESS STATE ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff5f6] to-white p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Agreement Signed! ✅</h2>
          <p className="text-gray-600 mb-2">
            Thank you, <strong>{lead.name}</strong>! Your Buyer Broker Agreement with GulfShore Group has been signed.
          </p>
          <p className="text-gray-500 text-sm">
            📧 A copy has been emailed to <strong>{lead.email}</strong>
          </p>
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">GulfShore Group · London Foster Realty</p>
            <p className="text-xs text-gray-400">2367 Vanderbilt Beach Rd, Suite 812 · Naples, FL 34109</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN AGREEMENT FORM ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#c0002a] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">G</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm leading-tight">GulfShore Group</h1>
            <p className="text-xs text-gray-500">with London Foster Realty</p>
          </div>
          <div className="ml-auto">
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
              📝 Signature Required
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Buyer Broker Agreement</h2>
          <p className="text-gray-500 mt-1 text-sm">Exclusive · NABOR Form · Please review and sign below</p>
        </div>

        {/* Agreement Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#c0002a] px-6 py-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Agreement Details</h3>
          </div>
          <div className="p-6 space-y-4">

            {/* Buyer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Buyer Name</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium text-sm flex items-center gap-2">
                  <span className="text-[#c0002a]">👤</span> {lead.name}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium text-sm flex items-center gap-2">
                  <span>✉️</span> {lead.email}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium text-sm flex items-center gap-2">
                  <span>📱</span> {lead.phone || "—"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium text-sm flex items-center gap-2">
                  <span>📅</span> {today}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              {/* Broker */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Broker</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium text-sm">
                  GulfShore Group with London Foster Realty
                </div>
              </div>

              {/* Transaction Broker */}
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-blue-800">Transaction Broker</span>
              </div>

              {/* Commission */}
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-green-800">
                  Broker Commission: <strong>3%</strong> of purchase price
                </span>
              </div>

              {/* Term */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-xs text-amber-800">
                  <strong>Term:</strong> This agreement commences on <strong>{today}</strong> and terminates on <strong>{terminationDate}</strong> (6 months).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">📄 Full Agreement Document</h3>
            <a
              href="/forms/bb-ex.pdf"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-300 hover:text-white underline"
            >
              Open in new tab ↗
            </a>
          </div>
          <div className="h-[500px]">
            <iframe
              src="/forms/bb-ex.pdf"
              width="100%"
              height="100%"
              title="Buyer Broker Agreement PDF"
              className="border-0"
            />
          </div>
        </div>

        {/* Signature Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-800 px-6 py-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">✍️ Your Signature</h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-500">
              Please draw your signature in the box below. By signing, you agree to the terms of the Buyer Broker Agreement.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 relative">
              <div className="absolute top-2 right-3 z-10">
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="text-xs text-red-500 hover:text-red-700 font-medium bg-white border border-red-200 rounded px-2 py-1"
                >
                  Clear
                </button>
              </div>
              <SignatureCanvas
                ref={sigPadRef}
                penColor="#1a1a2e"
                canvasProps={{
                  className: "w-full h-40 cursor-crosshair",
                  style: { background: "transparent" },
                }}
                onEnd={handleSignatureEnd}
              />
              {!signatureData && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-300 text-sm font-medium">Draw your signature here</p>
                </div>
              )}
            </div>
            {signatureData && (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Signature captured
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-gray-700 font-semibold text-sm uppercase tracking-wider">
              📎 Upload Signed Copy (Optional)
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">
              If you have a physically signed copy, you can upload it here as well.
            </p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-[#c0002a] hover:bg-red-50/30 transition-colors">
              <div className="text-3xl mb-2">📂</div>
              <span className="text-sm font-medium text-gray-600">Click to upload PDF or image</span>
              <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 10MB</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {uploadedFile && (
              <div className="mt-3 flex items-center gap-2 text-green-600 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {uploadedFile.name} uploaded
                {uploadedFileUrl && <span className="text-xs text-gray-400 ml-1">(saved)</span>}
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer + Submit */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500 leading-relaxed">
              By clicking <strong>"Sign & Submit Agreement"</strong>, I, <strong>{lead.name}</strong>, agree that my electronic signature is legally binding and that I have read and understood the Buyer Broker Agreement (Exclusive) as provided by GulfShore Group with London Foster Realty, Naples, FL.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !signatureData}
            className={`w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-3 transition-all ${
              signatureData
                ? "bg-[#c0002a] hover:bg-[#a0001f] shadow-lg hover:shadow-xl active:scale-[0.98]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                ✍️ Sign & Submit Agreement
              </>
            )}
          </button>

          {!signatureData && (
            <p className="text-center text-xs text-gray-400">Please draw your signature above to enable submission</p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">GulfShore Group · London Foster Realty</p>
          <p className="text-xs text-gray-400">2367 Vanderbilt Beach Rd, Suite 812 · Naples, FL 34109</p>
        </div>
      </div>
    </div>
  );
}
