import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserAccessRow } from "@/components/project/user-access-row";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type UserAccessRowProps } from "@/components/project/user-access-row";
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

const formSchema = z.object({
  email: z.string().email(),
});

export function InviteDialog({
  usersInfo,
  children,
}: {
  usersInfo: UserAccessRowProps[];
  children: React.ReactNode;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <FormField
                control={form.control}
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
              {usersInfo.map((userInfo) => (
                <UserAccessRow key={userInfo.email} {...userInfo} />
              ))}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
