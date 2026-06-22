"use client";

import { use } from "react";
import { ProjectDetailView } from "@/components/void/ProjectDetailView";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProjectDetailPage({ params }: Props) {
  const { id } = use(params);
  return <ProjectDetailView projectId={id} />;
}
