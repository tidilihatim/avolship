// This page is only to redirect the user by checking his type to its respective dashboard
import React from "react";
import { getLoginUserRole } from "../actions/auth";
import { redirect } from "next/navigation";

type Props = {};

const page = async (props: Props) => {
  const role = await getLoginUserRole();
  if(role) redirect(`/dashboard/${role}`)

  throw new Error("Something Went Wrong");

  return <div>page</div>;
};

export default page;
