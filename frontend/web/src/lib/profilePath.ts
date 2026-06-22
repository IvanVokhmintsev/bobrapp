export function getProfilePath(profileId: string, currentUserId: string) {
  return profileId === currentUserId ? "/profile" : `/profile/${profileId}`;
}
