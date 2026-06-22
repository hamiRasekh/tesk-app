"use client";

import { useEffect, useState } from "react";
import { Drawer } from "./Drawer";
import { ScaleSlider } from "./ScaleSlider";
import { TimeDial, timeToEstimatedMinutes } from "./TimeDial";
import { VoidSelect } from "./VoidSelect";
import { VoidInput, VoidTextarea } from "./VoidInput";
import { LocaleDatePicker } from "./JalaliDatePicker";
import { useVoid } from "@/lib/void-store";
import { importanceToPriority } from "@/lib/void-utils";
import { toLocalDateStr } from "@/lib/void-utils";
import { useLocale } from "@/lib/locale";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string | null;
  defaultDate?: string;
};

const DEFAULT_MINUTES = 30;

export function AddTaskDrawer({ open, onClose, defaultProjectId = null, defaultDate }: Props) {
  const { state, addTask } = useVoid();
  const { isFa } = useLocale();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState(5);
  const [importance, setImportance] = useState(6);
  const [projectId, setProjectId] = useState<string | "">(defaultProjectId ?? "");
  const [dueDate, setDueDate] = useState(defaultDate ?? toLocalDateStr(new Date()));
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [timeTouched, setTimeTouched] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProjectId(defaultProjectId ?? "");
    if (defaultDate) setDueDate(defaultDate);
  }, [open, defaultProjectId, defaultDate]);

  const estimatedMinutes = timeToEstimatedMinutes(hours, minutes);
  const timeValid = estimatedMinutes >= 5;
  const titleValid = Boolean(title.trim());

  function reset() {
    setTitle("");
    setDescription("");
    setDifficulty(5);
    setImportance(6);
    setProjectId(defaultProjectId ?? "");
    setDueDate(defaultDate ?? toLocalDateStr(new Date()));
    setHours(0);
    setMinutes(DEFAULT_MINUTES);
    setTimeTouched(true);
    setSaving(false);
    setError(null);
    setShowValidation(false);
  }

  function handleTimeChange(h: number, m: number) {
    setHours(h);
    setMinutes(m);
    setTimeTouched(true);
    setShowValidation(false);
  }

  async function submit() {
    setShowValidation(true);
    if (!titleValid || !timeValid || saving) return;

    setSaving(true);
    setError(null);
    try {
      await addTask({
        title: title.trim(),
        description: description.trim(),
        priority: importanceToPriority(importance),
        difficulty,
        importance,
        projectId: projectId || null,
        dueDate,
        estimatedMinutes,
        attachments: []
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isFa ? "خطا در ساخت تسک" : "Could not create task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <form
        className="void-drawer__form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="void-drawer__body void-task-form">
          <p className="void-section-title">New task</p>
          <h2 className="void-drawer__title void-task-form__title">Add a task to your day</h2>

          <label className="void-label" htmlFor="task-title">
            Task name
          </label>
          <VoidInput
            id="task-title"
            className="void-input--pill void-task-form__input"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setShowValidation(false);
            }}
            placeholder="What do you need to do?"
            autoComplete="off"
          />
          {showValidation && !titleValid && (
            <p className="void-form-hint void-form-hint--warn">
              {isFa ? "نام تسک را وارد کنید." : "Enter a task name."}
            </p>
          )}

          <label className="void-label" htmlFor="task-description">
            Description
          </label>
          <VoidTextarea
            id="task-description"
            className="void-input--pill void-task-form__input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details or notes"
            rows={2}
          />

          <label className="void-label">Due date</label>
          <LocaleDatePicker value={dueDate} onChange={setDueDate} className="void-task-form__input" />

          <ScaleSlider label="Difficulty" value={difficulty} onChange={setDifficulty} />
          <ScaleSlider label="Importance" value={importance} onChange={setImportance} />

          <label className="void-label">Project</label>
          <VoidSelect
            className="void-task-form__select"
            value={projectId}
            onChange={setProjectId}
            placeholder="No project"
            options={[
              { value: "", label: "No project" },
              ...state.projects.map((p) => ({ value: p.id, label: p.name, color: p.color }))
            ]}
          />

          <TimeDial hours={hours} minutes={minutes} onChange={handleTimeChange} />
          {showValidation && !timeValid && (
            <p className="void-form-hint void-form-hint--warn">
              {isFa ? "حداقل زمان تخمینی ۵ دقیقه است." : "Minimum estimate is 5 minutes."}
            </p>
          )}
          {!timeTouched && !showValidation && (
            <p className="void-form-hint">
              {isFa
                ? `پیش‌فرض: ${DEFAULT_MINUTES} دقیقه — روی ساعت می‌توانید تغییر دهید.`
                : `Default: ${DEFAULT_MINUTES} min — adjust on the clock if needed.`}
            </p>
          )}

          {error && <p className="void-form-hint void-form-hint--warn">{error}</p>}
        </div>

        <div className="void-drawer__footer-cta">
          <button
            type="submit"
            className="void-btn void-btn--initiate void-task-form__submit"
            disabled={saving}
          >
            {saving ? (isFa ? "در حال ساخت…" : "Creating…") : isFa ? "ساخت تسک" : "Create task"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
