import Avatar from "boring-avatars";

interface OrganizationAvatarProps {
  logoUrl?: string;
  stellarAddress: string;
  size?: number;
  className?: string;
  altText?: string;
}

export function OrganizationAvatar({
  logoUrl,
  stellarAddress,
  size = 40,
  className = "",
  altText = "Organization logo",
}: OrganizationAvatarProps) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={altText}
        className={`object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Avatar
        size={size}
        name={stellarAddress}
        variant="beam"
        colors={["#00f5ff", "#8a00ff", "#ffffff", "#22d3ee", "#1e1e24"]}
      />
    </div>
  );
}
