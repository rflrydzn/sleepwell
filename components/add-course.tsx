"use client";

import { Plus } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { ref, push, set } from "firebase/database";

export function AddCourse() {
  const { currentUser } = useAuth();
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [days, setDays] = useState("MWF");
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [useCustom, setUseCustom] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleCustomDayToggle = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("You must be logged in");
      return;
    }

    // Utility to convert time input into strict 24-hour format (HH:MM)
    const to24Hour = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      // Pad hours and minutes to 2 digits each
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    };

    try {
      const scheduleRef = ref(db, `users/${currentUser.uid}/schedule`);
      const newClassRef = push(scheduleRef);

      await set(newClassRef, {
        subject: name,
        day: useCustom ? customDays.join("") : days,
        time: `${to24Hour(start)}–${to24Hour(end)}`, // Store as HH:MM–HH:MM
        createdAt: new Date().toISOString(),
      });

      // Reset form and close dialog
      setName("");
      setStart("");
      setEnd("");
      setDays("MWF");
      setCustomDays([]);
      setUseCustom(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding course:", error);
      alert("Failed to add course. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          Add course <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add class</DialogTitle>
            <DialogDescription>
              Enter the class details to add it to your schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Biology"
                required
              />
            </div>

            <div className="grid gap-3">
              <Label>Days</Label>
              {!useCustom ? (
                <>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    onValueChange={(val) => setDays(val || "MWF")}
                    value={days}
                  >
                    <ToggleGroupItem value="MWF">MWF</ToggleGroupItem>
                    <ToggleGroupItem value="TuTh">TuTh</ToggleGroupItem>
                    <ToggleGroupItem value="MW">MW</ToggleGroupItem>
                  </ToggleGroup>
                  <button
                    type="button"
                    onClick={() => setUseCustom(true)}
                    className="text-sm text-blue-600 underline text-left w-fit"
                  >
                    Use custom days
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {["M", "Tu", "W", "Th", "F", "Sa", "Su"].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleCustomDayToggle(day)}
                        className={`px-3 py-2 text-sm rounded border ${
                          customDays.includes(day)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-accent"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustom(false);
                      setCustomDays([]);
                    }}
                    className="text-sm text-blue-600 underline text-left w-fit"
                  >
                    Use default days
                  </button>
                </>
              )}

              <div className="flex gap-3 mt-3">
                <div>
                  <Label>Starts</Label>
                  <Input
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Ends</Label>
                  <Input
                    type="time"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
