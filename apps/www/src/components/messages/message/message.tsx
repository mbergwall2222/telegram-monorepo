import { formatRelative } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../ui/card";
import { Suspense, cloneElement, useEffect, useState } from "react";
import { MessageEntity } from "@/lib/types/telegram";
import ReactPlayer from "react-player";
import { Button } from "../../ui/button";
import {
  ArrowDown,
  ArrowUp,
  DownloadIcon,
  FileText,
  ImageIcon,
  Sticker,
  Video,
} from "lucide-react";
import { ungzip } from "pako"; // Ensure pako is installed
import ReactLottie from "react-lottie";
import { Lottie } from "./lottie";
import { PDF } from "./pdf";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useHash from "@/lib/hooks/useHash";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { IMessage } from "@/lib/types/messages";
import { DocViewer } from "./doc_viewer";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Tags } from "../../chats/tags/tags";
import {
  createAndLinkChatTag,
  createAndLinkMessageTag,
  createAndLinkUserTag,
  getAllTags,
  getLinkedChatTags,
  getLinkedMessageTags,
  getLinkedUserTags,
  linkChatTag,
  linkMessageTag,
  linkUserTag,
  unlinkChatTag,
  unlinkMessageTag,
  unlinkUserTag,
} from "@/lib/client/api";

const combineNames = (...names: any[]) => {
  return names.filter(Boolean).join(" ");
};

export const getIcon = (mimeType: string) => {
  const className = "mr-2 h-4 w-4";
  if (mimeType.includes("video")) return <Video className={className} />;
  else if (mimeType.includes("image"))
    return <ImageIcon className={className} />;
  else if (mimeType.includes("tgsticker"))
    return <Sticker className={className} />;
  else return <FileText className={className} />;
};

export const getMedia = (mimeType: string, fileUrl: string) => {
  if (mimeType.includes("tgsticker")) return <Lottie fileUrl={fileUrl} />;
  return (
    <DocViewer
      documents={[{ uri: fileUrl, fileType: mimeType }]}
      initialActiveDocument={{ uri: fileUrl, fileType: mimeType }}
    />
  );
};

export type IMessageProps = {
  message: IMessage;
  isReply: boolean;
  reply?: React.ReactNode;
  isTop: boolean;
  showChat?: boolean;
};

