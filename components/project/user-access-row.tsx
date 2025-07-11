import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
  SelectGroup,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function UserAccessRow({
  imageUrl,
  name,
  email,
  access,
}: {
  imageUrl: string | null;
  name: string | null;
  email: string;
  access: "owner" | "can edit";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <Avatar>
            <AvatarImage src={imageUrl} />
            <AvatarFallback>{email[0]}</AvatarFallback>
          </Avatar>
        ) : (
          <AvatarFallback>{email[0]}</AvatarFallback>
        )}
        <div className="flex flex-col gap-0.5">
          <p className="text-sm leading-none font-medium">{name || email}</p>
          <p className="text-muted-foreground text-xs">{email}</p>
        </div>
      </div>
      {access == "owner" ? (
        <div className="h-9 px-4 py-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border bg-background shadow-xs dark:bg-input/30 dark:border-input">
          Owner
        </div>
      ) : (
        <Select defaultValue={access}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="can edit">Can edit</SelectItem>
            </SelectGroup>

            <SelectSeparator />

            <SelectGroup>
              <SelectItem value="remove access">Remove access</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
