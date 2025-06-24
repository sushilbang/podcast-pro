// frontend/components/dashboard/WelcomeDialog.tsx

"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Zap, FileText } from "lucide-react";

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const instructions = [
  {
    icon: <FileText className="h-5 w-5 text-blue-500" />,
    text: "For best results, please use PDFs with selectable text (not scanned images).",
  },
  {
    icon: <Zap className="h-5 w-5 text-yellow-500" />,
    text: "We'll analyze the first ~5,000 characters to generate a speedy 2-3 minute podcast.",
  },
  {
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    text: "We're constantly improving based on your feedback. Thanks for being here!",
  },
];

export default function WelcomeDialog({ isOpen, onClose }: WelcomeDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl text-center">
            Welcome to Podcast Pro!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center pt-2">
            You&apos;re one of our first users, and we&apos;re thrilled to have you. Here are a few quick tips for the current version:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          {instructions.map((item, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="mt-1">{item.icon}</div>
              <p className="text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction className="w-full" onClick={onClose}>
            Got it, let&apos;s create!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}