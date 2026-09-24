"use client";

import { useState, type FormEvent } from "react";
import { LIMITS } from "@/lib/validation";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Download,
  Calendar,
  RotateCcw,
  CheckCircle2,
  User,
  Terminal,
  MapPin,
  Globe,
  Loader2,
} from "lucide-react";
import { Barcode } from "@/components/ui/Barcode";
import {
  attendanceOptions,
  experienceLevels,
  quantumInterests,
  studyLevels,
  tshirtSizes,
} from "@/data/registration";
import { RegistrationFormData } from "@/types";
import { registerAttendee } from "@/app/actions/register";
import { cn } from "@/lib/utils";

const initialFormData: RegistrationFormData = {
  fullName: "",
  email: "",
  phone: "",
  institution: "",
  studyLevel: "",
  graduationYear: "",
  attendanceMode: "offline",
  quantumExperience: "beginner",
  interests: [],
  githubUrl: "",
  linkedinUrl: "",
  tshirtSize: "M (38\")",
  referredByCode: "",
  agreedToTerms: false,
  willingToBePOC: false,
};

export function RegistrationForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<RegistrationFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionPhase, setSubmissionPhase] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const updateField = <K extends keyof RegistrationFormData>(
    field: K,
    value: RegistrationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      const nextInterests = exists
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: nextInterests };
    });
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!formData.email.trim()) {
        newErrors.email = "Email address is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!formData.institution.trim()) newErrors.institution = "College or university name is required";
      if (!formData.phone.trim()) newErrors.phone = "Contact phone number is required";
      if (!formData.attendanceMode) {
        newErrors.attendanceMode = "Please select whether you will attend offline or online";
      }
    }

    if (currentStep === 2) {
      if (!formData.agreedToTerms) {
        newErrors.agreedToTerms = "You must agree to the Code of Conduct to register";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(2);
      const formEl = document.getElementById("register-form");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handlePrev = () => {
    setStep(1);
    const formEl = document.getElementById("register-form");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmissionPhase("Initializing quantum register |0⟩...");

    const timer1 = setTimeout(() => {
      setSubmissionPhase("Allocating IBM Quantum compute profile...");
    }, 500);

    const timer2 = setTimeout(() => {
      setSubmissionPhase("Saving record to Neon database...");
    }, 1100);

    try {
      const result = await registerAttendee(formData);

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!result.success) {
        throw new Error(result.error || "Failed to submit registration. Please try again.");
      }

      if (result.ticketId) {
        setTicketId(result.ticketId);
        setReferralCode(result.referralCode || "");
        setIsSubmitted(true);
        window.scrollTo({ top: 100, behavior: "smooth" });
      } else {
        throw new Error("Invalid response received from server.");
      }
    } catch (err: unknown) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during registration.";
      setSubmitError(message);
      window.scrollTo({ top: 160, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setStep(1);
    setIsSubmitted(false);
    setTicketId("");
    setReferralCode("");
    setSubmitError(null);
  };

  // If submitted, display digital attendee pass
  if (isSubmitted) {
    return (
      <div id="register-form" className="space-y-8 animate-[fadeUp_0.6s_ease-out_forwards]">
        <div className="glass-dark rounded-3xl border border-pink/40 p-6 text-center shadow-[0_0_50px_rgba(255,126,182,0.15)] sm:p-10 print:border-none print:bg-transparent print:p-0 print:shadow-none">
          {/* Confirmation Message */}
          <div className="print:hidden">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-pink/40 bg-pink/10 text-pink-ink shadow-[0_0_20px_rgba(255,126,182,0.3)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-pink/30 bg-pink/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-pink-ink">
              <Sparkles className="h-3.5 w-3.5 animate-pulse-glow" />
              Registration Confirmed
            </div>

            <h3 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              You&apos;re Set for <span className="text-gradient">QFF 2026</span>!
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
              Your registration has been securely recorded. Confirmation details have been logged for{" "}
              <span className="font-mono font-medium text-pink-ink">{formData.email}</span>.
            </p>

            {referralCode && (
              <div className="mx-auto mt-5 max-w-md rounded-2xl border border-pink/40 bg-pink/10 p-4 text-left shadow-[0_0_22px_rgba(255,126,182,0.08)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pink-ink">Your Referral Code</p>
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/80 px-3 py-2">
                  <span className="font-mono text-lg font-bold text-ink">{referralCode}</span>
                  <span className="rounded-full border border-pink/40 bg-pink/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-pink-ink">
                    Shareable
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Digital Quantum Pass Card (Print Target) */}
          <div id="printable-pass-wrapper" className="w-full">
            <div
              id="printable-pass"
              className="relative mx-auto mt-8 max-w-xl overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-surface-2 to-bg p-7 text-left shadow-2xl sm:p-9 print:mt-0 print:border-2 print:border-black print:bg-white print:p-6 print:shadow-none"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-bright/20 blur-3xl print:hidden"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-pink/15 blur-3xl print:hidden"
              />

              {/* Ticket Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5 print:border-slate-300">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-pink-ink print:text-sky-700 font-semibold">
                    Digital Attendee Pass
                  </span>
                  <p className="font-display text-xl font-bold text-ink print:text-black">
                    BITS Qiskit Fall Fest 2026
                  </p>
                </div>
                <div className="rounded-xl border border-pink/40 bg-pink/10 px-4 py-2 font-mono text-sm font-bold text-pink-ink shadow-[0_0_15px_rgba(255,126,182,0.2)] print:border-slate-800 print:bg-slate-100 print:text-black">
                  {ticketId}
                </div>
              </div>

              {/* Ticket Body */}
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted print:text-slate-600">
                    Attendee Name
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-ink print:text-black">
                    {formData.fullName}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted print:text-slate-600">
                    Attendance Mode
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-pink/40 bg-pink/10 px-3 py-1 font-mono text-xs font-semibold text-pink-ink print:border-slate-400 print:bg-slate-100 print:text-black">
                    {formData.attendanceMode === "offline" ? (
                      <>
                        <MapPin className="h-3.5 w-3.5" />
                        In-Person · BITS Campus
                      </>
                    ) : (
                      <>
                        <Globe className="h-3.5 w-3.5" />
                        Virtual · Remote Access
                      </>
                    )}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted print:text-slate-600">
                    Institution / University
                  </p>
                  <p className="mt-1 font-display text-sm font-medium text-ink print:text-slate-900">
                    {formData.institution}
                  </p>
                </div>
                {referralCode && (
                  <div className="sm:col-span-2">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted print:text-slate-600">
                      Referral Code
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold text-pink-ink print:text-sky-700">
                      {referralCode}
                    </p>
                  </div>
                )}
              </div>

              {/* Barcode Section */}
              <div className="mt-8 rounded-2xl border border-line bg-surface/80 p-5 print:border-slate-300 print:bg-slate-50">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Barcode value={ticketId} className="w-full max-w-[360px]" height={80} />
                  <div className="flex w-full items-center justify-between border-t border-line-soft pt-3 font-mono text-[10px] text-muted print:border-slate-300 print:text-slate-700">
                    <span className="flex items-center gap-1.5 font-semibold text-pink-ink">
                      <span className="h-1.5 w-1.5 rounded-full bg-pink shadow-[0_0_6px_rgba(255,126,182,0.8)] print:bg-slate-900" />
                      QFF-2026 VERIFIED
                    </span>
                    <span>Status: CONFIRMED</span>
                    <span>T-Shirt: {formData.tshirtSize.split(" ")[0]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-6 py-3 font-display text-sm font-bold text-ink-dim backdrop-blur-sm transition-all duration-300 hover:border-pink/60 hover:bg-surface-2 hover:text-ink"
            >
              <Download className="h-4 w-4 text-pink-ink" />
              Print / Save Pass
            </button>
            <a
              href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=BITS+Qiskit+Fall+Fest+2026&dates=20261028%2F20261102&details=PLUS+Qiskit+Fall+Fest+at+BITS+Pilani&location=BITS+Pilani&"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/40 backdrop-blur-sm px-6 py-3 font-display text-sm font-bold text-ink-dim hover:bg-surface-2 hover:text-ink transition-all"
            >
              <Calendar className="h-4 w-4 text-pink-ink" />
              Add to Calendar
            </a>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-transparent px-6 py-3 font-display text-sm font-medium text-muted hover:text-ink hover:border-muted transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Register Another Person
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="register-form" className="space-y-8">
      {/* Progress Steps Header */}
      <div className="glass-dark rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          {[
            { stepNum: 1, label: "Profile & Participation", icon: User },
            { stepNum: 2, label: "Experience & Preferences", icon: Terminal },
          ].map(({ stepNum, label, icon: StepIcon }) => {
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <button
                key={stepNum}
                type="button"
                onClick={() => {
                  if (stepNum < step) setStep(stepNum as 1 | 2);
                }}
                disabled={stepNum > step}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-xl p-3 text-left transition-all",
                  isActive && "bg-surface-2 border border-pink/40 shadow-[0_0_20px_rgba(255,126,182,0.15)]",
                  isCompleted && "text-ink-dim hover:text-ink cursor-pointer hover:bg-surface-2/50",
                  !isActive && !isCompleted && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold transition-all",
                    isActive && "border border-pink bg-pink/20 text-pink-ink shadow-[0_0_12px_rgba(255,126,182,0.5)]",
                    isCompleted && "border border-violet-bright/50 bg-violet/30 text-pink-ink",
                    !isActive && !isCompleted && "border border-line bg-surface text-muted"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-pink-ink font-bold">
                    Step 0{stepNum}
                  </p>
                  <p className="font-display text-xs sm:text-sm font-bold text-ink">{label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* STEP 1: Attendee Information */}
        {step === 1 && (
          <div className="glass-dark space-y-6 rounded-3xl p-6 sm:p-9 animate-[fadeUp_0.4s_ease-out_forwards]">
            <div className="border-b border-line pb-5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-pink-ink">
                <span className="inline-block h-2 w-2 rounded-full border border-pink bg-pink/20 shadow-[0_0_6px_rgba(255,126,182,0.8)]" />
                <span>Step 01 · Attendee Profile</span>
              </div>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Personal & Academic Details
              </h3>
              <p className="mt-1 text-sm text-muted">
                Please enter your details as they should appear on your fest credentials and completion certificate.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label htmlFor="reg-fullname" className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                  Full Name <span className="text-pink-ink">*</span>
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  placeholder="e.g. Marie Curie"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  maxLength={LIMITS.fullName}
                  className={cn(
                    "mt-2 w-full rounded-xl border bg-surface-2/60 px-4 py-3 text-sm text-ink placeholder:text-muted transition-all focus:border-pink focus:outline-none focus:ring-1 focus:ring-pink/50",
                    errors.fullName ? "border-danger bg-danger/5" : "border-line"
                  )}
                />
                {errors.fullName && (
                  <p className="mt-1.5 flex items-center gap-1 font-mono text-[11px] text-danger">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="reg-email" className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                  Email Address <span className="text-pink-ink">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="name@university.edu"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  maxLength={LIMITS.email}
                  className={cn(
                    "mt-2 w-full rounded-xl border bg-surface-2/60 px-4 py-3 text-sm text-ink placeholder:text-muted transition-all focus:border-pink focus:outline-none focus:ring-1 focus:ring-pink/50",
                    errors.email ? "border-danger bg-danger/5" : "border-line"
                  )}
                />
                {errors.email && (
                  <p className="mt-1.5 flex items-center gap-1 font-mono text-[11px] text-danger">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="reg-phone" className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                  Phone Number <span className="text-pink-ink">*</span>
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  maxLength={LIMITS.phone}
                  className={cn(
                    "mt-2 w-full rounded-xl border bg-surface-2/60 px-4 py-3 text-sm text-ink placeholder:text-muted transition-all focus:border-pink focus:outline-none focus:ring-1 focus:ring-pink/50",
                    errors.phone ? "border-danger bg-danger/5" : "border-line"
                  )}
                />
                {errors.phone && (
                  <p className="mt-1.5 flex items-center gap-1 font-mono text-[11px] text-danger">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Institution */}
              <div>
                <label htmlFor="reg-institution" className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                  Institution / University <span className="text-pink-ink">*</span>
                </label>
                <input
                  id="reg-institution"
                  type="text"
                  placeholder="e.g. BITS Pilani"
                  value={formData.institution}
                  onChange={(e) => updateField("institution", e.target.value)}
                  maxLength={LIMITS.institution}
                  className={cn(
                    "mt-2 w-full rounded-xl border bg-surface-2/60 px-4 py-3 text-sm text-ink placeholder:text-muted transition-all focus:border-pink focus:outline-none focus:ring-1 focus:ring-pink/50",
                    errors.institution ? "border-danger bg-danger/5" : "border-line"
                  )}
                />
                {errors.institution && (
                  <p className="mt-1.5 flex items-center gap-1 font-mono text-[11px] text-danger">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.institution}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="reg-referral" className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                  Referral Code <span className="text-muted font-normal">(optional)</span>
                </label>
                <input
                  id="reg-referral"
                  type="text"
                  placeholder="Enter a code from a friend or campus ambassador"
                  value={formData.referredByCode}
                  onChange={(e) => updateField("referredByCode", e.target.value.toUpperCase())}
                  maxLength={LIMITS.referralCode}
                  className="mt-2 w-full rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm text-ink placeholder:text-muted transition-all focus:border-pink focus:outline-none focus:ring-1 focus:ring-pink/50"
                />
                <p className="mt-1.5 text-[11px] text-muted">
                  Optional — use your invited friend&apos;s code if they referred you.
                </p>
              </div>

              {/* Study Level */}
              <div>
                <label htmlFor="reg-studylevel" className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                  Current Level of Study
                </label>
                <select
                  id="reg-studylevel"
                  value={formData.studyLevel}
                  onChange={(e) => updateField("studyLevel", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm text-ink transition-all focus:border-pink focus:outline-none focus:ring-1 focus:ring-pink/50"
                >
                  <option value="" className="bg-surface text-ink">Select current level</option>
                  {studyLevels.map((lvl) => (
                    <option key={lvl} value={lvl} className="bg-surface text-ink">
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Graduation Year */}
              <div>
                <label htmlFor="reg-gradyear" className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                  Graduation Year
                </label>
                <input
                  id="reg-gradyear"
                  type="text"
                  placeholder="e.g. 2027"
                  value={formData.graduationYear}
                  onChange={(e) => updateField("graduationYear", e.target.value)}
                  maxLength={LIMITS.graduationYear}
                  className="mt-2 w-full rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm text-ink placeholder:text-muted transition-all focus:border-pink focus:outline-none focus:ring-1 focus:ring-pink/50"
                />
              </div>
            </div>

            {/* Attendance Mode Selector */}
            <div className="pt-4 border-t border-line">
              <label className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                Participation Format <span className="text-pink-ink">*</span>
              </label>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {attendanceOptions.map((opt) => {
                  const isSelected = formData.attendanceMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateField("attendanceMode", opt.id)}
                      className={cn(
                        "group relative flex flex-col rounded-2xl border p-5 text-left transition-all duration-300",
                        isSelected
                          ? "border-pink bg-pink/10 shadow-[0_0_25px_rgba(255,126,182,0.15)]"
                          : "border-line bg-surface-2/40 hover:border-line-soft hover:bg-surface-2/70"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-base font-bold text-ink">
                          {opt.label}
                        </span>
                        <span
                          className={cn(
                            "grid h-5 w-5 place-items-center rounded-full border text-[10px] transition-colors",
                            isSelected
                              ? "border-pink bg-pink-fill text-white font-bold"
                              : "border-line bg-surface"
                          )}
                        >
                          {isSelected && "✓"}
                        </span>
                      </div>
                      <span className="mt-1 font-mono text-[11px] font-semibold text-pink-ink">
                        {opt.tagline}
                      </span>
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              {errors.attendanceMode && (
                <p className="mt-2 flex items-center gap-1 font-mono text-[11px] text-danger">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.attendanceMode}
                </p>
              )}
            </div>

            {/* Step 1 Actions */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-pink-fill px-8 py-3.5 font-display text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(208,38,112,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-pink-fill-hover"
              >
                Continue to Skills
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Quantum Background & Preferences */}
        {step === 2 && (
          <div className="glass-dark space-y-7 rounded-3xl p-6 sm:p-9 animate-[fadeUp_0.4s_ease-out_forwards]">
            <div className="border-b border-line pb-5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-pink-ink">
                <span className="inline-block h-2 w-2 rounded-full border border-pink bg-pink/20 shadow-[0_0_6px_rgba(255,126,182,0.8)]" />
                <span>Step 02 · Quantum Background</span>
              </div>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Experience & Preferences
              </h3>
              <p className="mt-1 text-sm text-muted">
                Help us tailor workshop materials, hardware lab access, and hackathon teams to your experience.
              </p>
            </div>

            {/* Quantum Experience Level */}
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                Quantum Computing Experience
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {experienceLevels.map((lvl) => {
                  const isSelected = formData.quantumExperience === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => updateField("quantumExperience", lvl.id)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-all duration-300",
                        isSelected
                          ? "border-pink bg-pink/10 shadow-[0_0_20px_rgba(255,126,182,0.15)]"
                          : "border-line bg-surface-2/40 hover:border-line-soft hover:bg-surface-2/70"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-bold text-ink">
                          {lvl.label}
                        </span>
                        {isSelected && <span className="text-pink-ink font-bold">✓</span>}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {lvl.detail}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantum Interests Multi-Select */}
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                Topics & Quantum Tracks of Interest
              </label>
              <p className="mt-1 text-xs text-muted">
                Select topics you want to explore during hardware labs and the hackathon:
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {quantumInterests.map((interest) => {
                  const isChecked = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={cn(
                        "rounded-xl border px-3.5 py-2 font-mono text-xs transition-all duration-200",
                        isChecked
                          ? "border-pink bg-pink/20 text-pink-ink shadow-[0_0_12px_rgba(255,126,182,0.3)] font-semibold"
                          : "border-line bg-surface-2/40 text-ink-dim hover:border-line-soft hover:text-ink"
                      )}
                    >
                      {isChecked ? `✓ ${interest}` : `+ ${interest}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Social Links & Swag */}
            <div className="grid gap-6 sm:grid-cols-3 pt-4 border-t border-line">
              <div>
                <label htmlFor="reg-github" className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                  GitHub Profile URL
                </label>
                <input
                  id="reg-github"
                  type="url"
                  placeholder="https://github.com/..."
                  value={formData.githubUrl}
                  onChange={(e) => updateField("githubUrl", e.target.value)}
                  maxLength={LIMITS.url}
                  className="mt-2 w-full rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm text-ink placeholder:text-muted transition-all focus:border-pink focus:outline-none focus:ring-1 focus:ring-pink/50"
                />
              </div>

              <div>
                <label htmlFor="reg-linkedin" className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                  LinkedIn Profile URL
                </label>
                <input
                  id="reg-linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedinUrl}
                  onChange={(e) => updateField("linkedinUrl", e.target.value)}
                  maxLength={LIMITS.url}
                  className="mt-2 w-full rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm text-ink placeholder:text-muted transition-all focus:border-pink focus:outline-none focus:ring-1 focus:ring-pink/50"
                />
              </div>

              <div>
                <label htmlFor="reg-tshirt" className="block font-mono text-xs uppercase tracking-wider text-ink-dim">
                  Fest T-Shirt Size
                </label>
                <select
                  id="reg-tshirt"
                  value={formData.tshirtSize}
                  onChange={(e) => updateField("tshirtSize", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm text-ink transition-all focus:border-pink focus:outline-none focus:ring-1 focus:ring-pink/50"
                >
                  {tshirtSizes.map((size) => (
                    <option key={size} value={size} className="bg-surface text-ink">
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Point of Contact Opt-in */}
            <div className="pt-4 border-t border-line">
              <label className="flex items-start gap-3.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.willingToBePOC}
                  onChange={(e) => updateField("willingToBePOC", e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-line text-pink-ink accent-pink-ink focus:ring-pink"
                />
                <span className="text-xs leading-relaxed text-ink-dim">
                  I am willing to be the Point of Contact (POC) for my university/institution.
                </span>
              </label>
              <p className="mt-1.5 pl-[calc(1rem+0.875rem)] text-[11px] text-muted">
                Disclaimer: If you opt in, you will be added to a WhatsApp group for further POC communication.
              </p>
            </div>

            {/* Code of Conduct Agreement */}
            <div className="pt-4 border-t border-line">
              <label className="flex items-start gap-3.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) => updateField("agreedToTerms", e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-line text-pink-ink accent-pink-ink focus:ring-pink"
                />
                <span className="text-xs leading-relaxed text-ink-dim">
                  I agree to abide by the BITS Pilani & IBM Quantum Code of Conduct, respect community guidelines, and adhere to responsible compute usage during the hackathon. <span className="text-pink-ink">*</span>
                </span>
              </label>
              {errors.agreedToTerms && (
                <p className="mt-2 flex items-center gap-1 font-mono text-[11px] text-danger">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.agreedToTerms}
                </p>
              )}
            </div>

            {/* Server Error Display */}
            {submitError && (
              <div className="rounded-2xl border border-danger/50 bg-danger/10 p-4 text-xs font-mono text-danger">
                <p className="flex items-center gap-2 font-bold">
                  <AlertCircle className="h-4 w-4" />
                  Registration Error
                </p>
                <p className="mt-1 text-ink-dim">{submitError}</p>
              </div>
            )}

            {/* Submission Status Indicator */}
            {isSubmitting && (
              <div className="flex items-center gap-3 rounded-2xl border border-pink/40 bg-pink/10 p-4 font-mono text-xs text-pink-ink animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{submissionPhase}</span>
              </div>
            )}

            {/* Step 2 Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/40 px-6 py-2.5 font-display text-sm font-bold text-ink-dim hover:bg-surface-2 hover:text-ink transition-all disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous Step
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-pink-fill px-8 py-3.5 font-display text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(208,38,112,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-pink-fill-hover disabled:pointer-events-none disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Allocating Ticket...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <Sparkles className="h-4 w-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

