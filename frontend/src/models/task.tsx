export enum TaskStatus {
  Unknown = 0,
  ongoing = 1,
  running = 2,
  completed = 3,
  failed = 4,
  canceled = 5
}

export enum OutputType {
  Unknown = 0,
  Json = 1,
  Csv = 2,
  Gpt = 3,
  Markdown = 4
}

export enum TaskPeriod {
  Unknown = 0,
  Hourly = 1,
  Daily = 2,
  Weekly = 3,
  Monthly = 4
}

export interface Task {
  id: string;
  owner: string;
  taskDefinition: {
    source: {
      type: SourceType;
      url: string;
    }[];
    target: {
      type: TargetType;
      name: string;
      value: string;
    }[];
    output: {
      type: OutputType;
      prompt?: string;
    }[];
    period: TaskPeriod;
  };
  taskId: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export enum SourceType {
  Unknown = 0,
  Url = 1
}

export enum TargetType {
  Unknown = 0,
  Auto = 1,
  Xpath = 2,
  Query = 3
}

export const mapStatus = (status: number): keyof typeof TaskStatus => {
  return TaskStatus[status] as keyof typeof TaskStatus;
};

export const statusColorMap: Record<keyof typeof TaskStatus, "primary" | "success" | "danger" | "warning" | "default"> = {
  Unknown: "default",
  ongoing: "default",
  running: "primary",
  completed: "success",
  failed: "warning",
  canceled: "danger"
};

export const outputTypeMap: Record<string, OutputType> = {
  JSON: OutputType.Json,
  CSV: OutputType.Csv,
  GPT: OutputType.Gpt,
  Markdown: OutputType.Markdown
};

export const periodMap: Record<string, TaskPeriod> = {
  Hourly: TaskPeriod.Hourly,
  Daily: TaskPeriod.Daily,
  Weekly: TaskPeriod.Weekly,
  Monthly: TaskPeriod.Monthly
};