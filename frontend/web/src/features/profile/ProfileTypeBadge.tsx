import type { ProfileType } from "../../lib/profileType";
import { getProfileTypeLabel } from "../../lib/profileType";
import "./profile-type-badge.css";

type ProfileTypeBadgeProps = {
  profileType: ProfileType;
};

export function ProfileTypeBadge(props: ProfileTypeBadgeProps) {
  return (
    <span className={`profile-type-badge profile-type-badge--${props.profileType}`}>
      {getProfileTypeLabel(props.profileType)}
    </span>
  );
}
