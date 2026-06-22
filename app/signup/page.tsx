"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { apiSignup, isOfflineError, purgeLegacyDemoStorage, setToken } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";
import { VoidSpirit } from "@/components/void/VoidSpirit";
import { registerServiceWorker } from "../sw-register";

const jobs = [
  "Student",
  "Software developer",
  "Product designer",
  "Content creator",
  "Teacher",
  "Entrepreneur",
  "Marketing specialist",
  "Project manager",
  "Data analyst"
];

const goals = [
  "Learn faster",
  "Plan daily tasks",
  "Build better habits",
  "Improve focus",
  "Track personal growth",
  "Prepare for work"
];

const steps = ["name", "email", "password", "phone", "age", "work", "goals", "done"] as const;
type Step = (typeof steps)[number];

type SignupForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  age: string;
  jobs: string[];
  goals: string[];
};

const initialForm: SignupForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  age: "",
  jobs: [],
  goals: []
};

export default function SignupPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    purgeLegacyDemoStorage();
    registerServiceWorker();
  }, []);

  const step = steps[stepIndex];
  const progress = ((stepIndex + 1) / steps.length) * 100;

  function updateField(field: keyof SignupForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleItem(field: "jobs" | "goals", value: string) {
    setForm((current) => {
      const exists = current[field].includes(value);
      return {
        ...current,
        [field]: exists ? current[field].filter((item) => item !== value) : [...current[field], value]
      };
    });
  }

  function canContinue(currentStep: Step) {
    if (currentStep === "name") return form.name.trim().length >= 2;
    if (currentStep === "email") return /\S+@\S+\.\S+/.test(form.email);
    if (currentStep === "password") {
      return form.password.length >= 8 && form.password === form.confirmPassword;
    }
    if (currentStep === "phone") return form.phone.trim().length >= 8;
    if (currentStep === "age") return Number(form.age) >= 8;
    if (currentStep === "work") return form.jobs.length > 0;
    if (currentStep === "goals") return form.goals.length > 0;
    return true;
  }

  async function submit() {
    setSubmitError("");
    try {
      const res = await apiSignup({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        age: Number(form.age),
        jobs: form.jobs,
        goals: form.goals
      });
      setToken(res.access_token);
      setStepIndex(steps.length - 1);
    } catch (err) {
      if (isOfflineError(err)) {
        setSubmitError("You are offline. Connect to the internet to create an account.");
      } else {
        setSubmitError(err instanceof Error ? err.message : "Could not create account. Is the server running?");
      }
    }
  }

  function next() {
    if (step === "goals") {
      void submit();
      return;
    }
    setStepIndex((c) => Math.min(c + 1, steps.length - 1));
  }

  function back() {
    setStepIndex((c) => Math.max(c - 1, 0));
  }

  return (
    <main className="void-signup">
      <header className="void-signup__top">
        {stepIndex > 0 && step !== "done" ? (
          <button type="button" className="void-back" onClick={back} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="void-signup__brand">
            <img src="/logo.png" alt={APP_NAME} />
            {APP_NAME}
          </div>
        )}
        {step !== "done" && (
          <div className="void-signup__progress" aria-label="Signup progress">
            <div className="void-signup__progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      <section className="void-signup__body">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28 }}
          >
            {step === "done" ? (
              <SuccessView form={form} />
            ) : (
              <>
                <div className="void-spirit-wrap void-spirit-slot void-spirit-slot--login">
                  <VoidSpirit variant="hello" scale="lg" showcase glow />
                </div>
                <StepCopy step={step} />
                <div style={{ marginTop: 16 }}>
                  {step === "name" && (
                    <label className="void-label">
                      Your name
                      <input className="void-input" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Your name" autoComplete="name" />
                    </label>
                  )}
                  {step === "email" && (
                    <label className="void-label">
                      Email address
                      <input className="void-input" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@aveno.app" type="email" autoComplete="email" />
                    </label>
                  )}
                  {step === "password" && (
                    <>
                      <label className="void-label">
                        Create password
                        <input className="void-input" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="At least 8 characters" type="password" autoComplete="new-password" />
                      </label>
                      <label className="void-label" style={{ marginTop: 14 }}>
                        Confirm password
                        <input
                          className="void-input"
                          value={form.confirmPassword}
                          onChange={(e) => updateField("confirmPassword", e.target.value)}
                          placeholder="Repeat your password"
                          type="password"
                          autoComplete="new-password"
                        />
                      </label>
                      {form.confirmPassword && form.password !== form.confirmPassword ? (
                        <p className="void-form-error">Passwords do not match.</p>
                      ) : null}
                    </>
                  )}
                  {step === "phone" && (
                    <label className="void-label">
                      Mobile number
                      <input className="void-input" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+1 000 000 0000" inputMode="tel" autoComplete="tel" />
                    </label>
                  )}
                  {step === "age" && (
                    <label className="void-label">
                      Age
                      <input className="void-input" value={form.age} onChange={(e) => updateField("age", e.target.value)} placeholder="24" inputMode="numeric" type="number" min="8" max="99" />
                    </label>
                  )}
                  {step === "work" && <ChoiceGrid items={jobs} selected={form.jobs} onToggle={(item) => toggleItem("jobs", item)} />}
                  {step === "goals" && <ChoiceGrid items={goals} selected={form.goals} onToggle={(item) => toggleItem("goals", item)} />}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {step !== "done" ? (
        <footer className="void-signup__footer">
          {submitError ? <p className="void-form-error">{submitError}</p> : null}
          <button type="button" className="void-btn-primary" disabled={!canContinue(step)} onClick={next}>
            {step === "goals" ? "Create account" : "Continue"}
            <ArrowRight size={18} style={{ marginLeft: 6, verticalAlign: "middle" }} />
          </button>
          <Link className="void-link" href="/login">
            Already have an account? <strong>Sign in</strong>
          </Link>
        </footer>
      ) : null}
    </main>
  );
}

function StepCopy({ step }: { step: Exclude<Step, "done"> }) {
  const content: Record<Exclude<Step, "done">, { title: string; text: string }> = {
    name: { title: "What should we call you?", text: "Your companion learns your name first." },
    email: { title: "Your email address", text: "Use it to sign in to Aveno anytime." },
    password: { title: "Create a password", text: "Choose a strong password — at least 8 characters." },
    phone: { title: "Mobile number?", text: "Optional — for account recovery and security." },
    age: { title: "How old are you?", text: "We personalize tips to your life stage." },
    work: { title: "Pick your roles.", text: "Choose one or more paths you walk." },
    goals: { title: "What will you focus on?", text: "Select every area where you want momentum." }
  };

  return (
    <div>
      <h1>{content[step].title}</h1>
      <p>{content[step].text}</p>
    </div>
  );
}

function ChoiceGrid({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (item: string) => void }) {
  return (
    <div className="void-choice-grid">
      {items.map((item) => (
        <button key={item} type="button" className="void-choice" data-selected={selected.includes(item)} onClick={() => onToggle(item)}>
          {selected.includes(item) && <Check size={18} strokeWidth={2.5} />}
          {item}
        </button>
      ))}
    </div>
  );
}

function SuccessView({ form }: { form: SignupForm }) {
  return (
    <div className="void-success">
      <div className="void-spirit-wrap void-spirit-slot void-spirit-slot--profile">
        <VoidSpirit variant="happy" scale="lg" showcase glow />
      </div>
      <h1>Welcome, {form.name || "there"}!</h1>
      <p>Your Aveno account is ready. Enter the dashboard and begin.</p>
      <div style={{ margin: "14px 0" }}>
        {form.jobs.slice(0, 3).map((job) => (
          <span className="void-badge" key={job}>
            {job}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="void-btn-primary"
        onClick={() => {
          window.location.href = "/dashboard";
        }}
      >
        Enter Dashboard
      </button>
    </div>
  );
}
