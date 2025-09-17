"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import DigitalClockComponent from "./digital-clock";
import { getDatabase, ref, get, onValue } from "firebase/database";
import { useAuth } from "@/app/context/AuthContext";

type ScheduleItem = {
  id: string;
  subject: string;
  day: string;
  time: string;
  createdAt: string;
};

type ExpandedScheduleItem = ScheduleItem & {
  dayOfWeek: number;
  startTime: number; // minutes from midnight
  endTime: number; // minutes from midnight
};

export function SectionCards() {
  const db = getDatabase();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [expandedSchedules, setExpandedSchedules] = useState<
    ExpandedScheduleItem[]
  >([]);
  const [currentSubject, setCurrentSubject] = useState<string>("None");
  const [nextSubject, setNextSubject] = useState<string>("N/A");
  const [dateTime, setDateTime] = useState(new Date());

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const formattedDate = dateTime.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Helper function to convert day abbreviations to day numbers
  const getDayNumbers = (dayString: string): number[] => {
    const dayMap: { [key: string]: number[] } = {
      MWF: [1, 3, 5], // Monday, Wednesday, Friday
      TuTh: [2, 4], // Tuesday, Thursday
      MW: [1, 3], // Monday, Wednesday
      M: [1], // Monday
      Tu: [2], // Tuesday
      W: [3], // Wednesday
      Th: [4], // Thursday
      F: [5], // Friday
      Sa: [6], // Saturday
      Su: [0], // Sunday
    };

    // Check if it's a predefined pattern
    if (dayMap[dayString]) {
      return dayMap[dayString];
    }

    // Parse custom day combinations
    const days: number[] = [];
    let remaining = dayString;

    // Parse in order of precedence to avoid conflicts (Th before T, Tu before T, etc.)
    const dayPatterns = [
      { pattern: "Su", day: 0 },
      { pattern: "Sa", day: 6 },
      { pattern: "Th", day: 4 },
      { pattern: "Tu", day: 2 },
      { pattern: "M", day: 1 },
      { pattern: "W", day: 3 },
      { pattern: "F", day: 5 },
    ];

    for (const { pattern, day } of dayPatterns) {
      if (remaining.includes(pattern)) {
        days.push(day);
        remaining = remaining.replace(pattern, "");
      }
    }

    return days.sort();
  };

  // Helper function to convert time string to minutes from midnight
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Expand schedules to individual class sessions
  const expandSchedules = (
    schedules: ScheduleItem[]
  ): ExpandedScheduleItem[] => {
    const expanded: ExpandedScheduleItem[] = [];

    schedules.forEach((schedule) => {
      const dayNumbers = getDayNumbers(schedule.day);
      const [startTime, endTime] = schedule.time.split("–");

      dayNumbers.forEach((dayOfWeek) => {
        expanded.push({
          ...schedule,
          dayOfWeek,
          startTime: timeToMinutes(startTime),
          endTime: timeToMinutes(endTime),
        });
      });
    });

    return expanded.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.startTime - b.startTime;
    });
  };

  // Find current and next subjects
  const findCurrentAndNextSubjects = (
    expandedSchedules: ExpandedScheduleItem[],
    currentTime: Date
  ) => {
    const currentDay = currentTime.getDay();
    const currentMinutes =
      currentTime.getHours() * 60 + currentTime.getMinutes();

    // Find current subject
    const currentClass = expandedSchedules.find(
      (schedule) =>
        schedule.dayOfWeek === currentDay &&
        currentMinutes >= schedule.startTime &&
        currentMinutes < schedule.endTime
    );

    // Find next subject
    let nextClass: ExpandedScheduleItem | undefined;

    // First, look for classes later today
    const laterToday = expandedSchedules.filter(
      (schedule) =>
        schedule.dayOfWeek === currentDay && schedule.startTime > currentMinutes
    );

    if (laterToday.length > 0) {
      nextClass = laterToday[0];
    } else {
      // Look for the next class in the coming days
      const nextWeek = [...expandedSchedules, ...expandedSchedules]; // Duplicate to handle week wrap-around
      const futureClasses = nextWeek.filter((schedule) => {
        if (schedule.dayOfWeek > currentDay) {
          return true;
        } else if (schedule.dayOfWeek < currentDay) {
          return true; // Next week
        }
        return false;
      });

      if (futureClasses.length > 0) {
        nextClass = futureClasses[0];
      }
    }

    setCurrentSubject(currentClass ? currentClass.subject : "None");
    setNextSubject(nextClass ? nextClass.subject : "N/A");
  };

  useEffect(() => {
    if (!currentUser) return;

    const scheduleRef = ref(db, `users/${currentUser.uid}/schedule`);
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list: ScheduleItem[] = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Omit<ScheduleItem, "id">),
      }));
      setSchedules(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Update expanded schedules when schedules change
  useEffect(() => {
    const expanded = expandSchedules(schedules);
    setExpandedSchedules(expanded);
  }, [schedules]);

  // Update current and next subjects every minute
  useEffect(() => {
    const updateSubjects = () => {
      const now = new Date();
      setDateTime(now);
      findCurrentAndNextSubjects(expandedSchedules, now);
    };

    updateSubjects(); // Initial update
    const interval = setInterval(updateSubjects, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expandedSchedules]);

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Subjects</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {schedules.length}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Current Subject</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {currentSubject}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Next Subject</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {nextSubject}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="flex flex-col items-center justify-center gap-2 rounded-lg p-4 text-center">
        <span className="text-xl font-semibold tracking-wide">
          {days[dateTime.getDay()]}, <DigitalClockComponent />
        </span>
        <span className="text-lg text-gray-600 dark:text-gray-300">
          {formattedDate}
        </span>
      </div>
    </div>
  );
}
