"use client";

import { useEffect, useState } from "react";
import { ref, onValue, push, set, remove } from "firebase/database";
import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/app/context/AuthContext";
import NoQuiz from "@/public/no-quiz.svg";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Image from "next/image";
import { Trash } from "lucide-react";

// ✅ Type Definitions
type Quiz = {
  id: string;
  subject: string;
  lesson: string;
  subjectId: string;
  day?: string;
};

type SubjectData = {
  subject: string;
  day: string; // e.g. "MWF"
  time: string; // e.g. "08:00–09:00"
};

type QuizData = {
  subject: string;
  lesson: string;
  createdAt: string;
  day?: string;
};

type FirebaseQuizzesData = Record<string, QuizData>;

// 🕐 Helper: Parse "08:00–09:00"
function parseTimeRange(timeRange: string) {
  const [start, end] = timeRange.split("–").map((t) => t.trim());
  return { start, end };
}

export function QuizTable() {
  const { currentUser } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<
    { id: string; subject: string; day: string; time: string }[]
  >([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [lesson, setLesson] = useState("");

  // 🟢 Load subjects
  useEffect(() => {
    if (!currentUser) return;
    const schedRef = ref(db, `users/${currentUser.uid}/schedule`);
    const unsub = onValue(schedRef, (snap) => {
      const data = snap.val() || {};
      const subs = (Object.entries(data) as [string, SubjectData][]).map(
        ([id, value]) => ({
          id,
          subject: value.subject,
          day: value.day,
          time: value.time,
        })
      );
      setSubjects(subs);
    });
    return () => unsub();
  }, [currentUser]);

  // 🟢 Load quizzes
  useEffect(() => {
    if (!currentUser) return;
    const quizzesRef = ref(db, `users/${currentUser.uid}/quizzes`);
    const unsub = onValue(quizzesRef, (snap) => {
      const data = snap.val() || {};
      const list: Quiz[] = [];

      const typedData = data as Record<string, FirebaseQuizzesData>;
      Object.entries(typedData).forEach(([subjectId, quizzes]) => {
        Object.entries(quizzes).forEach(([id, value]) => {
          list.push({
            id,
            subjectId,
            subject: value.subject,
            lesson: value.lesson,
            day: value.day,
          });
        });
      });
      setQuizzes(list);
    });
    return () => unsub();
  }, [currentUser]);

  // ➕ Add quiz
  const handleAddQuiz = async () => {
    if (!selectedSubject || !lesson.trim() || !selectedDay) return;
    const subj = subjects.find((s) => s.id === selectedSubject);
    if (!subj) return;

    const quizRef = push(
      ref(db, `users/${currentUser.uid}/quizzes/${subj.id}`)
    );
    await set(quizRef, {
      subject: subj.subject,
      lesson,
      day: selectedDay,
      createdAt: new Date().toISOString(),
    });

    setLesson("");
    setSelectedSubject("");
    setSelectedDay("");
  };

  // ❌ Delete quiz
  const handleDeleteQuiz = async (subjectId: string, quizId: string) => {
    if (!currentUser) return;
    await remove(
      ref(db, `users/${currentUser.uid}/quizzes/${subjectId}/${quizId}`)
    );
  };

  // 🕓 Auto delete quizzes if time passed
  useEffect(() => {
    if (!currentUser || subjects.length === 0 || quizzes.length === 0) return;

    const now = new Date();
    const days = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];
    const currentDay = days[now.getDay()];

    quizzes.forEach((quiz) => {
      const subj = subjects.find((s) => s.id === quiz.subjectId);
      if (!subj || !subj.time) return;

      // Only check if quiz day matches today's day
      if (quiz.day !== currentDay) return;

      const { end } = parseTimeRange(subj.time);
      const [endHour, endMinute] = end.split(":").map(Number);
      const endTime = new Date();
      endTime.setHours(endHour, endMinute, 0, 0);

      if (now > endTime) {
        remove(
          ref(
            db,
            `users/${currentUser.uid}/quizzes/${quiz.subjectId}/${quiz.id}`
          )
        );
      }
    });
  }, [quizzes, subjects, currentUser]);

  const dayOptions = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];

  return (
    <div>
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <Label className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Upcoming Quizzes
        </Label>
        <div className="flex gap-2">
          {/* Select Subject */}
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Select Day */}
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {dayOptions.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Lesson Input */}
          <Input
            placeholder="Lesson"
            value={lesson}
            onChange={(e) => setLesson(e.target.value)}
            className="w-[200px]"
          />
          <Button onClick={handleAddQuiz}>Add</Button>
        </div>
      </div>

      {/* Quiz List */}
      {quizzes.length === 0 ? (
        <div className="flex flex-col justify-center items-center min-h-[200px] py-8">
          <Image src={NoQuiz} alt="No upcoming quiz" width="200" />
          <p>No upcoming quiz...</p>
        </div>
      ) : (
        <Table>
          <TableCaption>List of your upcoming quizzes</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Lesson</TableHead>
              <TableHead>Day</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.map((quiz) => (
              <TableRow key={quiz.id}>
                <TableCell>{quiz.subject}</TableCell>
                <TableCell>{quiz.lesson}</TableCell>
                <TableCell>{quiz.day}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteQuiz(quiz.subjectId, quiz.id)}
                  >
                    <Trash />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
