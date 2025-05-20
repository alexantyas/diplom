export const SCHEDULE_KEY_BASE = 'schedule'
export function getScheduleKey(competitionId) {
  return competitionId != null
    ? `${SCHEDULE_KEY_BASE}_${competitionId}`
    : SCHEDULE_KEY_BASE
} 