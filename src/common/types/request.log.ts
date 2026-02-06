export interface RequestLog {
  ip: string;
  url: string;
  date: Date;
  method?: string;
  userId?: string;
}
