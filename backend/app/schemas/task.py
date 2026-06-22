from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    project_id: str | None = Field(default=None, alias="projectId")
    due_date: str = Field(alias="dueDate")
    priority: str = "medium"
    estimated_minutes: int = Field(default=30, ge=5, le=480, alias="estimatedMinutes")
    attachments: list[str] = []

    model_config = {"populate_by_name": True}


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    project_id: str | None = Field(default=None, alias="projectId")
    due_date: str | None = Field(default=None, alias="dueDate")
    priority: str | None = None
    status: str | None = None
    estimated_minutes: int | None = Field(default=None, alias="estimatedMinutes")
    logged_minutes: int | None = Field(default=None, alias="loggedMinutes")
    attachments: list[str] | None = None

    model_config = {"populate_by_name": True}
