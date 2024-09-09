import { getServerSession } from "next-auth/next";
import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
} from "next/types";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import Registro from "@/components/registro";
import { findMostRecentOfmi, findParticipation } from "@/lib/ofmi";
import { Alert } from "@/components/alert";
import { Value } from "@sinclair/typebox/value";
import {
  ParticipationRequestInput,
  ParticipationRequestInputSchema,
  ParticipationRoleOfString,
} from "@/types/participation.schema";
import { ParticipationRole } from "@prisma/client";

export default function RegistroPage({
  ofmiEdition,
  participationJSON,
  registrationClosingTime,
  role,
}: InferGetServerSidePropsType<typeof getServerSideProps>): JSX.Element {
  if (
    ofmiEdition == null ||
    (registrationClosingTime && registrationClosingTime < Date.now())
  ) {
    const errorMsg = ofmiEdition ? "El registro de la OFMI ha finalizado." : "";
    return (
      <div className="flex w-full items-center justify-center">
        <Alert
          className="block w-1/2 items-center justify-center"
          errorMsg={errorMsg}
        >
          <p>
            Si tienes alguna duda por favor envía un correo a &nbsp;
            <a href="mailto:ofmi@omegaup.com">ofmi@omegaup.com</a>
          </p>
        </Alert>
      </div>
    );
  }

  const participation: ParticipationRequestInput | null = participationJSON
    ? JSON.parse(participationJSON)
    : null;

  if (participation !== null) {
    if (!Value.Check(ParticipationRequestInputSchema, participation)) {
      console.log(
        "Error. Participation was filled but does not have correct schema",
        participation,
      );
    }
  }

  return (
    <Registro
      ofmiEdition={ofmiEdition}
      role={role}
      participation={participation}
    />
  );
}

export const getServerSideProps: GetServerSideProps<{
  ofmiEdition: number | null;
  registrationClosingTime: number | null;
  participationJSON: string | null;
  role: ParticipationRole;
}> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!session?.user?.email) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const ofmi = await findMostRecentOfmi();
  const participation =
    ofmi && email ? await findParticipation(ofmi, email) : null;

  const roleRequested =
    typeof query.role === "string"
      ? ParticipationRoleOfString(query.role)
      : undefined;
  const role =
    roleRequested || participation?.userParticipation.role || "CONTESTANT";

  return {
    props: {
      session,
      participationJSON: JSON.stringify(participation),
      ofmiEdition: ofmi?.edition ?? null,
      registrationClosingTime: ofmi?.registrationCloseTime.getTime() ?? null,
      role,
    },
  };
};