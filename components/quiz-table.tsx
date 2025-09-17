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

type Quiz = { id: string; subject: string; lesson: string; subjectId: string };
type SubjectData = {
  subject: string;
};

type QuizData = {
  subject: string;
  lesson: string;
};
type QuizzesBySubject = Record<string, Record<string, QuizData>>;
// Add this type definition
type FirebaseQuizData = {
  subject: string;
  lesson: string;
  createdAt: string;
};

type FirebaseQuizzesData = Record<string, FirebaseQuizData>;

export function QuizTable() {
  const { currentUser } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; subject: string }[]>(
    []
  );
  const [selectedSubject, setSelectedSubject] = useState("");
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

      // Type assert the entire data object
      const typedData = data as Record<string, FirebaseQuizzesData>;

      Object.entries(typedData).forEach(([subjectId, quizzes]) => {
        Object.entries(quizzes).forEach(([id, value]) => {
          list.push({
            id,
            subjectId,
            subject: value.subject,
            lesson: value.lesson,
          });
        });
      });
      setQuizzes(list);
    });
    return () => unsub();
  }, [currentUser]);

  // ➕ Add quiz
  const handleAddQuiz = async () => {
    if (!selectedSubject || !lesson.trim()) return;
    const subj = subjects.find((s) => s.id === selectedSubject);
    if (!subj) return;

    const quizRef = push(
      ref(db, `users/${currentUser.uid}/quizzes/${subj.id}`)
    );
    await set(quizRef, {
      subject: subj.subject,
      lesson,
      createdAt: new Date().toISOString(),
    });

    setLesson("");
    setSelectedSubject("");
  };

  // ❌ Delete quiz
  const handleDeleteQuiz = async (subjectId: string, quizId: string) => {
    if (!currentUser) return;
    await remove(
      ref(db, `users/${currentUser.uid}/quizzes/${subjectId}/${quizId}`)
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Label className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Upcoming Quizzes
        </Label>
        <div className="flex gap-2">
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
          <Input
            placeholder="Lesson"
            value={lesson}
            onChange={(e) => setLesson(e.target.value)}
            className="w-[200px]"
          />
          <Button onClick={handleAddQuiz}>Add</Button>
        </div>
      </div>

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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.map((quiz) => (
              <TableRow key={quiz.id}>
                <TableCell>{quiz.subject}</TableCell>
                <TableCell>{quiz.lesson}</TableCell>
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
