export interface MeetingDto {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  host: string;
  date: string;
  attendance: Array<string>;
  invites: Array<string>;
  code: string;
}
