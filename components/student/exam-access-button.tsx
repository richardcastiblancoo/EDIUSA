"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface ExamAccessButtonProps {
  courseId: string;
}

export const ExamAccessButton = ({ courseId }: ExamAccessButtonProps) => {
  return (
    <Link href={`/dashboard/student/exams?courseId=${courseId}`} passHref>
      <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
        <FileText className="mr-2 h-4 w-4" />
        Acceder a Exámenes
      </Button>
    </Link>
  );
};