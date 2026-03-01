"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteAuthorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authorName: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteAuthorDialog({
  open,
  onOpenChange,
  authorName,
  onConfirm,
  isDeleting,
}: DeleteAuthorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Voice Profile</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{authorName}</strong>? This
            will permanently remove all DNA data for this author. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
