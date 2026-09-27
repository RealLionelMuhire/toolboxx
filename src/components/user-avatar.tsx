import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AvatarUser = {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  image?: unknown;
};

// The session user's `image` is populated (auth depth), but may be an ID in other contexts
export const getUserAvatarUrl = (user: AvatarUser | null | undefined): string | null => {
  const image = user?.image;
  if (!image || typeof image !== "object") return null;
  return (image as { url?: string | null }).url || null;
};

const getInitials = (user: AvatarUser | null | undefined) => {
  const fromName = [user?.firstName, user?.lastName]
    .map((part) => part?.trim().charAt(0) ?? "")
    .join("");
  return (fromName || user?.username?.charAt(0) || "?").toUpperCase();
};

interface UserAvatarProps {
  user: AvatarUser | null | undefined;
  className?: string;
  fallbackClassName?: string;
}

export const UserAvatar = ({ user, className, fallbackClassName }: UserAvatarProps) => {
  const url = getUserAvatarUrl(user);

  return (
    <Avatar className={className}>
      {url && <AvatarImage src={url} alt="Profile picture" className="object-cover" />}
      <AvatarFallback className={cn("font-semibold", fallbackClassName)}>
        {getInitials(user)}
      </AvatarFallback>
    </Avatar>
  );
};
