import React, { use } from "react";
import { UserAccessRow } from "@/components/project/user-access-row";
import { UserAccessInfo } from "@/types/user-access";

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
