export enum TaskStatus {
  Unknown = 0,
  created = 1,
  running = 2,
  completed = 3,
  failed = 4,
  canceled = 5,
  pending = 6
}

export enum OutputType {
  Unknown = 0,
  JSON = 1,
  CSV = 2,
  GPT = 3,
  MARKDOWN = 4
}

export enum TaskPeriod {
  Unknown = 0,
  Single = 1,
  Minutely = 2, // Just for demo
  Hourly = 3,
  Daily = 4,
  Weekly = 5,
  Monthly = 6
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
  created: "primary",
  running: "default",
  completed: "success",
  failed: "warning",
  canceled: "danger"
};

export const outputTypeMap: Record<string, OutputType> = {
  JSON: OutputType.JSON,
  CSV: OutputType.CSV,
  GPT: OutputType.GPT,
  MARKDOWN: OutputType.MARKDOWN
};

export const periodMap: Record<string, TaskPeriod> = {
  Single: TaskPeriod.Single,
  Minutely: TaskPeriod.Minutely,
  Hourly: TaskPeriod.Hourly,
  Daily: TaskPeriod.Daily,
  Weekly: TaskPeriod.Weekly
};