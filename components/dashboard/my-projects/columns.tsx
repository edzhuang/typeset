"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Project = {
  id: string;
  title: string;
  owner: string;
  lastOpened: Date;
};

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
  {
    accessorKey: "lastOpened",
    header: "Last Opened",
    cell: ({ row }) => {
      const date = new Date(row.getValue("lastOpened"));
      const formatted = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);

      return <div className="font-medium">{formatted}</div>;
    },
  },
];
