"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { leaveProject } from "@/app/actions";
import Link from "next/link";

export type Project = {
  id: string;
  title: string;
  lastOpened: Date | null;
};

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const project = row.original;

      return <Link href={`/project/${project.id}`}>{project.title}</Link>;
    },
  },
  {
    accessorKey: "lastOpened",
    header: "Last Opened",
    cell: ({ row }) => {
      const project = row.original;

      if (!project.lastOpened) {
        return <div>Never</div>;
      }

      const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(project.lastOpened);

      return <div>{formattedDate}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const project = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={async () => await leaveProject(project.id)}
            >
              Leave
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
