import { useOthers } from "@liveblocks/react/suspense";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

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
            <AvatarImage
              src={info.imageUrl as string}
              alt={info.name as string}
            />
          </Avatar>
        );
      })}
    </div>
  );
}