export const Message = ({
  message,
  isReply = false,
  reply,
  isTop = false,
  showChat = false,
}: IMessageProps) => {
  const [showMedia, setShowMedia] = useState(false);
  const [showReply, setShowReply] = useState(isReply);

  useEffect(() => {
    if (message?.document?.mimeType.includes("tgsticker")) setShowMedia(true);
  }, [message?.document?.mimeType]);

  const name = message.user?.id
    ? combineNames(
        message.user?.firstName,
        message.user?.lastName,
        message.user?.username ? `(@${message.user?.username})` : null
      )
    : message?.chat?.id
      ? message?.chat?.title
      : null;
  const userId = message?.user?.id ?? message?.chat?.id;
  const isUser = userId == message?.user?.id;

  const lastChild = !reply ? true : reply && !showReply ? true : false;

  return (
    <motion.div key={message.id} layout="position">
      {isReply && <Separator />}
      <div
        key={message.id}
        className={cn(
          "w-full border-black dark:border-white border mx-auto rounded-lg shadow",
          lastChild! ? "mb-8" : "",
          reply && showReply && !isReply && "border  border-b-0 rounded-b-none",
          reply &&
            showReply &&
            isReply &&
            "border-x border-y-0 rounded-b-none rounded-t-none",
          !reply && isReply && "border border-t-0 rounded-t-none"
        )}
        id={message.messageId}
      >
        <div className="flex items-center space-x-4 p-5 border-b border-gray-200">
          {showChat && (
            <div className={cn("flex items-center gap-4", !isUser && "flex-1")}>
              <Avatar className="border w-10 h-10">
                {message.chat?.pfpUrl && (
                  <AvatarImage alt="Image" src={message.chat?.pfpUrl} />
                )}
                <AvatarFallback>
                  {message.chat?.title
                    ?.match(/\b(\w)/g)
                    ?.slice(0, 3)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/chats/${message.chat?.id}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {message?.chat?.title}
                  </Link>
                  {!isUser && (
                    <span className="text-sm text-gray-500">
                      {" "}
                      {message.date &&
                        formatRelative(
                          typeof message.date == "string"
                            ? new Date(message.date)
                            : message.date,
                          new Date()
                        )}
                    </span>
                  )}
                </div>

                <div className="flex space-x-2 mt-1">
                  <Suspense fallback={<div>Loading...</div>}>
                    {message?.chat?.id && (
                      <Tags
                        entityName="chats"
                        entityId={message?.chat?.id}
                        getLinkedTags={getLinkedChatTags}
                        getAllTags={getAllTags}
                        linkTag={linkChatTag}
                        unlinkTag={unlinkChatTag}
                        createAndLinkTag={createAndLinkChatTag}
                      />
                    )}
                  </Suspense>
                </div>
              </div>
              {isUser && (
                <Separator className="mx-4 h-12" orientation="vertical" />
              )}
            </div>
          )}
          {isUser && (
            <div className="flex items-center space-x-4 flex-1 ">
              <Avatar className="border w-10 h-10">
                <AvatarImage alt="User PFP" src={message?.user?.pfpUrl} />
                <AvatarFallback>PFP</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/chats/${message.chat?.id}/users/${userId}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {name}
                  </Link>
                  <span className="text-sm text-gray-500">
                    {" "}
                    {message.date &&
                      formatRelative(
                        typeof message.date == "string"
                          ? new Date(message.date)
                          : message.date,
                        new Date()
                      )}
                  </span>
                </div>
                <div className="flex space-x-2 mt-1">
                  <Suspense fallback={<div>Loading...</div>}>
                    {userId && (
                      <Tags
                        entityName={"users"}
                        entityId={userId}
                        getLinkedTags={getLinkedUserTags}
                        getAllTags={getAllTags}
                        linkTag={linkUserTag}
                        unlinkTag={unlinkUserTag}
                        createAndLinkTag={createAndLinkUserTag}
                      />
                    )}
                  </Suspense>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 text-base whitespace-pre-wrap">
          <MessageText message={message} />
          <div className="flex space-x-2 mt-8">
            <Suspense fallback={<div>Loading...</div>}>
              <Tags
                entityName="messages"
                entityId={message.id}
                getLinkedTags={getLinkedMessageTags}
                getAllTags={getAllTags}
                linkTag={linkMessageTag}
                unlinkTag={unlinkMessageTag}
                createAndLinkTag={createAndLinkMessageTag}
              />
            </Suspense>
          </div>
        </div>
        {message.document && (
          <>
            <div className="flex items-center justify-between p-5 border-t border-gray-200">
              <Button variant="ghost" onClick={() => setShowMedia(!showMedia)}>
                {getIcon(message.document.mimeType)}
                {showMedia ? "Hide" : "Show"} Media
              </Button>
              {/* <Link href={message.document.fileUrl} download target="_blank">
                <Button
                  className="flex items-center space-x-2"
                  variant="outline"
                >
                  <DownloadIcon className="w-5 h-5" />
                  <span>Download Media</span>
                </Button>
              </Link> */}
            </div>
            {showMedia && (
              <div className="flex justify-center py-4">
                {getMedia(message.document.mimeType, message.document.fileUrl)}
              </div>
            )}
          </>
        )}
        <div className="text-xs text-gray-500 p-5 pt-0 flex gap-2 flex-wrap">
          ID: <pre>{message.id}</pre>
          User ID: <pre>{message.user?.id ?? `${message.chat?.id}`}</pre>
          Timestamp:{" "}
          <pre>
            {message.date instanceof Date
              ? message.date.toISOString()
              : message.date}
          </pre>
        </div>
        <div>
          {reply &&
            !isReply &&
            (showReply ? (
              <Badge
                className="flex items-center text-sm justify-evenly cursor-pointer"
                onClick={() => setShowReply(false)}
              >
                <ArrowUp className="h-4 w-4" /> Hide Thread
                <ArrowUp className="h-4 w-4" />
              </Badge>
            ) : (
              <Badge
                className="flex items-center text-sm justify-evenly cursor-pointer"
                variant="outline"
                onClick={() => setShowReply(true)}
              >
                <ArrowDown className="h-4 w-4" /> Show Thread
                <ArrowDown className="h-4 w-4" />
              </Badge>
            ))}
        </div>
      </div>

      {/* <CardHeader className="flex flex-row justify-between pb-2">
          <CardTitle className="flex gap-2 items-center">
            <Avatar className="border w-10 h-10">
              <AvatarImage alt="User PFP" src={pfpUrl} />
              <AvatarFallback>PFP</AvatarFallback>
            </Avatar>
            <span className="text-xl">{name}</span>
            {message?.document && (
              <Button
                variant="outline"
                onClick={() => setShowMedia(!showMedia)}
              >
                {getIcon(message.document.mimeType)}
                {showMedia ? "Hide" : "Show"} Media
              </Button>
            )}
          </CardTitle>
          <CardDescription className="text-sm">
            {message.date && formatRelative(message.date, new Date())}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-base whitespace-pre-wrap">
          {message.document && showMedia && (
            <div className="flex justify-center py-4">
              {getMedia(message.document.mimeType, message.document.fileUrl)}
            </div>
          )}
          <MessageText message={message} />
        </CardContent>
        <CardFooter className="flex flex-col pb-2 gap-2">
          <div className="text-xs flex gap-2 ">
            ID: <pre>{message.id}</pre>
            User ID:{" "}
            <pre>{message.user?.id ?? `${message.chat?.id}`}</pre>
            Timestamp: <pre>{message.date}</pre>
          </div>
          {reply &&
            !isReply &&
            (showReply ? (
              <Badge
                className="flex items-center text-sm justify-evenly cursor-pointer"
                onClick={() => setShowReply(false)}
              >
                <ArrowUp className="h-4 w-4" /> Hide Thread
                <ArrowUp className="h-4 w-4" />
              </Badge>
            ) : (
              <Badge
                className="flex items-center text-sm justify-evenly cursor-pointer"
                variant="outline"
                onClick={() => setShowReply(true)}
              >
                <ArrowDown className="h-4 w-4" /> Show Thread
                <ArrowDown className="h-4 w-4" />
              </Badge>
            ))}
        </CardFooter>
            </div>*/}
      {!!reply && (
        <motion.div
          className="overflow-hidden"
          animate={{ height: showReply ? "auto" : "0px" }}
        >
          {reply}
        </motion.div>
      )}
    </motion.div>
  );
};

const BoldComponent = ({ text }: { text: string }) => (
  <span className="font-bold">{text}</span>
);

// Italic text component
const ItalicComponent = ({ text }: { text: string }) => (
  <span className="italic">{text}</span>
);

// URL text component
const UrlComponent = ({ text, href }: { text: string; href: string }) => (
  <a href={href} className="text-blue-500 underline">
    {text}
  </a>
);

const MessageText = ({ message }: { message: IMessage }) => {
  const createComponent = (entity: MessageEntity, text: string) => {
    switch (entity.className) {
      case "MessageEntityBold":
        return <BoldComponent text={text} />;
      case "MessageEntityItalic":
        return <ItalicComponent text={text} />;
      case "MessageEntityUrl":
        return <UrlComponent text={text} href={text} />;
      case "MessageEntityMention":
        return <span className="text-blue-400">{text}</span>;
      default:
        return <span>{text}</span>;
    }
  };

  // Function to parse the text into components

  return <div className="leading-5">{message.messageText}</div>;
};
