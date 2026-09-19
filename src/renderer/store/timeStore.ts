import { create } from 'zustand';

interface TimeState {
  seconds: number;
  hourAngle: number;
  minuteAngle: number;
  secondAngle: number;
  minuteKey: string;
  timeString: string;
  dateString: string;
  minuteDate: Date;
}

const buildInitial = (): TimeState => {
  const now = new Date();
  const sec = now.getSeconds();
  const min = now.getMinutes() + sec / 60;
  const hr = (now.getHours() % 12) + min / 60;
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const minuteKey = `${h}:${m}`;

  let dateString = '';
  try {
    dateString = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(now);
  } catch {
    dateString = `${now.getMonth() + 1}/${now.getDate()}`;
  }

  return {
    seconds: sec,
    hourAngle: hr * 30,
    minuteAngle: min * 6,
    secondAngle: sec * 6,
    minuteKey,
    timeString: minuteKey,
    dateString,
    minuteDate: now,
  };
};

export const useTimeStore = create<TimeState>(() => buildInitial());

let prevMinKey = '';
let tickerId: NodeJS.Timeout | null = null;

const tick = () => {
  const now = new Date();
  const sec = now.getSeconds();
  const min = now.getMinutes() + sec / 60;
  const hr = (now.getHours() % 12) + min / 60;
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const minuteKey = `${h}:${m}`;

  const partial: Partial<TimeState> = {
    seconds: sec,
    hourAngle: hr * 30,
    minuteAngle: min * 6,
    secondAngle: sec * 6,
  };

  if (minuteKey !== prevMinKey) {
    prevMinKey = minuteKey;
    partial.minuteKey = minuteKey;
    partial.timeString = minuteKey;
    partial.minuteDate = now;
    try {
      partial.dateString = new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now);
    } catch {
      partial.dateString = `${now.getMonth() + 1}/${now.getDate()}`;
    }
  }

  useTimeStore.setState(partial);
};

const ensureTicker = () => {
  if (tickerId !== null) return;
  const initial = buildInitial();
  prevMinKey = initial.minuteKey;
  tickerId = setInterval(tick, 1000);
};

ensureTicker();

export const useClockAngles = () => {
  ensureTicker();
  const hour = useTimeStore((s) => s.hourAngle);
  const minute = useTimeStore((s) => s.minuteAngle);
  const second = useTimeStore((s) => s.secondAngle);
  return { hour, minute, second };
};

export const useSecondTick = () => {
  ensureTicker();
  const hour = useTimeStore((s) => s.hourAngle);
  const minute = useTimeStore((s) => s.minuteAngle);
  const second = useTimeStore((s) => s.secondAngle);
  const timeString = useTimeStore((s) => s.timeString);
  const dateString = useTimeStore((s) => s.dateString);
  return {
    angles: { hour, minute, second },
    timeString,
    dateString,
  };
};

export const useMinuteTick = () => {
  ensureTicker();
  const timeString = useTimeStore((s) => s.timeString);
  const dateString = useTimeStore((s) => s.dateString);
  const now = useTimeStore((s) => s.minuteDate);

  return {
    timeString,
    dateString,
    now,
  };
};
