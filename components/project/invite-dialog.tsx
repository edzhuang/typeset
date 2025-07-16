import React, { use } from "react";
import { UserAccessInfo } from "@/types/user-access";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { inviteToProject } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { UserAccessRow } from "@/components/project/user-access-row";
import { UserAccessListSkeleton } from "@/components/project/skeletons";

const formSchema = z.object({
  email: z.string().email(),
});

export function InviteDialog({
  projectId,
  userAccessInfo,
  children,
}: {
  projectId: string;
  userAccessInfo: Promise<UserAccessInfo[]>;
  children: React.ReactNode;
}) {
  const inviteForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmitInvite(values: z.infer<typeof formSchema>) {
    const email = values.email;
    inviteToProject(projectId, email);
    inviteForm.reset();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite people</DialogTitle>
          <DialogDescription>
            Invite your team members to collaborate.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <Form {...inviteForm}>
            <form onSubmit={inviteForm.handleSubmit(onSubmitInvite)}>
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grow">
                    <div className="flex w-full items-center gap-2">
                      <FormControl>
                        <Input placeholder="Email address" {...field} />
                      </FormControl>

                      <Button type="submit">Invite</Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <ClientSideSuspense fallback={<UserAccessListSkeleton />}>
            <UserAccessList
              projectId={projectId}
              userAccessInfo={userAccessInfo}
            />
          </ClientSideSuspense>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UserAccessList({
  projectId,
  userAccessInfo,
}: {
  projectId: string;
  userAccessInfo: Promise<UserAccessInfo[]>;
}) {
  const allUserAccessInfo = use(userAccessInfo);

  return allUserAccessInfo.map((userAccessInfo) => (
    <UserAccessRow
      key={userAccessInfo.email}
      projectId={projectId}
      userAccessInfo={userAccessInfo}
    />
  ));
}
