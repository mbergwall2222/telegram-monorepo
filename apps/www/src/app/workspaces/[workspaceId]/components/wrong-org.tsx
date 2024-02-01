"use client";

import { useOrganizationList } from "@clerk/nextjs";

export const WrongOrg = ({ orgId }: { orgId: string }) => {
  const orgs = useOrganizationList({ userMemberships: { infinite: true } });

  if (!orgs.isLoaded) return <div>Loading...</div>;

  const org = orgs.userMemberships.data.find(
    (o) => o.organization.id === orgId
  );

  if (!org) return <div>You do not have access to this resource.</div>;

  orgs.setActive({ organization: org.organization.id }).then(() => {
    window.location.reload();
  });

  return <div>Redirecting...</div>;
};
