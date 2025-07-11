import { useOthers } from "@liveblocks/react/suspense";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

function getInitials(name: string) {
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function Avatars() {
  const users = useOthers();

  return (
    <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
      {users.map(({ connectionId, info }) => {
        if (!info) {
          return null;
        }

        return (
          <Avatar key={connectionId}>
            <AvatarImage src={info.imageUrl as string} />
            <AvatarFallback>
              {info.name ? getInitials(info.name) : null}
            </AvatarFallback>
          </Avatar>
        );
      })}
    </div>
  );
}
