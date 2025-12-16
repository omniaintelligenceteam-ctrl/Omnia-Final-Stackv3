"use client";
import { useState } from "react";
import { useUser, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Loader2, Upload, Zap } from "lucide-react";
import { Paywall } from "./components/paywall";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  
  // Paywall State
  const [showPaywall, setShowPaywall] = useState(false);

  // Handle Image Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  // Handle Submission
  const handleSubmit = async () => {
    if (!file) return alert("Please select an image first.");
    setLoading(true);
    setResult("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("prompt", prompt);

      // Call our new API (The "Brain")
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (data.success) {
        setResult(data.result);
      } else {
        setResult("Error: " + data.error);
      }
    } catch (e) {
      setResult("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      
      {/* Header */}
      <nav className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
             <Zap size={16} className="text-yellow-400 fill-yellow-400" />
           </div>
           <h1 className="font-bold text-xl tracking-tight">Omnia Light Scape PRO</h1>
        </div>
        <div>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
        
        {!isSignedIn ? (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-4">Professional Lighting Design AI</h2>
            <p className="text-gray-500 mb-8">Sign in to start generating photorealistic lighting mockups.</p>
            <SignInButton mode="modal">
               <button className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                 Get Started
               </button>
            </SignInButton>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="text-center mb-2">
              <h2 className="text-lg font-semibold">New Project</h2>
              <p className="text-sm text-gray-400">Upload a daytime photo to begin.</p>
            </div>

            {/* Image Upload Area */}
            <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${file ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-64 rounded-lg shadow-md object-cover" />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <Upload size={20} />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Click to upload photo</span>
                  </>
                )}
              </label>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Architect Notes (Optional)</label>
              <textarea 
                placeholder="E.g., Focus on the columns, use warm 3000K light..." 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                rows={3}
              />
            </div>

            {/* Action Button */}
            <button 
              onClick={handleSubmit} 
              disabled={loading || !file}
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Generating...
                </>
              ) : (
                "Generate Lighting Design"
              )}
            </button>

            {/* Results Area */}
            {result && (
              <div className="mt-6 bg-gray-50 rounded-2xl p-6 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Zap size={16} className="text-black" /> AI Analysis
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
              </div>
            )}
            
            {/* Upgrade Button (Demo) */}
            <button onClick={() => setShowPaywall(true)} className="text-xs text-center text-gray-400 underline hover:text-black">
              View Upgrade Options
            </button>
          </div>
        )}
      </div>

      {/* The Paywall Component */}
      <Paywall 
        isOpen={showPaywall} 
        userSubscriptionStatus="none" // Default for now
        onSubscribe={async () => {}}
        onManageBilling={async () => {}}
      />
    </main>
  );
}
