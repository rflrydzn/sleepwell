import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const courses = [
  {
    name: "CPEPRACDSN2 - CPE PRACTICE AND DESIGN 2",
    time: "6:00 pm - 9:00 pm",
    day: "F",
  },
  {
    name: "	4ARTAPP - ART APPRECIATION",
    time: "6:00 pm - 9:00 pm",
    day: "F",
  },
  {
    name: "9STS - SCIENCE, TECHNOLOGY AND SOCIETY",
    time: "6:00 pm - 9:00 pm",
    day: "F",
  },
  {
    name: "	CPEONJOBT - CPE ON-THE-JOB TRAINING (320 HOURS)",
    time: "6:00 pm - 9:00 pm",
    day: "F",
  },
];

export function CourseTable() {
  return (
    <Table>
      <TableCaption>Your class schedule.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="">Subject</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Day</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.name}>
            <TableCell className="font-medium">{course.name}</TableCell>
            <TableCell>{course.time}</TableCell>
            <TableCell>{course.day}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Number of course: </TableCell>
          <TableCell>{courses.length}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
