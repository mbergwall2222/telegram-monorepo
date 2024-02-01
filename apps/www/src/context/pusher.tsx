import Pusher from "pusher-js/types/src/core/pusher";
import { createContext } from "react";

export const PusherContext = createContext<{ pusher?: Pusher }>({});
