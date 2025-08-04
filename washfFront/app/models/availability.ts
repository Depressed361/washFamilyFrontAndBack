
// src/types/availability.ts

export interface DefaultSlot {
  /** Identifiant en base (CRUD dispos par défaut) */
  id?: string;
  /** 0 = dimanche, …, 6 = samedi */
  dayOfWeek: number;
  /** “HH:mm” */
  startTime: string;
  /** “HH:mm” */
  endTime: string;
}

export interface WeeklySlot {
  /** “YYYY-MM-DD” */
  date: string;
  /** “HH:mm” */
  startTime: string;
  /** “HH:mm” */
  endTime: string;
  /** slot issu des dispos par défaut */
  isDefault?: boolean;
  /** jour complètement bloqué */
  blocked?: boolean;
}
