import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { currentProfile } from "@/lib/current-profile";
import { getOrCreateConversation } from "@/lib/conversation";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";

interface MemberIdPageProps {
  params: { serverId: string; memberId: string };
}

const MemberIdPage = async ({ params }: MemberIdPageProps) => {
  const profile = await currentProfile();
  if (!profile) {
    return redirectToSignIn();
  }

  const currentMember = await db.member.findFirst({
    where: {
      serverId: params.serverId,
      profileId: profile.id,
    },
    include: {
      profile: true,
    },
  });

  if (!currentMember) return redirect("/");

  const getConversation = await getOrCreateConversation(
    currentMember.id,
    params.memberId
  );

  if (!getConversation) return redirect(`/server/${params.serverId}`);

  const { memberOne, memberTwo } = getConversation;

  const otherMember = memberOne.id === currentMember.id ? memberTwo : memberOne;

  return (
    <div className="bg-zinc-50 flex flex-col h-full">
      <ChatHeader
        imageUrl={otherMember.profile.imgURL}
        name={otherMember.profile.name}
        serverId={params.serverId}
        type="conversation"
      />
      <ChatMessages
        member={currentMember}
        name={otherMember.profile.name}
        chatId={getConversation.id}
        type="conversation"
        paramKey="conversationId"
        paramValue={getConversation.id}
        socketUrl="/api/socket/direct-messages"
        socketQuery={{
          conversationId: getConversation.id,
        }}
      />
      <ChatInput
        name={otherMember.profile.name}
        type="conversation"
        apiUrl="/api/socket/direct-messages"
        query={{
          conversationId: getConversation.id,
        }}
      />
    </div>
  );
};

export default MemberIdPage;
