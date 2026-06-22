"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { apiSignup, setToken } from "@/lib/api";
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

const steps = ["name", "email", "phone", "age", "work", "goals", "done"] as const;
type Step = (typeof steps)[number];

type SignupForm = {
  name: string;
  email: string;
  phone: string;
  age: string;
  jobs: string[];
  goals: string[];
};

const initialForm: SignupForm = {
  name: "",
  email: "",
  phone: "",
  age: "",
  jobs: [],
  goals: []
};

export default function SignupPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
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
    if (currentStep === "phone") return form.phone.trim().length >= 8;
    if (currentStep === "age") return Number(form.age) >= 8;
    if (currentStep === "work") return form.jobs.length > 0;
    if (currentStep === "goals") return form.goals.length > 0;
    return true;
  }

  async function submit() {
    try {
      const res = await apiSignup({
        name: form.name,
        email: form.email,
        phone: form.phone,
        age: Number(form.age),
        jobs: form.jobs,
        goals: form.goals
      });
      setToken(res.access_token);
    } catch {
      // demo mode without backend
    }
    setStepIndex(steps.length - 1);
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
            <img src="/hello.png" alt="" />
            Void Spirit
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
                      <input className="void-input" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Void Walker" autoComplete="name" />
                    </label>
                  )}
                  {step === "email" && (
                    <label className="void-label">
                      Email address
                      <input className="void-input" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@void.spirit" type="email" autoComplete="email" />
                    </label>
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
          <button type="button" className="void-btn-primary" disabled={!canContinue(step)} onClick={next}>
            {step === "goals" ? "Summon Account" : "Continue"}
            <ArrowRight size={18} style={{ marginLeft: 6, verticalAlign: "middle" }} />
          </button>
          <Link className="void-link" href="/login">
            Already in the void? <strong>Sign in</strong>
          </Link>
        </footer>
      ) : null}
    </main>
  );
}

function StepCopy({ step }: { step: Exclude<Step, "done"> }) {
  const content: Record<Exclude<Step, "done">, { title: string; text: string }> = {
    name: { title: "What should we call you?", text: "Your spirit companion learns your name first." },
    email: { title: "Enter your essence link.", text: "Use it to return to the void anytime." },
    phone: { title: "Mobile number?", text: "For account protection across realms." },
    age: { title: "How old are you?", text: "We tune the ritual to your life stage." },
    work: { title: "Pick your roles.", text: "Choose one or more paths you walk." },
    goals: { title: "What will you conquer?", text: "Select every area where you want momentum." }
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
          {selected.includes(item) && <Check size={16} style={{ marginRight: 4, verticalAlign: "middle" }} />}
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
      <h1>Welcome, {form.name || "Walker"}!</h1>
      <p>Your void ritual is ready. Enter the dashboard and begin.</p>
      <div style={{ margin: "14px 0" }}>
        {form.jobs.slice(0, 3).map((job) => (
          <span className="void-badge" key={job}>
            {job}
          </span>
        ))}
      </div>
      <Link className="void-btn-primary" href="/dashboard" style={{ display: "inline-block", textDecoration: "none" }}>
        Enter Dashboard
      </Link>
    </div>
  );
}
