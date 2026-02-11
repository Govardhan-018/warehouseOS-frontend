import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import Navbar from "../components/navbar";

// Cyberpunk-themed markdown renderer
const ReportRenderer = ({ content }) => {
    // Color mapping for different section types
    const getSectionColor = (heading) => {
        const text = heading?.toString().toLowerCase() || '';
        if (text.includes('executive')) return { border: 'border-cyan-500/50', bg: 'bg-cyan-500/10', text: 'text-cyan-300', icon: '█' };
        if (text.includes('system') || text.includes('operational')) return { border: 'border-purple-500/50', bg: 'bg-purple-500/10', text: 'text-purple-300', icon: '▮' };
        if (text.includes('inventory')) return { border: 'border-pink-500/50', bg: 'bg-pink-500/10', text: 'text-pink-300', icon: '◆' };
        if (text.includes('alert') || text.includes('risk')) return { border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-300', icon: '⚠' };
        if (text.includes('performance') || text.includes('metric')) return { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-300', icon: '◈' };
        if (text.includes('bottleneck') || text.includes('constraint')) return { border: 'border-orange-500/50', bg: 'bg-orange-500/10', text: 'text-orange-300', icon: '✕' };
        if (text.includes('optimization') || text.includes('opportunity')) return { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-300', icon: '▲' };
        if (text.includes('action') || text.includes('plan')) return { border: 'border-cyan-500/50', bg: 'bg-cyan-500/10', text: 'text-cyan-300', icon: '→' };
        return { border: 'border-slate-600/50', bg: 'bg-slate-600/10', text: 'text-slate-300', icon: '■' };
    };

    const components = {
        h1: ({ children }) => (
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 mb-3">
                    {children}
                </h1>
                <div className="h-1 w-32 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 rounded-full"></div>
            </div>
        ),
        
        h2: ({ children }) => {
            const colors = getSectionColor(children);
            return (
                <div className={`mt-10 mb-6 p-4 rounded-xl border-l-4 ${colors.border} ${colors.bg} backdrop-blur-sm`}>
                    <h2 className={`text-2xl font-bold ${colors.text} flex items-center gap-3`}>
                        <span className="text-2xl">{colors.icon}</span>
                        {children}
                    </h2>
                </div>
            );
        },
        
        h3: ({ children }) => (
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 mt-6 mb-3 flex items-center gap-2">
                <span className="w-1 h-1 bg-cyan-400 rounded-full"></span>
                {children}
            </h3>
        ),
        
        p: ({ children }) => (
            <p className="text-slate-300 leading-relaxed mb-4 font-light">
                {children}
            </p>
        ),
        
        ul: ({ children }) => (
            <ul className="space-y-2.5 mb-6">
                {children}
            </ul>
        ),
        
        li: ({ children }) => {
            const text = children?.toString().toLowerCase() || '';
            let color = 'cyan';
            if (text.includes('critical') || text.includes('urgent')) color = 'red';
            else if (text.includes('warning') || text.includes('risk')) color = 'orange';
            else if (text.includes('opportun') || text.includes('recommend')) color = 'emerald';
            else if (text.includes('metric') || text.includes('performance')) color = 'purple';
            
            const colorMap = {
                cyan: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-200',
                red: 'border-red-500/30 bg-red-500/5 text-red-200',
                orange: 'border-orange-500/30 bg-orange-500/5 text-orange-200',
                emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200',
                purple: 'border-purple-500/30 bg-purple-500/5 text-purple-200'
            };

            return (
                <li className={`flex items-start gap-3 p-3 rounded-lg border-l-2 ${colorMap[color]} transition-all hover:translate-x-1 hover:shadow-lg hover:shadow-${color}-500/10`}>
                    <span className="text-cyan-400 flex-shrink-0 font-bold">◆</span>
                    <span className="flex-1 text-slate-200">{children}</span>
                </li>
            );
        },
        
        strong: ({ children }) => {
            const text = children?.toString() || '';
            const isMetric = /\d/.test(text) || text.includes('%') || text.includes(':');
            
            if (isMetric) {
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-100 mx-1 whitespace-nowrap">
                        {children}
                    </span>
                );
            }
            
            return <strong className="font-bold text-white">{children}</strong>;
        },
        
        em: ({ children }) => (
            <em className="text-purple-300 italic font-semibold">{children}</em>
        ),
        
        hr: () => (
            <div className="my-8 h-px bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-transparent rounded-full"></div>
        ),
        
        code: ({ children }) => (
            <code className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-cyan-500/30 text-cyan-300 text-sm font-mono font-semibold">
                {children}
            </code>
        ),
    };

    return (
        <div className="space-y-4">
            <ReactMarkdown components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

function AIReport() {
    const [report, setReport] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const generateReport = async () => {
        try {
            setLoading(true);
            setError("");
            setReport("");

            const token = localStorage.getItem("token");
            const userEmail = localStorage.getItem("mail");

            if (!token || !userEmail) {
                setError("Authentication missing. Redirecting...");
                setTimeout(() => navigate("/"), 1500);
                return;
            }

            const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3939";

            const res = await fetch(`${base}/generate-report`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ mail: userEmail }),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.clear();
                    navigate("/");
                    return;
                }
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData?.error || `Server error: ${res.status}`);
            }

            const data = await res.json();
            setReport(data.report);

        } catch (err) {
            console.error("Report Generation Error:", err);
            setError(err?.message || "Failed to generate report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateReport();
    }, []);

    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent)] opacity-40"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
            </div>

            <Navbar />

            <main className="relative z-10 px-6 py-10 max-w-5xl mx-auto">
                {/* --- Report Header --- */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in-down">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-2 w-2 rounded-full bg-cyan-500"></span>
                            <span className="text-xs font-mono font-medium text-cyan-500 uppercase tracking-widest">AI Intelligence</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                            Warehouse <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Analysis</span>
                        </h1>
                        <p className="text-slate-500 mt-2 max-w-xl">
                            Intelligent insights and operational recommendations powered by AI.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/home")}
                        className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-sm font-medium flex items-center gap-2 h-fit"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                </div>

                {/* --- Error State --- */}
                {error && (
                    <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 animate-fade-in-up">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* --- Report Container --- */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl animate-fade-in-up">
                    {loading ? (
                        // --- Loading State ---
                        <div className="flex flex-col items-center justify-center space-y-6 py-20">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-cyan-200 font-medium text-lg">Analyzing Warehouse Data</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                    Scanning inventory levels, alerts, and operational metrics...
                                </p>
                            </div>
                        </div>
                    ) : report ? (
                        // --- Report Content ---
                        <div className="space-y-6">
                            <ReportRenderer content={report} />
                        </div>
                    ) : (
                        // --- Empty State ---
                        <div className="text-center py-20 space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Ready to generate a report?</h3>
                                <p className="text-slate-400">Click the button below to analyze your warehouse operations.</p>
                            </div>
                            <button
                                onClick={generateReport}
                                className="px-8 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2 mx-auto"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate Analysis
                            </button>
                        </div>
                    )}
                </div>

                {/* --- Action Buttons (shown after report loads) --- */}
                {!loading && report && (
                    <div className="mt-8 flex justify-center gap-4 animate-fade-in-up">
                        <button
                            onClick={generateReport}
                            className="px-6 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-sm font-medium flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh Analysis
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AIReport;
