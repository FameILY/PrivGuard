'use client';

import { Shield, FileText, Image as ImageIcon, Video, Mic, Upload, Zap, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession, signIn, signOut } from "next-auth/react"


export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('text');
  const [file, setFile] = useState(null);
  const [redactionLevel, setRedactionLevel] = useState([2]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { data } = useSession()
  
  console.log("User:", data);

  const sections = [
    {
      id: 'text',
      icon: FileText,
      title: "Text & Documents",
      description: "Redact .txt files",
      color: "from-cyan-500 to-blue-500",
      enabled: true
    },
    {
      id: 'pdf',
      icon: FileText,
      title: "PDF Files",
      description: "Coming soon",
      color: "from-violet-500 to-purple-500",
      enabled: false
    },
    {
      id: 'audio',
      icon: Mic,
      title: "Audio Files",
      description: "Coming soon",
      color: "from-green-500 to-emerald-500",
      enabled: false
    },
    {
      id: 'video',
      icon: Video,
      title: "Video Files",
      description: "Coming soon",
      color: "from-orange-500 to-red-500",
      enabled: false
    }
  ];

  const redactionLevels = {
    1: { label: "Light", description: "Basic PII redaction", color: "text-green-400" },
    2: { label: "Medium", description: "Standard protection", color: "text-yellow-400" },
    3: { label: "Heavy", description: "Maximum security", color: "text-red-400" }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/plain") {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    } else {
      setError("Please select a valid .txt file");
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('redaction_level', redactionLevel[0]);

      const response = await fetch('http://localhost:8000/text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to process file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setRedactionLevel([2]);
  };

  const handleRedirect = () => {
    window.location.href = '/';
  };
  
  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Noise texture overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}></div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-white/5 backdrop-blur-xl bg-black/20">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-xl blur-lg opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-cyan-500 to-violet-600 p-2.5 rounded-xl">
                    <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-orange-400 bg-clip-text text-transparent">
                  PrivGuard
                </span>
              </div>
              <Button onClick={handleRedirect} variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </nav>

        {/* Dashboard Header */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-8">
          <div className="text-center">
            <Badge variant="outline" className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/5 border-white/10 text-gray-300 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-cyan-400" />
              Redaction Dashboard
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              {data?.user.name ? `Welcome, ${data.user.name}!` : "Welcome to Your Dashboard!"}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Select a file type below to begin redacting sensitive information
            </p>
          </div>
        </section>

        {/* Section Selector */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <Card
                  key={section.id}
                  onClick={() => section.enabled && setActiveSection(section.id)}
                  className={`group relative cursor-pointer transition-all duration-300 overflow-hidden ${
                    isActive 
                      ? 'bg-white/[0.08] border-white/20 scale-105' 
                      : section.enabled 
                        ? 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
                        : 'bg-white/[0.01] border-white/5 opacity-40 cursor-not-allowed'
                  }`}
                >
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-10`}></div>
                  )}
                  
                  <CardContent className="relative p-6 text-center">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${section.color} mb-3 ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    } transition-transform`}>
                      <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className="font-bold text-white mb-1">{section.title}</h3>
                    <p className="text-sm text-gray-500">{section.description}</p>
                    {!section.enabled && (
                      <Badge className="mt-2 bg-white/5 text-gray-500 border-0 text-xs">
                        Under Development
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Main Content Area */}
        <section className="max-w-7xl mx-auto px-6 py-8 pb-24">
          {activeSection === 'text' ? (
            <div className="max-w-4xl mx-auto">
              {/* Upload & Configuration Card */}
              {!result && (
                <Card className="bg-white/[0.02] border-white/5 backdrop-blur-sm mb-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${currentSection.color}`}>
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      Text File Redaction
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Upload a .txt file and select the redaction level
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-8">
                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Select File
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".txt"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                          disabled={isProcessing}
                        />
                        <label
                          htmlFor="file-upload"
                          className={`block border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                            file 
                              ? 'border-cyan-500/50 bg-cyan-500/5' 
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="flex flex-col items-center gap-4">
                            {file ? (
                              <>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500">
                                  <FileText className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                  <p className="text-lg font-semibold text-white mb-1">{file.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {(file.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                                {!isProcessing && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleReset();
                                    }}
                                    className="text-gray-400 hover:text-white hover:bg-white/10"
                                  >
                                    Change File
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <Upload className="w-12 h-12 text-gray-500" />
                                <div>
                                  <p className="text-lg font-semibold text-white mb-1">
                                    Click to upload or drag and drop
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    .txt files only
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Redaction Level Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-semibold text-gray-300">
                          Redaction Level
                        </label>
                        <Badge className={`${redactionLevels[redactionLevel[0]].color} bg-white/5 border-0`}>
                          {redactionLevels[redactionLevel[0]].label}
                        </Badge>
                      </div>
                      
                      <div className="relative px-2">
                        <Slider
                          value={redactionLevel}
                          onValueChange={setRedactionLevel}
                          min={1}
                          max={3}
                          step={1}
                          disabled={isProcessing}
                          className="mb-4"
                        />
                        
                        <div className="flex justify-between text-xs text-gray-500 px-1">
                          <span>Light</span>
                          <span>Medium</span>
                          <span>Heavy</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mt-3 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                        {redactionLevels[redactionLevel[0]].description}
                      </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                      <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmit}
                      disabled={!file || isProcessing}
                      className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white border-0 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all duration-300 h-14 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Redact File
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Processing Animation */}
              {isProcessing && (
                <Card className="bg-white/[0.02] border-white/5 backdrop-blur-sm">
                  <CardContent className="py-16">
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-violet-500 to-orange-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                        <div className="relative bg-gradient-to-r from-cyan-500 via-violet-500 to-orange-500 p-6 rounded-full">
                          <Loader2 className="w-12 h-12 text-white animate-spin" />
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-white mb-2">
                          Analyzing & Redacting
                        </h3>
                        <p className="text-gray-400">
                          Please wait while we process your file...
                        </p>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-3 h-3 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results Display */}
              {result && (
                <div className="space-y-6">
                  {/* Success Header */}
                  <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="py-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-500/20">
                          <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">
                            Redaction Complete
                          </h3>
                          <p className="text-gray-400">
                            Your file has been successfully processed
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Results Content */}
                  <Card className="bg-white/[0.02] border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-white">
                          Redacted Content
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-black/30 rounded-xl p-6 border border-white/5 font-mono text-sm">
                        <pre className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                          {result.redacted_text || JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Metadata */}
                  {result.metadata && (
                    <Card className="bg-white/[0.02] border-white/5 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">
                          Processing Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Object.entries(result.metadata).map(([key, value]) => (
                            <div key={key} className="bg-white/[0.02] p-4 rounded-lg border border-white/5">
                              <p className="text-xs text-gray-500 mb-1 capitalize">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-lg font-semibold text-white">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleReset}
                      className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                    >
                      Process Another File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Other sections - Under Development
            <Card className="bg-white/[0.02] border-white/5 backdrop-blur-sm max-w-2xl mx-auto">
              <CardContent className="py-24 text-center">
                <div className={`inline-flex p-6 rounded-2xl bg-gradient-to-br ${currentSection.color} mb-6 opacity-50`}>
                  {(() => {
                    const Icon = currentSection.icon;
                    return <Icon className="w-12 h-12 text-white" />;
                  })()}
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">
                  {currentSection.title}
                </h3>
                <p className="text-xl text-gray-400 mb-8">
                  This feature is currently under development
                </p>
                <Badge className="bg-white/5 text-gray-500 border-0 px-6 py-2">
                  Coming Soon
                </Badge>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}