type int = number;

export type MessageEntity =
  | MessageEntityBold
  | MessageEntityItalic
  | MessageEntityTextUrl
  | MessageEntityUrl
  | MessageEntityMention;

type MessageEntityBold = {
  CONSTRUCTOR_ID: 3177253833;
  SUBCLASS_OF_ID: 3479443932;
  classType: "constructor";
  className: "MessageEntityBold";
  offset: int;
  length: int;
};

type MessageEntityItalic = {
  CONSTRUCTOR_ID: 2188348256;
  SUBCLASS_OF_ID: 3479443932;
  classType: "constructor";
  className: "MessageEntityItalic";
  offset: int;
  length: int;
};

type MessageEntityTextUrl = {
  CONSTRUCTOR_ID: 1990644519;
  SUBCLASS_OF_ID: 3479443932;
  classType: "constructor";
  className: "MessageEntityTextUrl";
  offset: int;
  length: int;
  url: string;
};

type MessageEntityUrl = {
  CONSTRUCTOR_ID: 1859134776;
  SUBCLASS_OF_ID: 3479443932;
  classType: "constructor";
  className: "MessageEntityUrl";
  offset: int;
  length: int;
};

type MessageEntityMention = {
  CONSTRUCTOR_ID: 4194588573;
  SUBCLASS_OF_ID: 3479443932;
  classType: "constructor";
  className: "MessageEntityMention";
  offset: int;
  length: int;
};
