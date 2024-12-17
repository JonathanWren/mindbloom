export interface Scenario {
  id: string;
  heading: string;
  personName: string;
  age: number;
  ethnicity: string;
  goal: string;
  backstory: string;
  voice: string; // New property for Amazon Polly voice
}

