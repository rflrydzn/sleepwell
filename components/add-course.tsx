"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
export function AddCourse() {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">
            Add course <Plus />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add class</DialogTitle>
            <DialogDescription>
              Enter the class name, select the meeting days, and choose the
              start and end times to add this class to your schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input id="name-1" name="name" placeholder="Biology" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">Days and Time</Label>
              <Days />
              <div className="flex gap-3">
                <div>
                  <Label>Starts</Label>
                  <Input
                    id="username-1"
                    name="username"
                    type="time"
                    placeholder="starts"
                  />
                </div>
                <div>
                  <Label>Ends</Label>
                  <Input type="time" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}

const Days = () => {
  const days = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];
  const [isCustomDays, setIsCustomDays] = useState(false);
  return (
    <div className="flex-col gap-1">
      {!isCustomDays ? (
        <ToggleGroup type="single" variant="outline">
          <ToggleGroupItem value="bold" aria-label="Toggle bold">
            MWF
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Toggle italic">
            TuTh
          </ToggleGroupItem>
          <ToggleGroupItem
            value="strikethrough"
            aria-label="Toggle strikethrough"
          >
            MW
          </ToggleGroupItem>
        </ToggleGroup>
      ) : (
        <ToggleGroup type="multiple" variant="outline">
          {days.map((day) => (
            <ToggleGroupItem value={day} aria-label="Toggle bold" key={day}>
              {day}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      <span
        className="underline xl:text-xs cursor-pointer"
        onClick={() => setIsCustomDays(!isCustomDays)}
      >
        {isCustomDays ? "Use default days" : "Use custom days"}
      </span>
    </div>
  );
};
