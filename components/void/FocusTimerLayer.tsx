"use client";

import { useEffect, useRef, useState } from "react";
import { useVoid } from "@/lib/void-store";
import { getTimerElapsedSeconds, isTimerRunning } from "@/lib/focus-timer";
import {
  clearFocusNotifications,
  notifyEstimateReached,
  notifyFocusSessionStarted,
  requestFocusNotificationPermission
} from "@/lib/focus-notifications";
import { FocusSessionBar } from "./FocusSessionBar";
import { FocusEstimateDialog } from "./FocusEstimateDialog";

export function FocusTimerLayer() {
  const { state, completeTask } = useVoid();
  const [estimateOpen, setEstimateOpen] = useState(false);
  const estimateFiredRef = useRef<string | null>(null);
  const sessionNotifiedRef = useRef<string | null>(null);
  const wasRunningRef = useRef(false);
  const [tick, setTick] = useState(0);

  const taskId = state.activeTimerTaskId;
  const task = taskId ? state.tasks.find((t) => t.id === taskId) : null;
  const running = isTimerRunning(state);

  useEffect(() => {
    if (!taskId) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [taskId]);

  useEffect(() => {
    if (!taskId || !task) {
      estimateFiredRef.current = null;
      sessionNotifiedRef.current = null;
      wasRunningRef.current = false;
      setEstimateOpen(false);
      clearFocusNotifications();
      return;
    }

    const freshStart = running && !wasRunningRef.current && (state.timerAccumulatedSeconds ?? 0) === 0;
    if (freshStart && sessionNotifiedRef.current !== taskId) {
      sessionNotifiedRef.current = taskId;
      void requestFocusNotificationPermission().then((ok) => {
        if (ok) notifyFocusSessionStarted(task.title);
      });
    }
    wasRunningRef.current = running;
  }, [taskId, task, running, state.timerAccumulatedSeconds]);

  useEffect(() => {
    if (!task || !taskId) return;
    if (!task.estimatedMinutes || task.estimatedMinutes <= 0) return;

    const elapsed = getTimerElapsedSeconds(state);
    const threshold = task.estimatedMinutes * 60;
    if (elapsed < threshold) return;

    const key = `${taskId}:${state.timerAccumulatedSeconds ?? 0}`;
    if (estimateFiredRef.current === key) return;
    estimateFiredRef.current = key;
    setEstimateOpen(true);
    void requestFocusNotificationPermission().then((ok) => {
      if (ok) notifyEstimateReached(task.title, task.estimatedMinutes);
    });
  }, [task, taskId, state, tick]);

  function handleKeepGoing() {
    setEstimateOpen(false);
  }

  function handleComplete() {
    setEstimateOpen(false);
    if (taskId) void completeTask(taskId);
  }

  return (
    <>
      <FocusSessionBar />
      <FocusEstimateDialog
        task={task ?? null}
        open={estimateOpen}
        onKeepGoing={handleKeepGoing}
        onComplete={handleComplete}
      />
    </>
  );
}
