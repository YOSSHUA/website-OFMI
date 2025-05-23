import { prisma } from "@/lib/prisma";
import {
  ParticipationOutput,
  ParticipationRequestInput,
  ParticipationRequestInputSchema,
  ParticipationOutputSchema,
  UserParticipation,
} from "@/types/participation.schema";
import { Pronoun, PronounsOfString } from "@/types/pronouns";
import { ShirtStyle, ShirtStyleOfString } from "@/types/shirt";
import { filterNull } from "@/utils";
import { Ofmi, ContestantParticipation } from "@prisma/client";
import { Value } from "@sinclair/typebox/value";
import { TTLCache } from "./cache";
import path from "path";

const caches = {
  findMostRecentOfmi: new TTLCache<Ofmi>(),
};

export function friendlyOfmiName(ofmiEdition: number): string {
  return `${ofmiEdition}a-ofmi`;
}

export function registrationSpreadsheetsPath(ofmiEdition: number): string {
  return path.join(
    friendlyOfmiName(ofmiEdition),
    `Registro ${friendlyOfmiName(ofmiEdition)} (Respuestas)`,
  );
}

export async function findMostRecentOfmi(): Promise<Ofmi> {
  // Check if the cache has the result
  const ttlCache = caches["findMostRecentOfmi"];
  const cacheKey = "findMostRecentOfmi";
  const cacheValue = ttlCache.get(cacheKey);
  if (cacheValue) {
    return cacheValue;
  }

  const ofmi = await prisma.ofmi.findFirst({
    orderBy: { edition: "desc" },
  });
  if (!ofmi) {
    throw Error("Most recent OFMI not found.");
  }

  ttlCache.set(cacheKey, ofmi);
  return ofmi;
}

export async function findContestantParticipation(
  contestantParticipationId: string | null,
): Promise<ContestantParticipation | null> {
  if (contestantParticipationId == null) {
    return null;
  }

  const contestantParticipation =
    await prisma.contestantParticipation.findUnique({
      where: { id: contestantParticipationId },
      include: {},
    });

  return contestantParticipation;
}

export async function findParticipants(
  ofmi: Ofmi,
): Promise<Array<ParticipationRequestInput>> {
  const participants = await prisma.participation.findMany({
    where: { ofmiId: ofmi.id },
    include: {
      user: {
        include: {
          MailingAddress: true,
          UserAuth: {
            select: { email: true },
          },
        },
      },
      ContestantParticipation: {
        include: {
          School: true,
        },
      },
      VolunteerParticipation: true,
    },
  });

  const res = participants.map((participation) => {
    // TODO: Share code with findParticipation
    const {
      user,
      role,
      ContestantParticipation: contestantParticipation,
      VolunteerParticipation: volunteerParticipation,
    } = participation;
    const { MailingAddress: mailingAddress } = user;

    const userParticipation: UserParticipation | null =
      (role === "CONTESTANT" &&
        contestantParticipation && {
          role,
          schoolName: contestantParticipation.School.name,
          schoolStage: contestantParticipation.School.stage,
          schoolGrade: contestantParticipation.schoolGrade,
          schoolCountry: contestantParticipation.School.country,
          schoolState: contestantParticipation.School.state,
        }) ||
      (role === "VOLUNTEER" &&
        volunteerParticipation && {
          role,
          ...volunteerParticipation,
        }) ||
      null;

    if (!userParticipation) {
      return null;
    }

    const payload: ParticipationRequestInput = {
      ofmiEdition: ofmi.edition,
      user: {
        ...user,
        email: user.UserAuth.email,
        birthDate: user.birthDate.toISOString(),
        pronouns: PronounsOfString(user.pronouns) as Pronoun,
        shirtStyle: ShirtStyleOfString(user.shirtStyle) as ShirtStyle,
        mailingAddress: {
          ...mailingAddress,
          recipient: mailingAddress.name,
          internalNumber: mailingAddress.internalNumber ?? undefined,
          municipality: mailingAddress.county,
          locality: mailingAddress.neighborhood,
          references: mailingAddress.references ?? undefined,
        },
      },
      registeredAt: participation.createdAt.toISOString(),
      userParticipation: userParticipation as UserParticipation,
    };

    return Value.Cast(ParticipationRequestInputSchema, payload);
  });

  return filterNull(res);
}

export async function findParticipation(
  ofmi: Ofmi,
  email: string,
): Promise<ParticipationOutput | null> {
  const participation = await prisma.participation.findFirst({
    where: { ofmiId: ofmi.id, user: { UserAuth: { email: email } } },
    include: {
      user: {
        include: {
          MailingAddress: true,
          UserAuth: {
            select: { email: true },
          },
        },
      },
      ContestantParticipation: {
        include: {
          School: true,
        },
      },
      VolunteerParticipation: true,
    },
  });

  if (!participation) {
    return null;
  }

  const {
    user,
    role,
    ContestantParticipation: contestantParticipation,
    VolunteerParticipation: volunteerParticipation,
  } = participation;
  const { MailingAddress: mailingAddress } = user;

  const userParticipation: UserParticipation | null =
    (role === "CONTESTANT" &&
      contestantParticipation && {
        role,
        schoolName: contestantParticipation.School.name,
        schoolStage: contestantParticipation.School.stage,
        schoolGrade: contestantParticipation.schoolGrade,
        schoolCountry: contestantParticipation.School.country,
        schoolState: contestantParticipation.School.state,
      }) ||
    (role === "VOLUNTEER" &&
      volunteerParticipation && {
        role,
        ...volunteerParticipation,
      }) ||
    null;

  if (!userParticipation) {
    return null;
  }

  const payload: ParticipationOutput = {
    input: {
      ofmiEdition: ofmi.edition,
      user: {
        ...user,
        email: user.UserAuth.email,
        birthDate: user.birthDate.toISOString(),
        pronouns: PronounsOfString(user.pronouns) as Pronoun,
        shirtStyle: ShirtStyleOfString(user.shirtStyle) as ShirtStyle,
        mailingAddress: {
          ...mailingAddress,
          recipient: mailingAddress.name,
          internalNumber: mailingAddress.internalNumber ?? undefined,
          municipality: mailingAddress.county,
          locality: mailingAddress.neighborhood,
          references: mailingAddress.references ?? undefined,
        },
      },
      registeredAt: participation.createdAt.toISOString(),
      userParticipation: userParticipation as UserParticipation,
    },
    contestantParticipantId: participation.contestantParticipationId,
  };

  return Value.Cast(ParticipationOutputSchema, payload);
}
